import "/__/firebase/9.12.0/firebase-app-compat.js";
import "/__/firebase/9.12.0/firebase-auth-compat.js";
import "/__/firebase/9.12.0/firebase-functions-compat.js";
import "/__/firebase/9.12.0/firebase-firestore-compat.js";
import "/__/firebase/9.12.0/firebase-storage-compat.js";
import "/__/firebase/9.12.0/firebase-storage.js";
import "/__/firebase/init.js?useEmulator=true";

export const app = firebase.app();

export const httpsCallable = app.functions().httpsCallable;

export const auth = app.auth();

export const googleAuthProvider = new firebase.auth.GoogleAuthProvider();

export const storage = app.storage();

export const functions = {
    fetchUserContext: app.functions().httpsCallable("fetchUserContext"),
    createBoard: app.functions().httpsCallable("createBoard")
};

export const collections = {

    boardMetadata: app.firestore().collection("board_metadata"),
    boards: app.firestore().collection("boards")

};