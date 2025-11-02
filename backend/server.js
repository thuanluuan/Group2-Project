// server.js (hoặc src/index.js)
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const app = express();

// CORS: cho phép domain Vercel của bạn
app.use(cors({
  origin: ["https://group2-project-taupe.vercel.app"],
  credentials: true,
}));

// Healthcheck để Railway kiểm tra
app.get("/", (_req, res) => res.send("API OK"));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// LUÔN lắng nghe PORT do Railway cấp (không hardcode)
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server listening on", PORT);
});

// Kết nối Mongo KHÔNG chặn server
const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 8000 })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("Mongo error:", err.message));

// Log lỗi không làm die tiến trình
process.on("unhandledRejection", err => console.error("unhandledRejection:", err));
process.on("uncaughtException",  err => console.error("uncaughtException:",  err));

require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const { connectDB } = require("./config/db");
const cookieParser = require('cookie-parser');
// Debug log for development configuration
const DEBUG_RETURN_OTP = String(process.env.DEBUG_RETURN_OTP || "").toLowerCase() === "true";
console.log(`[cfg] DEBUG_RETURN_OTP=${DEBUG_RETURN_OTP}`);

const app = express();
// Allow credentials for refresh-token cookies
app.use(cors({
  origin: (origin, cb) => cb(null, true),
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use("/", require("./routes/user"));
app.use("/", require("./routes/auth"));
app.use("/", require("./routes/logs"));
// serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// upload endpoints
app.use('/', require('./routes/upload'));

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () =>
      console.log(`🚀 Backend running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌ Failed to start server due to DB error");
    process.exit(1);
  }
})();
