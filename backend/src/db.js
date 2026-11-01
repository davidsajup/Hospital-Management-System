import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = process.env.DB_PATH || './data/hms.db';
if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);

db.exec(`
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  first_name    TEXT NOT NULL DEFAULT '',
  last_name     TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL DEFAULT '',
  role          TEXT NOT NULL CHECK (role IN ('admin','doctor','patient'))
);

CREATE TABLE IF NOT EXISTS doctors (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  phone      TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL,
  education  TEXT NOT NULL DEFAULT 'MBBS',
  photo      TEXT
);

CREATE TABLE IF NOT EXISTS patients (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  gender        TEXT NOT NULL CHECK (gender IN ('male','female','other')),
  date_of_birth TEXT NOT NULL,
  phone         TEXT NOT NULL,
  blood_group   TEXT NOT NULL CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  photo         TEXT
);

CREATE TABLE IF NOT EXISTS appointments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id  INTEGER NOT NULL REFERENCES doctors(id)  ON DELETE CASCADE,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date       TEXT NOT NULL,
  time       TEXT,
  reason     TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Completed','Cancelled')),
  notes      TEXT NOT NULL DEFAULT ''
);

-- A doctor cannot have two live appointments at the same date and time.
CREATE UNIQUE INDEX IF NOT EXISTS uq_doctor_slot
  ON appointments(doctor_id, date, time)
  WHERE time IS NOT NULL AND status <> 'Cancelled';

-- Weekly working hours. A doctor may have several blocks per day (e.g. morning and evening).
CREATE TABLE IF NOT EXISTS doctor_availability (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id    INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  weekday      INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),  -- 0 = Sunday
  start_time   TEXT NOT NULL,
  end_time     TEXT NOT NULL,
  slot_minutes INTEGER NOT NULL DEFAULT 30 CHECK (slot_minutes BETWEEN 10 AND 120),
  CHECK (start_time < end_time)
);
CREATE INDEX IF NOT EXISTS ix_avail_doctor ON doctor_availability(doctor_id, weekday);

-- Append-only record of who did what. No foreign keys, so entries outlive the users they name.
CREATE TABLE IF NOT EXISTS audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  actor_id   INTEGER,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL,
  entity_id  INTEGER,
  summary    TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS ix_audit_at ON audit_log(at DESC);

CREATE INDEX IF NOT EXISTS ix_appt_patient ON appointments(patient_id, date);
CREATE INDEX IF NOT EXISTS ix_appt_doctor  ON appointments(doctor_id, date);
`);

/** Run fn inside a transaction; rolls back if it throws. */
export function tx(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
