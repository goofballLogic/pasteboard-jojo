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
        ? mainLoggedIn(model)
        : "Please log in";

    return `<main>

        ${mainContent}

    </main>`;

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

    return `<ul class="displays">

        ${model.displays.length
            ? model.displays.map(displayModel => display(model, displayModel)).join("")
            : "No displays registered"}
    </ul>`;

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

function display(model, displayModel) {

    const { health, updated, config } = displayModel;
    const { ip, city, region, country, state, sessionId } = health;
    const [, identifier] = state?.split("_") || [];
    const [connected] = decode(sessionId, "?")?.split("_");

    const updatedAgo = ago(updated);
    const connectedAgo = ago(connected);
    const showing = model.boards && model.boards[health?.boardId]?.metadata;
    const configured = model.boards && model.boards[config?.boardId]?.metadata;

    console.log(model);
    return `<li class="${updatedAgo.age <= MINUTE * 2 ? "healthy" : updatedAgo.age <= MINUTE * 4 ? "weak" : "dead"}">


        <details>

            <summary>Unrecognised (${identifier}) - currently showing: ${showing?.name ?? "(None)"}</summary>
            <div>

                <dt>Last ping</dt><dd>${updatedAgo.description} ago</dd>
                <dt>Connected</td><dd>${connectedAgo.description} ago</dd>
                <dt>IP</dt><dd>${ip}</dd>
                <dt>Location</dt><dd>${city}, ${region}, ${country}</dd>
                <dt>Session</dt><dd>${sessionId}</dd>

            </div>
            <form class="schedule">

                <input type="hidden" name="state" value="${state}" />
                Choose board to display: <select name="next">

                    <option>None</option>
                    ${model.boards && Object.values(model.boards).map(b => `
                        <option value="${b.metadata?.id}">${b.metadata?.name}</option>
                    `).join("")}

                </select>
                <button>Schedule</button>
                ${configured ? `Currently scheduled: ${configured.name}` : ""}
            </form>

        </details>


    </li>`;

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