const multer = require('multer');

const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const upload = multer({
    storage: multer.memoryStorage(),
    limits:  { fileSize: MAX_FILE_SIZE },
    fileFilter(_req, file, cb) {
        if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed'));
        }
    },
});

/**
 * Wraps upload.single('file') so multer errors are returned as JSON
 * instead of crashing Express's default error handler.
 */
const handleUpload = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (!err) return next();

        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: 'File exceeds the 5 MB limit' });
        }

        return res.status(400).json({ success: false, message: err.message });
    });
};

module.exports = { handleUpload };
