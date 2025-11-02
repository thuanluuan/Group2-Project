const router = require("express").Router();
const { register, login, logout, me, updateMe, deleteMe, forgotPassword, resetPassword, forgotPasswordMe, resetPasswordMe, refresh, forgotPasswordLink, resetPasswordByToken } = require("../controllers/authController");
const { requireAuth, requireAdmin, checkRole } = require("../middleware/auth");
const { logActivity } = require("../middleware/logActivity");
const { rateLimitLogin } = require("../middleware/rateLimit");

router.post("/auth/register", logActivity('register'), register);
router.post("/auth/login", rateLimitLogin, logActivity('login'), login);
router.post("/auth/logout", logActivity('logout'), logout);
router.post("/auth/refresh", refresh);
router.get("/auth/me", requireAuth, me);
// Moderator is read-only: only admin & user can update/delete self
router.put("/auth/me", requireAuth, checkRole('user','admin'), logActivity('update_profile'), updateMe);
router.delete("/auth/me", requireAuth, checkRole('user','admin'), logActivity('delete_account'), deleteMe);
// Forgot password flow
router.post("/auth/forgot-password", logActivity('forgot_password'), forgotPassword);
router.post("/auth/reset-password", logActivity('reset_password'), resetPassword);
// Forgot password via token link
router.post("/auth/forgot-password-link", logActivity('forgot_password_link'), forgotPasswordLink);
router.post("/auth/resetpassword/:token", logActivity('reset_password_by_token'), resetPasswordByToken);
// Self-service change password using OTP without email
// Moderator cannot change password via self-service
router.post("/auth/me/forgot-password", requireAuth, checkRole('user','admin'), logActivity('forgot_password_me'), forgotPasswordMe);
router.post("/auth/me/reset-password", requireAuth, checkRole('user','admin'), logActivity('reset_password_me'), resetPasswordMe);

module.exports = router;
