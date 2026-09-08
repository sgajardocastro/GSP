const express = require('express');
const router = express.Router();
const acreditacionController = require('../controllers/acreditacionController');

router.get('/', acreditacionController.getAcreditacionesKanban);
router.get('/tipos', acreditacionController.getTiposCertificadoPersona);
router.get('/personal', acreditacionController.getPersonalAcreditacion);
router.get('/personal/rut/:rut', acreditacionController.getPersonalByRut);
router.get('/personal/:id', acreditacionController.getPersonalDetail);
router.put('/personal/:id', acreditacionController.updatePersonalDetail);
router.post('/personal/:id/certificados', acreditacionController.addPersonalCertificado);
router.delete('/personal/:id/certificados/:id_cert', acreditacionController.deleteCertificado);

// Documentos institucionales de empresa (Biblioteca Central - Opción A)
router.get('/empresa/:id_empresa/documentos', acreditacionController.getDocumentosEmpresa);
router.post('/empresa/:id_empresa/documentos', acreditacionController.subirDocumentoEmpresa);
router.delete('/empresa/:id_empresa/documentos/:id_doc', acreditacionController.eliminarDocumentoEmpresa);

router.get('/:id', acreditacionController.getDetalleAcreditacion);
router.post('/documento', acreditacionController.subirDocumento);
router.put('/documento/:id_acreditacion_doc/auditar', acreditacionController.auditarDocumento);

module.exports = router;
