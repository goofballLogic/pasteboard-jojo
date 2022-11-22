import {
    signInWithEmailAndPassword,
    signInWithPopup,
    onAuthStateChanged,
    signOut,
    googleAuthProvider,
    storage,
    getBytes,
    functions,
    collections,
    deleteFieldValue
} from "../../integration.js";

verifyAPI("fetchUserContext", functions, "function", "functions");
verifyAPI("createBoard", functions, "function", "functions");
verifyAPI("createDisplay", functions, "function", "functions");
verifyAPI("boardMetadata", collections, "object", "collections");
verifyAPI("boards", collections, "object", "collections");
verifyAPI("displays", collections, "object", "collections");

function verifyAPI(key, container, typename, path) {

    if (!(container[key] && typeof container[key] === typename))
        throw new Error(`Missing ${path}.${key} ${typename}`);

}