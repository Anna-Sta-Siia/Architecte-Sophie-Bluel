// Backend/controllers/works.controller.js
const db = require('./../models');
const Works = db.works;

const USE_CLOUDINARY = !!process.env.CLOUDINARY_URL;
let cloudinary = null;

if (USE_CLOUDINARY) {
  cloudinary = require('cloudinary').v2;
}

exports.findAll = async (req, res) => {
  try {
    const works = await Works.findAll({ include: 'category' });
    return res.status(200).json(works);
  } catch (err) {
    return res.status(500).json({ error: new Error('Something went wrong') });
  }
};

exports.create = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucune image envoyée' });
    }

    const title = req.body.title;
    const categoryId = req.body.category;
    const userId = req.auth.userId;

    let imageUrl;
    let cloudinaryPublicId = null;

    if (USE_CLOUDINARY) {
      // fournis par multer-storage-cloudinary
      imageUrl =
        req.file.path || req.file.secure_url || req.file.url; // URL finale de l’image
      cloudinaryPublicId =
        req.file.filename || req.file.public_id || null; // public_id Cloudinary
    } else {
      // fallback disque local
      const host = req.get('host');
      imageUrl = `${req.protocol}://${host}/images/${req.file.filename}`;
    }

    const work = await Works.create({
      title,
      imageUrl,
      categoryId,
      userId,
      cloudinaryPublicId,
    });

    return res.status(201).json(work);
  } catch (err) {
    return res.status(500).json({ error: new Error('Something went wrong') });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const work = await Works.findByPk(id);

    if (!work) {
      return res.status(404).json({ error: 'Work not found' });
    }

    // 1) Supprimer l’asset côté Cloudinary si présent
    if (USE_CLOUDINARY && work.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(work.cloudinaryPublicId);
      } catch (e) {
        // On log, mais on continue la suppression BDD
        console.warn('Cloudinary destroy failed:', e?.message || e);
      }
    }

    // 2) Supprimer le fichier local si on n’utilise pas Cloudinary
    if (!USE_CLOUDINARY && work.imageUrl) {
      try {
        const url = new URL(work.imageUrl);
        const filename = decodeURIComponent(url.pathname.split('/').pop());
        const path = require('path');
        const fs = require('fs');
        const filePath = path.join(__dirname, '..', 'images', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.warn('Local file delete failed:', e?.message || e);
      }
    }

    // 3) Supprimer l’entrée en base
    await Works.destroy({ where: { id } });

    return res.status(204).json({ message: 'Work deleted successfully' });
  } catch (e) {
    return res.status(500).json({ error: new Error('Something went wrong') });
  }
};
