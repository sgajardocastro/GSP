const express = require('express');
const router = express.Router();
const reportDiarioController = require('../controllers/reportDiarioController');

// 1. Obtener contexto para emitir report (PWA)
router.get('/contexto/:id_proyecto', reportDiarioController.getReportContexto);

// 2. Obtener todos los reports de una OT (Torre de Control)
router.get('/proyecto/:id_proyecto', reportDiarioController.getReportsPorProyecto);

// 3. Registrar Inicio de Jornada (Momento 1: Control de Flota)
router.post('/inicio-jornada', reportDiarioController.guardarInicioJornada);

// 4. Guardar y sellar report diario desde PWA (Momento 2 + Report Mandante)
router.post('/guardar', reportDiarioController.guardarReportDiario);

// 4. Validar report diario por el analista
router.post('/:id/validar', reportDiarioController.validarReportDiario);

// 5. Resumen de Estado de Pago (EDP) y Conciliación Financiera (Spec 38)
router.get('/edp/resumen/:id_proyecto', reportDiarioController.getResumenEDP);

// 6. Registro de Facturación y Cierre de Servicio (Spec 38)
router.post('/edp/cerrar-facturacion', reportDiarioController.cerrarFacturacion);

module.exports = router;
