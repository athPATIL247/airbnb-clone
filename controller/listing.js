const Listing = require("../models/listing");
const Booking = require("../models/booking");
const { geocodePlace } = require("../utils/geocode.js");
const { searchRegex, firstString, toNumber, cleanSearch } = require("../utils/query.js");
const { CATEGORIES, coverUrl, reviewStats, listingPhotos } = require("../utils/amenities.js");
const { destroyFilename, destroyListingImages } = require("../utils/cloudinaryCleanup.js");

function asArray(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}

function uploadedFiles(req) {
    const files = [];
    if (req.files && req.files["listing[images]"]) files.push(...req.files["listing[images]"]);
    if (req.files && req.files["listing[image]"]) files.push(...req.files["listing[image]"]);
    if (req.file) files.push(req.file);
    return files.filter(Boolean);
}

function filesToImages(files) {
    return files.map((f) => ({ url: f.path, filename: f.filename }));
}

function buildQuery(q) {
    const mongo = {};
    const rawSearch = cleanSearch(q.search);
    const regex = searchRegex(q.search);
    const category = firstString(q.category).trim();
    const minPrice = toNumber(q.minPrice);
    const maxPrice = toNumber(q.maxPrice);
    const guests = toNumber(q.guests);

    if (regex) {
        mongo.$or = [
            { title: { $regex: regex, $options: "i" } },
            { country: { $regex: regex, $options: "i" } },
            { location: { $regex: regex, $options: "i" } }
        ];
    }
    if (category && category !== "Trending" && CATEGORIES.includes(category)) {
        mongo.category = category;
    }
    if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
        mongo.price = {};
        if (Number.isFinite(minPrice) && minPrice >= 0) mongo.price.$gte = minPrice;
        if (Number.isFinite(maxPrice) && maxPrice >= 0) mongo.price.$lte = maxPrice;
        if (!Object.keys(mongo.price).length) delete mongo.price;
    }
    if (Number.isFinite(guests) && guests > 1) {
        mongo.$and = (mongo.$and || []).concat([{
            $or: [{ guests: { $gte: guests } }, { guests: { $exists: false } }]
        }]);
    }
    return {
        mongo,
        search: rawSearch,
        category: CATEGORIES.includes(category) ? category : "",
        minPrice: Number.isFinite(minPrice) ? minPrice : "",
        maxPrice: Number.isFinite(maxPrice) ? maxPrice : "",
        guests: Number.isFinite(guests) ? guests : "",
        checkin: firstString(q.checkin),
        checkout: firstString(q.checkout)
    };
}

function withStats(listing) {
    const stats = reviewStats(listing.reviews);
    return Object.assign(listing, {
        stats,
        cover: coverUrl(listing),
        photos: listingPhotos(listing)
    });
}

module.exports.index = async (req, res) => {
    const filters = buildQuery(req.query);
    const allListings = await Listing.find(filters.mongo)
        .populate({ path: "reviews", select: "rating" })
        .populate({ path: "owner", select: "username" });
    const listings = allListings.map(withStats);
    const saved = (req.user && req.user.wishlist || []).map((id) => String(id));
    res.render("listings/index.ejs", {
        allListings: listings,
        search: filters.search,
        category: filters.category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        guests: filters.guests,
        checkin: filters.checkin,
        checkout: filters.checkout,
        saved,
        title: "Explore stays",
        pageClass: "page-home"
    });
};

module.exports.countListings = async (req, res) => {
    const filters = buildQuery(req.query);
    const count = await Listing.countDocuments(filters.mongo);
    res.json({ count });
};

module.exports.suggest = async (req, res) => {
    const q = searchRegex(req.query.q, 80);
    if (!q) return res.json([]);
    const docs = await Listing.find({
        $or: [
            { location: { $regex: q, $options: "i" } },
            { country: { $regex: q, $options: "i" } }
        ]
    }).select("location country").limit(40);
    const seen = new Set();
    const out = [];
    for (const d of docs) {
        const label = [d.location, d.country].filter(Boolean).join(", ");
        if (label && !seen.has(label.toLowerCase())) {
            seen.add(label.toLowerCase());
            out.push(label);
        }
        if (out.length >= 6) break;
    }
    res.json(out);
};

module.exports.renderNewForm = (req, res) => {
    const form = req.session.formData || {};
    delete req.session.formData;
    res.render("listings/new.ejs", { title: "Create a listing", pageClass: "page-form", form, currUser: req.user });
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: { path: "author" }
        })
        .populate("owner");
    if (!listing) {
        req.flash("error", "Listing you requested for doesn't exist");
        return res.redirect("/");
    }

    const nearby = await Listing.find({ _id: { $ne: listing._id } })
        .populate({ path: "reviews", select: "rating" })
        .limit(40);

    nearby.sort((a, b) => {
        const score = (x) => {
            let s = 0;
            if (x.country && listing.country && x.country === listing.country) s += 4;
            if (x.location && listing.location && x.location === listing.location) s += 6;
            if (x.category && listing.category && x.category === listing.category) s += 2;
            return s;
        };
        return score(b) - score(a);
    });

    let hostStats = reviewStats(listing.reviews);
    if (listing.owner) {
        const hostListings = await Listing.find({ owner: listing.owner._id }).populate({
            path: "reviews",
            select: "rating"
        });
        const allReviews = hostListings.flatMap((l) => l.reviews || []);
        hostStats = reviewStats(allReviews);
        hostStats.listingCount = hostListings.length;
    }

    const bookings = await Booking.find({ listing: listing._id }).select("checkIn checkOut");
    const saved = req.user && req.user.wishlist && req.user.wishlist.some((w) => String(w) === String(listing._id));
    const alreadyReviewed = !!(req.user && listing.reviews.some((r) => r.author && r.author._id.equals(req.user._id)));
    const isOwner = !!(req.user && listing.owner && req.user._id.equals(listing.owner._id));

    res.render("listings/show.ejs", {
        listing: withStats(listing),
        nearby: nearby.slice(0, 10).map(withStats),
        hostStats,
        bookings,
        saved,
        alreadyReviewed,
        isOwnerUser: isOwner,
        title: listing.title,
        pageClass: "page-listing"
    });
};

module.exports.createListing = async (req, res) => {
    const files = uploadedFiles(req);
    if (!files.length) {
        req.flash("error", "Please upload at least one image");
        req.session.formData = req.body.listing || {};
        return res.redirect("/listings/new");
    }

    const body = req.body.listing;
    const geometry = await geocodePlace(body.location, body.country);
    if (!geometry) {
        req.flash("error", "We couldn't find that location, please check it");
        req.session.formData = body;
        return res.redirect("/listings/new");
    }

    const images = filesToImages(files).slice(0, 5);
    const newListing = new Listing(body);
    newListing.owner = req.user._id;
    newListing.images = images;
    newListing.image = images[0];
    newListing.geometry = geometry;
    newListing.amenities = asArray(body.amenities);
    await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect("/");
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for doesn't exist");
        return res.redirect("/");
    }
    const form = req.session.formData || {};
    delete req.session.formData;
    res.render("listings/edit.ejs", { listing, form, title: "Edit listing", pageClass: "page-form", currUser: req.user });
};

module.exports.updateListing = async (req, res) => {
    if (!req.body.listing) {
        req.flash("error", "Send valid data for listing");
        return res.redirect("/");
    }
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for doesn't exist");
        return res.redirect("/");
    }

    const body = req.body.listing;
    const locChanged = body.location !== listing.location || body.country !== listing.country;
    listing.title = body.title;
    listing.description = body.description;
    listing.price = body.price;
    listing.location = body.location;
    listing.country = body.country;
    if (body.category) listing.category = body.category;
    if (body.propertyType) listing.propertyType = body.propertyType;
    if (body.guests != null) listing.guests = body.guests;
    if (body.bedrooms != null) listing.bedrooms = body.bedrooms;
    if (body.beds != null) listing.beds = body.beds;
    if (body.bathrooms != null) listing.bathrooms = body.bathrooms;
    if (body.amenities) listing.amenities = asArray(body.amenities);

    if (locChanged) {
        const geometry = await geocodePlace(body.location, body.country);
        if (geometry) listing.geometry = geometry;
        else req.flash("error", "We couldn't find that location, so the map pin was left unchanged");
    }

    const remove = asArray(req.body.removeImages);
    if (remove.length) {
        listing.images = (listing.images || []).filter((img) => !remove.includes(img.filename));
        if (listing.image && remove.includes(listing.image.filename)) {
            listing.image = listing.images[0] || listing.image;
        }
        await Promise.all(remove.map(destroyFilename));
    }

    const files = uploadedFiles(req);
    if (files.length) {
        const incoming = filesToImages(files);
        const oldCover = listing.image && listing.image.filename;
        listing.images = [...(listing.images || []), ...incoming].slice(0, 5);
        listing.image = listing.images[0];
        if (oldCover && listing.image.filename !== oldCover && !(listing.images || []).some((i) => i.filename === oldCover)) {
            await destroyFilename(oldCover);
        }
    }

    if ((!listing.images || !listing.images.length) && listing.image) {
        listing.images = [listing.image];
    }
    if (listing.images && listing.images.length) listing.image = listing.images[0];

    await listing.save();
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for doesn't exist");
        return res.redirect("/");
    }
    await destroyListingImages(listing);
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted!");
    res.redirect("/");
};
