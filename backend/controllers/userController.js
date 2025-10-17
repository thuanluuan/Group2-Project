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

// GET /users/:id - lấy 1 user theo id
async function getUser(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id).lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("getUser error:", err);
    if (err.name === "CastError")
      return res.status(400).json({ message: "Invalid user id" });
    res.status(500).json({ message: "Failed to fetch user" });
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
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("updateUser error:", err);
    if (err.name === "CastError")
      return res.status(400).json({ message: "Invalid user id" });
    res.status(500).json({ message: "Failed to update user" });
  }
}

// DELETE: xóa user
async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("deleteUser error:", err);
    if (err.name === "CastError")
      return res.status(400).json({ message: "Invalid user id" });
    res.status(500).json({ message: "Failed to delete user" });
  }
}

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser };
