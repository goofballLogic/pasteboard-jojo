const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { getStorage } = require("firebase-admin/storage");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const app = admin.initializeApp();
const storageBucket = getStorage(app).bucket();

exports.handleBoardChange = functions.firestore.document("/boards/{boardId}").onWrite(async (change, context) => {
    const afterDisplays = Object.keys(change.after.data().displays || {});
    const beforeDisplays = Object.keys(change.before.data().displays || {});
    const { boardId } = context.params;
    const payload = JSON.stringify(change.after.data());

    for (const displayId of afterDisplays) {

        console.log(`Board change: Setting ${displayId} to board ${boardId}`);
        await removeDisplayFromBoards(displayId, boardId);
        const metadata = { boardId };
        await configureDisplay(displayId, payload, metadata);

    }
    for (const displayId of beforeDisplays.filter(id => !afterDisplays.includes(id))) {

        console.log(`Board change: Removing ${displayId} from board ${boardId}`);
        await removeDisplayFromBoards(displayId, boardId);
        const metadata = {};
        await configureDisplay(displayId, null, metadata);

    }
});

exports.handleDisplayChange = functions.firestore.document("/displays/{displayId}").onWrite(async (change, context) => {

    const { displayId } = context.params;
    const after = change.after.data();
    const before = change.before.data();
    const isNone = !(after.board?.id);
    if (isNone && before.board?.id) {
        console.log("Display change: Removing display", displayId, "from board", before.board.id);
        await getFirestore(app).collection("boards").doc(before.board.id).set({
            displays: { [displayId]: FieldValue.delete() }
        }, { merge: true });
    } else if (!isNone) {
        console.log("Display change: Adding display", displayId, "to board", after.board.id);
        await getFirestore(app).collection("boards").doc(after.board.id).set({
            displays: { [displayId]: { show: true } }
        }, { merge: true });
    }
});

exports.fetchUserContext = functions.https.onCall(async (data, context) => {

    const uid = context.auth?.uid;
    if (!uid) { return null; }
    const metadata = await fetchUserMetadata(uid);

    return {
        uid: context.auth?.uid,
        metadata
    }

});

exports.createBoard = functions.https.onCall(async (payloadData, context) => {

    const uid = context.auth?.uid;
    if (!uid) { throw new Error("Not authenticated"); }

    const data = parseBoardModel(payloadData);
    data.created = uid;

    const fs = admin.firestore();
    const boardDoc = fs.collection("boards").doc(data.id);
    const boardMetadataDoc = fs.collection("board_metadata").doc(data.id);
    if (await boardDoc.get().exists) {

        throw new Error("Board already exists");

    }
    const metadataDoc = fs.collection("user-metadata").doc(uid);
    await metadataDoc.set({
        entitlements: {
            boards: {
                [data.id]: {
                    admin: true
                }
            }
        }
    }, { merge: true });

    functions.logger.info(`User ${uid} creating board ${data.id} ${data.name}`);

    await boardDoc.set(data);
    await boardMetadataDoc.set(data);
    functions.logger.info(`User ${uid} created board ${data.id} ${data.name}`);

    return await fetchUserMetadata(uid);
});

exports.createDisplay = functions.https.onCall(async (payloadData, context) => {

    const uid = context.auth?.uid;
    if (!uid) { throw new Error("Not authenticated"); }
    const { name } = payloadData;
    if (!name) throw new Error("No name specified");
    const displayId = `${uid}_${Math.random().toString().substring(2)}Z${Date.now()}`;
    await configureDisplay(displayId, null, { name });

});

async function configureDisplay(displayId, content, metadata) {
    const dataFile = storageBucket.file(`config/${displayId.replace("_", "/")}`);
    await dataFile.save(content);
    await dataFile.setMetadata({ metadata });
}

async function removeDisplayFromBoards(displayId, excludedBoardId) {
    let query = getFirestore(app)
        .collection("boards")
        .where(`displays.${displayId}`, "!=", null);
    const boards = await query.get();
    const docs = boards.docs.filter(d => d.id !== excludedBoardId);
    if (docs.length) {
        console.log("Removing display", displayId, "from", docs.length, "boards: ", docs.map(d => d.id).join(", "));
        await Promise.all(docs.map(board => board.ref.update({
            [`displays.${displayId}`]: FieldValue.delete()
        })));
    }
}

function parseBoardModel(data) {
    return { id: data?.id, name: data?.name };
}

async function fetchUserMetadata(uid) {
    if (!uid) return null;
    const fs = admin.firestore();
    const metadataRef = fs.collection("user-metadata").doc(uid);
    const metadata = (await metadataRef.get()).data() || {};
    let dirty = false;
    if (!metadata.groups) {
        metadata.groups = {};
        dirty = true;
    }
    if (!metadata.entitlements) {
        metadata.entitlements = {};
        dirty = true;
    }
    if (dirty) {
        await metadataRef.set(metadata, { merge: true });
    }
    return metadata;
}
