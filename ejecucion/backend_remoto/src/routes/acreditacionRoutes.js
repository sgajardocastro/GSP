const express = require('express');
const router = express.Router();
const acreditacionController = require('../controllers/acreditacionController');

router.get('/', acreditacionController.getAcreditacionesKanban);
router.get('/personal', acreditacionController.getPersonalAcreditacion);
router.get('/personal/rut/:rut', acreditacionController.getPersonalByRut);
router.get('/personal/:id', acreditacionController.getPersonalDetail);
router.put('/personal/:id', acreditacionController.updatePersonalDetail);
router.post('/personal/:id/certificados', acreditacionController.addPersonalCertificado);
router.get('/:id', acreditacionController.getDetalleAcreditacion);
router.post('/documento', acreditacionController.subirDocumento);
router.put('/documento/:id_acreditacion_doc/auditar', acreditacionController.auditarDocumento);

module.exports = router;
