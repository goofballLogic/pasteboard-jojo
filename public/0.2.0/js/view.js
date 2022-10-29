import "/__/firebase/9.12.0/firebase-app-compat.js";
import "/__/firebase/9.12.0/firebase-storage-compat.js";
import "/__/firebase/init.js?useEmulator=true";

const app = firebase.app();
const storage = app.storage();
const state = location.search.substring(1).split(".");
const storageRef = storage.ref(["displays", ...state].join("/"));

const sessionId = `${new Date().toISOString()}_${Math.round(Math.random() * Date.now())}`;

let data = null;
async function ping() {

    if (!data) {

        try {

            const resp = await fetch("https://ipapi.co/json");
            if (resp.ok) {
                const { ip, city, region, country_name } = await resp.json();
                data = { ip, city, region, country: country_name };
            }

        } catch (_) {

            data = null;

        }

    }
    const metadata = {
        customMetadata: {
            ...data,
            state: state.join("."),
            sessionId: btoa(sessionId)
        }
    };
    await storageRef.putString("", "raw", metadata);

};

ping();
let interval = setInterval(ping, 1000 * 5);