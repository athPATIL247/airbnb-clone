const User = require("../models/user.js");
const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const { coverUrl, reviewStats } = require("../utils/amenities.js");

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs", { title: "Sign up", pageClass: "page-auth", currUser: req.user });
};

module.exports.signup = async (req, res, next) => {
    try {
        let { username, email, password } = req.body;
        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Welcome to Airbnb!");
            const dest = req.session.redirectUrl || "/";
            delete req.session.redirectUrl;
            return res.redirect(dest);
        });
    } catch (err) {
        req.flash("error", err.message);
        req.session.formData = { username: req.body.username, email: req.body.email };
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs", { title: "Log in", pageClass: "page-auth", currUser: req.user });
};

module.exports.login = async (req, res) => {
    req.flash("success", "Welcome to Airbnb! You're logged in!");
    const redirectUrl = res.locals.redirectUrl || "/";
    delete req.session.redirectUrl;
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logOut((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "logged you out!");
        res.redirect("/");
    });
};

module.exports.toggleWishlist = async (req, res) => {
    const user = await User.findById(req.user._id);
    const id = req.params.id;
    const has = user.wishlist.some((w) => String(w) === String(id));
    if (has) user.wishlist.pull(id);
    else user.wishlist.addToSet(id);
    await user.save();
    res.json({ saved: !has });
};

module.exports.wishlists = async (req, res) => {
    const user = await User.findById(req.user._id).populate({
        path: "wishlist",
        populate: [
            { path: "reviews", select: "rating" },
            { path: "owner", select: "username" }
        ]
    });
    const listings = (user.wishlist || []).filter(Boolean).map((listing) => {
        const stats = reviewStats(listing.reviews);
        listing.stats = stats;
        listing.cover = coverUrl(listing);
        return listing;
    });
    res.render("listings/wishlists.ejs", { listings, title: "Wishlists", pageClass: "page-home" });
};

module.exports.trips = async (req, res) => {
    const trips = await Booking.find({ user: req.user._id }).populate("listing").sort({ checkIn: -1 });
    res.render("users/trips.ejs", { trips, coverUrl, title: "Trips", pageClass: "page-home" });
};

module.exports.createBooking = async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
        req.flash("error", "Listing you requested for doesn't exist");
        return res.redirect("/");
    }
    const { checkIn, checkOut, guests } = req.body;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const guestCount = Number(guests);
    if (!(start < end) || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        req.flash("error", "Please choose valid dates");
        return res.redirect(`/listings/${listing._id}`);
    }
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > (Number(listing.guests) || 3)) {
        req.flash("error", "Please choose a valid number of guests");
        return res.redirect(`/listings/${listing._id}`);
    }
    const overlap = await Booking.findOne({
        listing: listing._id,
        checkIn: { $lt: end },
        checkOut: { $gt: start }
    });
    if (overlap) {
        req.flash("error", "Those dates are already booked");
        return res.redirect(`/listings/${listing._id}`);
    }
    const nights = Math.round((end - start) / 86400000);
    const total = Math.round(Number(listing.price) * nights * 1.18);
    await Booking.create({
        listing: listing._id,
        user: req.user._id,
        checkIn: start,
        checkOut: end,
        guests: guestCount,
        total
    });
    req.flash("success", "Reservation confirmed");
    res.redirect("/trips");
};
