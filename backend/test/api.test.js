import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { db } from '../src/db.js';
import { createApp } from '../src/app.js';

let server;
let base;

/** Tiny cookie-keeping client so each "person" has their own session. */
function client() {
  let cookie = '';
  return async (method, path, body) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'content-type': 'application/json', cookie },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null };
  };
}

const futureDate = (days = 3) => {
  const d = new Date(Date.now() + days * 86400000);
  return d.toISOString().slice(0, 10);
};

const doctorPayload = (username) => ({
  username,
  password: 'password123',
  first_name: 'Greg',
  last_name: 'House',
  email: `${username}@example.com`,
  department: 'Diagnostics',
  education: 'MD',
  phone: '123',
});
const patientPayload = (username) => ({
  username,
  password: 'password123',
  first_name: 'Pat',
  last_name: 'Ient',
  email: `${username}@example.com`,
  gender: 'female',
  date_of_birth: '1990-05-01',
  phone: '555',
  blood_group: 'O+',
});

const admin = client();
const doc = client();
const pat1 = client();
const pat2 = client();
const ids = {};

before(async () => {
  db.prepare(
    `INSERT INTO users (username, password_hash, role) VALUES ('root', ?, 'admin')`,
  ).run(bcrypt.hashSync('adminpass1', 4));
  server = createApp().listen(0);
  base = `http://localhost:${server.address().port}`;

  assert.equal((await admin('POST', '/api/auth/login', { username: 'root', password: 'adminpass1' })).status, 200);
  ids.doctor = (await admin('POST', '/api/doctors', doctorPayload('house'))).body.id;
  assert.ok(ids.doctor);
  // Open every weekday 08:00-18:00 in 30 minute slots so booking tests do not depend on today's date.
  const rules = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, start_time: '08:00', end_time: '18:00', slot_minutes: 30 }));
  assert.equal((await admin('PUT', `/api/doctors/${ids.doctor}/availability`, { rules })).status, 200);
  ids.idleDoctor = (await admin('POST', '/api/doctors', doctorPayload('idle'))).body.id; // no hours set
  assert.equal((await admin('POST', '/api/auth/logout')).status, 204);
});

after(() => server.close());

test('requires authentication', async () => {
  const anon = client();
  assert.equal((await anon('GET', '/api/appointments')).status, 401);
  assert.equal((await anon('GET', '/api/doctors')).status, 401);
});

test('wrong password and unknown user get the same response', async () => {
  const c = client();
  const a = await c('POST', '/api/auth/login', { username: 'root', password: 'nope' });
  const b = await c('POST', '/api/auth/login', { username: 'ghost', password: 'nope' });
  assert.equal(a.status, 401);
  assert.deepEqual(a.body, b.body);
});

test('patients can self-register, validation errors are per-field', async () => {
  const bad = await client()('POST', '/api/auth/register', { username: 'x' });
  assert.equal(bad.status, 400);
  assert.ok(bad.body.details.password);
  assert.equal((await pat1('POST', '/api/auth/register', patientPayload('alice'))).status, 201);
  assert.equal((await pat2('POST', '/api/auth/register', patientPayload('bob'))).status, 201);
  assert.equal((await pat1('POST', '/api/auth/register', patientPayload('alice'))).status, 409);
  await pat1('POST', '/api/auth/login', { username: 'alice', password: 'password123' });
  await pat2('POST', '/api/auth/login', { username: 'bob', password: 'password123' });
  await doc('POST', '/api/auth/login', { username: 'house', password: 'password123' });
});

test('patients cannot reach admin endpoints', async () => {
  assert.equal((await pat1('GET', '/api/patients')).status, 403);
  assert.equal((await pat1('POST', '/api/doctors', doctorPayload('evil'))).status, 403);
  assert.equal((await pat1('DELETE', `/api/doctors/${ids.doctor}`)).status, 403);
});

test('booking: past dates rejected, double booking rejected', async () => {
  const past = await pat1('POST', '/api/appointments', {
    doctor_id: ids.doctor, date: '2000-01-01', time: '10:00',
  });
  assert.equal(past.status, 400);

  const slot = { doctor_id: ids.doctor, date: futureDate(), time: '10:00', reason: 'cough' };
  const first = await pat1('POST', '/api/appointments', slot);
  assert.equal(first.status, 201);
  assert.equal(first.body.status, 'Pending');
  ids.appt = first.body.id;

  const clash = await pat2('POST', '/api/appointments', slot);
  assert.equal(clash.status, 409);
});

test('people only see their own appointments', async () => {
  assert.equal((await pat1('GET', '/api/appointments')).body.items.length, 1);
  assert.equal((await pat2('GET', '/api/appointments')).body.items.length, 0);
  assert.equal((await pat2('GET', `/api/appointments/${ids.appt}`)).status, 404);
  assert.equal((await doc('GET', `/api/appointments/${ids.appt}`)).status, 200);
});

test('doctor can complete and add notes; patient cannot edit notes', async () => {
  const done = await doc('PUT', `/api/appointments/${ids.appt}`, { status: 'Completed', notes: 'rest' });
  assert.equal(done.body.status, 'Completed');
  assert.equal(done.body.notes, 'rest');
  const sneaky = await pat1('PUT', `/api/appointments/${ids.appt}`, { status: 'Completed', notes: 'x' });
  assert.equal(sneaky.status, 400);
});

test('patient cancels instead of deleting; cancelled slot can be rebooked', async () => {
  const slot = { doctor_id: ids.doctor, date: futureDate(5), time: '09:00' };
  const a = await pat1('POST', '/api/appointments', slot);
  assert.equal((await pat1('DELETE', `/api/appointments/${a.body.id}`)).status, 403);
  const cancelled = await pat1('PUT', `/api/appointments/${a.body.id}`, { status: 'Cancelled' });
  assert.equal(cancelled.body.status, 'Cancelled');
  assert.equal((await pat2('POST', '/api/appointments', slot)).status, 201);
});

/* ---------- availability, slots, search, audit ---------- */

test('slots: lists a free grid, marks taken ones, skips the past', async () => {
  await admin('POST', '/api/auth/login', { username: 'root', password: 'adminpass1' });
  const date = futureDate(10);
  const doctor = (await admin('POST', '/api/doctors', doctorPayload('slotdoc'))).body.id;
  await admin('PUT', `/api/doctors/${doctor}/availability`, {
    rules: [{ weekday: new Date(`${date}T00:00:00Z`).getUTCDay(), start_time: '09:00', end_time: '11:00', slot_minutes: 30 }],
  });

  const free = await pat1('GET', `/api/doctors/${doctor}/slots?date=${date}`);
  assert.deepEqual(free.body.slots.map((s) => s.time), ['09:00', '09:30', '10:00', '10:30']);
  assert.ok(free.body.slots.every((s) => s.available));

  assert.equal((await pat1('POST', '/api/appointments', { doctor_id: doctor, date, time: '09:30' })).status, 201);
  const after = await pat2('GET', `/api/doctors/${doctor}/slots?date=${date}`);
  assert.equal(after.body.slots.find((s) => s.time === '09:30').available, false);

  assert.deepEqual((await pat1('GET', `/api/doctors/${doctor}/slots?date=2000-01-01`)).body.slots, []);
});

test('booking must use a real slot of a doctor who has hours', async () => {
  const date = futureDate(4);
  const noHours = await pat1('POST', '/api/appointments', { doctor_id: ids.idleDoctor, date, time: '10:00' });
  assert.equal(noHours.status, 400);
  const offGrid = await pat1('POST', '/api/appointments', { doctor_id: ids.doctor, date, time: '10:07' });
  assert.equal(offGrid.status, 400);
  assert.ok(offGrid.body.details.time);
  const missing = await pat1('POST', '/api/appointments', { doctor_id: ids.doctor, date });
  assert.equal(missing.status, 400);
});

test('availability: overlapping blocks rejected, doctors only edit their own', async () => {
  const overlap = await admin('PUT', `/api/doctors/${ids.idleDoctor}/availability`, {
    rules: [
      { weekday: 1, start_time: '09:00', end_time: '12:00', slot_minutes: 30 },
      { weekday: 1, start_time: '11:00', end_time: '14:00', slot_minutes: 30 },
    ],
  });
  assert.equal(overlap.status, 400);
  assert.ok(overlap.body.details.rules);

  const mine = await doc('PUT', `/api/doctors/${ids.doctor}/availability`, { rules: [] });
  assert.equal(mine.status, 200);
  const theirs = await doc('PUT', `/api/doctors/${ids.idleDoctor}/availability`, { rules: [] });
  assert.equal(theirs.status, 403);
  assert.equal((await pat1('PUT', `/api/doctors/${ids.doctor}/availability`, { rules: [] })).status, 403);
});

test('lists are paginated and searchable', async () => {
  const page = await admin('GET', '/api/patients?pageSize=1&page=2');
  assert.equal(page.body.items.length, 1);
  assert.equal(page.body.total, 2);
  assert.equal(page.body.totalPages, 2);

  const hit = await admin('GET', '/api/patients?q=ALICE');
  assert.equal(hit.body.total, 1);
  assert.equal(hit.body.items[0].username, 'alice');
  assert.equal((await admin('GET', '/api/patients?q=zzzz')).body.total, 0);

  // LIKE wildcards in user input are treated literally.
  assert.equal((await admin('GET', '/api/patients?q=%25')).body.total, 0);
  assert.equal((await admin('GET', '/api/doctors?q=diagnostics')).body.total >= 2, true);
  assert.equal((await admin('GET', '/api/patients?pageSize=500')).status, 400);
});

test('appointments filter by status and search', async () => {
  const pending = await pat1('GET', '/api/appointments?status=Pending');
  assert.ok(pending.body.items.every((a) => a.status === 'Pending'));
  const byDoctor = await pat1('GET', '/api/appointments?q=house');
  assert.ok(byDoctor.body.total >= 1);
  assert.equal((await pat1('GET', '/api/appointments?status=Bogus')).status, 400);
});

test('audit log: staff access is recorded and only admins can read it', async () => {
  assert.equal((await pat1('GET', '/api/audit')).status, 403);
  assert.equal((await doc('GET', '/api/audit')).status, 403);

  const log = await admin('GET', '/api/audit?pageSize=100');
  assert.equal(log.status, 200);
  const has = (action, entity) => log.body.items.some((e) => e.action === action && e.entity === entity);
  assert.ok(has('login', 'session'));
  assert.ok(has('create', 'doctor'));
  assert.ok(has('create', 'appointment'));
  assert.ok(has('update', 'availability'));
  // The password never appears in the log.
  assert.ok(!JSON.stringify(log.body).includes('password123'));

  // Failed logins are recorded against the attempted username.
  await client()('POST', '/api/auth/login', { username: 'alice', password: 'wrong-password' });
  const failed = await admin('GET', '/api/audit?action=login_failed');
  assert.ok(failed.body.items.some((e) => e.actor_name === 'alice'));
});

test('patient and appointment views by staff are audited', async () => {
  const appt = (await pat1('GET', '/api/appointments')).body.items[0];
  await admin('GET', `/api/appointments/${appt.id}`);
  await admin('GET', `/api/patients/${appt.patient_id}`);
  const views = await admin('GET', '/api/audit?action=view&pageSize=50');
  assert.ok(views.body.items.some((e) => e.entity === 'appointment' && e.entity_id === appt.id));
  assert.ok(views.body.items.some((e) => e.entity === 'patient' && e.entity_id === appt.patient_id));
});

/* ---------- destructive tests run last: they remove the shared doctor ---------- */

test('admin dashboard counts', async () => {
  const { body } = await admin('GET', '/api/me/dashboard');
  assert.equal(body.counts.patients, 2);
  assert.equal(body.counts.doctors, 3); // house, idle, slotdoc
  assert.ok(Array.isArray(body.upcoming));
  assert.ok(body.recent.length <= 5);
});

test('deleting a doctor removes the login too (no orphaned account)', async () => {
  assert.equal((await admin('DELETE', `/api/doctors/${ids.doctor}`)).status, 204);
  assert.equal((await admin('DELETE', `/api/doctors/${ids.doctor}`)).status, 404);
  assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM users WHERE username='house'`).get().n, 0);
  // The deleted doctor's existing session stops working immediately.
  assert.equal((await doc('GET', '/api/auth/me')).status, 401);
  assert.equal((await doc('POST', '/api/auth/login', { username: 'house', password: 'password123' })).status, 401);
  // Their appointments and working hours went with them.
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM appointments WHERE doctor_id = ?').get(ids.doctor).n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM doctor_availability WHERE doctor_id = ?').get(ids.doctor).n, 0);
  // The audit trail keeps the record of the deletion.
  const log = await admin('GET', '/api/audit?action=delete&entity=doctor');
  assert.equal(log.body.items[0].entity_id, ids.doctor);
});
