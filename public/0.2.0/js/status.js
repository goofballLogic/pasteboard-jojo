import { errorToast, statusToast } from "./views.js";

export async function withPending(action, message) {
    let toast;
    try {
        toast = renderPending(message || "Please wait...");
        return await action();
    } finally {
        toast.remove();
    }
}

export const domParser = new DOMParser();

export function renderPending(message) {

    return renderHTML(statusToast({ message }));

}

export function renderError(message) {

    return renderHTML(errorToast({ message }), true);

}

function renderHTML(html, autoExpire) {
    const doc = domParser.parseFromString(html, "text/html");
    const rendered = doc.body.children[0];
    document.body.appendChild(rendered);
    if (autoExpire) setTimeout(() => rendered.remove(), 5000);
    console.log("Rendered", rendered);
    return rendered;
}
