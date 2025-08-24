// Backend/middlewares/multer-config.js
const multer = require('multer');

const USE_CLOUDINARY = !!process.env.CLOUDINARY_URL;
let storage;

if (USE_CLOUDINARY) {
  // --- Uploads vers Cloudinary ---
  const { v2: cloudinary } = require('cloudinary');
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  // `CLOUDINARY_URL` suffit à configurer; ce secure est juste par confort
  cloudinary.config({ secure: true });

  storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder: process.env.CLOUDINARY_FOLDER || 'uploads',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      public_id: `work-${Date.now()}`, // id lisible pour gérer la suppression
    }),
  });
} else {
  // --- Fallback disque pour le dev local ---
  const path = require('path');
  const fs = require('fs');

  const MIME_TYPE = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };

  const dest = path.join(__dirname, '..', 'images');
  fs.mkdirSync(dest, { recursive: true });

  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const base = file.originalname.split(' ').join('_').replace(/\.[^/.]+$/, '');
      const ext = MIME_TYPE[file.mimetype] || 'jpg';
      cb(null, `${base}_${Date.now()}.${ext}`);
    },
  });
}

module.exports = multer({ storage }).single('image');
