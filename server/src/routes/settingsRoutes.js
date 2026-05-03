import { Router } from 'express';
import db from '../db.js';
import { auth } from '../auth.js';

const router = Router();
router.use(auth);

// Settings
router.get('/', (req, res) => {
  const settings = db.prepare('SELECT * FROM app_settings WHERE user_id = ?').get(req.user.id);
  res.json(settings || {});
});

router.put('/', (req, res) => {
  const { monitoring_enabled, auto_apply_enabled, check_interval_minutes, notify_email, notify_telegram, notify_browser, push_subscription } = req.body;
  const interval = Math.max(5, Math.min(60, check_interval_minutes || 5));
  db.prepare(`UPDATE app_settings SET monitoring_enabled=?, auto_apply_enabled=?, check_interval_minutes=?, notify_email=?, notify_telegram=?, notify_browser=?, push_subscription=?, updated_at=datetime('now') WHERE user_id=?`)
    .run(monitoring_enabled ? 1 : 0, auto_apply_enabled !== false ? 1 : 0, interval, notify_email ? 1 : 0, notify_telegram ? 1 : 0, notify_browser ? 1 : 0, push_subscription || null, req.user.id);
  db.prepare('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)').run(req.user.id, 'settings_updated', `monitoring=${monitoring_enabled}, auto_apply=${auto_apply_enabled}`);
  res.json({ success: true });
});

// Locations
router.get('/locations', (req, res) => {
  const locs = db.prepare('SELECT * FROM monitored_locations WHERE user_id = ?').all(req.user.id);
  res.json(locs);
});

router.put('/locations', (req, res) => {
  const { locations } = req.body; // [{location, enabled}]
  if (!Array.isArray(locations)) return res.status(400).json({ error: 'locations array required' });
  const del = db.prepare('DELETE FROM monitored_locations WHERE user_id = ?');
  const ins = db.prepare('INSERT INTO monitored_locations (user_id, location, enabled) VALUES (?, ?, ?)');
  db.transaction(() => {
    del.run(req.user.id);
    for (const l of locations) ins.run(req.user.id, l.location, l.enabled ? 1 : 0);
  })();
  res.json({ success: true });
});

// Activity logs
router.get('/logs', (req, res) => {
  const { limit = 100, offset = 0 } = req.query;
  const logs = db.prepare('SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(req.user.id, Number(limit), Number(offset));
  res.json(logs);
});

// Application history
router.get('/applications', (req, res) => {
  const apps = db.prepare(`
    SELECT a.*, j.title, j.location, j.job_type, j.job_url
    FROM application_attempts a JOIN detected_jobs j ON a.job_id = j.id
    WHERE a.user_id = ? ORDER BY a.created_at DESC
  `).all(req.user.id);
  res.json(apps);
});

// Notification logs
router.get('/notifications', (req, res) => {
  const logs = db.prepare('SELECT * FROM notification_logs WHERE user_id = ? ORDER BY sent_at DESC LIMIT 50').all(req.user.id);
  res.json(logs);
});

export default router;
