const express = require('express');
const controller = require('../controllers/onibusController');

const router = express.Router();
router.post('/localizacao', controller.receberLocalizacao);

module.exports = router;
