import { getSettings, addJobs, updateJob, addApplication, addLog } from './storage';
import { notifyNewJob, notifyApplied, notifyError } from './notify';
import { Linking } from 'react-native';

const API = 'https://www.amazon.jobs/en-gb/search.json';

const KEYWORDS = [
  'warehouse operative', 'fulfilment associate', 'sortation associate',
  'delivery station warehouse associate', 'warehouse team member',
];

const BLOCKED = ['full-time', 'permanent full-time', 'regular full-time'];

function isPartTime(job) {
  const t = (job.job_type || job.employment_type || '').toLowerCase();
  const title = (job.title || '').toLowerCase();
  const sched = (job.schedule_type || '').toLowerCase();
  if (BLOCKED.some(b => t.includes(b) || title.includes(b))) return false;
  return t.includes('part-time') || t.includes('part time') || title.includes('part-time') || sched.includes('part');
}

function matchesKeywords(title) {
  const t = (title || '').toLowerCase();
  return KEYWORDS.some(k => t.includes(k));
}

async function fetchJobs(locations) {
  const all = [];
  const enabledLocs = Object.entries(locations).filter(([, v]) => v).map(([k]) => k);

  for (const loc of enabledLocs) {
    try {
      const params = new URLSearchParams({
        base_query: 'warehouse',
        loc_query: `${loc}, United Kingdom`,
        job_type: 'Part-Time',
        result_limit: '25',
        sort: 'recent',
        category: 'fulfillment-and-operations-management',
      });
      const resp = await fetch(`${API}?${params}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android) AppleWebKit/537.36', Accept: 'application/json' },
      });
      if (!resp.ok) continue;
      const data = await resp.json();
      all.push(...(data.jobs || []).map(j => ({ ...j, _loc: loc })));
      // Polite delay
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.log(`[monitor] Error ${loc}:`, err.message);
    }
  }
  return all;
}

export async function runMonitorCycle() {
  const settings = await getSettings();
  if (!settings.monitoring_enabled) return { checked: 0, found: 0 };

  console.log('[monitor] Running cycle...');
  const raw = await fetchJobs(settings.locations);
  let found = 0;

  const newJobs = [];
  for (const job of raw) {
    const externalId = String(job.id_icims || job.id || job.job_path || '');
    if (!externalId) continue;

    const title = job.title || '';
    if (!matchesKeywords(title)) continue;

    const jobType = job.job_type || job.employment_type || '';
    if (!isPartTime({ ...job, job_type: jobType })) continue;

    const jobUrl = job.job_path ? `https://www.amazon.jobs${job.job_path}` : (job.url || '');
    const location = job.normalized_location || job.location || job._loc || '';

    newJobs.push({
      externalId,
      title,
      location,
      job_type: jobType,
      shift: job.schedule_type || '',
      job_url: jobUrl,
      description: job.description_short || '',
      detected_at: new Date().toISOString(),
      status: 'new',
      already_applied: false,
    });
  }

  const added = await addJobs(newJobs);
  found = added.length;

  // Auto-apply: open each new job URL immediately
  if (settings.auto_apply_enabled && found > 0) {
    for (const job of added) {
      try {
        if (job.job_url) {
          await Linking.openURL(job.job_url);
          await updateJob(job.externalId, { status: 'opened', already_applied: true });
          await addApplication({ title: job.title, location: job.location, job_type: job.job_type, job_url: job.job_url, status: 'opened' });
          await addLog('auto_opened', `${job.title} — ${job.location}`);
          await notifyApplied(job);
          // Small delay between opens so user can see each
          await new Promise(r => setTimeout(r, 2000));
        }
      } catch (err) {
        await updateJob(job.externalId, { status: 'failed' });
        await addApplication({ title: job.title, location: job.location, status: 'failed', notes: err.message });
        await addLog('auto_open_failed', `${job.title}: ${err.message}`);
        await notifyError(job, err.message);
      }
    }
  } else if (found > 0) {
    for (const job of added) {
      await notifyNewJob(job);
    }
  }

  if (found > 0) await addLog('monitor_found', `${found} new part-time jobs`);
  return { checked: raw.length, found };
}
