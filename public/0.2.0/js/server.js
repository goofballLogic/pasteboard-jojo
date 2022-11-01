import { withPending } from "./status";

export async function fetchUserContext(app) {
    return await withPending(
        () => app.functions().httpsCallable("fetchUserContext")(),
        "Loading user data..."
    );
}

export async function createBoard(app, board) {
    return await withPending(
        () => app.functions().httpsCallable("createBoard")(board),
        "Creating the board. Please wait."
    );
}
