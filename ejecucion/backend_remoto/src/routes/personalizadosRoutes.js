const express = require('express');
const router = express.Router();
const personalizadoController = require('../controllers/personalizadoController.js');

router.post('/', personalizadoController.createPersonalizado);
router.put('/:id', personalizadoController.updatePersonalizado);

module.exports = router;
