const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/', authenticate, async (req, res) => {
  try {
    const { product_id, rating, title, body } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Rating 1-5 required' });
    const [existing] = await db.query('SELECT id FROM reviews WHERE product_id=? AND user_id=?', [product_id, req.user.id]);
    if (existing.length) return res.status(409).json({ success: false, message: 'Already reviewed' });
    await db.query('INSERT INTO reviews (product_id,user_id,rating,title,body) VALUES (?,?,?,?,?)', [product_id, req.user.id, rating, title, body]);
    res.status(201).json({ success: true, message: 'Review submitted, pending approval.' });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.get('/pending', authenticate, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT r.*, u.full_name, p.name as product_name FROM reviews r JOIN users u ON r.user_id=u.id JOIN products p ON r.product_id=p.id WHERE r.is_approved=FALSE ORDER BY r.created_at DESC');
    res.json({ success: true, reviews: rows });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.patch('/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    await db.query('UPDATE reviews SET is_approved=TRUE WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM reviews WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

module.exports = router;
