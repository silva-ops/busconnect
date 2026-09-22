const express = require('express');
const controller = require('../controllers/pontosController');
const router = express.Router();
router.get('/', controller.listarPontos);
module.exports = router;