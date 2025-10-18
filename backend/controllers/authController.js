const AuthUser = require("../models/AuthUser");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "admin@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function register(req, res) {
  try {
    const { name, email, password, dob } = req.body;
    if (!name || !email || !password || !dob)
      return res.status(400).json({ message: "name, email, password and dob required" });

  const existing = await AuthUser.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already exists" });

    const role = ADMIN_EMAILS.includes(String(email).toLowerCase()) ? "admin" : "user";
    if (role === "admin") {
      const existingAdmin = await AuthUser.findOne({ role: "admin" }).lean();
      if (existingAdmin) {
        return res.status(409).json({ message: "Chỉ được phép có một tài khoản admin" });
      }
    }
    const user = await AuthUser.create({ name, email, password, dob, role });
    // return limited user info
  res.status(201).json({ _id: user._id, name: user.name, email: user.email, dob: user.dob, role: user.role });
  } catch (err) {
    console.error("register error:", err);
    if (err.code === 11000) {
      // Could be duplicate email or the admin unique partial index
      return res.status(409).json({ message: "Email đã tồn tại hoặc đã có tài khoản admin" });
    }
    res.status(500).json({ message: "Failed to register" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "email and password required" });

  const user = await AuthUser.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ sub: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { _id: user._id, name: user.name, email: user.email, dob: user.dob, role: user.role } });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ message: "Failed to login" });
  }
}

// Simple logout for clients: instruct client to drop token. No server-side session stored.
function logout(req, res) {
  res.json({ message: "Logged out" });
}

async function me(req, res) {
  try {
    const user = await AuthUser.findById(req.user?.sub, { password: 0 }).lean();
    if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ _id: user._id, name: user.name, email: user.email, dob: user.dob, role: user.role, address: user.address, phone: user.phone, avatarUrl: user.avatarUrl });
  } catch (err) {
    console.error("me error:", err);
    res.status(500).json({ message: "Failed to load profile" });
  }
}

async function updateMe(req, res) {
  try {
  const { name, dob, address, phone, avatarUrl } = req.body;
  const updates = {};
    if (name !== undefined) updates.name = name;
    if (dob !== undefined) updates.dob = dob;
  if (address !== undefined) updates.address = address;
  if (phone !== undefined) updates.phone = phone;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    const user = await AuthUser.findByIdAndUpdate(req.user?.sub, updates, {
      new: true,
      runValidators: true,
      projection: { password: 0 },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ _id: user._id, name: user.name, email: user.email, dob: user.dob, role: user.role, address: user.address, phone: user.phone, avatarUrl: user.avatarUrl });
  } catch (err) {
    console.error("updateMe error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
}

module.exports = { register, login, logout, me, updateMe };
// Delete own account (non-admin)
async function deleteMe(req, res) {
  try {
    const user = await AuthUser.findById(req.user?.sub).lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Không thể xóa tài khoản admin' });
    }
    await AuthUser.findByIdAndDelete(user._id);
    return res.json({ message: 'Tài khoản đã được xóa' });
  } catch (err) {
    console.error('deleteMe error:', err);
    return res.status(500).json({ message: 'Failed to delete account' });
  }
}

module.exports.deleteMe = deleteMe;
