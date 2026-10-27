const { test } = require("node:test");
const assert = require("node:assert/strict");
const { firstString, escapeRegex, cleanSearch, searchRegex, toNumber } = require("../utils/query.js");
const { serializeSession, unserializeSession } = require("../utils/sessionSerialization.js");

test("firstString picks the first array value", () => {
    assert.equal(firstString(["a", "b"]), "a");
    assert.equal(firstString("x"), "x");
});

test("escapeRegex escapes metacharacters", () => {
    assert.equal(escapeRegex("(["), "\\(\\[");
});

test("cleanSearch trims, stringifies, and caps length", () => {
    assert.equal(cleanSearch("  goa  "), "goa");
    assert.equal(cleanSearch(["a", "b"]), "a");
    assert.equal(cleanSearch("x".repeat(100)).length, 80);
});

test("searchRegex is safe for Mongo $regex", () => {
    assert.equal(searchRegex("(["), "\\(\\[");
});

test("toNumber handles arrays and invalid values", () => {
    assert.equal(toNumber("12"), 12);
    assert.equal(Number.isNaN(toNumber("nope")), true);
    assert.equal(toNumber(["8"]), 8);
});

test("session deserialization accepts JSON and object records", () => {
    const session = { cookie: { maxAge: 1000 }, user: "user-id" };
    assert.deepEqual(unserializeSession(serializeSession(session)), session);
    assert.deepEqual(unserializeSession(session), session);
});

test("session deserialization treats corrupt records as missing sessions", () => {
    assert.equal(unserializeSession("[object Object]"), null);
    assert.equal(unserializeSession("not-json"), null);
});
