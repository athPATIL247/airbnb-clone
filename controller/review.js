const Review = require("../models/review.js");
const Listing = require("../models/listing.js");

module.exports.createReview = async (req, res) => {
    let listing = await Listing.findById(req.params.id).populate("reviews");
    if (!listing) {
        req.flash("error", "Listing you requested for doesn't exist");
        return res.redirect("/");
    }
    if (listing.owner && listing.owner.equals(req.user._id)) {
        req.flash("error", "You can't review your own listing");
        return res.redirect(`/listings/${listing._id}`);
    }
    const already = await Review.findOne({ _id: { $in: listing.reviews }, author: req.user._id });
    if (already) {
        req.flash("error", "You've already reviewed this stay");
        return res.redirect(`/listings/${listing._id}`);
    }

    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    await newReview.save();
    listing.reviews.push(newReview._id);
    await listing.save();
    req.flash("success", "Review added");
    res.redirect(`/listings/${listing._id}`);
};

module.exports.destroyReview = async (req, res) => {
    let { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review deleted");
    res.redirect(`/listings/${id}`);
};
