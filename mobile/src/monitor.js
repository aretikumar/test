import { getSettings, addJobs, updateJob, addApplication, addLog } from './storage';
import { notifyNewJob, notifyApplied, notifyError } from './notify';
import { Linking } from 'react-native';

const SEARCH_API = 'https://www.amazon.jobs/en-gb/search.json';
const APPLY_BASE = 'https://www.jobsatamazon.co.uk';

const KEYWORDS = [
  'warehouse operative', 'fulfilment associate', 'sortation associate',
  'delivery station warehouse associate', 'warehouse team member',
];

function matchesJobType(job, filter) {
  const t = (job.job_type || job.employment_type || '').toLowerCase();
  const title = (job.title || '').toLowerCase();
  const sched = (job.schedule_type || '').toLowerCase();
  if (filter === 'part-time') {
    if (t.includes('full-time') || title.includes('full-time')) return false;
    return t.includes('part-time') || t.includes('part time') || title.includes('part-time') || sched.includes('part');
  }
  if (filter === 'full-time') {
    return t.includes('full-time') || t.includes('full time') || title.includes('full-time');
  }
  return true;
}

function matchesKeywords(title) {
  return KEYWORDS.some(k => (title || '').toLowerCase().includes(k));
}

function matchesLocation(jobLocation, enabledLocs) {
  const jl = (jobLocation || '').toLowerCase();
  return enabledLocs.some(l => jl.includes(l.toLowerCase()));
}

// Fetch ALL warehouse roles across all UK locations (unfiltered)
async function fetchAllRoles(enabledLocs) {
  const all = [];
  // Search broadly — all enabled locations, no job type filter
  const searchLocs = enabledLocs.length > 0 ? enabledLocs : ['United Kingdom'];

  for (const loc of searchLocs) {
    try {
      const params = new URLSearchParams({
        base_query: 'warehouse',
        loc_query: `${loc}, United Kingdom`,
        result_limit: '25',
        sort: 'recent',
        category: 'fulfillment-and-operations-management',
      });
      // No job_type filter — fetch everything
      const resp = await fetch(`${SEARCH_API}?${params}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android) AppleWebKit/537.36', Accept: 'application/json' },
      });
      if (!resp.ok) continue;
      const data = await resp.json();
      all.push(...(data.jobs || []).map(j => ({ ...j, _loc: loc })));
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.log(`[monitor] Error ${loc}:`, err.message);
    }
  }
  // Deduplicate by ID
  const seen = new Set();
  return all.filter(j => {
    const id = String(j.id_icims || j.id || j.job_path || '');
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export async function runMonitorCycle() {
  const settings = await getSettings();
  if (!settings.monitoring_enabled) return { checked: 0, found: 0 };

  const jobTypeFilter = settings.job_type_filter || 'part-time';
  const enabledLocs = Object.entries(settings.locations || {}).filter(([, v]) => v).map(([k]) => k);

  console.log(`[monitor] Running cycle... filter: ${jobTypeFilter}, locations: ${enabledLocs.join(', ')}`);
  const raw = await fetchAllRoles(enabledLocs);

  const newJobs = [];
  for (const job of raw) {
    const externalId = String(job.id_icims || job.id || job.job_path || '');
    if (!externalId) continue;

    const title = job.title || '';
    const jobType = job.job_type || job.employment_type || '';
    const location = job.normalized_location || job.location || job._loc || '';
    const jobUrl = job.job_path ? `https://www.amazon.jobs${job.job_path}` : '';
    const applyUrl = `${APPLY_BASE}/search?location=${encodeURIComponent(job._loc || location)}`;

    // Check if this job matches our auto-apply criteria
    const isMatch = matchesKeywords(title)
      && matchesJobType({ ...job, job_type: jobType }, jobTypeFilter)
      && matchesLocation(location, enabledLocs);

    newJobs.push({
      externalId, title, location, job_type: jobType,
      shift: job.schedule_type || '',
      job_url: applyUrl,
      view_url: jobUrl,
      description: job.description_short || '',
      detected_at: new Date().toISOString(),
      status: 'new',
      already_applied: false,
      is_match: isMatch, // true = matches our filters, false = just for browsing
    });
  }

  const added = await addJobs(newJobs);
  const found = added.length;
  const matches = added.filter(j => j.is_match);

  // Only auto-apply to MATCHING jobs (correct location + job type)
  if (settings.auto_apply_enabled && matches.length > 0) {
    for (const job of matches) {
      try {
        await Linking.openURL(job.job_url);
        await updateJob(job.externalId, { status: 'opened', already_applied: true });
        await addApplication({ title: job.title, location: job.location, job_type: job.job_type, job_url: job.job_url, status: 'opened' });
        await addLog('auto_opened', `${job.title} — ${job.location}`);
        await notifyApplied(job);
        await new Promise(r => setTimeout(r, 2000));
      } catch (err) {
        await updateJob(job.externalId, { status: 'failed' });
        await addApplication({ title: job.title, location: job.location, status: 'failed', notes: err.message });
        await addLog('auto_open_failed', `${job.title}: ${err.message}`);
        await notifyError(job, err.message);
      }
    }
  } else if (matches.length > 0) {
    for (const job of matches) await notifyNewJob(job);
  }

  if (found > 0) await addLog('monitor_found', `${found} roles found, ${matches.length} match your filters`);
  return { checked: raw.length, found, matches: matches.length };
}
