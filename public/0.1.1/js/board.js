import id from "./id.js";
import { keywiseUpdate } from "./patching.js";
import merge from "./merge.js";

function processEvent(eventData, note, mergeData) {
    if ("left" in eventData && note.left !== eventData.left) {
        mergeData.left = eventData.left;
        note.left = mergeData.left;
    }
    if ("top" in eventData && eventData.top !== note.top) {
        mergeData.top = eventData.top;
        note.top = mergeData.top;
    }
    if ("content" in eventData && eventData.content.text !== note.content?.text) {
        mergeData.content = mergeData.content || {};
        mergeData.content.text = eventData.content.text;
        note.content = note.content || {};
        note.content.text = eventData.content.text;
    }
}

function processNoteEvent(board, boardEventName, noteId, eventData, note) {
    const mergeData = {};
    processEvent(eventData, note, mergeData);
    board.events = board.events || [];
    board.events.push({ id: noteId, [boardEventName]: mergeData });
}

export async function loadFromStore(app, board, boardId) {
    const db = firebase.firestore(app);
    board.ref = db.collection("boards").doc(boardId);
    board.data = (await board.ref.get()).data();
}

export async function saveToStore(app, board) {

    if (!(board.events?.length)) return;
    const notes = {};
    const patch = { notes };
    while (board.events.length) {
        const evt = board.events.shift();
        add(evt["add-note"], evt);
        add(evt["merge-note"], evt);
    }
    await keywiseUpdate(board.ref, patch);

    function add(data, evt) {
        if (data) {
            if (!(evt.id in notes))
                notes[evt.id] = {};
            merge(notes[evt.id], data);
        }
    }
}

export function modifyNote(board, eventData) {
    try {
        const noteId = eventData.id;
        if (!noteId)
            throw new Error("NID");
        if (!board?.data)
            throw new Error("NBD");
        const notes = board.data.notes = board.data.notes || {};
        if (!notes)
            throw new Error(`NNN:${noteId})`);
        const note = notes[noteId];
        if (!note)
            throw new Error(`NN:${noteId})`);
        processNoteEvent(board, "merge-note", noteId, eventData, note);
    } catch (err) {
        throw new Error(`Failed to update modified note (BMN-${err.message})`);
    }
}

export function addNote(board, eventData) {
    if (!(board?.data))
        throw new Error("Failed to add note (BAN-NBD");
    const notes = board.data.notes = board.data.notes || {};
    const noteId = id("note");
    const note = {};
    notes[noteId] = note;
    processNoteEvent(board, "add-note", noteId, eventData, note);
}

export function aggregateEvents(board) {
    if (!board) {
        throw new Error("Failed to aggregate events (BAE-NB)");
    } else {
        if (Array.isArray(board.events) && board.events.length) {
            board.events = board.events.reduce((agg, evt) => {
                let target = agg.find(x => x.id === evt.id);
                if (!target) {
                    target = {};
                    agg = [...agg, target];
                }
                merge(target, evt);
                return agg;
            }, []);
        }
    }
}