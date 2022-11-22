export function renderBoardDisplay(data) {

    return data.notes ? ordered(Object.entries(data.notes)).map(note).join("") : "";

}

function ordered(nodeEntries) {
    return nodeEntries.sort((a, b) => (a[1].zIndex || 0) - (b[1].zIndex || 0));
}

function note([id, noteModel]) {

    const { left, top, content } = noteModel;
    return `

        <div data-id="${id}" class="note" style="left: ${left}px; top: ${top}px;">${content?.text || "???"}</div>

    `;

}
