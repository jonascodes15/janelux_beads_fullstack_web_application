# Janelux Beads - Luxury African Bead Accessories

A full-stack e-commerce platform for Janelux Beads — mobile-first, SEO-optimized, built with React, Node.js, and MySQL.

---

## 🛠 Tech Stack

- **Frontend:** React 18 + Vite, TailwindCSS
- **Backend:** Node.js + Express
- **Database:** MySQL
- **Payments:** Paystack
- **Email:** Resend API
- **Image Handling:** Sharp (auto-compression on upload)

---

## 📁 Project Structure

```
janelux-beads/
├── client/          # React frontend
├── server/          # Node.js backend
├── package.json     # Root scripts
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- MySQL 8.0+
- A Resend account (https://resend.com)
- A Paystack account (https://paystack.com)

---

### 1. Clone & Install

```bash
# In the project root
npm run install:all
```

---

### 2. MySQL Database Setup

Open MySQL and run:
```sql
CREATE DATABASE janelux_beads;
CREATE USER 'janelux_user'@'localhost' IDENTIFIED BY 'your_password_here';
GRANT ALL PRIVILEGES ON janelux_beads.* TO 'janelux_user'@'localhost';
FLUSH PRIVILEGES;
```

Then run the schema:
```bash
cd server
mysql -u janelux_user -p janelux_beads < config/schema.sql
```

---

### 3. Environment Variables

**Server** — create `server/.env`:
```env
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=janelux_user
DB_PASSWORD=your_password_here
DB_NAME=janelux_beads

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Resend Email API
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@janeluxbeads.com

# Paystack
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173
```

**Client** — create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx
```

---

### 4. Start Development

```bash
# From root
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

### 5. Create First Admin Account

After starting the server, visit:
```
http://localhost:5000/api/auth/setup-admin
```

This creates the default admin (only works once):
- Email: `admin@janeluxbeads.com`
- Password: `Admin@JaneLux2025!`

**Change this password immediately in the Admin Panel.**

---

## 📦 Features

### Customer
- Browse products by category
- Search with live results
- Product detail pages
- Shopping cart (persisted)
- User registration with email verification (OTP)
- Checkout with Paystack
- Order history
- Wishlist

### Admin Panel (`/admin`)
- Dashboard with sales stats
- Product management (add/edit/delete, image upload with compression)
- Category management
- Order management (view, update status)
- Customer list
- Coupon/discount codes
- Newsletter subscribers

---

## 🌍 SEO

- Dynamic meta tags per page
- Structured JSON-LD for products
- Sitemap at `/sitemap.xml`
- Open Graph tags for social sharing

---

## 📧 Email Templates

Located in `server/emails/`. Styled to match Janelux Beads brand:
- OTP Verification
- Order Confirmation
- Order Shipped
- Password Reset
- Newsletter Welcome

---

## 💳 Paystack Integration

Handles NGN payments. Test cards:
- Card: `4084 0840 8408 4081`
- Expiry: any future date
- CVV: `408`
- PIN: `0000`
- OTP: `123456`

---

## 🖼 Image Upload

Images are automatically compressed using Sharp:
- Max dimensions: 1200×1200px
- Output format: WebP
- Quality: 80%
- Stored in `server/uploads/products/`

---

## 📱 Social Links

- Instagram: https://www.instagram.com/janeluxbeads
- TikTok: https://www.tiktok.com/@janelux_beads
