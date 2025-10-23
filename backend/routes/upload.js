const router = require('express').Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const { requireAuth } = require('../middleware/auth');
const { cloudinary, hasCloudinaryConfig, configureCloudinary } = require('../config/cloudinary');

const uploadDir = path.join(__dirname, '..', 'uploads', 'avatars');
fs.mkdirSync(uploadDir, { recursive: true });

// If cloud is enabled, we can still accept memory storage and pipe to Cloudinary
const useCloud = hasCloudinaryConfig() && configureCloudinary();
const storage = useCloud
  ? multer.memoryStorage()
  : multer.diskStorage({
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

router.post('/upload/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Không có file' });
  try {
    if (useCloud) {
      // Upload buffer to Cloudinary with a readable stream
      const pass = new stream.PassThrough();
      pass.end(req.file.buffer);
      const folder = process.env.CLOUDINARY_AVATAR_FOLDER || 'avatars';
      const publicId = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder, public_id: publicId, resource_type: 'image' },
          (err, res) => (err ? reject(err) : resolve(res))
        );
        pass.pipe(uploadStream);
      });
      // result.secure_url is globally accessible
      return res.json({ url: result.secure_url, fullUrl: result.secure_url, publicId: result.public_id });
    } else {
      const rel = `/uploads/avatars/${req.file.filename}`;
      const full = `${req.protocol}://${req.get('host')}${rel}`;
      return res.json({ url: rel, fullUrl: full });
    }
  } catch (err) {
    console.error('Upload avatar error:', err);
    return res.status(500).json({ message: 'Tải ảnh thất bại' });
  }
});

module.exports = router;
