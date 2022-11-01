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
                [key, firebase.firestore.FieldValue.delete()]
            ]
        }
        return [
            ...agg,
            [key, val]
        ];
    }, []);
}

export async function keywiseUpdate(ref, patch) {

    const keywisePatch = Object.fromEntries(asKeys(patch));
    await withPending(() => ref.update(keywisePatch), "Saving...");

}
