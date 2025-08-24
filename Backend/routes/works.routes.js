const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const upload = require('../middlewares/multer-config'); // .single('image') déjà dans le middleware
const checkWork = require('../middlewares/checkWork');
const workCtrl = require('../controllers/works.controller');

router.get('/', workCtrl.findAll);
router.post('/', auth, upload, checkWork, workCtrl.create);
router.delete('/:id', auth, workCtrl.delete);

module.exports = router;
