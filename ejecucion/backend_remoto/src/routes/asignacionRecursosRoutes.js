const express = require('express');
const router = express.Router({ mergeParams: true });
const asignacionRecursosController = require('../controllers/asignacionRecursosController.js');

// Los paths a continuación se asumen montados en /api/proyectos/:id/asignaciones

// Personas
router.get('/personas', asignacionRecursosController.getAsignacionesPersona);
router.post('/personas', asignacionRecursosController.crearAsignacionPersona);
router.delete('/personas/:id_rel_persona', asignacionRecursosController.eliminarAsignacionPersona);

// Equipos
router.get('/equipos', asignacionRecursosController.getAsignacionesEquipo);
router.post('/equipos', asignacionRecursosController.crearAsignacionEquipo);
router.delete('/equipos/:id_rel_equipo', asignacionRecursosController.eliminarAsignacionEquipo);

// Resumen
router.get('/resumen', asignacionRecursosController.getResumenAsignacionesProyecto);

module.exports = router;
