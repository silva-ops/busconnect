const express = require('express');
const controller = require('../controllers/empresaController');

const router = express.Router();

router.get('/resumo', controller.resumo);
router.get('/viagens', controller.listarViagens);
router.get('/viagens/:id/passageiros', controller.passageirosDaViagem);
router.get('/estatisticas', controller.estatisticas);
router.get('/linhas', controller.linhas);
router.get('/rotas', controller.rotas);
router.get('/pontos', controller.pontos);
router.get('/motoristas', controller.motoristas);
router.get('/onibus', controller.onibus);
router.get('/onibus-ativos', controller.onibusAtivos);

module.exports = router;