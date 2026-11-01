import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';
import { photoUpload, removeUpload, storedPath } from '../upload.js';
import {
  doctorUpdateSchema,
  getDoctor,
  getPatient,
  patientUpdateSchema,
  updateDoctor,
  updatePatient,
} from '../services/profiles.js';
import { appointmentCounts, listAppointments, upcomingAppointments } from '../services/appointments.js';
import { audit } from '../services/audit.js';

const router = Router();
router.use(requireAuth);

// The signed-in doctor's/patient's own profile. No ids in the URL, so nothing to tamper with.
router.get('/profile', requireRole('doctor', 'patient'), (req, res) => {
  res.json(
    req.user.role === 'doctor' ? getDoctor(req.user.doctor_id) : getPatient(req.user.patient_id),
  );
});

router.put('/profile', requireRole('doctor', 'patient'), ...photoUpload('profiles'), (req, res) => {
  const photo = storedPath(req.file, 'profiles');
  try {
    const updated =
      req.user.role === 'doctor'
        ? updateDoctor(req.user.doctor_id, doctorUpdateSchema.parse(req.body), photo)
        : updatePatient(req.user.patient_id, patientUpdateSchema.parse(req.body), photo);
    audit(req.user, 'update', req.user.role, updated.id, 'Own profile');
    res.json(updated);
  } catch (err) {
    removeUpload(photo);
    throw err;
  }
});

router.get('/dashboard', (req, res) => {
  const { user } = req;
  const counts = appointmentCounts(user);
  if (user.role === 'admin') {
    counts.doctors = db.prepare('SELECT COUNT(*) AS n FROM doctors').get().n;
    counts.patients = db.prepare('SELECT COUNT(*) AS n FROM patients').get().n;
  }
  res.json({
    role: user.role,
    counts,
    upcoming: upcomingAppointments(user, 5),
    recent: listAppointments(user, { page: 1, pageSize: 5 }).items,
  });
});

export default router;
