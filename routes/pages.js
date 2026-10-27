const express = require("express");
const router = express.Router();
const pages = require("../controller/pages.js");

["help", "privacy", "terms", "sitemap", "cancellation", "safety", "careers", "newsroom", "hosting", "community"].forEach((slug) => {
    router.get("/" + slug, (req, res, next) => {
        req.params.slug = slug;
        pages.show(req, res, next);
    });
});

module.exports = router;
