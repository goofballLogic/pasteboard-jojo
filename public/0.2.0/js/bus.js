export const noteModified = Symbol("Note modified");
export const noteAdded = Symbol("Note added");
export const noteDeleted = Symbol("Note deleted");
export const noteSentToBack = Symbol("Note sent to back");
export const noteSentToFront = Symbol("Note sent to front");

const messages = {
    [noteModified]: "pbj:note-modified",
    [noteAdded]: "pbj:note-added",
    [noteDeleted]: "pbj:note-deleted",
    [noteSentToFront]: "pbj:note-sent-to-front",
    [noteSentToBack]: "pbj:note-sent-to-back"
};

export function send(messageType, detail) {
    const eventName = lookup(messageType);
    document.dispatchEvent(new CustomEvent(eventName, { detail }));
    console.log("Sent", eventName, detail);
}

export function receive(messageType, callback) {
    const eventName = lookup(messageType);
    const handler = e => callback(e.detail);
    document.addEventListener(eventName, handler);
    return () => document.removeEventListener(eventName, handler);
}

function lookup(messageType) {
    if (!(messageType in messages))
        throw new Error(`Unrecognised ${messageType}`);
    return messages[messageType];
}

