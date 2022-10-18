const body = document.querySelector("body");
const bodyObserver = new MutationObserver((mutationList) => {
    for (const mutation of mutationList.filter(l => l.type === "childList")) {
        const main = Array.from(mutation.addedNodes).find(n => n.tagName === "MAIN");
        if (main && main.querySelector("article.editor")) {
            document.body.classList.add("edit-mode");
            initialiseEditor(main);
        } else {
            document.body.classList.remove("edit-mode");
        }
    }

});
bodyObserver.observe(body, { childList: true });

function initialiseEditor(main) {

    const state = {
        moving: false
    };
    const editorSurface = main.querySelector("article.editor");
    editorSurface.addEventListener("mousedown", e => {
        if (e.target === editorSurface) {
            state.moving = {
                cursor: { left: e.clientX, top: e.clientY },
                element: editorSurface.getBoundingClientRect()
            };
        }
    });
    document.body.addEventListener("mousemove", e => {

        if (state.moving) { // && e.target === editorSurface) {
            editorSurface.style.left = `${state.moving.element.left + e.clientX - state.moving.cursor.left}px`;
            editorSurface.style.top = `${state.moving.element.top + e.clientY - state.moving.cursor.top}px`;
        }
    });
    const endMoving = e => { state.moving = false; };
    editorSurface.addEventListener("mouseup", endMoving);

    const menuSurface = main.querySelector("nav.editor");
    menuSurface.querySelector("button.fit")?.addEventListener("click", e => {

        console.log("Fit");
        const dwidth = window.innerWidth / editorSurface.offsetWidth;
        const dheight = window.innerHeight / editorSurface.offsetHeight;
        const zoom = Math.min(dwidth, dheight);
        editorSurface.style.transition = "0.3s all";
        editorSurface.style.transformOrigin = "0 0";
        editorSurface.style.transform = `scale(${zoom})`;

        editorSurface.style.left = `${(window.innerWidth - editorSurface.offsetWidth * zoom) / 2}px`;
        editorSurface.style.top = `${(window.innerHeight - editorSurface.offsetHeight * zoom) / 2}px`;
        setTimeout(function () {
            editorSurface.style.transition = "";
        }, 300);

    });
}