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
  assert.equal((await pat1('GET', '/api/appointments')).body.length, 1);
  assert.equal((await pat2('GET', '/api/appointments')).body.length, 0);
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

test('deleting a doctor removes the login too (no orphaned account)', async () => {
  await admin('POST', '/api/auth/login', { username: 'root', password: 'adminpass1' });
  assert.equal((await admin('DELETE', `/api/doctors/${ids.doctor}`)).status, 204);
  assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM users WHERE username='house'`).get().n, 0);
  // The deleted doctor's existing session stops working immediately.
  assert.equal((await doc('GET', '/api/auth/me')).status, 401);
  assert.equal((await doc('POST', '/api/auth/login', { username: 'house', password: 'password123' })).status, 401);
  // Their appointments went with them.
  assert.equal((await admin('GET', '/api/appointments')).body.length, 0);
});

test('admin dashboard counts', async () => {
  const { body } = await admin('GET', '/api/me/dashboard');
  assert.equal(body.counts.patients, 2);
  assert.equal(body.counts.doctors, 0);
});
