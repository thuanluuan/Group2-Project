const AuthUser = require("../models/AuthUser");
const RefreshToken = require("../models/RefreshToken");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const { sendMail } = require("../config/mailer");

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "dev_secret_key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "dev_secret_key";
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);
const COOKIE_SECURE = String(process.env.COOKIE_SECURE || '').toLowerCase() === 'true';
const DEBUG_RETURN_OTP = String(process.env.DEBUG_RETURN_OTP || "").toLowerCase() === "true";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "admin@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function register(req, res) {
  try {
    const { name, email, password, dob } = req.body;
    if (!name || !email || !password || !dob)
      return res.status(400).json({ message: "name, email, password and dob required" });

  const existing = await AuthUser.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already exists" });

    const role = ADMIN_EMAILS.includes(String(email).toLowerCase()) ? "admin" : "user";
    if (role === "admin") {
      const existingAdmin = await AuthUser.findOne({ role: "admin" }).lean();
      if (existingAdmin) {
        return res.status(409).json({ message: "Chỉ được phép có một tài khoản admin" });
      }
    }
    const user = await AuthUser.create({ name, email, password, dob, role });
    // return limited user info
  res.status(201).json({ _id: user._id, name: user.name, email: user.email, dob: user.dob, role: user.role });
  } catch (err) {
    console.error("register error:", err);
    if (err.code === 11000) {
      // Could be duplicate email or the admin unique partial index
      return res.status(409).json({ message: "Email đã tồn tại hoặc đã có tài khoản admin" });
    }
    res.status(500).json({ message: "Failed to register" });
  }
}

function signAccessToken(user) {
  return jwt.sign({ sub: user._id, email: user.email, role: user.role }, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

function generateRefreshTokenValue() {
  return crypto.randomBytes(48).toString('base64url');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function setRefreshCookie(res, token) {
  const maxAgeMs = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    maxAge: maxAgeMs,
    path: '/',
  });
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "email and password required" });

  const user = await AuthUser.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

  const accessToken = signAccessToken(user);
  // Create refresh token record
  const value = generateRefreshTokenValue();
  const tokenHash = hashToken(value);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  const jti = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(12).toString('hex');
  await RefreshToken.create({ user: user._id, tokenHash, expiresAt, jti, userAgent: req.get('user-agent'), ip: req.ip });
  setRefreshCookie(res, value);
  res.json({ accessToken, token: accessToken, user: { _id: user._id, name: user.name, email: user.email, dob: user.dob, role: user.role } });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ message: "Failed to login" });
  }
}

// POST /auth/refresh
async function refresh(req, res) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });
    const tokenHash = hashToken(token);
    const doc = await RefreshToken.findOne({ tokenHash, revokedAt: { $exists: false }, expiresAt: { $gt: new Date() } });
    if (!doc) return res.status(401).json({ message: 'Invalid refresh token' });
    const user = await AuthUser.findById(doc.user);
    if (!user) return res.status(401).json({ message: 'Invalid session' });
    // rotate refresh token
    const newValue = generateRefreshTokenValue();
    doc.tokenHash = hashToken(newValue);
    doc.expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    await doc.save();
    setRefreshCookie(res, newValue);
    const accessToken = signAccessToken(user);
    return res.json({ accessToken, token: accessToken });
  } catch (err) {
    console.error('refresh error:', err);
    return res.status(500).json({ message: 'Failed to refresh token' });
  }
}

// POST /auth/logout -> revoke refresh token and clear cookie
async function logout(req, res) {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      const tokenHash = hashToken(token);
      await RefreshToken.findOneAndUpdate({ tokenHash }, { $set: { revokedAt: new Date() } });
    }
  res.clearCookie('refreshToken', { httpOnly: true, secure: COOKIE_SECURE, sameSite: 'lax', path: '/' });
    return res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('logout error:', err);
    return res.status(500).json({ message: 'Failed to logout' });
  }
}

async function me(req, res) {
  try {
    const user = await AuthUser.findById(req.user?.sub, { password: 0 }).lean();
    if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ _id: user._id, name: user.name, email: user.email, dob: user.dob, role: user.role, address: user.address, phone: user.phone, avatarUrl: user.avatarUrl });
  } catch (err) {
    console.error("me error:", err);
    res.status(500).json({ message: "Failed to load profile" });
  }
}

async function updateMe(req, res) {
  try {
  if (req.user?.role === 'moderator') return res.status(403).json({ message: 'Moderator không được phép cập nhật thông tin' });
  const { name, dob, address, phone, avatarUrl } = req.body;
  const updates = {};
    if (name !== undefined) updates.name = name;
    if (dob !== undefined) updates.dob = dob;
  if (address !== undefined) updates.address = address;
  if (phone !== undefined) updates.phone = phone;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    // Fetch current to compare avatarUrl (for cleanup on Cloudinary)
    const userId = req.user?.sub;
    const current = await AuthUser.findById(userId, { avatarUrl: 1 }).lean();
    const user = await AuthUser.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
      projection: { password: 0 },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    // After successful update, if avatarUrl changed from previous Cloudinary URL, delete the old asset
    if (avatarUrl !== undefined && current?.avatarUrl && current.avatarUrl !== user.avatarUrl) {
      try {
        const { deleteByUrl } = require('../utils/cloudinaryHelpers');
        await deleteByUrl(current.avatarUrl);
      } catch {}
    }
  res.json({ _id: user._id, name: user.name, email: user.email, dob: user.dob, role: user.role, address: user.address, phone: user.phone, avatarUrl: user.avatarUrl });
  } catch (err) {
    console.error("updateMe error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
}

module.exports = { register, login, logout, me, updateMe, refresh };
// Delete own account (non-admin)
async function deleteMe(req, res) {
  try {
    if (req.user?.role === 'moderator') {
      return res.status(403).json({ message: 'Moderator không được phép xóa tài khoản' });
    }
    const user = await AuthUser.findById(req.user?.sub).lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Không thể xóa tài khoản admin' });
    }
    await AuthUser.findByIdAndDelete(user._id);
    return res.json({ message: 'Tài khoản đã được xóa' });
  } catch (err) {
    console.error('deleteMe error:', err);
    return res.status(500).json({ message: 'Failed to delete account' });
  }
}

module.exports.deleteMe = deleteMe;

// POST /auth/forgot-password { email }
async function forgotPassword(req, res) {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email required' });
    const user = await AuthUser.findOne({ email }).select('+resetOtp +resetOtpExpires +role');
    if (!user) return res.status(404).json({ message: 'Email không tồn tại' });
    if (user.role === 'moderator') {
      return res.status(403).json({ message: 'Tài khoản Moderator không được phép đổi mật khẩu' });
    }
    // Generate a 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
    user.resetOtp = otp;
    user.resetOtpExpires = expires;
    await user.save();
    try {
      await sendMail({
        to: user.email,
        subject: 'Mã OTP khôi phục mật khẩu',
        text: `Mã OTP của bạn là: ${otp}. OTP có hiệu lực trong 2 phút.`,
        html: `<p>Xin chào ${user.name || ''},</p>
               <p>Mã OTP khôi phục mật khẩu của bạn là: <b style="font-size:18px">${otp}</b></p>
               <p>OTP có hiệu lực trong <b>2 phút</b>.</p>`,
      });
    } catch (mailErr) {
      console.error('sendMail error:', mailErr);
      return res.status(500).json({ message: 'Không gửi được email OTP' });
    }
    return res.json({ message: 'Đã gửi OTP đến email', ...(DEBUG_RETURN_OTP ? { otp } : {}) });
  } catch (err) {
    console.error('forgotPassword error:', err);
    return res.status(500).json({ message: 'Failed to process forgot password' });
  }
}

// POST /auth/reset-password { email, otp, newPassword }
async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body || {};
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'email, otp, newPassword required' });
    }
    const user = await AuthUser.findOne({ email }).select('+password +resetOtp +resetOtpExpires +role');
    if (!user) return res.status(404).json({ message: 'Email không tồn tại' });
    if (user.role === 'moderator') {
      return res.status(403).json({ message: 'Tài khoản Moderator không được phép đổi mật khẩu' });
    }
    if (!user.resetOtp || !user.resetOtpExpires) {
      return res.status(400).json({ message: 'OTP không hợp lệ' });
    }
    if (String(user.resetOtp) !== String(otp)) {
      return res.status(400).json({ message: 'OTP không đúng' });
    }
    if (user.resetOtpExpires.getTime() < Date.now()) {
      return res.status(400).json({ message: 'OTP đã hết hạn' });
    }
    user.password = newPassword; // will be hashed by pre-save
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();
    return res.json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (err) {
    console.error('resetPassword error:', err);
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ message: 'Mật khẩu không hợp lệ' });
    }
    return res.status(500).json({ message: 'Failed to reset password' });
  }
}

module.exports.forgotPassword = forgotPassword;
module.exports.resetPassword = resetPassword;

// POST /auth/me/forgot-password (auth required)
async function forgotPasswordMe(req, res) {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (req.user?.role === 'moderator') {
      return res.status(403).json({ message: 'Moderator không được phép đổi mật khẩu' });
    }
    const user = await AuthUser.findById(userId).select('+resetOtp +resetOtpExpires');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 2 * 60 * 1000);
    user.resetOtp = otp;
    user.resetOtpExpires = expires;
    await user.save();
    try {
      await sendMail({
        to: user.email,
        subject: 'Mã OTP đổi mật khẩu',
        text: `Mã OTP của bạn là: ${otp}. OTP có hiệu lực trong 2 phút.`,
        html: `<p>Xin chào ${user.name || ''},</p>
               <p>Mã OTP đổi mật khẩu của bạn là: <b style="font-size:18px">${otp}</b></p>
               <p>OTP có hiệu lực trong <b>2 phút</b>.</p>`,
      });
    } catch (mailErr) {
      console.error('sendMail error:', mailErr);
      return res.status(500).json({ message: 'Không gửi được email OTP' });
    }
    return res.json({ message: 'Đã gửi OTP đến email của bạn', ...(DEBUG_RETURN_OTP ? { otp } : {}) });
  } catch (err) {
    console.error('forgotPasswordMe error:', err);
    return res.status(500).json({ message: 'Failed to process forgot password' });
  }
}

// POST /auth/me/reset-password (auth required) { otp, newPassword }
async function resetPasswordMe(req, res) {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (req.user?.role === 'moderator') {
      return res.status(403).json({ message: 'Moderator không được phép đổi mật khẩu' });
    }
    const { otp, newPassword } = req.body || {};
    if (!otp || !newPassword) {
      return res.status(400).json({ message: 'otp, newPassword required' });
    }
    const user = await AuthUser.findById(userId).select('+password +resetOtp +resetOtpExpires');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.resetOtp || !user.resetOtpExpires) {
      return res.status(400).json({ message: 'OTP không hợp lệ' });
    }
    if (String(user.resetOtp) !== String(otp)) {
      return res.status(400).json({ message: 'OTP không đúng' });
    }
    if (user.resetOtpExpires.getTime() < Date.now()) {
      return res.status(400).json({ message: 'OTP đã hết hạn' });
    }
    user.password = newPassword;
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();
    return res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    console.error('resetPasswordMe error:', err);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
}

module.exports.forgotPasswordMe = forgotPasswordMe;
module.exports.resetPasswordMe = resetPasswordMe;
