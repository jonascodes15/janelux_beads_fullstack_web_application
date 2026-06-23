const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'noreply@janeluxbeads.com';

const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Janelux Beads</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0A0A0A; font-family: Georgia, serif; color: #F5EDD6; }
  .wrapper { max-width: 600px; margin: 0 auto; background: #111111; }
  .header { background: #0A0A0A; padding: 32px 40px; text-align: center; border-bottom: 1px solid #C9993F; }
  .brand { font-family: Arial Black, Arial, sans-serif; font-size: 22px; letter-spacing: 6px; color: #C9993F; text-transform: uppercase; }
  .brand-sub { font-size: 10px; letter-spacing: 4px; color: #888; margin-top: 4px; text-transform: uppercase; }
  .body { padding: 48px 40px; }
  .greeting { font-size: 14px; letter-spacing: 2px; text-transform: uppercase; color: #C9993F; margin-bottom: 24px; }
  h1 { font-size: 28px; color: #F5EDD6; margin-bottom: 16px; line-height: 1.3; }
  p { font-size: 15px; line-height: 1.8; color: #B0A090; margin-bottom: 16px; }
  .otp-box { background: #0A0A0A; border: 1px solid #C9993F; padding: 24px; text-align: center; margin: 32px 0; border-radius: 4px; }
  .otp-code { font-family: 'Courier New', monospace; font-size: 48px; font-weight: bold; color: #C9993F; letter-spacing: 12px; }
  .otp-note { font-size: 12px; color: #666; margin-top: 8px; letter-spacing: 1px; }
  .btn { display: inline-block; background: #C9993F; color: #0A0A0A; padding: 16px 40px; font-size: 12px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase; text-decoration: none; margin: 24px 0; }
  .divider { border: none; border-top: 1px solid #222; margin: 32px 0; }
  .order-table { width: 100%; border-collapse: collapse; margin: 24px 0; }
  .order-table th { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #C9993F; padding: 8px 0; border-bottom: 1px solid #333; text-align: left; }
  .order-table td { padding: 12px 0; font-size: 14px; color: #B0A090; border-bottom: 1px solid #1A1A1A; }
  .order-total { font-size: 16px; color: #F5EDD6; font-weight: bold; }
  .footer { background: #0A0A0A; padding: 32px 40px; text-align: center; border-top: 1px solid #1A1A1A; }
  .footer-text { font-size: 11px; color: #444; letter-spacing: 1px; line-height: 2; }
  .footer a { color: #C9993F; text-decoration: none; }
  .social { margin: 16px 0; }
  .social a { color: #666; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin: 0 12px; text-decoration: none; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="brand">Janelux Beads</div>
    <div class="brand-sub">Luxury African Bead Accessories</div>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <div class="social">
      <a href="https://www.instagram.com/janeluxbeads">Instagram</a>
      <a href="https://www.tiktok.com/@janelux_beads">TikTok</a>
    </div>
    <div class="footer-text">
      © ${new Date().getFullYear()} Janelux Beads. All rights reserved.<br />
      Handcrafted with love in Nigeria 🇳🇬<br />
      <a href="#">Unsubscribe</a> · <a href="#">Privacy Policy</a>
    </div>
  </div>
</div>
</body>
</html>`;

const emailService = {
  async sendOTP(to, name, otp) {
    const content = `
      <p class="greeting">Email Verification</p>
      <h1>Welcome to Janelux Beads</h1>
      <p>Hello ${name},</p>
      <p>Thank you for joining our exclusive community. Please verify your email address with the code below:</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="otp-note">This code expires in 15 minutes</div>
      </div>
      <p>If you did not create an account with Janelux Beads, please ignore this email.</p>`;

    return resend.emails.send({
      from: `Janelux Beads <${FROM}>`,
      to,
      subject: `${otp} — Your Janelux Beads Verification Code`,
      html: baseTemplate(content),
    });
  },

  async sendPasswordReset(to, name, resetUrl) {
    const content = `
      <p class="greeting">Password Reset</p>
      <h1>Reset Your Password</h1>
      <p>Hello ${name},</p>
      <p>We received a request to reset your Janelux Beads account password. Click the button below to set a new password:</p>
      <div style="text-align:center">
        <a href="${resetUrl}" class="btn">Reset My Password</a>
      </div>
      <p style="font-size:12px;color:#555">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>`;

    return resend.emails.send({
      from: `Janelux Beads <${FROM}>`,
      to,
      subject: 'Reset Your Janelux Beads Password',
      html: baseTemplate(content),
    });
  },

  async sendOrderConfirmation(to, name, order, items) {
    const itemsHtml = items.map(i => `
      <tr>
        <td>${i.product_name}</td>
        <td style="text-align:center">${i.quantity}</td>
        <td style="text-align:right">₦${Number(i.price).toLocaleString()}</td>
      </tr>`).join('');

    const content = `
      <p class="greeting">Order Confirmed</p>
      <h1>Thank You for Your Order!</h1>
      <p>Hello ${name},</p>
      <p>Your order has been received and we're preparing your handcrafted pieces with love. Here's your order summary:</p>
      <div style="background:#0A0A0A;padding:16px;margin:16px 0;border-radius:4px">
        <span style="font-size:11px;letter-spacing:2px;color:#C9993F;text-transform:uppercase">Order Number</span>
        <div style="font-size:20px;color:#F5EDD6;font-weight:bold;margin-top:4px">#${order.order_number}</div>
      </div>
      <table class="order-table">
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align:center">Qty</th>
            <th style="text-align:right">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding-top:16px;font-size:12px;letter-spacing:1px;color:#666;text-transform:uppercase">Shipping</td>
            <td style="text-align:right;padding-top:16px;color:#B0A090">₦${Number(order.shipping_fee).toLocaleString()}</td>
          </tr>
          ${order.discount_amount > 0 ? `
          <tr>
            <td colspan="2" style="font-size:12px;letter-spacing:1px;color:#666;text-transform:uppercase">Discount</td>
            <td style="text-align:right;color:#4CAF50">-₦${Number(order.discount_amount).toLocaleString()}</td>
          </tr>` : ''}
          <tr>
            <td colspan="2" style="padding-top:16px;" class="order-total">Total</td>
            <td style="text-align:right;padding-top:16px;" class="order-total">₦${Number(order.total).toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
      <hr class="divider" />
      <p style="font-size:13px">Shipping to: <strong style="color:#F5EDD6">${order.shipping_address}, ${order.shipping_city}, ${order.shipping_state}</strong></p>
      <p>We will notify you when your order is on its way. ✨</p>`;

    return resend.emails.send({
      from: `Janelux Beads <${FROM}>`,
      to,
      subject: `Order Confirmed — #${order.order_number} | Janelux Beads`,
      html: baseTemplate(content),
    });
  },

  async sendShippingUpdate(to, name, order) {
    const content = `
      <p class="greeting">Order Update</p>
      <h1>Your Order is On Its Way!</h1>
      <p>Hello ${name},</p>
      <p>Exciting news — your Janelux Beads order <strong style="color:#C9993F">#${order.order_number}</strong> has been shipped and is on its way to you.</p>
      <p>Expected delivery: <strong style="color:#F5EDD6">3–7 business days</strong> depending on your location.</p>
      <p>Thank you for supporting handcrafted African artistry. 🌍</p>`;

    return resend.emails.send({
      from: `Janelux Beads <${FROM}>`,
      to,
      subject: `Your Order is Shipped — #${order.order_number} | Janelux Beads`,
      html: baseTemplate(content),
    });
  },

  async sendNewsletterWelcome(to) {
    const content = `
      <p class="greeting">Welcome to the Family</p>
      <h1>You're In!</h1>
      <p>Thank you for joining the Janelux Beads community.</p>
      <p>You'll be the first to know about new collections, exclusive drops, and special offers — plus enjoy <strong style="color:#C9993F">10% off your first order</strong>.</p>
      <p>Use code <strong style="color:#C9993F;font-size:18px;letter-spacing:2px">WELCOME10</strong> at checkout.</p>
      <div style="text-align:center">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/shop" class="btn">Shop Now</a>
      </div>`;

    return resend.emails.send({
      from: `Janelux Beads <${FROM}>`,
      to,
      subject: 'Welcome to Janelux Beads — Here\'s 10% Off',
      html: baseTemplate(content),
    });
  },
};

module.exports = emailService;
