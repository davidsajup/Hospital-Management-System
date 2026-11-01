/**
 * Fills the database with a believable hospital: doctors with working hours,
 * patients, and a few weeks of past and upcoming appointments.
 *
 *   npm run seed:demo            # refuses if data already exists
 *   npm run seed:demo -- --reset # wipes everyone except the seeded admin first
 *
 * Every demo account shares DEMO_PASSWORD (default "demo12345").
 */
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { createDoctor, createPatient } from './services/profiles.js';
import { setAvailability } from './services/availability.js';
import { fromMinutes, toMinutes, todayStr } from './time.js';

const PASSWORD = process.env.DEMO_PASSWORD || 'demo12345';
const reset = process.argv.includes('--reset');

const existing = db.prepare(`SELECT COUNT(*) AS n FROM users WHERE role <> 'admin'`).get().n;
if (existing > 0 && !reset) {
  console.error(`Database already has ${existing} non-admin users. Re-run with --reset to wipe them first.`);
  process.exit(1);
}
if (reset) {
  db.exec(`DELETE FROM users WHERE role <> 'admin'; DELETE FROM audit_log;`);
  db.exec(`DELETE FROM users WHERE username = 'demo.admin';`);
}

// Small deterministic PRNG so the demo looks the same every time.
let seed = 20240601;
const rand = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const dateOffset = (days) => {
  const d = new Date(`${todayStr()}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/* ---------- accounts ---------- */

db.prepare(
  `INSERT INTO users (username, password_hash, first_name, last_name, email, role)
   VALUES ('demo.admin', ?, 'Demo', 'Admin', 'admin@example.com', 'admin')`,
).run(bcrypt.hashSync(PASSWORD, 12));

const DOCTORS = [
  ['dr.mehta', 'Anita', 'Mehta', 'Cardiology', 'MBBS, MD (Cardiology), DM', 30],
  ['dr.rao', 'Vikram', 'Rao', 'Orthopaedics', 'MBBS, MS (Orthopaedics)', 30],
  ['dr.iyer', 'Lakshmi', 'Iyer', 'Paediatrics', 'MBBS, DCH, MD (Paediatrics)', 20],
  ['dr.khan', 'Imran', 'Khan', 'Dermatology', 'MBBS, MD (Dermatology)', 20],
  ['dr.fernandes', 'Maria', 'Fernandes', 'Neurology', 'MBBS, MD, DM (Neurology)', 45],
  ['dr.das', 'Subhash', 'Das', 'General Medicine', 'MBBS, MD (Medicine)', 15],
  ['dr.kapoor', 'Neha', 'Kapoor', 'Gynaecology', 'MBBS, MS (Obstetrics & Gynaecology)', 30],
  ['dr.nair', 'Arjun', 'Nair', 'ENT', 'MBBS, MS (ENT)', 20],
];

const doctors = DOCTORS.map(([username, first_name, last_name, department, education, slot], i) => {
  const d = createDoctor(
    {
      username, password: PASSWORD, first_name, last_name, department, education,
      email: `${username.replace('dr.', '')}@hospital.example`,
      phone: `98${String(10000000 + i * 1111111).slice(0, 8)}`,
    },
    null,
  );
  // Weekdays 09:00-13:00 and 14:00-17:00; one doctor also works Saturday mornings.
  const rules = [1, 2, 3, 4, 5].flatMap((weekday) => [
    { weekday, start_time: '09:00', end_time: '13:00', slot_minutes: slot },
    { weekday, start_time: '14:00', end_time: '17:00', slot_minutes: slot },
  ]);
  if (i % 4 === 1) rules.push({ weekday: 6, start_time: '09:00', end_time: '12:00', slot_minutes: slot });
  setAvailability(d.id, { rules });
  return { ...d, rules };
});

const FIRST = ['Priya', 'Rahul', 'Sneha', 'Amit', 'Kavya', 'Rohan', 'Divya', 'Karan', 'Ananya', 'Vivek', 'Pooja', 'Siddharth', 'Meera', 'Arnav', 'Ishita', 'Nikhil', 'Tanvi', 'Manish', 'Aditi', 'Harsh', 'Riya', 'Gaurav', 'Shruti', 'Yash'];
const LAST = ['Sharma', 'Nair', 'Patel', 'Gupta', 'Reddy', 'Singh', 'Joshi', 'Menon', 'Verma', 'Kulkarni', 'Bose', 'Chopra'];
const BLOOD = ['A+', 'A-', 'B+', 'B-', 'AB+', 'O+', 'O+', 'O-'];

const patients = FIRST.map((first_name, i) => {
  const last_name = LAST[i % LAST.length];
  const username = i === 0 ? 'demo.patient' : `${first_name}.${last_name}`.toLowerCase();
  return createPatient(
    {
      username, password: PASSWORD, first_name, last_name,
      email: `${username}@example.com`,
      gender: i % 3 === 0 ? 'male' : i % 3 === 1 ? 'female' : 'other',
      date_of_birth: `${1955 + Math.floor(rand() * 50)}-${String(1 + Math.floor(rand() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rand() * 28)).padStart(2, '0')}`,
      phone: `97${String(Math.floor(rand() * 1e8)).padStart(8, '0')}`,
      blood_group: pick(BLOOD),
    },
    null,
  );
});

/* ---------- appointments ---------- */

const REASONS = {
  Cardiology: ['Chest tightness on exertion', 'Blood pressure follow-up', 'Palpitations', 'ECG review'],
  Orthopaedics: ['Knee pain after running', 'Lower back pain', 'Shoulder stiffness', 'Fracture follow-up'],
  Paediatrics: ['Fever for two days', 'Routine vaccination', 'Persistent cough', 'Growth check'],
  Dermatology: ['Recurring rash', 'Acne treatment review', 'Skin allergy', 'Mole check'],
  Neurology: ['Recurring migraines', 'Dizziness', 'Numbness in fingers', 'Sleep disturbance'],
  'General Medicine': ['Fatigue and weakness', 'Seasonal flu symptoms', 'Annual check-up', 'Diabetes review'],
  Gynaecology: ['Routine check-up', 'Prenatal visit', 'Irregular cycles', 'Follow-up scan review'],
  ENT: ['Sore throat', 'Ear pain', 'Sinus congestion', 'Hearing check'],
};
const NOTES = [
  'Examined and advised rest and fluids. Review in two weeks if symptoms persist.',
  'Prescribed a short course of medication. Bloods requested; results to be reviewed at next visit.',
  'Condition stable. Continue current treatment and lifestyle changes discussed.',
  'Referred for imaging. Patient counselled on warning signs to watch for.',
];

const insert = db.prepare(
  `INSERT INTO appointments (doctor_id, patient_id, date, time, reason, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
);

function slotTimes(rules, date) {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const times = [];
  for (const r of rules.filter((x) => x.weekday === weekday)) {
    for (let m = toMinutes(r.start_time); m + r.slot_minutes <= toMinutes(r.end_time); m += r.slot_minutes) {
      times.push(fromMinutes(m));
    }
  }
  return times;
}

let created = 0;
function book(patient, doctor, date, status) {
  const times = slotTimes(doctor.rules, date);
  // The unique index guards double booking; if a slot is taken just try another.
  for (let attempt = 0; attempt < 8 && times.length; attempt++) {
    try {
      insert.run(
        doctor.id, patient.id, date, pick(times), pick(REASONS[doctor.department]), status,
        status === 'Completed' ? pick(NOTES) : '',
      );
      created++;
      return;
    } catch (err) {
      if (!/UNIQUE/.test(err.message)) throw err;
    }
  }
}

for (const patient of patients) {
  const visits = 2 + Math.floor(rand() * 4);
  for (let v = 0; v < visits; v++) {
    const doctor = pick(doctors);
    const past = rand() < 0.65;
    const date = dateOffset(past ? -1 - Math.floor(rand() * 60) : 1 + Math.floor(rand() * 21));
    const status = past ? (rand() < 0.85 ? 'Completed' : 'Cancelled') : rand() < 0.1 ? 'Cancelled' : 'Pending';
    book(patient, doctor, date, status);
  }
}
// Make sure the demo patient and the first doctor always have something upcoming.
book(patients[0], doctors[0], dateOffset(3), 'Pending');
book(patients[0], doctors[5], dateOffset(9), 'Pending');

console.log(`Seeded ${doctors.length} doctors, ${patients.length} patients, ${created} appointments.`);
console.log(`Demo logins (password "${PASSWORD}"): demo.admin, dr.mehta, demo.patient`);
