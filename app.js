if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

const requiredEnv = ["ATLASDB_URL", "SECRET", "MAP_TOKEN"];
const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length && process.env.NODE_ENV !== "test") {
    console.error("Missing required environment variable: " + missing.join(", "));
    console.error("Copy .env.example to .env and fill in the keys.");
    process.exit(1);
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const helmet = require("helmet");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const { CATEGORIES, DEFAULT_AMENITIES, amenityIcon } = require("./utils/amenities.js");
const { serializeSession, unserializeSession } = require("./utils/sessionSerialization.js");

const wrapAsync = require("./utils/wrapAsync.js");
const listingController = require("./controller/listing.js");
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/reviews.js");
const userRouter = require("./routes/user.js");
const pagesRouter = require("./routes/pages.js");

const dbUrl = process.env.ATLASDB_URL;
const port = process.env.PORT || 8080;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.join(__dirname, "public/favicon.svg"));
});

const sessionOption = {
    secret: process.env.SECRET || "test-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
    }
};

if (process.env.NODE_ENV !== "test" && dbUrl) {
    const store = MongoStore.create({
        mongoUrl: dbUrl,
        crypto: { secret: process.env.SECRET },
        serialize: serializeSession,
        unserialize: unserializeSession,
        touchAfter: 24 * 3600
    });
    store.on("error", (err) => {
        console.log("ERROR in MONGOSESSION STORE", err);
    });
    sessionOption.store = store;
}

app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
const deserialize = User.deserializeUser();
passport.deserializeUser((id, done) => {
    deserialize(id, (err, user) => {
        if (err) return done(null, false);
        done(null, user || false);
    });
});

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    res.locals.categories = CATEGORIES;
    res.locals.defaultAmenities = DEFAULT_AMENITIES;
    res.locals.amenityIcon = amenityIcon;
    res.locals.search = "";
    next();
});

app.get("/", wrapAsync(listingController.index));

app.use("/", userRouter);
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", pagesRouter);

app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;
    if (statusCode >= 500) {
        console.error(err);
        message = "Something went wrong on our side";
    }
    res.status(statusCode).render("error.ejs", { currUser: req.user,
        message,
        statusCode,
        title: statusCode === 404 ? "Not found" : "Error"
    });
});

async function main() {
    await mongoose.connect(dbUrl);
}

if (require.main === module) {
    main()
        .then(() => {
            console.log("Connected to DB");
            app.listen(port, () => {
                console.log(`Listening on port ${port}`);
            });
        })
        .catch((err) => {
            console.error("Database connection failed:", err.message || err);
            process.exit(1);
        });
}

module.exports = app;
