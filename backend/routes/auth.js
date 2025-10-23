const router = require("express").Router();
const { register, login, logout, me, updateMe, deleteMe, forgotPassword, resetPassword, forgotPasswordMe, resetPasswordMe, refresh } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/logout", logout);
router.post("/auth/refresh", refresh);
router.get("/auth/me", requireAuth, me);
router.put("/auth/me", requireAuth, updateMe);
router.delete("/auth/me", requireAuth, deleteMe);
// Forgot password flow
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/reset-password", resetPassword);
// Self-service change password using OTP without email
router.post("/auth/me/forgot-password", requireAuth, forgotPasswordMe);
router.post("/auth/me/reset-password", requireAuth, resetPasswordMe);

module.exports = router;
