const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { authenticate, requireAdmin } = require('../middleware/auth');

const uploadsDir = path.join(__dirname, '../uploads/products');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'));
  },
});

// POST /api/upload/product-image
router.post('/product-image', authenticate, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });

    const filename = `${uuidv4()}.webp`;
    const outputPath = path.join(uploadsDir, filename);

    // Compress and convert to WebP
    await sharp(req.file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(outputPath);

    const stats = fs.statSync(outputPath);
    const originalSize = req.file.size;
    const compressedSize = stats.size;
    const reduction = Math.round((1 - compressedSize / originalSize) * 100);

    const imageUrl = `/uploads/products/${filename}`;
    res.json({
      success: true,
      url: imageUrl,
      original_size: originalSize,
      compressed_size: compressedSize,
      reduction_percent: reduction,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: 'Upload failed: ' + err.message });
  }
});

// POST /api/upload/multiple (up to 5 images)
router.post('/multiple', authenticate, requireAdmin, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || !req.files.length) return res.status(400).json({ success: false, message: 'No images uploaded' });

    const urls = [];
    for (const file of req.files) {
      const filename = `${uuidv4()}.webp`;
      const outputPath = path.join(uploadsDir, filename);
      await sharp(file.buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(outputPath);
      urls.push(`/uploads/products/${filename}`);
    }

    res.json({ success: true, urls });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Upload failed: ' + err.message });
  }
});

module.exports = router;
