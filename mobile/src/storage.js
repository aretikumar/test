import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple key-value store wrapping AsyncStorage with JSON serialization

export async function getData(key) {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

export async function setData(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// --- Profile ---
export async function getProfile() {
  return (await getData('profile')) || {};
}
export async function saveProfile(profile) {
  await setData('profile', { ...profile, updated_at: new Date().toISOString() });
}

// --- Settings ---
const DEFAULT_SETTINGS = {
  monitoring_enabled: false,
  auto_apply_enabled: true,
  check_interval_minutes: 5,
  notify_enabled: true,
  job_type_filter: 'part-time',
  locations: {
    Coventry: true, Rugby: true, Daventry: true,
    Banbury: true, Birmingham: true, Northampton: true, Leicester: true,
  },
};
export async function getSettings() {
  return { ...DEFAULT_SETTINGS, ...(await getData('settings')) };
}
export async function saveSettings(settings) {
  await setData('settings', settings);
}

// --- Jobs ---
export async function getJobs() {
  return (await getData('jobs')) || [];
}
export async function saveJobs(jobs) {
  await setData('jobs', jobs);
}
export async function addJobs(newJobs) {
  const existing = await getJobs();
  const existingIds = new Set(existing.map(j => j.externalId));
  const toAdd = newJobs.filter(j => !existingIds.has(j.externalId));
  if (toAdd.length === 0) return [];
  const updated = [...toAdd, ...existing].slice(0, 500); // keep last 500
  await saveJobs(updated);
  return toAdd;
}
export async function updateJob(externalId, updates) {
  const jobs = await getJobs();
  const idx = jobs.findIndex(j => j.externalId === externalId);
  if (idx >= 0) { jobs[idx] = { ...jobs[idx], ...updates }; await saveJobs(jobs); }
}

// --- Application History ---
export async function getApplications() {
  return (await getData('applications')) || [];
}
export async function addApplication(app) {
  const apps = await getApplications();
  apps.unshift({ ...app, created_at: new Date().toISOString() });
  await setData('applications', apps.slice(0, 200));
}

// --- Activity Log ---
export async function getLogs() {
  return (await getData('logs')) || [];
}
export async function addLog(action, details) {
  const logs = await getLogs();
  logs.unshift({ action, details, created_at: new Date().toISOString() });
  await setData('logs', logs.slice(0, 300));
}
