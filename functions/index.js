const functions = require("firebase-functions");

exports.fetchUserContext = functions.https.onCall(async (data, context) => {

    return {
        data,
        appId: context.app?.appId,
        userId: context.auth?.uid
    }

});