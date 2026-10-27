if (process.env.NODE_ENV != "production") {
    require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
}

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const { DEFAULT_AMENITIES } = require("../utils/amenities.js");

const MONGO_URL = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/InstaLodge";

function inferCategory(listing) {
    const t = `${listing.title} ${listing.description} ${listing.location}`.toLowerCase();
    if (/castle/.test(t)) return "Castles";
    if (/arctic|ski|swiss|verbier/.test(t)) return "Arctic";
    if (/farm/.test(t)) return "Farms";
    if (/pool|infinity/.test(t)) return "Amazing pools";
    if (/lake|lakefront/.test(t)) return "Lakefront";
    if (/mountain|cabin|chalet|banff|aspen|montana/.test(t)) return "Mountains";
    if (/beach|ocean|island|maldives|cancun|bali|bungalow|coast/.test(t)) return "Beach";
    if (/loft|downtown|tokyo|boston|miami|new york|apartment/.test(t)) return "Iconic cities";
    if (/room/.test(t)) return "Rooms";
    if (/cabin|treehouse|cottage/.test(t)) return "Cabins";
    return "Trending";
}

function inferType(listing) {
    const t = `${listing.title} ${listing.description}`.toLowerCase();
    if (/apartment|loft|penthouse/.test(t)) return "apartment";
    if (/villa/.test(t)) return "villa";
    if (/cabin|chalet|treehouse/.test(t)) return "cabin";
    if (/room/.test(t)) return "room";
    return "home";
}

async function main() {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to DB");

    let ownerId = process.env.OWNER_ID;
    if (ownerId && !mongoose.isValidObjectId(ownerId)) {
        console.warn("OWNER_ID is not a valid ObjectId; ignoring");
        ownerId = null;
    }
    if (!ownerId) {
        let demo = await User.findOne({ username: "demo" });
        if (!demo) {
            demo = new User({ email: "demo@instalodge.local", username: "demo" });
            await User.register(demo, "demopassword");
        }
        ownerId = demo._id;
    }

    const data = initData.data.map((obj) => {
        const image = obj.image;
        return {
            ...obj,
            owner: ownerId,
            category: inferCategory(obj),
            propertyType: inferType(obj),
            guests: 3,
            bedrooms: 1,
            beds: 1,
            bathrooms: 1,
            amenities: [...DEFAULT_AMENITIES],
            images: image ? [image] : []
        };
    });

    await Listing.deleteMany({});
    await Listing.insertMany(data);
    console.log("Data was initialised");
    await mongoose.connection.close();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
