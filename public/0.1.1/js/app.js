import "/__/firebase/9.12.0/firebase-app-compat.js";
import "/__/firebase/9.12.0/firebase-auth-compat.js";
import "/__/firebase/init.js?useEmulator=true";
import { nav, main } from "./views.js"

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

function handleClick(app, target) {

    if (target.classList.contains("sign-in")) {
        const authStrategy = target.classList.contains("google") ? googleSignIn : emailSignIn;
        return async function signIn() {
            await authStrategy(app);
        }
    }
    if (target.classList.contains("sign-out")) {
        return async function signOut() {
            await firebase.auth(app).signOut();
        }
    }
}

const model = {};

const domParser = new DOMParser();

function renderNav(app) {
    const doc = domParser.parseFromString(nav(model), "text/html");
    const rendered = doc.body.querySelector("nav");
    document.querySelector("body > nav").replaceWith(rendered);
    registerListeners(rendered, app);
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

        app.auth().onAuthStateChanged(user => {
            if (model.user === user) return;
            model.user = user;
            renderNav(app);

        });

    } catch (e) {

        console.error(e);
        document.body.innerHTML = 'Error loading the Firebase SDK, check the console.';

    }


}())

function registerListeners(container, app) {
    for (const button of container.querySelectorAll("button")) {
        button.addEventListener("click", handleClick(app, button));
    }
}
