function firstString(value) {
    if (Array.isArray(value)) value = value[0];
    if (value == null) return "";
    return String(value);
}

function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanSearch(value, max = 80) {
    return firstString(value).trim().slice(0, max);
}

function searchRegex(value, max = 80) {
    return escapeRegex(cleanSearch(value, max));
}

function toNumber(value) {
    if (Array.isArray(value)) value = value[0];
    if (value === undefined || value === null || value === "") return NaN;
    const n = Number(value);
    return Number.isFinite(n) ? n : NaN;
}

module.exports = { firstString, escapeRegex, cleanSearch, searchRegex, toNumber };
