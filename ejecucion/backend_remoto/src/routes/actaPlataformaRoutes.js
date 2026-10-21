const express = require('express');
const router = express.Router();
const actaPlataformaController = require('../controllers/actaPlataformaController');

router.get('/', actaPlataformaController.getTodasLasActas);
router.get('/equipo/:id_equipo', actaPlataformaController.getActasPorEquipo);
router.get('/proyecto/:id_proyecto', actaPlataformaController.getActaPorProyecto);
router.post('/guardar-entrega', actaPlataformaController.guardarEntrega);
router.post('/guardar-retiro', actaPlataformaController.guardarRetiro);

module.exports = router;
