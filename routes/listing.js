const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { isLoggedIn, validateListing, isOwner } = require("../middleware.js");
const listingController = require("../controller/listing.js");
const userController = require("../controller/user.js");
const { storage } = require("../cloudConfig.js");

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ok = /image\/(jpeg|jpg|png|webp)/i.test(file.mimetype);
        if (ok) return cb(null, true);
        cb(new Error("LIMIT_FILE_TYPE"));
    }
});

const photos = (req, res, next) => {
    upload.fields([
        { name: "listing[image]", maxCount: 1 },
        { name: "listing[images]", maxCount: 5 }
    ])(req, res, (err) => {
        if (err) {
            req.flash("error", "Image must be a JPG/PNG/WEBP under 5 MB");
            return res.redirect(req.get("Referer") || "/listings/new");
        }
        next();
    });
};

router.param("id", (req, res, next, id) => {
    if (!mongoose.isValidObjectId(id)) {
        return next(new ExpressError(404, "Page Not Found!"));
    }
    next();
});

router.route("/")
    .get(wrapAsync(listingController.index))
    .post(isLoggedIn, photos, validateListing, wrapAsync(listingController.createListing));

router.get("/new", isLoggedIn, listingController.renderNewForm);
router.get("/suggest", wrapAsync(listingController.suggest));
router.get("/count", wrapAsync(listingController.countListings));

router.route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(isLoggedIn, isOwner, photos, validateListing, wrapAsync(listingController.updateListing))
    .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));
router.post("/:id/book", isLoggedIn, wrapAsync(userController.createBooking));

module.exports = router;
