const { v2: cloudinary } = require('cloudinary');

// библиотека сама возьмёт настройки из process.env.CLOUDINARY_URL
cloudinary.config({ secure: true });

module.exports = cloudinary;