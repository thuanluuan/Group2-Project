const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const authUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email is invalid"],
    },
    dob: { type: Date, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    password: { type: String, required: true, minlength: 6 },
  address: { type: String, trim: true, maxlength: 200 },
  phone: { type: String, trim: true, maxlength: 20 },
  avatarUrl: { type: String, trim: true },
  // Password reset OTP fields
  resetOtp: { type: String, select: false },
  resetOtpExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

authUserSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

authUserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Enforce single admin in the collection
authUserSchema.index({ role: 1 }, { unique: true, partialFilterExpression: { role: "admin" } });

module.exports = mongoose.model("AuthUser", authUserSchema);
