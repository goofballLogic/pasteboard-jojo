import "./includes.js";
import { nav, main } from "./views.js"
import { updateEditor } from "./editor.js";
import { noteAdded, noteModified, receive } from "./bus.js";
import { addNote, aggregateEvents, disableDisplay, enableDisplay, loadFromStore, modifyNote, saveToStore, fetchBoardMetadata } from "./board.js";
import { listDisplays } from "./displays.js";
import { fetchUserContext, createBoard } from "./server.js";
import { renderError } from "./status.js";

async function googleSignIn(app) {
    const provider = new firebase.auth.GoogleAuthProvider();
    const auth = firebase.auth(app);
    await auth.signInWithPopup(provider);
}

async function emailSignIn(app) {
    const auth = firebase.auth(app);
    const email = window.prompt("email");
    const password = window.prompt("password");
    await auth.signInWithEmailAndPassword(email, password);
}

const eventHandlers = [
    ["sign-in", (app, target) => {

        const authStrategy = target.classList.contains("google") ? googleSignIn : emailSignIn;
        return async function signIn() {
            await authStrategy(app);
        }

    }],
    ["sign-out", app => async () => {

        await firebase.auth(app).signOut();

    }],
    ["new-board", (app, form) => async e => {

        e.preventDefault();
        const data = new FormData(form);
        const board = {
            id: `${model.user?.uid}_${Date.now()}`,
            name: data.get("name")
        };
        try {

            model.metadata.entitlements = await createBoard(app, board).data.entitlements;
            await fetchBoardMetadata(app, model);
            renderMain(app);

        } catch (err) {

            console.log(err);
            renderError("An error occurred creating the board");

        }

    }],
    ["client-side", (app, a) => async e => {

        e.preventDefault();
        history.pushState(null, "", a.href);
        render(app);

    }],
    ["schedule", (app, form) => async e => {

        e.preventDefault();
        const { previous, next, state } = Object.fromEntries(new FormData(form).entries());
        console.log({ previous, next, state });
        model.boards = model.boards || {};
        if (next) {

            if (!(next in model.boards))
                model.boards[next] = {};
            const board = model.boards[next];
            if (!await getBoardData(board, app, next))
                return; // an error occurred
            disableDisplay(board, state);
            aggregateEvents(board);
            await saveToStore(app, board);
            enableDisplay(board, state);
            aggregateEvents(board);
            await saveToStore(app, board);

        }

    }]

];

function handleAction(app, target) {
    for (let [key, handler] of eventHandlers) {
        if (target.classList.contains(key)) {
            return handler(app, target);
        }
    }
}

export let model = { loading: true };

export const domParser = new DOMParser();

function renderNav(app) {
    const doc = domParser.parseFromString(nav(model), "text/html");
    const rendered = doc.body.querySelector("nav");
    document.querySelector("body > nav").replaceWith(rendered);
    registerListeners(rendered, app);
}

async function renderMain(app) {
    model.error = null;
    buildState();
    await buildMainModel(app);
    const doc = domParser.parseFromString(main(model), "text/html");
    const rendered = doc.body.querySelector("main");
    document.querySelector("body > main").replaceWith(rendered);
    registerListeners(rendered, app);
}

async function buildMainModel(app) {
    const boardId = model.state.board;
    if (boardId) {
        model.board = (model.boards && model.boards[boardId]) || {};
        const board = model.board;
        await getBoardData(board, app, boardId);
    }
    if (model.state.mode === "displays") {

        model.displays = await listDisplays(app, model);

    }

}

async function getBoardData(board, app, boardId) {
    if (!board.data) {
        try {
            await loadFromStore(app, board, boardId);
        } catch (err) {
            renderError(err.message);
            model.error = err;
        }
    }
    return board.data;
}

function buildState() {
    const url = new URL(location.href);
    model.state = {};
    if (url.searchParams.has("board"))
        model.state.board = url.searchParams.get("board");
    if (url.searchParams.has("mode"))
        model.state.mode = url.searchParams.get("mode");
}

function render(app) {
    renderNav(app);
    renderMain(app);
}

(async function initialize() {

    try {
        const app = firebase.app();
        window.app = app;

        const body = [
            nav(model),
            main(model)
        ].join("");
        document.body.innerHTML = body;

        receive(noteModified, noteModifiedHandler(app));
        receive(noteAdded, noteAddedHandler(app));
        window.addEventListener("popstate", () => render(app));
        const container = document.body;
        registerListeners(container, app);

        app.auth().onAuthStateChanged(async user => {

            if (model.user === user) return;
            if (user) {
                model = { user };
                const result = await fetchUserContext(app);
                model.metadata = result.data.metadata;
                await fetchBoardMetadata(app, model);

            } else {
                model = { user };
                const url = new URL(location.href);
                if (url.search !== "") {
                    url.search = "";
                    location.href = url;
                }
            }
            render(app);
        });

    } catch (e) {

        console.error(e);
        document.body.innerHTML = 'Error initialising the app, check the console.';

    }


}())

function registerListeners(container, app) {
    for (const button of container.querySelectorAll("button")) {
        button.addEventListener("click", handleAction(app, button));
    }
    for (const form of container.querySelectorAll("form")) {
        form.addEventListener("submit", handleAction(app, form));
    }
    for (const a of container.querySelectorAll("a.client-side")) {
        a.addEventListener("click", handleAction(app, a));
    }
}

function noteAddedHandler(app) {
    return async eventData => {
        try {
            addNote(model.board, eventData);
            aggregateEvents(model.board);
            await saveToStore(app, model.board);
            updateEditor(document.querySelector("main"), main(model));
        } catch (err) {
            renderError(err.message);
        }

    };
}

function noteModifiedHandler(app) {
    return async eventData => {
        try {
            modifyNote(model.board, eventData);
            aggregateEvents(model.board);
            await saveToStore(app, model.board);
            updateEditor(document.querySelector("main"), main(model));
        } catch (err) {
            renderError(err.message);
        }
    }
}

