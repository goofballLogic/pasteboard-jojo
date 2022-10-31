export async function listDisplays(app, model) {

    const storage = app.storage();
    const found = await storage.ref(`displays/${model.user?.uid}`).listAll();
    console.log(found);
    const itemData = await Promise.all(found.items.map(async item => {

        const metadata = await metaDataOr(item, {});
        const configMetadata = await metaDataOr(storage.ref(item.fullPath.replace("displays/", "config/")), {});

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
