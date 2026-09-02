const express = require('express');
const router = express.Router();
const empresasController = require('../controllers/empresasController');
const contactoController = require('../controllers/contactoController');

// Obtener todas las empresas
router.get('/', empresasController.getEmpresas);

// Crear una empresa (RF-5.2 Cliente Rápido)
router.post('/', empresasController.createEmpresa);

// Contactos asociados a una empresa
router.get('/:id_empresa/contactos', contactoController.getContactosByEmpresa);
router.post('/:id_empresa/contactos/upsert', contactoController.upsertContactoEmpresa);

// Actualizar y eliminar empresa
router.put('/:id', empresasController.updateEmpresa);
router.delete('/:id', empresasController.deleteEmpresa);

module.exports = router;
