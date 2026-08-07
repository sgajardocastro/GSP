const express = require('express');
const router = express.Router();
const visitaTerrenoController = require('../controllers/visitaTerrenoController.js');

// 1. Solicitar asignación de visita (Genera token y manda mail)
router.post('/solicitar/:id_proyecto', visitaTerrenoController.solicitarVisita);

// 2. Obtener datos de la visita por token para la vista pública
router.get('/token/:token', visitaTerrenoController.getDatosVisita);

// 3. Confirmar asignación y firma FES del coordinador
router.post('/token/:token/asignar', visitaTerrenoController.asignarVisita);

module.exports = router;
