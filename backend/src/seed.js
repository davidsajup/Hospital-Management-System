import bcrypt from 'bcryptjs';
import { db } from './db.js';

const username = process.env.SEED_ADMIN_USERNAME || 'admin';
const password = process.env.SEED_ADMIN_PASSWORD;

if (!password || password.length < 8) {
  console.error('Set SEED_ADMIN_PASSWORD (8+ characters) in .env first.');
  process.exit(1);
}

const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
if (existing) {
  console.log(`User "${username}" already exists, nothing to do.`);
} else {
  db.prepare(
    `INSERT INTO users (username, password_hash, first_name, last_name, email, role)
     VALUES (?, ?, 'Site', 'Admin', '', 'admin')`,
  ).run(username, bcrypt.hashSync(password, 12));
  console.log(`Created admin user "${username}".`);
}
