export async function fetchUserContext(app) {
    return await app.functions().httpsCallable("fetchUserContext")();
}

export async function createBoard(app, board) {
    return await app.functions().httpsCallable("createBoard")(board);
}
