import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth.js';
import { forbidden, notFound } from '../errors.js';
import { parsePaging } from '../paging.js';
import { photoUpload, removeUpload, storedPath } from '../upload.js';
import {
  createDoctor,
  deleteDoctor,
  doctorCreateSchema,
  doctorUpdateSchema,
  getDoctor,
  listDoctors,
  updateDoctor,
} from '../services/profiles.js';
import { availabilitySchema, getAvailability, getSlots, setAvailability } from '../services/availability.js';
import { audit } from '../services/audit.js';

const router = Router();
router.use(requireAuth);

const idParam = (req) => Number(req.params.id);

/** 404 unless the doctor exists. */
const mustExist = (id) => {
  if (!getDoctor(id)) throw notFound('Doctor');
};

// Any signed-in user can browse doctors (patients need them to book).
router.get('/', (req, res) => res.json(listDoctors(parsePaging(req.query))));

router.get('/:id', requireRole('admin'), (req, res) => {
  const doctor = getDoctor(idParam(req));
  if (!doctor) throw notFound('Doctor');
  res.json(doctor);
});

router.get('/:id/availability', (req, res) => {
  mustExist(idParam(req));
  res.json({ rules: getAvailability(idParam(req)) });
});

router.put('/:id/availability', requireRole('admin', 'doctor'), (req, res) => {
  const id = idParam(req);
  mustExist(id);
  // Doctors manage their own hours; admins can manage anyone's.
  if (req.user.role === 'doctor' && req.user.doctor_id !== id) throw forbidden();
  const rules = setAvailability(id, availabilitySchema.parse(req.body));
  audit(req.user, 'update', 'availability', id, `${rules.length} time block(s)`);
  res.json({ rules });
});

router.get('/:id/slots', (req, res) => {
  const id = idParam(req);
  mustExist(id);
  const { date } = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD') }).parse(req.query);
  res.json({ date, slots: getSlots(id, date) });
});

router.post('/', requireRole('admin'), ...photoUpload('doctors'), (req, res) => {
  const photo = storedPath(req.file, 'doctors');
  try {
    const doctor = createDoctor(doctorCreateSchema.parse(req.body), photo);
    audit(req.user, 'create', 'doctor', doctor.id, `Dr. ${doctor.full_name}`);
    res.status(201).json(doctor);
  } catch (err) {
    removeUpload(photo);
    throw err;
  }
});

router.put('/:id', requireRole('admin'), ...photoUpload('doctors'), (req, res) => {
  const photo = storedPath(req.file, 'doctors');
  try {
    const doctor = updateDoctor(idParam(req), doctorUpdateSchema.parse(req.body), photo);
    audit(req.user, 'update', 'doctor', doctor.id, `Dr. ${doctor.full_name}`);
    res.json(doctor);
  } catch (err) {
    removeUpload(photo);
    throw err;
  }
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  const id = idParam(req);
  const doctor = getDoctor(id);
  if (!doctor) throw notFound('Doctor');
  deleteDoctor(id);
  audit(req.user, 'delete', 'doctor', id, `Dr. ${doctor.full_name}`);
  res.status(204).end();
});

export default router;
