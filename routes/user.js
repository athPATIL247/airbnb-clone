const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const rateLimit = require("express-rate-limit");
const { saveRedirectUrl, isLoggedIn } = require("../middleware.js");
const userController = require("../controller/user.js");

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        req.flash("error", "Too many attempts. Please try again in a few minutes.");
        const dest = req.path.includes("signup") ? "/signup" : "/login";
        res.redirect(dest);
    }
});

router.route("/signup")
    .get(userController.renderSignupForm)
    .post(authLimiter, wrapAsync(userController.signup));

router.route("/login")
    .get(userController.renderLoginForm)
    .post(
        authLimiter,
        saveRedirectUrl,
        (req, res, next) => {
            passport.authenticate("local", (err, user, info) => {
                if (err) return next(err);
                if (!user) {
                    req.flash("error", (info && info.message) || "Invalid username or password");
                    req.session.formData = { username: req.body.username };
                    return res.redirect("/login");
                }
                req.logIn(user, (loginErr) => {
                    if (loginErr) return next(loginErr);
                    return userController.login(req, res);
                });
            })(req, res, next);
        }
    );

router.get("/logout", (req, res) => res.redirect("/"));
router.post("/logout", userController.logout);

router.post("/wishlist/:id", (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ login: `/login` });
    }
    next();
}, wrapAsync(userController.toggleWishlist));
router.get("/wishlists", isLoggedIn, wrapAsync(userController.wishlists));
router.get("/trips", isLoggedIn, wrapAsync(userController.trips));

module.exports = router;
