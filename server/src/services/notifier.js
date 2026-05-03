import nodemailer from 'nodemailer';
import webPush from 'web-push';
import db from '../db.js';

let emailTransport = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  emailTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(process.env.VAPID_EMAIL || 'mailto:test@test.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
}

async function sendEmail(to, subject, text, html) {
  if (!emailTransport || !to) return false;
  try {
    await emailTransport.sendMail({ from: process.env.SMTP_USER, to, subject, text, html });
    return true;
  } catch (err) { console.error('[notify] Email:', err.message); return false; }
}

async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN, chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
    return true;
  } catch (err) { console.error('[notify] Telegram:', err.message); return false; }
}

async function sendPush(subscription, payload) {
  if (!subscription || !process.env.VAPID_PUBLIC_KEY) return false;
  try { await webPush.sendNotification(JSON.parse(subscription), JSON.stringify(payload)); return true; }
  catch (err) { console.error('[notify] Push:', err.message); return false; }
}

function log(userId, jobId, channel, msg, ok) {
  db.prepare('INSERT INTO notification_logs (user_id, job_id, channel, message, success) VALUES (?,?,?,?,?)').run(userId, jobId, channel, msg, ok ? 1 : 0);
}

async function notify(userId, channels) {
  const settings = db.prepare('SELECT * FROM app_settings WHERE user_id = ?').get(userId);
  const profile = db.prepare('SELECT email FROM candidate_profiles WHERE user_id = ?').get(userId);
  if (!settings) return;

  for (const ch of channels) {
    let ok = false;
    if (ch.type === 'email' && settings.notify_email && profile?.email) ok = await sendEmail(profile.email, ch.subject, ch.text, ch.html);
    if (ch.type === 'telegram' && settings.notify_telegram) ok = await sendTelegram(ch.text);
    if (ch.type === 'push' && settings.notify_browser) ok = await sendPush(settings.push_subscription, ch.payload);
    log(userId, ch.jobId, ch.type, ch.text?.slice(0, 200), ok);
  }
}

export async function notifyApplied(userId, job) {
  const text = `✅ AUTO-APPLIED!\n\n📋 ${job.title}\n📍 ${job.location}\n⏰ ${job.job_type}\n🔗 ${job.job_url}\n📅 ${new Date().toLocaleString()}`;
  const html = `<div style="font-family:sans-serif;background:#1a1a2e;color:#eee;padding:20px;border-radius:8px">
    <h2 style="color:#22c55e">✅ Auto-Applied!</h2>
    <p><strong>${job.title}</strong></p>
    <p>📍 ${job.location} · ⏰ ${job.job_type}</p>
    <a href="${job.job_url}" style="display:inline-block;background:#ff9900;color:#000;padding:10px 20px;border-radius:4px;text-decoration:none;margin-top:10px">View Job</a>
  </div>`;

  await notify(userId, [
    { type: 'email', jobId: job.id, subject: `✅ Applied: ${job.title} — ${job.location}`, text, html },
    { type: 'telegram', jobId: job.id, text },
    { type: 'push', jobId: job.id, payload: { title: `✅ Applied: ${job.title}`, body: job.location, url: job.job_url } },
  ]);
}

export async function notifyError(userId, job, error) {
  const text = `⚠️ Auto-apply FAILED\n\n📋 ${job.title}\n📍 ${job.location}\n❌ ${error}\n\nPlease check the dashboard.`;
  await notify(userId, [
    { type: 'email', jobId: job.id, subject: `⚠️ Apply failed: ${job.title}`, text, html: `<pre style="color:#ef4444">${text}</pre>` },
    { type: 'telegram', jobId: job.id, text },
    { type: 'push', jobId: job.id, payload: { title: `⚠️ Failed: ${job.title}`, body: error } },
  ]);
}
