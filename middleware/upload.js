const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

function fileFilter(req, file, cb) {
  const allowed = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    return cb(null, true);
  }
  cb(new Error('INVALID_FILE_TYPE'));
}

const MAX_FILE_SIZE_MB = 5;

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
});

// Wraps upload.single() so Multer errors (file too large, bad type, etc.)
// become a friendly req.uploadError string instead of crashing the request.
// The route handler checks req.uploadError and re-renders the form.
function uploadSingleAvatar(req, res, next) {
  upload.single('avatarFile')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        req.uploadError = `Avatar file is too large. Max size is ${MAX_FILE_SIZE_MB}MB.`;
      } else if (err.message === 'INVALID_FILE_TYPE') {
        req.uploadError = 'Only image files (png, jpg, jpeg, webp, gif) are allowed.';
      } else {
        req.uploadError = 'File upload failed. Please try again.';
      }
    }
    next();
  });
}

module.exports = uploadSingleAvatar;