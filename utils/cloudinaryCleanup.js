const { cloudinary } = require("../cloudConfig.js");

async function destroyFilename(filename) {
    if (!filename) return;
    try {
        await cloudinary.uploader.destroy(filename);
    } catch (err) {
        console.error("Cloudinary destroy failed:", err.message || err);
    }
}

async function destroyListingImages(listing) {
    if (!listing) return;
    const names = [];
    if (listing.image && listing.image.filename) names.push(listing.image.filename);
    (listing.images || []).forEach((img) => {
        if (img && img.filename) names.push(img.filename);
    });
    const unique = [...new Set(names)];
    await Promise.all(unique.map(destroyFilename));
}

module.exports = { destroyFilename, destroyListingImages };
