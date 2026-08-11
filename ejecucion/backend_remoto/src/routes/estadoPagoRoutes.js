const express = require('express');
const router = express.Router();
const estadoPagoController = require('../controllers/estadoPagoController');

// 1. Telemetría y Desplazamiento
router.post('/telemetria/ping', estadoPagoController.registrarPingDesplazamiento);

// 2. Reportes Diarios
router.post('/reportes-diarios', estadoPagoController.crearReporteDiario);
router.get('/proyectos/:id/reportes-diarios', estadoPagoController.getReportesDiariosPorProyecto);

// 3. Estados de Pago (EDP)
router.post('/', estadoPagoController.crearEstadoPago);
router.get('/proyectos/:id', estadoPagoController.getEstadosPagoPorProyecto);
router.post('/:id/factura-erp', estadoPagoController.adjuntarFacturaErp);

// 4. Imputación Costos Operacionales Reales
router.post('/costos', estadoPagoController.imputarCostoServicio);

// 5. Visor 360 Margen Operacional
router.get('/proyectos/:id/visor-360', estadoPagoController.getVisor360Proyecto);

module.exports = router;
