process.env.NODE_ENV = "test";
process.env.ATLASDB_URL = "mongodb://127.0.0.1:27017/instalodge_test";
process.env.SECRET = "test-secret";
process.env.MAP_TOKEN = "pk.test";

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const Booking = require("../models/booking.js");
Booking.find = () => ({ select: async () => [] });

const sample = {
    _id: "00000000000000000000000a",
    title: "Test stay",
    description: "A place",
    price: 1000,
    location: "Goa",
    country: "India",
    category: "Beach",
    image: { url: "/images/placeholder.svg" },
    images: [],
    reviews: [],
    owner: { _id: "00000000000000000000000b", username: "host", equals(id) { return String(this._id) === String(id); } },
    geometry: { type: "Point", coordinates: [73.8, 15.5] }
};

function listingChain(docs) {
    const chain = {
        populate() { return chain; },
        limit() { return chain; },
        select() { return chain; },
        then(res, rej) { return Promise.resolve(docs).then(res, rej); }
    };
    return chain;
}
Listing.find = function (query) {
    if (query && query.$or && query.$or[0] && query.$or[0].title && String(query.$or[0].title.$regex).includes("(")) {
        return listingChain([]);
    }
    return listingChain([sample]);
};
Listing.countDocuments = async () => 1;
Listing.findById = async (id) => {
    if (String(id) === "000000000000000000000000") return null;
    const doc = { ...sample, populate() { return this; } };
    doc.populate = async function () { return doc; };
    return {
        ...sample,
        populate: async function () { return this; }
    };
};

function wrapFindById() {
    Listing.findById = function (id) {
        const missing = String(id) === "000000000000000000000000";
        const doc = missing ? null : {
            ...sample,
            reviews: [],
            async save() {},
            populate: function () { return this; }
        };
        const chain = {
            populate() { return chain; },
            then(res, rej) { return Promise.resolve(doc).then(res, rej); }
        };
        return chain;
    };
}
wrapFindById();

Review.findOne = async () => null;
Review.deleteMany = async () => {};

let server;
let base;

before(async () => {
    const app = require("../app.js");
    await new Promise((resolve) => {
        server = http.createServer(app);
        server.listen(0, "127.0.0.1", resolve);
    });
    const { port } = server.address();
    base = `http://127.0.0.1:${port}`;
});

after(async () => {
    await new Promise((resolve) => server.close(resolve));
});

function get(path) {
    return new Promise((resolve, reject) => {
        http.get(base + path, (res) => {
            const chunks = [];
            res.on("data", (c) => chunks.push(c));
            res.on("end", () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    location: res.headers.location || "",
                    body: Buffer.concat(chunks).toString("utf8")
                });
            });
        }).on("error", reject);
    });
}

test("GET / is the home page (200)", async () => {
    const res = await get("/");
    assert.equal(res.status, 200);
    assert.match(res.body, /Explore stays|Airbnb|listing-grid|No stays to show yet|No exact matches/);
    assert.match(res.body, /src="\/images\/logo\.png" alt="Airbnb"/);
    assert.match(res.body, /href="\/favicon\.svg" type="image\/svg\+xml"/);
    assert.match(res.body, /Become a host/);
    assert.doesNotMatch(res.body, /InstaLodge/);
});

test("GET /listings is 200", async () => {
    const res = await get("/listings");
    assert.equal(res.status, 200);
});

test("GET /listings?search=goa is 200", async () => {
    const res = await get("/listings?search=goa");
    assert.equal(res.status, 200);
});

test("GET /listings?search=([ is 200", async () => {
    const res = await get("/listings?search=" + encodeURIComponent("(["));
    assert.equal(res.status, 200);
    assert.doesNotMatch(res.body, /Cast to ObjectId/);
});

test("GET /listings?search=a&search=b is 200", async () => {
    const res = await get("/listings?search=a&search=b");
    assert.equal(res.status, 200);
});

test("GET /listings?category=Beach is 200", async () => {
    const res = await get("/listings?category=Beach");
    assert.equal(res.status, 200);
});

test("GET /listings/:id renders the listing detail page", async () => {
    const res = await get("/listings/00000000000000000000000a");
    assert.equal(res.status, 200);
    assert.match(res.body, /What this place offers/);
    assert.match(res.body, /Where you/);
    assert.doesNotMatch(res.body, /Something went wrong on our side/);
});

test("GET /listings/abc is 404 without raw mongoose text", async () => {
    const res = await get("/listings/abc");
    assert.equal(res.status, 404);
    assert.doesNotMatch(res.body, /Cast to ObjectId/);
});

test("GET /listings/000000000000000000000000 redirects", async () => {
    const res = await get("/listings/000000000000000000000000");
    assert.equal(res.status, 302);
});

test("GET /listings/new redirects to login", async () => {
    const res = await get("/listings/new");
    assert.equal(res.status, 302);
    assert.match(res.location, /login/);
});

test("GET /nope is 404", async () => {
    const res = await get("/nope");
    assert.equal(res.status, 404);
});

test("GET /favicon.ico is 200", async () => {
    const res = await get("/favicon.ico");
    assert.equal(res.status, 200);
    assert.match(res.headers["content-type"], /image\/svg\+xml/);
});

test("static pages return 200", async () => {
    for (const p of ["/help", "/privacy", "/terms", "/sitemap", "/cancellation", "/safety", "/careers", "/newsroom", "/hosting", "/community"]) {
        const res = await get(p);
        assert.equal(res.status, 200, p);
        assert.doesNotMatch(res.body, /href="#"/);
    }
});
