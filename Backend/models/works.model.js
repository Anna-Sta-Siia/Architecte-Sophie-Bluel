// Backend/models/works.model.js
module.exports = (sequelize, DataTypes) => {
  const Works = sequelize.define(
    'works',
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      // URL de l'image (Cloudinary ou locale) — TEXT pour accepter des URLs longues
      imageUrl: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      // Nouveau : identifiant public Cloudinary pour pouvoir supprimer l'image
      cloudinaryPublicId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
    }
  );

  return Works;
};
