const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `post-${uniqueSuffix}${ext}`);
  }
});

function isValidImageSignature(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(12);
    const bytesRead = fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    if (bytesRead < 4) return false;

    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return true;
    }
    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return true;
    }
    // GIF: 47 49 46 38 ('GIF8')
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
      return true;
    }
    // WEBP: 'RIFF' .... 'WEBP'
    if (
      bytesRead >= 12 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    ) {
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
}

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Only image files (JPG, PNG, WEBP, GIF) are allowed. Received: ${ext}`), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024, files: 5 } // 10MB per image, up to 5 images
});

const uploadPostImages = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return next();
  }

  upload.array('images', 5)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: 'Image size exceeds 10MB limit.' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ success: false, message: 'Maximum 5 images allowed per post.' });
        }
      }
      return res.status(400).json({ success: false, message: err.message || 'Image upload failed.' });
    }

    // Verify magic bytes for genuine image content
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (!isValidImageSignature(file.path)) {
          // Cleanup all files from this request
          req.files.forEach((f) => {
            if (fs.existsSync(f.path)) {
              try { fs.unlinkSync(f.path); } catch (e) {}
            }
          });
          return res.status(400).json({
            success: false,
            message: `Uploaded file '${file.originalname}' is not a valid image format.`
          });
        }
      }
    }

    next();
  });
};

module.exports = { uploadPostImages };
