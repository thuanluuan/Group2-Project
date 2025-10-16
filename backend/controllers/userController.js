const User = require("../models/User");

// GET /users
async function getUsers(req, res) {
  try {
    const users = await User.find({}).lean();
    res.json(users);
  } catch (err) {
    console.error("getUsers error:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
}

// POST /users
async function createUser(req, res) {
  try {
    const { name, email } = req.body;
    if (!name || !email)
      return res.status(400).json({ message: "name & email required" });

    const user = await User.create({ name, email });
    res.status(201).json(user);
  } catch (err) {
    console.error("createUser error:", err);
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Failed to create user" });
  }
}

// PUT: cập nhật user
async function updateUser(req, res) {
  const { id } = req.params;
  const idx = users.findIndex((u) => u.id == id);
  if (idx === -1) return res.status(404).json({ message: "User not found" });

  // Gộp giữ nguyên id
  users[idx] = { ...users[idx], ...req.body, id: users[idx].id };
  res.json(users[idx]);
}

// DELETE: xóa user
async function deleteUser(req, res) {
  const { id } = req.params;
  const before = users.length;
  users = users.filter((u) => u.id != id);
  if (users.length === before) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json({ message: "User deleted" });
}

module.exports = { getUsers, createUser, updateUser, deleteUser };
