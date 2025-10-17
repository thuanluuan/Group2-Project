const router = require("express").Router();
const { register, login, logout, me, updateMe } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/logout", logout);
router.get("/auth/me", requireAuth, me);
router.put("/auth/me", requireAuth, updateMe);

module.exports = router;
