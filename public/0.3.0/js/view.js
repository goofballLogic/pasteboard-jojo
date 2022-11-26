import { renderBoardDisplay } from "./display-render.js";
import { viewerConfig } from "../../view-config.js";

const viewerConfigURL = new URL(viewerConfig);
viewerConfigURL.search = location.search;

const context = {
    board: "awaiting config",
    sessionId: `${new Date().toISOString()}_${Math.round(Math.random() * Date.now())}`
};

const PING_INTERVAL = 1000 * 5;
let invalidCount = 0;

async function ping() {

    await ensureContextData();
    const config = await fetchConfig(); // error, undefined or payload

    if (!config) {

        if (invalidCount++ > 20) {

            // invalid
            clearInterval(pingInterval);
            document.body.innerHTML = renderBoardDisplay(undefined);

        } else {

            // waiting
            document.body.innerHTML = renderBoardDisplay(null);
            document.title = "Awaiting configuration";

        }

    } else if (!(config.board === context.board && config.version === context.version)) {

        invalidCount = 0;
        if ("data" in config) {

            document.body.innerHTML = renderBoardDisplay(config.data);

        }
        document.title = config?.name || "Awaiting configuration";
        context.board = config.board;
        context.version = config.version;

    }

};

ping();
let pingInterval = setInterval(ping, PING_INTERVAL);

async function fetchConfig() {
    const resp = await fetch(
        viewerConfigURL.href,
        { method: "POST", body: JSON.stringify(context), headers: { "Content-Type": "application/json" } }
    );
    if (resp.status === 404)
        return undefined;
    if (!resp.ok)
        throw new Error("Failed");
    return await resp.json();
}

async function ensureContextData() {

    if (!context.ip) {

        try {

            const resp = await fetch("https://ipapi.co/json");
            if (resp.ok) {

                const { ip, city, region, country_name } = await resp.json();
                Object.assign(context, { ip, city, region, country_name });

            }

        } catch (_) {

            context = null;

        }

    }
    return context;

}
