import "/__/firebase/9.12.0/firebase-app-compat.js";
import "/__/firebase/9.12.0/firebase-auth-compat.js";
import "/__/firebase/9.12.0/firebase-functions-compat.js";
import "/__/firebase/9.12.0/firebase-firestore-compat.js";
import "/__/firebase/init.js?useEmulator=true&region=europe-west2";
import { nav, main, errorToast } from "./views.js"
import "./editor.js";

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
        const functions = app.functions();
        try {

            const createBoard = await functions.httpsCallable("createBoard")(board);
            console.log("createBoard says", createBoard);
            model.metadata.entitlements = createBoard.data.entitlements;
            await fetchBoardMetadata(app);
            renderMain(app);

        } catch (err) {

            console.log(err);
            renderError(app, "An error occurred creating the board");

        }

    }],
    ["client-side", (app, a) => async e => {

        e.preventDefault();
        history.replaceState(null, "", a.href);
        renderMain(app);

    }]

];

async function fetchBoardMetadata(app) {
    const boardIds = Object.keys(model?.metadata?.entitlements?.boards || {});
    model.boards = model.boards || {};
    const boardMetadataCollectionRef = app.firestore().collection("board_metadata");
    for (const id of boardIds.filter(bid => !(bid in model.boards))) {

        const metadataSnapshot = await boardMetadataCollectionRef.doc(id).get();
        model.boards[id] = { metadata: metadataSnapshot.data() };

    }
}

function handleAction(app, target) {
    for (let [key, handler] of eventHandlers) {
        if (target.classList.contains(key)) {
            return handler(app, target);
        }
    }
}

let model = {};

const domParser = new DOMParser();

function renderNav(app) {
    const doc = domParser.parseFromString(nav(model), "text/html");
    const rendered = doc.body.querySelector("nav");
    document.querySelector("body > nav").replaceWith(rendered);
    registerListeners(rendered, app);
}

function renderMain(app) {
    const url = new URL(location.href);
    const board = url.searchParams.get("board");
    model.main = {
        board
    };
    const doc = domParser.parseFromString(main(model), "text/html");
    const rendered = doc.body.querySelector("main");
    document.querySelector("body > main").replaceWith(rendered);
    registerListeners(rendered, app);
}

function renderError(app, message) {
    const doc = domParser.parseFromString(errorToast(model, { message }), "text/html");
    const rendered = doc.body.children[0];
    document.body.appendChild(rendered);
    setTimeout(() => rendered.remove(), 5000);
}

function render(app) {
    renderNav(app);
    renderMain(app);
}

(async function initialize() {

    try {
        let app = firebase.app();
        model.features = [
            'auth',
            'database',
            'firestore',
            'functions',
            'messaging',
            'storage',
            'analytics',
            'remoteConfig',
            'performance',
        ].filter(feature => typeof app[feature] === 'function');

        const body = [
            nav(model),
            main(model)
        ].join("");
        document.body.innerHTML = body;
        const container = document.body;
        registerListeners(container, app);

        app.auth().onAuthStateChanged(async user => {
            if (model.user === user) return;
            if (user) {
                model.user = user;
                const functions = app.functions();
                const result = await functions.httpsCallable("fetchUserContext")();
                model.metadata = result.data.metadata;
                await fetchBoardMetadata(app);

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
