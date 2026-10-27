function serializeSession(session) {
    return JSON.stringify(session);
}

function unserializeSession(value) {
    if (typeof value === "string") {
        try {
            value = JSON.parse(value);
        } catch {
            return null;
        }
    }

    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return value;
}

module.exports = { serializeSession, unserializeSession };