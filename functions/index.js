const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { getStorage } = require("firebase-admin/storage");
const { getFirestore, FieldValue, FieldPath } = require("firebase-admin/firestore");

const app = admin.initializeApp();

exports.handleBoardChange = functions.firestore.document("/boards/{boardId}").onWrite(async (change, context) => {
    const beforeDisplays = Object.keys(change.before.data().displays || {});
    const afterDisplays = Object.keys(change.after.data().displays || {});
    const { boardId } = context.params;
    const payload = JSON.stringify(change.after.data());
    const bucket = getStorage(app).bucket();

    console.log("Board changed", boardId, change.before.data(), change.after.data());
    for (const displayId of afterDisplays) {

        console.log(`Setting ${displayId} to board ${boardId}`);
        await removeDisplayFromBoards(displayId, boardId);
        const dataFile = bucket.file(`config/${displayId.replace("_", "/")}`);
        await dataFile.save(payload);
        await dataFile.setMetadata({ metadata: { boardId } });

    }

});

exports.test = functions.https.onCall(async () => {

    const displayId = "bYnRbsVC6WQd2Avwfjd6cS9TM1L2_EX3xsA8KajOF3OV2AWwu";
    await removeDisplayFromBoards(displayId);

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
