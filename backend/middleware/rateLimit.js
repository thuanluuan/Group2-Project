const Log = require("../models/Log");

// Lưu trữ số lần thử đăng nhập trong memory (có thể dùng Redis cho production)
const loginAttempts = new Map();

// Cấu hình
const MAX_ATTEMPTS = 5; // Số lần thử tối đa
const BLOCK_DURATION = 15 * 60 * 1000; // 15 phút block
const ATTEMPT_WINDOW = 5 * 60 * 1000; // Cửa sổ 5 phút để đếm số lần thử
const ADMIN_CONTACT_EMAIL = process.env.ADMIN_CONTACT_EMAIL || "admin@gmail.com";

/**
 * Middleware rate limiting cho login
 */
function rateLimitLogin(req, res, next) {
  const identifier = req.body?.email || req.ip;
  
  if (!identifier) {
    return next();
  }
  
  const now = Date.now();
  const attemptData = loginAttempts.get(identifier);
  
  // Kiểm tra xem có đang bị block không
  if (attemptData?.blockedUntil && attemptData.blockedUntil > now) {
    const remainingTime = Math.ceil((attemptData.blockedUntil - now) / 1000 / 60);
    
    // Log lại attempt khi đang bị block
    Log.create({
      action: 'login_blocked',
      email: req.body?.email,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
      status: 'failed',
      message: `Tài khoản bị khóa, còn ${remainingTime} phút`,
      metadata: { remainingMinutes: remainingTime },
    }).catch(err => console.error('Error logging blocked attempt:', err));
    
    return res.status(429).json({
      message: `Tài khoản bị khóa do đăng nhập sai quá nhiều. Vui lòng thử lại sau ${remainingTime} phút hoặc liên hệ admin qua email ${ADMIN_CONTACT_EMAIL} để được hỗ trợ mở khóa.`,
      remainingMinutes: remainingTime,
      adminContactEmail: ADMIN_CONTACT_EMAIL,
      blocked: true,
    });
  }
  
  // Xóa dữ liệu cũ nếu đã hết cửa sổ thời gian
  if (attemptData?.lastAttempt && (now - attemptData.lastAttempt) > ATTEMPT_WINDOW) {
    loginAttempts.delete(identifier);
  }
  
  // Cho phép request đi tiếp
  next();
}

/**
 * Ghi nhận login failed và cập nhật counter
 */
async function recordLoginFailure(identifier, email, req) {
  const now = Date.now();
  let attemptData = loginAttempts.get(identifier) || {
    count: 0,
    firstAttempt: now,
  };
  
  // Reset nếu ngoài cửa sổ thời gian
  if (attemptData.lastAttempt && (now - attemptData.lastAttempt) > ATTEMPT_WINDOW) {
    attemptData = {
      count: 0,
      firstAttempt: now,
    };
  }
  
  attemptData.count += 1;
  attemptData.lastAttempt = now;
  
  // Nếu vượt quá số lần thử, block
  if (attemptData.count >= MAX_ATTEMPTS) {
    attemptData.blockedUntil = now + BLOCK_DURATION;
    
    // Log blocked event
    await Log.create({
      action: 'login_blocked',
      email,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
      status: 'failed',
      message: `Tài khoản bị khóa sau ${MAX_ATTEMPTS} lần đăng nhập sai`,
      metadata: {
        attempts: attemptData.count,
        blockDurationMinutes: BLOCK_DURATION / 60000,
      },
    });
  }
  
  loginAttempts.set(identifier, attemptData);
  return attemptData;
}

/**
 * Reset counter khi login thành công
 */
function resetLoginAttempts(identifier) {
  loginAttempts.delete(identifier);
}

/**
 * Kiểm tra xem email có đang bị block không
 */
function isBlocked(email) {
  const attemptData = loginAttempts.get(email);
  if (!attemptData?.blockedUntil) return false;
  return attemptData.blockedUntil > Date.now();
}

/**
 * Lấy thông tin block của email (cho admin)
 */
function getBlockInfo(email) {
  const attemptData = loginAttempts.get(email);
  if (!attemptData) return null;
  
  const now = Date.now();
  const isCurrentlyBlocked = attemptData.blockedUntil && attemptData.blockedUntil > now;
  
  return {
    email,
    attempts: attemptData.count,
    isBlocked: isCurrentlyBlocked,
    blockedUntil: attemptData.blockedUntil ? new Date(attemptData.blockedUntil) : null,
    remainingMinutes: isCurrentlyBlocked ? Math.ceil((attemptData.blockedUntil - now) / 1000 / 60) : 0,
    lastAttempt: attemptData.lastAttempt ? new Date(attemptData.lastAttempt) : null,
  };
}

/**
 * Admin mở khóa tài khoản (xóa block)
 */
function unlockAccount(email) {
  const existed = loginAttempts.has(email);
  loginAttempts.delete(email);
  return existed;
}

/**
 * Lấy danh sách tất cả tài khoản đang bị block
 */
function getAllBlockedAccounts() {
  const now = Date.now();
  const blocked = [];
  
  for (const [email, data] of loginAttempts.entries()) {
    if (data.blockedUntil && data.blockedUntil > now) {
      blocked.push({
        email,
        attempts: data.count,
        blockedUntil: new Date(data.blockedUntil),
        remainingMinutes: Math.ceil((data.blockedUntil - now) / 1000 / 60),
        lastAttempt: data.lastAttempt ? new Date(data.lastAttempt) : null,
      });
    }
  }
  
  return blocked;
}

/**
 * Cleanup định kỳ để tránh memory leak
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of loginAttempts.entries()) {
    if (data.blockedUntil && data.blockedUntil < now) {
      loginAttempts.delete(key);
    } else if (data.lastAttempt && (now - data.lastAttempt) > ATTEMPT_WINDOW * 2) {
      loginAttempts.delete(key);
    }
  }
}, 10 * 60 * 1000); // Cleanup mỗi 10 phút

module.exports = {
  rateLimitLogin,
  recordLoginFailure,
  resetLoginAttempts,
  isBlocked,
  getBlockInfo,
  unlockAccount,
  getAllBlockedAccounts,
  MAX_ATTEMPTS,
  BLOCK_DURATION,
  ADMIN_CONTACT_EMAIL,
};
