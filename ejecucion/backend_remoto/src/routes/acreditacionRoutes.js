const express = require('express');
const router = express.Router();
const acreditacionController = require('../controllers/acreditacionController');

router.get('/', acreditacionController.getAcreditacionesKanban);

// Rutas estáticas antes de las paramétricas
router.get('/personal', acreditacionController.getAcreditacionPersonal);
router.get('/tipos', acreditacionController.getTiposCertificadoPersona);

// Rutas de Personal paramétricas
router.get('/personal/:id', acreditacionController.getAcreditacionPersonalDetail);
router.put('/personal/:id', acreditacionController.updateAcreditacionPersonal);
router.post('/personal/:id/certificados', acreditacionController.addCertificado);
router.delete('/personal/:id/certificados/:id_cert', acreditacionController.deleteCertificado);

// Rutas genéricas
router.post('/documento', acreditacionController.subirDocumento);
router.put('/documento/:id_acreditacion_doc/auditar', acreditacionController.auditarDocumento);
router.get('/:id', acreditacionController.getDetalleAcreditacion);

module.exports = router;
