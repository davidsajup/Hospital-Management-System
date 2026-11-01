import { Router } from 'express';
import { requireAuth, requireRole } from '../auth.js';
import { parsePaging } from '../paging.js';
import {
  bookingSchema,
  createAppointment,
  deleteAppointment,
  getAppointmentFor,
  listAppointments,
  listQuerySchema,
  updateAppointment,
} from '../services/appointments.js';
import { audit } from '../services/audit.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const filters = listQuerySchema.parse(req.query);
  res.json(listAppointments(req.user, { ...filters, ...parsePaging(req.query) }));
});

router.post('/', requireRole('admin', 'patient'), (req, res) => {
  const appt = createAppointment(req.user, bookingSchema.parse(req.body));
  audit(req.user, 'create', 'appointment', appt.id, `${appt.patient_name} with Dr. ${appt.doctor_name} on ${appt.date} ${appt.time}`);
  res.status(201).json(appt);
});

router.get('/:id', (req, res) => {
  const appt = getAppointmentFor(req.user, Number(req.params.id));
  // Patients reading their own record is routine; staff access is what gets logged.
  if (req.user.role !== 'patient') audit(req.user, 'view', 'appointment', appt.id, appt.patient_name);
  res.json(appt);
});

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const appt = updateAppointment(req.user, id, req.body);
  audit(req.user, 'update', 'appointment', id, `${appt.patient_name} · ${appt.status}`);
  res.json(appt);
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  const appt = getAppointmentFor(req.user, id);
  deleteAppointment(id);
  audit(req.user, 'delete', 'appointment', id, `${appt.patient_name} · ${appt.date}`);
  res.status(204).end();
});

export default router;
