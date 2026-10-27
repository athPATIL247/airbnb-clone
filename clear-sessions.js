/**
 * Run once to clear corrupt MongoDB sessions:
 *   node clear-sessions.js
 */
if (process.env.NODE_ENV !== "production") require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.ATLASDB_URL)
  .then(async () => {
    const result = await mongoose.connection.db.collection("sessions").deleteMany({});
    console.log("✓ Deleted", result.deletedCount, "session(s). Safe to restart the server now.");
    process.exit(0);
  })
  .catch(err => { console.error("Error:", err.message); process.exit(1); });
