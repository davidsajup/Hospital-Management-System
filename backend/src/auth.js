import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { HttpError, forbidden } from './errors.js';

const COOKIE = 'hms_token';
const MAX_AGE_MS = 8 * 60 * 60 * 1000;

function secret() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
  return process.env.JWT_SECRET;
}

export function setSession(res, user) {
  const token = jwt.sign({ sub: user.id }, secret(), { expiresIn: '8h' });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    // Secure cookies need HTTPS. COOKIE_SECURE=false allows a plain-HTTP production-mode run (e.g. local Docker).
    secure: (process.env.COOKIE_SECURE ?? String(process.env.NODE_ENV === 'production')) === 'true',
    maxAge: MAX_AGE_MS,
  });
}

export function clearSession(res) {
  res.clearCookie(COOKIE);
}

/** Loads the current user (with role and profile ids) from the session cookie. */
export function requireAuth(req, _res, next) {
  const token = req.cookies?.[COOKIE];
  if (!token) throw new HttpError(401, 'Not authenticated');
  let payload;
  try {
    payload = jwt.verify(token, secret());
  } catch {
    throw new HttpError(401, 'Session expired');
  }
  // Re-read from the DB so deleted users lose access immediately.
  const user = db
    .prepare(
      `SELECT u.id, u.username, u.first_name, u.last_name, u.email, u.role,
              d.id AS doctor_id, p.id AS patient_id
         FROM users u
         LEFT JOIN doctors d ON d.user_id = u.id
         LEFT JOIN patients p ON p.user_id = u.id
        WHERE u.id = ?`,
    )
    .get(payload.sub);
  if (!user) throw new HttpError(401, 'Account no longer exists');
  req.user = user;
  next();
}

export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user.role)) throw forbidden();
    next();
  };
