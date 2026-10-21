const express = require('express');
const router = express.Router();
const backlogController = require('../controllers/backlogController');

// Requerimientos
router.get('/', backlogController.getRequerimientos);
router.post('/', backlogController.crearRequerimiento);
router.put('/:id', backlogController.actualizarRequerimiento);
router.delete('/:id', backlogController.eliminarRequerimiento);

// Releases
router.get('/releases', backlogController.getReleases);
router.post('/releases', backlogController.crearRelease);

module.exports = router;
