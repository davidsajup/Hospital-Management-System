# Hospital Management System (HMS)

A web-based hospital management system for managing patients, doctors and appointments through three role-based portals.

## Features

- **Patients:** self-registration, profile management, book appointments, cancel pending appointments, view doctor's notes.
- **Doctors:** dashboard, view their appointments and the patients on them, set status and add notes/prescriptions, edit their profile.
- **Admin:** dashboard stats, full CRUD for doctors, patients and appointments.

## Tech stack

| | |
|---|---|
| Backend | Node.js (>= 22.13), Express 5, SQLite (`node:sqlite`), Zod, JWT in an httpOnly cookie, bcrypt, Multer |
| Frontend | React 19, Vite, React Router, Bootstrap 5 |

## Setup

```bash
# 1. API
cd backend
npm install
cp .env.example .env     # then edit JWT_SECRET and SEED_ADMIN_PASSWORD
npm run seed             # creates the first admin user
npm run dev              # http://localhost:4000

# 2. Web app (second terminal)
cd frontend
npm install
npm run dev              # http://localhost:5173
```

Open http://localhost:5173 and sign in with the admin you seeded. Patients can register themselves; the admin creates doctors.

### Tests

```bash
cd backend && npm test
```

The API tests cover authentication, role access, appointment ownership, double-booking, and cascading deletes.

## Project structure

```
backend/
  src/app.js            Express app (middleware, routes)
  src/db.js             SQLite schema and transaction helper
  src/auth.js           JWT cookie session, requireAuth / requireRole
  src/routes/           auth, doctors, patients, appointments, me (profile + dashboard)
  src/services/         validation + queries for profiles and appointments
  test/                 API integration tests
frontend/
  src/api.js            fetch wrapper (cookies, JSON/multipart, error mapping)
  src/auth.jsx          session context
  src/pages/            one file per screen
  src/components/       layout, shared form and table pieces
```

## Notes on API behaviour

- Passwords are hashed with bcrypt; sessions are 8-hour JWTs in an httpOnly, SameSite=Lax cookie, and the user is re-read from the database on every request.
- A doctor cannot have two non-cancelled appointments at the same date and time (enforced by a unique index).
- Patients cancel appointments rather than deleting them, so records and notes are kept. Only admins can delete.
- Deleting a doctor or patient also deletes their login and appointments.
- Uploaded photos are limited to 2 MB JPEG/PNG/WebP and stored under `backend/uploads/`.

## Deploying

The browser must reach the API on the **same origin** as the site (the dev server does this with a proxy). In production, serve `frontend/dist` and reverse-proxy `/api` and `/media` to the Express app, and set `NODE_ENV=production` (secure cookies), a strong `JWT_SECRET`, and `CLIENT_ORIGIN` to your site's URL.
