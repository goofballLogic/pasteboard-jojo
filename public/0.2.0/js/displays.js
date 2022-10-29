export async function listDisplays(app, model) {

    const storage = app.storage();
    const found = await storage.ref(`displays/${model.user?.uid}`).listAll();
    const itemData = await Promise.all(found.items.map(item => item.getMetadata()));
    return itemData;

}