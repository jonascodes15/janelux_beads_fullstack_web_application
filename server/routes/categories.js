const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.is_active = TRUE
      WHERE c.is_active = TRUE GROUP BY c.id ORDER BY c.sort_order
    `);
    res.json({ success: true, categories: rows });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed to fetch categories' }); }
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const slugify = require('slugify');
    const { name, description, image_url, sort_order } = req.body;
    const slug = slugify(name, { lower: true, strict: true });
    const [result] = await db.query('INSERT INTO categories (name,slug,description,image_url,sort_order) VALUES (?,?,?,?,?)', [name, slug, description, image_url, sort_order || 0]);
    res.status(201).json({ success: true, category_id: result.insertId });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed' }); }
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const slugify = require('slugify');
    const { name, description, image_url, sort_order, is_active } = req.body;
    const slug = slugify(name, { lower: true, strict: true });
    await db.query('UPDATE categories SET name=?,slug=?,description=?,image_url=?,sort_order=?,is_active=? WHERE id=?', [name, slug, description, image_url, sort_order, is_active !== false, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await db.query('UPDATE categories SET is_active=FALSE WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

module.exports = router;
