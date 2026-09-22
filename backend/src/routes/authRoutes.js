const express = require('express');
const controller = require('../controllers/authController');
const { autenticar } = require('../middleware/auth');

const router = express.Router();

router.post('/registro', controller.registrar);
router.post('/login', controller.login);
router.get('/me', autenticar, controller.me);

module.exports = router;