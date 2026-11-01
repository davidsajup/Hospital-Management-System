import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';
import { notFound } from '../errors.js';
import { photoUpload, removeUpload, storedPath } from '../upload.js';
import {
  createPatient,
  deletePatient,
  getPatient,
  listPatients,
  patientCreateSchema,
  patientUpdateSchema,
  updatePatient,
} from '../services/profiles.js';

const router = Router();
router.use(requireAuth);

router.get('/', requireRole('admin'), (_req, res) => res.json(listPatients()));

// Admins can see anyone; a doctor only sees patients they have an appointment with.
router.get('/:id', requireRole('admin', 'doctor'), (req, res) => {
  const id = Number(req.params.id);
  if (req.user.role === 'doctor') {
    const treats = db
      .prepare('SELECT 1 FROM appointments WHERE doctor_id = ? AND patient_id = ? LIMIT 1')
      .get(req.user.doctor_id, id);
    if (!treats) throw notFound('Patient');
  }
  const patient = getPatient(id);
  if (!patient) throw notFound('Patient');
  res.json(patient);
});

router.post('/', requireRole('admin'), ...photoUpload('patients'), (req, res) => {
  const photo = storedPath(req.file, 'patients');
  try {
    res.status(201).json(createPatient(patientCreateSchema.parse(req.body), photo));
  } catch (err) {
    removeUpload(photo);
    throw err;
  }
});

router.put('/:id', requireRole('admin'), ...photoUpload('patients'), (req, res) => {
  const photo = storedPath(req.file, 'patients');
  try {
    res.json(updatePatient(Number(req.params.id), patientUpdateSchema.parse(req.body), photo));
  } catch (err) {
    removeUpload(photo);
    throw err;
  }
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  deletePatient(Number(req.params.id));
  res.status(204).end();
});

export default router;
