// QA E2E REQ-1060 / SPEC-088: Identidad canónica de la jornada del Report Diario
// Ejecuta contra DEV (API + BD sch_leangsp) con un fixture aislado y lo limpia al terminar.
// Uso: node scripts/qa_e2e_jornada_req1060.cjs [dev]
const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const https = require('https');
const ssh = new NodeSSH();

const S = 'sch_leangsp';
const API = 'https://servidor.leanglobal.cl/lg-gsp-dev/api';
const EQ_A = 41;       // grúa asignada a la OT (tpry_rel_equipo)
const EQ_B = 35;       // grúa del viaje del chofer (fuente equivocada, reproduce CASO-14/CASO-20)
const EQ_C = 43;       // segunda grúa válida (escenario multi-grúa)
const OP = 55;         // operador de prueba
const OP2 = 35;        // segundo operador (multi-grúa)
const FIRMA = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const hoy = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
const diasAtras = (n) => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' }));
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString('en-CA');
};

const resultados = [];
function check(tc, desc, ok, detalle = '') {
  resultados.push({ tc, desc, ok: Boolean(ok), detalle });
  console.log(`${ok ? 'PASA' : 'FALLA'} | ${tc} | ${desc}${detalle ? ' | ' + detalle : ''}`);
}

function http(method, path, body = null, query = null) {
  return new Promise((resolve) => {
    const qs = query ? '?' + new URLSearchParams(query).toString() : '';
    const url = new URL(API + path + qs);
    const data = body ? JSON.stringify(body) : null;
    const req = https.request(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) }
    }, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(raw); } catch (e) { json = { raw: raw.slice(0, 300) }; }
        resolve({ status: res.statusCode, data: json });
      });
    });
    req.on('error', (e) => resolve({ status: 0, data: { error: e.message } }));
    if (data) req.write(data);
    req.end();
  });
}

async function sql(query) {
  await ssh.execCommand(`cat << 'EOF' > /tmp/qa1060.sql\n${query}\nEOF`);
  const r = await ssh.execCommand(`su - postgres -c "psql -d postgres -At -F '|' -f /tmp/qa1060.sql"`);
  if (r.stderr && /ERROR/.test(r.stderr)) throw new Error(r.stderr);
  return r.stdout.trim();
}

let P = null;
let horometroOriginalA = null;

async function crearFixture() {
  horometroOriginalA = await sql(`SELECT COALESCE(json_data->>'horometro','') FROM ${S}.tequ_equipo WHERE id_equipo = ${EQ_A};`);
  const lineas = JSON.stringify({ crm_v1: { lineas_servicio: [{ tipo: 'GRUAS TELESCOPICAS', pisoMinimo: 8, cantidad_dias: 10, equipo_asignado_id: EQ_A, operador_asignado_id: OP }] } });
  P = Number((await sql(`
    INSERT INTO ${S}.tpry_proyecto (codi_proyecto, nombre_proyecto, id_proyecto_estado, fecha_plan_ini, fecha_plan_fin, json_field)
    VALUES ('QA-REQ1060-E2E', 'QA E2E Jornada Canonica (temporal)', 5, '${diasAtras(10)}', '${diasAtras(-20)}', '${lineas}'::jsonb)
    RETURNING id_proyecto;`)).split('\n')[0]);
  await sql(`
    INSERT INTO ${S}.tpry_rel_equipo (id_proyecto, id_equipo, rol_equipo, fecha_plan_ini, fecha_plan_fin) VALUES (${P}, ${EQ_A}, 'GRUA PRINCIPAL', NOW(), NOW() + interval '20 days');
    INSERT INTO ${S}.tpry_rel_persona (id_proyecto, id_user, rol_asignado, fecha_plan_ini, fecha_plan_fin) VALUES (${P}, ${OP}, 'Operador Grúa', NOW(), NOW() + interval '20 days');
    INSERT INTO ${S}.tequ_log_desplazamiento (id_proyecto, id_equipo, id_user_chofer, tipo_trayecto, estado_trayecto, token_viaje)
      VALUES (${P}, ${EQ_B}, ${OP}, 'IDA', 'ASIGNADO', 'qa-req1060-${Date.now()}');`);
  console.log(`Fixture creado: OT ${P} | equipo OT=${EQ_A} | equipo viaje=${EQ_B} | operador=${OP}`);
}

async function limpiarFixture() {
  if (!P) return;
  await sql(`
    DELETE FROM ${S}.tedp_reporte_avance WHERE id_proyecto = ${P};
    DELETE FROM ${S}.tequ_log_desplazamiento WHERE id_proyecto = ${P};
    DELETE FROM ${S}.tpry_rel_equipo WHERE id_proyecto = ${P};
    DELETE FROM ${S}.tpry_rel_persona WHERE id_proyecto = ${P};
    DELETE FROM ${S}.tpry_proyecto WHERE id_proyecto = ${P} AND codi_proyecto = 'QA-REQ1060-E2E';`);
  if (horometroOriginalA !== null) {
    await sql(horometroOriginalA === ''
      ? `UPDATE ${S}.tequ_equipo SET json_data = json_data - 'horometro' WHERE id_equipo = ${EQ_A};`
      : `UPDATE ${S}.tequ_equipo SET json_data = jsonb_set(COALESCE(json_data,'{}'::jsonb), '{horometro}', '${JSON.stringify(horometroOriginalA)}'::jsonb) WHERE id_equipo = ${EQ_A};`);
  }
  const resto = await sql(`SELECT (SELECT count(*) FROM ${S}.tpry_proyecto WHERE id_proyecto=${P}) + (SELECT count(*) FROM ${S}.tedp_reporte_avance WHERE id_proyecto=${P});`);
  console.log(`Fixture eliminado (filas remanentes: ${resto}). Horómetro equipo ${EQ_A} restaurado a '${horometroOriginalA}'.`);
}

const abiertasCount = async () => Number(await sql(`SELECT count(*) FROM ${S}.tedp_reporte_avance WHERE id_proyecto=${P} AND estado_reporte='JORNADA_EN_CURSO';`));
const totalCount = async () => Number(await sql(`SELECT count(*) FROM ${S}.tedp_reporte_avance WHERE id_proyecto=${P};`));
const itemConsola = async () => {
  const r = await http('GET', '/reports/usuario/pendientes', null, { id_user: OP });
  const all = [...(r.data?.pendientes || []), ...(r.data?.concluidos || [])];
  return { status: r.status, items: all.filter(i => Number(i.id_proyecto) === P) };
};

async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  try {
    await crearFixture();
    const H = hoy();

    // TC-01
    let c = await itemConsola();
    check('TC-01', 'Consola: 1 fila por OT con equipo canónico de la OT (no el del viaje)',
      c.status === 200 && c.items.length === 1 && Number(c.items[0].id_equipo) === EQ_A,
      `status=${c.status} filas=${c.items.length} id_equipo=${c.items[0]?.id_equipo}`);

    // TC-02
    let r = await http('GET', `/operaciones/report/contexto/${P}`, null, { id_equipo: EQ_B, id_user: OP });
    let d = r.data?.data || {};
    check('TC-02', 'Contexto con equipo del viaje corrige al equipo canónico, sin jornada',
      r.status === 200 && Number(d.id_equipo_seleccionado) === EQ_A && d.equipo_corregido === true && !d.jornada_activa,
      `sel=${d.id_equipo_seleccionado} corregido=${d.equipo_corregido} jornada=${d.jornada_activa?.id_reporte_avance || null}`);

    // TC-11 (antes de crear jornadas)
    r = await http('POST', '/operaciones/report/inicio-jornada', { id_proyecto: P, id_user_operador: OP, dia_correlativo: 1, fecha_reporte: H, hora_inicio: '08:30' });
    check('TC-11', 'Inicio sin id_equipo es rechazado (400)', r.status === 400 && r.data?.codigo === 'EQUIPO_REQUERIDO', `status=${r.status} codigo=${r.data?.codigo}`);

    // TC-03
    r = await http('POST', '/operaciones/report/inicio-jornada', {
      id_proyecto: P, id_equipo: EQ_A, id_user_operador: OP, dia_correlativo: Number(d.dia_sugerido || 1),
      fecha_reporte: H, hora_inicio: '08:30', horometro_inicio: 1000, device_timestamp: new Date().toISOString()
    });
    const J1 = r.data?.data?.id_reporte_avance;
    check('TC-03', 'Inicio de jornada con equipo canónico', r.status === 200 && J1 && r.data.data.estado_reporte === 'JORNADA_EN_CURSO', `status=${r.status} id=${J1}`);

    // TC-04 (escenario exacto del CASO-20: reingreso con equipo del viaje y sin id)
    r = await http('GET', `/operaciones/report/contexto/${P}`, null, { id_equipo: EQ_B, id_user: OP });
    d = r.data?.data || {};
    check('TC-04', 'REINGRESO con equipo del viaje recupera la MISMA jornada (Momento 2)',
      Number(d.jornada_activa?.id_reporte_avance) === Number(J1) && d.jornada_activa?.hora_inicio_str === '08:30' && d.jornada_activa?.fecha_reporte_str === H,
      `jornada=${d.jornada_activa?.id_reporte_avance} hora=${d.jornada_activa?.hora_inicio_str} fecha=${d.jornada_activa?.fecha_reporte_str}`);

    // TC-05
    r = await http('GET', `/operaciones/report/contexto/${P}`, null, { id_reporte_avance: J1 });
    check('TC-05', 'Reingreso por id_reporte_avance recupera la jornada',
      Number(r.data?.data?.jornada_activa?.id_reporte_avance) === Number(J1), `jornada=${r.data?.data?.jornada_activa?.id_reporte_avance}`);

    // TC-06
    c = await itemConsola();
    check('TC-06', 'Consola entrega id_reporte_avance_activo y equipo de la jornada',
      c.items.length === 1 && Number(c.items[0].id_reporte_avance_activo) === Number(J1) && c.items[0].jornada_en_curso === true && Number(c.items[0].id_equipo) === EQ_A,
      `activo=${c.items[0]?.id_reporte_avance_activo} eq=${c.items[0]?.id_equipo}`);

    // TC-07
    r = await http('POST', '/operaciones/report/inicio-jornada', {
      id_proyecto: P, id_equipo: EQ_A, id_user_operador: OP, dia_correlativo: 1, fecha_reporte: H, hora_inicio: '08:45', horometro_inicio: 1000
    });
    check('TC-07', 'Doble inicio el mismo día reutiliza la jornada (sin duplicar)',
      r.status === 200 && Number(r.data?.data?.id_reporte_avance) === Number(J1) && (await abiertasCount()) === 1,
      `id=${r.data?.data?.id_reporte_avance} abiertas=${await abiertasCount()}`);

    // TC-14 (multi-grúa): grúa válida C con otro operador NO toma la jornada de A
    await sql(`INSERT INTO ${S}.tpry_rel_equipo (id_proyecto, id_equipo, rol_equipo, fecha_plan_ini, fecha_plan_fin) VALUES (${P}, ${EQ_C}, 'GRUA SECUNDARIA', NOW(), NOW() + interval '20 days');`);
    r = await http('GET', `/operaciones/report/contexto/${P}`, null, { id_equipo: EQ_C, id_user: OP2 });
    d = r.data?.data || {};
    check('TC-14', 'OT multi-grúa: grúa válida sin jornada no toma la jornada de otra grúa',
      !d.jornada_activa && Number(d.id_equipo_seleccionado) === EQ_C, `jornada=${d.jornada_activa?.id_reporte_avance || null} sel=${d.id_equipo_seleccionado}`);
    await sql(`DELETE FROM ${S}.tpry_rel_equipo WHERE id_proyecto=${P} AND id_equipo=${EQ_C};`);

    // TC-12
    r = await http('POST', '/operaciones/report/guardar', { id_proyecto: P, id_equipo: EQ_A, fecha_reporte: H, cliente_firma_canvas_base64: FIRMA });
    check('TC-12', 'Guardar sin operador resoluble es rechazado (400, no 55)', r.status === 400 && r.data?.codigo === 'OPERADOR_REQUERIDO', `status=${r.status} codigo=${r.data?.codigo}`);

    // TC-08 (cierre sin id_reporte_avance: debe ADOPTAR, no duplicar)
    r = await http('POST', '/operaciones/report/guardar', {
      id_proyecto: P, id_equipo: EQ_A, id_user_operador: OP, dia_correlativo: 1, fecha_reporte: H,
      hora_inicio: '08:30', hora_termino: '18:00', horas_colacion: 1, horas_operadas: 8.5, horometro_inicio: 1000, horometro_termino: 1008.5,
      cliente_nombre: 'QA Mandante', cliente_rut: '11111111-1', cliente_cargo: 'QA', cliente_firma_canvas_base64: FIRMA, device_timestamp: new Date().toISOString()
    });
    const tot = await totalCount();
    const ab = await abiertasCount();
    check('TC-08', 'Cierre sin id_reporte_avance adopta la jornada abierta (0 abiertas, 0 duplicados)',
      r.status === 201 && Number(r.data?.data?.id_reporte_avance) === Number(J1) && tot === 1 && ab === 0,
      `status=${r.status} id=${r.data?.data?.id_reporte_avance} total=${tot} abiertas=${ab}`);

    // TC-13 (contexto sugiere Día 2 + inicio real de Día 2 con dia_correlativo > 1 responde 200 OK)
    r = await http('GET', `/operaciones/report/contexto/${P}`, null, { id_equipo: EQ_B, id_user: OP });
    d = r.data?.data || {};
    const rIniDia2 = await http('POST', '/operaciones/report/inicio-jornada', {
      id_proyecto: P, id_equipo: EQ_A, id_user_operador: OP, dia_correlativo: 2,
      fecha_reporte: H, hora_inicio: '08:00', horometro_inicio: 1008.5
    });
    const idDia2 = rIniDia2.data?.data?.id_reporte_avance;
    check('TC-13', 'Siguiente jornada sugiere Día 2 e inicia Día 2 (dia_correlativo > 1) con 200 OK',
      Number(d.dia_sugerido) === 2 && !d.jornada_activa && rIniDia2.status === 200 && Boolean(idDia2),
      `dia_sugerido=${d.dia_sugerido} status_ini_d2=${rIniDia2.status} id_d2=${idDia2 || rIniDia2.data?.error}`);
    if (idDia2) await sql(`DELETE FROM ${S}.tedp_reporte_avance WHERE id_reporte_avance = ${Number(idDia2)};`);

    // TC-09: huérfano confirmado (abierta de un día anterior con reporte cerrado ese mismo día)
    const ayer = diasAtras(1);
    await sql(`
      INSERT INTO ${S}.tedp_reporte_avance (id_proyecto, id_equipo, id_user_operador, dia_correlativo, fecha_reporte, unidad_cobro, token_report, estado_reporte, estado_jornada, fecha_registro)
      VALUES (${P}, ${EQ_A}, ${OP}, 9, '${ayer}', 'HRS_DIA', 'qa1060-cerrado-${Date.now()}', 'PENDIENTE_VALIDACION', 'FINALIZADA', NOW());
      INSERT INTO ${S}.tedp_reporte_avance (id_proyecto, id_equipo, id_user_operador, dia_correlativo, fecha_reporte, unidad_cobro, token_report, estado_reporte, estado_jornada, fecha_registro)
      VALUES (${P}, ${EQ_A}, ${OP}, 9, '${ayer}', 'HRS_DIA', 'qa1060-huerfano-${Date.now()}', 'JORNADA_EN_CURSO', 'JORNADA_EN_CURSO', NOW());`);
    r = await http('GET', `/operaciones/report/contexto/${P}`, null, { id_equipo: EQ_A, id_user: OP });
    check('TC-09', 'Huérfano confirmado de un día anterior es ignorado', r.status === 200 && !r.data?.data?.jornada_activa,
      `jornada=${r.data?.data?.jornada_activa?.id_reporte_avance || null}`);

    // TC-10: abierta de un día anterior SIN cierre ese día -> se presenta y el inicio de hoy responde 409
    const anteayer = diasAtras(3);
    const JV = Number((await sql(`
      INSERT INTO ${S}.tedp_reporte_avance (id_proyecto, id_equipo, id_user_operador, dia_correlativo, fecha_reporte, unidad_cobro, token_report, estado_reporte, estado_jornada, fecha_inicio_servicio, fecha_registro)
      VALUES (${P}, ${EQ_A}, ${OP}, 8, '${anteayer}', 'HRS_DIA', 'qa1060-vieja-${Date.now()}', 'JORNADA_EN_CURSO', 'JORNADA_EN_CURSO', '${anteayer} 08:15:00-03', NOW())
      RETURNING id_reporte_avance;`)).split('\n')[0]);
    r = await http('GET', `/operaciones/report/contexto/${P}`, null, { id_equipo: EQ_B, id_user: OP });
    d = r.data?.data || {};
    const presenta = Number(d.jornada_activa?.id_reporte_avance) === JV && d.jornada_activa?.es_dia_anterior === true && d.jornada_activa?.fecha_reporte_str === anteayer;
    r = await http('POST', '/operaciones/report/inicio-jornada', { id_proyecto: P, id_equipo: EQ_A, id_user_operador: OP, dia_correlativo: 1, fecha_reporte: H, hora_inicio: '08:30' });
    check('TC-10', 'Jornada anterior sin cerrar: se presenta con su fecha y el inicio de hoy responde 409',
      presenta && r.status === 409 && r.data?.codigo === 'JORNADA_ANTERIOR_ABIERTA' && Number(r.data?.id_reporte_avance) === JV,
      `presenta=${presenta} status=${r.status} codigo=${r.data?.codigo}`);
  } catch (e) {
    check('ERROR', 'Excepción en la suite', false, e.message);
  } finally {
    try { await limpiarFixture(); } catch (e) { console.error('ERROR LIMPIEZA:', e.message); }
    await ssh.execCommand('rm -f /tmp/qa1060.sql');
    ssh.dispose();
  }
  const pasa = resultados.filter(x => x.ok).length;
  console.log(`\nRESULTADO: ${pasa}/${resultados.length} PASA (${Math.round((pasa / resultados.length) * 100)}%)`);
  process.exit(pasa === resultados.length ? 0 : 1);
}

run();
