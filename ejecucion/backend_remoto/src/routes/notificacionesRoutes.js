const express = require('express');
const router = express.Router();
const notificacionesController = require('../controllers/notificacionesController.js');

router.get('/', notificacionesController.getNotificaciones);
router.post('/tick', notificacionesController.tick) // opcional

module.exports = router;