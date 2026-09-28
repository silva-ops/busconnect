const express = require('express');
const controller = require('../controllers/pushController');

const router = express.Router();

router.get('/public-key', controller.publicKey);
router.post('/subscribe', controller.subscribe);
router.post('/test', controller.testar);

module.exports = router;