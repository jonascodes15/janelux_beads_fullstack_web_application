const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Supabase client — uses service role key so it can write to storage
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BUCKET = 'product-images';

// Store file in memory — we process with sharp before uploading
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

async function uploadToSupabase(buffer, filename) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: 'image/webp',
      upsert: false,
    });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filename);

  return urlData.publicUrl;
}

// POST /api/upload/product-image — single image
router.post('/product-image', authenticate, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });

    const filename = `${uuidv4()}.webp`;
    const originalSize = req.file.size;

    // Compress and convert to WebP
    const compressed = await sharp(req.file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const compressedSize = compressed.length;
    const reduction = Math.round((1 - compressedSize / originalSize) * 100);

    const publicUrl = await uploadToSupabase(compressed, filename);

    res.json({
      success: true,
      url: publicUrl,
      original_size: originalSize,
      compressed_size: compressedSize,
      reduction_percent: reduction,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: 'Upload failed: ' + err.message });
  }
});

// POST /api/upload/multiple — up to 5 images
router.post('/multiple', authenticate, requireAdmin, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || !req.files.length) {
      return res.status(400).json({ success: false, message: 'No images uploaded' });
    }

    const urls = [];
    for (const file of req.files) {
      const filename = `${uuidv4()}.webp`;
      const compressed = await sharp(file.buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();

      const publicUrl = await uploadToSupabase(compressed, filename);
      urls.push(publicUrl);
    }

    res.json({ success: true, urls });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: 'Upload failed: ' + err.message });
  }
});

module.exports = router;