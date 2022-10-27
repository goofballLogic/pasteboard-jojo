const sessionId = Math.random().toString().substring(2);
let index = 0;
export default function (prefix = "") {
    return `${prefix}_${sessionId}_${Date.now()}_${++index}`;
}