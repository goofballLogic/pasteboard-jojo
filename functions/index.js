const functions = require("firebase-functions");
const functionsV2 = require("firebase-functions/v2");
const admin = require("firebase-admin");
const { handleViewerConfigurationRequest, handleBoardChange, fetchUserMetadata } = require("./pasteboard-integration");

const app = admin.initializeApp();
const firestore = app.firestore();

const integration = {
    displays: firestore.collection("displays"),
    boards: firestore.collection("boards"),
    users: firestore.collection("users"),
    logger: functions.logger
};

exports.viewerconfig = functionsV2.https.
    onRequest({ cors: true }, async (req, res) => {

        const url = new URL(req.url, "ftp://yomomma");
        const viewer = url.search.replace(/^\?/, "");
        const result = await handleViewerConfigurationRequest({
            viewer,
            state: req.body,
            ...integration
        });
        res.send(JSON.stringify(result));

    });

exports.handleBoardChange = functions.firestore
    .document("/boards/{accountId}/data/{boardId}")
    .onWrite(async (change, context) => {

        await handleBoardChange({
            boardId: context.params.boardId,
            accountId: context.params.accountId,
            change,
            ...integration
        });

    });

exports.fetchUserContext = functions.https
    .onCall(async (_, context) => {

        const uid = context.auth?.uid;
        if (!uid) { return null; }

        const metadata = await fetchUserMetadata({
            uid,
            ...integration
        });
        return { uid: context.auth?.uid, metadata };

    });

// exports.createBoard = functions.https.onCall(async (payloadData, context) => {

//     const uid = context.auth?.uid;
//     if (!uid) { throw new Error("Not authenticated"); }

//     const data = parseBoardModel(payloadData);
//     data.created = uid;

//     const fs = admin.firestore();
//     const boardDoc = fs.collection("boards").doc(data.id);
//     const boardMetadataDoc = fs.collection("board_metadata").doc(data.id);
//     if (await boardDoc.get().exists) {

//         throw new Error("Board already exists");

//     }
//     await updateEntitlements(uid, {
//         boards: {
//             [data.id]: {
//                 admin: true
//             }
//         }
//     });

//     functions.logger.info(`User ${uid} creating board ${data.id} ${data.name}`);

//     await boardDoc.set(data);
//     await boardMetadataDoc.set(data);
//     functions.logger.info(`User ${uid} created board ${data.id} ${data.name}`);

//     return await fetchUserMetadata({
//         uid,
//         ...integration
//     });

// });

exports.createDisplay = functions.https.onCall(async (payloadData, context) => {

    const uid = context.auth?.uid;
    if (!uid) { throw new Error("Not authenticated"); }
    const { name } = payloadData;
    if (!name) throw new Error("No name specified");
    const displayId = `${uid}_${Math.random().toString().substring(2)}Z${Date.now()}`;
    await configureDisplay(displayId, null, { name });

});

async function updateEntitlements(uid, entitlementUpdate) {

    const metadataDoc = integration.users.doc(uid);
    await metadataDoc.set({ entitlements: entitlementUpdate }, { merge: true });

}

function parseBoardModel(data) {
    return { id: data?.id, name: data?.name };
}


