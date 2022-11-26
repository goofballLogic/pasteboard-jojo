export const configHref =
    ["localhost", "127.0.0.1"].includes(location.hostname)
        ? "http://127.0.0.1:5001/paste-1c305/us-central1/viewerconfig"
        : "https://viewerconfig-pwmlwookpq-uc.a.run.app";

console.log("View config loaded");