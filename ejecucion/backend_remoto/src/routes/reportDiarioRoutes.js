const express = require('express');
const router = express.Router();
const reportDiarioController = require('../controllers/reportDiarioController');

// 1. Obtener contexto para emitir report (PWA)
router.get('/contexto/:id_proyecto', reportDiarioController.getReportContexto);

// 2. Obtener todos los reports de una OT (Torre de Control)
router.get('/proyecto/:id_proyecto', reportDiarioController.getReportsPorProyecto);

// 2.1 Obtener bandeja consolidada de pendientes para el Analista de Control de Gestión (PMO)
router.get('/pendientes-analista', reportDiarioController.getPendientesAnalista);

// 2.2 Obtener bandeja de reports pendientes y concluidos del usuario en PWA (Spec 57 / REQ-025)
router.get('/usuario/pendientes', reportDiarioController.getReportsPendientesUsuario);

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

// 7. Auditoría y Alertas de SLA 13:00 hrs (Spec 57 / REQ-026)
router.get('/sla/auditar', reportDiarioController.auditarSLA);
router.post('/sla/ejecutar-alertas', reportDiarioController.ejecutarAlertasSLA);

// 8. Normalización de Evidencias Físicas y Regularización Manual (REQ-1000)
router.post('/:id/adjuntar-respaldo-fisico', reportDiarioController.adjuntarRespaldoFisico);
router.post('/regularizar-manual', reportDiarioController.regularizarReporteManual);

module.exports = router;
