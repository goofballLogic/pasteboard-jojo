import { nav } from "./views.js"

(async function initialize() {

    const body = nav();
    document.body.innerHTML = body;

}())