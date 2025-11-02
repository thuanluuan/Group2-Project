const AuthUser = require("../models/AuthUser");

// List auth users with search + pagination (admin only)
async function listAuthUsers(req, res) {
  try {
    const { q } = req.query;
    let page = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    if (!Number.isFinite(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    const filter = {};
    if (q && String(q).trim()) {
      const regex = new RegExp(String(q).trim(), 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const total = await AuthUser.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const clampedPage = Math.min(page, totalPages);
    const start = (clampedPage - 1) * limit;

    // If there's a query, prioritize exact matches (name/email equal to q, case-insensitive) on top
    if (q && String(q).trim()) {
      const s = String(q).trim();
      const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const exactRegex = new RegExp(`^${escapeRegExp(s)}$`, 'i');
      const exactFilter = { $or: [{ email: exactRegex }, { name: exactRegex }] };

      // Find exact match ids
      const exactIdsDocs = await AuthUser.find(exactFilter).select('_id').lean();
      const exactIds = exactIdsDocs.map((d) => d._id);
      const exactCount = exactIds.length;

      let data = [];
      // Compute how many exact items fall into current page window
      if (start < exactCount) {
        const takeExact = Math.min(limit, exactCount - start);
        const exactSlice = await AuthUser.find(exactFilter, { password: 0 })
          .sort({ name: 1 })
          .skip(start)
          .limit(takeExact)
          .lean();
        data = data.concat(exactSlice);
        const remaining = limit - exactSlice.length;
        if (remaining > 0) {
          const restSkip = 0; // because start < exactCount, we start rest from 0
          const restFilter = { ...filter, _id: { $nin: exactIds } };
          const rest = await AuthUser.find(restFilter, { password: 0 })
            .sort({ name: 1 })
            .skip(restSkip)
            .limit(remaining)
            .lean();
          data = data.concat(rest);
        }
      } else {
        // Current page is entirely after all exact matches
        const restSkip = start - exactCount;
        const restFilter = { ...filter, _id: { $nin: exactIds } };
        const rest = await AuthUser.find(restFilter, { password: 0 })
          .sort({ name: 1 })
          .skip(restSkip)
          .limit(limit)
          .lean();
        data = rest;
      }

      return res.json({ data, page: clampedPage, limit, total, totalPages });
    }

    // No query: normal pagination by name
    const users = await AuthUser.find(filter, { password: 0 })
      .sort({ name: 1 })
      .skip(start)
      .limit(limit)
      .lean();

    res.json({ data: users, page: clampedPage, limit, total, totalPages });
  } catch (e) {
    console.error("listAuthUsers error:", e);
    res.status(500).json({ message: "Failed to fetch auth users" });
  }
}

// Get one auth user by id (admin only)
async function getAuthUser(req, res) {
  try {
    const { id } = req.params;
    const user = await AuthUser.findById(id, { password: 0 }).lean();
    if (!user) return res.status(404).json({ message: "Auth user not found" });
    res.json(user);
  } catch (e) {
    console.error("getAuthUser error:", e);
    if (e.name === "CastError") return res.status(400).json({ message: "Invalid id" });
    res.status(500).json({ message: "Failed to fetch auth user" });
  }
}

// Update allowed fields (admin only)
async function updateAuthUser(req, res) {
  try {
    const { id } = req.params;
  const { name, email, dob, role, address, phone, avatarUrl } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
  if (dob !== undefined) updates.dob = dob;
  if (address !== undefined) updates.address = address;
  if (phone !== undefined) updates.phone = phone;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    if (role !== undefined) {
      // Prevent creating a second admin
      if (role === "admin") {
        const anotherAdmin = await AuthUser.findOne({ role: "admin", _id: { $ne: id } }).lean();
        if (anotherAdmin) {
          return res.status(409).json({ message: "Chỉ được phép có một tài khoản admin" });
        }
      }
      updates.role = role;
    }

    // Fetch current to compare avatarUrl for Cloudinary cleanup
    const current = await AuthUser.findById(id, { avatarUrl: 1 }).lean();
    const user = await AuthUser.findByIdAndUpdate(id, updates, { new: true, runValidators: true, projection: { password: 0 } });
    if (!user) return res.status(404).json({ message: "Auth user not found" });
    if (avatarUrl !== undefined && current?.avatarUrl && current.avatarUrl !== user.avatarUrl) {
      try {
        const { deleteByUrl } = require('../utils/cloudinaryHelpers');
        await deleteByUrl(current.avatarUrl);
      } catch {}
    }
    res.json(user);
  } catch (e) {
    console.error("updateAuthUser error:", e);
    if (e.code === 11000) return res.status(409).json({ message: "Email đã tồn tại hoặc đã có tài khoản admin" });
    if (e.name === "ValidationError") {
      const first = e?.errors ? Object.values(e.errors)[0] : null;
      return res.status(400).json({ message: first?.message || "Dữ liệu không hợp lệ" });
    }
    if (e.name === "CastError") {
      if (e.path && e.path !== '_id') return res.status(400).json({ message: `Giá trị trường '${e.path}' không hợp lệ` });
      return res.status(400).json({ message: "Invalid id" });
    }
    res.status(500).json({ message: "Failed to update auth user" });
  }
}

// Delete auth user (admin only)
async function deleteAuthUser(req, res) {
  try {
    const { id } = req.params;
    // Prevent deleting the sole admin account for safety
    const toDelete = await AuthUser.findById(id).lean();
    if (!toDelete) return res.status(404).json({ message: "Auth user not found" });
    if (toDelete.role === 'admin') {
      return res.status(403).json({ message: 'Không thể xóa tài khoản admin' });
    }
    const user = await AuthUser.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: "Auth user not found" });
    // Best-effort: clean Cloudinary avatar of the deleted user
    if (toDelete.avatarUrl) {
      try {
        const { deleteByUrl } = require('../utils/cloudinaryHelpers');
        await deleteByUrl(toDelete.avatarUrl);
      } catch {}
    }
    res.json({ message: "Auth user deleted" });
  } catch (e) {
    console.error("deleteAuthUser error:", e);
    if (e.name === "CastError") return res.status(400).json({ message: "Invalid id" });
    res.status(500).json({ message: "Failed to delete auth user" });
  }
}

module.exports = { listAuthUsers, getAuthUser, updateAuthUser, deleteAuthUser };
// Batch delete auth users (admin only)
async function batchDeleteAuthUsers(req, res) {
  try {
    let { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Danh sách ids không hợp lệ" });
    }
    // Unique ids
    ids = Array.from(new Set(ids.map(String)));
    // Find users by ids
    const users = await AuthUser.find({ _id: { $in: ids } }).lean();
    const foundIds = users.map(u => String(u._id));
    const adminIds = users.filter(u => u.role === 'admin').map(u => String(u._id));
    const eligibleIds = users.filter(u => u.role !== 'admin').map(u => String(u._id));
    const notFoundCount = ids.filter(id => !foundIds.includes(String(id))).length;
    if (eligibleIds.length === 0) {
      return res.json({ requested: ids.length, deleted: 0, skippedAdmins: adminIds.length, notFound: notFoundCount });
    }
    const result = await AuthUser.deleteMany({ _id: { $in: eligibleIds } });
    return res.json({ requested: ids.length, deleted: result.deletedCount || 0, skippedAdmins: adminIds.length, notFound: notFoundCount });
  } catch (e) {
    console.error("batchDeleteAuthUsers error:", e);
    if (e.name === "CastError") return res.status(400).json({ message: "Invalid id" });
    return res.status(500).json({ message: "Failed to batch delete users" });
  }
}

module.exports.batchDeleteAuthUsers = batchDeleteAuthUsers;
