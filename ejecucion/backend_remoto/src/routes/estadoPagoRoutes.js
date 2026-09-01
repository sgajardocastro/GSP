const express = require('express');
const router = express.Router();
const estadoPagoController = require('../controllers/estadoPagoController');

// 1. Telemetría y Desplazamiento
router.post('/telemetria/ping', estadoPagoController.registrarPingDesplazamiento);

// 2. Reportes Diarios
router.post('/reportes-diarios', estadoPagoController.crearReporteDiario);
router.get('/proyectos/:id/reportes-diarios', estadoPagoController.getReportesDiariosPorProyecto);

// 3. Estados de Pago (EDP) Periódicos
router.post('/', estadoPagoController.crearEstadoPago);
router.post('/crear', estadoPagoController.crearEstadoPago);
router.get('/proyecto/:id_proyecto', estadoPagoController.getEstadosPagoPorProyecto);
router.get('/proyectos/:id', estadoPagoController.getEstadosPagoPorProyecto);

// 4. Dossier PDF Oficial de Estado de Pago
router.get('/proyecto/:id_proyecto/pdf', estadoPagoController.generarPdfEdp);
router.get('/:id_edp/pdf', estadoPagoController.generarPdfEdp);

// 5. Cierre, Facturación y Estado
router.post('/:id_edp/estado', estadoPagoController.actualizarEstadoEdp);
router.post('/:id/factura-erp', estadoPagoController.adjuntarFacturaErp);

// 6. Imputación Costos Operacionales Reales
router.post('/costos', estadoPagoController.imputarCostoServicio);

// 7. Visor 360 Margen Operacional
router.get('/proyectos/:id/visor-360', estadoPagoController.getVisor360Proyecto);

module.exports = router;
