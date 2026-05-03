import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import './db.js'; // init database
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import automationRoutes from './routes/automationRoutes.js';
import { runMonitorCycle } from './services/monitor.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// Static uploads
app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/automation', automationRoutes);

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Job monitoring cron - runs every 5 minutes for speed
cron.schedule('*/5 * * * *', async () => {
  console.log('[cron] Running auto-apply monitor cycle...');
  try { await runMonitorCycle(); } catch (err) { console.error('[cron] Monitor error:', err); }
});

// Also run immediately on startup after 10s delay
setTimeout(() => {
  console.log('[cron] Initial monitor cycle...');
  runMonitorCycle().catch(err => console.error('[cron] Initial cycle error:', err));
}, 10000);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] Running on http://0.0.0.0:${PORT}`);
  console.log('[server] Auto-apply monitor scheduled (every 5 min)');
  console.log('[server] Connect mobile app to http://<your-pc-ip>:' + PORT);
});
