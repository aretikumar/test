import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, '..', 'data.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS candidate_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
    full_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    work_eligibility TEXT,
    student_availability TEXT,
    preferred_shifts TEXT,
    cv_path TEXT,
    cover_note TEXT,
    amazon_email_encrypted TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS monitored_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    location TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    UNIQUE(user_id, location)
  );

  CREATE TABLE IF NOT EXISTS detected_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id_external TEXT UNIQUE,
    title TEXT NOT NULL,
    location TEXT,
    job_type TEXT,
    shift TEXT,
    job_url TEXT,
    description TEXT,
    detected_at TEXT DEFAULT (datetime('now')),
    status TEXT DEFAULT 'new',
    already_applied INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS application_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    job_id INTEGER NOT NULL REFERENCES detected_jobs(id),
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notification_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    job_id INTEGER REFERENCES detected_jobs(id),
    channel TEXT,
    message TEXT,
    sent_at TEXT DEFAULT (datetime('now')),
    success INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
    monitoring_enabled INTEGER DEFAULT 0,
    auto_apply_enabled INTEGER DEFAULT 1,
    check_interval_minutes INTEGER DEFAULT 5,
    notify_email INTEGER DEFAULT 1,
    notify_telegram INTEGER DEFAULT 0,
    notify_browser INTEGER DEFAULT 1,
    push_subscription TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    details TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

export default db;
