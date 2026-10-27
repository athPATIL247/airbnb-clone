const express = require("express");
const router = express.Router({ mergeParams: true });
const mongoose = require("mongoose");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { isLoggedIn, validateReview, isReviewAuthor } = require("../middleware.js");
const reviewController = require("../controller/review.js");

router.use((req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new ExpressError(404, "Page Not Found!"));
    }
    next();
});

router.param("reviewId", (req, res, next, reviewId) => {
    if (!mongoose.isValidObjectId(reviewId)) {
        return next(new ExpressError(404, "Page Not Found!"));
    }
    next();
});

router.post("/", isLoggedIn, validateReview, wrapAsync(reviewController.createReview));
router.delete("/:reviewId", isLoggedIn, isReviewAuthor, wrapAsync(reviewController.destroyReview));

module.exports = router;
