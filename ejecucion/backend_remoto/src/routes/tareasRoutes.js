const express = require('express');
const router = express.Router();
const tareasController = require('../controllers/tareasController.js');

router.put('/updTareas', tareasController.putTareas)
router.put('/updTareasV3', tareasController.putTareasV3)

module.exports = router;
