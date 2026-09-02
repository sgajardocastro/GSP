const express = require('express');
const router = express.Router();
const contactoController = require('../controllers/contactoController');

// Auto-guardado reactivo de contacto
router.post('/auto-guardar', contactoController.autoGuardarContacto);

// Upsert de contacto general o por empresa
router.post('/upsert', contactoController.upsertContactoEmpresa);
router.post('/empresas/:id_empresa/upsert', contactoController.upsertContactoEmpresa);
router.get('/empresas/:id_empresa', contactoController.getContactosByEmpresa);

module.exports = router;
