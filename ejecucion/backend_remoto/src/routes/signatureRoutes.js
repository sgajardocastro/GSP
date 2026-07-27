const express = require('express');
const router = express.Router();
const signatureController = require('../controllers/signatureController');

router.post('/', signatureController.postSignature3);
router.post('/UpdApprovalExec', signatureController.postApprovalExec);

// ✅ Nuevo endpoint para validar TSA
router.get('/validateTsa/:id_fes', signatureController.validateTsa);
router.get('/validar-codigo/:codigo', signatureController.validarCodigo);

module.exports = router;
