const AuthUser = require("../models/AuthUser");

// List all auth users (admin only)
async function listAuthUsers(req, res) {
  try {
    const users = await AuthUser.find({}, { password: 0 }).lean();
    res.json(users);
  } catch (e) {
    console.error("listAuthUsers error:", e);
    res.status(500).json({ message: "Failed to fetch auth users" });
  }
}

// Get one auth user by id (admin only)
async function getAuthUser(req, res) {
  try {
    const { id } = req.params;
    const user = await AuthUser.findById(id, { password: 0 }).lean();
    if (!user) return res.status(404).json({ message: "Auth user not found" });
    res.json(user);
  } catch (e) {
    console.error("getAuthUser error:", e);
    if (e.name === "CastError") return res.status(400).json({ message: "Invalid id" });
    res.status(500).json({ message: "Failed to fetch auth user" });
  }
}

// Update allowed fields (admin only)
async function updateAuthUser(req, res) {
  try {
    const { id } = req.params;
  const { name, email, dob, role, address, phone, avatarUrl } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
  if (dob !== undefined) updates.dob = dob;
  if (address !== undefined) updates.address = address;
  if (phone !== undefined) updates.phone = phone;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    if (role !== undefined) {
      // Prevent creating a second admin
      if (role === "admin") {
        const anotherAdmin = await AuthUser.findOne({ role: "admin", _id: { $ne: id } }).lean();
        if (anotherAdmin) {
          return res.status(409).json({ message: "Chỉ được phép có một tài khoản admin" });
        }
      }
      updates.role = role;
    }

    const user = await AuthUser.findByIdAndUpdate(id, updates, { new: true, runValidators: true, projection: { password: 0 } });
    if (!user) return res.status(404).json({ message: "Auth user not found" });
    res.json(user);
  } catch (e) {
    console.error("updateAuthUser error:", e);
    if (e.code === 11000) return res.status(409).json({ message: "Email đã tồn tại hoặc đã có tài khoản admin" });
    if (e.name === "CastError") return res.status(400).json({ message: "Invalid id" });
    res.status(500).json({ message: "Failed to update auth user" });
  }
}

// Delete auth user (admin only)
async function deleteAuthUser(req, res) {
  try {
    const { id } = req.params;
    // Prevent deleting the sole admin account for safety
    const toDelete = await AuthUser.findById(id).lean();
    if (!toDelete) return res.status(404).json({ message: "Auth user not found" });
    if (toDelete.role === 'admin') {
      return res.status(403).json({ message: 'Không thể xóa tài khoản admin' });
    }
    const user = await AuthUser.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: "Auth user not found" });
    res.json({ message: "Auth user deleted" });
  } catch (e) {
    console.error("deleteAuthUser error:", e);
    if (e.name === "CastError") return res.status(400).json({ message: "Invalid id" });
    res.status(500).json({ message: "Failed to delete auth user" });
  }
}

module.exports = { listAuthUsers, getAuthUser, updateAuthUser, deleteAuthUser };
