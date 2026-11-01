import { z } from 'zod';
import { db } from '../db.js';
import { HttpError, forbidden, notFound } from '../errors.js';
import { likeTerm, offsetOf, pageOf } from '../paging.js';
import { todayStr } from '../time.js';
import { getSlots } from './availability.js';

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
const optionalTime = z
  .string()
  .regex(timeRe, 'Use HH:MM')
  .nullable()
  .optional()
  .transform((t) => t || null);

const STATUS = z.enum(['Pending', 'Completed', 'Cancelled']);

export const bookingSchema = z.object({
  doctor_id: z.coerce.number().int().positive(),
  patient_id: z.coerce.number().int().positive().optional(), // admin only
  date: dateStr.refine((d) => d >= todayStr(), 'Cannot book a past date'),
  time: z.string({ error: 'Pick a time slot' }).regex(timeRe, 'Use HH:MM'),
  reason: z.string().trim().max(2000).optional().default(''),
});

export const adminUpdateSchema = z.object({
  doctor_id: z.coerce.number().int().positive(),
  patient_id: z.coerce.number().int().positive(),
  date: dateStr,
  time: optionalTime,
  reason: z.string().trim().max(2000).optional().default(''),
  status: STATUS,
  notes: z.string().max(5000).optional().default(''),
});

export const doctorUpdateSchema = z.object({
  status: STATUS,
  notes: z.string().max(5000).optional().default(''),
});

export const patientUpdateSchema = z.object({ status: z.literal('Cancelled') });

export const listQuerySchema = z.object({
  status: STATUS.optional(),
  patient_id: z.coerce.number().int().positive().optional(),
  from: dateStr.optional(),
  to: dateStr.optional(),
});

const COLUMNS = `
  a.id, a.doctor_id, a.patient_id, a.date, a.time, a.reason, a.status, a.notes,
  TRIM(du.first_name || ' ' || du.last_name) AS doctor_name, du.username AS doctor_username,
  d.department AS doctor_department,
  TRIM(pu.first_name || ' ' || pu.last_name) AS patient_name, pu.username AS patient_username`;

const FROM = `
  FROM appointments a
  JOIN doctors  d  ON d.id  = a.doctor_id  JOIN users du ON du.id = d.user_id
  JOIN patients p  ON p.id  = a.patient_id JOIN users pu ON pu.id = p.user_id`;

const label = (a) => ({
  ...a,
  doctor_name: a.doctor_name || a.doctor_username,
  patient_name: a.patient_name || a.patient_username,
});

function scopeFor(user) {
  if (user.role === 'doctor') return { sql: 'a.doctor_id = ?', args: [user.doctor_id] };
  if (user.role === 'patient') return { sql: 'a.patient_id = ?', args: [user.patient_id] };
  return { sql: '1 = 1', args: [] };
}

/**
 * Appointments visible to `user`, newest first. Filters only ever narrow the
 * user's own scope, never widen it.
 */
export function listAppointments(user, { status, patient_id, from, to, q = '', page = 1, pageSize = 10 } = {}) {
  const scope = scopeFor(user);
  const where = [scope.sql];
  const args = [...scope.args];

  if (status) (where.push('a.status = ?'), args.push(status));
  if (patient_id) (where.push('a.patient_id = ?'), args.push(patient_id));
  if (from) (where.push('a.date >= ?'), args.push(from));
  if (to) (where.push('a.date <= ?'), args.push(to));
  if (q) {
    const t = likeTerm(q);
    where.push(`(LOWER(du.first_name || ' ' || du.last_name || ' ' || du.username) LIKE ? ESCAPE '\\'
              OR LOWER(pu.first_name || ' ' || pu.last_name || ' ' || pu.username) LIKE ? ESCAPE '\\'
              OR LOWER(a.reason) LIKE ? ESCAPE '\\')`);
    args.push(t, t, t);
  }

  const clause = where.join(' AND ');
  const total = db.prepare(`SELECT COUNT(*) AS n ${FROM} WHERE ${clause}`).get(...args).n;
  const items = db
    .prepare(
      `SELECT ${COLUMNS} ${FROM} WHERE ${clause}
        ORDER BY a.date DESC, a.time DESC, a.id DESC LIMIT ? OFFSET ?`,
    )
    .all(...args, pageSize, offsetOf({ page, pageSize }))
    .map(label);
  return pageOf(items, total, { page, pageSize });
}

export function appointmentCounts(user) {
  const scope = scopeFor(user);
  const rows = db
    .prepare(`SELECT a.status, COUNT(*) AS n FROM appointments a WHERE ${scope.sql} GROUP BY a.status`)
    .all(...scope.args);
  const by = Object.fromEntries(rows.map((r) => [r.status, r.n]));
  return {
    total: rows.reduce((sum, r) => sum + r.n, 0),
    pending: by.Pending ?? 0,
    completed: by.Completed ?? 0,
    cancelled: by.Cancelled ?? 0,
  };
}

/** Upcoming pending appointments (today onwards), soonest first. */
export function upcomingAppointments(user, limit = 5) {
  const scope = scopeFor(user);
  return db
    .prepare(
      `SELECT ${COLUMNS} ${FROM}
        WHERE ${scope.sql} AND a.status = 'Pending' AND a.date >= ?
        ORDER BY a.date, a.time LIMIT ?`,
    )
    .all(...scope.args, todayStr(), limit)
    .map(label);
}

/** Fetches one appointment, enforcing that the user may see it. */
export function getAppointmentFor(user, id) {
  const row = db.prepare(`SELECT ${COLUMNS} ${FROM} WHERE a.id = ?`).get(id);
  if (!row) throw notFound('Appointment');
  const allowed =
    user.role === 'admin' ||
    (user.role === 'doctor' && row.doctor_id === user.doctor_id) ||
    (user.role === 'patient' && row.patient_id === user.patient_id);
  // 404 rather than 403 so ids of other people's records are not revealed.
  if (!allowed) throw notFound('Appointment');
  return label(row);
}

function assertExists(table, id, what) {
  if (!db.prepare(`SELECT 1 FROM ${table} WHERE id = ?`).get(id)) {
    throw new HttpError(400, 'Validation failed', { [`${what}_id`]: `Unknown ${what}` });
  }
}

export function createAppointment(user, input) {
  if (user.role === 'doctor') throw forbidden('Doctors cannot book appointments');
  const patientId = user.role === 'patient' ? user.patient_id : input.patient_id;
  if (!patientId) throw new HttpError(400, 'Validation failed', { patient_id: 'Required' });
  assertExists('doctors', input.doctor_id, 'doctor');
  assertExists('patients', patientId, 'patient');

  const slot = getSlots(input.doctor_id, input.date).find((s) => s.time === input.time);
  if (!slot) {
    throw new HttpError(400, 'Validation failed', { time: 'This doctor is not available at that time' });
  }
  if (!slot.available) throw new HttpError(409, 'That time slot was just taken, please pick another');

  // The unique index is the real guard against two people booking the same slot at once.
  const r = db
    .prepare(`INSERT INTO appointments (doctor_id, patient_id, date, time, reason) VALUES (?, ?, ?, ?, ?)`)
    .run(input.doctor_id, patientId, input.date, input.time, input.reason);
  return getAppointmentFor(user, Number(r.lastInsertRowid));
}

export function updateAppointment(user, id, body) {
  const current = getAppointmentFor(user, id);

  if (user.role === 'admin') {
    const d = adminUpdateSchema.parse(body);
    assertExists('doctors', d.doctor_id, 'doctor');
    assertExists('patients', d.patient_id, 'patient');
    db.prepare(
      `UPDATE appointments SET doctor_id=?, patient_id=?, date=?, time=?, reason=?, status=?, notes=? WHERE id=?`,
    ).run(d.doctor_id, d.patient_id, d.date, d.time, d.reason, d.status, d.notes, id);
  } else if (user.role === 'doctor') {
    const d = doctorUpdateSchema.parse(body);
    db.prepare(`UPDATE appointments SET status=?, notes=? WHERE id=?`).run(d.status, d.notes, id);
  } else {
    patientUpdateSchema.parse(body);
    if (current.status !== 'Pending') {
      throw new HttpError(409, 'Only pending appointments can be cancelled');
    }
    db.prepare(`UPDATE appointments SET status='Cancelled' WHERE id=?`).run(id);
  }
  return getAppointmentFor(user, id);
}

export function deleteAppointment(id) {
  const r = db.prepare('DELETE FROM appointments WHERE id = ?').run(id);
  if (!r.changes) throw notFound('Appointment');
}
