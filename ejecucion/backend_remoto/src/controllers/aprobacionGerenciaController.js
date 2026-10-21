const AprobacionGerenciaModel = require('../models/aprobacionGerenciaModel');

const aprobacionGerenciaModel = new AprobacionGerenciaModel();

module.exports = {
  listarTokens: async (req, res) => {
    try {
      const filtros = {
        id_empresa: req.query._id_empresa ?? req.query.id_empresa ?? null,
        estado_token: req.query.estado_token ?? req.query.estado ?? null,
        tipo_entidad: req.query.tipo_entidad ?? null,
        id_entidad_ref: req.query.id_entidad_ref ?? req.query.id_proyecto ?? req.query.id_oc ?? null
      };
      const tokens = await aprobacionGerenciaModel.listarTokens(filtros);
      return res.status(200).json({
        success: true,
        total: tokens.length,
        tokens
      });
    } catch (err) {
      console.error('[aprobacionGerenciaController.listarTokens] Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  listarPendientes: async (req, res) => {
    try {
      const filtros = {
        id_empresa: req.query._id_empresa ?? req.query.id_empresa ?? null,
        estado_token: 'PENDIENTE',
        tipo_entidad: req.query.tipo_entidad ?? null
      };
      const tokens = await aprobacionGerenciaModel.listarTokens(filtros);
      return res.status(200).json({
        success: true,
        total: tokens.length,
        tokens
      });
    } catch (err) {
      console.error('[aprobacionGerenciaController.listarPendientes] Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  crearToken: async (req, res) => {
    try {
      const body = req.body || {};
      const tokenCreated = await aprobacionGerenciaModel.crearToken({
        ...body,
        id_usuario_solicita: body.id_usuario_solicita ?? req.user?.id_user ?? null,
        nombre_solicita: body.nombre_solicita || (req.user?.name_frst ? `${req.user.name_frst} ${req.user.apellido_pat || ''}`.trim() : 'Ejecutivo GSP')
      });

      return res.status(201).json({
        success: true,
        message: 'Enlace de aprobación de 1 solo uso generado exitosamente',
        token_uuid: tokenCreated.token_uuid,
        url_aprobacion: tokenCreated.url_aprobacion,
        url_completa: tokenCreated.url_completa,
        token: tokenCreated
      });
    } catch (err) {
      console.error('[aprobacionGerenciaController.crearToken] Error:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  obtenerPorTokenPublico: async (req, res) => {
    try {
      const { token } = req.params;
      if (!token) {
        return res.status(400).json({ success: false, error: 'Token requerido' });
      }

      const tokenData = await aprobacionGerenciaModel.obtenerPorToken(token);
      if (!tokenData) {
        return res.status(404).json({
          success: false,
          error: 'Enlace de aprobación no encontrado o inválido'
        });
      }

      return res.status(200).json({
        success: true,
        ya_utilizado: tokenData.ya_utilizado,
        expirado: tokenData.expirado,
        estado_token: tokenData.estado_token,
        token: tokenData
      });
    } catch (err) {
      console.error('[aprobacionGerenciaController.obtenerPorTokenPublico] Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  resolverTokenPublico: async (req, res) => {
    try {
      const { token } = req.params;
      const { decision, observacion, observacion_omar, motivo } = req.body || {};

      const obsFinal = observacion ?? observacion_omar ?? motivo ?? '';
      const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'IP_MOVIL';
      const userAgent = req.headers['user-agent'] || 'SMARTPHONE_WEB';

      const resultado = await aprobacionGerenciaModel.resolverToken(
        token,
        decision,
        obsFinal,
        {
          ip: Array.isArray(ip) ? ip[0] : String(ip).split(',')[0].trim(),
          user_agent: userAgent,
          id_usuario_aprueba: req.body?.id_usuario_aprueba || req.user?.id_user || 66,
          nombre_aprueba: req.body?.nombre_aprueba || 'Luis Omar Ghisellini Jara'
        }
      );

      return res.status(200).json({
        success: true,
        message: `Solicitud resuelta exitosamente con estado: ${resultado.decision}`,
        decision: resultado.decision,
        token: resultado.token,
        entidad_actualizada: resultado.entidad_actualizada
      });
    } catch (err) {
      const status = err.status || 500;
      if (status === 409) {
        return res.status(409).json({
          success: false,
          ya_utilizado: true,
          code: err.code || 'TOKEN_ALREADY_USED',
          error: err.message,
          estado_token: err.token?.estado_token || null,
          token: err.token || null
        });
      }
      if (status === 410) {
        return res.status(410).json({
          success: false,
          expirado: true,
          code: err.code || 'TOKEN_EXPIRED',
          error: err.message
        });
      }
      console.error('[aprobacionGerenciaController.resolverTokenPublico] Error:', err);
      return res.status(status).json({
        success: false,
        error: err.message
      });
    }
  },

  verCotizacionPublica: async (req, res) => {
    try {
      const { token } = req.params;
      const tokenData = await aprobacionGerenciaModel.obtenerPorToken(token);
      if (!tokenData || !tokenData.id_entidad_ref) {
        return res.status(404).send('Enlace de cotización no encontrado o inválido');
      }

      const ProyectoModel = require('../models/proyectoModel');
      const archivoController = require('./archivoController');
      const proyectoM = new ProyectoModel();

      let jf = tokenData.entidad_detalle?.json_field || {};
      if (typeof jf === 'string') {
        try { jf = JSON.parse(jf); } catch (_) { jf = {}; }
      }
      const cots = Array.isArray(jf?.crm_v1?.cotizaciones_historicas) ? jf.crm_v1.cotizaciones_historicas : [];
      let ultimaCot = cots.length > 0 ? cots[cots.length - 1] : null;

      if (!ultimaCot || !ultimaCot.url) {
        const gen = await proyectoM.generarCotizacionVersion(tokenData.id_entidad_ref, tokenData.monto_neto_ref || 0);
        ultimaCot = gen?.cotizacion || null;
      }

      const idDoc = ultimaCot?.id_doc || (ultimaCot?.url ? String(ultimaCot.url).split('/').pop() : null);
      if (!idDoc) {
        return res.status(404).send('No se pudo obtener el documento PDF de la cotización');
      }

      req.params.id = String(idDoc);
      return await archivoController.verArchivoById(req, res);
    } catch (err) {
      console.error('[aprobacionGerenciaController.verCotizacionPublica] Error:', err);
      return res.status(500).send('Error al cargar el PDF de la cotización: ' + err.message);
    }
  },

  verOtPublica: async (req, res) => {
    try {
      const { token } = req.params;
      const tokenData = await aprobacionGerenciaModel.obtenerPorToken(token);
      if (!tokenData || !tokenData.id_entidad_ref) {
        return res.status(404).send('Enlace de Orden de Trabajo no encontrado o inválido');
      }

      const ProyectoModel = require('../models/proyectoModel');
      const archivoController = require('./archivoController');
      const proyectoM = new ProyectoModel();

      let jf = tokenData.entidad_detalle?.json_field || {};
      if (typeof jf === 'string') {
        try { jf = JSON.parse(jf); } catch (_) { jf = {}; }
      }
      const ots = Array.isArray(jf?.ejecucion_v1?.ot_versiones) ? jf.ejecucion_v1.ot_versiones : [];
      let ultimaOt = ots.length > 0 ? ots[ots.length - 1] : null;

      if (!ultimaOt || !ultimaOt.url) {
        const gen = await proyectoM.generarOTVersion(tokenData.id_entidad_ref);
        ultimaOt = gen?.ot || null;
      }

      const idDoc = ultimaOt?.id_doc || (ultimaOt?.url ? String(ultimaOt.url).split('/').pop() : null);
      if (!idDoc) {
        return res.status(404).send('No se pudo obtener el documento PDF de la Orden de Trabajo');
      }

      req.params.id = String(idDoc);
      return await archivoController.verArchivoById(req, res);
    } catch (err) {
      console.error('[aprobacionGerenciaController.verOtPublica] Error:', err);
      return res.status(500).send('Error al cargar el PDF de la Orden de Trabajo: ' + err.message);
    }
  }
};
