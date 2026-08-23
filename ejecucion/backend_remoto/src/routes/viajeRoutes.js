const express = require('express');
const router = express.Router();
const viajeController = require('../controllers/viajeController');

// 1. Acceso Móvil por Token (Público / PWA)
router.get('/:token', viajeController.getViajePorToken);
router.post('/:token/salida', viajeController.registrarSalida);
router.post('/:token/combustible', viajeController.registrarCombustible);
router.post('/:token/llegada', viajeController.registrarLlegada);
router.post('/:token/ping', viajeController.registrarPing);

// 2. Gestión desde CRM / Torre de Control
router.post('/asignar', viajeController.crearOAsignarViaje);
router.get('/proyecto/:id_proyecto', viajeController.getViajesPorProyecto);

module.exports = router;
