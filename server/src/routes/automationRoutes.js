import { Router } from 'express';
import { auth } from '../auth.js';
import { openLoginSession, closeBrowser } from '../services/playwright.js';

const router = Router();
router.use(auth);

// Open browser for user to log in to Amazon (one-time setup)
router.post('/login-session', async (req, res) => {
  try {
    const result = await openLoginSession();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/close', async (req, res) => {
  try {
    await closeBrowser();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
