const express = require('express');
const router = express.Router();
const acreditacionController = require('../controllers/acreditacionController');

router.get('/', acreditacionController.getAcreditacionesKanban);
router.get('/:id', acreditacionController.getDetalleAcreditacion);
router.post('/documento', acreditacionController.subirDocumento);
router.put('/documento/:id_acreditacion_doc/auditar', acreditacionController.auditarDocumento);

module.exports = router;
