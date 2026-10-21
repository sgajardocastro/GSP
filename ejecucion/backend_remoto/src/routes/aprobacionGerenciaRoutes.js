const express = require('express');
const router = express.Router();
const aprobacionGerenciaController = require('../controllers/aprobacionGerenciaController');

// Listado de tokens y cola de pendientes
router.get('/', aprobacionGerenciaController.listarTokens);
router.get('/pendientes', aprobacionGerenciaController.listarPendientes);

// Generación de Web Token de 1 Solo Uso
router.post('/token', aprobacionGerenciaController.crearToken);
router.post('/solicitar', aprobacionGerenciaController.crearToken);

// Acceso directo público a los PDFs de Cotización y OT desde el Token de Gerencia
router.get('/public/:token/cotizacion', aprobacionGerenciaController.verCotizacionPublica);
router.get('/public/:token/ot', aprobacionGerenciaController.verOtPublica);
router.get('/:token/cotizacion', aprobacionGerenciaController.verCotizacionPublica);
router.get('/:token/ot', aprobacionGerenciaController.verOtPublica);

// Consulta pública de Token (0% Login - Estilo RindeGastos)
router.get('/public/:token', aprobacionGerenciaController.obtenerPorTokenPublico);
router.get('/token/:token', aprobacionGerenciaController.obtenerPorTokenPublico);
router.get('/:token', aprobacionGerenciaController.obtenerPorTokenPublico);

// Resolución pública de Token de 1 Solo Uso (Aprobar / Observar / Rechazar)
router.post('/public/:token/resolver', aprobacionGerenciaController.resolverTokenPublico);
router.post('/token/:token/resolver', aprobacionGerenciaController.resolverTokenPublico);
router.post('/:token/resolver', aprobacionGerenciaController.resolverTokenPublico);

module.exports = router;
