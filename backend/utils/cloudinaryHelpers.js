const { cloudinary, hasCloudinaryConfig, configureCloudinary } = require('../config/cloudinary');

function isCloudinaryUrl(url) {
  return typeof url === 'string' && /res\.cloudinary\.com\//i.test(url);
}

// Extracts public_id from a Cloudinary URL.
// Example: https://res.cloudinary.com/<cloud>/image/upload/v12345/folder/name.webp
// -> folder/name
function extractPublicIdFromUrl(url) {
  if (!isCloudinaryUrl(url)) return null;
  try {
    const u = new URL(url);
    // Expect path like: /<cloud>/image/upload/v12345/folder/name.webp
    // We'll take everything after '/upload/' and strip version and extension
    const parts = u.pathname.split('/');
    const idx = parts.findIndex((p) => p === 'upload');
    if (idx === -1) return null;
    let after = parts.slice(idx + 1).join('/');
    // Remove version segment if present (v12345/)
    after = after.replace(/^v\d+\//, '');
    // Remove extension
    after = after.replace(/\.[^/.?#]+$/, '');
    return after || null;
  } catch {
    return null;
  }
}

async function deleteByUrl(url) {
  if (!hasCloudinaryConfig()) return false;
  configureCloudinary();
  const publicId = extractPublicIdFromUrl(url);
  if (!publicId) return false;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
    return true;
  } catch (e) {
    // Ignore cleanup errors to avoid impacting main flow
    return false;
  }
}

module.exports = { isCloudinaryUrl, extractPublicIdFromUrl, deleteByUrl };
