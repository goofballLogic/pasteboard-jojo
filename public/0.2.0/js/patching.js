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

export async function keywiseUpdate(ref, patch) {

    const keywisePatch = Object.fromEntries(asKeys(patch));
    console.log(keywisePatch);
    await ref.update(keywisePatch);

}