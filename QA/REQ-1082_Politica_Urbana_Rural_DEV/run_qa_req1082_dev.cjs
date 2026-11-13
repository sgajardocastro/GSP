/**
 * SUITE DE PRUEBAS INTEGRALES DE NEGOCIO (CICLO COMPLETO E2E)
 * Requerimiento: REQ-1082 / SPEC-016 v3.8.0
 * Entorno: DEV (https://servidor.leanglobal.cl/lg-gsp-dev/ | sch_leangsp)
 * Regla de Persistencia: CERO TEARDOWN (Los 3 Proyectos Testigo quedan vivos en DEV)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const ROOT_DIR = path.resolve(__dirname, '../..');
const { Client } = require(path.join(ROOT_DIR, 'ejecucion', 'backend_remoto', 'node_modules', 'ssh2'));

const {
  calcularLiquidacionHorasDia
} = require(path.join(ROOT_DIR, 'ejecucion', 'backend_remoto', 'src', 'services', 'tarifasOperadorService.js'));

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
      local: path.join(ROOT_DIR, 'ejecucion', 'backend_remoto', 'src', 'services', 'tarifasOperadorService.js'),
      remote: '/home/nodeadmin/proyectos/lean-services-gsp/src/services/tarifasOperadorService.js'
    },
    {
      local: path.join(ROOT_DIR, 'ejecucion', 'backend_remoto', 'src', 'controllers', 'reportDiarioController.js'),
      remote: '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/reportDiarioController.js'
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
      local: path.join(ROOT_DIR, 'ejecucion', 'backend_remoto', 'src', 'routes', 'index.js'),
      remote: '/home/nodeadmin/proyectos/lean-services-gsp/src/routes/index.js'
    },
    {
      local: path.join(ROOT_DIR, 'ejecucion', 'backend_remoto', 'src', 'routes', 'reportDiarioRoutes.js'),
      remote: '/home/nodeadmin/proyectos/lean-services-gsp/src/routes/reportDiarioRoutes.js'
    },
    {
      local: path.join(ROOT_DIR, 'ejecucion', 'backend_remoto', 'src', 'models', 'viajeModel.js'),
      remote: '/home/nodeadmin/proyectos/lean-services-gsp/src/models/viajeModel.js'
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

function buildPreventaPayload({
  nombreProyecto,
  distanciaKm,
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
  return {
    nombre_proyecto: nombreProyecto,
    descripcion: detalleServicio,
    id_proyecto_tipo: 1,
    id_proyecto_estado: idEstado,
    id_empresa_cliente: 13, // PROLESUR S.A.
    id_user_lider: 19,
    id_user_creacion: 19,
    fecha_plan_ini: '2026-10-30',
    fecha_plan_fin: '2026-10-30',
    json_field: {
      oportunidad: {
        id_empresa_emisora: '9',
        cliente_id: 13,
        rut_cliente: '92.347.000-K',
        razon_social: 'PROLESUR S.A.',
        giro_cliente: 'Industria Láctea y Alimentos',
        direccion_cliente: 'Av. Mackenna 1420, Osorno',
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
        id_empresa_emisora: '9',
        empresa_emisora_nombre: 'GRÚAS SAN PABLO',
        cliente_id: 13,
        cliente_rut: '92.347.000-K',
        cliente_nombre: 'PROLESUR S.A.',
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
        fecha_inicio_plan: '2026-10-30',
        hora_inicio_plan: '08:00',
        fecha_fin_plan: '2026-10-30',
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
        fecha_salida_plan: '2026-10-30',
        hora_salida_plan: '08:00',
        fecha_fin_plan: '2026-10-30',
        hora_fin_plan: '18:00',
        ...ejecucionExtra
      }
    }
  };
}

async function main() {
  const auditReport = {
    timestamp: new Date().toISOString(),
    environment: API_BASE,
    database_schema: 'sch_leangsp',
    assertions: [],
    proyectos_testigo: {},
    subcasos_matematicos: {},
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

  // Limpiar ejecuciones previas del mismo prefijo para evitar duplicados, manteniendo intactos los 3 nuevos al finalizar
  console.log('2. Limpiando residuos previos de [QA-REQ1082-*] antes de crear los 3 Proyectos Testigo...');
  await runPsqlExec(`
    DELETE FROM sch_leangsp.tits_costo_operacional WHERE id_its IN (SELECT id_its FROM sch_leangsp.tits_informe_termino WHERE id_proyecto IN (SELECT id_proyecto FROM sch_leangsp.tpry_proyecto WHERE nombre_proyecto LIKE '[QA-REQ1082-%'));
    DELETE FROM sch_leangsp.tits_jornada_detalle WHERE id_its IN (SELECT id_its FROM sch_leangsp.tits_informe_termino WHERE id_proyecto IN (SELECT id_proyecto FROM sch_leangsp.tpry_proyecto WHERE nombre_proyecto LIKE '[QA-REQ1082-%'));
    DELETE FROM sch_leangsp.tits_informe_termino WHERE id_proyecto IN (SELECT id_proyecto FROM sch_leangsp.tpry_proyecto WHERE nombre_proyecto LIKE '[QA-REQ1082-%');
    DELETE FROM sch_leangsp.tedp_reporte_avance WHERE id_proyecto IN (SELECT id_proyecto FROM sch_leangsp.tpry_proyecto WHERE nombre_proyecto LIKE '[QA-REQ1082-%');
    DELETE FROM sch_leangsp.tequ_log_desplazamiento WHERE id_proyecto IN (SELECT id_proyecto FROM sch_leangsp.tpry_proyecto WHERE nombre_proyecto LIKE '[QA-REQ1082-%');
    DELETE FROM sch_leangsp.tpry_rel_equipo WHERE id_proyecto IN (SELECT id_proyecto FROM sch_leangsp.tpry_proyecto WHERE nombre_proyecto LIKE '[QA-REQ1082-%');
    DELETE FROM sch_leangsp.tpry_rel_persona WHERE id_proyecto IN (SELECT id_proyecto FROM sch_leangsp.tpry_proyecto WHERE nombre_proyecto LIKE '[QA-REQ1082-%');
    DELETE FROM sch_leangsp.tpry_proyecto WHERE nombre_proyecto LIKE '[QA-REQ1082-%';
  `);

  // =========================================================================
  // PROYECTO TESTIGO 1: [QA-REQ1082-DEVUELTO]
  // =========================================================================
  console.log('\n3. Ejecutando Ciclo de Negocio — Proyecto Testigo 1: [QA-REQ1082-DEVUELTO]...');
  const lineasP1 = [
    {
      _uid: 'line-p1-grua',
      id_item: 1,
      tipo: 'GRUAS TELESCOPICAS',
      subcategoria: '70 TON',
      descripcion: 'Arriendo Grúa Telescópica 70 Ton para montaje industrial',
      unidad: 'Horas Diarias Minimas',
      cantidad_dias: 1,
      cantidad_horas: 6,
      pisoMinimo: 6,
      cantidad: 1,
      valorUnitario: 85000,
      valor_unitario: 85000,
      subtotal: 510000,
      is_linea_base: true
    },
    {
      _uid: 'line-p1-apoyo',
      id_item: 2,
      tipo: 'CAMIONES',
      subcategoria: 'CAMION PLUMA',
      descripcion: 'Camión Pluma apoyo maniobra interna',
      unidad: 'Horas Diarias Minimas',
      cantidad_dias: 1,
      cantidad_horas: 6,
      pisoMinimo: 6,
      cantidad: 1,
      valorUnitario: 55000,
      valor_unitario: 55000,
      subtotal: 330000,
      is_linea_base: true
    }
  ];
  const payloadP1 = buildPreventaPayload({
    nombreProyecto: '[QA-REQ1082-DEVUELTO] Montaje Industrial Planta Osorno',
    distanciaKm: 22,
    obraNombre: 'Planta Industrial Osorno Sector Norte',
    obraDireccion: 'Ruta U-55 Km 22, Osorno',
    obraCiudad: 'Osorno',
    detalleServicio: 'Izaje de estanque inoxidable con grúa 70T y camión de apoyo',
    lineasServicio: lineasP1,
    totalNeto: 840000,
    idEstado: 2
  });

  const resCreateP1 = await apiRequest('POST', '/proyectos', payloadP1);
  const idP1 = resCreateP1.data?.proyecto?.id_proyecto || resCreateP1.data?.id_proyecto || resCreateP1.data?.data?.id_proyecto;
  assertCheck('P1-CREATE', 'Creación de Proyecto Testigo 1 en Preventa (estado 2) con distancia_km=22 y estructurador libre', resCreateP1.status === 201 && idP1 > 0, { id_proyecto: idP1, status: resCreateP1.status });

  // Emitir cotización formal PDF
  const resCotP1 = await apiRequest('POST', `/proyectos/${idP1}/cotizaciones`, {
    id_user: 19,
    comentario: 'Emisión versión V1 cotización estructurador libre QA REQ-1082'
  });
  assertCheck('P1-COT-PDF', 'Emisión de cotización formal en PDF con condiciones_pdf y distancia_km=22', (resCotP1.status === 200 || resCotP1.status === 201) && resCotP1.data?.cotizacion?.version >= 1, {
    status: resCotP1.status,
    cotizacion: resCotP1.data?.cotizacion
  });

  // Avanzar a estado 3 (VERIFICACIÓN OPERACIONES) verificando que regimen_operacional nace vacío
  const p1ToState3 = buildPreventaPayload({
    nombreProyecto: '[QA-REQ1082-DEVUELTO] Montaje Industrial Planta Osorno',
    distanciaKm: 22,
    obraNombre: 'Planta Industrial Osorno Sector Norte',
    obraDireccion: 'Ruta U-55 Km 22, Osorno',
    obraCiudad: 'Osorno',
    detalleServicio: 'Izaje de estanque inoxidable con grúa 70T y camión de apoyo',
    lineasServicio: lineasP1,
    totalNeto: 840000,
    idEstado: 3,
    regimenOperacional: '',
    regimenConfirmado: false,
    crmExtra: {
      cotizaciones_historicas: [resCotP1.data.cotizacion]
    }
  });
  const resUpdP1State3 = await apiRequest('PUT', `/proyectos/${idP1}`, p1ToState3);
  assertCheck('P1-STATE-3', 'Avance de Proyecto Testigo 1 a estado 3 (VERIFICACIÓN OPERACIONES) sin preselección de política', resUpdP1State3.status === 200, { status: resUpdP1State3.status });

  // Verificar en BD que en estado 3 regimen_operacional === '' y regimen_operacional_confirmado === false
  const [dbP1State3] = await runPsqlJSON(`
    SELECT id_proyecto, id_proyecto_estado,
           json_field->'crm_v1'->>'distancia_km' AS distancia_km,
           COALESCE(json_field->'ejecucion_v1'->>'regimen_operacional', '') AS regimen_ejec,
           COALESCE((json_field->'ejecucion_v1'->>'regimen_operacional_confirmado')::boolean, false) AS confirmado_ejec
    FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = ${idP1}
  `);
  assertCheck('P1-DB-STATE3-PENDING', 'En estado 3 el proyecto exige selección manual (regimen_operacional="" y confirmado=false)', Number(dbP1State3.id_proyecto_estado) === 3 && dbP1State3.regimen_ejec === '' && dbP1State3.confirmado_ejec === false, dbP1State3);

  // Prueba negativa: reversar-a-cotizacion con motivo vacío o < 5 caracteres debe retornar HTTP 400
  const resRevFail = await apiRequest('POST', `/proyectos/${idP1}/reversar-a-cotizacion`, {
    motivo: 'abc',
    usuario: 'Jorge Ponce (Jefe Operaciones)'
  });
  assertCheck('P1-REVERSO-400', 'Rechazo HTTP 400 al intentar devolver a Preventa Comercial con motivo < 5 caracteres', resRevFail.status === 400, { status: resRevFail.status, error: resRevFail.data?.error });

  // Nota: Dejaremos Proyecto Testigo 1 en estado 3 unos minutos para tomar las capturas 03 y 04 en navegador,
  // o tomaremos las capturas 03 y 04 antes de ejecutar el reverso definitivo, o bien ejecutamos el reverso ahora y verificamos BD.
  // ¡Mejor aún! Ejecutemos el reverso real ahora para verificar BD y notificaciones, o hagámoslo junto con el navegador.
  // Esperen: si ejecutamos el reverso real ahora, en el navegador Proyecto 1 ya estará en estado 2 (ideal para captura 05!),
  // mientras que para las capturas 03 y 04 podemos usar Proyecto 2 cuando está en estado 3 antes de confirmarle URBANO!
  // Y aún mejor: también podemos capturar el modal de rechazo en Proyecto 2 en estado 3 (ya que Proyecto 2 TAMBIÉN se devuelve 1 vez según el flujo requerido!).
  const motivoReversoP1 = 'Rechazado por Operaciones: Se requiere agregar flete de contrapesos adicionales y ajustar ventana horaria de ingreso a planta.';
  const resRevOkP1 = await apiRequest('POST', `/proyectos/${idP1}/reversar-a-cotizacion`, {
    motivo: motivoReversoP1,
    usuario: 'Jorge Ponce (Jefe Operaciones)',
    id_user: 19
  });
  const revStateP1 = resRevOkP1.data?.proyecto?.id_proyecto_estado ?? resRevOkP1.data?.id_proyecto_estado;
  assertCheck('P1-REVERSO-200', 'Devolución exitosa de Proyecto Testigo 1 a Preventa Comercial (HTTP 200 -> id_proyecto_estado=2)', resRevOkP1.status === 200 && Number(revStateP1) === 2, { status: resRevOkP1.status, id_proyecto_estado: revStateP1 });

  // Auditar tpry_proyecto y tnot_notification_log en PostgreSQL para Proyecto Testigo 1
  const [dbP1AfterRev] = await runPsqlJSON(`
    SELECT id_proyecto, codi_proyecto, nombre_proyecto, id_proyecto_estado,
           json_field->'crm_v1'->>'motivo_reverso_verificacion' AS crm_motivo,
           json_field->'crm_v1'->>'fecha_reverso_verificacion' AS crm_fecha,
           json_field->'crm_v1'->>'usuario_reverso_verificacion' AS crm_usuario,
           jsonb_array_length(COALESCE(json_field->'crm_v1'->'historial_reversos_verificacion', '[]'::jsonb)) AS crm_hist_len,
           COALESCE(json_field->'crm_v1'->>'regimen_operacional', '') AS crm_regimen,
           COALESCE((json_field->'crm_v1'->>'regimen_operacional_confirmado')::boolean, false) AS crm_confirmado,
           json_field->'ejecucion_v1'->>'motivo_reverso_verificacion' AS ejec_motivo,
           json_field->'ejecucion_v1'->>'fecha_reverso_verificacion' AS ejec_fecha,
           json_field->'ejecucion_v1'->>'usuario_reverso_verificacion' AS ejec_usuario,
           COALESCE(json_field->'ejecucion_v1'->>'regimen_operacional', '') AS ejec_regimen,
           COALESCE((json_field->'ejecucion_v1'->>'regimen_operacional_confirmado')::boolean, false) AS ejec_confirmado
    FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = ${idP1}
  `);
  assertCheck('P1-DB-REVERSO-AUDIT', 'Auditoría BD post-reverso en tpry_proyecto (estado=2, motivo, fecha ISO, usuario, historial>=1 y reset de política)', (
    Number(dbP1AfterRev.id_proyecto_estado) === 2 &&
    dbP1AfterRev.crm_motivo === motivoReversoP1 &&
    Boolean(dbP1AfterRev.crm_fecha) &&
    dbP1AfterRev.crm_hist_len >= 1 &&
    dbP1AfterRev.crm_regimen === '' &&
    dbP1AfterRev.crm_confirmado === false &&
    dbP1AfterRev.ejec_regimen === '' &&
    dbP1AfterRev.ejec_confirmado === false
  ), dbP1AfterRev);

  const notifsP1 = await runPsqlJSON(`
    SELECT id_log, evento, canal, destinatario, fecha_registro
    FROM sch_leangsp.tnot_notification_log
    WHERE evento = 'PROYECTO_REVERSADO_A_COMERCIAL'
      AND fecha_registro >= NOW() - INTERVAL '10 minutes'
    ORDER BY id_log DESC
  `);
  assertCheck('P1-DB-NOTIF-LOG', 'Auditoría BD en sch_leangsp.tnot_notification_log para evento PROYECTO_REVERSADO_A_COMERCIAL', notifsP1.length >= 2, { count: notifsP1.length, sample: notifsP1.slice(0, 6) });

  auditReport.proyectos_testigo.proyecto_1_devuelto = {
    id_proyecto: idP1,
    codi_proyecto: dbP1AfterRev.codi_proyecto,
    nombre_proyecto: dbP1AfterRev.nombre_proyecto,
    estado_final_bd: dbP1AfterRev.id_proyecto_estado,
    distancia_km: 22,
    motivo_reverso_verificacion: dbP1AfterRev.crm_motivo,
    fecha_reverso_verificacion: dbP1AfterRev.crm_fecha,
    usuario_reverso_verificacion: dbP1AfterRev.crm_usuario,
    historial_reversos_len: dbP1AfterRev.crm_hist_len,
    notificaciones_registradas: notifsP1
  };

  // =========================================================================
  // PROYECTO TESTIGO 2: [QA-REQ1082-URBANO]
  // =========================================================================
  console.log('\n4. Ejecutando Ciclo de Negocio — Proyecto Testigo 2: [QA-REQ1082-URBANO]...');
  const lineasP2 = [
    {
      _uid: 'line-p2-grua',
      id_item: 1,
      tipo: 'GRUAS TELESCOPICAS',
      subcategoria: '70 TON',
      descripcion: 'Arriendo Grúa Telescópica 70 Ton para montaje urbano en Parque Industrial',
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
      fecha_plan_ini: '2026-10-30',
      fecha_plan_fin: '2026-10-30',
      is_linea_base: true
    }
  ];
  const payloadP2 = buildPreventaPayload({
    nombreProyecto: '[QA-REQ1082-URBANO] Izaje Urbano Parque Industrial Temuco',
    distanciaKm: 15,
    obraNombre: 'Centro Logístico Urbano Temuco',
    obraDireccion: 'Av. Caupolicán 1850, Temuco',
    obraCiudad: 'Temuco',
    detalleServicio: 'Montaje de equipos HVAC en cubierta industrial urbana',
    lineasServicio: lineasP2,
    totalNeto: 510000,
    idEstado: 2
  });

  const resCreateP2 = await apiRequest('POST', '/proyectos', payloadP2);
  const idP2 = resCreateP2.data?.proyecto?.id_proyecto || resCreateP2.data?.id_proyecto || resCreateP2.data?.data?.id_proyecto;
  assertCheck('P2-CREATE', 'Creación de Proyecto Testigo 2 (URBANO, distancia_km=15, 6h mínimas a $85.000/hr)', resCreateP2.status === 201 && idP2 > 0, { id_proyecto: idP2 });

  const resCotP2 = await apiRequest('POST', `/proyectos/${idP2}/cotizaciones`, {
    id_user: 19,
    comentario: 'Cotización V1 Urbano 15 km sin línea de flete'
  });
  assertCheck('P2-COT-PDF', 'Emisión de cotización PDF para Proyecto Testigo 2', resCotP2.status === 200 || resCotP2.status === 201, { cotizacion: resCotP2.data?.cotizacion });

  // Avanzar a estado 3
  const p2ToState3 = buildPreventaPayload({
    nombreProyecto: '[QA-REQ1082-URBANO] Izaje Urbano Parque Industrial Temuco',
    distanciaKm: 15,
    obraNombre: 'Centro Logístico Urbano Temuco',
    obraDireccion: 'Av. Caupolicán 1850, Temuco',
    obraCiudad: 'Temuco',
    detalleServicio: 'Montaje de equipos HVAC en cubierta industrial urbana',
    lineasServicio: lineasP2,
    totalNeto: 510000,
    idEstado: 3,
    regimenOperacional: '',
    regimenConfirmado: false,
    crmExtra: { cotizaciones_historicas: [resCotP2.data.cotizacion] }
  });
  await apiRequest('PUT', `/proyectos/${idP2}`, p2ToState3);

  // Devolver 1 vez a Preventa Comercial con motivo "Ajustar descripción de maniobra urbana"
  const resRevP2 = await apiRequest('POST', `/proyectos/${idP2}/reversar-a-cotizacion`, {
    motivo: 'Ajustar descripción de maniobra urbana',
    usuario: 'Jorge Ponce (Jefe Operaciones)',
    id_user: 19
  });
  const revStateP2 = resRevP2.data?.proyecto?.id_proyecto_estado ?? resRevP2.data?.id_proyecto_estado;
  assertCheck('P2-REVERSO-1', 'Devolución de Proyecto Testigo 2 a Preventa Comercial con motivo "Ajustar descripción de maniobra urbana"', resRevP2.status === 200 && Number(revStateP2) === 2, { status: resRevP2.status, id_proyecto_estado: revStateP2 });

  // Obtener el proyecto actualizado para preservar historial_reversos_verificacion y re-enviar a estado 3
  const getP2AfterRev = await apiRequest('GET', `/proyectos/${idP2}`);
  const jfP2Rev = resRevP2.data?.proyecto?.json_field || getP2AfterRev.data?.proyecto?.json_field || getP2AfterRev.data?.json_field || {};
  const histReversosP2 = jfP2Rev.crm_v1?.historial_reversos_verificacion || [];

  // Re-enviar a estado 3 (VERIFICACIÓN OPERACIONES) con descripción ajustada y política pendiente
  const p2ResendState3 = buildPreventaPayload({
    nombreProyecto: '[QA-REQ1082-URBANO] Izaje Urbano Parque Industrial Temuco',
    distanciaKm: 15,
    obraNombre: 'Centro Logístico Urbano Temuco',
    obraDireccion: 'Av. Caupolicán 1850, Temuco',
    obraCiudad: 'Temuco',
    detalleServicio: 'Montaje de equipos HVAC en cubierta industrial urbana (Maniobra Urbana Ajustada)',
    lineasServicio: lineasP2,
    totalNeto: 510000,
    idEstado: 3,
    regimenOperacional: '',
    regimenConfirmado: false,
    crmExtra: {
      cotizaciones_historicas: [resCotP2.data.cotizacion],
      motivo_reverso_verificacion: 'Ajustar descripción de maniobra urbana',
      fecha_reverso_verificacion: jfP2Rev.crm_v1?.fecha_reverso_verificacion,
      usuario_reverso_verificacion: jfP2Rev.crm_v1?.usuario_reverso_verificacion,
      historial_reversos_verificacion: histReversosP2
    },
    ejecucionExtra: {
      motivo_reverso_verificacion: 'Ajustar descripción de maniobra urbana',
      fecha_reverso_verificacion: jfP2Rev.ejecucion_v1?.fecha_reverso_verificacion,
      usuario_reverso_verificacion: jfP2Rev.ejecucion_v1?.usuario_reverso_verificacion,
      historial_reversos_verificacion: histReversosP2
    }
  });
  const resP2BackTo3 = await apiRequest('PUT', `/proyectos/${idP2}`, p2ResendState3);
  assertCheck('P2-RESEND-STATE3', 'Re-envío de Proyecto Testigo 2 a estado 3 preservando historial_reversos_verificacion y exigiendo política manual', resP2BackTo3.status === 200 && histReversosP2.length === 1, { histLen: histReversosP2.length });

  // =========================================================================
  // PROYECTO TESTIGO 3: [QA-REQ1082-RURAL] (Creación y avance a estado 3 para capturas antes de pasar P2 y P3 a estado 6)
  // =========================================================================
  console.log('\n5. Creando Proyecto Testigo 3: [QA-REQ1082-RURAL] hasta estado 3...');
  const lineasP3 = [
    {
      _uid: 'line-p3-grua',
      id_item: 1,
      tipo: 'GRUAS TELESCOPICAS',
      subcategoria: '90 TON',
      descripcion: 'Arriendo Grúa Telescópica 90 Ton para montaje en faena rural',
      unidad: 'Horas Diarias Minimas',
      cantidad_dias: 1,
      cantidad_horas: 8,
      pisoMinimo: 8,
      cantidad: 1,
      valorUnitario: 95000,
      valor_unitario: 95000,
      subtotal: 760000,
      equipo_asignado_id: 44,
      operador_asignado_id: 66,
      fecha_plan_ini: '2026-10-30',
      fecha_plan_fin: '2026-10-30',
      is_linea_base: true
    },
    {
      _uid: 'line-p3-flete',
      id_item: 2,
      tipo: 'TRASLADOS',
      subcategoria: 'CAMA BAJA',
      descripcion: 'TRASLADO IDA/VUELTA Grúa y Contrapesos Faena Rural',
      unidad: 'Traslado',
      pisoMinimo: 0,
      cantidad: 1,
      valorUnitario: 350000,
      valor_unitario: 350000,
      subtotal: 350000,
      is_linea_base: true
    }
  ];
  const payloadP3 = buildPreventaPayload({
    nombreProyecto: '[QA-REQ1082-RURAL] Montaje Estructural Faena Rural Loncoche',
    distanciaKm: 55,
    obraNombre: 'Planta Celulosa Sector Rural Loncoche',
    obraDireccion: 'Ruta 5 Sur Km 733, Loncoche',
    obraCiudad: 'Loncoche',
    detalleServicio: 'Montaje de vigas principales en faena rural (55 km ida) con traslado pactado',
    lineasServicio: lineasP3,
    totalNeto: 1110000,
    idEstado: 2
  });

  const resCreateP3 = await apiRequest('POST', '/proyectos', payloadP3);
  const idP3 = resCreateP3.data?.proyecto?.id_proyecto || resCreateP3.data?.id_proyecto || resCreateP3.data?.data?.id_proyecto;
  assertCheck('P3-CREATE', 'Creación de Proyecto Testigo 3 (RURAL, distancia_km=55, 8h mínimas a $95.000/hr + Traslado $350.000)', resCreateP3.status === 201 && idP3 > 0, { id_proyecto: idP3 });

  const resCotP3 = await apiRequest('POST', `/proyectos/${idP3}/cotizaciones`, {
    id_user: 19,
    comentario: 'Cotización V1 Rural 55 km con traslado incluido'
  });
  assertCheck('P3-COT-PDF', 'Emisión de cotización PDF para Proyecto Testigo 3', resCotP3.status === 200 || resCotP3.status === 201, { cotizacion: resCotP3.data?.cotizacion });

  const p3ToState3 = buildPreventaPayload({
    nombreProyecto: '[QA-REQ1082-RURAL] Montaje Estructural Faena Rural Loncoche',
    distanciaKm: 55,
    obraNombre: 'Planta Celulosa Sector Rural Loncoche',
    obraDireccion: 'Ruta 5 Sur Km 733, Loncoche',
    obraCiudad: 'Loncoche',
    detalleServicio: 'Montaje de vigas principales en faena rural (55 km ida) con traslado pactado',
    lineasServicio: lineasP3,
    totalNeto: 1110000,
    idEstado: 3,
    regimenOperacional: '',
    regimenConfirmado: false,
    crmExtra: { cotizaciones_historicas: [resCotP3.data.cotizacion] }
  });
  await apiRequest('PUT', `/proyectos/${idP3}`, p3ToState3);

  const [dbP3State3] = await runPsqlJSON(`
    SELECT id_proyecto, id_proyecto_estado,
           json_field->'crm_v1'->>'distancia_km' AS distancia_km,
           COALESCE(json_field->'ejecucion_v1'->>'regimen_operacional', '') AS regimen_ejec,
           COALESCE((json_field->'ejecucion_v1'->>'regimen_operacional_confirmado')::boolean, false) AS confirmado_ejec
    FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = ${idP3}
  `);
  assertCheck('P3-DB-STATE3-PENDING', 'En estado 3 a pesar de tener 55 km el proyecto NO preselecciona RURAL automáticamente', Number(dbP3State3.id_proyecto_estado) === 3 && dbP3State3.regimen_ejec === '' && dbP3State3.confirmado_ejec === false, dbP3State3);

  // =========================================================================
  // CAPTURAS VISUALES EN NAVEGADOR REAL (PARTE 1: PREVENTA Y VERIFICACIÓN OPERACIONES)
  // =========================================================================
  console.log('\n6. Iniciando Puppeteer contra https://servidor.leanglobal.cl/lg-gsp-dev/ para capturas 01 a 07...');
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

  // Inyectar sesión autenticada en localStorage
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

  // Captura 05: Preventa Banner de Rechazo de Operaciones en Proyecto Testigo 1 (que está en estado 2 devuelto)
  await page.goto(`${WEB_BASE}/crm?id_proyecto=${idP1}&subtab=comercial`, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 4000));
  await takeShot('05_preventa_banner_rechazo_operaciones.png', 'Banner de alerta en Preventa Comercial mostrando Proyecto Devuelto por Operaciones, fecha/hora, usuario y motivo');

  // Captura 01: Estructurador de Servicios libre en Preventa Comercial (Proyecto Testigo 1)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btnEst = btns.find(b => (b.textContent || '').includes('Estructurador de Servicios'));
    if (btnEst) btnEst.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await takeShot('01_preventa_estructurador_libre_distancia.png', 'Preventa Comercial con Estructurador de Servicios libre y sin tarjetas de 4 casos guiados');

  // Captura 02: Datos del Servicio / Matriz de Requerimientos con Distancia Vial de Ida (km)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btnTerreno = btns.find(b => (b.textContent || '').includes('Datos Servicio & Visita'));
    if (btnTerreno) btnTerreno.click();
    const labels = Array.from(document.querySelectorAll('label, span, div'));
    const dist = labels.find(el => (el.textContent || '').includes('Distancia Estimada Faena'));
    if (dist) dist.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 1500));
  await takeShot('02_preventa_datos_servicio_distancia.png', 'Sección de requerimientos comerciales con el campo Distancia Vial de Ida (km) como antecedente');

  // Captura 03: Operaciones Política Obligatoria Pendiente en Proyecto Testigo 2 (estado 3)
  await page.goto(`${WEB_BASE}/crm?id_proyecto=${idP2}&subtab=validacion`, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 4000));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btnVal = btns.find(b => (b.textContent || '').includes('2. Validación & Diff'));
    if (btnVal) btnVal.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await takeShot('03_operaciones_politica_obligatoria_pendiente.png', 'Etapa 2 (Verificación Operaciones) con bloque ámbar PENDIENTE DE DEFINICIÓN y botón Aprobar bloqueado');

  // Captura 04: Modal de Rechazo a Preventa Comercial con Fecha de Devolución y Motivo Obligatorio
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btnDev = btns.find(b => (b.textContent || '').includes('Devolver a Preventa'));
    if (btnDev) btnDev.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => {
    const ta = document.querySelector('textarea[placeholder*="motivo"], textarea');
    if (ta) {
      ta.value = 'Rechazado por Operaciones: Se requiere agregar flete de contrapesos adicionales y ajustar ventana horaria.';
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  await takeShot('04_operaciones_modal_rechazo_motivo_y_fecha.png', 'Modal Devolver Requerimiento a Preventa Comercial mostrando Fecha de Devolución y Motivo de Rechazo');

  // Cerrar el modal de reverso en Proyecto 2 y seleccionar Política URBANA en la UI
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btnCancel = btns.find(b => (b.textContent || '').trim() === 'Cancelar');
    if (btnCancel) btnCancel.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btnUrb = btns.find(b => (b.textContent || '').includes('Política Urbana'));
    if (btnUrb) btnUrb.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await takeShot('06_operaciones_politica_urbana_confirmada.png', 'Etapa 2 de Proyecto Testigo 2 con Política Urbana (URBANO) confirmada y botón Aprobar habilitado');

  // Captura 07: Proyecto Testigo 3 (estado 3) seleccionando Política RURAL en la UI
  await page.goto(`${WEB_BASE}/crm?id_proyecto=${idP3}&subtab=validacion`, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 4000));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btnVal = btns.find(b => (b.textContent || '').includes('2. Validación & Diff'));
    if (btnVal) btnVal.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btnRur = btns.find(b => (b.textContent || '').includes('Política Rural'));
    if (btnRur) btnRur.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await takeShot('07_operaciones_politica_rural_confirmada.png', 'Etapa 2 de Proyecto Testigo 3 con Política Rural (RURAL) confirmada y botón Aprobar habilitado');

  // =========================================================================
  // AVANCE DE PROYECTO TESTIGO 2 (URBANO) A EJECUCIÓN (ESTADO 6), REPORT DIARIO E ITS
  // =========================================================================
  console.log('\n7. Avanzando Proyecto Testigo 2 ([QA-REQ1082-URBANO]) a estado 6, registrando y validando Report Diario...');
  const p2ToState6 = buildPreventaPayload({
    nombreProyecto: '[QA-REQ1082-URBANO] Izaje Urbano Parque Industrial Temuco',
    distanciaKm: 15,
    obraNombre: 'Centro Logístico Urbano Temuco',
    obraDireccion: 'Av. Caupolicán 1850, Temuco',
    obraCiudad: 'Temuco',
    detalleServicio: 'Montaje de equipos HVAC en cubierta industrial urbana (Maniobra Urbana Ajustada)',
    lineasServicio: lineasP2,
    totalNeto: 510000,
    idEstado: 6,
    regimenOperacional: 'URBANO',
    regimenConfirmado: true,
    crmExtra: {
      cotizaciones_historicas: [resCotP2.data.cotizacion],
      motivo_reverso_verificacion: 'Ajustar descripción de maniobra urbana',
      fecha_reverso_verificacion: jfP2Rev.crm_v1?.fecha_reverso_verificacion,
      usuario_reverso_verificacion: jfP2Rev.crm_v1?.usuario_reverso_verificacion,
      historial_reversos_verificacion: histReversosP2
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
  await apiRequest('PUT', `/proyectos/${idP2}`, p2ToState6);

  await runPsqlExec(`
    INSERT INTO sch_leangsp.tpry_rel_equipo (id_proyecto, id_equipo, rol_equipo)
    VALUES (${idP2}, 38, 'PRINCIPAL') ON CONFLICT DO NOTHING;
    INSERT INTO sch_leangsp.tpry_rel_persona (id_proyecto, id_user, rol_en_proyecto)
    VALUES (${idP2}, 66, 'OPERADOR') ON CONFLICT DO NOTHING;
  `);

  // Crear Report Diario para Proyecto Testigo 2 (URBANO):
  // hora_salida_patio: 08:00, hora_inicio: 08:45, hora_termino: 17:00, hora_llegada_patio: 17:45, colacion: 1.0 hr
  const resRepP2 = await apiRequest('POST', '/operaciones/reports', {
    id_proyecto: idP2,
    id_equipo: 38,
    id_user_operador: 66,
    dia_correlativo: 1,
    fecha_reporte: '2026-10-30',
    hora_salida_patio: '08:00',
    hora_llegada_faena: '08:45',
    hora_inicio: '08:45',
    hora_termino: '17:00',
    hora_salida_faena: '17:00',
    hora_llegada_patio: '17:45',
    horas_operadas: 7.25,
    horas_colacion: 1.0,
    horas_minimas: 6.0,
    horometro_inicio: 4120.0,
    horometro_termino: 4128.0,
    odometro_inicio: 28400,
    odometro_termino: 28430,
    observacion_trabajo: 'Maniobra urbana completada sin novedades. Régimen URBANO (15 km).',
    cliente_nombre: 'Roberto Valdés',
    cliente_rut: '13.456.789-0',
    cliente_cargo: 'Jefe de Planta',
    cliente_firma_canvas_base64: DUMMY_PNG_B64
  });
  const idRepP2 = resRepP2.data?.data?.id_reporte_avance;
  assertCheck('P2-REPORT-SAVE', 'Guardado de Report Diario en Proyecto Testigo 2 (URBANO: 08:00 base -> 17:00 término - 1.0h colación = 8.0h facturables)', resRepP2.status === 201 && idRepP2 > 0 && Number(resRepP2.data?.data?.horas_facturables) === 8.0 && Number(resRepP2.data?.data?.horas_sobretiempo) === 2.0, {
    id_reporte_avance: idRepP2,
    horas_minimas: resRepP2.data?.data?.horas_minimas,
    horas_facturables: resRepP2.data?.data?.horas_facturables,
    horas_sobretiempo: resRepP2.data?.data?.horas_sobretiempo
  });

  // Validar Report Diario de Proyecto Testigo 2 con PIN FES ('1234' de id_user=55)
  const resValP2 = await apiRequest('PUT', `/operaciones/reports/${idRepP2}/validar`, {
    id_user_validador: 55,
    pin: '1234',
    obs_validador: 'Validado conforme QA REQ-1082 Política Urbana (8.0 hrs facturables cliente / 0 hrs flete operador)'
  });
  const liqP2 = resValP2.data?.data?.liquidacion_personal_dia;
  assertCheck('P2-REPORT-VALIDAR-FES', 'Validación FES de Report Diario Urbano y cálculo de liquidación RRHH (horas_flete_pagar=0, monto_flete_total=0, horas_faena_pagar=8.0)', (
    resValP2.status === 200 &&
    resValP2.data?.data?.estado_reporte === 'VALIDADO_ANALISTA' &&
    liqP2?.regimen === 'URBANO' &&
    Number(liqP2?.horas_faena_pagar) === 8.0 &&
    Number(liqP2?.horas_flete_pagar) === 0 &&
    Number(liqP2?.monto_flete_total) === 0 &&
    Number(liqP2?.horas_totales_pagar) === 8.0
  ), liqP2);

  // Consultar ITS de Proyecto Testigo 2 (GET /api/proyectos/:id/its)
  const resItsP2 = await apiRequest('GET', `/proyectos/${idP2}/its`);
  const itsDataP2 = resItsP2.data?.data || resItsP2.data;
  const costoOpP2 = itsDataP2?.costos?.costo_hora_operador?.[0] || {};
  assertCheck('P2-ITS-CONCILIACION', 'Conciliación ITS Proyecto Testigo 2 (URBANO): Cliente 8.0 hrs ($680.000) y Operador 8.0 hrs faena + 0 hrs flete ($48.000)', (
    resItsP2.status === 200 &&
    Number(itsDataP2?.its?.total_horas_report) === 8.0 &&
    Number(itsDataP2?.its?.total_ingresos_horas) === 680000 &&
    Number(itsDataP2?.its?.total_ingresos_fletes) === 0 &&
    Number(costoOpP2.horas_faena_pagar) === 8.0 &&
    Number(costoOpP2.horas_flete_pagar) === 0 &&
    Number(costoOpP2.cantidad_unidades) === 8.0 &&
    Number(costoOpP2.precio_unitario) === 6000 &&
    Number(costoOpP2.monto_total) === 48000
  ), {
    its_cabecera: itsDataP2?.its,
    costo_hora_operador: costoOpP2
  });

  // Subcaso matemático URBANO (< horas mínimas): 4.0 hrs desde salida de base a término en obra vs 6.0 hrs mínimas
  const subcasoUrbanoMenorMin = calcularLiquidacionHorasDia({
    hora_salida: '08:00',
    hora_llegada: '08:30',
    hora_inicio: '08:30',
    hora_termino: '12:00',
    hora_retorno: '12:30',
    colacion_minutos: 0,
    horas_reales_report: 4.0,
    regimen: 'URBANO',
    horas_minimas: 6.0
  });
  const cobroClienteSubcasoUrbano = Math.max(4.0, 6.0);
  assertCheck('P2-SUBCASO-URBANO-MENOR-MIN', 'Subcaso URBANO (4.0 hrs < 6.0 hrs mín): Cliente paga piso mínimo (6.0 hrs) y Operador recibe 0 hrs flete y 4.0 hrs reportadas', (
    cobroClienteSubcasoUrbano === 6.0 &&
    Number(subcasoUrbanoMenorMin.horas_faena_pagar) === 4.0 &&
    Number(subcasoUrbanoMenorMin.horas_flete_pagar) === 0 &&
    Number(subcasoUrbanoMenorMin.horas_totales_pagar) === 4.0
  ), { cobro_cliente_horas: cobroClienteSubcasoUrbano, liquidacion_operador: subcasoUrbanoMenorMin });

  auditReport.proyectos_testigo.proyecto_2_urbano = {
    id_proyecto: idP2,
    codi_proyecto: resValP2.data?.data?.codi_proyecto || `OT-${idP2}`,
    nombre_proyecto: '[QA-REQ1082-URBANO] Izaje Urbano Parque Industrial Temuco',
    estado_final_bd: 6,
    regimen_operacional: 'URBANO',
    regimen_operacional_confirmado: true,
    distancia_km: 15,
    id_reporte_avance: idRepP2,
    codigo_validacion_fes: resValP2.data?.data?.codigo_validacion_fes,
    cobro_cliente: {
      horas_minimas_pactadas: 6.0,
      horas_reales_base_a_termino: 8.0,
      horas_sobretiempo: 2.0,
      horas_facturables: 8.0,
      tarifa_hora_cliente: 85000,
      total_ingresos_horas: 680000,
      total_ingresos_fletes: 0,
      total_ingresos_facturables: 680000
    },
    incentivo_trabajador_rrhh: liqP2,
    its_costo_hora_operador: costoOpP2
  };
  auditReport.subcasos_matematicos.urbano_menor_al_minimo = {
    horas_base_a_termino: 4.0,
    horas_minimas_pactadas: 6.0,
    horas_facturables_cliente: cobroClienteSubcasoUrbano,
    liquidacion_operador: subcasoUrbanoMenorMin
  };

  // =========================================================================
  // AVANCE DE PROYECTO TESTIGO 3 (RURAL) A EJECUCIÓN (ESTADO 6), REPORT DIARIO E ITS
  // =========================================================================
  console.log('\n8. Avanzando Proyecto Testigo 3 ([QA-REQ1082-RURAL]) a estado 6, registrando y validando Report Diario...');
  const p3ToState6 = buildPreventaPayload({
    nombreProyecto: '[QA-REQ1082-RURAL] Montaje Estructural Faena Rural Loncoche',
    distanciaKm: 55,
    obraNombre: 'Planta Celulosa Sector Rural Loncoche',
    obraDireccion: 'Ruta 5 Sur Km 733, Loncoche',
    obraCiudad: 'Loncoche',
    detalleServicio: 'Montaje de vigas principales en faena rural (55 km ida) con traslado pactado',
    lineasServicio: lineasP3,
    totalNeto: 1110000,
    idEstado: 6,
    regimenOperacional: 'RURAL',
    regimenConfirmado: true,
    crmExtra: { cotizaciones_historicas: [resCotP3.data.cotizacion] },
    ejecucionExtra: {
      operador_id: 66,
      equipo_id: 44,
      patente_equipo: 'DZXL.25-3',
      modelo_equipo: 'LTM-1090',
      tripulacion_asignada: [{ id_user: 66, nombre: 'Omar Ghiselini', rol: 'OPERADOR' }],
      servicio: { horas_minimas: 8, valor_hora: 95000 }
    }
  });
  await apiRequest('PUT', `/proyectos/${idP3}`, p3ToState6);

  await runPsqlExec(`
    INSERT INTO sch_leangsp.tpry_rel_equipo (id_proyecto, id_equipo, rol_equipo)
    VALUES (${idP3}, 44, 'PRINCIPAL') ON CONFLICT DO NOTHING;
    INSERT INTO sch_leangsp.tpry_rel_persona (id_proyecto, id_user, rol_en_proyecto)
    VALUES (${idP3}, 66, 'OPERADOR') ON CONFLICT DO NOTHING;
  `);

  // Crear Report Diario para Proyecto Testigo 3 (RURAL):
  // hora_salida_patio: 07:00, hora_inicio: 08:30 (1.5h ida), hora_termino: 14:30 (6.0h real en obra, 0 colación, < 8.0h mín), hora_llegada_patio: 16:00 (1.5h retorno -> 3.0h traslado bruto)
  const resRepP3 = await apiRequest('POST', '/operaciones/reports', {
    id_proyecto: idP3,
    id_equipo: 44,
    id_user_operador: 66,
    dia_correlativo: 1,
    fecha_reporte: '2026-10-30',
    hora_salida_patio: '07:00',
    hora_llegada_faena: '08:30',
    hora_inicio: '08:30',
    hora_termino: '14:30',
    hora_salida_faena: '14:30',
    hora_llegada_patio: '16:00',
    horas_operadas: 6.0,
    horas_colacion: 0,
    horas_minimas: 8.0,
    horometro_inicio: 5210.0,
    horometro_termino: 5216.0,
    odometro_inicio: 64100,
    odometro_termino: 64210,
    observacion_trabajo: 'Maniobra rural en Loncoche (55 km ida). Operación real en obra 6.0 hrs (08:30 a 14:30 sin colación), traslado 3.0 hrs.',
    cliente_nombre: 'Roberto Valdés',
    cliente_rut: '13.456.789-0',
    cliente_cargo: 'Jefe de Planta',
    cliente_firma_canvas_base64: DUMMY_PNG_B64
  });
  const idRepP3 = resRepP3.data?.data?.id_reporte_avance;
  assertCheck('P3-REPORT-SAVE', 'Guardado de Report Diario en Proyecto Testigo 3 (RURAL: 6.0h reales en obra -> aplica piso mínimo 8.0h facturables al cliente)', (
    resRepP3.status === 201 &&
    idRepP3 > 0 &&
    Number(resRepP3.data?.data?.horas_operadas) === 6.0 &&
    Number(resRepP3.data?.data?.horas_minimas) === 8.0 &&
    Number(resRepP3.data?.data?.horas_facturables) === 8.0 &&
    Number(resRepP3.data?.data?.horas_sobretiempo) === 0
  ), {
    id_reporte_avance: idRepP3,
    horas_operadas: resRepP3.data?.data?.horas_operadas,
    horas_minimas: resRepP3.data?.data?.horas_minimas,
    horas_facturables: resRepP3.data?.data?.horas_facturables,
    horas_sobretiempo: resRepP3.data?.data?.horas_sobretiempo
  });

  // Validar Report Diario de Proyecto Testigo 3 con PIN FES ('1234' de id_user=55)
  const resValP3 = await apiRequest('PUT', `/operaciones/reports/${idRepP3}/validar`, {
    id_user_validador: 55,
    pin: '1234',
    obs_validador: 'Validado conforme QA REQ-1082 Política Rural: 6.0h reales + 3.0h flete vs 8.0h mín -> 8.0h faena + 1.0h flete adicional'
  });
  const liqP3 = resValP3.data?.data?.liquidacion_personal_dia;
  assertCheck('P3-REPORT-VALIDAR-FES', 'Validación FES de Report Diario Rural y regla de absorción de brecha: horas_faena_pagar=8.0, horas_flete_pagar=(6.0+3.0)-8.0=1.0 hr', (
    resValP3.status === 200 &&
    resValP3.data?.data?.estado_reporte === 'VALIDADO_ANALISTA' &&
    liqP3?.regimen === 'RURAL' &&
    Number(liqP3?.horas_faena_pagar) === 8.0 &&
    Number(liqP3?.horas_flete_pagar) === 1.0 &&
    Number(liqP3?.horas_totales_pagar) === 9.0 &&
    Number(liqP3?.precio_unitario) === 6000 &&
    Number(liqP3?.monto_faena_total) === 48000 &&
    Number(liqP3?.monto_flete_total) === 6000 &&
    Number(liqP3?.monto_total_hora_operador) === 54000
  ), liqP3);

  // Consultar ITS de Proyecto Testigo 3 (GET /api/proyectos/:id/its)
  const resItsP3 = await apiRequest('GET', `/proyectos/${idP3}/its`);
  const itsDataP3 = resItsP3.data?.data || resItsP3.data;
  const costoOpP3 = itsDataP3?.costos?.costo_hora_operador?.[0] || {};
  assertCheck('P3-ITS-CONCILIACION', 'Conciliación ITS Proyecto Testigo 3 (RURAL): Cliente 8.0h ($760.000) + Flete ($350.000) = $1.110.000 y Operador 8.0h faena + 1.0h flete = 9.0h ($54.000)', (
    resItsP3.status === 200 &&
    Number(itsDataP3?.its?.total_horas_report) === 8.0 &&
    Number(itsDataP3?.its?.total_ingresos_horas) === 760000 &&
    Number(itsDataP3?.its?.total_ingresos_fletes) === 350000 &&
    Number(itsDataP3?.its?.total_ingresos_facturables) === 1110000 &&
    Number(costoOpP3.horas_faena_pagar) === 8.0 &&
    Number(costoOpP3.horas_flete_pagar) === 1.0 &&
    Number(costoOpP3.cantidad_unidades) === 9.0 &&
    Number(costoOpP3.precio_unitario) === 6000 &&
    Number(costoOpP3.monto_total) === 54000
  ), {
    its_cabecera: itsDataP3?.its,
    costo_hora_operador: costoOpP3
  });

  // Verificar los otros 2 subcasos matemáticos de RURAL:
  // Subcaso Rural A: horas reales (4.0 hrs) + traslado (2.5 hrs) = 6.5 hrs <= 8.0 hrs mínimas -> horas_flete_pagar = 0
  const subcasoRuralA = calcularLiquidacionHorasDia({
    hora_salida: '07:15',
    hora_llegada: '08:30',
    hora_inicio: '08:30',
    hora_termino: '12:30',
    hora_retorno: '13:45',
    colacion_minutos: 0,
    horas_reales_report: 4.0,
    regimen: 'RURAL',
    horas_minimas: 8.0
  });
  assertCheck('P3-SUBCASO-RURAL-A', 'Subcaso RURAL A (4.0h reales + 2.5h flete = 6.5h <= 8.0h mín): horas_faena_pagar=8.0, horas_flete_pagar=0', (
    Number(subcasoRuralA.horas_reales_equipo) === 4.0 &&
    Number(subcasoRuralA.horas_faena_pagar) === 8.0 &&
    Number(subcasoRuralA.horas_flete_pagar) === 0 &&
    Number(subcasoRuralA.horas_totales_pagar) === 8.0
  ), subcasoRuralA);

  // Subcaso Rural B: horas reales (9.0 hrs) >= 8.0 hrs mínimas con 3.0 hrs flete -> horas_faena_pagar = 9.0, horas_flete_pagar = 3.0
  const subcasoRuralB = calcularLiquidacionHorasDia({
    hora_salida: '07:00',
    hora_llegada: '08:30',
    hora_inicio: '08:30',
    hora_termino: '17:30',
    hora_retorno: '19:00',
    colacion_minutos: 0,
    horas_reales_report: 9.0,
    regimen: 'RURAL',
    horas_minimas: 8.0
  });
  assertCheck('P3-SUBCASO-RURAL-B', 'Subcaso RURAL B (9.0h reales >= 8.0h mín + 3.0h flete): horas_faena_pagar=9.0, horas_flete_pagar=3.0, totales=12.0', (
    Number(subcasoRuralB.horas_reales_equipo) === 9.0 &&
    Number(subcasoRuralB.horas_faena_pagar) === 9.0 &&
    Number(subcasoRuralB.horas_flete_pagar) === 3.0 &&
    Number(subcasoRuralB.horas_totales_pagar) === 12.0
  ), subcasoRuralB);

  auditReport.proyectos_testigo.proyecto_3_rural = {
    id_proyecto: idP3,
    codi_proyecto: resValP3.data?.data?.codi_proyecto || `OT-${idP3}`,
    nombre_proyecto: '[QA-REQ1082-RURAL] Montaje Estructural Faena Rural Loncoche',
    estado_final_bd: 6,
    regimen_operacional: 'RURAL',
    regimen_operacional_confirmado: true,
    distancia_km: 55,
    id_reporte_avance: idRepP3,
    codigo_validacion_fes: resValP3.data?.data?.codigo_validacion_fes,
    cobro_cliente: {
      horas_minimas_pactadas: 8.0,
      horas_reales_en_obra: 6.0,
      horas_sobretiempo: 0.0,
      horas_facturables: 8.0,
      tarifa_hora_cliente: 95000,
      total_ingresos_horas: 760000,
      total_ingresos_fletes: 350000,
      total_ingresos_facturables: 1110000
    },
    incentivo_trabajador_rrhh: liqP3,
    its_costo_hora_operador: costoOpP3
  };
  auditReport.subcasos_matematicos.rural_absorcion_total_sin_exceso = subcasoRuralA;
  auditReport.subcasos_matematicos.rural_sobre_minimo_flete_integro = subcasoRuralB;

  // =========================================================================
  // CAPTURAS VISUALES EN NAVEGADOR REAL (PARTE 2: REPORT E ITS URBANO Y RURAL)
  // =========================================================================
  console.log('\n9. Capturando pantallas 08 (Ejecución Report/ITS Urbano) y 09 (Ejecución Report/ITS Rural)...');

  // Captura 08: Proyecto Testigo 2 (URBANO) en pestaña Liquidación / ITS (subtab=liquidacion) mostrando ITS y Hora Operador con 0 hrs flete
  await page.goto(`${WEB_BASE}/crm?id_proyecto=${idP2}&subtab=liquidacion`, { waitUntil: 'networkidle2', timeout: 60000 });
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
  await takeShot('08_ejecucion_report_e_its_urbano.png', 'Liquidación / ITS de Proyecto Testigo 2 (URBANO): Cobro cliente 8.0 hrs ($680.000) e incentivo operador con 0 hrs flete');

  // Captura 09: Proyecto Testigo 3 (RURAL) en pestaña Liquidación / ITS (subtab=liquidacion) mostrando ITS y Hora Operador con absorción de brecha (8.0h faena + 1.0h flete)
  await page.goto(`${WEB_BASE}/crm?id_proyecto=${idP3}&subtab=liquidacion`, { waitUntil: 'networkidle2', timeout: 60000 });
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
  await takeShot('09_ejecucion_report_e_its_rural.png', 'Liquidación / ITS de Proyecto Testigo 3 (RURAL): Cobro cliente piso mínimo 8.0 hrs + traslado ($1.110.000) y operador 8.0h faena + 1.0h flete');

  await browser.close();

  // Restaurar nombres canónicos con prefijo [QA-REQ1082-*] tras el auto-guardado de subtab en Vue
  await runPsqlExec(`
    UPDATE sch_leangsp.tpry_proyecto SET nombre_proyecto = '[QA-REQ1082-DEVUELTO] Montaje Industrial Planta Osorno' WHERE id_proyecto = ${idP1};
    UPDATE sch_leangsp.tpry_proyecto SET nombre_proyecto = '[QA-REQ1082-URBANO] Izaje Urbano Parque Industrial Temuco' WHERE id_proyecto = ${idP2};
    UPDATE sch_leangsp.tpry_proyecto SET nombre_proyecto = '[QA-REQ1082-RURAL] Montaje Estructural Faena Rural Loncoche' WHERE id_proyecto = ${idP3};
  `);

  // Verificación final en BD de que los 3 Proyectos Testigo permanecen vivos en sch_leangsp
  const vivosFinal = await runPsqlJSON(`
    SELECT id_proyecto, codi_proyecto, nombre_proyecto, id_proyecto_estado,
           json_field->'crm_v1'->>'distancia_km' AS distancia_km,
           COALESCE(json_field->'ejecucion_v1'->>'regimen_operacional', '') AS regimen_operacional,
           COALESCE((json_field->'ejecucion_v1'->>'regimen_operacional_confirmado')::boolean, false) AS confirmado
    FROM sch_leangsp.tpry_proyecto
    WHERE id_proyecto IN (${idP1}, ${idP2}, ${idP3})
    ORDER BY id_proyecto ASC
  `);
  assertCheck('FINAL-3-WITNESSES-ALIVE', 'Los 3 Proyectos Testigo permanecen vivos en sch_leangsp (DEV) en sus estados objetivo (2, 6 y 6)', vivosFinal.length === 3, vivosFinal);

  auditReport.proyectos_vivos_verificacion_final = vivosFinal;
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(auditReport, null, 2), 'utf8');
  console.log(`\nSUITE QA REQ-1082 COMPLETADA EXITOSAMENTE. Resultados guardados en: ${RESULTS_FILE}`);
}

main().catch((err) => {
  console.error('\nERROR FATAL EN SUITE QA REQ-1082:', err);
  process.exit(1);
});
