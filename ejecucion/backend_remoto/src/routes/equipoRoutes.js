const express = require('express');
const router = express.Router();
const equiposController = require('../controllers/equiposController.js');

router.put('/updEquipos', equiposController.putEquipos)
router.put('/delEquiposMiembro', equiposController.delEquiposMiembro)
router.get('/', equiposController.getEquipos)

module.exports = router;