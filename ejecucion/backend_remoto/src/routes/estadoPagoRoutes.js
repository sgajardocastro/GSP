const express = require('express');
const router = express.Router();
const estadoPagoController = require('../controllers/estadoPagoController');

// 1. Telemetría y Desplazamiento
router.post('/telemetria/ping', estadoPagoController.registrarPingDesplazamiento);

// 2. Reportes Diarios
router.post('/reportes-diarios', estadoPagoController.crearReporteDiario);
router.get('/proyectos/:id/reportes-diarios', estadoPagoController.getReportesDiariosPorProyecto);

// 3. Estados de Pago (EDP) Periódicos y Perspectiva Contabilidad (Spec 100 / REQ-1069)
router.get('/perspectiva-contabilidad', estadoPagoController.getPerspectivaContabilidad);
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

// 8. Ajustes Exclusivos de Tesorería (Pamela) y Administrador (Spec 57 / Spec 59)
router.post('/ajustes-tesoreria', estadoPagoController.guardarAjustesTesoreria);

// 9. Firma FES y Despacho Condicional del Comercial y Circuito de 3 Firmas EDP (Spec 57 / REQ-028)
router.post('/firmar-comercial', estadoPagoController.firmarComercialEdp);
router.post('/firmar-paso', estadoPagoController.firmarPasoEdp);

// 10. Requerimiento de Cambio / RFC de EDP y Notificación Omnicanal (Spec 59 / REQ-037)
router.post('/solicitar-modificacion', estadoPagoController.solicitarModificacionEDP);
router.post('/resolver-solicitud-modificacion', estadoPagoController.resolverSolicitudModificacionEDP);

// 11. Soporte Documental: OC, Reconocimiento Automático PDF DTE (Laudus/SII) y Multi-Factura (Spec 60 / Spec 101 / REQ-1070)
router.post('/parsear-dte-pdf', estadoPagoController.parsearFacturaDtePdfEndpoint);
router.post('/soporte-documental', estadoPagoController.guardarSoporteDocumentalEDP);
router.post('/proyecto/:id_proyecto/soporte-documental', estadoPagoController.guardarSoporteDocumentalEDP);
router.delete('/proyecto/:id_proyecto/dte/:id_dte', estadoPagoController.eliminarFacturaDteEDP);

module.exports = router;
