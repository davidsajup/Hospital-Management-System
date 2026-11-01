import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db, tx } from '../db.js';
import { notFound } from '../errors.js';
import { likeTerm, offsetOf, pageOf } from '../paging.js';
import { removeUpload } from '../upload.js';

/* ---------- validation ---------- */

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const name = z.string().trim().min(1, 'Required').max(150);

const account = {
  username: z
    .string()
    .trim()
    .min(3)
    .max(150)
    .regex(/^[\w.@+-]+$/, 'Letters, digits and @ . + - _ only'),
  password: z.string().min(8, 'At least 8 characters').max(128),
};
const identity = {
  first_name: name,
  last_name: name,
  email: z.string().trim().email(),
};
const doctorFields = {
  phone: z.string().trim().max(15).optional().default(''),
  department: z.string().trim().min(1, 'Required').max(100),
  education: z.string().trim().min(1, 'Required'),
};
const patientFields = {
  gender: z.enum(['male', 'female', 'other']),
  date_of_birth: dateStr.refine((d) => d <= new Date().toISOString().slice(0, 10), 'Cannot be in the future'),
  phone: z.string().trim().min(1, 'Required').max(15),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
};

export const doctorCreateSchema = z.object({ ...account, ...identity, ...doctorFields });
export const doctorUpdateSchema = z.object({ ...identity, ...doctorFields });
export const patientCreateSchema = z.object({ ...account, ...identity, ...patientFields });
export const patientUpdateSchema = z.object({ ...identity, ...patientFields });

/* ---------- serialization ---------- */

const photoUrl = (p) => (p ? `/media/${p}` : null);

function ageFrom(dob) {
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age -= 1;
  return age;
}

const present = (u) => ({ ...u, full_name: `${u.first_name} ${u.last_name}`.trim() || u.username });

export function presentDoctor(row) {
  if (!row) return row;
  const { photo, ...rest } = row;
  return present({ ...rest, photo_url: photoUrl(photo) });
}

export function presentPatient(row) {
  if (!row) return row;
  const { photo, ...rest } = row;
  return present({ ...rest, age: ageFrom(rest.date_of_birth), photo_url: photoUrl(photo) });
}

/* ---------- queries ---------- */

const DOCTOR_SQL = `
  SELECT d.id, d.user_id, d.phone, d.department, d.education, d.photo,
         u.username, u.first_name, u.last_name, u.email
    FROM doctors d JOIN users u ON u.id = d.user_id`;

const PATIENT_SQL = `
  SELECT p.id, p.user_id, p.gender, p.date_of_birth, p.phone, p.blood_group, p.photo,
         u.username, u.first_name, u.last_name, u.email
    FROM patients p JOIN users u ON u.id = p.user_id`;

/** Shared search + pagination for the two profile tables. `fields` are the searchable columns. */
function pagedProfiles({ sql, countFrom, fields, present }, { q = '', page = 1, pageSize = 10 }) {
  const args = [];
  let where = '1 = 1';
  if (q) {
    const term = likeTerm(q);
    where = '(' + fields.map((f) => `LOWER(${f}) LIKE ? ESCAPE '\\'`).join(' OR ') + ')';
    args.push(...fields.map(() => term));
  }
  const total = db.prepare(`SELECT COUNT(*) AS n ${countFrom} WHERE ${where}`).get(...args).n;
  const items = db
    .prepare(`${sql} WHERE ${where} ORDER BY u.first_name, u.last_name LIMIT ? OFFSET ?`)
    .all(...args, pageSize, offsetOf({ page, pageSize }))
    .map(present);
  return pageOf(items, total, { page, pageSize });
}

const NAME = `u.first_name || ' ' || u.last_name`;

export const listDoctors = (paging) =>
  pagedProfiles(
    {
      sql: DOCTOR_SQL,
      countFrom: 'FROM doctors d JOIN users u ON u.id = d.user_id',
      fields: [NAME, 'u.username', 'u.email', 'd.department'],
      present: presentDoctor,
    },
    paging,
  );
export const getDoctor = (id) => presentDoctor(db.prepare(`${DOCTOR_SQL} WHERE d.id = ?`).get(id));

export const listPatients = (paging) =>
  pagedProfiles(
    {
      sql: PATIENT_SQL,
      countFrom: 'FROM patients p JOIN users u ON u.id = p.user_id',
      fields: [NAME, 'u.username', 'u.email', 'p.phone', 'p.blood_group'],
      present: presentPatient,
    },
    paging,
  );
export const getPatient = (id) => presentPatient(db.prepare(`${PATIENT_SQL} WHERE p.id = ?`).get(id));

/* ---------- commands ---------- */

function insertUser(data, role) {
  const hash = bcrypt.hashSync(data.password, 12);
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO users (username, password_hash, first_name, last_name, email, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(data.username, hash, data.first_name, data.last_name, data.email, role);
  return Number(lastInsertRowid);
}

// User and profile rows are written together or not at all.
export function createDoctor(data, photo) {
  const id = tx(() => {
    const userId = insertUser(data, 'doctor');
    const r = db
      .prepare(`INSERT INTO doctors (user_id, phone, department, education, photo) VALUES (?, ?, ?, ?, ?)`)
      .run(userId, data.phone, data.department, data.education, photo ?? null);
    return Number(r.lastInsertRowid);
  });
  return getDoctor(id);
}

export function createPatient(data, photo) {
  const id = tx(() => {
    const userId = insertUser(data, 'patient');
    const r = db
      .prepare(
        `INSERT INTO patients (user_id, gender, date_of_birth, phone, blood_group, photo)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(userId, data.gender, data.date_of_birth, data.phone, data.blood_group, photo ?? null);
    return Number(r.lastInsertRowid);
  });
  return getPatient(id);
}

function updateUser(userId, data) {
  db.prepare(`UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?`).run(
    data.first_name,
    data.last_name,
    data.email,
    userId,
  );
}

export function updateDoctor(id, data, photo) {
  const existing = getDoctor(id);
  if (!existing) throw notFound('Doctor');
  const oldPhoto = db.prepare('SELECT photo FROM doctors WHERE id = ?').get(id).photo;
  tx(() => {
    updateUser(existing.user_id, data);
    db.prepare(
      `UPDATE doctors SET phone = ?, department = ?, education = ?, photo = COALESCE(?, photo) WHERE id = ?`,
    ).run(data.phone, data.department, data.education, photo ?? null, id);
  });
  if (photo) removeUpload(oldPhoto);
  return getDoctor(id);
}

export function updatePatient(id, data, photo) {
  const existing = getPatient(id);
  if (!existing) throw notFound('Patient');
  const oldPhoto = db.prepare('SELECT photo FROM patients WHERE id = ?').get(id).photo;
  tx(() => {
    updateUser(existing.user_id, data);
    db.prepare(
      `UPDATE patients SET gender = ?, date_of_birth = ?, phone = ?, blood_group = ?,
              photo = COALESCE(?, photo) WHERE id = ?`,
    ).run(data.gender, data.date_of_birth, data.phone, data.blood_group, photo ?? null, id);
  });
  if (photo) removeUpload(oldPhoto);
  return getPatient(id);
}

/** Deleting the user cascades to the profile and its appointments (no orphaned logins). */
export function deleteDoctor(id) {
  const row = db.prepare('SELECT user_id, photo FROM doctors WHERE id = ?').get(id);
  if (!row) throw notFound('Doctor');
  db.prepare('DELETE FROM users WHERE id = ?').run(row.user_id);
  removeUpload(row.photo);
}

export function deletePatient(id) {
  const row = db.prepare('SELECT user_id, photo FROM patients WHERE id = ?').get(id);
  if (!row) throw notFound('Patient');
  db.prepare('DELETE FROM users WHERE id = ?').run(row.user_id);
  removeUpload(row.photo);
}
