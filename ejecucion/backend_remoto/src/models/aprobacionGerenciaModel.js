const crypto = require('crypto');
const pool = require('../config/postgresPool');
const notificacionService = require('../services/notificacionService');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EMPRESAS_HOLDING = {
  9: { nombre: 'Grúas San Pablo (Luis Omar Ghisellini Jara E.I.R.L.)', corto: 'Grúas San Pablo', rut: '52.004.162-1', prefijo: 'GSP' },
  11: { nombre: 'Arriendo Royal Rental Limitada', corto: 'Royal Rental', rut: '78.254.535-3', prefijo: 'RYL' },
  7: { nombre: 'Sociedad Bestmaq Venta de Maquinaria Usada Limitada', corto: 'Bestmaq', rut: '76.209.534-3', prefijo: 'BMQ' },
  8: { nombre: 'Servicios Integrados Logísticos del Sur Ltda.', corto: 'Logística del Sur', rut: '76.218.576-8', prefijo: 'LDS' }
};

class AprobacionGerenciaModel {
  constructor() {
    this.pool = pool;
  }

  _normalizarDecision(decisionRaw) {
    const d = String(decisionRaw || '').trim().toUpperCase();
    if (d === 'APROBAR' || d === 'APROBADO' || d === 'AUTORIZAR' || d === 'AUTORIZADA') return 'APROBADO';
    if (d === 'OBSERVAR' || d === 'APROBAR_CON_OBS' || d === 'APROBADO_CON_OBS' || d === 'AUTORIZADA_CON_OBS') return 'APROBADO_CON_OBS';
    if (d === 'RECHAZAR' || d === 'RECHAZADO' || d === 'RECHAZADA') return 'RECHAZADO';
    return d;
  }

  _construirUrlsToken(token_uuid) {
    const { BASE_URL_WEB } = notificacionService.getBaseUrls();
    const isProd = process.env.APP_ENV === 'prod' || process.env.NODE_ENV === 'production';
    const prefixPath = isProd ? '/lg-gsp-prod' : '/lg-gsp-dev';
    const baseClean = BASE_URL_WEB.replace(/\/$/, '');
    const url_relativa = `${prefixPath}/aprobacion-gerencia/${token_uuid}`;
    const url_completa = `${baseClean}/aprobacion-gerencia/${token_uuid}`;
    const url_cotizacion = `${prefixPath}/api/aprobaciones-gerencia/public/${token_uuid}/cotizacion`;
    const url_cotizacion_completa = `${baseClean}/api/aprobaciones-gerencia/public/${token_uuid}/cotizacion`;
    const url_ot = `${prefixPath}/api/aprobaciones-gerencia/public/${token_uuid}/ot`;
    const url_ot_completa = `${baseClean}/api/aprobaciones-gerencia/public/${token_uuid}/ot`;
    return {
      url_aprobacion: url_relativa,
      url_relativa,
      url_completa,
      url_cotizacion,
      url_cotizacion_completa,
      url_ot,
      url_ot_completa
    };
  }

  /**
   * Crea un nuevo Web Token de 1 Solo Uso para Omar (anulando cualquier token PENDIENTE previo de la misma entidad).
   */
  async crearToken(data = {}, providedClient = null) {
    const client = providedClient || await this.pool.connect();
    const localTx = !providedClient;

    try {
      if (localTx) await client.query('BEGIN');

      const id_empresa = Number(data.id_empresa || 9);
      const tipo_entidad = String(data.tipo_entidad || 'NEGOCIO_COMERCIAL').trim().toUpperCase();
      if (!['NEGOCIO_COMERCIAL', 'REQUERIMIENTO_INTERNO', 'ORDEN_COMPRA'].includes(tipo_entidad)) {
        throw new Error(`tipo_entidad inválido: ${tipo_entidad}`);
      }

      const id_entidad_ref = Number(data.id_entidad_ref || data.id_proyecto || data.id_oc || 0);
      if (!id_entidad_ref || id_entidad_ref <= 0) {
        throw new Error('id_entidad_ref es requerido para generar el token de aprobación');
      }

      const folio_referencia = String(data.folio_referencia || data.folio || `REF-${id_entidad_ref}`).trim();
      const es_monetario = data.es_monetario !== undefined
        ? Boolean(data.es_monetario)
        : (tipo_entidad !== 'REQUERIMIENTO_INTERNO');
      const monto_neto_ref = Number(data.monto_neto_ref ?? data.monto_neto ?? 0);

      const rawVariables = data.resumen_variables || data.snapshot_variables_json || data.variables || {};
      const resumen_variables = typeof rawVariables === 'string'
        ? JSON.parse(rawVariables)
        : rawVariables;

      const id_usuario_solicita = data.id_usuario_solicita ? Number(data.id_usuario_solicita) : null;
      const nombre_solicita = data.nombre_solicita || 'Ejecutivo / Operaciones GSP';
      const id_usuario_aprueba = data.id_usuario_aprueba ? Number(data.id_usuario_aprueba) : 66;
      const nombre_aprueba = data.nombre_aprueba || 'Luis Omar Ghisellini Jara';

      // 1. Anular tokens pendientes anteriores para la misma entidad
      await client.query(`
        UPDATE tapr_gerencia_token
        SET estado_token = 'ANULADO',
            observacion_omar = COALESCE(observacion_omar, 'Reemplazado por nueva solicitud de visación')
        WHERE tipo_entidad = $1
          AND id_entidad_ref = $2
          AND estado_token = 'PENDIENTE'
      `, [tipo_entidad, id_entidad_ref]);

      // 2. Insertar nuevo token de 1 solo uso
      const insertQ = `
        INSERT INTO tapr_gerencia_token (
          id_empresa,
          tipo_entidad,
          id_entidad_ref,
          folio_referencia,
          es_monetario,
          monto_neto_ref,
          resumen_variables,
          estado_token,
          id_usuario_solicita,
          nombre_solicita,
          id_usuario_aprueba,
          nombre_aprueba,
          fecha_creacion,
          fecha_expiracion
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDIENTE', $8, $9, $10, $11, NOW(), NOW() + INTERVAL '72 hours')
        RETURNING *;
      `;

      const { rows } = await client.query(insertQ, [
        id_empresa,
        tipo_entidad,
        id_entidad_ref,
        folio_referencia,
        es_monetario,
        monto_neto_ref,
        JSON.stringify(resumen_variables),
        id_usuario_solicita,
        nombre_solicita,
        id_usuario_aprueba,
        nombre_aprueba
      ]);

      const tokenRow = rows[0];
      const urls = this._construirUrlsToken(tokenRow.token_uuid);

      if (localTx) await client.query('COMMIT');

      // 3. Despachar notificación omnicanal (Email + WhatsApp) a Omar (no bloqueante)
      let notificacionResultado = null;
      if (data.enviar_notificacion !== false) {
        try {
          notificacionResultado = await this._enviarNotificacionAprobador(tokenRow, urls);
        } catch (notifErr) {
          console.warn('[AprobacionGerenciaModel] Aviso: fallo no bloqueante al enviar notificación:', notifErr.message);
        }
      }

      return {
        ...tokenRow,
        token: tokenRow.token_uuid,
        url_aprobacion: urls.url_aprobacion,
        url_relativa: urls.url_relativa,
        url_completa: urls.url_completa,
        notificacion: notificacionResultado
      };
    } catch (error) {
      if (localTx) await client.query('ROLLBACK');
      throw error;
    } finally {
      if (localTx) client.release();
    }
  }

  async _enviarNotificacionAprobador(tokenRow, urls) {
    const isProd = process.env.APP_ENV === 'prod' || process.env.NODE_ENV === 'production' || process.env.DB_SCHEMA === 'sch_leangsp_prod';
    let destEmail = isProd ? 'omar.ghiselini@arriendosanpablo.cl' : 'sgajardoc@gmail.com';
    let destFono = isProd ? '+56994437725' : '+56936483259';
    let destNombre = tokenRow.nombre_aprueba || 'Luis Omar Ghisellini Jara';

    if (isProd) {
      try {
        const uRes = await this.pool.query(
          `SELECT id_user, name_frst, apellido_pat, email, movil
           FROM tsec_users
           WHERE LOWER(email) = 'omar.ghiselini@arriendosanpablo.cl'
              OR (id_user = $1 AND LOWER(email) LIKE '%ghiselini%')
           ORDER BY CASE WHEN LOWER(email) = 'omar.ghiselini@arriendosanpablo.cl' THEN 0 ELSE 1 END
           LIMIT 1`,
          [tokenRow.id_usuario_aprueba || 66]
        );
        if (uRes.rowCount > 0) {
          const u = uRes.rows[0];
          if (u.email) destEmail = u.email;
          if (u.movil) destFono = u.movil;
          const full = `${u.name_frst || ''} ${u.apellido_pat || ''}`.trim();
          if (full) destNombre = full;
        }
      } catch (_) {}
    }

    const empInfo = EMPRESAS_HOLDING[tokenRow.id_empresa] || EMPRESAS_HOLDING[9];
    const vars = tokenRow.resumen_variables || {};
    const fmtCLP = (v) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(Number(v || 0));

    let etiquetaTipo = 'NEGOCIO COMERCIAL';
    if (tokenRow.tipo_entidad === 'REQUERIMIENTO_INTERNO') etiquetaTipo = 'REQUERIMIENTO INTERNO (COSTO PROPIO)';
    else if (tokenRow.tipo_entidad === 'ORDEN_COMPRA') etiquetaTipo = 'ORDEN DE COMPRA';
    else if (!tokenRow.es_monetario) etiquetaTipo = 'NEGOCIO NO MONETARIO / ESPECIAL';

    const clienteOProveedor = vars.cliente_nombre || vars.razon_social_proveedor || 'Interno GSP';
    const ubicacionOGlosa = vars.ubicacion_obra || vars.glosa_general || vars.motivo_solicitud || '—';
    const esOrdenCompra = tokenRow.tipo_entidad === 'ORDEN_COMPRA';

    const equiposTexto = vars.equipos_asignados_texto ||
      (Array.isArray(vars.equipos_asignados) && vars.equipos_asignados.length
        ? vars.equipos_asignados.map(e => `${e.patente || ''} ${e.nombre_equipo || e.rol || ''}`.trim()).join(', ')
        : (vars.equipo_categoria || 'Por confirmar'));

    const personalTexto = vars.personal_asignado_texto ||
      (Array.isArray(vars.personal_asignado) && vars.personal_asignado.length
        ? vars.personal_asignado.map(p => `${p.nombre || ''} (${p.rol || 'Tripulante'})`.trim()).join(', ')
        : '');

    const linkCotizacion = vars.url_cotizacion_completa || urls.url_cotizacion_completa;
    const linkOt = vars.url_ot_completa || urls.url_ot_completa;

    const bloqueRecursosHtml = !esOrdenCompra ? `
        <p style="margin: 4px 0;"><strong>Equipo(s) Asignado(s):</strong> ${equiposTexto}</p>
        ${personalTexto ? `<p style="margin: 4px 0;"><strong>Personal Asignado:</strong> ${personalTexto}</p>` : ''}
    ` : '';

    const bloqueLinksDocumentosHtml = !esOrdenCompra ? `
      <div style="margin: 14px 0; padding: 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px;">
        <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: #1e3a8a; text-transform: uppercase;">📎 Acceso Directo a Documentos:</p>
        <p style="margin: 4px 0; font-size: 13px;">
          📄 <a href="${linkCotizacion}" target="_blank" style="color: #0284c7; font-weight: bold; text-decoration: underline;">Ver Cotización Comercial (PDF)</a>
        </p>
        <p style="margin: 4px 0; font-size: 13px;">
          🛠️ <a href="${linkOt}" target="_blank" style="color: #0284c7; font-weight: bold; text-decoration: underline;">Ver Orden de Trabajo / OT Asignada (PDF)</a>
        </p>
      </div>
    ` : '';

    const asunto = `Solicitud V°B° Gerencia [${tokenRow.folio_referencia}] — ${clienteOProveedor}`;
    const contenidoHtml = `
      <p>Se informa la confirmación de asignación de recursos para el siguiente requerimiento y se adjunta enlace rápido (de <strong>1 solo uso</strong>, sin clave) para su pronunciamiento ejecutivo:</p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Clasificación:</strong> ${etiquetaTipo}</p>
        <p style="margin: 4px 0;"><strong>Folio:</strong> <span style="color: #0284c7; font-weight: bold;">${tokenRow.folio_referencia}</span></p>
        <p style="margin: 4px 0;"><strong>Razón Social:</strong> ${empInfo.corto}</p>
        <p style="margin: 4px 0;"><strong>Cliente / Proveedor:</strong> ${clienteOProveedor}</p>
        <p style="margin: 4px 0;"><strong>Obra / Detalle:</strong> ${ubicacionOGlosa}</p>
        ${bloqueRecursosHtml}
        <p style="margin: 4px 0;"><strong>Monto Neto:</strong> <strong>${tokenRow.es_monetario ? fmtCLP(tokenRow.monto_neto_ref) : 'NO FACTURABLE ($0)'}</strong></p>
        <p style="margin: 4px 0;"><strong>Confirmado por:</strong> ${tokenRow.nombre_solicita || 'Operaciones'}</p>
      </div>
      ${bloqueLinksDocumentosHtml}
      <p style="font-size: 13px; color: #475569;">Presione el botón inferior desde su teléfono para <strong>Aprobar</strong>, <strong>Aprobar con Observación</strong> o <strong>Rechazar</strong> en 1 toque:</p>
    `;

    const lineasRecursosWsp = !esOrdenCompra
      ? (`🚜 *Equipo(s):* ${equiposTexto}\n` + (personalTexto ? `👷 *Personal:* ${personalTexto}\n` : ''))
      : '';

    const lineasLinksWsp = !esOrdenCompra
      ? (`\n📄 *Ver Cotización:*\n${linkCotizacion}\n\n🛠️ *Ver Orden de Trabajo (OT):*\n${linkOt}\n`)
      : '';

    const mensajeWsp =
      `📱 *[GSP] Asignación OT & V°B° Gerencia (1 Toque)*\n\n` +
      `Hola ${destNombre}, se ha confirmado la asignación de recursos para el siguiente requerimiento:\n\n` +
      `🏷️ *Tipo:* ${etiquetaTipo}\n` +
      `📋 *Folio:* ${tokenRow.folio_referencia}\n` +
      `🏢 *Empresa:* ${empInfo.corto}\n` +
      `🤝 *Contraparte:* ${clienteOProveedor}\n` +
      `📍 *Detalle:* ${ubicacionOGlosa}\n` +
      lineasRecursosWsp +
      `💰 *Monto Neto:* ${tokenRow.es_monetario ? fmtCLP(tokenRow.monto_neto_ref) : 'NO FACTURABLE ($0)'}\n` +
      `👤 *Confirmado por:* ${tokenRow.nombre_solicita || 'Operaciones'}\n` +
      lineasLinksWsp + `\n` +
      `👉 *Aprobar, Observar o Rechazar (1 Toque):*\n${urls.url_completa}`;

    return await notificacionService.despacharNotificacion({
      evento: 'SOLICITUD_VB_GERENCIA_TOKEN',
      canales: ['EMAIL', 'WHATSAPP'],
      destinatario: {
        nombre: destNombre,
        email: destEmail,
        telefono: destFono
      },
      deepLink: {
        tipoApp: 'PUBLIC',
        ruta: `/aprobacion-gerencia/${tokenRow.token_uuid}`
      },
      emailData: {
        asunto,
        titulo: `Autorización Ejecutiva — ${tokenRow.folio_referencia}`,
        subtitulo: `${empInfo.corto} · ${etiquetaTipo}`,
        contenido: contenidoHtml,
        botonTexto: 'REVISAR Y RESOLVER EN 1 TOQUE'
      },
      wspData: {
        mensaje: mensajeWsp
      }
    });
  }

  /**
   * Obtiene el detalle completo de un token por su UUID para la vista pública móvil.
   */
  async obtenerPorToken(token_uuid) {
    if (!token_uuid || !UUID_REGEX.test(String(token_uuid).trim())) {
      return null;
    }

    const q = `
      SELECT 
        t.*,
        emp.razon_social AS empresa_razon_social,
        emp.rut_empresa AS empresa_rut
      FROM tapr_gerencia_token t
      LEFT JOIN tpar_empresas emp ON t.id_empresa = emp.id_empresa
      WHERE t.token_uuid = $1
      LIMIT 1;
    `;
    const { rows } = await this.pool.query(q, [String(token_uuid).trim()]);
    if (rows.length === 0) return null;

    const tokenRow = rows[0];
    const empFallback = EMPRESAS_HOLDING[tokenRow.id_empresa] || EMPRESAS_HOLDING[9];
    const urls = this._construirUrlsToken(tokenRow.token_uuid);

    let entidadDetalle = null;
    try {
      if (tokenRow.tipo_entidad === 'NEGOCIO_COMERCIAL' || tokenRow.tipo_entidad === 'REQUERIMIENTO_INTERNO') {
        const pryRes = await this.pool.query(`
          SELECT 
            p.id_proyecto, p.codi_proyecto, p.nombre_proyecto, p.id_empresa, p.id_empresa_cliente,
            p.id_proyecto_estado, p.es_interno, p.tipo_movimiento_interno, p.sucursal_origen,
            p.sucursal_destino, p.estado_vb_gerencia, p.observacion_vb_gerencia, p.fecha_vb_gerencia,
            p.fecha_plan_ini, p.fecha_plan_fin, p.objetivo_proyecto, p.observacion_proyecto, p.json_field,
            cli.razon_social AS nombre_cliente, cli.rut_empresa AS rut_cliente
          FROM tpry_proyecto p
          LEFT JOIN tpar_empresas cli ON p.id_empresa_cliente = cli.id_empresa
          WHERE p.id_proyecto = $1
          LIMIT 1;
        `, [tokenRow.id_entidad_ref]);
        entidadDetalle = pryRes.rows[0] || null;
      } else if (tokenRow.tipo_entidad === 'ORDEN_COMPRA') {
        const ocRes = await this.pool.query(`
          SELECT oc.*, pry.codi_proyecto, pry.nombre_proyecto
          FROM tcmp_orden_compra oc
          LEFT JOIN tpry_proyecto pry ON oc.id_proyecto = pry.id_proyecto
          WHERE oc.id_oc = $1
          LIMIT 1;
        `, [tokenRow.id_entidad_ref]);
        if (ocRes.rows[0]) {
          const lineasRes = await this.pool.query(`
            SELECT * FROM tcmp_orden_compra_linea
            WHERE id_oc = $1
            ORDER BY numero_item ASC, id_oc_linea ASC;
          `, [tokenRow.id_entidad_ref]);
          entidadDetalle = {
            ...ocRes.rows[0],
            lineas: lineasRes.rows
          };
        }
      }
    } catch (errEnrich) {
      console.warn('[AprobacionGerenciaModel] Aviso enriqueciendo entidad:', errEnrich.message);
    }

    const ahora = new Date();
    const expirado = tokenRow.estado_token === 'PENDIENTE' && tokenRow.fecha_expiracion && new Date(tokenRow.fecha_expiracion) < ahora;
    const ya_utilizado = tokenRow.estado_token !== 'PENDIENTE';

    return {
      ...tokenRow,
      empresa_emisora_nombre: tokenRow.empresa_razon_social || empFallback.nombre,
      empresa_emisora_corto: empFallback.corto,
      empresa_emisora_rut: tokenRow.empresa_rut || empFallback.rut,
      ya_utilizado,
      expirado,
      url_aprobacion: urls.url_aprobacion,
      url_completa: urls.url_completa,
      url_cotizacion: urls.url_cotizacion,
      url_cotizacion_completa: urls.url_cotizacion_completa,
      url_ot: urls.url_ot,
      url_ot_completa: urls.url_ot_completa,
      entidad_detalle: entidadDetalle
    };
  }

  /**
   * Resuelve el Web Token de 1 Solo Uso y sincroniza el estado en tpry_proyecto o tcmp_orden_compra.
   */
  async resolverToken(token_uuid, decisionRaw, observacion = '', meta = {}) {
    if (!token_uuid || !UUID_REGEX.test(String(token_uuid).trim())) {
      const err = new Error('Formato de token inválido');
      err.status = 400;
      throw err;
    }

    const decision = this._normalizarDecision(decisionRaw);
    if (!['APROBADO', 'APROBADO_CON_OBS', 'RECHAZADO'].includes(decision)) {
      const err = new Error(`Decisión inválida (${decisionRaw}). Use APROBADO, APROBADO_CON_OBS o RECHAZADO.`);
      err.status = 400;
      throw err;
    }

    const obsClean = String(observacion || '').trim();
    if (decision === 'RECHAZADO' && !obsClean) {
      const err = new Error('Debe ingresar una observación o motivo para rechazar la solicitud.');
      err.status = 400;
      throw err;
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const lockRes = await client.query(`
        SELECT * FROM tapr_gerencia_token
        WHERE token_uuid = $1
        FOR UPDATE;
      `, [String(token_uuid).trim()]);

      if (lockRes.rowCount === 0) {
        const err = new Error('Token de aprobación no encontrado.');
        err.status = 404;
        throw err;
      }

      const tokenRow = lockRes.rows[0];

      // Regla estricta de 1 solo uso
      if (tokenRow.estado_token !== 'PENDIENTE') {
        const err = new Error(`Este enlace de 1 solo uso ya fue utilizado previamente (Estado: ${tokenRow.estado_token}).`);
        err.status = 409;
        err.code = 'TOKEN_ALREADY_USED';
        err.ya_utilizado = true;
        err.token = tokenRow;
        throw err;
      }

      if (tokenRow.fecha_expiracion && new Date(tokenRow.fecha_expiracion) < new Date()) {
        const err = new Error('El enlace de aprobación ha expirado (vigencia máxima de 72 horas).');
        err.status = 410;
        err.code = 'TOKEN_EXPIRED';
        err.expirado = true;
        throw err;
      }

      const ipResolucion = meta.ip || 'IP_NO_REGISTRADA';
      const userAgent = meta.user_agent || meta.userAgent || 'MOBILE_BROWSER';
      const timestampIso = new Date().toISOString();

      const firma_hash_fes = crypto
        .createHash('sha256')
        .update(`${tokenRow.token_uuid}|${decision}|${obsClean}|${timestampIso}|${ipResolucion}`)
        .digest('hex');

      const updTokenRes = await client.query(`
        UPDATE tapr_gerencia_token
        SET estado_token = $1,
            observacion_omar = $2,
            fecha_resolucion = NOW(),
            ip_resolucion = $3,
            user_agent = $4,
            firma_hash_fes = $5,
            id_usuario_aprueba = COALESCE($6, id_usuario_aprueba, 66),
            nombre_aprueba = COALESCE($7, nombre_aprueba, 'Luis Omar Ghisellini Jara')
        WHERE id_token = $8
        RETURNING *;
      `, [
        decision,
        obsClean || null,
        ipResolucion,
        userAgent,
        firma_hash_fes,
        meta.id_usuario_aprueba || null,
        meta.nombre_aprueba || null,
        tokenRow.id_token
      ]);

      const updatedToken = updTokenRes.rows[0];
      let entidadActualizada = null;

      // Sincronizar con la entidad origen
      if (tokenRow.tipo_entidad === 'NEGOCIO_COMERCIAL' || tokenRow.tipo_entidad === 'REQUERIMIENTO_INTERNO') {
        const pryCheck = await client.query(`
          SELECT id_proyecto, json_field
          FROM tpry_proyecto
          WHERE id_proyecto = $1
          FOR UPDATE;
        `, [tokenRow.id_entidad_ref]);

        if (pryCheck.rowCount > 0) {
          let jf = pryCheck.rows[0].json_field;
          if (typeof jf === 'string') {
            try { jf = JSON.parse(jf); } catch (_) { jf = {}; }
          }
          if (!jf || typeof jf !== 'object') jf = {};
          if (!jf.crm_v1 || typeof jf.crm_v1 !== 'object') jf.crm_v1 = {};

          jf.crm_v1.aprobacion_gerencia = {
            id_token: updatedToken.id_token,
            token_uuid: updatedToken.token_uuid,
            estado: decision,
            observacion: obsClean || null,
            fecha_resolucion: updatedToken.fecha_resolucion,
            aprobado_por: updatedToken.nombre_aprueba,
            firma_hash_fes: updatedToken.firma_hash_fes
          };

          const pryUpd = await client.query(`
            UPDATE tpry_proyecto
            SET estado_vb_gerencia = $1,
                observacion_vb_gerencia = $2,
                fecha_vb_gerencia = NOW(),
                json_field = $3,
                fecha_modificacion = NOW()
            WHERE id_proyecto = $4
            RETURNING *;
          `, [
            decision,
            obsClean || null,
            jf,
            tokenRow.id_entidad_ref
          ]);
          entidadActualizada = pryUpd.rows[0];
        }
      } else if (tokenRow.tipo_entidad === 'ORDEN_COMPRA') {
        const nuevoEstadoOc = decision === 'RECHAZADO'
          ? 'RECHAZADA'
          : (decision === 'APROBADO_CON_OBS' ? 'AUTORIZADA_CON_OBS' : 'AUTORIZADA');

        const ocUpd = await client.query(`
          UPDATE tcmp_orden_compra
          SET estado_oc = $1,
              observacion_gerencia = $2,
              fecha_autorizacion_gerencia = NOW(),
              updated_at = NOW()
          WHERE id_oc = $3
          RETURNING *;
        `, [
          nuevoEstadoOc,
          obsClean || null,
          tokenRow.id_entidad_ref
        ]);
        entidadActualizada = ocUpd.rows[0] || null;
      }

      await client.query('COMMIT');

      return {
        success: true,
        decision,
        token: updatedToken,
        entidad_actualizada: entidadActualizada
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Lista tokens de aprobación de gerencia para bandejas y seguimiento.
   */
  async listarTokens(filtros = {}) {
    const conditions = [];
    const values = [];

    if (filtros.id_empresa && filtros.id_empresa !== 'all' && filtros.id_empresa !== '0') {
      values.push(Number(filtros.id_empresa));
      conditions.push(`t.id_empresa = $${values.length}`);
    }
    if (filtros.estado_token) {
      values.push(String(filtros.estado_token).trim().toUpperCase());
      conditions.push(`t.estado_token = $${values.length}`);
    }
    if (filtros.tipo_entidad) {
      values.push(String(filtros.tipo_entidad).trim().toUpperCase());
      conditions.push(`t.tipo_entidad = $${values.length}`);
    }
    if (filtros.id_entidad_ref) {
      values.push(Number(filtros.id_entidad_ref));
      conditions.push(`t.id_entidad_ref = $${values.length}`);
    }

    let query = `
      SELECT 
        t.*,
        emp.razon_social AS empresa_razon_social
      FROM tapr_gerencia_token t
      LEFT JOIN tpar_empresas emp ON t.id_empresa = emp.id_empresa
    `;
    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }
    query += ` ORDER BY t.fecha_creacion DESC LIMIT 200;`;

    const { rows } = await this.pool.query(query, values);
    return rows.map((r) => {
      const urls = this._construirUrlsToken(r.token_uuid);
      return {
        ...r,
        url_aprobacion: urls.url_aprobacion,
        url_completa: urls.url_completa
      };
    });
  }
}

// Exportar la clase con métodos estáticos enlazados a una instancia por defecto
// para máxima compatibilidad (tanto `new AprobacionGerenciaModel()` como `aprobacionGerenciaModel.crearToken(...)`)
const defaultInstance = new AprobacionGerenciaModel();
Object.getOwnPropertyNames(AprobacionGerenciaModel.prototype).forEach((methodName) => {
  if (methodName !== 'constructor' && typeof defaultInstance[methodName] === 'function') {
    AprobacionGerenciaModel[methodName] = defaultInstance[methodName].bind(defaultInstance);
  }
});

// Alias adicionales de conveniencia
AprobacionGerenciaModel.generarToken = defaultInstance.crearToken.bind(defaultInstance);
AprobacionGerenciaModel.prototype.generarToken = AprobacionGerenciaModel.prototype.crearToken;
AprobacionGerenciaModel.getByToken = defaultInstance.obtenerPorToken.bind(defaultInstance);
AprobacionGerenciaModel.prototype.getByToken = AprobacionGerenciaModel.prototype.obtenerPorToken;

module.exports = AprobacionGerenciaModel;
