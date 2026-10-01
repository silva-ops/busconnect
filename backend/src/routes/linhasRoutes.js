const express = require('express');
const controller = require('../controllers/linhasController');

const router = express.Router();

router.get('/', controller.listar);
router.get('/:id', controller.obter);
router.get('/:id/viagens-ativas', controller.viagensAtivas);
router.get('/:id/pontos', controller.pontos);

module.exports = router;