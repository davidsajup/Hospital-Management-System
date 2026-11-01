import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './errors.js';
import { UPLOAD_DIR } from './upload.js';
import authRoutes from './routes/auth.js';
import doctorRoutes from './routes/doctors.js';
import patientRoutes from './routes/patients.js';
import appointmentRoutes from './routes/appointments.js';
import meRoutes from './routes/me.js';

export function createApp() {
  const app = express();
  const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

  app.disable('x-powered-by');
  // Photos are loaded cross-origin by the Vite frontend.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  // SameSite=Lax cookies + this check block cross-site writes (CSRF) from other origins.
  app.use((req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const sent = req.get('origin');
    if (sent && sent !== origin) return res.status(403).json({ error: 'Cross-origin request blocked' });
    next();
  });

  app.use('/media', express.static(UPLOAD_DIR, { fallthrough: true, index: false }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes);
  app.use('/api/doctors', doctorRoutes);
  app.use('/api/patients', patientRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/me', meRoutes);

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use(errorHandler);
  return app;
}
