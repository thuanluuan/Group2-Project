const Log = require("../models/Log");
const AuthUser = require("../models/AuthUser");
const { getBlockInfo, unlockAccount, getAllBlockedAccounts, isBlocked } = require("../middleware/rateLimit");

/**
 * GET /logs - Lấy danh sách logs (chỉ admin)
 */
async function getLogs(req, res) {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      status,
      email,
      userId,
      startDate,
      endDate,
    } = req.query;

    const query = {};

    // Filter theo action
    if (action) {
      query.action = action;
    }

    // Filter theo status
    if (status) {
      query.status = status;
    }

    // Filter theo email
    if (email) {
      query.email = { $regex: email, $options: "i" };
    }

    // Filter theo userId
    if (userId) {
      query.userId = userId;
    }

    // Filter theo thời gian
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;
    const total = await Log.countDocuments(query);

    const logs = await Log.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("userId", "name email role")
      .lean();

    res.json({
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("getLogs error:", err);
    res.status(500).json({ message: "Failed to fetch logs" });
  }
}

/**
 * GET /logs/stats - Thống kê logs
 */
async function getLogStats(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) {
        matchStage.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        matchStage.createdAt.$lte = new Date(endDate);
      }
    }

    // Thống kê theo action
    const actionStats = await Log.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] },
          },
          failedCount: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Thống kê theo status
    const statusStats = await Log.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Thống kê login failed gần đây
    const recentFailedLogins = await Log.find({
      action: { $in: ["login", "login_blocked"] },
      status: "failed",
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // 24h gần đây
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Top users có nhiều hoạt động nhất
    const topUsers = await Log.aggregate([
      { $match: { ...matchStage, userId: { $ne: null } } },
      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "authusers",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          userId: "$_id",
          count: 1,
          userName: "$user.name",
          userEmail: "$user.email",
        },
      },
    ]);

    res.json({
      actionStats,
      statusStats,
      recentFailedLogins,
      topUsers,
    });
  } catch (err) {
    console.error("getLogStats error:", err);
    res.status(500).json({ message: "Failed to fetch log statistics" });
  }
}

/**
 * GET /logs/actions - Lấy danh sách các action có trong logs
 */
async function getLogActions(req, res) {
  try {
    const actions = await Log.distinct("action");
    res.json({ actions: actions.sort() });
  } catch (err) {
    console.error("getLogActions error:", err);
    res.status(500).json({ message: "Failed to fetch log actions" });
  }
}

/**
 * DELETE /logs - Xóa logs cũ (chỉ admin)
 */
async function deleteLogs(req, res) {
  try {
    const { beforeDate } = req.body;

    if (!beforeDate) {
      return res.status(400).json({ message: "beforeDate is required" });
    }

    const result = await Log.deleteMany({
      createdAt: { $lt: new Date(beforeDate) },
    });

    res.json({
      message: `Deleted ${result.deletedCount} logs`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("deleteLogs error:", err);
    res.status(500).json({ message: "Failed to delete logs" });
  }
}

/**
 * GET /logs/blocked - Lấy danh sách tài khoản bị block (chỉ admin)
 */
async function getBlockedAccounts(req, res) {
  try {
    const blockedAccounts = getAllBlockedAccounts();
    res.json({
      total: blockedAccounts.length,
      accounts: blockedAccounts,
    });
  } catch (err) {
    console.error("getBlockedAccounts error:", err);
    res.status(500).json({ message: "Failed to fetch blocked accounts" });
  }
}

/**
 * GET /logs/blocked/:email - Kiểm tra trạng thái block của một email (chỉ admin)
 */
async function checkBlockStatus(req, res) {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    const blockInfo = getBlockInfo(email);
    
    if (!blockInfo) {
      return res.json({
        email,
        isBlocked: false,
        message: "Account is not blocked",
      });
    }
    
    res.json(blockInfo);
  } catch (err) {
    console.error("checkBlockStatus error:", err);
    res.status(500).json({ message: "Failed to check block status" });
  }
}

/**
 * POST /logs/unlock - Mở khóa tài khoản (chỉ admin)
 */
async function unlockAccountByAdmin(req, res) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    const existed = unlockAccount(email);
    
    // Log hành động unlock
    await Log.create({
      action: 'account_unlocked',
      email: email,
      userId: req.user?.sub,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
      status: 'success',
      message: `Account unlocked by admin`,
      metadata: {
        adminEmail: req.user?.email,
        adminId: req.user?.sub,
      },
    });
    
    res.json({
      success: true,
      message: existed 
        ? `Đã mở khóa tài khoản ${email}` 
        : `Tài khoản ${email} không bị khóa`,
      email,
    });
  } catch (err) {
    console.error("unlockAccount error:", err);
    res.status(500).json({ message: "Failed to unlock account" });
  }
}

module.exports = {
  getLogs,
  getLogStats,
  getLogActions,
  deleteLogs,
  getBlockedAccounts,
  checkBlockStatus,
  unlockAccountByAdmin,
};
