const https = require('https');
const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

const BASE = 'https://servidor.leanglobal.cl/lg-gsp-prod/api';

function reqJson(method, pathUrl, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(BASE + pathUrl);
    const payload = body ? Buffer.from(JSON.stringify(body), 'utf8') : null;
    const req = https.request({
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method,
      headers: {
        'Connection': 'close',
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': payload.length } : {})
      },
      timeout: 8000
    }, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(b) }); }
        catch (e) { resolve({ status: res.statusCode, raw: b.slice(0, 300) }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

(async () => {
  let idCreado = null;
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295, readyTimeout: 10000 });
  try {
    // PASO 1: Consola antes de iniciar
    const p1 = await reqJson('GET', '/reports/usuario/pendientes?id_user=49');
    const card1 = (p1.data?.pendientes || []).find(x => Number(x.id_proyecto) === 16);
    console.log('1) CONSOLA MAÑANA (GET /reports/usuario/pendientes?id_user=49):', JSON.stringify({
      status: p1.status,
      id_proyecto: card1?.id_proyecto,
      codi_proyecto: card1?.codi_proyecto,
      id_equipo: card1?.id_equipo,
      patente: card1?.patente,
      dia_a_reportar: card1?.dia_a_reportar,
      dias_reportados: card1?.dias_reportados,
      total_dias: card1?.total_dias,
      jornada_en_curso: card1?.jornada_en_curso,
      motivo: card1?.motivo
    }));

    // PASO 2: Abrir Report (incluso con id_equipo=45 antiguo)
    const p2 = await reqJson('GET', '/operaciones/report/contexto/16?id_equipo=45&id_user=49');
    const d2 = p2.data?.data || {};
    console.log('2) CONTEXTO MAÑANA (GET /operaciones/report/contexto/16?id_equipo=45&id_user=49):', JSON.stringify({
      status: p2.status,
      id_equipo_seleccionado: d2.id_equipo_seleccionado,
      equipo_corregido: d2.equipo_corregido,
      dia_sugerido: d2.dia_sugerido,
      horometro_sugerido: d2.horometro_sugerido,
      jornada_activa: d2.jornada_activa
    }));

    // PASO 3: Guardar Inicio de Jornada Día 7
    const p3 = await reqJson('POST', '/operaciones/report/inicio-jornada', {
      id_proyecto: 16,
      id_equipo: d2.id_equipo_seleccionado,
      id_user_operador: 49,
      id_user_rigger: null,
      dia_correlativo: d2.dia_sugerido,
      fecha_reporte: '2026-10-21',
      hora_inicio: '08:00',
      horometro_inicio: d2.horometro_sugerido,
      odometro_inicio: null,
      foto_tablero_inicio: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      foto_odometro_inicio: null,
      device_timestamp: new Date().toISOString()
    });
    idCreado = p3.data?.data?.id_reporte_avance || null;
    console.log('3) GUARDAR INICIO DÍA 7 (POST /operaciones/report/inicio-jornada):', JSON.stringify({
      status: p3.status,
      success: p3.data?.success,
      message: p3.data?.message,
      error: p3.data?.error || null,
      id_reporte_avance: idCreado,
      id_equipo: p3.data?.data?.id_equipo,
      dia_correlativo: p3.data?.data?.dia_correlativo,
      estado_reporte: p3.data?.data?.estado_reporte
    }));

    // PASO 4A: Consola en la tarde (con jornada en curso)
    const p4a = await reqJson('GET', '/reports/usuario/pendientes?id_user=49');
    const card4 = (p4a.data?.pendientes || []).find(x => Number(x.id_proyecto) === 16);
    console.log('4A) CONSOLA TARDE (GET /reports/usuario/pendientes?id_user=49):', JSON.stringify({
      status: p4a.status,
      id_equipo: card4?.id_equipo,
      jornada_en_curso: card4?.jornada_en_curso,
      id_reporte_avance_activo: card4?.id_reporte_avance_activo,
      motivo: card4?.motivo,
      mensaje: card4?.mensaje
    }));

    // PASO 4B: Reingreso en la tarde con id_equipo=45 (peor caso: caché vieja)
    const p4b = await reqJson('GET', '/operaciones/report/contexto/16?id_equipo=45&id_user=49');
    const j4b = p4b.data?.data?.jornada_activa;
    console.log('4B) REINGRESO TARDE CON id_equipo=45:', JSON.stringify({
      status: p4b.status,
      id_equipo_seleccionado: p4b.data?.data?.id_equipo_seleccionado,
      recupera_jornada: Boolean(j4b && Number(j4b.id_reporte_avance) === Number(idCreado)),
      id_reporte_avance: j4b?.id_reporte_avance,
      dia_correlativo: j4b?.dia_correlativo,
      hora_inicio_str: j4b?.hora_inicio_str,
      horometro_inicio: j4b?.horometro_inicio,
      faseVisual_resultante: j4b ? 2 : 1
    }));

    // PASO 4C: Reingreso en la tarde con id_equipo=33 + id_reporte_avance (PWA v1.0.53)
    const p4c = await reqJson('GET', `/operaciones/report/contexto/16?id_equipo=33&id_reporte_avance=${idCreado}&id_user=49`);
    const j4c = p4c.data?.data?.jornada_activa;
    console.log('4C) REINGRESO TARDE CON id_equipo=33 + id_reporte_avance:', JSON.stringify({
      status: p4c.status,
      recupera_jornada: Boolean(j4c && Number(j4c.id_reporte_avance) === Number(idCreado)),
      id_reporte_avance: j4c?.id_reporte_avance,
      faseVisual_resultante: j4c ? 2 : 1
    }));
  } finally {
    if (idCreado) {
      const rbSql = `
        DELETE FROM sch_leangsp_prod.tedp_reporte_avance
        WHERE id_reporte_avance = ${Number(idCreado)} AND id_proyecto = 16 AND estado_reporte = 'JORNADA_EN_CURSO';
        SELECT setval('sch_leangsp_prod.tedp_reporte_avance_id_reporte_avance_seq', (SELECT MAX(id_reporte_avance) FROM sch_leangsp_prod.tedp_reporte_avance));
      `;
      const rb = await ssh.execCommand(`su - postgres -c "psql -d postgres -P pager=off" << 'EOF'\n${rbSql}\nEOF`);
      console.log('5) ROLLBACK EJECUTADO:', (rb.stdout || rb.stderr).replace(/\s+/g, ' ').trim());
    }
    ssh.dispose();
  }

  // Verificar post-rollback
  const p5 = await reqJson('GET', '/operaciones/report/contexto/16?id_equipo=33&id_user=49');
  console.log('6) VERIFICACIÓN POST-ROLLBACK:', JSON.stringify({
    status: p5.status,
    dia_sugerido: p5.data?.data?.dia_sugerido,
    jornada_activa: p5.data?.data?.jornada_activa,
    dias_reportados: p5.data?.data?.dias_reportados
  }));
  process.exit(0);
})().catch(e => {
  console.error('ERR:', e);
  process.exit(1);
});
