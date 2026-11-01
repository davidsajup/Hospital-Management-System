import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';
import { notFound } from '../errors.js';
import { parsePaging } from '../paging.js';
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
import { audit } from '../services/audit.js';

const router = Router();
router.use(requireAuth);

router.get('/', requireRole('admin'), (req, res) => res.json(listPatients(parsePaging(req.query))));

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
  // Reading a medical record is itself an auditable event.
  audit(req.user, 'view', 'patient', id, patient.full_name);
  res.json(patient);
});

router.post('/', requireRole('admin'), ...photoUpload('patients'), (req, res) => {
  const photo = storedPath(req.file, 'patients');
  try {
    const patient = createPatient(patientCreateSchema.parse(req.body), photo);
    audit(req.user, 'create', 'patient', patient.id, patient.full_name);
    res.status(201).json(patient);
  } catch (err) {
    removeUpload(photo);
    throw err;
  }
});

router.put('/:id', requireRole('admin'), ...photoUpload('patients'), (req, res) => {
  const photo = storedPath(req.file, 'patients');
  try {
    const patient = updatePatient(Number(req.params.id), patientUpdateSchema.parse(req.body), photo);
    audit(req.user, 'update', 'patient', patient.id, patient.full_name);
    res.json(patient);
  } catch (err) {
    removeUpload(photo);
    throw err;
  }
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  const patient = getPatient(id);
  if (!patient) throw notFound('Patient');
  deletePatient(id);
  audit(req.user, 'delete', 'patient', id, patient.full_name);
  res.status(204).end();
});

export default router;
