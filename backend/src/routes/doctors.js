import { Router } from 'express';
import { requireAuth, requireRole } from '../auth.js';
import { notFound } from '../errors.js';
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

const router = Router();
router.use(requireAuth);

// Any signed-in user can browse doctors (patients need them to book).
router.get('/', (_req, res) => res.json(listDoctors()));

router.get('/:id', requireRole('admin'), (req, res) => {
  const doctor = getDoctor(Number(req.params.id));
  if (!doctor) throw notFound('Doctor');
  res.json(doctor);
});

router.post('/', requireRole('admin'), ...photoUpload('doctors'), (req, res) => {
  const photo = storedPath(req.file, 'doctors');
  try {
    res.status(201).json(createDoctor(doctorCreateSchema.parse(req.body), photo));
  } catch (err) {
    removeUpload(photo);
    throw err;
  }
});

router.put('/:id', requireRole('admin'), ...photoUpload('doctors'), (req, res) => {
  const photo = storedPath(req.file, 'doctors');
  try {
    res.json(updateDoctor(Number(req.params.id), doctorUpdateSchema.parse(req.body), photo));
  } catch (err) {
    removeUpload(photo);
    throw err;
  }
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  deleteDoctor(Number(req.params.id));
  res.status(204).end();
});

export default router;
