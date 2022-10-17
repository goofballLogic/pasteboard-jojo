const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

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
