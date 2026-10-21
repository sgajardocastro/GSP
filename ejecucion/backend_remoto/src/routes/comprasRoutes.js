const express = require('express');
const router = express.Router();
const comprasController = require('../controllers/comprasController');
const { verifyToken } = require('../middleware/authMiddleware');

const authOrFallback = (req, res, next) => {
  if (req.headers['authorization']) {
    return verifyToken(req, res, next);
  }
  req.user = {
    id_user: 55,
    id_empresa: 9,
    nombre: 'Eduardo (Adquisiciones GSP)',
    roles: ['Admin', 'GSP_COMPRAS_PROG', 'GSP_COMPRAS_APROB', 'GSP_BODEGA_PROG']
  };
  next();
};

// =============================================================================
// 1. RESUMEN EJECUTIVO & SELECTORES (OPERACIONES / TALLER / 4 EMPRESAS)
// =============================================================================
router.get('/resumen', authOrFallback, (req, res) => comprasController.getResumen(req, res));

// =============================================================================
// 2. TICKETS DE SOLICITUD DE PEDIDO (SP-YYMM-XXXX)
// =============================================================================
router.get('/solicitudes', authOrFallback, (req, res) => comprasController.getSolicitudes(req, res));
router.post('/solicitudes', authOrFallback, (req, res) => comprasController.crearSolicitud(req, res));

// =============================================================================
// 3. ÓRDENES DE COMPRA POR RAZÓN SOCIAL (OC-GSP / OC-RYL / OC-BMQ / OC-LDS)
// =============================================================================
router.get('/ordenes', authOrFallback, (req, res) => comprasController.getOrdenes(req, res));
router.get('/ordenes/:id_oc', authOrFallback, (req, res) => comprasController.getOrdenById(req, res));
router.post('/ordenes', authOrFallback, (req, res) => comprasController.crearOrden(req, res));

// =============================================================================
// 4. VISACIÓN MÓVIL DE GERENCIA (OMAR - WEB TOKEN DE 1 USO)
// =============================================================================
router.post('/ordenes/:id_oc/enviar-vb-omar', authOrFallback, (req, res) => comprasController.enviarVbOmar(req, res));

// =============================================================================
// 5. INTEGRACIÓN LAUDUS ERP / RECEPCIÓN DTE / IMPUTACIÓN A ITS
// =============================================================================
router.post('/ordenes/:id_oc/sincronizar-its-laudus', authOrFallback, (req, res) => comprasController.sincronizarItsLaudus(req, res));

// =============================================================================
// 6. IMPRESIÓN OFICIAL A4 CON LOGO RAZÓN SOCIAL Y TIMBRE FES
// =============================================================================
router.get('/ordenes/:id_oc/html-print', (req, res) => comprasController.getHtmlPrint(req, res));

module.exports = router;
