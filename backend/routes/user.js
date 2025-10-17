const router = require("express").Router();
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { listAuthUsers, getAuthUser, updateAuthUser, deleteAuthUser } = require("../controllers/authUserAdminController");
const { createUser } = require("../controllers/userController");
// Admin-only AuthUsers map to /users endpoints
router.get("/users", requireAuth, requireAdmin, listAuthUsers);
router.get("/users/:id", requireAuth, requireAdmin, getAuthUser);
// Block creating new auth users from this route; use /auth/register instead
router.post("/users", requireAuth, requireAdmin, (req, res) => {
  return res.status(405).json({ message: "Use /auth/register to create accounts" });
});
router.put("/users/:id", requireAuth, requireAdmin, updateAuthUser); // PUT
router.delete("/users/:id", requireAuth, requireAdmin, deleteAuthUser); // DELETE
module.exports = router;
