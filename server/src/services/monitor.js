import db from '../db.js';
import { notifyApplied, notifyError } from './notifier.js';
import { autoApply } from './playwright.js';

const AMAZON_JOBS_API = 'https://www.amazon.jobs/en-gb/search.json';

const KEYWORDS = [
  'warehouse operative',
  'fulfilment associate',
  'sortation associate',
  'delivery station warehouse associate',
  'warehouse team member'
];

const BLOCKED_TYPES = ['full-time', 'permanent full-time', 'regular full-time'];

function isPartTime(job) {
  const type = (job.job_type || job.employment_type || '').toLowerCase();
  const title = (job.title || '').toLowerCase();
  const schedule = (job.schedule_type || '').toLowerCase();
  if (BLOCKED_TYPES.some(b => type.includes(b) || title.includes(b))) return false;
  if (type.includes('part-time') || type.includes('part time') || title.includes('part-time') || schedule.includes('part')) return true;
  return false;
}

function matchesKeywords(title) {
  const t = (title || '').toLowerCase();
  return KEYWORDS.some(k => t.includes(k));
}

function getEnabledLocations(userId) {
  return db.prepare('SELECT location FROM monitored_locations WHERE user_id = ? AND enabled = 1').all(userId).map(r => r.location);
}

function matchesLocation(jobLocation, locations) {
  const jl = (jobLocation || '').toLowerCase();
  return locations.some(l => jl.includes(l.toLowerCase()));
}

async function fetchAmazonJobs(locations) {
  const allJobs = [];
  for (const loc of locations) {
    try {
      const params = new URLSearchParams({
        base_query: 'warehouse',
        loc_query: `${loc}, United Kingdom`,
        job_type: 'Part-Time',
        result_limit: '25',
        sort: 'recent',
        category: 'fulfillment-and-operations-management'
      });
      const resp = await fetch(`${AMAZON_JOBS_API}?${params}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JobSearchAssistant/1.0)', 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000)
      });
      if (!resp.ok) { console.log(`[monitor] API ${resp.status} for ${loc}`); continue; }
      const data = await resp.json();
      allJobs.push(...(data.jobs || []).map(j => ({ ...j, _searchLocation: loc })));
      // Brief polite delay between location queries
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`[monitor] Fetch error ${loc}:`, err.message);
    }
  }
  return allJobs;
}

export async function runMonitorCycle() {
  const users = db.prepare('SELECT u.id FROM users u JOIN app_settings s ON u.id = s.user_id WHERE s.monitoring_enabled = 1').all();
  if (!users.length) return;

  for (const user of users) {
    const settings = db.prepare('SELECT * FROM app_settings WHERE user_id = ?').get(user.id);
    const locations = getEnabledLocations(user.id);
    if (!locations.length) continue;

    console.log(`[monitor] Checking for user ${user.id} | auto-apply: ${settings.auto_apply_enabled ? 'ON' : 'OFF'}`);
    const jobs = await fetchAmazonJobs(locations);
    let applied = 0;

    for (const job of jobs) {
      const externalId = job.id_icims || job.id || job.job_path;
      if (!externalId) continue;
      if (db.prepare('SELECT id FROM detected_jobs WHERE job_id_external = ?').get(String(externalId))) continue;

      const title = job.title || '';
      if (!matchesKeywords(title)) continue;
      if (!matchesLocation(job.normalized_location || job.location || job._searchLocation, locations)) continue;

      const jobType = job.job_type || job.employment_type || '';
      if (!isPartTime({ ...job, job_type: jobType })) {
        console.log(`[monitor] BLOCKED non-part-time: "${title}" (${jobType})`);
        continue;
      }

      const jobUrl = job.job_path ? `https://www.amazon.jobs${job.job_path}` : (job.url || '');

      // Insert job immediately
      db.prepare('INSERT INTO detected_jobs (job_id_external, title, location, job_type, shift, job_url, description, status) VALUES (?,?,?,?,?,?,?,?)')
        .run(String(externalId), title, job.normalized_location || job.location || '', jobType, job.schedule_type || '', jobUrl, job.description_short || '',
          settings.auto_apply_enabled ? 'auto-applying' : 'new');

      const newJob = db.prepare('SELECT * FROM detected_jobs WHERE job_id_external = ?').get(String(externalId));

      // AUTO-APPLY: immediately trigger application if enabled
      if (settings.auto_apply_enabled) {
        try {
          console.log(`[monitor] ⚡ AUTO-APPLYING: "${title}" in ${newJob.location}`);
          await autoApply(user.id, newJob);
          db.prepare("UPDATE detected_jobs SET status = 'applied', already_applied = 1 WHERE id = ?").run(newJob.id);
          db.prepare("INSERT INTO application_attempts (user_id, job_id, status) VALUES (?, ?, 'applied')").run(user.id, newJob.id);
          db.prepare('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)').run(user.id, 'auto_applied', `${title} — ${newJob.location}`);
          await notifyApplied(user.id, newJob);
          applied++;
        } catch (err) {
          console.error(`[monitor] Auto-apply failed for "${title}":`, err.message);
          db.prepare("UPDATE detected_jobs SET status = 'apply_failed' WHERE id = ?").run(newJob.id);
          db.prepare("INSERT INTO application_attempts (user_id, job_id, status, notes) VALUES (?, ?, 'failed', ?)").run(user.id, newJob.id, err.message);
          db.prepare('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)').run(user.id, 'auto_apply_failed', `${title}: ${err.message}`);
          await notifyError(user.id, newJob, err.message);
        }
      } else {
        await notifyApplied(user.id, newJob); // just notify, don't apply
      }
    }

    if (applied > 0) {
      console.log(`[monitor] ✅ Auto-applied to ${applied} jobs for user ${user.id}`);
    }
  }
}
