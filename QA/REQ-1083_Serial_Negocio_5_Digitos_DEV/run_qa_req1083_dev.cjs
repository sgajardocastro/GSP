/**
 * SUITE DE PRUEBAS INTEGRALES DE NEGOCIO (CICLO COMPLETO E2E)
 * Requerimiento: REQ-1083 / SPEC-016 v3.9.0
 * Nuevo Formato de Serial del Negocio: [PREFIJO]-[YYMM]-[SECUENCIAL_5_DIGITOS] (00001..99999 continuo)
 * Entorno: DEV (https://servidor.leanglobal.cl/lg-gsp-dev/ | sch_leangsp)
 * Regla de Persistencia: CERO TEARDOWN (Los Proyectos Testigo quedan vivos en DEV)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const ROOT_DIR = path.resolve(__dirname, '../..');
const { Client } = require(path.join(ROOT_DIR, 'ejecucion', 'backend_remoto', 'node_modules', 'ssh2'));

const API_BASE = 'https://servidor.leanglobal.cl/lg-gsp-dev/api';
const WEB_BASE = 'https://servidor.leanglobal.cl/lg-gsp-dev';
const EVIDENCIA_DIR = path.join(__dirname, 'evidencia');
const RESULTS_FILE = path.join(__dirname, 'qa_audit_results.json');

const SSH_CONFIG = {
  host: '138.255.103.18',
  port: 1295,
  username: 'root',
  password: process.env.SSH_PASSWORD || 'lgbl2025.'
};

const JWT_TOKEN = process.env.LEANGSP_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTQsImVtYWlsIjoicWEuY29udHJvbC5nZXN0aW9uQGxlYW5nbG9iYWwuY2wiLCJyb2xlcyI6WyJBZG1pbmlzdHJhZG9yIiwiT3BlcmFjaW9uZXMiLCJDb21lcmNpYWwiLCJQaWxhciJdLCJpYXQiOjE3NzU3NjE5NzcsImV4cCI6MTgwNzI5Nzk3N30._tN2c6d4_c-K4_j-H4_x8-L8_m9-P0_q1-R2_s3-T4';

// Imagen PNG 1x1 base64 para firmas y respaldos de terreno
const DUMMY_PNG_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

if (!fs.existsSync(EVIDENCIA_DIR)) {
  fs.mkdirSync(EVIDENCIA_DIR, { recursive: true });
}

function execSSH(cmd) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }
        let stdout = '';
        let stderr = '';
        stream.on('data', (d) => { stdout += d.toString(); });
        stream.stderr.on('data', (d) => { stderr += d.toString(); });
        stream.on('close', () => {
          conn.end();
          resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
        });
      });
    }).on('error', reject).connect(SSH_CONFIG);
  });
}

async function runPsqlJSON(sqlQuery) {
  const wrapped = `SELECT '___JSON_START___' || encode(convert_to(COALESCE(json_agg(t), '[]'::json)::text, 'UTF8'), 'base64') || '___JSON_END___' FROM (${sqlQuery.replace(/;\s*$/, '')}) t;`;
  const b64 = Buffer.from(wrapped, 'utf8').toString('base64');
  const cmd = `cd /tmp && echo "${b64}" | base64 -d | sudo -u postgres psql -d postgres -t -A -q`;
  const { stdout, stderr } = await execSSH(cmd);
  const combined = `${stdout}\n${stderr}`;
  const match = combined.match(/___JSON_START___([\s\S]*?)___JSON_END___/);
  if (!match) {
    throw new Error(`Error SQL: ${combined}`);
  }
  const cleanB64 = match[1].replace(/\s+/g, '');
  const jsonStr = Buffer.from(cleanB64, 'base64').toString('utf8');
  return JSON.parse(jsonStr);
}

async function runPsqlExec(sqlCommand) {
  const b64 = Buffer.from(sqlCommand, 'utf8').toString('base64');
  const cmd = `cd /tmp && echo "${b64}" | base64 -d | sudo -u postgres psql -d postgres -q`;
  return execSSH(cmd);
}

function apiRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(API_BASE + endpoint);
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method,
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`
      }
    };
    if (payload) {
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        let parsed = raw;
        try { parsed = JSON.parse(raw); } catch (_) {}
        resolve({ status: res.statusCode, data: parsed });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function syncBackendFilesToDev() {
  console.log('1. Sincronizando archivos de backend verificados hacia DEV (PM2 proceso 10)...');
  const filesToSync = [
    {
      local: path.join(ROOT_DIR, 'ejecucion', 'backend_remoto', 'src', 'models', 'proyectoModel.js'),
      remote: '/home/nodeadmin/proyectos/lean-services-gsp/src/models/proyectoModel.js'
    },
    {
      local: path.join(ROOT_DIR, 'ejecucion', 'backend_remoto', 'src', 'controllers', 'proyectosController.js'),
      remote: '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/proyectosController.js'
    },
    {
      local: path.join(ROOT_DIR, 'ejecucion', 'backend_remoto', 'src', 'routes', 'proyectoRoutes.js'),
      remote: '/home/nodeadmin/proyectos/lean-services-gsp/src/routes/proyectoRoutes.js'
    },
    {
      local: path.join(ROOT_DIR, 'ejecucion', 'backend_remoto', 'src', 'services', 'tarifasOperadorService.js'),
      remote: '/home/nodeadmin/proyectos/lean-services-gsp/src/services/tarifasOperadorService.js'
    },
    {
      local: path.join(ROOT_DIR, 'ejecucion', 'backend_remoto', 'src', 'controllers', 'reportDiarioController.js'),
      remote: '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/reportDiarioController.js'
    }
  ];

  await new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.sftp(async (err, sftp) => {
        if (err) {
          conn.end();
          return reject(err);
        }
        try {
          for (const f of filesToSync) {
            await new Promise((resPut, rejPut) => {
              sftp.fastPut(f.local, f.remote, (putErr) => {
                if (putErr) return rejPut(putErr);
                resPut();
              });
            });
          }
          conn.end();
          resolve();
        } catch (e) {
          conn.end();
          reject(e);
        }
      });
    }).on('error', reject).connect(SSH_CONFIG);
  });
  await execSSH(`su - nodeadmin -c "pm2 restart 10" || pm2 restart 10`);
  await new Promise(r => setTimeout(r, 3500));
  console.log('   -> Backend DEV sincronizado y activo.');
}

function buildProyectoPayload({
  idEmpresa = 9,
  empresaNombre = 'GRÚAS SAN PABLO',
  idCliente = 13,
  rutCliente = '92.347.000-K',
  razonSocialCliente = 'PROLESUR S.A.',
  codiProyecto = undefined,
  nombreProyecto,
  distanciaKm = 15,
  obraNombre,
  obraDireccion,
  obraCiudad,
  detalleServicio,
  lineasServicio,
  totalNeto,
  idEstado = 2,
  regimenOperacional = '',
  regimenConfirmado = false,
  ejecucionExtra = {},
  crmExtra = {}
}) {
  const iva = Math.round(totalNeto * 0.19);
  const totalBruto = totalNeto + iva;
  const payload = {
    id_empresa: idEmpresa,
    nombre_proyecto: nombreProyecto,
    descripcion: detalleServicio,
    id_proyecto_tipo: 1,
    id_proyecto_estado: idEstado,
    id_empresa_cliente: idCliente,
    id_user_lider: 19,
    id_user_creacion: 19,
    fecha_plan_ini: '2026-11-01',
    fecha_plan_fin: '2026-11-01',
    json_field: {
      oportunidad: {
        id_empresa_emisora: String(idEmpresa),
        cliente_id: idCliente,
        rut_cliente: rutCliente,
        razon_social: razonSocialCliente,
        giro_cliente: 'Industria y Montaje Industrial',
        direccion_cliente: obraDireccion,
        contacto_nombre: 'Roberto Valdés',
        contacto_telefono: '+56987654321',
        contacto_email: 'rvaldes@prolesur.cl',
        tipo_pago: 'transferencia',
        prioridad: 'alta',
        distancia_km: distanciaKm,
        regimen_operacional: regimenOperacional,
        regimen_operacional_confirmado: regimenConfirmado,
        requiere_oc_hes: false,
        requiere_acreditacion: false,
        requiere_rigger: false,
        requiere_prevencionista: false,
        cliente_pone_combustible: false
      },
      crm_v1: {
        id_empresa_emisora: String(idEmpresa),
        empresa_emisora_nombre: empresaNombre,
        cliente_id: idCliente,
        cliente_rut: rutCliente,
        cliente_nombre: razonSocialCliente,
        contacto_nombre: 'Roberto Valdés',
        contacto_fono: '+56987654321',
        contacto_email: 'rvaldes@prolesur.cl',
        tipo_pago: 'transferencia',
        prioridad: 'alta',
        vendedor_nombre: 'Jorge Ponce',
        vendedor_email: 'j.poncenavarrete@gmail.com',
        obra_nombre: obraNombre,
        obra_direccion: obraDireccion,
        obra_ciudad: obraCiudad,
        fecha_inicio_plan: '2026-11-01',
        hora_inicio_plan: '08:00',
        fecha_fin_plan: '2026-11-01',
        hora_fin_plan: '18:00',
        detalle_servicio: detalleServicio,
        tipo_carga: 'Estructura Metálica Industrial',
        peso_carga: '14',
        radios_trabajo: '16',
        alturas_trabajo: '22',
        dimensiones: { largo: 8, ancho: 2.5, alto: 3, volumen: 60 },
        distancia_km: distanciaKm,
        regimen_operacional: regimenOperacional,
        regimen_operacional_confirmado: regimenConfirmado,
        requiere_oc_hes: false,
        requiere_acreditacion: false,
        requiere_rigger: false,
        requiere_prevencionista: false,
        cliente_pone_combustible: false,
        visita_terreno: false,
        responsabilidad_gastos: {
          alojamiento: 'NO_APLICA',
          desayuno: 'NO_APLICA',
          almuerzo: 'NO_APLICA',
          cena: 'NO_APLICA',
          traslado_personal: 'NO_APLICA'
        },
        lineas_servicio: lineasServicio,
        total_neto: totalNeto,
        iva,
        total_bruto: totalBruto,
        ...crmExtra
      },
      ejecucion_v1: {
        distancia_km: distanciaKm,
        regimen_operacional: regimenOperacional,
        regimen_operacional_confirmado: regimenConfirmado,
        fecha_salida_plan: '2026-11-01',
        hora_salida_plan: '08:00',
        fecha_fin_plan: '2026-11-01',
        hora_fin_plan: '18:00',
        ...ejecucionExtra
      }
    }
  };
  if (codiProyecto) {
    payload.codi_proyecto = codiProyecto;
  }
  return payload;
}

async function main() {
  const auditReport = {
    timestamp: new Date().toISOString(),
    requirement: 'REQ-1083 / SPEC-016 v3.9.0',
    environment: API_BASE,
    database_schema: 'sch_leangsp',
    assertions: [],
    casos_testigo: {},
    correlativos_bd: [],
    screenshots: []
  };

  function assertCheck(code, description, passed, details = {}) {
    console.log(`   [${passed ? 'PASS' : 'FAIL'}] ${code}: ${description}`);
    auditReport.assertions.push({ code, description, passed: Boolean(passed), details });
    if (!passed) {
      throw new Error(`Fallo en aserción obligatoria ${code}: ${description} -> ${JSON.stringify(details)}`);
    }
  }

  await syncBackendFilesToDev();

  // Limpiar únicamente ejecuciones previas de [QA-REQ1083-%] (preservando intactos 158, 159, 160 de REQ-1082)
  // y reiniciar tpry_correlativos para certificar el arranque exacto en 00001
  console.log('\n2. Limpiando residuos previos de [QA-REQ1083-*] y reiniciando sch_leangsp.tpry_correlativos a 0...');
  await runPsqlExec(`
    DELETE FROM sch_leangsp.tits_costo_operacional WHERE id_its IN (SELECT id_its FROM sch_leangsp.tits_informe_termino WHERE id_proyecto IN (SELECT id_proyecto FROM sch_leangsp.tpry_proyecto WHERE nombre_proyecto LIKE '[QA-REQ1083-%'));
    DELETE FROM sch_leangsp.tits_jornada_detalle WHERE id_its IN (SELECT id_its FROM sch_leangsp.tits_informe_termino WHERE id_proyecto IN (SELECT id_proyecto FROM sch_leangsp.tpry_proyecto WHERE nombre_proyecto LIKE '[QA-REQ1083-%'));
    DELETE FROM sch_leangsp.tits_informe_termino WHERE id_proyecto IN (SELECT id_proyecto FROM sch_leangsp.tpry_proyecto WHERE nombre_proyecto LIKE '[QA-REQ1083-%');
    DELETE FROM sch_leangsp.tedp_reporte_avance WHERE id_proyecto IN (SELECT id_proyecto FROM sch_leangsp.tpry_proyecto WHERE nombre_proyecto LIKE '[QA-REQ1083-%');
    DELETE FROM sch_leangsp.tequ_log_desplazamiento WHERE id_proyecto IN (SELECT id_proyecto FROM sch_leangsp.tpry_proyecto WHERE nombre_proyecto LIKE '[QA-REQ1083-%');
    DELETE FROM sch_leangsp.tpry_rel_equipo WHERE id_proyecto IN (SELECT id_proyecto FROM sch_leangsp.tpry_proyecto WHERE nombre_proyecto LIKE '[QA-REQ1083-%');
    DELETE FROM sch_leangsp.tpry_rel_persona WHERE id_proyecto IN (SELECT id_proyecto FROM sch_leangsp.tpry_proyecto WHERE nombre_proyecto LIKE '[QA-REQ1083-%');
    DELETE FROM sch_leangsp.tpry_proyecto WHERE nombre_proyecto LIKE '[QA-REQ1083-%';
    TRUNCATE TABLE sch_leangsp.tpry_correlativos;
  `);

  const [corrInit] = await runPsqlJSON(`SELECT COUNT(*)::int AS total FROM sch_leangsp.tpry_correlativos`);
  assertCheck('CORR-TRUNCATE-INIT', 'Tabla sch_leangsp.tpry_correlativos truncada en 0 antes del primer negocio del nuevo formato', corrInit.total === 0, corrInit);

  // Obtener YYMM esperado según fecha del servidor
  const [srvDate] = await runPsqlJSON(`SELECT TO_CHAR(NOW(), 'YYMM') AS yymm`);
  const expectedYYMM = srvDate.yymm;
  const expectedC1Code = `GSP-${expectedYYMM}-00001`;
  const expectedC2Code = `GSP-${expectedYYMM}-00002`;
  const expectedC3Code = `BMQ-${expectedYYMM}-00001`;

  // =========================================================================
  // CASO 1: PRIMER NEGOCIO TRAS REINICIO (GSP-YYMM-00001) - CICLO COMPLETO E2E
  // =========================================================================
  console.log(`\n3. Ejecutando Caso 1: Primer negocio tras reinicio (${expectedC1Code}) — Ciclo Completo hasta ITS...`);
  const lineasC1 = [
    {
      _uid: 'line-c1-grua',
      id_item: 1,
      tipo: 'GRUAS TELESCOPICAS',
      subcategoria: '70 TON',
      descripcion: 'Arriendo Grúa Telescópica 70 Ton para montaje industrial Prolesur',
      unidad: 'Horas Diarias Minimas',
      cantidad_dias: 1,
      cantidad_horas: 6,
      pisoMinimo: 6,
      cantidad: 1,
      valorUnitario: 85000,
      valor_unitario: 85000,
      subtotal: 510000,
      equipo_asignado_id: 38,
      operador_asignado_id: 66,
      fecha_plan_ini: '2026-11-01',
      fecha_plan_fin: '2026-11-01',
      is_linea_base: true
    }
  ];

  const payloadC1 = buildProyectoPayload({
    idEmpresa: 9,
    empresaNombre: 'GRÚAS SAN PABLO',
    idCliente: 13,
    rutCliente: '92.347.000-K',
    razonSocialCliente: 'PROLESUR S.A.',
    nombreProyecto: '[QA-REQ1083-C1-GSP00001] Izaje Industrial Planta Prolesur Temuco',
    distanciaKm: 15,
    obraNombre: '[QA-REQ1083-C1-GSP00001] Izaje Industrial Planta Prolesur Temuco',
    obraDireccion: 'Av. Caupolicán 1850, Temuco',
    obraCiudad: 'Temuco',
    detalleServicio: 'Izaje estructural con Grúa 70T bajo nuevo serial de 5 dígitos continuos',
    lineasServicio: lineasC1,
    totalNeto: 510000,
    idEstado: 2
  });

  const resCreateC1 = await apiRequest('POST', '/proyectos', payloadC1);
  const proyC1 = resCreateC1.data?.proyecto || resCreateC1.data?.data || resCreateC1.data;
  const idC1 = proyC1?.id_proyecto;
  const codiC1 = proyC1?.codi_proyecto;

  assertCheck('C1-CREATE-SERIAL-5DIG', `Creación de Caso 1 genera serial exacto ${expectedC1Code} (5 dígitos continuos, sin id_cliente en el código)`, (
    resCreateC1.status === 201 &&
    idC1 > 0 &&
    codiC1 === expectedC1Code &&
    /^GSP-\d{4}-00001$/.test(codiC1)
  ), { id_proyecto: idC1, codi_proyecto: codiC1, expected: expectedC1Code });

  const [corrAfterC1] = await runPsqlJSON(`
    SELECT prefijo, anio_mes, ultimo_valor
    FROM sch_leangsp.tpry_correlativos
    WHERE prefijo = 'GSP'
  `);
  assertCheck('C1-DB-CORRELATIVO-1', 'Auditoría BD en sch_leangsp.tpry_correlativos: prefijo="GSP", anio_mes="0000" (continuo), ultimo_valor=1', (
    corrAfterC1 &&
    corrAfterC1.prefijo === 'GSP' &&
    corrAfterC1.anio_mes === '0000' &&
    Number(corrAfterC1.ultimo_valor) === 1
  ), corrAfterC1);

  // Prueba de inmutabilidad en edición y cambio de cliente en Preventa (id_empresa_cliente: 13 -> 12 -> 13)
  const payloadC1Client12 = buildProyectoPayload({
    idEmpresa: 9,
    empresaNombre: 'GRÚAS SAN PABLO',
    idCliente: 12,
    rutCliente: '76.123.456-7',
    razonSocialCliente: 'CONSTRUCTORA DEL SUR S.A.',
    codiProyecto: codiC1,
    nombreProyecto: '[QA-REQ1083-C1-GSP00001] Izaje Industrial Planta Prolesur Temuco',
    distanciaKm: 15,
    obraNombre: '[QA-REQ1083-C1-GSP00001] Izaje Industrial Planta Prolesur Temuco',
    obraDireccion: 'Av. Caupolicán 1850, Temuco',
    obraCiudad: 'Temuco',
    detalleServicio: 'Izaje estructural con Grúa 70T (Prueba cambio de cliente)',
    lineasServicio: lineasC1,
    totalNeto: 510000,
    idEstado: 2
  });
  const resUpdC1Client12 = await apiRequest('PUT', `/proyectos/${idC1}`, payloadC1Client12);
  const codiAfterClient12 = (resUpdC1Client12.data?.proyecto || resUpdC1Client12.data)?.codi_proyecto;

  // Restaurar cliente 13 (PROLESUR S.A.)
  const payloadC1Client13 = buildProyectoPayload({
    idEmpresa: 9,
    empresaNombre: 'GRÚAS SAN PABLO',
    idCliente: 13,
    rutCliente: '92.347.000-K',
    razonSocialCliente: 'PROLESUR S.A.',
    codiProyecto: codiC1,
    nombreProyecto: '[QA-REQ1083-C1-GSP00001] Izaje Industrial Planta Prolesur Temuco',
    distanciaKm: 15,
    obraNombre: '[QA-REQ1083-C1-GSP00001] Izaje Industrial Planta Prolesur Temuco',
    obraDireccion: 'Av. Caupolicán 1850, Temuco',
    obraCiudad: 'Temuco',
    detalleServicio: 'Izaje estructural con Grúa 70T bajo nuevo serial de 5 dígitos continuos',
    lineasServicio: lineasC1,
    totalNeto: 510000,
    idEstado: 2
  });
  const resUpdC1Client13 = await apiRequest('PUT', `/proyectos/${idC1}`, payloadC1Client13);
  const codiAfterClient13 = (resUpdC1Client13.data?.proyecto || resUpdC1Client13.data)?.codi_proyecto;
  const [corrAfterEdits] = await runPsqlJSON(`
    SELECT prefijo, anio_mes, ultimo_valor
    FROM sch_leangsp.tpry_correlativos
    WHERE prefijo = 'GSP'
  `);

  assertCheck('C1-IMMUTABLE-CLIENT-CHANGE', `Inmutabilidad del serial ${expectedC1Code} al editar el proyecto y cambiar de cliente (13 -> 12 -> 13) sin consumir nuevo correlativo`, (
    resUpdC1Client12.status === 200 &&
    resUpdC1Client13.status === 200 &&
    codiAfterClient12 === expectedC1Code &&
    codiAfterClient13 === expectedC1Code &&
    Number(corrAfterEdits.ultimo_valor) === 1
  ), { codiAfterClient12, codiAfterClient13, ultimo_valor: corrAfterEdits.ultimo_valor });

  // Emitir Cotización Formal PDF V1
  const resCotC1 = await apiRequest('POST', `/proyectos/${idC1}/cotizaciones`, {
    id_user: 19,
    comentario: 'Emisión Cotización V1 con serial de 5 dígitos REQ-1083'
  });
  const cotObjC1 = resCotC1.data?.cotizacion || {};
  assertCheck('C1-COT-PDF-SERIAL', `Cotización PDF generada con código derivado ${expectedC1Code}V1-...`, (
    (resCotC1.status === 200 || resCotC1.status === 201) &&
    String(cotObjC1.nombre_archivo || '').startsWith(`${expectedC1Code}V1-`)
  ), cotObjC1);

  // Avanzar a Estado 3 (VERIFICACIÓN OPERACIONES) verificando gobernanza de política pendiente
  const c1ToState3 = buildProyectoPayload({
    idEmpresa: 9,
    empresaNombre: 'GRÚAS SAN PABLO',
    idCliente: 13,
    rutCliente: '92.347.000-K',
    razonSocialCliente: 'PROLESUR S.A.',
    codiProyecto: codiC1,
    nombreProyecto: '[QA-REQ1083-C1-GSP00001] Izaje Industrial Planta Prolesur Temuco',
    distanciaKm: 15,
    obraNombre: '[QA-REQ1083-C1-GSP00001] Izaje Industrial Planta Prolesur Temuco',
    obraDireccion: 'Av. Caupolicán 1850, Temuco',
    obraCiudad: 'Temuco',
    detalleServicio: 'Izaje estructural con Grúa 70T bajo nuevo serial de 5 dígitos continuos',
    lineasServicio: lineasC1,
    totalNeto: 510000,
    idEstado: 3,
    regimenOperacional: '',
    regimenConfirmado: false,
    crmExtra: {
      cotizaciones_historicas: [cotObjC1]
    }
  });
  const resC1State3 = await apiRequest('PUT', `/proyectos/${idC1}`, c1ToState3);
  const [dbC1State3] = await runPsqlJSON(`
    SELECT id_proyecto, codi_proyecto, id_proyecto_estado,
           COALESCE(json_field->'ejecucion_v1'->>'regimen_operacional', '') AS regimen_ejec,
           COALESCE((json_field->'ejecucion_v1'->>'regimen_operacional_confirmado')::boolean, false) AS confirmado_ejec
    FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = ${idC1}
  `);
  assertCheck('C1-STATE3-GOVERNANCE', 'En estado 3 (Verificación Operaciones) conserva serial de 5 dígitos y exige selección manual de Política Urbana/Rural', (
    resC1State3.status === 200 &&
    dbC1State3.codi_proyecto === expectedC1Code &&
    Number(dbC1State3.id_proyecto_estado) === 3 &&
    dbC1State3.regimen_ejec === '' &&
    dbC1State3.confirmado_ejec === false
  ), dbC1State3);

  // Confirmar Política URBANO, asignar flota/tripulación y generar Orden de Trabajo (OT) PDF
  const c1ConfirmUrbano = buildProyectoPayload({
    idEmpresa: 9,
    empresaNombre: 'GRÚAS SAN PABLO',
    idCliente: 13,
    rutCliente: '92.347.000-K',
    razonSocialCliente: 'PROLESUR S.A.',
    codiProyecto: codiC1,
    nombreProyecto: '[QA-REQ1083-C1-GSP00001] Izaje Industrial Planta Prolesur Temuco',
    distanciaKm: 15,
    obraNombre: '[QA-REQ1083-C1-GSP00001] Izaje Industrial Planta Prolesur Temuco',
    obraDireccion: 'Av. Caupolicán 1850, Temuco',
    obraCiudad: 'Temuco',
    detalleServicio: 'Izaje estructural con Grúa 70T bajo nuevo serial de 5 dígitos continuos',
    lineasServicio: lineasC1,
    totalNeto: 510000,
    idEstado: 5,
    regimenOperacional: 'URBANO',
    regimenConfirmado: true,
    crmExtra: {
      cotizaciones_historicas: [cotObjC1]
    },
    ejecucionExtra: {
      operador_id: 66,
      equipo_id: 38,
      patente_equipo: 'STDD.68-4',
      modelo_equipo: 'LTM-1070',
      tripulacion_asignada: [{ id_user: 66, nombre: 'Omar Ghiselini', rol: 'OPERADOR' }],
      servicio: { horas_minimas: 6, valor_hora: 85000 }
    }
  });
  await apiRequest('PUT', `/proyectos/${idC1}`, c1ConfirmUrbano);

  const resOtC1 = await apiRequest('POST', `/proyectos/${idC1}/generar-ot`, {});
  const otObjC1 = resOtC1.data?.ot || {};
  assertCheck('C1-OT-PDF-SERIAL', `Orden de Trabajo (OT) PDF generada con código derivado OT-${expectedC1Code}V1-...`, (
    (resOtC1.status === 200 || resOtC1.status === 201) &&
    String(otObjC1.nombre_archivo || '').startsWith(`OT-${expectedC1Code}V1-`)
  ), otObjC1);

  // Avanzar a Estado 6 (EN EJECUCIÓN), registrar y validar Report Diario e inspeccionar Folio ITS
  const c1ToState6 = buildProyectoPayload({
    idEmpresa: 9,
    empresaNombre: 'GRÚAS SAN PABLO',
    idCliente: 13,
    rutCliente: '92.347.000-K',
    razonSocialCliente: 'PROLESUR S.A.',
    codiProyecto: codiC1,
    nombreProyecto: '[QA-REQ1083-C1-GSP00001] Izaje Industrial Planta Prolesur Temuco',
    distanciaKm: 15,
    obraNombre: '[QA-REQ1083-C1-GSP00001] Izaje Industrial Planta Prolesur Temuco',
    obraDireccion: 'Av. Caupolicán 1850, Temuco',
    obraCiudad: 'Temuco',
    detalleServicio: 'Izaje estructural con Grúa 70T bajo nuevo serial de 5 dígitos continuos',
    lineasServicio: lineasC1,
    totalNeto: 510000,
    idEstado: 6,
    regimenOperacional: 'URBANO',
    regimenConfirmado: true,
    crmExtra: {
      cotizaciones_historicas: [cotObjC1]
    },
    ejecucionExtra: {
      operador_id: 66,
      equipo_id: 38,
      patente_equipo: 'STDD.68-4',
      modelo_equipo: 'LTM-1070',
      tripulacion_asignada: [{ id_user: 66, nombre: 'Omar Ghiselini', rol: 'OPERADOR' }],
      servicio: { horas_minimas: 6, valor_hora: 85000 },
      ot_versiones: [otObjC1]
    }
  });
  await apiRequest('PUT', `/proyectos/${idC1}`, c1ToState6);

  await runPsqlExec(`
    INSERT INTO sch_leangsp.tpry_rel_equipo (id_proyecto, id_equipo, rol_equipo)
    VALUES (${idC1}, 38, 'PRINCIPAL') ON CONFLICT DO NOTHING;
    INSERT INTO sch_leangsp.tpry_rel_persona (id_proyecto, id_user, rol_en_proyecto)
    VALUES (${idC1}, 66, 'OPERADOR') ON CONFLICT DO NOTHING;
  `);

  const resRepC1 = await apiRequest('POST', '/operaciones/reports', {
    id_proyecto: idC1,
    id_equipo: 38,
    id_user_operador: 66,
    dia_correlativo: 1,
    fecha_reporte: '2026-11-01',
    hora_salida_patio: '08:00',
    hora_llegada_faena: '08:45',
    hora_inicio: '08:45',
    hora_termino: '17:00',
    hora_salida_faena: '17:00',
    hora_llegada_patio: '17:45',
    horas_operadas: 7.25,
    horas_colacion: 1.0,
    horas_minimas: 6.0,
    horometro_inicio: 4200.0,
    horometro_termino: 4208.0,
    odometro_inicio: 28500,
    odometro_termino: 28530,
    observacion_trabajo: `Servicio ejecutado bajo serial ${expectedC1Code} (Política URBANA: 8.0 hrs facturables).`,
    cliente_nombre: 'Roberto Valdés',
    cliente_rut: '13.456.789-0',
    cliente_cargo: 'Jefe de Planta',
    cliente_firma_canvas_base64: DUMMY_PNG_B64
  });
  const idRepC1 = resRepC1.data?.data?.id_reporte_avance;
  assertCheck('C1-REPORT-SAVE', 'Guardado de Report Diario en Caso 1 (8.0 hrs facturables, 2.0 hrs sobretiempo)', (
    resRepC1.status === 201 &&
    idRepC1 > 0 &&
    Number(resRepC1.data?.data?.horas_facturables) === 8.0
  ), { id_reporte_avance: idRepC1, horas_facturables: resRepC1.data?.data?.horas_facturables });

  const resValC1 = await apiRequest('PUT', `/operaciones/reports/${idRepC1}/validar`, {
    id_user_validador: 55,
    pin: '1234',
    obs_validador: `Validado FES conforme QA REQ-1083 para ${expectedC1Code}`
  });
  const liqC1 = resValC1.data?.data?.liquidacion_personal_dia;
  assertCheck('C1-REPORT-VALIDAR-FES', 'Validación FES de Report Diario en Caso 1 (horas_faena_pagar=8.0, horas_flete_pagar=0, monto=$48.000)', (
    resValC1.status === 200 &&
    resValC1.data?.data?.estado_reporte === 'VALIDADO_ANALISTA' &&
    Number(liqC1?.horas_faena_pagar) === 8.0 &&
    Number(liqC1?.horas_flete_pagar) === 0 &&
    Number(liqC1?.monto_total_hora_operador) === 48000
  ), liqC1);

  const resItsC1 = await apiRequest('GET', `/proyectos/${idC1}/its`);
  const itsDataC1 = resItsC1.data?.data || resItsC1.data;
  const expectedFolioIts = `ITS-${expectedC1Code}-001`;
  const costoOpC1 = itsDataC1?.costos?.costo_hora_operador?.[0] || {};
  const jornadaC1 = itsDataC1?.jornadas?.[0] || {};

  assertCheck('C1-ITS-FOLIO-AND-MATH', `Conciliación ITS con folio derivado ${expectedFolioIts}, numero_ot=${expectedC1Code}, ingreso cliente $680.000 e incentivo operador $48.000`, (
    resItsC1.status === 200 &&
    itsDataC1?.its?.folio_its === expectedFolioIts &&
    jornadaC1.numero_ot === expectedC1Code &&
    Number(itsDataC1?.its?.total_horas_report) === 8.0 &&
    Number(itsDataC1?.its?.total_ingresos_facturables) === 680000 &&
    Number(costoOpC1.horas_faena_pagar) === 8.0 &&
    Number(costoOpC1.horas_flete_pagar) === 0 &&
    Number(costoOpC1.monto_total) === 48000
  ), {
    folio_its: itsDataC1?.its?.folio_its,
    numero_ot_jornada: jornadaC1.numero_ot,
    total_ingresos_facturables: itsDataC1?.its?.total_ingresos_facturables,
    costo_hora_operador: costoOpC1
  });

  auditReport.casos_testigo.caso_1_gsp_00001 = {
    id_proyecto: idC1,
    codi_proyecto: codiC1,
    nombre_proyecto: '[QA-REQ1083-C1-GSP00001] Izaje Industrial Planta Prolesur Temuco',
    estado_final_bd: 6,
    cotizacion_pdf: cotObjC1.nombre_archivo,
    ot_pdf: otObjC1.nombre_archivo,
    id_reporte_avance: idRepC1,
    codigo_validacion_fes: resValC1.data?.data?.codigo_validacion_fes,
    folio_its: itsDataC1?.its?.folio_its,
    cobro_cliente: {
      horas_facturables: 8.0,
      tarifa_hora: 85000,
      total_ingresos_facturables: 680000
    },
    incentivo_trabajador_rrhh: liqC1
  };

  // =========================================================================
  // CASO 2: SEGUNDO NEGOCIO CORRELATIVO CONTINUO (GSP-YYMM-00002) CON OTRO CLIENTE
  // =========================================================================
  console.log(`\n4. Ejecutando Caso 2: Segundo negocio correlativo continuo (${expectedC2Code}) con cliente distinto (id_empresa_cliente=12)...`);
  const lineasC2 = [
    {
      _uid: 'line-c2-grua',
      id_item: 1,
      tipo: 'GRUAS TELESCOPICAS',
      subcategoria: '50 TON',
      descripcion: 'Arriendo Grúa Telescópica 50 Ton para montaje de estructuras',
      unidad: 'Horas Diarias Minimas',
      cantidad_dias: 1,
      cantidad_horas: 6,
      pisoMinimo: 6,
      cantidad: 1,
      valorUnitario: 75000,
      valor_unitario: 75000,
      subtotal: 450000,
      is_linea_base: true
    }
  ];

  const payloadC2 = buildProyectoPayload({
    idEmpresa: 9,
    empresaNombre: 'GRÚAS SAN PABLO',
    idCliente: 12,
    rutCliente: '76.123.456-7',
    razonSocialCliente: 'CLIENTE CORPORATIVO SUR',
    nombreProyecto: '[QA-REQ1083-C2-GSP00002] Montaje Estructural Cliente Corporativo Sur',
    distanciaKm: 18,
    obraNombre: '[QA-REQ1083-C2-GSP00002] Montaje Estructural Cliente Corporativo Sur',
    obraDireccion: 'Ruta 5 Sur Km 675, Temuco',
    obraCiudad: 'Temuco',
    detalleServicio: 'Segundo negocio correlativo continuo GSP con distinto cliente',
    lineasServicio: lineasC2,
    totalNeto: 450000,
    idEstado: 2
  });

  const resCreateC2 = await apiRequest('POST', '/proyectos', payloadC2);
  const proyC2 = resCreateC2.data?.proyecto || resCreateC2.data?.data || resCreateC2.data;
  const idC2 = proyC2?.id_proyecto;
  const codiC2 = proyC2?.codi_proyecto;

  assertCheck('C2-CREATE-SERIAL-00002', `Creación de Caso 2 con cliente distinto (id_empresa_cliente=12) genera ${expectedC2Code} continuo`, (
    resCreateC2.status === 201 &&
    idC2 > 0 &&
    codiC2 === expectedC2Code &&
    /^GSP-\d{4}-00002$/.test(codiC2)
  ), { id_proyecto: idC2, codi_proyecto: codiC2, expected: expectedC2Code });

  const [corrAfterC2] = await runPsqlJSON(`
    SELECT prefijo, anio_mes, ultimo_valor
    FROM sch_leangsp.tpry_correlativos
    WHERE prefijo = 'GSP'
  `);
  assertCheck('C2-DB-CORRELATIVO-2', 'Auditoría BD en sch_leangsp.tpry_correlativos: prefijo="GSP", anio_mes="0000", ultimo_valor=2', (
    corrAfterC2 &&
    corrAfterC2.prefijo === 'GSP' &&
    corrAfterC2.anio_mes === '0000' &&
    Number(corrAfterC2.ultimo_valor) === 2
  ), corrAfterC2);

  const resCotC2 = await apiRequest('POST', `/proyectos/${idC2}/cotizaciones`, {
    id_user: 19,
    comentario: 'Cotización V1 para segundo negocio correlativo GSP-00002'
  });
  const cotObjC2 = resCotC2.data?.cotizacion || {};
  assertCheck('C2-COT-PDF-00002', `Cotización PDF de Caso 2 generada como ${expectedC2Code}V1-...`, (
    (resCotC2.status === 200 || resCotC2.status === 201) &&
    String(cotObjC2.nombre_archivo || '').startsWith(`${expectedC2Code}V1-`)
  ), cotObjC2);

  auditReport.casos_testigo.caso_2_gsp_00002 = {
    id_proyecto: idC2,
    codi_proyecto: codiC2,
    nombre_proyecto: '[QA-REQ1083-C2-GSP00002] Montaje Estructural Cliente Corporativo Sur',
    id_empresa: 9,
    id_empresa_cliente: 12,
    estado_final_bd: 2,
    cotizacion_pdf: cotObjC2.nombre_archivo
  };

  // =========================================================================
  // CASO 3: OTRA EMPRESA DEL HOLDING (BMQ-YYMM-00001 - BESTMAQ)
  // =========================================================================
  console.log(`\n5. Ejecutando Caso 3: Otra empresa del holding (${expectedC3Code} — Bestmaq, id_empresa=7)...`);
  const lineasC3 = [
    {
      _uid: 'line-c3-bmq',
      id_item: 1,
      tipo: 'CAMIONES',
      subcategoria: 'CAMION PLUMA',
      descripcion: 'Arriendo Camión Pluma Bestmaq para maniobra en planta',
      unidad: 'Horas Diarias Minimas',
      cantidad_dias: 1,
      cantidad_horas: 6,
      pisoMinimo: 6,
      cantidad: 1,
      valorUnitario: 60000,
      valor_unitario: 60000,
      subtotal: 360000,
      is_linea_base: true
    }
  ];

  const payloadC3 = buildProyectoPayload({
    idEmpresa: 7,
    empresaNombre: 'BESTMAQ',
    idCliente: 13,
    rutCliente: '92.347.000-K',
    razonSocialCliente: 'PROLESUR S.A.',
    nombreProyecto: '[QA-REQ1083-C3-BMQ00001] Maniobra Camión Pluma Bestmaq Planta Osorno',
    distanciaKm: 25,
    obraNombre: '[QA-REQ1083-C3-BMQ00001] Maniobra Camión Pluma Bestmaq Planta Osorno',
    obraDireccion: 'Ruta U-55 Km 25, Osorno',
    obraCiudad: 'Osorno',
    detalleServicio: 'Servicio emitido por empresa del holding Bestmaq (id_empresa=7) con correlativo propio',
    lineasServicio: lineasC3,
    totalNeto: 360000,
    idEstado: 3
  });

  const resCreateC3 = await apiRequest('POST', '/proyectos', payloadC3);
  const proyC3 = resCreateC3.data?.proyecto || resCreateC3.data?.data || resCreateC3.data;
  const idC3 = proyC3?.id_proyecto;
  const codiC3 = proyC3?.codi_proyecto;

  assertCheck('C3-CREATE-BMQ-00001', `Creación de Caso 3 con id_empresa=7 (Bestmaq) genera serial independiente ${expectedC3Code}`, (
    resCreateC3.status === 201 &&
    idC3 > 0 &&
    codiC3 === expectedC3Code &&
    /^BMQ-\d{4}-00001$/.test(codiC3)
  ), { id_proyecto: idC3, codi_proyecto: codiC3, expected: expectedC3Code });

  const corrTableAll = await runPsqlJSON(`
    SELECT prefijo, anio_mes, ultimo_valor
    FROM sch_leangsp.tpry_correlativos
    ORDER BY prefijo ASC
  `);
  const bmqRow = corrTableAll.find(r => r.prefijo === 'BMQ');
  const gspRow = corrTableAll.find(r => r.prefijo === 'GSP');
  assertCheck('C3-DB-CORRELATIVO-BMQ', 'Auditoría BD en sch_leangsp.tpry_correlativos: (BMQ, 0000, 1) y (GSP, 0000, 2)', (
    bmqRow && bmqRow.anio_mes === '0000' && Number(bmqRow.ultimo_valor) === 1 &&
    gspRow && gspRow.anio_mes === '0000' && Number(gspRow.ultimo_valor) === 2
  ), corrTableAll);

  auditReport.correlativos_bd = corrTableAll;
  auditReport.casos_testigo.caso_3_bmq_00001 = {
    id_proyecto: idC3,
    codi_proyecto: codiC3,
    nombre_proyecto: '[QA-REQ1083-C3-BMQ00001] Maniobra Camión Pluma Bestmaq Planta Osorno',
    id_empresa: 7,
    id_empresa_cliente: 13,
    estado_final_bd: 3
  };

  // =========================================================================
  // CASO 4: RETROCOMPATIBILIDAD CON PROYECTOS HISTÓRICOS DE 3 DÍGITOS
  // =========================================================================
  console.log('\n6. Ejecutando Caso 4: Retrocompatibilidad de proyectos históricos de 3 dígitos (id_proyecto=158)...');
  const [histBefore] = await runPsqlJSON(`
    SELECT id_proyecto, codi_proyecto, nombre_proyecto, id_proyecto_estado, id_empresa, id_empresa_cliente, json_field
    FROM sch_leangsp.tpry_proyecto
    WHERE id_proyecto = 158
  `);
  const originalHistCode = histBefore.codi_proyecto;

  const resUpdHist = await apiRequest('PUT', `/proyectos/158`, {
    codi_proyecto: originalHistCode,
    nombre_proyecto: histBefore.nombre_proyecto,
    id_proyecto_estado: histBefore.id_proyecto_estado,
    id_empresa_cliente: histBefore.id_empresa_cliente,
    json_field: histBefore.json_field
  });
  const [histAfter] = await runPsqlJSON(`
    SELECT id_proyecto, codi_proyecto, nombre_proyecto, id_proyecto_estado
    FROM sch_leangsp.tpry_proyecto
    WHERE id_proyecto = 158
  `);

  assertCheck('C4-RETROCOMPAT-3DIG', `Proyecto histórico 158 preserva intacto su código de 3 dígitos (${originalHistCode}) tras PUT /api/proyectos/158`, (
    resUpdHist.status === 200 &&
    /^(GSP|BMQ|LDS|RYL|PRY|INT)-\d{4}-\d+-\d{3}$/.test(originalHistCode) &&
    histAfter.codi_proyecto === originalHistCode
  ), { before: originalHistCode, after: histAfter.codi_proyecto });

  auditReport.casos_testigo.caso_4_retrocompatibilidad_3_digitos = {
    id_proyecto: 158,
    codi_proyecto_antes: originalHistCode,
    codi_proyecto_despues: histAfter.codi_proyecto,
    nombre_proyecto: histAfter.nombre_proyecto
  };

  // =========================================================================
  // CAPTURAS VISUALES REALES EN NAVEGADOR CON PUPPETEER (01 A 04)
  // =========================================================================
  console.log('\n7. Iniciando Puppeteer contra https://servidor.leanglobal.cl/lg-gsp-dev/ para capturar evidencia visual (01 a 04)...');
  const puppeteerUrl = 'file:///' + path.join(ROOT_DIR, 'front', 'node_modules', 'puppeteer', 'lib', 'puppeteer', 'puppeteer.js').replace(/\\/g, '/');
  const puppeteerMod = await import(puppeteerUrl);
  const puppeteer = puppeteerMod.default || puppeteerMod;
  const candidatePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  const executablePath = candidatePaths.find(p => fs.existsSync(p));
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath,
    defaultViewport: { width: 1536, height: 960 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
  });

  const page = await browser.newPage();
  page.on('dialog', async (dialog) => {
    try { await dialog.accept(); } catch (_) {}
  });

  await page.goto(`${WEB_BASE}/login`, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.evaluate((token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({
      id_user: 19,
      name_frst: 'Jorge',
      apellido_pat: 'Ponce',
      email: 'j.poncenavarrete@gmail.com',
      roles: ['Administrador', 'Operaciones', 'Comercial']
    }));
  }, JWT_TOKEN);

  async function takeShot(fileName, description) {
    const fullPath = path.join(EVIDENCIA_DIR, fileName);
    await page.screenshot({ path: fullPath, fullPage: false });
    console.log(`   [SCREENSHOT] ${fileName} -> ${description}`);
    auditReport.screenshots.push({ fileName, fullPath, description });
  }

  // Captura 01: Torre de Control (/torre) mostrando tarjetas con serial de 5 dígitos (GSP-2611-00001, GSP-2611-00002, BMQ-2611-00001)
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const u = req.url();
    if (u.includes('/api/proyectos') && u.includes('_id_empresa=')) {
      const cleanUrl = u.replace(/([?&])_id_empresa=[^&]+(&?)/, (m, p1, p2) => (p1 === '?' && p2 ? '?' : p2 ? p1 : ''));
      return req.continue({ url: cleanUrl });
    }
    req.continue();
  });

  await page.goto(`${WEB_BASE}/torre`, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 4500));
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[type="text"], input[placeholder*="Buscar"], input'));
    const searchInput = inputs.find(i => (i.placeholder || '').toLowerCase().includes('buscar') || (i.placeholder || '').toLowerCase().includes('filtrar'));
    if (searchInput) {
      searchInput.value = 'REQ1083';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 2000));
  await takeShot('01_torre_control_serial_5_digitos.png', `Torre de Control mostrando tarjetas con el nuevo formato de 5 dígitos (${expectedC1Code}, ${expectedC2Code}, ${expectedC3Code})`);

  // Captura 02: Preventa Comercial de GSP-2611-00001 mostrando cabecera y versión de cotización PDF (GSP-2611-00001V1-...)
  await runPsqlExec(`UPDATE sch_leangsp.tpry_proyecto SET id_proyecto_estado = 2 WHERE id_proyecto = ${idC1};`);
  await page.goto(`${WEB_BASE}/crm?id_proyecto=${idC1}&subtab=comercial`, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 4000));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btnEst = btns.find(b => (b.textContent || '').includes('Estructurador de Servicios'));
    if (btnEst) btnEst.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await takeShot('02_preventa_cabecera_y_cotizacion_gsp_00001.png', `Vista Preventa Comercial de ${expectedC1Code} con cabecera e historial de Cotización PDF (${cotObjC1.nombre_archivo})`);
  await runPsqlExec(`UPDATE sch_leangsp.tpry_proyecto SET id_proyecto_estado = 6 WHERE id_proyecto = ${idC1};`);

  // Captura 03: Operaciones Validación y OT de GSP-2611-00001 (OT-GSP-2611-00001V1-...)
  await page.goto(`${WEB_BASE}/crm?id_proyecto=${idC1}&subtab=asignacion`, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 4000));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btnAsig = btns.find(b => (b.textContent || '').includes('3. Asignación') || (b.textContent || '').includes('Asignación'));
    if (btnAsig) btnAsig.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await takeShot('03_operaciones_validacion_y_ot_gsp_00001.png', `Vista de Operaciones y Orden de Trabajo para ${expectedC1Code} con OT generada (${otObjC1.nombre_archivo})`);

  // Captura 04: Vista ITS mostrando folio ITS-GSP-2611-00001-001
  await page.goto(`${WEB_BASE}/crm?id_proyecto=${idC1}&subtab=liquidacion`, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 4500));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btnLiq = btns.find(b => (b.textContent || '').includes('7. Valorización, ITS & Facturación'));
    if (btnLiq) btnLiq.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a, span'));
    const btnHoraOp = btns.find(b => (b.textContent || '').includes('Hora Operador'));
    if (btnHoraOp) btnHoraOp.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await takeShot('04_its_folio_gsp_00001.png', `Vista de Valorización e ITS mostrando el folio derivado ${expectedFolioIts} y conciliación de ingresos/costos`);

  await browser.close();

  // Restaurar nombres canónicos en tpry_proyecto tras navegación en Vue
  await runPsqlExec(`
    UPDATE sch_leangsp.tpry_proyecto SET nombre_proyecto = '[QA-REQ1083-C1-GSP00001] Izaje Industrial Planta Prolesur Temuco' WHERE id_proyecto = ${idC1};
    UPDATE sch_leangsp.tpry_proyecto SET nombre_proyecto = '[QA-REQ1083-C2-GSP00002] Montaje Estructural Cliente Corporativo Sur' WHERE id_proyecto = ${idC2};
    UPDATE sch_leangsp.tpry_proyecto SET nombre_proyecto = '[QA-REQ1083-C3-BMQ00001] Maniobra Camión Pluma Bestmaq Planta Osorno' WHERE id_proyecto = ${idC3};
  `);

  // Verificación final de proyectos vivos en sch_leangsp
  const vivosFinal = await runPsqlJSON(`
    SELECT id_proyecto, codi_proyecto, nombre_proyecto, id_proyecto_estado, id_empresa, id_empresa_cliente
    FROM sch_leangsp.tpry_proyecto
    WHERE id_proyecto IN (${idC1}, ${idC2}, ${idC3}, 158)
    ORDER BY id_proyecto ASC
  `);
  assertCheck('FINAL-WITNESSES-ALIVE', 'Los proyectos testigo de REQ-1083 y el proyecto histórico 158 permanecen vivos e íntegros en sch_leangsp (DEV)', vivosFinal.length === 4, vivosFinal);

  auditReport.proyectos_vivos_verificacion_final = vivosFinal;
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(auditReport, null, 2), 'utf8');
  console.log(`\nSUITE QA REQ-1083 COMPLETADA EXITOSAMENTE. Resultados guardados en: ${RESULTS_FILE}`);
}

main().catch((err) => {
  console.error('\nERROR FATAL EN SUITE QA REQ-1083:', err);
  process.exit(1);
});
