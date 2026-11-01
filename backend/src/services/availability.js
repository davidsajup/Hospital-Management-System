import { z } from 'zod';
import { db, tx } from '../db.js';
import { HttpError } from '../errors.js';
import { fromMinutes, nowTime, todayStr, toMinutes, weekdayOf } from '../time.js';

const timeStr = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM');

const ruleSchema = z
  .object({
    weekday: z.coerce.number().int().min(0).max(6),
    start_time: timeStr,
    end_time: timeStr,
    slot_minutes: z.coerce.number().int().min(10).max(120).default(30),
  })
  .refine((r) => r.start_time < r.end_time, { message: 'End must be after start', path: ['end_time'] });

export const availabilitySchema = z.object({ rules: z.array(ruleSchema).max(35) });

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const getAvailability = (doctorId) =>
  db
    .prepare(
      `SELECT weekday, start_time, end_time, slot_minutes FROM doctor_availability
        WHERE doctor_id = ? ORDER BY weekday, start_time`,
    )
    .all(doctorId);

/** Replaces the doctor's whole weekly schedule. */
export function setAvailability(doctorId, { rules }) {
  const byDay = new Map();
  for (const r of rules) {
    const list = byDay.get(r.weekday) ?? [];
    list.push(r);
    byDay.set(r.weekday, list);
  }
  for (const [day, list] of byDay) {
    list.sort((a, b) => a.start_time.localeCompare(b.start_time));
    for (let i = 1; i < list.length; i++) {
      if (list[i].start_time < list[i - 1].end_time) {
        throw new HttpError(400, 'Validation failed', { rules: `Overlapping hours on ${DAYS[day]}` });
      }
    }
  }
  tx(() => {
    db.prepare('DELETE FROM doctor_availability WHERE doctor_id = ?').run(doctorId);
    const insert = db.prepare(
      `INSERT INTO doctor_availability (doctor_id, weekday, start_time, end_time, slot_minutes)
       VALUES (?, ?, ?, ?, ?)`,
    );
    for (const r of rules) insert.run(doctorId, r.weekday, r.start_time, r.end_time, r.slot_minutes);
  });
  return getAvailability(doctorId);
}

/**
 * Every bookable time for a doctor on a date, marking the ones already taken.
 * Past dates and times that have already passed today are never offered.
 */
export function getSlots(doctorId, date) {
  const today = todayStr();
  if (date < today) return [];

  const rules = db
    .prepare(
      `SELECT start_time, end_time, slot_minutes FROM doctor_availability
        WHERE doctor_id = ? AND weekday = ? ORDER BY start_time`,
    )
    .all(doctorId, weekdayOf(date));

  const booked = new Set(
    db
      .prepare(`SELECT time FROM appointments WHERE doctor_id = ? AND date = ? AND status <> 'Cancelled' AND time IS NOT NULL`)
      .all(doctorId, date)
      .map((r) => r.time),
  );

  const cutoff = date === today ? nowTime() : null;
  const slots = new Map();
  for (const rule of rules) {
    const end = toMinutes(rule.end_time);
    for (let m = toMinutes(rule.start_time); m + rule.slot_minutes <= end; m += rule.slot_minutes) {
      const time = fromMinutes(m);
      if (cutoff && time <= cutoff) continue;
      slots.set(time, { time, available: !booked.has(time) });
    }
  }
  return [...slots.values()].sort((a, b) => a.time.localeCompare(b.time));
}
