import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { db } from '../db.js';
import { HttpError } from '../errors.js';
import { clearSession, requireAuth, setSession } from '../auth.js';
import { photoUpload, removeUpload, storedPath } from '../upload.js';
import { createPatient, patientCreateSchema } from '../services/profiles.js';
import { audit } from '../services/audit.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'test' ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, try again later' },
});

export const publicUser = (u) => ({
  id: u.id,
  username: u.username,
  first_name: u.first_name,
  last_name: u.last_name,
  email: u.email,
  role: u.role,
  full_name: `${u.first_name} ${u.last_name}`.trim() || u.username,
});

// Compared against when the username is unknown, so both failures take equally long.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

router.post('/login', loginLimiter, (req, res) => {
  const { username, password } = z
    .object({ username: z.string().min(1), password: z.string().min(1) })
    .parse(req.body);
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  const ok = bcrypt.compareSync(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) {
    audit({ username }, 'login_failed', 'session', user?.id ?? null, 'Invalid credentials');
    throw new HttpError(401, 'Invalid username or password');
  }
  setSession(res, user);
  audit(user, 'login', 'session', user.id);
  res.json({ user: publicUser(user) });
});

router.post('/register', ...photoUpload('patients'), (req, res) => {
  const photo = storedPath(req.file, 'patients');
  try {
    const patient = createPatient(patientCreateSchema.parse(req.body), photo);
    audit({ username: patient.username, role: 'patient', id: patient.user_id, full_name: patient.full_name }, 'register', 'patient', patient.id);
  } catch (err) {
    removeUpload(photo);
    throw err;
  }
  res.status(201).json({ message: 'Registration successful. Please log in.' });
});

router.post('/logout', (_req, res) => {
  clearSession(res);
  res.status(204).end();
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
