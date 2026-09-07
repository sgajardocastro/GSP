const express = require('express');
const router = express.Router();
const patioController = require('../controllers/patioController');

// 1. Catálogo de flota activa autocompletable
router.get('/equipos', patioController.getEquiposFlota);

// 2. Iniciar inspección autónoma (crea tsrv_survey precargado con datos del portón)
router.post('/iniciar', patioController.iniciarInspeccionPatio);

module.exports = router;
