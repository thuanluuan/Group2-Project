const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AuthUser",
      required: false, // Có thể null cho các hoạt động không cần auth
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      index: true,
    },
    userName: {
      type: String,
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    status: {
      type: String,
      enum: ["success", "failed", "error"],
      default: "success",
    },
    message: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true, // Tự động tạo createdAt và updatedAt
  }
);

// Index để tối ưu query
logSchema.index({ createdAt: -1 });
logSchema.index({ userId: 1, createdAt: -1 });
logSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model("Log", logSchema);
