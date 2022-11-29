import { renderBoardDisplay } from "./display-render.js";
import { configHref } from "../../view-config.js";

const viewerConfigURL = new URL(configHref);
viewerConfigURL.search = location.search;

const context = {
    board: "awaiting config",
    sessionId: `${new Date().toISOString()}_${Math.round(Math.random() * Date.now())}`
};

const PING_INTERVAL = ["127.0.0.1", "localhost"].includes(location.hostname)
    ? 1000 * 5
    : 1000 * 60;

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

    } else {

        if (config.browserRefresh) {

            if (localStorage.getItem("browser-refresh") !== config.browserRefresh.toString()) {
                console.log("Browser refresh", config.browserRefresh);
                localStorage.setItem("browser-refresh", config.browserRefresh);
                location.reload();
            }

        }
        if (config.screenshotRequest !== context.screenshotRequest) {

            if (config.upload)
                screenshot(config.upload);
            context.screenshotRequest = config.screenshotRequest;

        }
        if (!(config.board === context.board && config.version === context.version)) {

            invalidCount = 0;
            if ("data" in config) {

                document.body.innerHTML = renderBoardDisplay(config.data);

            }
            context.board = config.board;
            context.version = config.version;

        }
        document.title = config?.name || "Awaiting configuration";
    }

};

ping();
let pingInterval = setInterval(ping, PING_INTERVAL);

async function screenshot(url) {

    console.log("Screenshot requested");
    const body = document.documentElement.outerHTML.replace(/(<\/?)script/gi, "$1template");
    await fetch(url, { method: "PUT", body, headers: { "Content-Type": "text/html" } });

}

async function fetchConfig() {

    context.clientHeight = document.documentElement.clientHeight;
    context.clientWidth = document.documentElement.clientWidth;
    const resp = await fetch(
        viewerConfigURL.href,
        {
            method: "POST",
            body: JSON.stringify(context),
            headers: { "Content-Type": "application/json" }
        }
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
