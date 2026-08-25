const express = require('express');
const router = express.Router();
const reportDiarioController = require('../controllers/reportDiarioController');

// 1. Obtener contexto para emitir report (PWA)
router.get('/contexto/:id_proyecto', reportDiarioController.getReportContexto);

// 2. Obtener todos los reports de una OT (Torre de Control)
router.get('/proyecto/:id_proyecto', reportDiarioController.getReportsPorProyecto);

// 3. Guardar y sellar report diario desde PWA
router.post('/guardar', reportDiarioController.guardarReportDiario);

// 4. Validar report diario por el analista
router.post('/:id/validar', reportDiarioController.validarReportDiario);

module.exports = router;
