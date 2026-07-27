const express = require('express');
const router = express.Router();
const tequDocumentacionController = require('../controllers/tequDocumentacionController.js');

router.get('/:id_equipo', tequDocumentacionController.getDocumentacionByEquipoId);
router.post('/', tequDocumentacionController.createDocumentacion);
router.put('/:id_doc', tequDocumentacionController.updateDocumentacion);
router.delete('/:id_doc', tequDocumentacionController.deleteDocumentacion);

module.exports = router;
