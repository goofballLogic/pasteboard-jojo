export const noteModified = Symbol("Note modified");
export const noteAdded = Symbol("Note added");

const messages = {
    [noteModified]: "pbj:note-modified",
    [noteAdded]: "pbj:note-added"
};

export function send(messageType, detail) {
    const eventName = lookup(messageType);
    document.dispatchEvent(new CustomEvent(eventName, { detail }));
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

