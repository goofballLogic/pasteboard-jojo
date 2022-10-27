import { updateEditor } from "./editor.js";
import id from "./id.js";
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

function processNoteEvent(board, boardEventName, eventData, note) {
    const mergeData = {};
    processEvent(eventData, note, mergeData);
    board.events = board.events || [];
    board.events.push({ id: note.id, [boardEventName]: mergeData });
}

export async function loadFromStore(app, board, boardId) {
    const db = firebase.firestore(app);
    board.ref = db.collection("boards").doc(boardId);
    board.data = (await board.ref.get()).data();
}

export async function saveToStore(app, board) {
    const notes = {};
    const patch = { notes };
    for (const evt of board.events) {
        add(evt["add-note"], evt);
        add(evt["merge-note"], evt);
    };
    console.log(patch);
    await keywiseUpdate(board.ref, patch);

    function add(data, evt) {
        if (data) {
            if (!(evt.id in notes))
                notes[evt.id] = { id: evt.id };
            merge(notes[evt.id], data);
        }
    }
}

const x = {
    "hello": "world",
    "goodbye": {
        "heaven": 42,
        "or": {
            "hegel": "thanks"
        }
    }
};

console.log(Object.fromEntries(asKeys(x)));

function asKeys(obj) {
    return Object.entries(obj).reduce((agg, [key, val]) => {
        if (Array.isArray(val))
            throw new Error("Array");
        if (val && typeof val === "object") {
            return [
                ...agg,
                ...asKeys(val).map(([innerKey, innerVal]) => [`${key}.${innerKey}`, innerVal])
            ];
        }
        return [
            ...agg,
            [key, val]
        ];
    }, []);
}

async function keywiseUpdate(ref, patch) {

    const keywisePatch = Object.fromEntries(asKeys(patch));
    console.log(keywisePatch);
    await ref.update(keywisePatch);

}

export function modifyNote(board, eventData) {
    if (!board?.data) {
        throw new Error("Failed to updated modified note (BMN-NBD)");
    }
    const notes = board.data.notes = board.data.notes || {};
    const id = eventData.id;
    if (!notes) {
        throw new Error(`Failed to update modified note (BMN-NNN:${id})`);
    } else {
        const note = notes[id];
        if (!note) {
            throw new Error(`Failed to update modified note (BMN-NN:${id})`);
        }
        processNoteEvent(board, "merge-note", eventData, note);
    }
}

export function addNote(board, eventData) {
    if (!(board?.data)) {
        throw new Error("Failed to add note (BAN-NBD");
    } else {
        const notes = board.data.notes = board.data.notes || {};
        const note = { id: id("note") };
        notes[note.id] = note;
        processNoteEvent(board, "add-note", eventData, note);
    }
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