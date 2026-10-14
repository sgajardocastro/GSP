const express = require('express');
const router = express.Router();
const proyectoController = require('../controllers/proyectosController.js');
const cotizacionExpressController = require('../controllers/cotizacionExpressController.js');
const contactoController = require('../controllers/contactoController.js');
const asignacionRecursosRoutes = require('./asignacionRecursosRoutes.js');

// Auto-guardado de contacto nuevo desde cotización / oportunidad
router.post('/contacto/auto-guardar', contactoController.autoGuardarContacto);

// Rutas de Cotizador Express Móvil (Spec 64 / REQ-994)
router.get('/express/catalogo', cotizacionExpressController.getCatalogo);
router.post('/express/cotizar', cotizacionExpressController.cotizarExpress);

// Rutas Públicas de Contrato & Formalización (Firma Móvil FES)
router.get('/contrato/public/:token', proyectoController.obtenerContratoPorToken);
router.post('/contrato/public/:token/firmar', proyectoController.firmarContratoPublico);

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
router.post('/:id/reversar-a-cotizacion', proyectoController.reversarACotizacion);

// Rutas Internas de Gestión de Contrato
router.post('/:id/contrato/generar-pdf', proyectoController.generarContratoPdf);
router.post('/:id/contrato/generar-token', proyectoController.generarTokenFirmaContrato);
router.post('/:id/contrato/despachar', proyectoController.despacharContrato);

// Sub-rutas para asignaciones (Personas y Equipos)
router.use('/:id/asignaciones', asignacionRecursosRoutes);

module.exports = router;
