const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.fetchUserContext = functions.https.onCall(async (data, context) => {

    const uid = context.auth?.uid;
    const metadata = await fetchUserMetadata(uid);

    return {
        uid: context.auth?.uid,
        metadata
    }

});

async function fetchUserMetadata(uid) {
    if (!uid) return null;
    const fs = admin.firestore();
    const metadataRef = fs.collection("user-metadata").doc(uid);
    const metadata = (await metadataRef.get()).data() || {};
    let dirty = false;
    if (!Array.isArray(metadata.groups)) {
        metadata.groups = [];
        dirty = true;
    }
    if (!metadata.groups.length) {
        metadata.groups.push({ id: "default", name: "Default group" });
        dirty = true;
    }
    if (!Array.isArray(metadata.entitlements)) {
        metadata.entitlements = [];
        dirty = true;
    }
    if (dirty) {
        await metadataRef.set(metadata, { merge: true });
    }
    return metadata;
}
