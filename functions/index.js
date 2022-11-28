const functions = require("firebase-functions");
const functionsV2 = require("firebase-functions/v2");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { defineSecret } = require('firebase-functions/params');
const storageAdminSecret = defineSecret("STORAGE_ADMIN_CREDENTIALS");

const {
    handleViewerConfigurationRequest,
    handleBoardChange,
    refreshDisplaysEntitlement
} = require("./pasteboard-integration");

//const keyFile = require("./storage-admin.keyfile.json");
//const { applicationDefault } = require("firebase-admin/app");

let app;

function buildIntegration(withStorageCredentials = true) {

    if (!app) app = admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(storageAdminSecret.value())),
        storageBucket: "paste-1c305.appspot.com"
    });

    const firestore = app.firestore();
    const storage = app.storage();
    const integration = {
        displays: firestore.collection("displays"),
        boards: firestore.collection("boards"),
        users: firestore.collection("users"),
        entitlements: firestore.collection("entitlements"),
        screenshots: storage.bucket(),
        logger: functions.logger,
        deleteFieldValue: FieldValue.delete()
    };

    return integration;
}

exports.viewerconfig = functions
    .runWith({ secrets: [storageAdminSecret] })
    .https
    .onRequest(async (req, res) => {

        if (req.method === "OPTIONS") {

            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "*");
            res.header("Access-Control-Allow-Methods", "*");
            res.status(204).send();

        } else {

            const url = new URL(req.url, "ftp://yomomma");
            const viewer = url.search.replace(/^\?/, "");
            const result = await handleViewerConfigurationRequest({
                viewer,
                state: req.body,
                ...buildIntegration()
            });
            if (result)
                res.send(JSON.stringify(result));
            else
                res.status(404).send();
        }

    });

exports.handleBoardChange = functions.firestore
    .document("/boards/{accountId}/data/{boardId}")
    .onWrite(async (change, context) => {

        await handleBoardChange({
            boardId: context.params.boardId,
            accountId: context.params.accountId,
            change,
            ...buildIntegration(false)
        });

    });

exports.handleDisplayCreate = functions.firestore
    .document("/displays/{accountId}/data/{displayId}")
    .onCreate(async (_, context) => {

        await refreshDisplaysEntitlement({
            accountId: context.params.accountId,
            ...buildIntegration(false)
        });

    });

exports.handleDisplayDelete = functions.firestore
    .document("/displays/{accountId}/data/{displayId}")
    .onDelete(async (change, context) => {

        await refreshDisplaysEntitlement({
            accountId: context.params.accountId,
            ...buildIntegration(false)
        });

    });