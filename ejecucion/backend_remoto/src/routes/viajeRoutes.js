const express = require('express');
const router = express.Router();
const viajeController = require('../controllers/viajeController');
const reportDiarioController = require('../controllers/reportDiarioController');

// 1. Acceso Móvil por Usuario (PWA)
router.get('/usuario/activo', viajeController.getViajeActivo);

// 2. Acceso Móvil por Token (Público / PWA)
router.get('/:token', viajeController.getViajePorToken);
router.post('/:token/salida', viajeController.registrarSalida);
router.post('/:token/combustible', viajeController.registrarCombustible);
router.post('/:token/llegada', viajeController.registrarLlegada);
router.post('/:token/ping', viajeController.registrarPing);

// Alias de compatibilidad hacia el servicio canónico de Report Diario
router.post('/:token/reporte-diario', (req, res, next) => {
  req.body.token_viaje = req.params.token;
  return reportDiarioController.guardarReportDiario(req, res, next);
});

// 3. Gestión desde CRM / Torre de Control
router.post('/asignar', viajeController.crearOAsignarViaje);
router.get('/proyecto/:id_proyecto', viajeController.getViajesPorProyecto);

module.exports = router;
