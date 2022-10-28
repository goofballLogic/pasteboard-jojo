
// function buildRoot() {
//     const url = new URL(import.meta.url);
//     url.pathname = url.pathname.replace(/\/js\/views.js$/, "");
//     return url.toString();
// }
// const root = buildRoot()

const routes = {
    home: "?",
    display: "?mode=displays"
};

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
            <a class="client-side" href="${routes.home}">Home</a>
            <a class="client-side" href="${routes.display}">Displays</a>
            <div class="status">${user?.email ? acknowledgeUser(user) : signIn()}</div>
        </nav>
    `;

}

export function main(model) {

    const mainContent = model.user?.email
        ? asdf(model)
        : "Please log in";

    return `<main>

        ${mainContent}

    </main>`;

}

function asdf(model) {
    console.log(model);
    return model.state?.board
        ? board(model)
        : boards(model);
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

        <p>You can manage your displays to display a board here:
        <a class="client-side" href="${routes.display}">Displays</a>
        </p>

    </article>`;

}

function boardLineItem([id, board]) {

    return `<li id="board_${id}">

        <a class="client-side" href="?board=${id}">${board.metadata.name}</a>

    </li>`;

}

function board(model) {

    const { data } = model.board;
    return `

        <nav class="editor">

            ${data.name}<br />
            <a href="?" class="home client-side"><button>&larr; Home</button></a>
            <hr />
            Zoom:<br />
            <button class="editor fit">Fit &nwnear;</button>
            <button class="editor fit-width">Fit &lrarr;</button>
            <button class="editor fit-height">Fit &udarr;</button>

        </nav>
        <article class="editor">

            ${data.notes ? Object.entries(data.notes).map(note).join("") : ""}

        </article>

    `;

}

function note([id, noteModel]) {

    const { left, top, content } = noteModel;
    return `

        <div data-id="${id}" class="note" style="left: ${left}px; top: ${top}px;">${content?.text || "???"}</div>

    `;

}