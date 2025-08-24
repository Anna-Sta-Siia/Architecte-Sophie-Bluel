const express = require('express');
const router = express.Router();
const categoriesCtrl = require('../controllers/categories.controller');

router.get('/', categoriesCtrl.findAll);

module.exports = router;
