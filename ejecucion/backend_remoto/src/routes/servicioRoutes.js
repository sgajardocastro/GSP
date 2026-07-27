// routes/servicioRoutes.js
const express = require('express');
const router = express.Router();
const servicioController = require('../controllers/servicioController');

router.get('/*', servicioController.servicioGeneral);
router.get('/*/*', servicioController.servicioDobleNivel);

module.exports = router;