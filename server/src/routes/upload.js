import { Router } from 'express';
import multer from 'multer';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sniffMime } from '../utils/fileType.js';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);
const TYPE_ERROR = 'Only JPG, PNG, WebP, GIF images or PDF files are allowed';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    ALLOWED_TYPES.has(file.mimetype) ? cb(null, true) : cb(ApiError.badRequest(TYPE_ERROR)),
});

// A truncated or malformed multipart body makes the parser throw a plain Error (not a MulterError);
// that is the client's mistake, so answer 400 rather than letting it surface as a 500.
const receiveFile = (req, res, next) =>
  upload.single('file')(req, res, (err) => {
    if (!err || err instanceof multer.MulterError || err instanceof ApiError) return next(err);
    return next(ApiError.badRequest('The upload request was malformed', { file: 'Choose a file to upload' }));
  });

const router = Router();

router.post(
  '/',
  receiveFile,
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('No file uploaded', { file: 'Choose a file to upload' });

    // The declared type must match what the bytes actually are
    const actual = sniffMime(req.file.buffer);
    if (!actual || actual !== req.file.mimetype) {
      throw ApiError.badRequest("That file's contents don't match its type", { file: TYPE_ERROR });
    }

    if (!isCloudinaryConfigured) {
      throw new ApiError(503, 'File uploads are not configured (set CLOUDINARY_* in server/.env)');
    }

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'one-chembur', resource_type: 'auto' }, (err, uploaded) =>
          err ? reject(err) : resolve(uploaded),
        )
        .end(req.file.buffer);
    });

    res.status(201).json({
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format,
        bytes: result.bytes,
      },
    });
  }),
);

export default router;
