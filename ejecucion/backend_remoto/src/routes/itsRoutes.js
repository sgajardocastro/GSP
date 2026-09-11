const express = require('express');
const router = express.Router();
const itsController = require('../controllers/itsController');

// 1. Obtener contexto completo del ITS (Cabecera, Jornadas y Costos)
router.get('/:id_proyecto', itsController.getITS);

// 2. Guardar transaccionalmente el ITS relacional
router.post('/guardar', itsController.guardarITS);

// 3. Previsualizar / Descargar PDF oficial de ITS
router.get('/preview-pdf/:id_proyecto', itsController.getPreviewPdf);

// 4. Obtener estado del flujo de aprobación FES y catálogo de rechazos
router.get('/flujo/:id_proyecto', itsController.getFlujoITS);

// 5. Firma o rechazo FES con PIN (SHA-256)
router.post('/firmar-fes', itsController.firmarFesITS);

// Fallback de compatibilidad
router.post('/firmar-paso', itsController.firmarPasoITS);

module.exports = router;
