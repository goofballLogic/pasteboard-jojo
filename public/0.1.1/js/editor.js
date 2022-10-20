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

    const editorSurface = main.querySelector("article.editor");
    makeDraggable(editorSurface);

    for (const note of editorSurface.querySelectorAll(".note")) {
        makeDraggable(note);
    }
    const menuSurface = main.querySelector("nav.editor");
    menuSurface.querySelector("button.fit")?.addEventListener("click", e =>
        zoomToFit(editorSurface, window.innerWidth - 20, window.innerHeight - 20));
    menuSurface.querySelector("button.fit-width")?.addEventListener("click", e =>
        zoomToFit(editorSurface, window.innerWidth - 20, Number.POSITIVE_INFINITY));
    menuSurface.querySelector("button.fit-height")?.addEventListener("click", e =>
        zoomToFit(editorSurface, Number.POSITIVE_INFINITY, window.innerHeight - 20));

    zoomToFit(editorSurface, window.innerWidth - 20, window.innerHeight - 20);
}

function makeDraggable(draggable) {

    const state = {
        moving: false
    };
    draggable.addEventListener("click", e => {

        const boundingRect = draggable.getBoundingClientRect();
        const zoom = boundingRect.width / draggable.offsetWidth;
        console.log(draggable.tagName);
        console.log("offset left", draggable.offsetLeft);
        console.log("mouse client x", e.clientX);
        console.log("zoom", zoom);
        console.log("zoomed offset left", draggable.offsetLeft * zoom);
        console.log(draggable.offsetParent);

    })
    draggable.addEventListener("mousedown", e => {
        if (e.target === draggable) {
            const boundingRect = draggable.getBoundingClientRect();
            const zoom = boundingRect.width / draggable.offsetWidth;

            state.moving = {
                mouseStart: {
                    clientX: e.clientX,
                    clientY: e.clientY
                },
                elementStart: {
                    offsetLeft: draggable.offsetLeft,
                    offsetTop: draggable.offsetTop
                },
                zoom
            };
        }
    });
    document.body.addEventListener("mousemove", e => {

        const { moving } = state;
        if (moving) {
            const dx = e.clientX - moving.mouseStart.clientX;
            const dy = e.clientY - moving.mouseStart.clientY;
            const x = (moving.elementStart.offsetLeft * moving.zoom + dx) / moving.zoom;
            const y = (moving.elementStart.offsetTop * moving.zoom + dy) / moving.zoom;
            draggable.style.left = `${x}px`;
            draggable.style.top = `${y}px`;
        }
    });
    draggable.addEventListener("mouseup", e => { state.moving = false; });
}

function zoomToFit(editorSurface, width, height) {
    const dwidth = width / editorSurface.offsetWidth;
    const dheight = height / editorSurface.offsetHeight;
    const zoom = Math.min(dwidth, dheight);
    zoomToRatio(editorSurface, zoom);
    return zoom;
}

function zoomToRatio(editorSurface, zoom) {
    editorSurface.style.transition = "0.3s all";
    editorSurface.style.transformOrigin = "0 0";
    editorSurface.style.transform = `scale(${zoom})`;
    editorSurface.style.left = `${(window.innerWidth - editorSurface.offsetWidth * zoom) / 2}px`;
    editorSurface.style.top = `${(window.innerHeight - editorSurface.offsetHeight * zoom) / 2}px`;
    setTimeout(function () {
        editorSurface.style.transition = "";
    }, 300);
}
