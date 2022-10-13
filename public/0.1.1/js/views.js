
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

    return `
        <main>
            Using Firebase features: ${model.features.join(", ")}
        </main>
    `;

}