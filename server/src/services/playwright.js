/**
 * Fast auto-apply via Playwright.
 * Uses a persistent browser profile so the user only logs into Amazon once.
 * After that, applications happen automatically without user interaction.
 * 
 * SAFETY: Still refuses full-time roles. Still can't bypass CAPTCHA —
 * if Amazon requires CAPTCHA, the attempt fails and user is notified.
 */
import db from '../db.js';
import { decrypt } from '../crypto.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const USER_DATA_DIR = join(__dirname, '..', '..', 'playwright-data');

let browserContext = null;

async function getBrowser() {
  if (browserContext) return browserContext;
  const { chromium } = await import('playwright');
  browserContext = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    args: ['--start-maximized'],
    viewport: null
  });
  return browserContext;
}

export async function autoApply(userId, job) {
  // Hard block on full-time
  if (job.job_type?.toLowerCase().includes('full-time')) {
    throw new Error('BLOCKED: Full-time role — not safe for student visa');
  }
  if (!job.job_url) throw new Error('No job URL');

  const profile = db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?').get(userId);
  const ctx = await getBrowser();
  const page = await ctx.newPage();

  try {
    // Navigate to job application page
    await page.goto(job.job_url, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Look for and click the Apply button
    const applyBtn = await page.$('a[href*="apply"], button:has-text("Apply"), a:has-text("Apply now"), [data-action="apply"]');
    if (applyBtn) {
      await applyBtn.click();
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    }

    // Check if we hit a login wall — if so, we can't proceed automatically
    const loginForm = await page.$('input[type="password"], form[name="signIn"], #ap_password');
    if (loginForm) {
      throw new Error('Amazon login required — please log in manually in the browser window, then re-enable monitoring');
    }

    // Check for CAPTCHA
    const captcha = await page.$('#captchacharacters, .a-box-inner img[src*="captcha"]');
    if (captcha) {
      throw new Error('CAPTCHA detected — please solve it manually in the browser window');
    }

    // Pre-fill profile fields as fast as possible
    if (profile) {
      const amazonEmail = profile.amazon_email_encrypted ? decrypt(profile.amazon_email_encrypted) : profile.email;
      const fills = [
        ['input[name*="name" i], input[id*="name" i], input[autocomplete="name"]', profile.full_name],
        ['input[name*="email" i], input[id*="email" i], input[type="email"]', amazonEmail],
        ['input[name*="phone" i], input[id*="phone" i], input[type="tel"]', profile.phone],
        ['input[name*="address" i], input[id*="address" i]', profile.address],
      ];
      for (const [sel, val] of fills) {
        if (!val) continue;
        try {
          const el = await page.$(sel);
          if (el) {
            await el.fill('');
            await el.fill(val);
          }
        } catch { /* field not present */ }
      }

      // Upload CV if available and upload field exists
      if (profile.cv_path) {
        try {
          const fileInput = await page.$('input[type="file"]');
          if (fileInput) {
            await fileInput.setInputFiles(join(__dirname, '..', '..', 'uploads', profile.cv_path));
          }
        } catch { /* no upload field */ }
      }
    }

    // Try to submit the application form
    const submitBtn = await page.$('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Continue"), button:has-text("Next")');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
    }

    console.log(`[playwright] ✅ Auto-applied: ${job.title}`);
  } finally {
    await page.close();
  }
}

/** Open browser for manual login session setup */
export async function openLoginSession() {
  const ctx = await getBrowser();
  const page = await ctx.newPage();
  await page.goto('https://www.amazon.jobs/en-gb/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  return { message: 'Browser opened. Please log in to Amazon. Once done, auto-apply will work without login prompts.' };
}

export async function closeBrowser() {
  if (browserContext) {
    await browserContext.close();
    browserContext = null;
  }
}
