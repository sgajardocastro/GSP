const express = require('express');
const router = express.Router();
const archivoController = require('../controllers/archivoController');

router.post('/', archivoController.postArchivo);
router.post('/imagen', archivoController.postArchivoImagen);
router.post('/cnxload', archivoController.postCnxLoad);
router.get('/id/:id', archivoController.getArchivoById);
router.get('/ver/:id', archivoController.verArchivoById);
router.get('/:subcarpeta/*', archivoController.getArchivo);

module.exports = router;
