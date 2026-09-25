const express = require('express');
const controller = require('../controllers/passageirosController');
const { autenticar } = require('../middleware/auth');

const router = express.Router();

router.post('/embarcar', controller.embarcar);
router.get('/:id/historico', autenticar, controller.historico);
router.get('/:id/estatisticas', autenticar, controller.estatisticas);

module.exports = router;