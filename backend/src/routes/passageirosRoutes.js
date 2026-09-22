const express = require('express');
const controller = require('../controllers/passageirosController');
const router = express.Router();
router.post('/embarcar', controller.embarcar);
module.exports = router;