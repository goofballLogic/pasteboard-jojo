import "./plumbing/integration-api.js";
import { nav, main } from "./views.js"
import { updateEditor } from "./editor.js";
import { noteAdded, noteDeleted, noteModified, noteSentToBack, noteSentToFront, receive } from "./plumbing/bus.js";
import { listDisplays, assignDisplay, deleteDisplay } from "./displays.js";
import { renderError, withPending } from "./plumbing/status.js";
import { googleAuthProvider, signInWithPopup, signInWithEmailAndPassword, onAuthStateChanged, signOut, displays, boards } from "../../integration.js";
import { generateName } from "./plumbing/nouns.js";
import { keywiseUpdate } from "./plumbing/patching.js";

async function googleSignIn() {
    await signInWithPopup(googleAuthProvider);
}

async function emailSignIn() {
    const email = window.prompt("email");
    const password = window.prompt("password");
    await signInWithEmailAndPassword(email, password);
}

const eventHandlers = [
    ["copy-to-clipboard", target => e => {
        e.preventDefault();
        const href = target.dataset?.data;
        if (href) {
            navigator.clipboard.writeText(href);
            alert("Copied");
        }
    }],
    ["sign-in", (target) => {

        const authStrategy = target.classList.contains("google") ? googleSignIn : emailSignIn;
        return async function signIn() { await authStrategy(); }

    }],
    ["sign-out", () => signOut],
    ["new-display", (form) => async e => {

        e.preventDefault();
        try {

            const data = new FormData(form);
            const name = data.get("name");
            const { accountId } = model;
            const displaysRef = displays.doc(accountId);
            const displaysSnapshot = await displaysRef.get();
            const existing = displaysSnapshot.data() ?? {};
            let displayId = generateName();
            while (displayId in existing)
                displayId = generateName();
            await displaysRef.set({ [displayId]: { name } }, { merge: true });
            renderMain();

        } catch (err) {

            console.error(err);
            renderError("An error occurred creating the display (MND-CD)");

        }

    }],
    ["delete-display", form => async e => {

        e.preventDefault();
        const data = new FormData(form);
        const id = data.get("id");
        const name = data.get("name");
        const { accountId } = model;
        if (!id) return;
        if (confirm(`Are you sure you want to delete display ${name} (${id})?`))
            await deleteDisplay({ id, accountId });

    }],
    ["new-board", form => async e => {

        e.preventDefault();
        const data = new FormData(form);
        const name = data.get("name");
        const { accountId } = model;

        const accountBoardsRef = boards.doc(accountId);

        let id = generateName();
        let existing = await accountBoardsRef.collection("metadata").get(id);
        while (existing.exists) {

            id = generateName();
            existing = await accountBoardsRef.collection("metadata").get(id);

        }
        try {

            await accountBoardsRef.collection("data").doc(id).set({ id, name });
            await accountBoardsRef.collection("metadata").doc(id).set({ id, name });
            await fetchBoardMetadata(id);
            renderMain();

        } catch (err) {

            console.error(err);
            renderError("An error occurred creating the board (MNB-CB)");

        }

    }],
    ["client-side", (a) => async e => {

        e.preventDefault();
        history.pushState(null, "", a.href.replace(/\?$/, ""));
        render();

    }],
    ["schedule", (form) => async e => {

        e.preventDefault();
        const { next: nextBoardId, display_id: displayId } = Object.fromEntries(new FormData(form).entries());
        await assignDisplay({
            id: displayId,
            accountId: model.user.uid,
            boardId: nextBoardId
        });

    }]

];

function handleAction(target) {
    for (let [key, handler] of eventHandlers) {
        if (target.classList.contains(key)) {
            return handler(target);
        }
    }
}

export let model = { loading: true };

export const domParser = new DOMParser();

function renderNav() {
    const doc = domParser.parseFromString(nav(model), "text/html");
    const rendered = doc.body.querySelector("nav");
    document.querySelector("body > nav").replaceWith(rendered);
    registerListeners(rendered);
}

async function renderMain() {

    console.log({ ...model });
    model.error = null;
    await updateModelFromURL();
    await updateModelFromBoardId();
    await updateModelFromMode();
    const doc = domParser.parseFromString(main(model), "text/html");
    const rendered = doc.body.querySelector("main");
    document.querySelector("body > main").replaceWith(rendered);
    registerListeners(rendered);

}

async function updateModelFromBoardId() {
    const boardId = model.state.board;
    if (boardId) {
        if (!model.boards[boardId]) model.boards[boardId] = {};
        model.board = model.boards[boardId];
        await getBoardData(model.board, boardId);
    }
}

async function updateModelFromMode() {
    if (model.state.mode === "displays") {
        model.displays = await listDisplays({ accountId: model.user?.uid });
    }
}

async function getBoardData(board, boardId) {
    if (!board.data) {
        try {
            board.data = await loadBoardData(boardId);
        } catch (err) {
            renderError(err.message);
            model.error = err;
        }
    }
    return board.data;
}

async function updateModelFromURL() {
    const url = new URL(location.href);
    model.state = {};
    if (url.searchParams.has("board"))
        model.state.board = url.searchParams.get("board");
    if (url.searchParams.has("mode"))
        model.state.mode = url.searchParams.get("mode");
}

function render() {
    renderNav();
    renderMain();
}

(async function initialize() {

    try {

        const body = [
            nav(model),
            main(model)
        ].join("");
        document.body.innerHTML = body;

        receive(noteModified, noteModifiedHandler());
        receive(noteAdded, noteAddedHandler());
        receive(noteDeleted, noteDeletedHandler());
        receive(noteSentToBack, noteSentToBackHandler());
        receive(noteSentToFront, noteSentToFrontHandler());

        window.addEventListener("popstate", render);
        const container = document.body;
        registerListeners(container);

        onAuthStateChanged(async user => {

            try {

                if (model.user === user) return;
                if (user) {
                    model = { user, accountId: user.uid };
                    await fetchBoardMetadata();
                } else {
                    model = { user, accountId: null };
                    const url = new URL(location.href);
                    if (url.search !== "") {
                        url.search = "";
                        location.href = url;
                    }
                }
                render();

            } catch (err) {

                renderError(err);

            }

        });

    } catch (e) {

        console.error(e);
        document.body.innerHTML = 'Error initialising the app, check the console.';

    }

}());

function registerListeners(container) {
    for (const button of container.querySelectorAll("button")) {
        button.addEventListener("click", handleAction(button));
    }
    for (const form of container.querySelectorAll("form")) {
        form.addEventListener("submit", handleAction(form));
    }
    for (const a of container.querySelectorAll("a.client-side")) {
        a.addEventListener("click", handleAction(a));
    }
}

function noteAddedHandler() {
    return handleEditorUpdate(eventData => addNote(model.board, eventData));
}

function noteModifiedHandler() {
    return handleEditorUpdate(eventData => modifyNote(model.board, eventData));
}

function noteSentToBackHandler() {
    return handleEditorUpdate(eventData => sendNoteToBack(model.board, eventData));
}

function noteSentToFrontHandler() {
    return handleEditorUpdate(eventData => sendNoteToFront(model.board, eventData));
}

function noteDeletedHandler() {
    return handleEditorUpdate(eventData => deleteNote(model.board, eventData));
}

function handleEditorUpdate(op) {
    return async (eventData) => {
        try {
            if (await op(eventData))
                updateEditor(document.querySelector("main"), main(model));
        } catch (err) {
            renderError(err.message);
        }
    };
}

async function fetchBoardMetadata(awaitBoardId = null, safety = 0) {
    await withPending(
        async () => {

            if (!("boards" in model)) model.boards = {};

            const metadata = await boards
                .doc(model.accountId)
                .collection("metadata").get();

            Array.from(metadata.docs).forEach(doc => {
                const data = doc.data();
                const { id } = doc;
                if (!(id in model.boards))
                    model.boards[id] = { metadata: data };
                else
                    model.boards[id].metadata = data;
            });
        },
        "Loading boards..."
    );
    if (awaitBoardId && !model.boards[awaitBoardId]?.metadata) {

        if (safety > 10) {

            renderError("Metadata for board failed to load");
            throw new Error("Waiting failed");

        } else {

            await new Promise(resolve => setTimeout(resolve, 1000));
            await fetchBoardMetadata(awaitBoardId, safety + 1);

        }

    }

}


export async function loadBoardData(boardId) {

    return await withPending(

        async () => {
            const snapshot = await boards.doc(model.accountId).collection("data").doc(boardId).get();
            return snapshot.data();
        },
        "Loading board"

    );

}

async function addNote(board, eventData) {
    return await processEventDataForNoteId({ board, noteId: Date.now(), eventData });
}

async function modifyNote(board, eventData) {
    return await processEventDataForNoteId({ board, noteId: eventData.id, eventData });
}

async function deleteNote(board, eventData) {
    return await processEventDataForNoteId({ board, noteId: eventData.id, commands: { kill: true } });
}

async function sendNoteToBack(board, eventData) {
    return await processEventDataForNoteId({ board, noteId: eventData.id, commands: { toBack: true } })
}

async function sendNoteToFront(board, eventData) {
    return await processEventDataForNoteId({ board, noteId: eventData.id, commands: { toFront: true } });
}

async function processEventDataForNoteId({ board, noteId, eventData, commands }) {

    try {

        if (commands) {

            if (commands.kill) {

                ensureNotePatch({ board, noteId }).deleted = true;
                delete board.data.notes[noteId];

            }
            if (commands.toFront) {

                const zIndex = maxZ(board) + 1;
                ensureNotePatch({ board, noteId }).zIndex = zIndex;
                ensureNoteDataModel({ board, noteId }).zIndex = zIndex;

            }
            if (commands.toBack) {

                const zIndex = minZ(board) - 1;
                ensureNotePatch({ board, noteId }).zIndex = zIndex;
                ensureNoteDataModel({ board, noteId }).zIndex = zIndex;

            }

        } else {

            const patch = ensureNotePatch({ board, noteId });
            const noteModel = ensureNoteDataModel({ board, noteId });
            processNoteEventData(eventData, patch, noteModel, board);

        }
        const accountBoardsRef = boards.doc(model.accountId);
        const boardRef = accountBoardsRef.collection("data").doc(board.data.id);
        const boardPatch = board.patch;
        const keywisePatch = keywiseUpdate(boardPatch);
        board.patch = null;
        if (Object.keys(keywisePatch).length) {
            await withPending(() => boardRef.update(keywisePatch), "Updating board");
            return true;
        } else
            return false;

    } catch (err) {

        console.error(err);
        renderError(err);
        return false;

    }

}

function ensureNoteDataModel({ board, noteId }) {

    board.data.notes = board.data.notes || {};
    if (!(noteId in board.data.notes))
        board.data.notes[noteId] = {};
    return board.data.notes[noteId];

}

function ensureNotePatch({ board, noteId }) {

    if (!board.patch) board.patch = {};
    const boardPatch = board.patch;
    if (!boardPatch.notes)
        boardPatch.notes = {};
    boardPatch.notes[noteId] = {};
    return boardPatch.notes[noteId];

}

function processNoteEventData(eventData, patch, component, board) {

    if ("left" in eventData && component.left !== eventData.left) {
        patch.left = eventData.left;
        component.left = patch.left;
    }
    if ("top" in eventData && eventData.top !== component.top) {
        patch.top = eventData.top;
        component.top = patch.top;
    }
    if ("content" in eventData && eventData.content.text !== component.content?.text) {
        patch.content = patch.content || {};
        patch.content.text = eventData.content.text;
        component.content = component.content || {};
        component.content.text = eventData.content.text;
    }
    if ("zIndex" in eventData && eventData.zIndex !== component.zIndex) {
        patch.zIndex = eventData.zIndex;
        component.zIndex = patch.zIndex;
    }
    if (!component.zIndex) {
        patch.zIndex = maxZ(board) + 1;
        component.zIndex = patch.zIndex;
    }

}

function zs(board) { return Object.entries(board.data.notes).map(([_, data]) => data.zIndex || 0); }

function maxZ(board) { return Math.max(0, ...zs(board)); }

function minZ(board) { return Math.min(0, ...zs(board)); }

