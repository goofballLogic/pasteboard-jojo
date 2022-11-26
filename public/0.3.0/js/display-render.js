export function renderBoardDisplay(data) {

    if (typeof data === "undefined")
        return `<div class="invalid">Display not registered</div>`;

    if (!data)
        return `

            <img class="empty-placeholder" src="./svg/wireless.svg">
            <div class="empty">Awaiting configuration...</div>
        `

    return data.notes
        ? ordered(Object.entries(data.notes)).map(note).join("")
        : "";

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
