const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'AuthUser', index: true, required: true },
    tokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date },
    jti: { type: String, index: true },
    userAgent: { type: String },
    ip: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
