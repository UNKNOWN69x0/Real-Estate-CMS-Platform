import { Router } from 'express';
import multer from 'multer';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    ALLOWED_TYPES.has(file.mimetype)
      ? cb(null, true)
      : cb(ApiError.badRequest('Only JPG, PNG, WebP, GIF images or PDF files are allowed')),
});

const router = Router();

router.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!isCloudinaryConfigured) {
      throw new ApiError(503, 'File uploads are not configured (set CLOUDINARY_* in server/.env)');
    }
    if (!req.file) throw ApiError.badRequest('No file uploaded', { file: 'Choose a file to upload' });

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
