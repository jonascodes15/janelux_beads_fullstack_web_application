const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate, requireAdmin);

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [[{ total_revenue }]] = await db.query("SELECT COALESCE(SUM(total),0) as total_revenue FROM orders WHERE payment_status='paid'");
    const [[{ total_orders }]] = await db.query("SELECT COUNT(*) as total_orders FROM orders");
    const [[{ total_customers }]] = await db.query("SELECT COUNT(*) as total_customers FROM users WHERE role='customer'");
    const [[{ total_products }]] = await db.query("SELECT COUNT(*) as total_products FROM products WHERE is_active=TRUE");
    const [[{ pending_orders }]] = await db.query("SELECT COUNT(*) as pending_orders FROM orders WHERE status='pending'");
    const [[{ newsletter_count }]] = await db.query("SELECT COUNT(*) as newsletter_count FROM newsletter_subscribers WHERE is_active=TRUE");
    const [[{ pending_reviews }]] = await db.query("SELECT COUNT(*) as pending_reviews FROM reviews WHERE is_approved=FALSE");

    // Revenue last 7 days
    const [revenue_chart] = await db.query(`
      SELECT DATE(created_at) as date, SUM(total) as revenue, COUNT(*) as orders
      FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND payment_status='paid'
      GROUP BY DATE(created_at) ORDER BY date
    `);

    // Top products
    const [top_products] = await db.query(`
      SELECT p.name, p.price, SUM(oi.quantity) as units_sold, SUM(oi.subtotal) as revenue
      FROM order_items oi JOIN products p ON oi.product_id=p.id
      GROUP BY oi.product_id ORDER BY units_sold DESC LIMIT 5
    `);

    // Recent orders
    const [recent_orders] = await db.query(`
      SELECT o.*, u.full_name FROM orders o LEFT JOIN users u ON o.user_id=u.id
      ORDER BY o.created_at DESC LIMIT 10
    `);

    res.json({
      success: true,
      stats: { total_revenue, total_orders, total_customers, total_products, pending_orders, newsletter_count, pending_reviews },
      revenue_chart,
      top_products,
      recent_orders,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Dashboard error' });
  }
});

// GET /api/admin/orders
router.get('/orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = 'SELECT o.*, u.full_name FROM orders o LEFT JOIN users u ON o.user_id=u.id WHERE 1=1';
    const params = [];
    if (status) { query += ' AND o.status=?'; params.push(status); }
    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const [orders] = await db.query(query, params);
    res.json({ success: true, orders });
  } catch (err) { res.status(500).json({ success: false }); }
});

// GET /api/admin/customers
router.get('/customers', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.full_name, u.email, u.phone, u.is_verified, u.newsletter_subscribed, u.created_at,
        COUNT(o.id) as order_count, COALESCE(SUM(o.total),0) as total_spent
      FROM users u LEFT JOIN orders o ON o.user_id=u.id AND o.payment_status='paid'
      WHERE u.role='customer' GROUP BY u.id ORDER BY u.created_at DESC
    `);
    res.json({ success: true, customers: rows });
  } catch (err) { res.status(500).json({ success: false }); }
});

// Coupons CRUD
router.get('/coupons', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM coupons ORDER BY created_at DESC');
    res.json({ success: true, coupons: rows });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.post('/coupons', async (req, res) => {
  try {
    const { code, type, value, min_order_amount, max_uses, expires_at } = req.body;
    await db.query('INSERT INTO coupons (code,type,value,min_order_amount,max_uses,expires_at) VALUES (?,?,?,?,?,?)',
      [code.toUpperCase(), type, value, min_order_amount || 0, max_uses || null, expires_at || null]);
    res.status(201).json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.code === 'ER_DUP_ENTRY' ? 'Coupon code already exists' : 'Failed' }); }
});

router.put('/coupons/:id', async (req, res) => {
  try {
    const { code, type, value, min_order_amount, max_uses, expires_at, is_active } = req.body;
    await db.query('UPDATE coupons SET code=?,type=?,value=?,min_order_amount=?,max_uses=?,expires_at=?,is_active=? WHERE id=?',
      [code.toUpperCase(), type, value, min_order_amount, max_uses || null, expires_at || null, is_active, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.delete('/coupons/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM coupons WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// Validate coupon (public)
router.post('/validate-coupon', async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    const [rows] = await db.query(
      'SELECT * FROM coupons WHERE code=? AND is_active=TRUE AND (expires_at IS NULL OR expires_at>NOW()) AND (max_uses IS NULL OR used_count<max_uses) AND min_order_amount<=?',
      [code?.toUpperCase(), subtotal]
    );
    if (!rows.length) return res.json({ success: false, message: 'Invalid or expired coupon code' });
    const c = rows[0];
    const discount = c.type === 'percentage' ? (subtotal * c.value / 100) : c.value;
    res.json({ success: true, coupon: c, discount });
  } catch (err) { res.status(500).json({ success: false }); }
});

module.exports = router;
