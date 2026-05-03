import { Router } from 'express';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import db from '../db.js';
import { auth } from '../auth.js';
import { encrypt, decrypt } from '../crypto.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadDir = join(__dirname, '..', '..', 'uploads');
mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    cb(null, allowed.includes(file.mimetype));
  }
});

const router = Router();
router.use(auth);

router.get('/', (req, res) => {
  const profile = db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
  if (!profile) return res.json(null);
  if (profile.amazon_email_encrypted) {
    try { profile.amazon_email = decrypt(profile.amazon_email_encrypted); } catch { profile.amazon_email = ''; }
  }
  delete profile.amazon_email_encrypted;
  res.json(profile);
});

router.put('/', (req, res) => {
  const { full_name, email, phone, address, work_eligibility, student_availability, preferred_shifts, cover_note, amazon_email } = req.body;
  const amazonEnc = amazon_email ? encrypt(amazon_email) : null;

  const existing = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
  if (existing) {
    db.prepare(`UPDATE candidate_profiles SET full_name=?, email=?, phone=?, address=?, work_eligibility=?, student_availability=?, preferred_shifts=?, cover_note=?, amazon_email_encrypted=?, updated_at=datetime('now') WHERE user_id=?`)
      .run(full_name, email, phone, address, work_eligibility, student_availability, preferred_shifts, cover_note, amazonEnc, req.user.id);
  } else {
    db.prepare('INSERT INTO candidate_profiles (user_id, full_name, email, phone, address, work_eligibility, student_availability, preferred_shifts, cover_note, amazon_email_encrypted) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(req.user.id, full_name, email, phone, address, work_eligibility, student_availability, preferred_shifts, cover_note, amazonEnc);
  }

  db.prepare('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)').run(req.user.id, 'profile_updated');
  res.json({ success: true });
});

router.post('/cv', upload.single('cv'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No valid file uploaded' });
  const existing = db.prepare('SELECT id FROM candidate_profiles WHERE user_id = ?').get(req.user.id);
  if (existing) {
    db.prepare('UPDATE candidate_profiles SET cv_path = ? WHERE user_id = ?').run(req.file.filename, req.user.id);
  } else {
    db.prepare('INSERT INTO candidate_profiles (user_id, cv_path) VALUES (?, ?)').run(req.user.id, req.file.filename);
  }
  res.json({ filename: req.file.filename });
});

router.delete('/', (req, res) => {
  db.prepare('DELETE FROM candidate_profiles WHERE user_id = ?').run(req.user.id);
  db.prepare('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)').run(req.user.id, 'profile_deleted');
  res.json({ success: true });
});

export default router;
