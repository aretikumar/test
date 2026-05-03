import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { signToken } from '../auth.js';

const router = Router();

router.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hash = bcrypt.hashSync(password, 12);
  const result = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, hash);
  const userId = result.lastInsertRowid;

  // Create default settings and locations
  db.prepare('INSERT INTO app_settings (user_id) VALUES (?)').run(userId);
  const defaultLocations = ['Coventry', 'Rugby', 'Daventry', 'Banbury', 'Birmingham', 'Northampton'];
  const insertLoc = db.prepare('INSERT INTO monitored_locations (user_id, location) VALUES (?, ?)');
  for (const loc of defaultLocations) insertLoc.run(userId, loc);

  db.prepare('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)').run(userId, 'register', 'Account created');
  res.json({ token: signToken(userId), userId });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  db.prepare('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)').run(user.id, 'login');
  res.json({ token: signToken(user.id), userId: user.id });
});

export default router;
