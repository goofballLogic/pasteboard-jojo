import { noteAdded, noteDeleted, noteModified, noteSentToFront, noteSentToBack, send } from "./bus.js";

const body = document.querySelector("body");
const bodyObserver = new MutationObserver((mutationList) => {
    for (const mutation of mutationList.filter(l => l.type === "childList")) {
        const main = Array.from(mutation.addedNodes).find(n => n.tagName === "MAIN");
        if (main) {
            if (main.querySelector("article.editor")) {
                document.body.classList.add("edit-mode");
                initialiseEditor(main);
            } else {
                document.body.classList.remove("edit-mode");
            }
        }
    }

});
bodyObserver.observe(body, { childList: true });
const parser = new DOMParser();
export function updateEditor(main, updated) {

    const updatedContent = parser
        .parseFromString(updated, "text/html")
        .querySelector("article.editor");
    const editorContent = main.querySelector("article.editor");
    if (editorContent.innerHTML !== updatedContent.innerHTML) {
        editorContent.innerHTML = updatedContent.innerHTML;
        intiailiseEditorSurfaceContent(editorContent);
    }
    updateSelectionDisplay();

}

function initialiseEditor(main) {

    const editorSurface = main.querySelector("article.editor");
    makeDraggable(editorSurface);
    intiailiseEditorSurfaceContent(editorSurface);
    updateSelectionDisplay();

    const menuSurface = main.querySelector("nav.editor");
    menuSurface.querySelector("button.send-to-front-note").addEventListener("click", e =>
        selectionState.id && send(noteSentToFront, { id: selectionState.id }));
    menuSurface.querySelector("button.send-to-back-note").addEventListener("click", e =>
        selectionState.id && send(noteSentToBack, { id: selectionState.id }));
    menuSurface.querySelector("button.delete-note").addEventListener("click", e =>
        selectionState.id && send(noteDeleted, { id: selectionState.id }));
    menuSurface.querySelector("button.fit")?.addEventListener("click", e =>
        zoomToFit(editorSurface, window.innerWidth - 20, window.innerHeight - 20));
    menuSurface.querySelector("button.fit-width")?.addEventListener("click", e =>
        zoomToFit(editorSurface, window.innerWidth - 20, Number.POSITIVE_INFINITY));
    menuSurface.querySelector("button.fit-height")?.addEventListener("click", e =>
        zoomToFit(editorSurface, Number.POSITIVE_INFINITY, window.innerHeight - 20));

    zoomToFit(editorSurface, window.innerWidth - 20, window.innerHeight - 20);
    editorSurface.addEventListener("dblclick", e => {

        if (e.target.classList.contains("note")) {

            const note = e.target;
            const updated = prompt("Content", note.textContent);
            note.textContent = updated;
            send(noteModified, {
                id: note.dataset.id,
                content: { text: updated }
            });

        } else {

            const content = prompt("Content");
            if (!content) return;
            const note = document.createElement("DIV");
            note.className = "note";
            note.textContent = content;
            note.style.visibility = "hidden";
            editorSurface.appendChild(note);

            const rect = editorSurface.getBoundingClientRect();
            const zoom = rect.width / editorSurface.offsetWidth;
            const left = snapX((e.clientX - rect.left - (note.offsetWidth / 2)) / zoom);
            const top = snapY((e.clientY - rect.top - (note.offsetHeight / 2)) / zoom);
            note.style.left = `${left}px`;
            note.style.top = `${top}px`;

            send(noteAdded, {
                top: note.offsetTop,
                left: note.offsetLeft,
                content: { text: content }
            });

        }

    });
}

let snapXsize = 10;
let snapYsize = 10;
function intiailiseEditorSurfaceContent(editorSurface) {
    for (const note of editorSurface.querySelectorAll(".note")) {
        makeDraggable(note);
    }
}

function snapX(coord) {
    return Math.round(coord / snapXsize) * snapXsize;
}

function snapY(coord) {
    return Math.round(coord / snapYsize) * snapYsize;
}

function parseOr(maybeJSON, alt) {
    try {
        return JSON.parse(maybeJSON) || alt;
    } catch (err) {
        return alt;
    }
}

let selectionState;
loadSelectionState(true);

export function loadSelectionState(forceReload = false) {
    if (forceReload) {
        selectionState = parseOr(sessionStorage.getItem("selection-state"), {});
    }
    return selectionState;
}
export function saveSelectionState(obj) {
    obj = obj || selectionState;
    sessionStorage.setItem("selection-state", JSON.stringify(obj));
    selectionState = obj;
}

function selectById(id) {

    selectionState.id = id;
    saveSelectionState();
    updateSelectionDisplay();

}

function updateSelectionDisplay() {

    const previously = Array.from(document.querySelectorAll(".note.selected"));
    previously.forEach(note => note.classList.remove("selected"));
    const selected = document.querySelector(`[data-id="${selectionState.id}"]`);
    if (!selected) return;
    selected.classList.add("selected");

}

function makeDraggable(draggable) {

    const state = {
        moving: false
    };
    draggable.addEventListener("mousedown", e => {

        if (e.target.classList.contains("note"))
            selectById(e.target.dataset.id);
        else
            selectById(null);

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
        document.body.addEventListener("mousemove", handleMouseMove);
        document.body.addEventListener("mouseup", handleMouseUp);
    });

    function handleMouseMove(e) {
        const { moving } = state;
        if (moving) {
            const dx = e.clientX - moving.mouseStart.clientX;
            const dy = e.clientY - moving.mouseStart.clientY;
            const x = snapX((moving.elementStart.offsetLeft * moving.zoom + dx) / moving.zoom);
            const y = snapY((moving.elementStart.offsetTop * moving.zoom + dy) / moving.zoom);
            draggable.style.left = `${x}px`;
            draggable.style.top = `${y}px`;
        }
    }

    function handleMouseUp() {
        if (state.moving) {
            document.body.removeEventListener("mouseup", handleMouseUp);
            document.body.removeEventListener("mousemove", handleMouseMove);
            if (draggable.classList.contains("note")) {
                send(noteModified, {
                    id: draggable.dataset.id,
                    top: draggable.offsetTop,
                    left: draggable.offsetLeft,
                    content: { text: draggable.textContent }
                });
            }
            state.moving = false;
        }
    }

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
