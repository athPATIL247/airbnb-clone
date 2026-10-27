const crypto = require("crypto");

function deriveSessionEncryptionSecret(secret) {
    if (!secret) throw new Error("SECRET is required to derive the session encryption key");
    const digest = crypto.createHmac("sha512", secret)
        .update("airbnb-stays:connect-mongo-session-encryption")
        .digest("hex");
    return "AaBb09!!" + digest;
}

module.exports = { deriveSessionEncryptionSecret };