import { renderBoardDisplay } from "./display-render.js";

const routes = {
    home: "?",
    display: "?mode=displays",
    displaySelected: "?mode=displays&displayId={displayId}"
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

    try {
        const mainContent = model.user?.email
            ? mainLoggedIn(model)
            : "Please log in";

        return `<main>

        ${mainContent}

    </main>`;
    } catch (err) {

        console.error(err);
        return `<main>

            An error occurred (BM-G)

        </main>
        ${errorToast(err)}`;

    }

}

function mainLoggedIn(model) {

    if (model.state?.mode === "displays") {
        return model.displays
            ? displays(model)
            : "No displays found";
    } else {
        return model.state.board
            ? board(model)
            : boards(model);
    }
}

function displays(model) {

    return `

    <ul class="displays">

        ${model.displays.length
            ? model.displays.map(displayModel => display(model, displayModel)).join("")
            : "No displays registered"}

    </ul>
    ${newDisplayForm(model)}
    ${selectedDisplay(model)}
    `;

}

function newDisplayForm(model) {

    return `

    <form class="new-display">

        <input name="name" value="" placeholder="Display name" />
        <button>Create</button>

    </form>

    `;

}

function decode(data, fallback) {
    try {
        return atob(data);
    } catch (err) {
        console.warn(err);
    }
    return fallback;
}

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

const healthy = MINUTE * 1;
const weak = MINUTE * 2;

function display(model, displayModel) {

    const { updated, config = {}, id } = displayModel;
    const { name, state = {} } = config;
    const { board: showingBoard, err } = state;

    const updatedAgo = ago(updated);
    const showing = model.boards && model.boards[showingBoard]?.metadata;

    const selectHref = routes.displaySelected.replace("{displayId}", id);
    const status = err ? "error" : updatedAgo.age < healthy ? "healthy" : updatedAgo.age < weak ? "weak" : "dead";

    return `

    <li class="${status}">

        <a href="${selectHref}" class="client-side">

            ${name || "Unrecognised"}: ${showing?.name ? `Showing ${showing.name}` : "Awaiting configuration"}

        </a>


    </li>

    `;

}

function selectedDisplay(model) {

    const selectedDisplayId = new URL(location.href).searchParams.get("displayId");
    if (!selectedDisplayId) return "";

    const displayModel = model.displays.find(d => d.id == selectedDisplayId);
    if (!displayModel) return "";

    const { updated, config = {}, id, href } = displayModel;
    const { name, board: configuredBoard, state = {} } = config;
    const { ip, city, region, country_name: country, sessionId, err } = state;

    const connected = sessionId ? sessionId.split("_")[0] : null;
    const updatedAgo = ago(updated);
    const connectedAgo = ago(connected);

    return `

    <article class="selected-display">

        <section>

            Id: ${id}<br />
            Connect URL <button class="copy-to-clipboard" data-data="${href}">Copy to clipboard</button>

        </section>

        <hr />

        ${!err ? "" : `

            <aside class="error">

                <header>Error</header>
                ${err}

            </aside>
            <hr />

        `}

        <form class="schedule">

            <input type="hidden" name="display_id" value="${id}" />
            Choose board to display: <select name="next">

                <option value="">None</option>
                ${model.boards && Object.entries(model.boards).map(([id, board]) => `

                    <option value="${id}" ${id === configuredBoard ? "selected" : ""}>${board.metadata?.name}</option>

                `).join("")}

            </select>
            <button>Schedule</button>

        </form>

        <hr />

        ${!(displayModel.config?.state) ? "" : `

            <table>
                <tr><td>Heart beat</td><td>${updatedAgo.description} ago</td></tr>
                <tr><td>Connected</td><td>${connectedAgo.description} ago</td></tr>
                <tr><td>IP</td><td>${ip}</td></tr>
                <tr><td>Location</td><td>${city}, ${region}, ${country}</td></tr>
                <tr><td>Session</td><td>${sessionId}</td></tr>
            </table>
            <hr />

        `}

        <form class="delete-display">

            <input type="hidden" name="name" value="${name}" />
            <input type="hidden" name="id" value="${id}" />
            <button>Unregister and delete</button>

        </form>

        <form class="rename-display">

            <input type="hidden" name="id" value="${id}" />
            <input type="text" name="name" value="${name}" />
            <button>Rename</button>

        </form>

    </article>

    `;

}

function ago(start) {
    const age = Math.ceil(Math.max(0, (new Date() - new Date(start))) / 1000);
    const days = Math.floor(age / DAY);
    const daySeconds = days * DAY;
    const hours = Math.floor((age - daySeconds) / HOUR);
    const hourSeconds = hours * HOUR;
    const minutes = Math.floor((age - daySeconds - hourSeconds) / MINUTE);
    const minuteSeconds = minutes * MINUTE;
    const seconds = age - daySeconds - hourSeconds - minuteSeconds;
    const description = days ? `${days} days ${hours} hours and ${minutes} minutes`
        : hours ? `${hours} hours and ${minutes} minutes`
            : minutes ? `${minutes} minutes`
                : `~${seconds} seconds`;
    return { age, description };
}

export function statusToast(model) {

    return `<aside class="status-toast">

        ${model.message}

    </aside>`;

}

export function errorToast(model) {

    console.error(new Error(model.message));
    return `<aside class="error-toast">

        ${model.message}

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
    console.log(model);
    return `

        <nav class="editor">

            ${data.name}<br />
            <a href="?" class="home client-side"><button>&larr; Home</button></a>
            <hr />
            Zoom:<br />
            <button class="editor fit">Fit &nwnear;</button>
            <button class="editor fit-width">Fit &lrarr;</button>
            <button class="editor fit-height">Fit &udarr;</button>
            <hr />
            Note:<br />
            <button class="editor delete-note">Delete note ⚠</button>
            <hr />
            <button class="editor send-to-front-note">Front &nearr;</button>
            <button class="editor send-to-back-note">Back &swarr;</button>

        </nav>
        <article class="editor">

            ${renderBoardDisplay(data)}

        </article>

    `;

}

