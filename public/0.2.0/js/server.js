import { withPending } from "./status.js";
import { functions } from "./integration.js";

export async function fetchUserContext() {
    return await withPending(
        () => functions.fetchUserContext(),
        "Loading user data..."
    );
}

export async function createBoard(board) {
    return await withPending(
        () => functions.createBoard(board),
        "Creating the board. Please wait."
    );
}
