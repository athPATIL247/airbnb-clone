const CATEGORIES = [
    "Trending",
    "Rooms",
    "Iconic cities",
    "Beach",
    "Arctic",
    "Cabins",
    "Lakefront",
    "Mountains",
    "Castles",
    "Farms",
    "Amazing pools"
];

const PROPERTY_TYPES = ["home", "apartment", "villa", "cabin", "room"];

const DEFAULT_AMENITIES = [
    "Kitchen",
    "Wifi",
    "Dedicated workspace",
    "Free parking on premises",
    "TV",
    "Air conditioning",
    "Washer",
    "Hair dryer",
    "Hot water",
    "Self check-in"
];

const AMENITY_ICONS = {
    Kitchen: "fa-utensils",
    Wifi: "fa-wifi",
    "Dedicated workspace": "fa-laptop",
    "Free parking on premises": "fa-car",
    Pool: "fa-water-ladder",
    "Hot tub": "fa-hot-tub-person",
    "Pets allowed": "fa-paw",
    "Exterior security cameras on property": "fa-video",
    "Carbon monoxide alarm": "fa-triangle-exclamation",
    "Smoke alarm": "fa-bell",
    TV: "fa-tv",
    "Air conditioning": "fa-snowflake",
    "Ceiling fan": "fa-fan",
    Washer: "fa-shirt",
    "Hair dryer": "fa-temperature-high",
    "Hot water": "fa-bath",
    "Bed linen": "fa-bed",
    "Luggage dropoff allowed": "fa-suitcase-rolling",
    "Self check-in": "fa-key",
    Lift: "fa-elevator"
};

const PLACEHOLDER_IMAGE = "/images/placeholder.svg";

const TOPIC_CHIPS = [
    { id: "cleanliness", label: "Cleanliness", icon: "fa-spray-can-sparkles", re: /clean|spotless|tidy/i },
    { id: "location", label: "Location", icon: "fa-location-dot", re: /location|near|walk|beach|view/i },
    { id: "hospitality", label: "Hospitality", icon: "fa-heart", re: /host|helpful|friendly|responsive|welcom/i },
    { id: "comfort", label: "Comfort", icon: "fa-couch", re: /comfort|cozy|cosy|bed|quiet|peace/i },
    { id: "value", label: "Value", icon: "fa-tag", re: /value|price|worth|cheap|affordable/i },
    { id: "amenities", label: "Amenities", icon: "fa-wifi", re: /pool|wifi|kitchen|parking|ac|tub/i }
];

function transformUrl(url, t) {
    if (!url) return PLACEHOLDER_IMAGE;
    if (t && url.includes("res.cloudinary.com") && url.includes("/upload/")) {
        return url.replace("/upload/", "/upload/" + t + "/");
    }
    return url;
}

function coverUrl(listing) {
    let url = "";
    if (listing && listing.images && listing.images.length && listing.images[0].url) {
        url = listing.images[0].url;
    } else if (listing && listing.image && listing.image.url) {
        url = listing.image.url;
    }
    return transformUrl(url, "w_800,q_auto,f_auto") || PLACEHOLDER_IMAGE;
}

function listingPhotos(listing) {
    if (listing && listing.images && listing.images.length) {
        return listing.images.map((img) => img.url).filter(Boolean);
    }
    if (listing && listing.image && listing.image.url) return [listing.image.url];
    return [PLACEHOLDER_IMAGE];
}

function reviewStats(reviews) {
    const list = reviews || [];
    const count = list.length;
    const avg = count ? list.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count : 0;
    return {
        count,
        avg,
        avgText: count ? avg.toFixed(1) : "",
        isFav: count >= 5 && avg >= 4.7
    };
}

function amenityIcon(name) {
    return AMENITY_ICONS[name] || "fa-check";
}

module.exports = {
    CATEGORIES,
    PROPERTY_TYPES,
    DEFAULT_AMENITIES,
    AMENITY_ICONS,
    PLACEHOLDER_IMAGE,
    TOPIC_CHIPS,
    coverUrl,
    listingPhotos,
    reviewStats,
    amenityIcon
};
