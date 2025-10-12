const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in environment");
  }

  // Avoid strictQuery deprecation warnings; adjust as needed
  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(uri, {
      // modern mongoose uses a simplified connect API
      // keep options minimal; defaults are fine in v7/v8
      dbName: process.env.DB_NAME || process.env.MONGODB_DB || undefined,
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    throw err;
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected");
  });
}

module.exports = { connectDB };
