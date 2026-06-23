const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/products - list with filters
router.get('/', async (req, res) => {
  try {
    const { category, search, featured, new: isNew, limit = 20, offset = 0, sort = 'newest' } = req.query;

    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as primary_image,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) as fallback_image,
        COALESCE(AVG(r.rating), 0) as avg_rating, COUNT(DISTINCT r.id) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = TRUE
      WHERE p.is_active = TRUE
    `;
    const params = [];

    if (category) { query += ' AND c.slug = ?'; params.push(category); }
    if (search) { query += ' AND (p.name LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (featured === 'true') { query += ' AND p.is_featured = TRUE'; }
    if (isNew === 'true') { query += ' AND p.is_new = TRUE'; }

    query += ' GROUP BY p.id';

    const sortMap = { newest: 'p.created_at DESC', oldest: 'p.created_at ASC', price_asc: 'p.price ASC', price_desc: 'p.price DESC', popular: 'review_count DESC' };
    query += ` ORDER BY ${sortMap[sort] || 'p.created_at DESC'}`;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [products] = await db.query(query, params);
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = TRUE ${category ? 'AND c.slug = ?' : ''} ${search ? 'AND (p.name LIKE ? OR p.description LIKE ?)' : ''}`,
      category ? [category, ...(search ? [`%${search}%`, `%${search}%`] : [])] : (search ? [`%${search}%`, `%${search}%`] : [])
    );

    const formatted = products.map(p => ({
      ...p,
      primary_image: p.primary_image || p.fallback_image,
      price: parseFloat(p.price),
      compare_price: p.compare_price ? parseFloat(p.compare_price) : null,
      avg_rating: parseFloat(p.avg_rating).toFixed(1),
    }));

    res.json({ success: true, products: formatted, total: countResult[0].total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

// GET /api/products/:slug
router.get('/:slug', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
        COALESCE(AVG(r.rating), 0) as avg_rating, COUNT(DISTINCT r.id) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = TRUE
      WHERE p.slug = ? AND p.is_active = TRUE
      GROUP BY p.id
    `, [req.params.slug]);

    if (!rows.length) return res.status(404).json({ success: false, message: 'Product not found' });

    const [images] = await db.query('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order', [rows[0].id]);
    const [reviews] = await db.query(`
      SELECT r.*, u.full_name FROM reviews r JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ? AND r.is_approved = TRUE ORDER BY r.created_at DESC LIMIT 10
    `, [rows[0].id]);
    const [related] = await db.query(`
      SELECT p.*, (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) as primary_image
      FROM products p WHERE p.category_id = ? AND p.id != ? AND p.is_active = TRUE LIMIT 4
    `, [rows[0].category_id, rows[0].id]);

    res.json({ success: true, product: { ...rows[0], price: parseFloat(rows[0].price), images, reviews, related } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
});

// Admin: POST create product
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, short_description, price, compare_price, stock_qty, category_id, is_featured, is_new, meta_title, meta_description, images } = req.body;
    const slugify = require('slugify');
    let slug = slugify(name, { lower: true, strict: true });

    const [existing] = await db.query('SELECT id FROM products WHERE slug = ?', [slug]);
    if (existing.length) slug = `${slug}-${Date.now()}`;

    const [result] = await db.query(
      `INSERT INTO products (name, slug, description, short_description, price, compare_price, stock_qty, category_id, is_featured, is_new, meta_title, meta_description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, description, short_description, price, compare_price || null, stock_qty || 0, category_id || null, is_featured || false, is_new !== false, meta_title || name, meta_description || short_description]
    );

    if (images && images.length) {
      for (let i = 0; i < images.length; i++) {
        await db.query(
          'INSERT INTO product_images (product_id, image_url, sort_order, is_primary) VALUES (?, ?, ?, ?)',
          [result.insertId, images[i], i, i === 0]
        );
      }
    }

    res.status(201).json({ success: true, message: 'Product created', product_id: result.insertId, slug });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
});

// Admin: PUT update product
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, short_description, price, compare_price, stock_qty, category_id, is_featured, is_new, is_active, meta_title, meta_description, images } = req.body;
    const slugify = require('slugify');
    const slug = slugify(name, { lower: true, strict: true });

    await db.query(
      `UPDATE products SET name=?, slug=?, description=?, short_description=?, price=?, compare_price=?, stock_qty=?, category_id=?, is_featured=?, is_new=?, is_active=?, meta_title=?, meta_description=?, updated_at=NOW()
       WHERE id=?`,
      [name, slug, description, short_description, price, compare_price || null, stock_qty, category_id, is_featured, is_new, is_active !== false, meta_title, meta_description, req.params.id]
    );

    if (images) {
      await db.query('DELETE FROM product_images WHERE product_id = ?', [req.params.id]);
      for (let i = 0; i < images.length; i++) {
        await db.query('INSERT INTO product_images (product_id, image_url, sort_order, is_primary) VALUES (?, ?, ?, ?)', [req.params.id, images[i], i, i === 0]);
      }
    }

    res.json({ success: true, message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

// Admin: DELETE product
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await db.query('UPDATE products SET is_active = FALSE WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Product removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

module.exports = router;
