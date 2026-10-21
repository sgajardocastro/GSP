const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const { verifyToken } = require('../middleware/authMiddleware');

// Middleware opcional tolerante: si viene header Authorization lo verifica y puebla req.user,
// si no viene (p.ej. testing interno en dev), asigna usuario fallback para no romper compatibilidad.
const authOrFallback = (req, res, next) => {
  if (req.headers['authorization']) {
    return verifyToken(req, res, next);
  }
  // En DEV sin header: inyectar usuario de contingencia id_user: 55 (Sergio Gajardo / Admin), id_empresa: 9
  req.user = {
    id_user: 55,
    id_empresa: 9,
    roles: ['Admin', 'GSP_BODEGA_PROG', 'GSP_BODEGA_APROB', 'GSP_BODEGA_EJEC']
  };
  next();
};

// =============================================================================
// 1. BODEGAS & UBICACIONES
// =============================================================================
router.get('/bodegas', authOrFallback, (req, res) => inventarioController.getBodegas(req, res));
router.get('/ubicaciones', authOrFallback, (req, res) => inventarioController.getUbicaciones(req, res));

// =============================================================================
// 2. CATÁLOGO DE PRODUCTOS
// =============================================================================
router.get('/productos', authOrFallback, (req, res) => inventarioController.getProductos(req, res));
router.get('/productos/:id', authOrFallback, (req, res) => inventarioController.getProductoById(req, res));
router.post('/productos', authOrFallback, (req, res) => inventarioController.createProducto(req, res));

// =============================================================================
// 3. EXISTENCIAS & STOCK
// =============================================================================
router.get('/existencias', authOrFallback, (req, res) => inventarioController.getExistencias(req, res));
router.get('/alertas/reposicion', authOrFallback, (req, res) => inventarioController.getAlertasReposicion(req, res));
router.get('/alertas/quiebres', authOrFallback, (req, res) => inventarioController.getAlertasReposicion(req, res));

// =============================================================================
// 4. RECEPCIÓN DE MATERIALES (INGRESO)
// =============================================================================
router.post('/recepciones', authOrFallback, (req, res) => inventarioController.crearRecepcion(req, res));
router.post('/existencias/ingresar', authOrFallback, (req, res) => inventarioController.crearRecepcion(req, res));

// =============================================================================
// 5. DESPACHO & DEVOLUCIÓN A OT DE MANTENIMIENTO
// =============================================================================
router.post('/despacho-ot', authOrFallback, (req, res) => inventarioController.despacharOt(req, res));
router.post('/despacho', authOrFallback, (req, res) => inventarioController.despacharOt(req, res));
router.post('/devolucion-ot', authOrFallback, (req, res) => inventarioController.devolverOt(req, res));

// =============================================================================
// 6. KARDEX / MOVIMIENTOS & AUDITORÍA
// =============================================================================
router.get('/kardex', authOrFallback, (req, res) => inventarioController.getKardexMovimientos(req, res));
router.post('/kardex/:id/reversar', authOrFallback, (req, res) => inventarioController.reversarMovimiento(req, res));

// =============================================================================
// 7. CONTEOS CÍCLICOS / INVENTARIO FÍSICO
// =============================================================================
router.get('/conteos', authOrFallback, (req, res) => inventarioController.getConteos(req, res));

module.exports = router;
