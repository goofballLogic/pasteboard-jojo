import { displays, deleteFieldValue } from "../../integration.js";

const displayUrl = generateDisplayUrl();
const displaysRef = ({ accountId }) => displays.doc(accountId).collection("data");
const displayRef = ({ id, accountId }) => displaysRef({ accountId }).doc(id);

export async function assignDisplay({ id, accountId, boardId }) {
    boardId = boardId || deleteFieldValue;
    await displayRef({ id, accountId })
        .set({ board: boardId }, { merge: true });
}

export async function deleteDisplay({ id, accountId }) {
    await displayRef({ id, accountId }).delete();
}

export async function renameDisplay({ id, accountId, name }) {
    await displayRef({ id, accountId }).set({ name }, { merge: true });
}

export async function newDisplay({ accountId, name }) {
    const nonce = Math.random().toString().substring(2);
    const id = generateName(nonce);
    await displayRef({ id, accountId }).set({ name });
}

export async function listDisplays({ accountId }) {

    if (!accountId) {
        console.warn("DLD-NA");
        return [];
    }

    try {
        const snapshot = await displaysRef({ accountId }).get();
        console.log(snapshot);
        return snapshot.docs
            .map(doc => [doc.id, doc.data()])
            .map(([id, config]) => ({
                id,
                config,
                href: `${displayUrl.href}?${btoa(accountId + "_" + id)}`
            }));

    } catch (err) {
        console.error(err, accountId);
        return [];
    }
}

function generateDisplayUrl() {
    const displayURL = new URL(location.href);
    displayURL.hash = "";
    displayURL.search = "";
    const path = displayURL.pathname.split("/");
    path[path.length - 1] = "view";
    path[path.length - 2] = "latest";
    displayURL.pathname = path.join("/");
    return displayURL;
}
