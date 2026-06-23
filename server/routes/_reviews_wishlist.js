const express = require('express');
const reviewsRouter = express.Router();
const wishlistRouter = express.Router();
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Reviews
reviewsRouter.post('/', authenticate, async (req, res) => {
  try {
    const { product_id, rating, title, body } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Rating must be 1-5' });
    const [existing] = await db.query('SELECT id FROM reviews WHERE product_id=? AND user_id=?', [product_id, req.user.id]);
    if (existing.length) return res.status(409).json({ success: false, message: 'You have already reviewed this product' });
    await db.query('INSERT INTO reviews (product_id, user_id, rating, title, body) VALUES (?,?,?,?,?)', [product_id, req.user.id, rating, title, body]);
    res.status(201).json({ success: true, message: 'Review submitted for approval. Thank you!' });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

reviewsRouter.patch('/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    await db.query('UPDATE reviews SET is_approved=TRUE WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

reviewsRouter.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM reviews WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// Wishlist
wishlistRouter.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT w.*, p.name, p.price, p.slug,
        (SELECT image_url FROM product_images WHERE product_id=p.id ORDER BY sort_order LIMIT 1) as image
      FROM wishlist w JOIN products p ON w.product_id = p.id
      WHERE w.user_id=? ORDER BY w.created_at DESC
    `, [req.user.id]);
    res.json({ success: true, items: rows });
  } catch (err) { res.status(500).json({ success: false }); }
});

wishlistRouter.post('/', authenticate, async (req, res) => {
  try {
    const { product_id } = req.body;
    const [existing] = await db.query('SELECT id FROM wishlist WHERE user_id=? AND product_id=?', [req.user.id, product_id]);
    if (existing.length) {
      await db.query('DELETE FROM wishlist WHERE user_id=? AND product_id=?', [req.user.id, product_id]);
      return res.json({ success: true, action: 'removed' });
    }
    await db.query('INSERT INTO wishlist (user_id, product_id) VALUES (?,?)', [req.user.id, product_id]);
    res.json({ success: true, action: 'added' });
  } catch (err) { res.status(500).json({ success: false }); }
});

wishlistRouter.delete('/:product_id', authenticate, async (req, res) => {
  try {
    await db.query('DELETE FROM wishlist WHERE user_id=? AND product_id=?', [req.user.id, req.params.product_id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

module.exports = { reviewsRouter, wishlistRouter };
