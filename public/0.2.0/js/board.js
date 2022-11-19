import id from "./id.js";
import { keywiseUpdate } from "./patching.js";
import merge from "./merge.js";
import { withPending } from "./status.js";
import { collections } from "../../integration.js";

export async function fetchBoardMetadata(model) {
    const boardIds = Object.keys(model?.metadata?.entitlements?.boards || {});
    model.boards = model.boards || {};
    for (const id of boardIds.filter(bid => !(bid in model.boards))) {
        const metadataSnapshot = await withPending(async () =>
            collections.boardMetadata.doc(id).get(), "Loading boards...");
        model.boards[id] = { metadata: metadataSnapshot.data() };
    }
}

function processComponentEvent(board, boardEventName, id, eventData, component) {
    const mergeData = {};
    if (eventData) {
        if (eventData.deleted) {
            mergeData.deleted = eventData.deleted;
        }
        if ("left" in eventData && component.left !== eventData.left) {
            mergeData.left = eventData.left;
            component.left = mergeData.left;
        }
        if ("top" in eventData && eventData.top !== component.top) {
            mergeData.top = eventData.top;
            component.top = mergeData.top;
        }
        if ("content" in eventData && eventData.content.text !== component.content?.text) {
            mergeData.content = mergeData.content || {};
            mergeData.content.text = eventData.content.text;
            component.content = component.content || {};
            component.content.text = eventData.content.text;
        }

    }
    board.events = board.events || [];
    board.events.push({ id, [boardEventName]: mergeData });
}

export async function loadFromStore(board, boardId) {
    board.ref = collections.boards.doc(boardId);
    await withPending(async () => {

        board.data = (await board.ref.get()).data();

    }, "Loading board");
}

export async function saveToStore(board) {

    if (!(board.events?.length)) return;
    const notes = {};
    const displays = {};
    const patch = { notes, displays };
    while (board.events.length) {
        const evt = board.events.shift();
        addNoteEventToPatch(evt["add-note"], evt);
        addNoteEventToPatch(evt["merge-note"], evt);
        addNoteEventToPatch(evt["delete-note"], evt);
        if ("enable-display" in evt) {
            displays[evt.id] = { show: true };
        }
        if ("disable-display" in evt) {
            displays[evt.id] = undefined;
        }
    }
    await keywiseUpdate(board.ref, patch);

    function addNoteEventToPatch(data, evt) {
        if (data) {
            if (!(evt.id in notes))
                notes[evt.id] = {};
            merge(notes[evt.id], data);
        }
    }
}

export function deleteNote(board, eventData) {
    try {
        const noteId = ensureNoteId(eventData);
        const notes = ensureNotes(board, noteId);
        delete notes[noteId];
        processComponentEvent(board, "delete-note", noteId, { deleted: true });
    } catch (err) {
        throw new Error(`Failed to delete note (BDN-${err.message})`);
    }
}

export function modifyNote(board, eventData) {
    try {
        const noteId = ensureNoteId(eventData);
        const notes = ensureNotes(board, noteId);
        const note = notes[noteId];
        if (!note)
            throw new Error(`NN:${noteId})`);
        processComponentEvent(board, "merge-note", noteId, eventData, note);
    } catch (err) {
        throw new Error(`Failed to update modified note (BMN-${err.message})`);
    }
}

function ensureNotes(board, noteId) {
    if (!board?.data)
        throw new Error("NBD");
    const notes = board.data.notes = board.data.notes || {};
    if (!notes)
        throw new Error(`NNN:${noteId})`);
    return notes;
}

function ensureNoteId(eventData) {
    const noteId = eventData.id;
    if (!noteId)
        throw new Error("NID");
    return noteId;
}

export function disableDisplay(board, displayId) {
    if (board?.data && board.data.displays && displayId in board.data.displays) {
        delete board.data.displays[displayId];
    }
    processComponentEvent(board, "disable-display", displayId);
}

export function enableDisplay(board, displayId) {
    if (!(board?.data))
        throw new Error("Failed to enable display (BED-NBD)");
    const displays = board.data.displays = board.data.displays || {};
    displays[displayId] = { scheduled: Date.now() };
    processComponentEvent(board, "enable-display", displayId);
}

export function addNote(board, eventData) {
    if (!(board?.data))
        throw new Error("Failed to add note (BAN-NBD)");
    const notes = board.data.notes = board.data.notes || {};
    const noteId = id("note");
    const note = {};
    notes[noteId] = note;
    processComponentEvent(board, "add-note", noteId, eventData, note);
}

export function aggregateEvents(board) {
    if (!board) {
        throw new Error("Failed to aggregate events (BAE-NB)");
    } else {
        if (Array.isArray(board.events) && board.events.length) {
            board.events = board.events.reduce((agg, evt) => {
                const target = agg.find(x => x.id === evt.id) || {};
                merge(target, evt);
                return [...agg, target];
            }, []);
        }
    }
}