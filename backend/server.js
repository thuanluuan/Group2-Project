require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/", require("./routes/user"));
app.use("/", require("./routes/auth"));

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
