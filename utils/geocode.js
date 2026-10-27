const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

function getClient() {
    const token = process.env.MAP_TOKEN;
    if (!token) {
        throw new Error("MAP_TOKEN is missing");
    }
    return mbxGeocoding({ accessToken: token });
}

async function geocodePlace(location, country) {
    const query = [location, country].filter(Boolean).join(", ").trim();
    if (!query) return null;
    try {
        const response = await getClient().forwardGeocode({ query, limit: 1 }).send();
        const feature = response && response.body && response.body.features && response.body.features[0];
        return feature ? feature.geometry : null;
    } catch (err) {
        console.error("Geocoding failed:", err.message || err);
        return null;
    }
}

module.exports = { geocodePlace };
