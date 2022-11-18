export function renderBoardDisplay(data) {

    return data.notes ? Object.entries(data.notes).map(note).join("") : "";

}

function note([id, noteModel]) {

    const { left, top, content } = noteModel;
    return `

        <div data-id="${id}" class="note" style="left: ${left}px; top: ${top}px;">${content?.text || "???"}</div>

    `;

}
