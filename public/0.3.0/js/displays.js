import { storage, functions, collections, deleteFieldValue } from "../../integration.js";
const { displays } = collections;

export async function createDisplay({ accountId, name }) {
    if (!accountId) throw new Error("Account not specified");
    const displayId = `${Math.random().toString().substring(2)}Z${Date.now()}`;
    const ref = displays.doc(accountId);
    await ref.set({ [displayId]: { name } }, { merge: true });
    return displayId;
}

export async function assignDisplay({ id, accountId, boardId }) {
    const ref = displays.doc(accountId);
    boardId = boardId || deleteFieldValue;
    await ref.set({ [id]: { board: boardId } }, { merge: true });
}

export async function deleteDisplay(id) {
    const ref = displays.doc(id);
    await ref.delete();
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
                href: `${displayURL.href}?${accountId}_${id}`
            }));
        }
    } catch (err) {
        console.error(err, accountId);
        return [];
    }

    // const writeable = await storage.ref(`displays/${model.user.uid}`).listAll();
    // const readable = await storage.ref(`config/${model.user.uid}`).listAll();

    // const writeableMetadata = await Promise.all(writeable.items.map(item => metaDataOr(item, {})));
    // const readableMetadata = await Promise.all(readable.items.map(item => metaDataOr(item, {})));

    // const displays = {};



    // for (const metadata of [...writeableMetadata, ...readableMetadata]) {
    //     const path = metadata.fullPath.split("/");
    //     if (path.length !== 3) {
    //         throw new Error(`Invalid display path ${metadata.fullPath} (DLD-PL)`);
    //     }
    //     const displayId = `${path[1]}_${path[2]}`;
    //     displayURL.search = displayId;
    //     const display = displays[displayId] || {
    //         id: displayId,
    //         href: displayURL.href
    //     };
    //     if (path[0] === "config") {
    //         display.config = metadata.customMetadata;
    //     } else if (path[0] === "displays") {
    //         display.updated = metadata.updated;
    //         display.health = metadata.customMetadata;
    //     } else {
    //         throw new Error(`Invalid display path ${metadata.fullPath} (DLD-P0)`);
    //     }
    //     displays[displayId] = display;
    // }
    // return Object.values(displays);

    // const itemData = await Promise.all(writeable.items.map(async (item) => {

    //     const configFile = storage.ref(item.fullPath.replace("displays/", "config/"));
    //     const metadata = await metaDataOr(item, {});
    //     const configMetadata = await metaDataOr(configFile, {});
    //     return {
    //         updated: metadata.updated,
    //         health: metadata.customMetadata,
    //         config: configMetadata.customMetadata
    //     };

    // }));

    // return itemData;
}

async function metaDataOr(item, alt) {
    try {
        return await item.getMetadata();
    } catch (err) {
        return alt;
    }
}
