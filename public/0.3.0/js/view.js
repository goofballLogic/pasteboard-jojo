import { renderBoardDisplay } from "./display-render.js";
import { viewerConfig } from "../../view-config.js";

const viewerConfigURL = new URL(viewerConfig);
viewerConfigURL.search = location.search;

const context = {
    sessionId: `${new Date().toISOString()}_${Math.round(Math.random() * Date.now())}`
};

const PING_INTERVAL = 1000 * 5;

async function ping() {

    await ensureContextData();
    const config = await fetchConfig();
    if (!(config.board === context.board && config.version === context.version)) {

        if ("data" in config) {

            document.body.innerHTML = renderBoardDisplay(config.data);

        }
        document.title = config?.name || "Awaiting configuration";
        context.board = config.board;
        context.version = config.version;

    }

};

ping();
setInterval(ping, PING_INTERVAL);

async function fetchConfig() {
    const resp = await fetch(
        viewerConfigURL.href,
        { method: "POST", body: JSON.stringify(context), headers: { "Content-Type": "application/json" } }
    );
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
