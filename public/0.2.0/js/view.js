import "/__/firebase/9.12.0/firebase-app-compat.js";
import "/__/firebase/9.12.0/firebase-storage-compat.js";
import * as s from "/__/firebase/9.12.0/firebase-storage.js";
import "/__/firebase/init.js?useEmulator=true";
import { renderBoardDisplay } from "./display-render.js";

const app = firebase.app();
const storage = app.storage();
const state = location.search.substring(1).split("_");
const storageRef = storage.ref(["displays", ...state].join("/"));
const configRef = storage.ref(["config", ...state].join("/"));
const sessionId = `${new Date().toISOString()}_${Math.round(Math.random() * Date.now())}`;
const decoder = new TextDecoder();

let data = null;
let rawConfig = null, config = null;

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
            state: state.join("_"),
            sessionId: btoa(sessionId)
        }
    };

    try {
        rawConfig = decoder.decode(await s.getBytes(configRef));
        config = JSON.parse(rawConfig);
        metadata.customMetadata.boardId = config.id;
        document.body.innerHTML = renderBoardDisplay(config);

    } catch (err) {
        metadata.customMetadata.err = err.message;
    }

    await storageRef.putString("", "raw", metadata);
    document.title = config?.name || "Awaiting configuration";

};

ping();
let interval = setInterval(ping, 1000 * 5);