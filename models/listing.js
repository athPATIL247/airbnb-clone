const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");
const { CATEGORIES, PROPERTY_TYPES, DEFAULT_AMENITIES } = require("../utils/amenities.js");

const imageSchema = new Schema({
    url: String,
    filename: String
});

const listingSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    image: imageSchema,
    images: [imageSchema],
    price: Number,
    location: String,
    country: String,
    category: {
        type: String,
        enum: CATEGORIES,
        default: "Trending"
    },
    propertyType: {
        type: String,
        enum: PROPERTY_TYPES,
        default: "home"
    },
    guests: { type: Number, default: 3 },
    bedrooms: { type: Number, default: 1 },
    beds: { type: Number, default: 1 },
    bathrooms: { type: Number, default: 1 },
    amenities: { type: [String], default: () => [...DEFAULT_AMENITIES] },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    geometry: {
        type: {
            type: String,
            enum: ["Point"],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    }
});

listingSchema.virtual("coverImage").get(function () {
    if (this.images && this.images.length && this.images[0].url) return this.images[0];
    return this.image || {};
});

listingSchema.set("toJSON", { virtuals: true });
listingSchema.set("toObject", { virtuals: true });

listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
