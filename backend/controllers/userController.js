// Mảng users tạm (in-memory)
const users = [{ id: 1, name: "Alice", email: "alice@example.com" }];

// GET /users
function getUsers(req, res) {
  res.json(users);
}

// POST /users
function createUser(req, res) {
  const { name, email } = req.body;
  if (!name || !email)
    return res.status(400).json({ message: "name & email required" });

  const id = users.length ? users[users.length - 1].id + 1 : 1;
  const user = { id, name, email };
  users.push(user);
  res.status(201).json(user);
}

module.exports = { getUsers, createUser };
