const express = require('express');
const router = express.Router();
const db = require('../config/db');
const emailService = require('../config/email');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    const [existing] = await db.query('SELECT id, is_active FROM newsletter_subscribers WHERE email=?', [email.toLowerCase()]);
    if (existing.length) {
      if (existing[0].is_active) return res.json({ success: true, message: 'You are already subscribed!' });
      await db.query('UPDATE newsletter_subscribers SET is_active=TRUE WHERE email=?', [email.toLowerCase()]);
    } else {
      await db.query('INSERT INTO newsletter_subscribers (email) VALUES (?)', [email.toLowerCase()]);
    }

    try { await emailService.sendNewsletterWelcome(email); } catch (_) {}
    res.json({ success: true, message: 'Subscribed! Check your email for your welcome gift.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Subscription failed' });
  }
});

router.get('/subscribers', authenticate, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM newsletter_subscribers WHERE is_active=TRUE ORDER BY subscribed_at DESC');
    res.json({ success: true, subscribers: rows, count: rows.length });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
