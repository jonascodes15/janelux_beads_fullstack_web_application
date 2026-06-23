const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');
const emailService = require('../config/email');

function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `JLX-${timestamp}-${random}`;
}

// POST /api/orders - create order
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { items, shipping, coupon_code, paystack_reference } = req.body;
    if (!items || !items.length) return res.status(400).json({ success: false, message: 'No items in order' });

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const [rows] = await db.query('SELECT p.*, (SELECT image_url FROM product_images WHERE product_id=p.id ORDER BY sort_order LIMIT 1) as img FROM products p WHERE id=? AND is_active=TRUE', [item.product_id]);
      if (!rows.length) return res.status(400).json({ success: false, message: `Product not found: ${item.product_id}` });
      const product = rows[0];
      if (product.stock_qty < item.quantity) return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      const itemSubtotal = parseFloat(product.price) * item.quantity;
      subtotal += itemSubtotal;
      orderItems.push({ product_id: product.id, product_name: product.name, product_image: product.img, price: product.price, quantity: item.quantity, subtotal: itemSubtotal });
    }

    // Shipping fee
    const shipping_fee = subtotal >= 50000 ? 0 : 3000;

    // Coupon
    let discount_amount = 0;
    if (coupon_code) {
      const [coupons] = await db.query('SELECT * FROM coupons WHERE code=? AND is_active=TRUE AND (expires_at IS NULL OR expires_at > NOW()) AND (max_uses IS NULL OR used_count < max_uses) AND min_order_amount <= ?', [coupon_code.toUpperCase(), subtotal]);
      if (coupons.length) {
        const coupon = coupons[0];
        discount_amount = coupon.type === 'percentage' ? (subtotal * coupon.value / 100) : coupon.value;
        await db.query('UPDATE coupons SET used_count = used_count + 1 WHERE id=?', [coupon.id]);
      }
    }

    const total = subtotal + shipping_fee - discount_amount;
    const order_number = generateOrderNumber();

    const [orderResult] = await db.query(
      `INSERT INTO orders (order_number, user_id, guest_email, status, subtotal, shipping_fee, discount_amount, total, coupon_code, paystack_reference, payment_status, shipping_name, shipping_email, shipping_phone, shipping_address, shipping_city, shipping_state, shipping_country)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [order_number, req.user?.id || null, shipping.email, 'confirmed', subtotal, shipping_fee, discount_amount, total, coupon_code || null, paystack_reference || null, paystack_reference ? 'paid' : 'pending', shipping.name, shipping.email, shipping.phone, shipping.address, shipping.city, shipping.state, shipping.country || 'Nigeria']
    );

    for (const item of orderItems) {
      await db.query('INSERT INTO order_items (order_id,product_id,product_name,product_image,price,quantity,subtotal) VALUES (?,?,?,?,?,?,?)', [orderResult.insertId, item.product_id, item.product_name, item.product_image, item.price, item.quantity, item.subtotal]);
      await db.query('UPDATE products SET stock_qty = stock_qty - ? WHERE id=?', [item.quantity, item.product_id]);
    }

    // Send confirmation email
    try {
      await emailService.sendOrderConfirmation(shipping.email, shipping.name, { order_number, shipping_fee, discount_amount, total, shipping_address: shipping.address, shipping_city: shipping.city, shipping_state: shipping.state }, orderItems);
    } catch (emailErr) { console.error('Email failed:', emailErr.message); }

    res.status(201).json({ success: true, order_number, order_id: orderResult.insertId, total });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

// GET /api/orders/my - user's orders
router.get('/my', authenticate, async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC', [req.user.id]);
    for (const order of orders) {
      const [items] = await db.query('SELECT * FROM order_items WHERE order_id=?', [order.id]);
      order.items = items;
    }
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:order_number - single order
router.get('/:order_number', optionalAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM orders WHERE order_number=?', [req.params.order_number]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Order not found' });
    const order = rows[0];
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id=?', [order.id]);
    res.json({ success: true, order: { ...order, items } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
});

// Admin: PATCH update order status
router.patch('/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    await db.query('UPDATE orders SET status=?, updated_at=NOW() WHERE id=?', [status, req.params.id]);

    if (status === 'shipped') {
      const [orders] = await db.query('SELECT * FROM orders WHERE id=?', [req.params.id]);
      if (orders.length) {
        try { await emailService.sendShippingUpdate(orders[0].shipping_email, orders[0].shipping_name, orders[0]); } catch (_) {}
      }
    }
    res.json({ success: true, message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

module.exports = router;
