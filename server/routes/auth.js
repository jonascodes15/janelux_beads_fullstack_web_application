const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const emailService = require('../config/email');
const { authenticate } = require('../middleware/auth');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const generateToken = (user) => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, phone } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ success: false, message: 'Email, password and name are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    const otp_expires = new Date(Date.now() + 15 * 60 * 1000);

    const [result] = await db.query(
      'INSERT INTO users (email, password_hash, full_name, phone, otp_code, otp_expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [email.toLowerCase(), password_hash, full_name, phone || null, otp, otp_expires]
    );

    await emailService.sendOTP(email, full_name, otp);

    res.status(201).json({ success: true, message: 'Account created. Please verify your email.', user_id: result.insertId });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { user_id, otp } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [user_id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });

    const user = rows[0];
    if (user.is_verified) return res.status(400).json({ success: false, message: 'Email already verified' });
    if (user.otp_code !== otp) return res.status(400).json({ success: false, message: 'Invalid verification code' });
    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ success: false, message: 'Verification code expired. Request a new one.' });
    }

    await db.query('UPDATE users SET is_verified = TRUE, otp_code = NULL, otp_expires_at = NULL WHERE id = ?', [user_id]);

    const token = generateToken(user);
    res.json({ success: true, message: 'Email verified successfully!', token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res) => {
  try {
    const { user_id } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [user_id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });

    const user = rows[0];
    if (user.is_verified) return res.status(400).json({ success: false, message: 'Email already verified' });

    const otp = generateOTP();
    const otp_expires = new Date(Date.now() + 15 * 60 * 1000);
    await db.query('UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?', [otp, otp_expires, user_id]);
    await emailService.sendOTP(user.email, user.full_name, otp);

    res.json({ success: true, message: 'New verification code sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to resend code' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!rows.length) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    if (!user.is_verified) {
      return res.status(403).json({ success: false, message: 'Please verify your email first', needs_verification: true, user_id: user.id });
    }

    const token = generateToken(user);
    res.json({ success: true, token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email?.toLowerCase()]);
    // Always return success to prevent email enumeration
    if (!rows.length) return res.json({ success: true, message: 'If an account exists, a reset link has been sent.' });

    const user = rows[0];
    const token = uuidv4();
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await db.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [token, expires, user.id]);

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await emailService.sendPasswordReset(user.email, user.full_name, resetUrl);

    res.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to process request' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Valid token and password (8+ chars) required' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()', [token]);
    if (!rows.length) return res.status(400).json({ success: false, message: 'Invalid or expired reset link' });

    const password_hash = await bcrypt.hash(password, 12);
    await db.query('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [password_hash, rows[0].id]);

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Password reset failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { full_name, phone } = req.body;
    await db.query('UPDATE users SET full_name = ?, phone = ? WHERE id = ?', [full_name, phone, req.user.id]);
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

// One-time admin setup
router.get('/setup-admin', async (req, res) => {
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE role = "admin"');
    if (existing.length) return res.json({ success: false, message: 'Admin already exists' });

    const password_hash = await bcrypt.hash('Admin@JaneLux2025!', 12);
    await db.query(
      'INSERT INTO users (email, password_hash, full_name, role, is_verified) VALUES (?, ?, ?, "admin", TRUE)',
      ['admin@janeluxbeads.com', password_hash, 'Janelux Admin']
    );
    res.json({ success: true, message: 'Admin created. Email: admin@janeluxbeads.com | Password: Admin@JaneLux2025! — Change this now!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Setup failed' });
  }
});
// PUT /api/auth/change-password
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const match = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    const hash = await bcrypt.hash(new_password, 12);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

module.exports = router;
