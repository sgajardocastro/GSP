const express = require('express');
const router = express.Router();
const tequEquipoController = require('../controllers/tequEquipoController.js');

router.get('/', tequEquipoController.getEquipos);
router.get('/categorias', tequEquipoController.getCategorias);
router.get('/tipos-certificado', tequEquipoController.getTiposCertificado);
router.get('/:id', tequEquipoController.getEquipoById);
router.post('/', tequEquipoController.createEquipo);
router.put('/:id', tequEquipoController.updateEquipo);
router.delete('/:id', tequEquipoController.deleteEquipo);
router.get('/:id/certificados', tequEquipoController.getCertificadosByEquipo);
router.post('/:id/certificados', tequEquipoController.createCertificado);
router.put('/:id/certificados/:certId', tequEquipoController.updateCertificado);
router.delete('/:id/certificados/:certId', tequEquipoController.deleteCertificado);

module.exports = router;
