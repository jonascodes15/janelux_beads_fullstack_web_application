const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT w.*, p.name, p.price, p.slug, p.stock_qty,
        (SELECT image_url FROM product_images WHERE product_id=p.id ORDER BY sort_order LIMIT 1) as image
      FROM wishlist w JOIN products p ON w.product_id=p.id WHERE w.user_id=? ORDER BY w.created_at DESC
    `, [req.user.id]);
    res.json({ success: true, items: rows });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.post('/toggle', authenticate, async (req, res) => {
  try {
    const { product_id } = req.body;
    const [existing] = await db.query('SELECT id FROM wishlist WHERE user_id=? AND product_id=?', [req.user.id, product_id]);
    if (existing.length) {
      await db.query('DELETE FROM wishlist WHERE user_id=? AND product_id=?', [req.user.id, product_id]);
      return res.json({ success: true, action: 'removed' });
    }
    await db.query('INSERT INTO wishlist (user_id,product_id) VALUES (?,?)', [req.user.id, product_id]);
    res.json({ success: true, action: 'added' });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.delete('/:product_id', authenticate, async (req, res) => {
  try {
    await db.query('DELETE FROM wishlist WHERE user_id=? AND product_id=?', [req.user.id, req.params.product_id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

module.exports = router;
