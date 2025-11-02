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
