# Amazon UK Warehouse Job Monitor

A dark-themed web dashboard that monitors Amazon's UK job listings for **part-time warehouse operative** roles and helps apply — designed for international students with work restrictions.

## Features

- 🔍 **Automated monitoring** of Amazon Jobs for part-time warehouse roles
- 📍 **Location filtering**: Coventry, Rugby, Daventry, Banbury, Birmingham, Northampton
- 🛡️ **Safety guards**: Blocks full-time applications, requires manual confirmation
- 📧 **Notifications**: Email, Telegram, browser push
- 🤖 **Application assist**: Opens browser with pre-filled fields (user completes manually)
- 🌙 **Dark UI dashboard** with Amazon-style orange accents
- 🔐 **Secure**: Encrypted credentials, JWT auth, rate limiting, helmet headers

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Install Playwright browsers (for application assist)
cd server && npx playwright install chromium && cd ..

# Configure environment
cp server/.env.example server/.env
# Edit server/.env with your secrets

# Start development (both server + client)
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Project Structure

```
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── pages/           # Dashboard, Jobs, Profile, Settings, History, Logs
│       ├── components/      # Layout with sidebar
│       ├── AuthContext.jsx   # JWT auth state
│       └── api.js           # API client
├── server/                  # Express backend
│   └── src/
│       ├── routes/          # Auth, Profile, Jobs, Settings, Automation
│       ├── services/        # Monitor engine, Notifier, Playwright assist
│       ├── db.js            # SQLite schema & connection
│       ├── auth.js          # JWT middleware
│       └── crypto.js        # AES-256-GCM encryption
└── package.json             # Root scripts
```

## Configuration

Edit `server/.env`:

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Random 64-char string for JWT signing |
| `ENCRYPTION_KEY` | 64 hex chars for AES-256 encryption |
| `SMTP_HOST/USER/PASS` | Email notifications (Gmail app password) |
| `TELEGRAM_BOT_TOKEN/CHAT_ID` | Telegram notifications |
| `VAPID_*` | Web push keys (generate: `npx web-push generate-vapid-keys`) |

## Safety & Compliance

1. **Part-time only** — hard filter blocks all full-time roles to protect student visa
2. **Auto-apply** — applies instantly when a matching job is detected (no manual confirmation delay)
3. **No CAPTCHA bypass** — if Amazon requires CAPTCHA or login, the attempt fails and you're notified
4. **No password storage** — Amazon login via persistent Playwright browser session (log in once)
5. **Duplicate prevention** — tracks applied jobs to avoid re-application
6. **Encrypted data** — sensitive fields use AES-256-GCM encryption
7. **Rate limiting** — checks every 5 min with polite delays between requests
8. **Fail-safe** — failed auto-applies are logged and can be retried from the dashboard

## How It Works

1. **First time**: Click "Setup Amazon Login" on the dashboard → log in to Amazon in the browser that opens
2. **Enable monitoring**: Click "Start Auto-Apply" on the dashboard
3. **System runs**: Every 5 minutes, checks Amazon Jobs for part-time warehouse roles in your locations
4. **Auto-applies**: When a matching job is found, immediately opens the job page and submits the application
5. **Notifies you**: Sends email/Telegram/push notification confirming the application (or reporting failure)

## Database

SQLite with tables: `users`, `candidate_profiles`, `monitored_locations`, `detected_jobs`, `application_attempts`, `notification_logs`, `app_settings`, `activity_logs`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET/PUT/DELETE | `/api/profile` | Candidate profile CRUD |
| POST | `/api/profile/cv` | Upload CV |
| GET | `/api/jobs` | List detected jobs |
| GET | `/api/jobs/stats` | Job statistics |
| GET | `/api/jobs/:id` | Job detail |
| POST | `/api/jobs/:id/apply` | Initiate application |
| POST | `/api/jobs/:id/dismiss` | Dismiss job |
| GET/PUT | `/api/settings` | App settings |
| GET/PUT | `/api/settings/locations` | Monitored locations |
| GET | `/api/settings/logs` | Activity logs |
| GET | `/api/settings/applications` | Application history |
| POST | `/api/automation/assist/:jobId` | Launch browser assist |
| POST | `/api/automation/close` | Close browser |

## Tech Stack

- **Frontend**: React 18 + Vite + React Router
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Auth**: JWT + bcrypt
- **Encryption**: AES-256-GCM
- **Monitoring**: node-cron scheduler
- **Notifications**: Nodemailer, Telegram Bot API, Web Push
- **Automation**: Playwright (user-controlled browser)
- **Security**: Helmet, CORS, rate limiting
