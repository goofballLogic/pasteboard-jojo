export default function merge(target, source) {
    Object.entries(source).forEach(([key, val]) => {
        if (Array.isArray(val))
            throw new Error("Array");
        if (val && typeof val === "object") {
            target[key] = target[key] || {};
            merge(target[key], val);
        } else {
            target[key] = val;
        }
    });
    return target;
}
