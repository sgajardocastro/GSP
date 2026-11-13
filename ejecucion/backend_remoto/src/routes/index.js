const usuariosRouter = require('./usuarioRoutes.js');
const surveyRouter = require('./surveyRoutes.js');
const authsRouter = require('./authRoutes.js');
const servicioRouter = require('./servicioRoutes.js');
const archivoRouter = require('./archivoRoutes.js');
const exportarRouter = require('./exportarRoutes.js');
const signatureRouter = require('./signatureRoutes.js');
const messageRouter = require('./messageRoutes.js');
const notificacionesRouter = require('./notificacionesRoutes.js');
const notfqueueRouter = require('./notfqueueRoutes.js');
const personalizados = require('./personalizadosRoutes.js');
const tareas = require('./tareasRoutes.js');
const equipos = require('./equipoRoutes.js');
const tequEquipoRouter = require('./tequEquipoRoutes.js');
const tequDocumentacionRouter = require('./tequDocumentacionRoutes.js');
const proyectos = require('./proyectoRoutes.js');
const tfmgArchivoRouter = require('./tfmgArchivoRoutes.js');
const sstRouter = require('./sstRoutes.js');
const templateRouter = require('./templateRoutes.js');
const empresasRouter = require('./empresasRoutes.js');
const acreditacionRouter = require('./acreditacionRoutes.js');
const aprobacionGerenciaRouter = require('./aprobacionGerenciaRoutes.js');

function routerApi(app) {
    app.use('/api/usuarios', usuariosRouter);
    app.use('/api/survey', surveyRouter);
    app.use('/api/auth', authsRouter);
    app.use('/api/servicio', servicioRouter);
    app.use('/api/archivo', archivoRouter);
    app.use('/api/exportar', exportarRouter);
    app.use('/api/signature', signatureRouter);
    app.use('/api/message', messageRouter);
    app.use('/api/notificaciones', notificacionesRouter);
    app.use('/api/notfqueue', notfqueueRouter);
    app.use('/api/personalizados', personalizados);
    app.use('/api/tareas', tareas);
    app.use('/api/equipos', equipos);
    app.use('/api/tequ-equipos', tequEquipoRouter);
    app.use('/api/tequ-documentacion', tequDocumentacionRouter);
    app.use('/api/proyectos', proyectos);
    app.use('/api/tfmg-archivos', tfmgArchivoRouter);
    app.use('/api/sst', sstRouter);
    app.use('/api/templates', templateRouter);
    app.use('/api/empresas', empresasRouter);
    app.use('/api/acreditacion', acreditacionRouter);
    app.use('/api/acreditaciones', acreditacionRouter);
    app.use('/api/v1/storage', require('./storageRoutes.js'));
    app.use('/api/contactos', require('./contactoRoutes.js'));
    app.use('/api/estado-pago', require('./estadoPagoRoutes.js'));
    app.use('/api/operaciones/edp', require('./estadoPagoRoutes.js'));
    app.use('/api/viajes', require('./viajeRoutes.js'));
    app.use('/api/operaciones/viaje', require('./viajeRoutes.js'));
    app.use('/api/operaciones/report', require('./reportDiarioRoutes.js'));
    app.use('/api/operaciones/reports', require('./reportDiarioRoutes.js'));
    app.use('/api/reports', require('./reportDiarioRoutes.js'));
    app.use('/api/operaciones/patio', require('./patioRoutes.js'));
    app.use('/api/patio', require('./patioRoutes.js'));
    app.use('/api/operaciones/its', require('./itsRoutes.js'));
    app.use('/api/its', require('./itsRoutes.js'));
    app.use('/api/visitas', require('./visitaTerrenoRoutes.js'));
    app.use('/api/backlog', require('./backlogRoutes.js'));
    app.use('/api/operaciones/control-vivo', require('./controlVivoRoutes.js'));
    app.use('/api/mantenimiento', require('./mantenimientoRoutes.js'));
    app.use('/api/inventario', require('./inventarioRoutes.js'));
    app.use('/api/operaciones/acta-plataforma', require('./actaPlataformaRoutes.js'));
    app.use('/api/actas-plataforma', require('./actaPlataformaRoutes.js'));
    app.use('/api/operaciones/plan-izaje', require('./planIzajeRoutes.js'));
    app.use('/api/planes-izaje', require('./planIzajeRoutes.js'));

    // Spec 87: Aprobador Móvil Gerencia (Web Token 1 Solo Uso)
    app.use('/api/aprobaciones-gerencia', aprobacionGerenciaRouter);
    app.use('/api/aprobacion-gerencia', aprobacionGerenciaRouter);

    // Spec 87: Módulo de Compras / Solicitudes de Pedido / OCs Multi-Empresa (Resiliente)
    try {
        const comprasRouter = require('./comprasRoutes.js');
        app.use('/api/compras', comprasRouter);
        app.use('/api/ordenes-compra', comprasRouter);
    } catch (errCompras) {
        console.warn('[routes/index] Aviso: comprasRoutes en carga diferida:', errCompras.message);
        const lazyComprasMiddleware = (req, res, next) => {
            try {
                const dynamicComprasRouter = require('./comprasRoutes.js');
                return dynamicComprasRouter(req, res, next);
            } catch (e) {
                return res.status(503).json({ error: 'Módulo de compras en inicialización: ' + e.message });
            }
        };
        app.use('/api/compras', lazyComprasMiddleware);
        app.use('/api/ordenes-compra', lazyComprasMiddleware);
    }
}

module.exports = routerApi;
