import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';

const uploadDir = path.resolve(env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueName = `${sanitizedBase}_${Date.now()}_${uuidv4().slice(0, 8)}${ext}`;
    cb(null, uniqueName);
  },
});

import { AppError } from './error.middleware';

const allowedMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
  'image/bmp',
  'image/x-ms-bmp',
  'image/x-png',
  'image/pjpeg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream', // Fallback for some Windows image uploads
];

const allowedExtensions = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.svg',
  '.avif',
  '.bmp',
  '.jfif',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
];

export const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024, // e.g. 15MB
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isMimeAllowed = allowedMimeTypes.includes(file.mimetype);
    const isExtAllowed = allowedExtensions.includes(ext);

    if (isMimeAllowed || isExtAllowed) {
      cb(null, true);
    } else {
      cb(new AppError(`Unsupported file format (${ext || file.mimetype}). Please upload an image (PNG, JPG, WEBP, SVG) or document (PDF, DOCX).`, 400));
    }
  },
});

export const uploadSingle = (fieldName: string) => upload.single(fieldName);
