import { Router } from 'express';
import db from '../db.js';
import { auth } from '../auth.js';
import { autoApply } from '../services/playwright.js';

const router = Router();
router.use(auth);

router.get('/', (req, res) => {
  const { status, location, limit = 50, offset = 0 } = req.query;
  let sql = 'SELECT * FROM detected_jobs WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (location) { sql += ' AND location LIKE ?'; params.push(`%${location}%`); }
  sql += ' ORDER BY detected_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  const jobs = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM detected_jobs').get().count;
  res.json({ jobs, total });
});

router.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM detected_jobs').get().c;
  const newJobs = db.prepare("SELECT COUNT(*) as c FROM detected_jobs WHERE status = 'new'").get().c;
  const applied = db.prepare("SELECT COUNT(*) as c FROM detected_jobs WHERE already_applied = 1").get().c;
  const failed = db.prepare("SELECT COUNT(*) as c FROM detected_jobs WHERE status = 'apply_failed'").get().c;
  const today = db.prepare("SELECT COUNT(*) as c FROM detected_jobs WHERE date(detected_at) = date('now')").get().c;
  res.json({ total, new: newJobs, applied, failed, today });
});

router.get('/:id', (req, res) => {
  const job = db.prepare('SELECT * FROM detected_jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

// Retry a failed auto-apply
router.post('/:id/retry', async (req, res) => {
  const job = db.prepare('SELECT * FROM detected_jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.already_applied) return res.status(400).json({ error: 'Already applied' });
  if (job.job_type?.toLowerCase().includes('full-time')) return res.status(400).json({ error: 'Cannot apply to full-time roles' });

  try {
    await autoApply(req.user.id, job);
    db.prepare("UPDATE detected_jobs SET status = 'applied', already_applied = 1 WHERE id = ?").run(job.id);
    db.prepare("INSERT INTO application_attempts (user_id, job_id, status) VALUES (?, ?, 'applied')").run(req.user.id, job.id);
    db.prepare('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)').run(req.user.id, 'manual_retry_applied', job.title);
    res.json({ success: true });
  } catch (err) {
    db.prepare("UPDATE detected_jobs SET status = 'apply_failed' WHERE id = ?").run(job.id);
    db.prepare("INSERT INTO application_attempts (user_id, job_id, status, notes) VALUES (?, ?, 'failed', ?)").run(req.user.id, job.id, err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/dismiss', (req, res) => {
  db.prepare("UPDATE detected_jobs SET status = 'dismissed' WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

export default router;
