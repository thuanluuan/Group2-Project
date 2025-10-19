const router = require('express').Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { requireAuth } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '..', 'uploads', 'avatars');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const name = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Chỉ cho phép ảnh jpeg/png/webp/gif'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB

router.post('/upload/avatar', requireAuth, upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Không có file' });
  const rel = `/uploads/avatars/${req.file.filename}`;
  const full = `${req.protocol}://${req.get('host')}${rel}`;
  return res.json({ url: rel, fullUrl: full });
});

module.exports = router;
