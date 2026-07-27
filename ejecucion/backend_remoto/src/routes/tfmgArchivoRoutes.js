const express = require('express');
const router = express.Router();
const tfmgArchivoController = require('../controllers/tfmgArchivoController');

router.get('/', tfmgArchivoController.getAll);
router.get('/:id', tfmgArchivoController.getById);
router.post('/', tfmgArchivoController.create);
router.put('/:id', tfmgArchivoController.update);
router.delete('/:id', tfmgArchivoController.delete);

module.exports = router;
