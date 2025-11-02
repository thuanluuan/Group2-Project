const router = require("express").Router();
const { 
  getLogs, 
  getLogStats, 
  getLogActions, 
  deleteLogs,
  getBlockedAccounts,
  checkBlockStatus,
  unlockAccountByAdmin 
} = require("../controllers/logController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

// Tất cả routes logs chỉ dành cho admin
router.get("/logs", requireAuth, requireAdmin, getLogs);
router.get("/logs/stats", requireAuth, requireAdmin, getLogStats);
router.get("/logs/actions", requireAuth, requireAdmin, getLogActions);
router.delete("/logs", requireAuth, requireAdmin, deleteLogs);

// Routes quản lý blocked accounts
router.get("/logs/blocked", requireAuth, requireAdmin, getBlockedAccounts);
router.get("/logs/blocked/:email", requireAuth, requireAdmin, checkBlockStatus);
router.post("/logs/unlock", requireAuth, requireAdmin, unlockAccountByAdmin);

module.exports = router;
