const http = require('http');
const https = require('https');
const MessageModel = require('../models/messageModel');
const pool = require('../config/postgresPool');
const { config } = require('../config/config');

const SCHEMA = config.dbSchema || 'sch_leangsp';
const messageModel = new MessageModel();

/**
 * notificacionService.js
 * Servicio Canónico de Notificaciones Omnicanal (Email + WhatsApp) con Deep Linking Contextual.
 * Gobernado por:
 *  - SKILL: leanglobal_notification_standard
 *  - SPEC: .agents/specs/52_notificaciones_omnichannel_deep_linking_spec.md
 */

function esAmbienteProduccion() {
  return process.env.APP_ENV === 'prod' || process.env.NODE_ENV === 'production' || SCHEMA === 'sch_leangsp_prod';
}

// 1. Resolución Canónica de URLs por Entorno (Zero Hardcoding)
function getBaseUrls() {
  const isProd = esAmbienteProduccion();
  return {
    BASE_URL_WEB: process.env.TENANT_BASE_URL_WEB || (isProd 
      ? 'https://servidor.leanglobal.cl/lg-gsp-prod' 
      : 'https://servidor.leanglobal.cl/lg-gsp-dev'),
    BASE_URL_PWA: process.env.TENANT_BASE_URL_PWA || (isProd 
      ? 'https://servidor.leanglobal.cl/pwa-gsp-prod' 
      : 'https://servidor.leanglobal.cl/pwa-gsp-dev')
  };
}

// 2. Normalización Telefónica Estándar (E.164)
function normalizarTelefono(numero, pais = 'CL') {
  if (!numero) return null;
  let clean = String(numero).replace(/\D/g, '');
  
  if (pais === 'CL') {
    // 9 dígitos comenzando con 9 (ej: 936483259 -> 56936483259)
    if (clean.length === 9 && clean.startsWith('9')) {
      return '56' + clean;
    }
    // 11 dígitos con prefijo 569 (ej: 56936483259)
    if (clean.length === 11 && clean.startsWith('569')) {
      return clean;
    }
    // 8 dígitos (ej: 36483259 -> 56936483259)
    if (clean.length === 8) {
      return '569' + clean;
    }
  }
  return clean.length >= 8 ? clean : null;
}

// Helper genérico para peticiones HTTP y HTTPS
function _enviarSolicitudHttp(urlDestino, payloadObj, timeoutMs = 7000) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(urlDestino);
      const isHttps = u.protocol === 'https:';
      const lib = isHttps ? https : http;
      const postData = JSON.stringify(payloadObj);

      const options = {
        hostname: u.hostname,
        port: u.port || (isHttps ? 443 : 80),
        path: u.pathname + (u.search || ''),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: timeoutMs
      };

      const req = lib.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ statusCode: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, data: parsed });
          } catch (_) {
            resolve({ statusCode: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, raw: data });
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Timeout (${timeoutMs}ms) conectando a ${urlDestino}`));
      });

      req.write(postData);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

// 3. Despacho HTTP/HTTPS hacia Microservicio Baileys con Fallback Resiliente
async function despacharWhatsAppHttp({ telefono, mensaje }) {
  const telefonoSanitizado = normalizarTelefono(telefono);
  if (!telefonoSanitizado) {
    console.warn(`[NOTIF-WSP] Número telefónico inválido o vacío: ${telefono}`);
    return { success: false, error: 'NUMERO_INVALIDO' };
  }

  const payload = {
    numero: telefonoSanitizado,
    mensaje: mensaje
  };

  const listaEndpoints = [];
  if (process.env.WHATSAPP_URL) {
    listaEndpoints.push(process.env.WHATSAPP_URL);
  }
  // Endpoint local (por si estamos en servidor remoto con puerto 3085 activo)
  listaEndpoints.push('http://127.0.0.1:3085/enviar');
  // Endpoint HTTPS canónico en servidor.leanglobal.cl (para desarrollo local o fallback resiliente)
  const isProd = esAmbienteProduccion();
  listaEndpoints.push(isProd 
    ? 'https://servidor.leanglobal.cl/lg-gsp-prod/whatsapp/enviar' 
    : 'https://servidor.leanglobal.cl/lg-gsp-dev/whatsapp/enviar');

  let ultimoError = null;
  for (const ep of listaEndpoints) {
    try {
      const res = await _enviarSolicitudHttp(ep, payload, 7000);
      if (res.ok && res.data && res.data.ok) {
        console.log(`[NOTIF-WSP] Despacho exitoso a ${telefonoSanitizado} vía ${ep}`);
        return { success: true, data: res.data };
      } else if (res.data && res.data.error) {
        console.warn(`[NOTIF-WSP] Servicio respondió error en ${ep}:`, res.data.error);
        return { success: false, error: res.data.error };
      }
    } catch (err) {
      ultimoError = err.message;
      console.warn(`[NOTIF-WSP] Intento fallido a ${ep}: ${err.message}. Probando fallback si aplica...`);
    }
  }

  return { success: false, error: ultimoError || 'No se pudo contactar el servicio de WhatsApp' };
}

// 4. Despacho SMTP Transaccional (MessageModel)
async function despacharEmailSmtp({ para, cc, asunto, titulo, subtitulo, contenido, botonTexto, botonUrl }) {
  try {
    const paraStr = Array.isArray(para) ? para.filter(Boolean).join(', ') : String(para || '').trim();
    const ccStr = Array.isArray(cc) ? cc.filter(Boolean).join(', ') : (cc ? String(cc).trim() : undefined);
    if (!paraStr || !paraStr.includes('@')) {
      console.warn(`[NOTIF-MAIL] Dirección de correo inválida: ${paraStr}`);
      return { success: false, error: 'EMAIL_INVALIDO' };
    }

    const html = messageModel.obtenerPlantillaHTML({
      titulo,
      subtitulo,
      contenido,
      botonTexto,
      botonUrl
    });

    const res = await messageModel.enviarYRegistrarCorreo({
      para: paraStr,
      cc: ccStr || undefined,
      asunto,
      cuerpo: html,
      esHtml: true
    });

    console.log(`[NOTIF-MAIL] Correo enviado a ${paraStr}${ccStr ? ` (CC: ${ccStr})` : ''} con asunto: "${asunto}"`);
    return { success: true, res };
  } catch (error) {
    console.error(`[NOTIF-MAIL] Fallo en envío SMTP a ${para}:`, error.message);
    return { success: false, error: error.message };
  }
}

// 5. Generador Canónico de Deep Links
function construirDeepLink(opts = {}) {
  const { tipoApp = 'WEB', ruta = '', params = {} } = opts || {};
  const safeRoute = typeof ruta === 'string' ? ruta : '';
  const { BASE_URL_WEB, BASE_URL_PWA } = getBaseUrls();
  const queryStr = Object.entries(params || {})
    .filter(([_, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const queryPart = queryStr ? `?${queryStr}` : '';

  if (tipoApp === 'PWA') {
    // Hash Routing PWA: {BASE_URL_PWA}/#/{ruta}?{params}
    const cleanRoute = safeRoute.startsWith('/') ? safeRoute.substring(1) : safeRoute;
    return `${BASE_URL_PWA}/#/${cleanRoute}${queryPart}`;
  }

  if (tipoApp === 'PUBLIC') {
    // Rutas públicas tokenizadas web: {BASE_URL_WEB}/{ruta}/{token}
    const cleanRoute = safeRoute.startsWith('/') ? safeRoute : `/${safeRoute}`;
    return `${BASE_URL_WEB}${cleanRoute}${queryPart}`;
  }

  // Web Privada de Gestión: {BASE_URL_WEB}/{ruta}?{params}
  const cleanRoute = safeRoute.startsWith('/') ? safeRoute : `/${safeRoute}`;
  return `${BASE_URL_WEB}${cleanRoute}${queryPart}`;
}

// 6. Registro de Auditoría Transaccional
async function registrarLogAuditoria({ evento, canal, destinatario, payload, resultado }) {
  try {
    // Intento de persistir en log si existe la tabla; en caso contrario, registrar en consola
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${SCHEMA}.tnot_notification_log (
        id_log SERIAL PRIMARY KEY,
        evento VARCHAR(80) NOT NULL,
        canal VARCHAR(20) NOT NULL,
        destinatario VARCHAR(150),
        payload JSONB,
        resultado JSONB,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      INSERT INTO ${SCHEMA}.tnot_notification_log (evento, canal, destinatario, payload, resultado)
      VALUES ($1, $2, $3, $4, $5);
    `, [
      evento,
      canal,
      destinatario,
      JSON.stringify(payload || {}),
      JSON.stringify(resultado || {})
    ]);
  } catch (errLog) {
    // No romper el flujo principal si la tabla de log falla
    console.warn(`[NOTIF-AUDIT] Aviso: No se pudo guardar log en BD:`, errLog.message);
  }
}

/**
 * 7. Motor Unificado de Despacho Omnicanal
 * @param {Object} opts
 * @param {string} opts.evento - Código de evento canónico (ej: 'ASIGNACION_VISITA_TECNICA')
 * @param {Array<string>} opts.canales - ['EMAIL', 'WHATSAPP']
 * @param {Object} opts.destinatario - { nombre, email, telefono }
 * @param {Object} opts.deepLink - { tipoApp: 'PWA'|'WEB'|'PUBLIC', ruta: string, params: Object }
 * @param {Object} opts.emailData - { asunto, titulo, subtitulo, contenido, botonTexto }
 * @param {Object} opts.wspData - { mensaje } (si se omite, se genera a partir de emailData y deepLink)
 */
async function despacharNotificacion(opts = {}) {
  const evento = opts.evento || opts.eventoId || 'NOTIFICACION_SISTEMA';
  const canales = opts.canales || (opts.canal ? [opts.canal] : ['EMAIL']);
  const destinatario = opts.destinatario || opts.destinatarios || {};
  const deepLink = opts.deepLink || (opts.payload && opts.payload.deepLink) || {};
  const emailData = opts.emailData || (opts.payload && opts.payload.emailData) || {};
  const wspData = opts.wspData || (opts.payload && opts.payload.wspData) || {};

  const isProd = esAmbienteProduccion();
  const urlFinal = construirDeepLink(deepLink);
  const resultados = {};

  const nombreDest = destinatario.nombre || 'Colaborador';
  const emailDest = destinatario.email;
  const telDest = destinatario.telefono || destinatario.fono || destinatario.movil;

  // Canal EMAIL
  if (canales.includes('EMAIL') && emailDest) {
    const asuntoBase = emailData.asunto || `[GSP] Notificación: ${evento}`;
    const asuntoFinal = isProd ? asuntoBase : `🟡 [DEV / PRUEBAS] ${asuntoBase}`;
    const subtituloBase = emailData.subtitulo || `Hola ${nombreDest}, tienes una nueva tarea en el sistema.`;
    const subtituloFinal = isProd ? subtituloBase : `⚠️ [SIMULACIÓN DEV] ${subtituloBase}`;

    const resMail = await despacharEmailSmtp({
      para: emailDest,
      asunto: asuntoFinal,
      titulo: emailData.titulo || `Notificación Operacional`,
      subtitulo: subtituloFinal,
      contenido: emailData.contenido || '',
      botonTexto: emailData.botonTexto || 'ACCEDER AL SISTEMA',
      botonUrl: urlFinal
    });
    resultados.email = resMail;
    await registrarLogAuditoria({
      evento,
      canal: 'EMAIL',
      destinatario: emailDest,
      payload: { ...emailData, asuntoFinal, urlFinal },
      resultado: resMail
    });
  }

  // Canal WHATSAPP
  if (canales.includes('WHATSAPP') && telDest) {
    let mensajeWsp = wspData.mensaje;
    if (!mensajeWsp) {
      const prefijoAmbiente = isProd 
        ? '' 
        : '🟡 *[SIMULACIÓN DEV / PRUEBAS]*\n_Este mensaje es una prueba de desarrollo. No corresponde a una faena real._\n\n';
      mensajeWsp = `${prefijoAmbiente}🔔 *Grúas San Pablo — Notificación*\n\nHola ${nombreDest}, se ha generado una nueva acción que requiere tu gestión:\n\n📌 *Asunto:* ${emailData.asunto || evento}\n\n📲 *Accede directamente aquí:*\n${urlFinal}`;
    } else {
      if (!isProd && !mensajeWsp.includes('[DEV') && !mensajeWsp.includes('PRUEBA')) {
        mensajeWsp = `🟡 *[SIMULACIÓN DEV / PRUEBAS]*\n\n${mensajeWsp}`;
      }
      // Si el mensaje viene con template personalizado pero sin url, anexar urlFinal
      if (!mensajeWsp.includes(urlFinal)) {
        mensajeWsp += `\n\n📲 *Acceso directo:*\n${urlFinal}`;
      }
    }

    const resWsp = await despacharWhatsAppHttp({
      telefono: telDest,
      mensaje: mensajeWsp
    });
    resultados.whatsapp = resWsp;
    await registrarLogAuditoria({
      evento,
      canal: 'WHATSAPP',
      destinatario: telDest,
      payload: { mensaje: mensajeWsp, urlFinal },
      resultado: resWsp
    });
  }

  return {
    success: true,
    urlGenerada: urlFinal,
    resultados
  };
}

module.exports = {
  getBaseUrls,
  normalizarTelefono,
  construirDeepLink,
  despacharWhatsAppHttp,
  despacharEmailSmtp,
  despacharNotificacion
};
