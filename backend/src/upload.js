import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const dir = path.join(UPLOAD_DIR, req.uploadFolder || 'misc');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    // Never trust the client's filename or extension.
    cb(null, crypto.randomUUID() + EXT_BY_MIME[file.mimetype]);
  },
});

const uploader = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, cb) {
    if (EXT_BY_MIME[file.mimetype]) return cb(null, true);
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Photo must be a JPEG, PNG or WebP image'));
  },
});

/** Middleware: accepts an optional `photo` file stored under uploads/<folder>/. */
export const photoUpload = (folder) => [
  (req, _res, next) => {
    req.uploadFolder = folder;
    next();
  },
  uploader.single('photo'),
];

/** Relative path stored in the DB, e.g. "doctors/abc.jpg". */
export const storedPath = (file, folder) => (file ? `${folder}/${file.filename}` : undefined);

export function removeUpload(relPath) {
  if (!relPath) return;
  const full = path.resolve(UPLOAD_DIR, relPath);
  if (full.startsWith(UPLOAD_DIR + path.sep)) fs.rm(full, { force: true }, () => {});
}
