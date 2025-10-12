const router = require("express").Router();
const { getUsers, createUser } = require("../controllers/userController");
router.get("/users", getUsers);
router.post("/users", createUser);
module.exports = router;
