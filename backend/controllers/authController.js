const AuthUser = require("../models/AuthUser");
const jwt = require("jsonwebtoken");
const { sendMail } = require("../config/mailer");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";
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

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "email and password required" });

  const user = await AuthUser.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ sub: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { _id: user._id, name: user.name, email: user.email, dob: user.dob, role: user.role } });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ message: "Failed to login" });
  }
}

// Simple logout for clients: instruct client to drop token. No server-side session stored.
function logout(req, res) {
  res.json({ message: "Logged out" });
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
  const { name, dob, address, phone, avatarUrl } = req.body;
  const updates = {};
    if (name !== undefined) updates.name = name;
    if (dob !== undefined) updates.dob = dob;
  if (address !== undefined) updates.address = address;
  if (phone !== undefined) updates.phone = phone;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    const user = await AuthUser.findByIdAndUpdate(req.user?.sub, updates, {
      new: true,
      runValidators: true,
      projection: { password: 0 },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ _id: user._id, name: user.name, email: user.email, dob: user.dob, role: user.role, address: user.address, phone: user.phone, avatarUrl: user.avatarUrl });
  } catch (err) {
    console.error("updateMe error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
}

module.exports = { register, login, logout, me, updateMe };
// Delete own account (non-admin)
async function deleteMe(req, res) {
  try {
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
    const user = await AuthUser.findOne({ email }).select('+resetOtp +resetOtpExpires');
    if (!user) return res.status(404).json({ message: 'Email không tồn tại' });
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
    const user = await AuthUser.findOne({ email }).select('+password +resetOtp +resetOtpExpires');
    if (!user) return res.status(404).json({ message: 'Email không tồn tại' });
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
