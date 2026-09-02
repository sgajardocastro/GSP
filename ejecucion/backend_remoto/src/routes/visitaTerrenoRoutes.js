const express = require('express');
const router = express.Router();
const visitaTerrenoController = require('../controllers/visitaTerrenoController.js');

// 1. Obtener todas las visitas (1:N) asociadas a un proyecto
router.get('/proyecto/:id_proyecto', visitaTerrenoController.getVisitasProyecto);

// 2. Asignación directa desde la Web (Operaciones)
router.post('/asignar-web', visitaTerrenoController.asignarVisitaWeb);

// 3. Reasignación de técnico inspector por imprevistos
router.post('/:id_survey/reasignar', visitaTerrenoController.reasignarVisita);

// 4. Creación autónoma de visita por Operaciones (o subsecuente 1:N)
router.post('/crear-operaciones', visitaTerrenoController.crearVisitaOperaciones);

// 5. Flujos por token público y firma FES (compatibilidad con link de correo)
router.post('/solicitar/:id_proyecto', visitaTerrenoController.solicitarVisita);
router.get('/token/:token', visitaTerrenoController.getDatosVisita);
router.post('/token/:token/asignar', visitaTerrenoController.asignarVisita);

module.exports = router;
