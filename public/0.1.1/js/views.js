
function buildRoot() {
    const url = new URL(import.meta.url);
    url.pathname = url.pathname.replace(/\/js\/views.js$/, "");
    return url.toString();
}
const root = buildRoot()

function signIn() {

    return `
        <button class="sign-in google">Sign in (Google)</button>
        <button class="sign-in email">Sign in (email)</button>
    `;

}

function acknowledgeUser({ email }) {

    return `
        ${email}
        <button class="sign-out">Sign out</button>
    `;

}

export function nav({ user }) {

    return `
        <nav>
            <a href="${root}/app/home.html">Home</a>
            <div class="status">${user?.email ? acknowledgeUser(user) : signIn()}</div>
        </nav>
    `;

}

export function main(model) {

    const mainContent = model.user?.email
        ? model.main?.board
            ? board(model)
            : boards(model)
        : "Please log in";

    return `<main>

        ${mainContent}

    </main>`;

}

export function errorToast(_, errorModel) {

    return `<aside class="error-toast">

        ${errorModel.message}

    </aside>`;

}

function boards(model) {

    return `<article>

        <header>
            Boards
        </header>
        <form class="new-board">

            <label>

                <span>Name</span>
                <input type="text" required name="name" />

            </label>
            <button>Create</button>

        </form>
        ${model.boards && `<ul class="boards">

            ${Object.entries(model.boards).map(boardLineItem).join("")}

        </ul>`}

    </article>`;

}

function boardLineItem([id, board]) {

    return `<li id="board_${id}">

        <a class="client-side" href="?board=${id}">${board.metadata.name}</a>

    </li>`;

}

function board(model) {

    const data = model.boards[model.main.board];
    return `

        <nav class="editor">

            ${data.metadata.name}
            <hr />
            Zoom:<br />
            <button class="editor fit">Fit &nwnear;</button>
            <button class="editor fit-width">Fit &lrarr;</button>
            <button class="editor fit-height">Fit &udarr;</button>

        </nav>
        <article class="editor">

            <div class="note" style="left: 100px; top: 100px;">Something</div>


        </article>

    `;

}