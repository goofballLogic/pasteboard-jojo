import { deleteFieldValue } from "../../integration.js";
import { withPending } from "./status.js";

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

export async function keywiseUpdate(ref, patch) {

    console.log(patch);
    const keywisePatch = decorateDeletions(Object.fromEntries(asKeys(patch)));
    console.log(keywisePatch);
    await withPending(() => ref.update(keywisePatch), "Saving...");

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
