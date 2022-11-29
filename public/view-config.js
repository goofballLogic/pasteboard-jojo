export const configHref =
    ["localhost", "127.0.0.1"].includes(location.hostname)
        ? "http://127.0.0.1:5001/paste-1c305/us-central1/viewerconfig"
        : "https://us-central1-paste-1c305.cloudfunctions.net/viewerconfig";

console.log("View config loaded");