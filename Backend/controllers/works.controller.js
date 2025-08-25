// Backend/controllers/works.controller.js
const path = require('path');
const fs = require('fs');
const db = require('./../models');
const Works = db.works;
const Categories = db.categories; // <-- assure-toi que ce modèle existe et que l'association as:'category' est bien faite

const USE_CLOUDINARY = !!process.env.CLOUDINARY_URL;
let cloudinary = null;
if (USE_CLOUDINARY) {
  cloudinary = require('cloudinary').v2;
}

// Normalise une entrée catégorie (id numérique OU nom) -> renvoie un categoryId (number) ou null
async function resolveCategoryId(raw) {
  if (raw == null) return null;

  // 1) si on m’envoie déjà un id (ex: "2" ou 2)
  const asNumber = Number(raw);
  if (!Number.isNaN(asNumber) && asNumber > 0) {
    const exists = await Categories.findByPk(asNumber);
    return exists ? asNumber : null;
  }

  // 2) sinon on m’a envoyé un NOM (ex: "hotel", "objets", "restaurants", "appartements")
  const name = String(raw).trim();
  if (!name) return null;

  // match insensible à la casse (et aux espaces)
  const cat = await Categories.findOne({
    where: db.sequelize.where(
      db.sequelize.fn('LOWER', db.sequelize.col('name')),
      name.toLowerCase()
    ),
  });

  // Si je veux AUTORISER la création automatique d’une nouvelle catégorie :
  // const [createdCat] = await Categories.findOrCreate({ where: { name } });
  // return createdCat.id;

  return cat ? cat.id : null;
}

// GET /api/works
exports.findAll = async (req, res) => {
  try {
    const works = await Works.findAll({ include: 'category' });
    return res.status(200).json(works);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

// POST /api/works
exports.create = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucune image envoyée' });
    }

    const title = req.body.title?.trim() || null;

    // ✅ ICI : on accepte categoryId OU category (string) et on résout vers un id
    const rawCategory = req.body.categoryId ?? req.body.category ?? null;
    const categoryId = await resolveCategoryId(rawCategory);
    if (!categoryId) {
      return res.status(400).json({ error: 'Catégorie inconnue ou manquante' });
    }

    const userId = req.auth?.userId ?? null;

    let imageUrl = null;
    let cloudinaryPublicId = null;

    if (USE_CLOUDINARY) {
      imageUrl = req.file.path || req.file.secure_url || req.file.url || null;
      cloudinaryPublicId = req.file.filename || req.file.public_id || null;
      if (!imageUrl) return res.status(500).json({ error: 'URL Cloudinary manquante' });
    } else {
      const host = req.get('host');
      imageUrl = `${req.protocol}://${host}/images/${req.file.filename}`;
    }

    const work = await Works.create({
      title,
      imageUrl,
      cloudinaryPublicId,
      categoryId,   // <-- on stocke bien l’id
      userId,
    });

    return res.status(201).json(work);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

// DELETE /api/works/:id
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const work = await Works.findByPk(id);
    if (!work) return res.status(404).json({ error: 'Work not found' });

    if (USE_CLOUDINARY && work.cloudinaryPublicId) {
      try { await cloudinary.uploader.destroy(work.cloudinaryPublicId); }
      catch (e) { console.warn('Cloudinary destroy failed:', e?.message || e); }
    }

    if (!USE_CLOUDINARY && work.imageUrl) {
      try {
        const localPrefix = `${req.protocol}://${req.get('host')}/images/`;
        if (work.imageUrl.startsWith(localPrefix)) {
          const filename = decodeURIComponent(work.imageUrl.replace(localPrefix, ''));
          const filePath = path.join(__dirname, '..', 'images', filename);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.warn('Local file delete failed:', e?.message || e);
      }
    }

    await Works.destroy({ where: { id } });
    return res.status(204).json({ message: 'Work deleted successfully' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};
