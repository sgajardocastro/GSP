const ProyectoModel = require("../models/proyectoModel.js");
const EquipoProyectoModel = require("../models/equipoProyectoModel.js"); // ✅ nuevo
const pool = require("../config/postgresPool.js");
const notificacionService = require("../services/notificacionService.js");

const proyecto = new ProyectoModel();
const equipoProyecto = new EquipoProyectoModel();

function tryParseJson(val) {
  if (val == null || val === "") return null;
  if (typeof val === "object") return val; // ya es json
  if (typeof val !== "string") return null;

  try {
    return JSON.parse(val);
  } catch {
    return "__INVALID__";
  }
}

function mapPgError(err) {
  const code = err?.code;              // ej: 23505, 23503, etc.
  const constraint = err?.constraint;  // ej: uq_equipo_por_proyecto
  const detail = err?.detail || "";
  const message = err?.message || "";

  // UNIQUE
  if (code === "23505") {
    if (constraint === "uq_equipo_por_proyecto") {
      return {
        status: 409,
        error: "Ya existe un equipo con ese nombre en este proyecto.",
        meta: { constraint }
      };
    }
    return {
      status: 409,
      error: "Conflicto por dato duplicado.",
      meta: { constraint, detail }
    };
  }

  // FK
  if (code === "23503") {
    return {
      status: 409,
      error: "No se pudo guardar: referencia inválida (FK). Revisa proyecto/líder/usuario_creación.",
      meta: { constraint, detail }
    };
  }

  // NOT NULL
  if (code === "23502") {
    return {
      status: 400,
      error: "Faltan campos obligatorios.",
      meta: { constraint, detail }
    };
  }

  return {
    status: 500,
    error: message || "Error interno.",
    meta: { code, constraint, detail }
  };
}

module.exports = {
  getProyectos: async (req, res) => {
    try {
      // Priorizar el parámetro de consulta explicitamente enviado desde el cliente
      let id_empresa = req.query?._id_empresa !== undefined ? req.query._id_empresa : (req.user?.id_empresa || null);
      if (id_empresa === 'all' || id_empresa === '0' || id_empresa === 0 || id_empresa === 'null') {
        id_empresa = null;
      }

      // Evaluación de Scope RBAC:
      // Roles con acceso global: Admin, ADM_COM, COORD, roles operacionales GSP (o usuarios clave autorizados)
      const roles = Array.isArray(req.user?.roles) ? req.user.roles : [];
      const isAdminOrGlobal = roles.some(r => ['Admin', 'ADM_COM', 'COORD', 'GSP_PROG', 'GSP_APROB', 'GSP_CONTA'].includes(r)) || [1, 19, 46, 55].includes(Number(req.user?.id_user));
      
      let scope = null;
      if (!isAdminOrGlobal && roles.includes('COMERCIAL')) {
        // Comercial restringido a ver únicamente sus propios procesos comerciales de todas las empresas
        scope = {
          solo_propios: true,
          id_user: req.user?.id_user
        };
      }

      const proyectos = await proyecto.getProyectos(id_empresa, scope);
      return res.status(200).json({ 
        message: "Proyectos obtenidos correctamente", 
        proyectos,
        scope: scope ? 'COMERCIAL_PROPIOS' : 'GLOBAL'
      });
    } catch (err) {
      console.error("Error en getProyectos:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  getProyectoById: async (req, res) => {
    try {
      const { id } = req.params;
      const prj = await proyecto.getProyectoById(id);

      if (!prj) return res.status(404).json({ error: "Proyecto no existe" });

      // Verificación de Scope RBAC para COMERCIAL
      if (req.user) {
        const roles = Array.isArray(req.user.roles) ? req.user.roles : [];
        const isAdminOrGlobal = roles.some(r => ['Admin', 'ADM_COM', 'COORD', 'GSP_PROG', 'GSP_APROB', 'GSP_CONTA'].includes(r)) || [1, 19, 46, 55].includes(Number(req.user?.id_user));
        if (!isAdminOrGlobal && roles.includes('COMERCIAL')) {
          if (Number(prj.id_usuario_creacion) !== Number(req.user.id_user)) {
            return res.status(403).json({ error: "Acceso denegado: Solo tiene permisos para consultar sus propias cotizaciones." });
          }
        }
      }

      return res.status(200).json({ message: "Proyecto obtenido correctamente", proyecto: prj });
    } catch (err) {
      console.error("Error en getProyectoById:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  createProyecto: async (req, res) => {
    try {
      let codi_proyecto = req.body.codi_proyecto;
      const isFormalCode = codi_proyecto && /^(GSP|BMQ|LDS|RYL|PRY)-\d{4}(-\d+)?-\d{3}$/.test(codi_proyecto);
      if (!isFormalCode) {
        const id_empresa = req.body.id_empresa || req.user?.id_empresa;
        const id_cliente = req.body.id_empresa_cliente || null;
        if (id_empresa) {
          codi_proyecto = await proyecto.generarCodigoTransaccional(id_empresa, id_cliente);
        }
      }

      const payload = {
        ...req.body,
        codi_proyecto,
        id_user_creacion: req.body.id_user_creacion ?? req.user?.id_user ?? null,
      };

      const nuevo = await proyecto.createProyecto(payload);

      return res.status(201).json({ message: "Proyecto creado correctamente", proyecto: nuevo });
    } catch (err) {
      console.error("Error en createProyecto:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  // ✅ POST: Crear oportunidad comercial en preventa (RF-4.3)
  createProyectoPreventa: async (req, res) => {
    try {
      // Usa el id_empresa enviado desde la UI (si existe rol global) o fuerza el del usuario actual
      const id_empresa = req.body.id_empresa || req.user?.id_empresa;
      
      if (!id_empresa) {
        return res.status(400).json({ error: "Falta id_empresa para generar la cotización." });
      }

      let codi_proyecto = req.body.codi_proyecto;
      const isFormalCode = codi_proyecto && /^(GSP|BMQ|LDS|RYL|PRY)-\d{4}(-\d+)?-\d{3}$/.test(codi_proyecto);
      if (!isFormalCode) {
        const id_cliente = req.body.id_empresa_cliente || null;
        codi_proyecto = await proyecto.generarCodigoTransaccional(id_empresa, id_cliente);
      }

      const payload = {
        ...req.body,
        id_empresa,
        codi_proyecto,
        id_user_creacion: req.user?.id_user ?? req.body.id_user_creacion ?? null,
        id_proyecto_estado: 1, // 1 = "Oportunidad Registrada"
      };

      const nuevo = await proyecto.createProyecto(payload);

      return res.status(201).json({ message: "Oportunidad registrada exitosamente", proyecto: nuevo });
    } catch (err) {
      console.error("Error en createProyectoPreventa:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  updateProyecto: async (req, res) => {
    try {
      const { id } = req.params;

      const existing = await proyecto.getProyectoById(id);
      if (!existing) {
        return res.status(404).json({ error: "Proyecto no encontrado" });
      }

      let codi_proyecto = req.body.codi_proyecto || existing.codi_proyecto;
      const isFormalCode = codi_proyecto && /^(GSP|BMQ|LDS|RYL|PRY)-\d{4}(-\d+)?-\d{3}$/.test(codi_proyecto);
      if (!isFormalCode) {
        const id_empresa = req.body.id_empresa || existing.id_empresa || req.user?.id_empresa;
        const id_cliente = req.body.id_empresa_cliente || existing.id_empresa_cliente || null;
        if (id_empresa) {
          codi_proyecto = await proyecto.generarCodigoTransaccional(id_empresa, id_cliente);
        }
      }

      const payload = {
        ...req.body,
        codi_proyecto,
        id_user_modificacion: req.body.id_user_modificacion ?? null,
      };

      const updated = await proyecto.updateProyecto(id, payload);

      if (!updated) return res.status(404).json({ error: "No se pudo actualizar. Proyecto no encontrado" });

      return res.status(200).json({ message: "Proyecto actualizado correctamente", proyecto: updated });
    } catch (err) {
      console.error("Error en updateProyecto:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  deleteProyecto: async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await proyecto.deleteProyecto(id);

      if (!deleted) return res.status(404).json({ error: "Proyecto no encontrado" });

      return res.status(200).json({ message: "Proyecto eliminado correctamente", deleted });
    } catch (err) {
      console.error("Error en deleteProyecto:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  // ✅ POST: crear equipo dentro de proyecto
  crearEquipoProyecto: async (req, res) => {
    try {
      const {
        id_proyecto,
        nombre_equipo,
        descripcion_equipo,
        id_usuario_lider,
        estado_equipo,
        id_usuario_creacion,
        json_field
      } = req.body;

      // ✅ validaciones mínimas
      if (!id_proyecto || Number(id_proyecto) <= 0) {
        return res.status(400).json({ error: "id_proyecto es requerido y debe ser válido" });
      }
      if (!nombre_equipo || !String(nombre_equipo).trim()) {
        return res.status(400).json({ error: "nombre_equipo es requerido" });
      }

      const parsedJson = tryParseJson(json_field);
      if (parsedJson === "__INVALID__") {
        return res.status(400).json({ error: "json_field debe ser un JSON válido (o venir como objeto)" });
      }

      const payload = {
        id_proyecto: Number(id_proyecto),
        nombre_equipo: String(nombre_equipo).trim(),
        descripcion_equipo: (descripcion_equipo ?? "").toString().trim() || null,
        id_usuario_lider: id_usuario_lider ? Number(id_usuario_lider) : null,
        estado_equipo: (estado_equipo ?? "ACTIVO").toString().trim() || "ACTIVO",
        id_usuario_creacion: id_usuario_creacion ?? null,
        json_field: parsedJson, // null u objeto
      };

      const nuevo = await equipoProyecto.crearEquipoProyecto(payload);

      return res.status(201).json({
        message: "Equipo creado correctamente",
        equipo: nuevo
      });
    } catch (err) {
      console.error("Error en crearEquipoProyecto:", err);

      const mapped = mapPgError(err);
      return res.status(mapped.status).json({
        error: mapped.error,
        ...(mapped.meta ? { meta: mapped.meta } : {})
      });
    }
  },

  generarCotizacion: async (req, res) => {
    try {
      const { id } = req.params;
      const { monto } = req.body;

      if (!id || Number(id) <= 0) {
        return res.status(400).json({ error: "id_proyecto es requerido y debe ser válido" });
      }

      const result = await proyecto.generarCotizacionVersion(id, monto);

      return res.status(200).json({
        message: "Versión de cotización generada exitosamente",
        cotizacion: result.cotizacion,
        proyecto: result.proyecto
      });
    } catch (err) {
      console.error("Error en generarCotizacion:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  generarOT: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || Number(id) <= 0) {
        return res.status(400).json({ error: "id_proyecto es requerido y debe ser válido" });
      }

      const result = await proyecto.generarOTVersion(id);

      return res.status(200).json({
        message: "Versión de Orden de Trabajo generada exitosamente",
        ot: result.ot,
        proyecto: result.proyecto
      });
    } catch (err) {
      console.error("Error en generarOT:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  enviarOT: async (req, res) => {
    try {
      const { id } = req.params;
      const payload = req.body || {};

      if (!id || Number(id) <= 0) {
        return res.status(400).json({ error: "id_proyecto es requerido y debe ser válido" });
      }

      const result = await proyecto.enviarOT(id, payload);

      return res.status(200).json({
        message: result.message,
        despacho: result.despacho
      });
    } catch (err) {
      console.error("Error en enviarOT:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  // ✅ POST: Reversar cotización desde Verificación a Preventa Comercial con Motivo y Notificación Interna (REQ-990)
  reversarACotizacion: async (req, res) => {
    try {
      const { id } = req.params;
      const { motivo, payload } = req.body;

      if (!id || Number(id) <= 0) {
        return res.status(400).json({ error: "id_proyecto es requerido y debe ser válido" });
      }

      if (!motivo || typeof motivo !== 'string' || motivo.trim().length < 5) {
        return res.status(400).json({ error: "El motivo de la devolución es obligatorio (mínimo 5 caracteres)." });
      }

      const existing = await proyecto.getProyectoById(id);
      if (!existing) {
        return res.status(404).json({ error: "Proyecto no encontrado" });
      }

      const currentUser = req.user || {};
      const fechaNow = new Date().toISOString();
      const motivoTexto = motivo.trim();

      // Fusionar json_field existente con los datos de reverso
      const existingJson = typeof existing.json_field === 'object' && existing.json_field !== null ? existing.json_field : {};
      const crmV1 = { ...(existingJson.crm_v1 || {}) };
      
      crmV1.motivo_reverso_verificacion = motivoTexto;
      crmV1.fecha_reverso_verificacion = fechaNow;
      crmV1.usuario_reverso_verificacion = {
        id_user: currentUser.id_user || null,
        nombre: currentUser.name_frst ? `${currentUser.name_frst} ${currentUser.apellido_pat || ''}`.trim() : (currentUser.nombre || 'Operaciones')
      };

      // Si el cliente mandó un payload con cambios adicionales de la UI:
      const mergedPayload = {
        ...(payload || {}),
        id_proyecto_estado: 2, // ESTADOS_DB.COTIZANDO
        id_user_modificacion: currentUser.id_user || null,
        json_field: {
          ...existingJson,
          ...(payload?.json_field || {}),
          crm_v1: {
            ...crmV1,
            ...(payload?.json_field?.crm_v1 || {}),
            motivo_reverso_verificacion: motivoTexto,
            fecha_reverso_verificacion: fechaNow
          }
        }
      };

      const updated = await proyecto.updateProyecto(id, mergedPayload);

      // Notificación Omnicanal Interna (Email + WhatsApp)
      // Cumpliendo leanglobal_notification_standard: Cero contacto con el cliente mandante
      try {
        const idEjecutivo = crmV1.id_ejecutivo_comercial || existing.id_user_responsable || existing.id_usuario_creacion;
        const codiPry = existing.codi_proyecto || `PRY-${id}`;
        const nombreCliente = existing.nombre_empresa_cliente || existing.cliente || 'Cliente';
        const nombreReversor = currentUser.name_frst ? `${currentUser.name_frst} ${currentUser.apellido_pat || ''}`.trim() : 'Equipo de Operaciones';

        // Buscar usuarios internos para notificar: ejecutivo responsable + jefatura y PMO
        const targetIds = [19, 65, 66]; // Jorge Ponce, Yiara Mendoza, Omar Ghiselini
        if (idEjecutivo && !targetIds.includes(Number(idEjecutivo))) {
          targetIds.push(Number(idEjecutivo));
        }

        const usersRes = await pool.query(
          `SELECT id_user, name_frst, apellido_pat, email, movil AS fono FROM tsec_users WHERE id_user = ANY($1::int[])`,
          [targetIds]
        );

        const fechaFormateada = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' });
        const asuntoNotif = `⚠️ Negocio Reversado a Preventa Comercial: ${codiPry} — ${nombreCliente}`;

        for (const u of usersRes.rows) {
          if (!u.email && !u.fono) continue;

          const destNombre = `${u.name_frst || ''} ${u.apellido_pat || ''}`.trim() || 'Estimado Colaborador';
          const canalesDest = [];
          if (u.email) canalesDest.push('EMAIL');
          if (u.fono) canalesDest.push('WHATSAPP');

          const mensajeWsp = `⚠️ *[GSP] Negocio Reversado a Preventa Comercial*\n\n` +
            `Hola ${destNombre},\n` +
            `El requerimiento fue devuelto desde la etapa de *Verificación Operativa* a *Preventa Comercial*.\n\n` +
            `📋 *Proyecto:* ${codiPry}\n` +
            `🏢 *Cliente:* ${nombreCliente}\n` +
            `👤 *Devuelto por:* ${nombreReversor}\n` +
            `📅 *Fecha:* ${fechaFormateada}\n\n` +
            `📝 *Motivo de Devolución:*\n"${motivoTexto}"\n\n` +
            `👉 *Acción requerida:* Por favor revisar y ajustar la cotización en el CRM.`;

          const emailHtml = `
            <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
              <h2 style="color: #d97706; margin-bottom: 8px;">⚠️ Negocio Reversado a Preventa Comercial</h2>
              <p style="color: #64748b; font-size: 14px; margin-top: 0;">Estimado(a) <strong>${destNombre}</strong>,</p>
              <p>Se informa que el siguiente requerimiento ha sido devuelto desde <strong>Verificación Operativa</strong> a <strong>Preventa Comercial</strong> para ajustes o corrección:</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 4px 0;"><strong>Código Proyecto:</strong> <span style="color: #0284c7; font-weight: bold;">${codiPry}</span></p>
                <p style="margin: 4px 0;"><strong>Cliente Mandante:</strong> ${nombreCliente}</p>
                <p style="margin: 4px 0;"><strong>Devuelto por:</strong> ${nombreReversor}</p>
                <p style="margin: 4px 0;"><strong>Fecha y Hora:</strong> ${fechaFormateada}</p>
              </div>

              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0 0 6px 0; font-weight: bold; color: #92400e;">Motivo de la Devolución:</p>
                <p style="margin: 0; color: #78350f; font-style: italic; font-size: 14px;">"${motivoTexto}"</p>
              </div>

              <p style="font-size: 12px; color: #94a3b8; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                🔒 <em>Nota de confidencialidad: Esta es una notificación interna exclusiva para el equipo de Grúas San Pablo. El cliente mandante no ha recibido este aviso.</em>
              </p>
            </div>
          `;

          await notificacionService.despacharNotificacion({
            evento: 'PROYECTO_REVERSADO_A_COMERCIAL',
            canales: canalesDest,
            destinatario: {
              nombre: destNombre,
              email: u.email,
              telefono: u.fono
            },
            deepLink: {
              tipoApp: 'WEB',
              ruta: 'crm',
              params: { id_proyecto: id }
            },
            emailData: {
              asunto: asuntoNotif,
              titulo: 'Negocio Reversado a Comercial',
              subtitulo: `${codiPry} — ${nombreCliente}`,
              contenido: emailHtml,
              botonTexto: 'ABRIR EN CRM'
            },
            wspData: {
              mensaje: mensajeWsp
            }
          });
        }
      } catch (notifErr) {
        console.error("[Reverso] Error al enviar notificaciones internas (no bloqueante):", notifErr);
      }

      return res.status(200).json({
        success: true,
        message: "Proyecto devuelto a Preventa Comercial exitosamente y notificado al equipo interno.",
        proyecto: updated
      });
    } catch (err) {
      console.error("Error en reversarACotizacion:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  // =========================================================================
  // CONTRATO & FORMALIZACIÓN (REQ-1037 / TSK-COT-04)
  // =========================================================================

  generarContratoPdf: async (req, res) => {
    try {
      const { id } = req.params;
      const datosExtra = req.body || {};
      const resultado = await proyecto.generarContratoArriendoVersion(id, datosExtra);
      return res.status(200).json({
        success: true,
        message: "PDF de Contrato de Arriendo generado exitosamente",
        contrato: resultado.contrato
      });
    } catch (err) {
      console.error("Error en generarContratoPdf:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  generarTokenFirmaContrato: async (req, res) => {
    try {
      const { id } = req.params;
      const { representante_nombre, representante_rut, representante_cargo, representante_telefono, representante_email } = req.body || {};
      const crypto = require('crypto');
      const token = crypto.randomBytes(24).toString('hex');
      const client = await pool.connect();
      try {
        const queryProy = 'SELECT id_proyecto, codi_proyecto, json_field FROM tpry_proyecto WHERE id_proyecto = $1';
        const resP = await client.query(queryProy, [id]);
        if (resP.rowCount === 0) {
          return res.status(404).json({ success: false, error: "Proyecto no encontrado" });
        }
        const p = resP.rows[0];
        const jsonField = p.json_field || {};
        const crm = jsonField.crm_v1 || {};
        const contrato = crm.contrato || {};

        contrato.token_firma = {
          token,
          estado: 'PENDIENTE',
          creado_at: new Date().toISOString(),
          expira_at: new Date(Date.now() + 72 * 3600 * 1000).toISOString()
        };
        if (representante_nombre) contrato.representante_nombre = representante_nombre;
        if (representante_rut) contrato.representante_rut = representante_rut;
        if (representante_cargo) contrato.representante_cargo = representante_cargo;
        if (representante_telefono) contrato.representante_telefono = representante_telefono;
        if (representante_email) contrato.representante_email = representante_email;

        crm.contrato = contrato;
        jsonField.crm_v1 = crm;

        await client.query('UPDATE tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2', [jsonField, id]);
        
        return res.status(200).json({
          success: true,
          token,
          contrato
        });
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Error en generarTokenFirmaContrato:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  despacharContrato: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        representante_nombre, 
        representante_rut, 
        representante_cargo, 
        representante_telefono, 
        representante_email, 
        vendedor_email 
      } = req.body || {};

      const crypto = require('crypto');
      const token = crypto.randomBytes(24).toString('hex');
      const client = await pool.connect();
      let p = null;
      try {
        const queryProy = 'SELECT id_proyecto, codi_proyecto, nombre_proyecto, json_field FROM tpry_proyecto WHERE id_proyecto = $1';
        const resP = await client.query(queryProy, [id]);
        if (resP.rowCount === 0) {
          return res.status(404).json({ success: false, error: "Proyecto no encontrado" });
        }
        p = resP.rows[0];
        const jsonField = p.json_field || {};
        const crm = jsonField.crm_v1 || {};
        const contrato = crm.contrato || {};

        contrato.token_firma = {
          token,
          estado: 'PENDIENTE',
          creado_at: new Date().toISOString(),
          expira_at: new Date(Date.now() + 72 * 3600 * 1000).toISOString()
        };
        if (representante_nombre) contrato.representante_nombre = representante_nombre;
        if (representante_rut) contrato.representante_rut = representante_rut;
        if (representante_cargo) contrato.representante_cargo = representante_cargo;
        if (representante_telefono) contrato.representante_telefono = representante_telefono;
        if (representante_email) contrato.representante_email = representante_email;
        contrato.estado = 'ENVIADO_FES';

        crm.contrato = contrato;
        jsonField.crm_v1 = crm;

        await client.query('UPDATE tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2', [jsonField, id]);
      } finally {
        client.release();
      }

      // Construcción del enlace canónico de firma pública
      const notificacionService = require('../services/notificacionService');
      const isProd = process.env.APP_ENV === 'prod' || process.env.NODE_ENV === 'production';
      const baseUrlWeb = isProd 
        ? 'https://servidor.leanglobal.cl/lg-gsp-prod' 
        : 'https://servidor.leanglobal.cl/lg-gsp-dev';
      const urlFirma = `${baseUrlWeb}/firmar-contrato?token=${token}`;

      const folio = p.json_field?.crm_v1?.contrato?.folio || `CTR-2026-${String(id).padStart(4, '0')}`;

      // 1. Envío por Correo Electrónico (Nodemailer SMTP B2B)
      let emailEnviado = false;
      let errorEmail = null;
      const emailDestino = representante_email || p.json_field?.crm_v1?.contacto_email;
      const emailEjecutivo = vendedor_email || p.json_field?.crm_v1?.vendedor_email;

      if (emailDestino && emailDestino.includes('@')) {
        try {
          const resMail = await notificacionService.despacharEmailSmtp({
            para: emailDestino,
            cc: (emailEjecutivo && emailEjecutivo.includes('@') && emailEjecutivo !== emailDestino) ? emailEjecutivo : undefined,
            asunto: `Contrato de Arrendamiento de Maquinaria - Folio ${folio}`,
            titulo: 'Firma Digital de Contrato de Arriendo',
            subtitulo: `Estimado(a) ${representante_nombre || 'Cliente'}:`,
            contenido: `
              <p>Le compartimos el enlace oficial para la revisión íntegra y firma digital (FES) del Contrato de Arrendamiento correspondiente a <strong>${p.nombre_proyecto || folio}</strong>.</p>
              <div style="background: rgba(255,255,255,0.05); padding: 14px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 15px 0;">
                <strong>Folio Contrato:</strong> ${folio}<br>
                <strong>Representante Mandante:</strong> ${representante_nombre || 'Representante Autorizado'}<br>
                <strong>Vigencia del Enlace:</strong> 72 horas continuas
              </div>
              <p>Al hacer clic en el botón inferior podrá revisar en su pantalla las 14 cláusulas del contrato, las condiciones particulares del equipo y estampar su firma digital directamente con su dedo o puntero táctil.</p>
            `,
            botonTexto: '📝 REVISAR Y FIRMAR CONTRATO DIGITAL',
            botonUrl: urlFirma
          });
          emailEnviado = resMail.success;
          if (!resMail.success) errorEmail = resMail.error;
        } catch (errM) {
          errorEmail = errM.message;
        }
      } else {
        errorEmail = 'No se especificó un correo de cliente válido';
      }

      // 2. Envío por WhatsApp (Microservicio Baileys)
      let wspEnviado = false;
      let errorWsp = null;
      const telDestino = representante_telefono || p.json_field?.crm_v1?.contacto_telefono;
      if (telDestino) {
        try {
          const msgWsp = `Estimado(a) ${representante_nombre || 'Cliente'}, le compartimos el enlace oficial para revisar y firmar digitalmente el Contrato de Arrendamiento ${folio}:\n\n${urlFirma}\n\nFavor ingresar para leer las 14 cláusulas y firmar en su celular (vigencia: 72 horas).`;
          const resWsp = await notificacionService.despacharWhatsAppHttp({
            telefono: telDestino,
            mensaje: msgWsp
          });
          wspEnviado = resWsp.success;
          if (!resWsp.success) errorWsp = resWsp.error;
        } catch (errW) {
          errorWsp = errW.message;
        }
      } else {
        errorWsp = 'No se especificó un teléfono de cliente válido';
      }

      return res.status(200).json({
        success: true,
        token,
        url_firma: urlFirma,
        folio,
        despacho: {
          email_enviado: emailEnviado,
          email_destinatario: emailDestino || 'No especificado',
          email_copia: emailEjecutivo || null,
          error_email: errorEmail,
          wsp_enviado: wspEnviado,
          wsp_telefono: telDestino || 'No especificado',
          error_wsp: errorWsp
        }
      });
    } catch (err) {
      console.error("Error en despacharContrato:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  obtenerContratoPorToken: async (req, res) => {
    try {
      const { token } = req.params;
      if (!token) return res.status(400).json({ success: false, error: "Token requerido" });

      const client = await pool.connect();
      try {
        const query = `
          SELECT p.id_proyecto, p.codi_proyecto, p.nombre_proyecto, p.id_empresa_cliente, p.json_field,
                 e.razon_social AS mandante_razon_social, e.rut_empresa AS mandante_rut
          FROM tpry_proyecto p
          LEFT JOIN tpar_empresas e ON e.id_empresa = p.id_empresa_cliente
          WHERE p.json_field->'crm_v1'->'contrato'->'token_firma'->>'token' = $1
        `;
        const resP = await client.query(query, [token]);
        if (resP.rowCount === 0) {
          return res.status(404).json({ success: false, error: "Token de firma inválido o inexistente" });
        }
        const p = resP.rows[0];
        const crm = p.json_field?.crm_v1 || {};
        const contrato = crm.contrato || {};
        const tokenInfo = contrato.token_firma || {};

        if (tokenInfo.estado === 'FIRMADO') {
          return res.status(400).json({ 
            success: false, 
            ya_firmado: true,
            error: "Este contrato ya ha sido firmado previamente.",
            contrato
          });
        }

        if (tokenInfo.expira_at && new Date(tokenInfo.expira_at) < new Date()) {
          return res.status(410).json({ 
            success: false, 
            expirado: true,
            error: "El enlace de firma ha expirado (plazo máximo 72 horas)." 
          });
        }

        const items = crm.cotizaciones_v1?.[0]?.items || [];
        const itemMaq = items[0] || {};

        let htmlContrato = '';
        try {
          const dataHtml = await proyecto.obtenerHtmlContratoArriendo(p.id_proyecto);
          htmlContrato = dataHtml.htmlContent || '';
        } catch (eHtml) {
          console.warn("No se pudo compilar html_contrato para visor:", eHtml.message);
        }

        return res.status(200).json({
          success: true,
          proyecto: {
            id_proyecto: p.id_proyecto,
            codi_proyecto: p.codi_proyecto,
            nombre_proyecto: p.nombre_proyecto,
            mandante_razon_social: p.mandante_razon_social || crm.razon_social || 'Cliente Mandante',
            mandante_rut: p.mandante_rut || crm.rut_cliente || 'Sin RUT'
          },
          contrato: {
            folio: contrato.folio,
            estado: contrato.estado,
            representante_nombre: contrato.representante_nombre || '',
            representante_rut: contrato.representante_rut || '',
            representante_cargo: contrato.representante_cargo || 'Representante Legal',
            representante_telefono: contrato.representante_telefono || '',
            representante_email: contrato.representante_email || '',
            equipo_nombre: itemMaq.descripcion || 'Plataforma / Equipo de Elevación',
            tarifa_pactada: itemMaq.total ? `$${Number(itemMaq.total).toLocaleString('es-CL')}` : 'Según cotización',
            url_pdf: contrato.url_pdf
          },
          html_contrato: htmlContrato
        });
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Error en obtenerContratoPorToken:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  firmarContratoPublico: async (req, res) => {
    try {
      const { token } = req.params;
      const { nombre, rut, cargo, firma_base64 } = req.body;

      if (!token) return res.status(400).json({ success: false, error: "Token requerido" });
      if (!nombre || !rut || !firma_base64) {
        return res.status(400).json({ success: false, error: "Nombre, RUT y firma gráfica son obligatorios" });
      }

      const client = await pool.connect();
      let idPry = null;
      try {
        const query = `
          SELECT p.id_proyecto, p.json_field
          FROM tpry_proyecto p
          WHERE p.json_field->'crm_v1'->'contrato'->'token_firma'->>'token' = $1
        `;
        const resP = await client.query(query, [token]);
        if (resP.rowCount === 0) {
          return res.status(404).json({ success: false, error: "Token de firma inválido o inexistente" });
        }
        const p = resP.rows[0];
        idPry = p.id_proyecto;
        const crm = p.json_field?.crm_v1 || {};
        const contrato = crm.contrato || {};
        const tokenInfo = contrato.token_firma || {};

        if (tokenInfo.estado === 'FIRMADO') {
          return res.status(400).json({ success: false, error: "Este contrato ya fue firmado" });
        }
        if (tokenInfo.expira_at && new Date(tokenInfo.expira_at) < new Date()) {
          return res.status(410).json({ success: false, error: "El enlace de firma ha expirado" });
        }
      } finally {
        client.release();
      }

      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP_DESCONOCIDA';
      const userAgent = req.headers['user-agent'] || 'USER_AGENT_DESCONOCIDO';
      const fechaFirma = new Date();

      const resultado = await proyecto.generarContratoArriendoVersion(idPry, {
        representante_nombre: nombre,
        representante_rut: rut,
        representante_cargo: cargo || 'Representante Legal',
        firma_cliente_base64: firma_base64,
        ip_firmante: ip,
        user_agent_firmante: userAgent,
        fecha_firma: fechaFirma
      });

      const clientUpdate = await pool.connect();
      try {
        const resP2 = await clientUpdate.query('SELECT json_field FROM tpry_proyecto WHERE id_proyecto = $1', [idPry]);
        const jf = resP2.rows[0].json_field || {};
        if (jf.crm_v1?.contrato?.token_firma) {
          jf.crm_v1.contrato.token_firma.estado = 'FIRMADO';
          jf.crm_v1.contrato.token_firma.firmado_at = fechaFirma.toISOString();
          jf.crm_v1.contrato.token_firma.ip = ip;
          jf.crm_v1.contrato.token_firma.user_agent = userAgent;
        }
        await clientUpdate.query('UPDATE tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2', [jf, idPry]);
      } finally {
        clientUpdate.release();
      }

      return res.status(200).json({
        success: true,
        message: "Contrato firmado y registrado exitosamente con plena validez digital",
        contrato: resultado.contrato
      });
    } catch (err) {
      console.error("Error en firmarContratoPublico:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
};
