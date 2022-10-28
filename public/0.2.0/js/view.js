import "/__/firebase/9.12.0/firebase-app-compat.js";
import "/__/firebase/9.12.0/firebase-storage-compat.js";
import "/__/firebase/init.js?useEmulator=true";

const app = firebase.app();
const storage = app.storage();
const state = location.search.substring(1).split(".");
const storageRef = storage.ref(["displays", ...state].join("/"));

const sessionId = `${new Date().toISOString()}.${Math.random() * Date.now()}`;

console.log(storage);
console.log(storageRef);

async function ping() {

    await storageRef.putString(`${sessionId}|${Date.now()}`);

};

ping();
let interval = setInterval(ping, 1000 * 5);