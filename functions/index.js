const functions = require("firebase-functions");
const functionsV2 = require("firebase-functions/v2");
const admin = require("firebase-admin");
const { handleViewerConfigurationRequest, handleBoardChange, handleDisplayChange, handleDisplayCreate, refreshDisplaysEntitlement } = require("./pasteboard-integration");

const app = admin.initializeApp();
const firestore = app.firestore();

const integration = {
    displays: firestore.collection("displays"),
    boards: firestore.collection("boards"),
    users: firestore.collection("users"),
    entitlements: firestore.collection("entitlements"),
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
        if (result)
            res.send(JSON.stringify(result));
        else
            res.status(404).send();

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

exports.handleDisplayCreate = functions.firestore
    .document("/displays/{accountId}/data/{displayId}")
    .onCreate(async (_, context) => {

        await refreshDisplaysEntitlement({
            accountId: context.params.accountId,
            ...integration
        });

    });

exports.handleDisplayDelete = functions.firestore
    .document("/displays/{accountId}/data/{displayId}")
    .onDelete(async (change, context) => {

        await refreshDisplaysEntitlement({
            accountId: context.params.accountId,
            ...integration
        });

    });