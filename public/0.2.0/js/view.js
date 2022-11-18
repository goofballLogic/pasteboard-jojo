import { renderBoardDisplay } from "./display-render.js";
import { storage, getBytes } from "../../integration.js";

const state = location.search.substring(1).split("_");
const storageRef = storage.ref(["displays", ...state].join("/"));
const configRef = storage.ref(["config", ...state].join("/"));
const sessionId = `${new Date().toISOString()}_${Math.round(Math.random() * Date.now())}`;
const decoder = new TextDecoder();
let geoData = null;

async function ping() {

    const metadata = {
        customMetadata: {
            ...(await ensureGeoData()),
            state: state.join("_"),
            sessionId: btoa(sessionId)
        }
    };

    try {
        const config = await parseConfig();
        metadata.customMetadata.boardId = config.id;
        document.body.innerHTML = renderBoardDisplay(config);
        document.title = config?.name || "Awaiting configuration";
    } catch (err) {
        metadata.customMetadata.err = err.message;
    }

    await storageRef.putString("", "raw", metadata);


};

ping();
setInterval(ping, 1000 * 5);

async function parseConfig() {
    const bytes = await getBytes(configRef)
    const rawConfig = decoder.decode(bytes);
    return JSON.parse(rawConfig);
}

async function ensureGeoData() {

    if (!geoData) {

        try {

            const resp = await fetch("https://ipapi.co/json");
            if (resp.ok) {
                const { ip, city, region, country_name } = await resp.json();
                geoData = { ip, city, region, country: country_name };
            }

        } catch (_) {

            geoData = {};

        }

    }
    return geoData;

}
