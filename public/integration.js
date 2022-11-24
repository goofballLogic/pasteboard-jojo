import "/__/firebase/9.12.0/firebase-app-compat.js";
import "/__/firebase/9.12.0/firebase-auth-compat.js";
import "/__/firebase/9.12.0/firebase-functions-compat.js";
import "/__/firebase/9.12.0/firebase-firestore-compat.js";
import "/__/firebase/9.12.0/firebase-storage-compat.js";
import * as s from "/__/firebase/9.12.0/firebase-storage.js";
import "/__/firebase/init.js?useEmulator=true";

const app = firebase.app();
const auth = app.auth();
const appFunctions = app.functions();
const httpsCallable = appFunctions.httpsCallable.bind(appFunctions);

export const signInWithEmailAndPassword = auth.signInWithEmailAndPassword.bind(auth);
export const signInWithPopup = auth.signInWithPopup.bind(auth);
export const onAuthStateChanged = auth.onAuthStateChanged.bind(auth);
export const signOut = auth.signOut.bind(auth);
export const googleAuthProvider = new firebase.auth.GoogleAuthProvider();

export const storage = app.storage();
export const getBytes = s.getBytes;

export const functions = {
    fetchUserContext: httpsCallable("fetchUserContext"),
    createBoard: httpsCallable("createBoard"),
    createDisplay: httpsCallable("createDisplay"),
};

const firestore = app.firestore();
export const collections = {
    boardMetadata: firestore.collection("board_metadata"),
    boards: firestore.collection("boards"),
    displays: firestore.collection("displays")
};

export const deleteFieldValue = firebase.firestore.FieldValue.delete();

console.log("Integration loaded");