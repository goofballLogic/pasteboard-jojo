import { deleteFieldValue } from "../../integration.js";

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
        if (val === undefined) {
            return [
                ...agg,
                [key, deleteFieldValue]
            ]
        }
        return [
            ...agg,
            [key, val]
        ];
    }, []);
}

export function keywiseUpdate(patch) {

    return decorateDeletions(Object.fromEntries(asKeys(patch)));

}

function decorateDeletions(patch) {
    Object.keys(patch).forEach(key => {
        if (key.endsWith(".deleted")) {
            delete patch[key];
            patch[key.replace(/\.deleted$/, "")] = deleteFieldValue;
        }
    });
    return patch;
}
