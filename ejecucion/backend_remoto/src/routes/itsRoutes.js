const express = require('express');
const router = express.Router();
const itsController = require('../controllers/itsController');

// 0. Rutas de ITS Transición (antes del parámetro dinámico :id_proyecto)
router.get('/transicion/list', itsController.listarItsTransicion);
router.post('/transicion/guardar', itsController.guardarItsTransicion);
router.post('/transicion/firmar-elaborador', itsController.firmarElaboradorItsTransicion);
router.post('/transicion/devolver', itsController.devolverItsTransicion);
router.post('/transicion/validar-admin', itsController.validarAdminItsTransicion);
router.post('/transicion/aprobar-contabilidad', itsController.aprobarContabilidadItsTransicion);
router.get('/transicion/planillas/activas', itsController.obtenerPlanillasActivas);
router.get('/transicion/planillas/historial', itsController.obtenerHistorialPlanillas);
router.post('/transicion/planillas/subir', itsController.subirPlanillaPersistente);

// 1. Obtener contexto completo del ITS (Cabecera, Jornadas y Costos)
router.get('/:id_proyecto', itsController.getITS);

// 2. Guardar transaccionalmente el ITS relacional
router.post('/guardar', itsController.guardarITS);

// 2.1 Compilar HTML a PDF oficial en servidor (Motor wkhtmltopdf idéntico a Cotizaciones)
router.post('/compilar-pdf', itsController.compilarPdfHtml);

// 3. Previsualizar / Descargar PDF oficial de ITS
router.get('/preview-pdf/:id_proyecto', itsController.getPreviewPdf);

// 4. Obtener estado del flujo de aprobación FES y catálogo de rechazos
router.get('/flujo/:id_proyecto', itsController.getFlujoITS);

// 5. Firma o rechazo FES con PIN (SHA-256)
router.post('/firmar-fes', itsController.firmarFesITS);

// Fallback de compatibilidad
router.post('/firmar-paso', itsController.firmarPasoITS);

module.exports = router;
