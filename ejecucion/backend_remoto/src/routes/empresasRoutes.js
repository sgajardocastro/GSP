const express = require('express');
const router = express.Router();
const empresasController = require('../controllers/empresasController');

// Obtener todas las empresas
router.get('/', empresasController.getEmpresas);

// Crear una empresa (RF-5.2 Cliente Rápido)
router.post('/', empresasController.createEmpresa);

module.exports = router;

router.put('/:id', empresasController.updateEmpresa);
router.delete('/:id', empresasController.deleteEmpresa);
