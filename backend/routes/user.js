const router = require("express").Router();
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
router.get("/users", getUsers);
router.post("/users", createUser);
router.put("/users/:id", updateUser); // PUT
router.delete("/users/:id", deleteUser); // DELETE
module.exports = router;
