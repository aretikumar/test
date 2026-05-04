import db from '../db.js';
import { decrypt } from '../crypto.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { execFile } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const USER_DATA_DIR = join(__dirname, '..', '..', 'chrome-profile');
const APPLY_BASE = 'https://www.jobsatamazon.co.uk';

// Ensure profile dir exists
mkdirSync(USER_DATA_DIR, { recursive: true });

function findChrome() {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  for (const p of paths) {
    if (existsSync(p)) return p;
  }
  return null;
}

let chromeProcess = null;

/**
 * Launch REAL Chrome as a normal process — NOT through Playwright.
 * This is a completely normal Chrome window that Amazon cannot detect.
 * The user logs in manually, OTP works normally, session is saved in chrome-profile/.
 */
function launchRealChrome(url) {
  const chrome = findChrome();
  if (!chrome) throw new Error('Chrome/Edge not found. Please install Google Chrome.');

  const args = [
    `--user-data-dir=${USER_DATA_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--start-maximized',
    url,
  ];

  chromeProcess = execFile(chrome, args, (err) => {
    if (err && err.code !== null) console.log('[chrome] Process exited:', err.message);
    chromeProcess = null;
  });

  console.log(`[chrome] Launched real Chrome (PID: ${chromeProcess.pid}) → ${url}`);
}

/**
 * Open login page in REAL Chrome — no Playwright, no automation detection.
 * Amazon will send OTP normally because this is a genuine Chrome browser.
 */
export async function openLoginSession() {
  const url = `${APPLY_BASE}/login`;
  launchRealChrome(url);
  return {
    message: 'Real Chrome opened → jobsatamazon.co.uk/login. Log in normally — OTP will work. Once logged in, close the browser. The session is saved for auto-apply.'
  };
}

/**
 * Auto-apply: open the job search page in the same Chrome profile.
 * Since the user already logged in, the session cookies are there.
 */
export async function autoApply(userId, job) {
  if (job.job_type?.toLowerCase().includes('full-time')) {
    throw new Error('BLOCKED: Full-time role — not safe for student visa');
  }
  if (!job.job_url) throw new Error('No job URL');

  // Open the job URL in the same Chrome profile that has the login session
  launchRealChrome(job.job_url);

  db.prepare('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)')
    .run(userId, 'auto_opened', `${job.title} — opened in Chrome`);

  return { success: true };
}

export async function closeBrowser() {
  if (chromeProcess) {
    try { chromeProcess.kill(); } catch {}
    chromeProcess = null;
  }
}
