const express = require('express');
const router = express.Router();
const proyectoController = require('../controllers/proyectosController.js');
const contactoController = require('../controllers/contactoController.js');
const asignacionRecursosRoutes = require('./asignacionRecursosRoutes.js');

// Auto-guardado de contacto nuevo desde cotización / oportunidad
router.post('/contacto/auto-guardar', contactoController.autoGuardarContacto);

// Obtener todos los proyectos
router.get('/', proyectoController.getProyectos);

// Obtener un proyecto por ID
router.get('/:id', proyectoController.getProyectoById);

// Crear un nuevo proyecto
router.post('/', proyectoController.createProyecto);

// Crear oportunidad en estado preventa (RF-4.3)
router.post('/preventa', proyectoController.createProyectoPreventa);

// Actualizar un proyecto existente
router.put('/:id', proyectoController.updateProyecto);

// Eliminar un proyecto
router.delete('/:id', proyectoController.deleteProyecto);

router.post('/crearEquipoProyecto', proyectoController.crearEquipoProyecto);
router.post('/:id/generar-cotizacion', proyectoController.generarCotizacion);
router.post('/:id/generar-ot', proyectoController.generarOT);
router.post('/:id/enviar-ot', proyectoController.enviarOT);

// Sub-rutas para asignaciones (Personas y Equipos)
router.use('/:id/asignaciones', asignacionRecursosRoutes);

module.exports = router;
