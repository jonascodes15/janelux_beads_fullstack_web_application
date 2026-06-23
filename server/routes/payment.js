// payment.js
const express = require('express');
const router = express.Router();
const https = require('https');

// POST /api/payment/verify
router.post('/verify', async (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ success: false, message: 'Reference required' });

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: `/transaction/verify/${reference}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    };

    const paystackRes = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });
      req.on('error', reject);
      req.end();
    });

    if (paystackRes.data?.status === 'success') {
      res.json({ success: true, data: paystackRes.data });
    } else {
      res.status(400).json({ success: false, message: 'Payment not successful' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
});

module.exports = router;
