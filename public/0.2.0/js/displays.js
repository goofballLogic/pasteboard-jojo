import { storage } from "../../integration.js";

export async function listDisplays(model) {
    const found = await storage.ref(`displays/${model.user?.uid}`).listAll();
    const itemData = await Promise.all(found.items.map(async (item) => {

        const configFile = storage.ref(item.fullPath.replace("displays/", "config/"));
        const metadata = await metaDataOr(item, {});
        const configMetadata = await metaDataOr(configFile, {});
        return {
            updated: metadata.updated,
            health: metadata.customMetadata,
            config: configMetadata.customMetadata
        };

    }));
    return itemData;
}

async function metaDataOr(item, alt) {
    try {
        return await item.getMetadata();
    } catch (err) {
        return alt;
    }
}
