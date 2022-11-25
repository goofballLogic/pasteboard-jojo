import "/__/firebase/9.12.0/firebase-app-compat.js";
import "/__/firebase/9.12.0/firebase-auth-compat.js";
import "/__/firebase/9.12.0/firebase-firestore-compat.js";
import "/__/firebase/9.12.0/firebase-storage-compat.js";
import * as s from "/__/firebase/9.12.0/firebase-storage.js";
import "/__/firebase/init.js?useEmulator=true";

const app = firebase.app();

const auth = app.auth();
export const signInWithEmailAndPassword = auth.signInWithEmailAndPassword.bind(auth);
export const signInWithPopup = auth.signInWithPopup.bind(auth);
export const onAuthStateChanged = auth.onAuthStateChanged.bind(auth);
export const signOut = auth.signOut.bind(auth);
export const googleAuthProvider = new firebase.auth.GoogleAuthProvider();

export const storage = app.storage();
export const getBytes = s.getBytes;

const firestore = app.firestore();
export const boards = firestore.collection("boards");
export const displays = firestore.collection("displays");
export const deleteFieldValue = firebase.firestore.FieldValue.delete();

console.log("Integration loaded");