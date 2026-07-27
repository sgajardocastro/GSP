const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');

// Actualizar atributos de un template
router.put('/:id_template', (req, res) => templateController.updateAttributes(req, res));

module.exports = router;
