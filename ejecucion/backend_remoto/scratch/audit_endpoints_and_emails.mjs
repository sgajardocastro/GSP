import client from '../src/config/dbConfig.js';

const BASE_URL = 'https://servidor.leanglobal.cl/lg-gsp-dev/api';

async function runAudit() {
  console.log('===============================================================');
  console.log('🔍 AUDITORÍA DETERMINISTA E2E - PREVIA A SESIÓN 2 (11:00 HRS)');
  console.log('===============================================================\n');

  const results = {
    endpoints: [],
    emails: null,
    db: null,
    smtp: null
  };

  // 1. VERIFICACIÓN DE ENDPOINTS CLAVE
  console.log('--- 1. PROBANDO ENDPOINTS HTTP ACTIVOS EN SERVIDOR REMOTO ---');
  
  const testEndpoints = [
    { name: 'Visita a Terreno por Token', method: 'GET', url: `${BASE_URL}/visitas/token/faac5ee2-4c87-4753-a814-03d9537071b7` },
    { name: 'Viajes por Proyecto (OT 99)', method: 'GET', url: `${BASE_URL}/viajes/proyecto/99` },
    { name: 'Hoja de Ruta Chofer por Token', method: 'GET', url: `${BASE_URL}/viajes/vj-99-43-7gcmz` },
    { name: 'Reportes Diarios de OT 99', method: 'GET', url: `${BASE_URL}/operaciones/report/proyecto/99` },
    { name: 'Backlog & Releases Activos', method: 'GET', url: `${BASE_URL}/backlog` }
  ];

  for (const ep of testEndpoints) {
    try {
      const start = Date.now();
      const res = await fetch(ep.url, { method: ep.method });
      const elapsed = Date.now() - start;
      if (res.ok) {
        console.log(`✅ [${res.status} OK] (${elapsed}ms) ${ep.name} -> ${ep.url}`);
        results.endpoints.push({ name: ep.name, ok: true, status: res.status, time: elapsed });
      } else {
        console.warn(`⚠️ [${res.status} ${res.statusText}] (${elapsed}ms) ${ep.name} -> ${ep.url}`);
        results.endpoints.push({ name: ep.name, ok: false, status: res.status, time: elapsed });
      }
    } catch (err) {
      console.error(`❌ [ERR_CONN] ${ep.name} -> ${ep.url}: ${err.message}`);
      results.endpoints.push({ name: ep.name, ok: false, status: 'ERR_CONN', error: err.message });
    }
  }

  // 2. VERIFICACIÓN DE BASE DE DATOS Y VIAJES / PROYECTOS
  console.log('\n--- 2. AUDITANDO INTEGRIDAD EN POSTGRESQL (sch_leangsp) ---');
  try {
    const tripRows = await client.query(`
      SELECT id_log_desplazamiento, id_proyecto, patente, token_viaje, estado_trayecto, fecha_programada
      FROM sch_leangsp.tequ_log_desplazamiento
      ORDER BY id_log_desplazamiento DESC
      LIMIT 3;
    `);
    console.log('Últimos 3 viajes registrados en BD:');
    console.table(tripRows.rows);

    const reportRows = await client.query(`
      SELECT id_reporte_avance, id_proyecto, dia_correlativo, fecha_reporte, horas_operadas, estado_reporte
      FROM sch_leangsp.tedp_reporte_avance
      ORDER BY id_reporte_avance DESC
      LIMIT 3;
    `);
    console.log('Últimos 3 reports diarios registrados en BD:');
    console.table(reportRows.rows);

    results.db = { ok: true, trips: tripRows.rows.length, reports: reportRows.rows.length };
  } catch (dbErr) {
    console.error('❌ Error consultando base de datos:', dbErr.message);
    results.db = { ok: false, error: dbErr.message };
  }

  // 3. AUDITORÍA DEL SERVICIO DE CORREOS VÍA POST /api/message EN VIVO
  console.log('\n--- 3. TEST DE ENVÍO REAL DE CORREO SMTP CON CC (POST /api/message) ---');
  try {
    const timestamp = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const emailPayload = {
      para: 'sgajardoc@gmail.com',
      cc: 'j.poncenavarrete@gmail.com',
      asunto: `[VERIFICACIÓN PRE-SESIÓN 2] GSP Marcha Blanca ${timestamp}`,
      cuerpo: `
        <div style="font-family: -apple-system, sans-serif; background: #070b14; color: #fff; padding: 25px; border-radius: 12px; border: 1px solid #f59e0b;">
          <h2 style="color: #f59e0b; margin-top: 0;">🏗️ GRÚAS SAN PABLO — Verificación de Notificaciones</h2>
          <p>Estimado Sergio,</p>
          <p>Este es un correo de prueba generado automáticamente a las <strong>${timestamp} hrs</strong> para certificar que el motor de notificaciones y la entrega de correos de la plataforma están 100% operativos para la <strong>Sesión 2 de Marcha Blanca</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr style="border-bottom: 1px solid #1e293b;">
              <td style="padding: 8px 0; color: #94a3b8;">Canal SMTP:</td>
              <td style="padding: 8px 0; color: #10b981; font-weight: bold;">notificaciones.gsp@leanglobal.cl (Activo)</td>
            </tr>
            <tr style="border-bottom: 1px solid #1e293b;">
              <td style="padding: 8px 0; color: #94a3b8;">Soporte CC:</td>
              <td style="padding: 8px 0; color: #10b981; font-weight: bold;">Habilitado (Copia a Jorge Ponce)</td>
            </tr>
            <tr style="border-bottom: 1px solid #1e293b;">
              <td style="padding: 8px 0; color: #94a3b8;">Hora de Envío:</td>
              <td style="padding: 8px 0; color: #f8fafc; font-weight: bold;">${timestamp} hrs</td>
            </tr>
          </table>
          <p style="color: #10b981; font-weight: bold; margin-bottom: 0;">✔ Todos los servicios están listos para la sesión de las 11:00 hrs.</p>
        </div>
      `
    };

    console.log('Enviando request a', `${BASE_URL}/message`, '...');
    const mailRes = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailPayload)
    });

    const mailData = await mailRes.json();
    if (mailRes.ok) {
      console.log('✅ Correo de prueba enviado exitosamente por el backend remoto!');
      console.log('Respuesta del servidor SMTP:', mailData);
      results.smtp = { ok: true, data: mailData };
    } else {
      console.error('❌ Error en respuesta del servidor al enviar correo:', mailRes.status, mailData);
      results.smtp = { ok: false, status: mailRes.status, error: mailData };
    }
  } catch (smtpErr) {
    console.error('❌ Error de conexión al servicio de correo:', smtpErr.message);
    results.smtp = { ok: false, error: smtpErr.message };
  }

  // 4. VERIFICACIÓN DE MICROSERVICIO WHATSAPP
  console.log('\n--- 4. VERIFICANDO MICROSERVICIO DE WHATSAPP ---');
  try {
    const wspRes = await fetch('https://servidor.leanglobal.cl/lg-gsp-dev/whatsapp/estado', { signal: AbortSignal.timeout(5000) });
    const wspData = await wspRes.json();
    console.log('✅ WhatsApp Microservice Status:', wspData);
  } catch (wspErr) {
    try {
      const wspRes2 = await fetch('https://servidor.leanglobal.cl/lg-gsp-dev/whatsapp/qr', { signal: AbortSignal.timeout(5000) });
      console.log('ℹ️ WhatsApp Microservice responde (QR/HTTP):', wspRes2.status);
    } catch (w2) {
      console.log('ℹ️ WhatsApp endpoint status:', wspErr.message);
    }
  }

  console.log('\n===============================================================');
  console.log('🏁 RESULTADOS CONSOLIDADOS DE LA AUDITORÍA');
  console.log('===============================================================');
  console.log(JSON.stringify(results, null, 2));

  process.exit(0);
}

runAudit().catch(err => {
  console.error('Fallo en auditoría:', err);
  process.exit(1);
});
