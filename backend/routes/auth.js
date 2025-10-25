const router = require("express").Router();
const { register, login, logout, me, updateMe, deleteMe, forgotPassword, resetPassword, forgotPasswordMe, resetPasswordMe, refresh } = require("../controllers/authController");
const { requireAuth, checkRole } = require("../middleware/auth");

router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/logout", logout);
router.post("/auth/refresh", refresh);
router.get("/auth/me", requireAuth, me);
// Moderator is read-only: only admin & user can update/delete self
router.put("/auth/me", requireAuth, checkRole('user','admin'), updateMe);
router.delete("/auth/me", requireAuth, checkRole('user','admin'), deleteMe);
// Forgot password flow
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/reset-password", resetPassword);
// Self-service change password using OTP without email
// Moderator cannot change password via self-service
router.post("/auth/me/forgot-password", requireAuth, checkRole('user','admin'), forgotPasswordMe);
router.post("/auth/me/reset-password", requireAuth, checkRole('user','admin'), resetPasswordMe);

module.exports = router;
