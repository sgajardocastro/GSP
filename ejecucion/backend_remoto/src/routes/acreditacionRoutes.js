const express = require('express');
const router = express.Router();
const controller = require('../controllers/acreditacionController');

router.get('/personal', controller.getAcreditacionPersonal);
router.get('/personal/:id', controller.getAcreditacionPersonalDetail);
router.put('/personal/:id', controller.updateAcreditacionPersonal);
router.post('/personal/:id/certificados', controller.addCertificado);
router.delete('/personal/:id/certificados/:id_cert', controller.deleteCertificado);
router.get('/tipos', controller.getTiposCertificadoPersona);

module.exports = router;
