const express = require('express');
const controller = require('../controllers/viagensController');
const router = express.Router();
router.get('/:id', controller.obterViagem);
router.get('/:id/pontos', controller.listarPontosDaViagem);
module.exports = router;