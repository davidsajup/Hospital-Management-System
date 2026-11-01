import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth.js';
import {
  bookingSchema,
  createAppointment,
  deleteAppointment,
  getAppointmentFor,
  listAppointments,
  updateAppointment,
} from '../services/appointments.js';

const router = Router();
router.use(requireAuth);

const statusFilter = z.enum(['Pending', 'Completed', 'Cancelled']).optional();

router.get('/', (req, res) => {
  const status = statusFilter.parse(req.query.status);
  const patientId = z.coerce.number().int().positive().optional().parse(req.query.patient_id);
  res.json(listAppointments(req.user, { status, patientId }));
});

router.post('/', requireRole('admin', 'patient'), (req, res) => {
  res.status(201).json(createAppointment(req.user, bookingSchema.parse(req.body)));
});

router.get('/:id', (req, res) => res.json(getAppointmentFor(req.user, Number(req.params.id))));

router.put('/:id', (req, res) => {
  res.json(updateAppointment(req.user, Number(req.params.id), req.body));
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  deleteAppointment(Number(req.params.id));
  res.status(204).end();
});

export default router;
