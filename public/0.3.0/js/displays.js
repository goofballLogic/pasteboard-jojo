import { displays, deleteFieldValue } from "../../integration.js";

export async function assignDisplay({ id, accountId, boardId }) {
    const ref = displays.doc(accountId);
    boardId = boardId || deleteFieldValue;
    await ref.set({ [id]: { board: boardId } }, { merge: true });
}

export async function deleteDisplay({ id, accountId }) {
    const ref = displays.doc(accountId);
    await ref.set({ [id]: deleteFieldValue }, { merge: true });
}

export async function listDisplays({ accountId }) {

    if (!accountId) {
        console.warn("DLD-NA");
        return [];
    }

    const displayURL = new URL(location.href);
    displayURL.hash = "";
    displayURL.search = "";
    const path = displayURL.pathname.split("/");
    path[path.length - 1] = "view";
    path[path.length - 2] = "latest";
    displayURL.pathname = path.join("/");

    try {
        const snapshot = await displays.doc(accountId).get();
        if (!snapshot.exists) {
            return [];
        } else {
            return Object.entries(snapshot.data()).map(([id, config]) => ({
                id,
                config,
                href: `${displayURL.href}?${btoa(accountId + "_" + id)}`
            }));
        }
    } catch (err) {
        console.error(err, accountId);
        return [];
    }
}