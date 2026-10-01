const express = require('express');
const controller = require('../controllers/pontosController');
const router = express.Router();

router.get('/', controller.listarPontos);
router.get('/:id/linhas', controller.linhasPorPonto);

module.exports = router;