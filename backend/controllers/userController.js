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

module.exports = { getUsers, createUser };
