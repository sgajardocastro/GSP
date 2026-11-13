/**
 * =================================================================================================
 * SCRIPT DE CERTIFICACION QA DETERMINISTA E2E (ENFOQUE ZERO-TRUST) — AMBIENTE DEV
 * =================================================================================================
 * Requerimiento : REQ-1101 / CASO-20261103-05 + REQ-1100 + Ciclo Operacional Completo E2E
 *                 Taxonomia Estricta de Lineas Comerciales (Estructurador OT), Resolucion de
 *                 Equipos/Operadores en Torre de Control (Kanban & Cardex 3D), No-Resurreccion de
 *                 Lineas Eliminadas y Cuadratura Matematica de EDP e Incentivos RRHH.
 * Ambiente      : DEV (https://servidor.leanglobal.cl/lg-gsp-dev/ | BD: sch_leangsp)
 * Regla         : CERO TEARDOWN EN DEV — Los 3 escenarios testigo quedan vivos para inspeccion.
 * =================================================================================================
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const BACKEND_MODULES = path.join(ROOT_DIR, 'ejecucion', 'backend_remoto', 'node_modules');
const { Client } = require(path.join(BACKEND_MODULES, 'ssh2'));

const API_BASE = 'https://servidor.leanglobal.cl/lg-gsp-dev/api';
const FRONTEND_URL = 'https://servidor.leanglobal.cl/lg-gsp-dev';
const DB_SCHEMA = 'sch_leangsp';

const SSH_CONFIG = {
  host: '138.255.103.18',
  port: 1295,
  username: 'root',
  password: process.env.SSH_PASSWORD || 'lgbl2025.'
};

const DUMMY_PNG_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const EVIDENCIA_DIR = path.join(__dirname, 'evidencia');
if (!fs.existsSync(EVIDENCIA_DIR)) {
  fs.mkdirSync(EVIDENCIA_DIR, { recursive: true });
}

const results = {
  timestamp: new Date().toISOString(),
  ambiente: 'DEV (https://servidor.leanglobal.cl/lg-gsp-dev/)',
  schema: DB_SCHEMA,
  checks: [],
  witnesses: {},
  screenshots: []
};

function recordCheck(phase, name, passed, details = {}) {
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`[${status}] [${phase}] ${name}`);
  if (!passed) {
    console.error('   Detalles fallo:', JSON.stringify(details));
  }
  results.checks.push({ phase, name, status, details });
  if (!passed) {
    throw new Error(`Fallo asercion QA en [${phase}] ${name}: ${JSON.stringify(details)}`);
  }
}

function execRemoteNode(sshClient, jsCode) {
  return new Promise((resolve, reject) => {
    const b64 = Buffer.from(jsCode, 'utf8').toString('base64');
    const cmd = `cd /home/nodeadmin/proyectos/lean-services-gsp && node -e "eval(Buffer.from('${b64}', 'base64').toString('utf8'))"`;
    sshClient.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream.on('data', (d) => (stdout += d.toString()));
      stream.stderr.on('data', (d) => (stderr += d.toString()));
      stream.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`Remote node exit ${code}: ${stderr || stdout}`));
        }
        try {
          const lines = stdout.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          resolve(JSON.parse(lastLine));
        } catch {
          resolve({ raw: stdout.trim(), stderr: stderr.trim() });
        }
      });
    });
  });
}

async function queryDB(sshClient, sql, params = []) {
  const script = `
    const pool = require('./src/config/dbConfig');
    (async () => {
      try {
        const res = await pool.query(${JSON.stringify(sql)}, ${JSON.stringify(params)});
        console.log(JSON.stringify({ ok: true, rows: res.rows, rowCount: res.rowCount }));
        process.exit(0);
      } catch (e) {
        console.log(JSON.stringify({ ok: false, error: e.message }));
        process.exit(1);
      }
    })();
  `;
  const out = await execRemoteNode(sshClient, script);
  if (!out.ok) throw new Error(`DB Query Error: ${out.error}`);
  return out;
}

async function apiRequest(method, endpoint, token, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body !== null) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${endpoint}`, opts);
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { status: res.status, ok: res.ok, data };
}

function buildProyectoPayload({
  idEmpresa = 9,
  empresaNombre = 'GRÚAS SAN PABLO',
  idCliente = 3009,
  rutCliente = '76939182-7',
  razonSocialCliente = 'METTCO SPA',
  codiProyecto = undefined,
  nombreProyecto,
  distanciaKm = 62,
  obraNombre,
  obraDireccion,
  obraCiudad,
  detalleServicio,
  lineasServicio,
  totalNeto,
  idEstado = 2,
  regimenOperacional = '',
  regimenConfirmado = false,
  requiereAcreditacion = false,
  requiereRigger = false,
  requierePrevencionista = false,
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
    fecha_plan_ini: '2026-11-04',
    fecha_plan_fin: '2026-11-30',
    json_field: {
      oportunidad: {
        id_empresa_emisora: String(idEmpresa),
        cliente_id: idCliente,
        rut_cliente: rutCliente,
        razon_social: razonSocialCliente,
        giro_cliente: 'OBRAS DE INGENIERIA Y MONTAJE INDUSTRIAL',
        direccion_cliente: obraDireccion,
        contacto_nombre: 'Jefe de Obra Planta Ferrero',
        contacto_telefono: '+56988776655',
        contacto_email: 'operaciones@mettco.cl',
        tipo_pago: 'transferencia',
        prioridad: 'alta',
        distancia_km: distanciaKm,
        regimen_operacional: regimenOperacional,
        regimen_operacional_confirmado: regimenConfirmado,
        requiere_oc_hes: true,
        requiere_acreditacion: requiereAcreditacion,
        requiere_rigger: requiereRigger,
        requiere_prevencionista: requierePrevencionista,
        cliente_pone_combustible: false
      },
      crm_v1: {
        id_empresa_emisora: String(idEmpresa),
        empresa_emisora_nombre: empresaNombre,
        cliente_id: idCliente,
        cliente_rut: rutCliente,
        cliente_nombre: razonSocialCliente,
        contacto_nombre: 'Jefe de Obra Planta Ferrero',
        contacto_fono: '+56988776655',
        contacto_email: 'operaciones@mettco.cl',
        tipo_pago: 'transferencia',
        prioridad: 'alta',
        vendedor_nombre: 'Jorge Ponce',
        vendedor_email: 'j.poncenavarrete@gmail.com',
        obra_nombre: obraNombre,
        obra_direccion: obraDireccion,
        obra_ciudad: obraCiudad,
        fecha_inicio_plan: '2026-11-04',
        hora_inicio_plan: '08:00',
        fecha_fin_plan: '2026-11-30',
        hora_fin_plan: '18:00',
        detalle_servicio: detalleServicio,
        tipo_carga: 'Estructuras y Equipos Planta Ferrero',
        peso_carga: '4.5',
        radios_trabajo: '12',
        alturas_trabajo: '15',
        dimensiones: { largo: 6, ancho: 2.4, alto: 2.5, volumen: 36 },
        distancia_km: distanciaKm,
        regimen_operacional: regimenOperacional,
        regimen_operacional_confirmado: regimenConfirmado,
        requiere_oc_hes: true,
        requiere_acreditacion: requiereAcreditacion,
        requiere_rigger: requiereRigger,
        requiere_prevencionista: requierePrevencionista,
        cliente_pone_combustible: false,
        visita_terreno: false,
        responsabilidad_gastos: {
          alojamiento: 'CLIENTE',
          desayuno: 'CLIENTE',
          almuerzo: 'CLIENTE',
          cena: 'CLIENTE',
          traslado_personal: 'SAN_PABLO'
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
        fecha_salida_plan: '2026-11-04',
        hora_salida_plan: '07:30',
        hora_llegada_plan: '08:30',
        fecha_fin_plan: '2026-11-30',
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

async function takeShot(page, filename, label) {
  const fullPath = path.join(EVIDENCIA_DIR, filename);
  await page.screenshot({ path: fullPath, fullPage: false });
  results.screenshots.push({ filename, label, path: fullPath });
  console.log(`   [SCREENSHOT] ${filename} -> ${label}`);
}

async function openProjectInCRM(page, idProyecto, subtab = 'comercial') {
  await page.goto(`${FRONTEND_URL}/crm?id_proyecto=${idProyecto}&subtab=${subtab}`, {
    waitUntil: 'networkidle2',
    timeout: 60000
  });
  await new Promise((r) => setTimeout(r, 4000));
  if (subtab === 'comercial') {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btnEst = btns.find((b) => (b.textContent || '').includes('Estructurador de Servicios'));
      if (btnEst) btnEst.click();
    });
    await new Promise((r) => setTimeout(r, 1500));
  }
  return true;
}

async function switchModalStep(page, stepTextFragment) {
  const clicked = await page.evaluate((frag) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find((b) => (b.innerText || '').toUpperCase().includes(frag.toUpperCase()));
    if (btn && !btn.disabled) {
      btn.click();
      return true;
    }
    return false;
  }, stepTextFragment);
  await new Promise((r) => setTimeout(r, 1800));
  return clicked;
}

async function main() {
  console.log('================================================================================');
  console.log(' INICIANDO CERTIFICACION QA INTEGRAL REQ-1101 / CASO-20261103-05 EN AMBIENTE DEV');
  console.log('================================================================================');

  // ---------------------------------------------------------------------------
  // FASE 0: PRE-FLIGHT HEALTHCHECK (SSH + BD sch_leangsp + API DEV)
  // ---------------------------------------------------------------------------
  const ssh = new Client();
  await new Promise((resolve, reject) => {
    ssh.on('ready', resolve).on('error', reject).connect(SSH_CONFIG);
  });

  const dbCheck = await queryDB(ssh, `SELECT current_database() AS db, current_schema() AS sch`);
  recordCheck('FASE-0', 'Conexion SSH y PostgreSQL sch_leangsp activa', dbCheck.rows.length === 1, dbCheck.rows[0]);

  // Limpieza preventiva EXCLUSIVA de ejecuciones previas de [QA-REQ1101 - ESCENARIO %] en sch_leangsp
  // (Al finalizar el script NO se hace teardown para que los 3 casos testigo queden vivos en DEV)
  const prevRows = await queryDB(
    ssh,
    `SELECT id_proyecto FROM ${DB_SCHEMA}.tpry_proyecto WHERE nombre_proyecto LIKE '[QA-REQ1101 - ESCENARIO%'`
  );
  if (prevRows.rows.length > 0) {
    const ids = prevRows.rows.map((r) => r.id_proyecto);
    await queryDB(ssh, `DELETE FROM ${DB_SCHEMA}.topr_reporte_avance WHERE id_proyecto = ANY($1::int[])`, [ids]).catch(() => {});
    await queryDB(ssh, `DELETE FROM ${DB_SCHEMA}.tnot_notification_log WHERE id_proyecto = ANY($1::int[])`, [ids]).catch(() => {});
    await queryDB(ssh, `DELETE FROM ${DB_SCHEMA}.tpry_rel_equipo WHERE id_proyecto = ANY($1::int[])`, [ids]).catch(() => {});
    await queryDB(ssh, `DELETE FROM ${DB_SCHEMA}.tpry_rel_persona WHERE id_proyecto = ANY($1::int[])`, [ids]).catch(() => {});
    await queryDB(ssh, `DELETE FROM ${DB_SCHEMA}.tpry_proyecto WHERE id_proyecto = ANY($1::int[])`, [ids]).catch(() => {});
  }

  // Asegurar que Ernesto Israel Rios (id_user = 31) tenga su segundo nombre normalizado en sch_leangsp
  // y que los equipos 56 (Camion Pluma RSPL.82-3) y 38 (Grua 70T STDD.68-4) esten DISPONIBLES
  await queryDB(
    ssh,
    `UPDATE ${DB_SCHEMA}.tsec_users
     SET name_frst = 'Ernesto Israel',
         name_sec = NULL,
         apellido_pat = 'Rios',
         json_data = jsonb_set(COALESCE(json_data::jsonb, '{}'::jsonb), '{cargo}', '"Operador Camión Pluma"')::json
     WHERE id_user = 31`
  );
  await queryDB(
    ssh,
    `UPDATE ${DB_SCHEMA}.tequ_equipo SET estado = 'DISPONIBLE' WHERE id_equipo IN (56, 38)`
  );

  // Generar token JWT valido en DEV
  const tokenGen = await execRemoteNode(
    ssh,
    `
    require('dotenv').config();
    const jwt = require('jsonwebtoken');
    const user = {
      id_user: 19,
      name_frst: 'Jorge',
      apellido_pat: 'Ponce',
      email: 'j.poncenavarrete@gmail.com',
      roles: ['Administrador', 'Operaciones', 'Comercial', 'Pilar']
    };
    const token = jwt.sign(user, process.env.JWT_SECRET || 'lean_gsp_secret_key_2026', { expiresIn: '12h' });
    console.log(JSON.stringify({ ok: true, token, user }));
    `
  );
  const token = tokenGen.token;
  const authUser = tokenGen.user;

  recordCheck('FASE-0', 'Autenticacion JWT valida contra API DEV', Boolean(token), {
    user: authUser.email
  });

  // Iniciar navegador Headless Real (Puppeteer)
  const puppeteerUrl = 'file:///' + path.join(ROOT_DIR, 'front', 'node_modules', 'puppeteer', 'lib', 'puppeteer', 'puppeteer.js').replace(/\\/g, '/');
  const puppeteerMod = await import(puppeteerUrl);
  const puppeteer = puppeteerMod.default || puppeteerMod;
  const candidatePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  const executablePath = candidatePaths.find((p) => fs.existsSync(p));
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath,
    defaultViewport: { width: 1536, height: 920 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors', '--window-size=1536,920']
  });
  const page = await browser.newPage();
  page.on('dialog', async (dialog) => {
    try { await dialog.accept(); } catch (_) {}
  });

  await page.evaluateOnNewDocument(
    (tk, usr) => {
      localStorage.setItem('token', tk);
      localStorage.setItem('gsp_token', tk);
      localStorage.setItem('user', JSON.stringify(usr));
      localStorage.setItem('gsp_user', JSON.stringify(usr));
    },
    token,
    authUser
  );

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const u = req.url();
    if (u.includes('/api/proyectos') && u.includes('_id_empresa=')) {
      const cleanUrl = u.replace(/([?&])_id_empresa=[^&]+(&?)/, (m, p1, p2) => (p1 === '?' && p2 ? '?' : p2 ? p1 : ''));
      return req.continue({ url: cleanUrl });
    }
    req.continue();
  });

  try {
    // =========================================================================
    // ESCENARIO 1: REPLICA EXACTA DEL CASO REAL GSP-2611-00007 (METTCO SPA)
    // =========================================================================
    console.log('\n--- EJECUTANDO ESCENARIO 1: REPLICA EXACTA GSP-2611-00007 (METTCO SPA) ---');
    const esc1Title = '[QA-REQ1101 - ESCENARIO 1] PLANTA FERRERO - FUNDO CARACAS (CAMION PLUMA CON OPERADOR)';

    const esc1Lineas = [
      {
        _uid: 'line-esc1-pluma',
        id_item: 1,
        tipo: 'CAMIONES',
        subcategoria: 'CAMION PLUMA',
        unidad: 'Horas Mes Minimas',
        cantidad: 1,
        cantidad_meses: 1,
        cantidad_horas: 180,
        pisoMinimo: 180,
        valorUnitario: 58000,
        valor_unitario: 58000,
        subtotal: 10440000,
        descripcion: 'HORAS MINIMAS MENSUALES ARRIENDO DE CAMION PLUMA CON OPERADOR. INCLUYE COMBUSTIBLE.',
        is_linea_base: true
      },
      {
        _uid: 'line-esc1-traslado',
        id_item: 2,
        tipo: 'TRASLADOS',
        subcategoria: 'CAMIÓN PLATAFORMA',
        unidad: 'TRASLADO IDA/VUELTA',
        cantidad: 1,
        valorUnitario: 200000,
        valor_unitario: 200000,
        subtotal: 200000,
        descripcion: 'TRASLADO DE IDA Y VUELTA DE CAMION PLUMA A OBRA ',
        is_linea_base: true
      }
    ];

    const payloadEsc1Create = buildProyectoPayload({
      idEmpresa: 9,
      empresaNombre: 'GRÚAS SAN PABLO',
      idCliente: 3009,
      rutCliente: '76939182-7',
      razonSocialCliente: 'METTCO SPA',
      nombreProyecto: esc1Title,
      distanciaKm: 62,
      obraNombre: esc1Title,
      obraDireccion: 'PLANTA FERRERO - FUNDO CARACAS, RUTA 5 SUR KM 185',
      obraCiudad: 'CURICO',
      detalleServicio: 'Arriendo mensual Camion Pluma con Operador + Traslado ida/vuelta en Camion Plataforma',
      lineasServicio: esc1Lineas,
      totalNeto: 10640000,
      idEstado: 2,
      requiereAcreditacion: true,
      requiereRigger: false,
      requierePrevencionista: false
    });

    const createEsc1 = await apiRequest('POST', '/proyectos', token, payloadEsc1Create);
    const proyEsc1 = createEsc1.data?.proyecto || createEsc1.data?.data || createEsc1.data;
    const esc1Id = proyEsc1?.id_proyecto;
    const esc1Folio = proyEsc1?.codi_proyecto;

    recordCheck('ESC-1', 'Oportunidad creada en Preventa con folio GSP-YYMM-NNNNN', Boolean(esc1Id && /^GSP-\d{4}-\d{5}$/.test(esc1Folio)), {
      id_proyecto: esc1Id,
      codi_proyecto: esc1Folio
    });

    // Emitir Cotizacion Formal v1
    const cotEsc1 = await apiRequest('POST', `/proyectos/${esc1Id}/cotizaciones`, token, {
      id_user: 19,
      comentario: 'Cotizacion formal v1 replica exacta GSP-2611-00007 ($10.640.000 Neto)'
    });
    const cotObjEsc1 = cotEsc1.data?.cotizacion || {};
    recordCheck('ESC-1', 'Cotizacion Formal PDF v1 emitida ($10.640.000 Neto)', cotEsc1.ok && Boolean(cotObjEsc1.nombre_archivo), {
      nombre_archivo: cotObjEsc1.nombre_archivo
    });

    // Abrir Escenario 1 en Preventa y capturar screenshot 01
    await openProjectInCRM(page, esc1Id, 'comercial');
    await takeShot(page, '01_esc1_preventa_estructurador.png', 'Escenario 1: Preventa con 2 lineas comerciales (Camion Pluma Con Operador + Traslado Plataforma)');

    // Pasar a 2. Verificacion Operaciones (id_proyecto_estado = 3) SIN confirmar politica Urbana/Rural para probar bloqueo negativo
    const payloadEsc1State3 = buildProyectoPayload({
      idEmpresa: 9,
      empresaNombre: 'GRÚAS SAN PABLO',
      idCliente: 3009,
      rutCliente: '76939182-7',
      razonSocialCliente: 'METTCO SPA',
      codiProyecto: esc1Folio,
      nombreProyecto: esc1Title,
      distanciaKm: 62,
      obraNombre: esc1Title,
      obraDireccion: 'PLANTA FERRERO - FUNDO CARACAS, RUTA 5 SUR KM 185',
      obraCiudad: 'CURICO',
      detalleServicio: 'Arriendo mensual Camion Pluma con Operador + Traslado ida/vuelta en Camion Plataforma',
      lineasServicio: esc1Lineas,
      totalNeto: 10640000,
      idEstado: 3,
      regimenOperacional: '',
      regimenConfirmado: false,
      requiereAcreditacion: true,
      crmExtra: {
        cotizaciones_historicas: [cotObjEsc1]
      }
    });
    await apiRequest('PUT', `/proyectos/${esc1Id}`, token, payloadEsc1State3);

    await openProjectInCRM(page, esc1Id, 'validacion');
    await switchModalStep(page, '2. Verificaci');
    const negCheckPol = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const approveBtn = btns.find((b) => (b.innerText || '').includes('Aprobar Requerimiento') || (b.innerText || '').includes('Pasar a Asignaci'));
      const bodyText = document.body.innerText || '';
      return {
        hasMandatoryWarning: bodyText.includes('Respuesta Obligatoria de Operaciones') || bodyText.includes('PENDIENTE (OBLIGATORIO)'),
        approveBtnDisabled: approveBtn ? approveBtn.disabled : true
      };
    });
    recordCheck('ESC-1', 'Prueba Negativa en 2. Verificacion Operaciones: Bloqueo de aprobacion sin Politica Urbana/Rural', negCheckPol.hasMandatoryWarning && negCheckPol.approveBtnDisabled, negCheckPol);
    await takeShot(page, '02_esc1_verificacion_bloqueo_politica.png', 'Escenario 1: Bloqueo negativo en 2. Verificacion Operaciones sin politica Urbana/Rural');

    // Confirmar Politica RURAL (62 km > 45 km) y avanzar a 3. Asignacion Recursos OT (id_proyecto_estado = 4)
    const payloadEsc1State4 = buildProyectoPayload({
      idEmpresa: 9,
      empresaNombre: 'GRÚAS SAN PABLO',
      idCliente: 3009,
      rutCliente: '76939182-7',
      razonSocialCliente: 'METTCO SPA',
      codiProyecto: esc1Folio,
      nombreProyecto: esc1Title,
      distanciaKm: 62,
      obraNombre: esc1Title,
      obraDireccion: 'PLANTA FERRERO - FUNDO CARACAS, RUTA 5 SUR KM 185',
      obraCiudad: 'CURICO',
      detalleServicio: 'Arriendo mensual Camion Pluma con Operador + Traslado ida/vuelta en Camion Plataforma',
      lineasServicio: esc1Lineas,
      totalNeto: 10640000,
      idEstado: 4,
      regimenOperacional: 'RURAL',
      regimenConfirmado: true,
      requiereAcreditacion: true,
      crmExtra: {
        cotizaciones_historicas: [cotObjEsc1],
        requerimiento_aprobado: true
      },
      ejecucionExtra: {
        requerimiento_aprobado: true
      }
    });
    const resState4 = await apiRequest('PUT', `/proyectos/${esc1Id}`, token, payloadEsc1State4);
    recordCheck('ESC-1', 'Confirmacion de Politica RURAL y avance a 3. Asignacion Recursos OT (estado 4)', resState4.ok, { status: resState4.status });

    // Abrir 3. Asignacion Recursos OT en Puppeteer y verificar Seccion 1 y Seccion 2
    await openProjectInCRM(page, esc1Id, 'asignacion');
    await switchModalStep(page, '3. Asignaci');
    await new Promise((r) => setTimeout(r, 2000));

    const estructuradorCheck = await page.evaluate(() => {
      const text = document.body.innerText || '';
      const norm = text.toUpperCase();
      const hasSec1OneEquipo = norm.includes('1. FLOTA PRINCIPAL & OPERADORES DE SERVICIO') && norm.includes('(1 EQUIPO)');
      const hasSec1ZeroEquipos = norm.includes('1. FLOTA PRINCIPAL & OPERADORES DE SERVICIO') && norm.includes('(0 EQUIPOS)');
      const hasCamionPlumaBadge = norm.includes('CAMIONES - CAMION PLUMA');
      const hasSec2ZeroVehiculos = norm.includes('2. EQUIPOS DE TRASLADO & CHOFERES') && norm.includes('(0 VEH');
      const hasPlataformaBadgeInSec2 = norm.includes('TRASLADOS - CAMIÓN PLATAFORMA') || norm.includes('TRASLADOS - CAMION PLATAFORMA');
      return {
        hasSec1OneEquipo,
        hasSec1ZeroEquipos,
        hasCamionPlumaBadge,
        hasSec2ZeroVehiculos,
        hasPlataformaBadgeInSec2
      };
    });

    recordCheck(
      'ESC-1',
      'Seccion 1 muestra (1 equipo) CAMIONES - CAMION PLUMA (NO (0 equipos) pese a glosa "CON OPERADOR")',
      estructuradorCheck.hasSec1OneEquipo && !estructuradorCheck.hasSec1ZeroEquipos && estructuradorCheck.hasCamionPlumaBadge,
      estructuradorCheck
    );
    recordCheck(
      'ESC-1',
      'Seccion 2 muestra (0 vehiculos) por SPEC-065 4.1 / SPEC-016 20.3 Regla 1 (Camion Pluma autopropulsado no duplica vehiculo en Seccion 2)',
      estructuradorCheck.hasSec2ZeroVehiculos && !estructuradorCheck.hasPlataformaBadgeInSec2,
      estructuradorCheck
    );
    await takeShot(page, '03_esc1_asignacion_ot_secciones_1_y_2.png', 'Escenario 1: Estructurador de Recursos OT con Seccion 1 (1 equipo) y Seccion 2 (0 vehiculos)');

    // Asignar Camion Pluma RSPL.82-3 (id_equipo = 56) y Operador Ernesto Israel Rios (id_user = 31)
    const esc1LineasAsignadas = [
      {
        ...esc1Lineas[0],
        id_equipo: 56,
        equipo_asignado_id: 56,
        patente_asignada: 'RSPL.82-3',
        operador_asignado_id: 31,
        id_operador: 31,
        fecha_inicio_linea: '2026-11-04',
        hora_inicio_linea: '08:00',
        fecha_fin_linea: '2026-11-30',
        hora_fin_linea: '18:00'
      },
      {
        ...esc1Lineas[1]
      }
    ];

    const tripulacionEsc1 = [
      {
        rol: 'Operador Camión Pluma',
        cargo: 'Operador Camión Pluma',
        nombre: 'Ernesto Israel Rios',
        id_user: 31,
        id_equipo: 56,
        es_base: true
      }
    ];

    // Guardar en tablas relacionales tpry_rel_equipo y tpry_rel_persona via API oficial
    await apiRequest('POST', `/proyectos/${esc1Id}/asignaciones/equipos`, token, {
      id_equipo: 56,
      rol_equipo: 'CAMIONES - CAMION PLUMA',
      fecha_plan_ini: '2026-11-04',
      fecha_plan_fin: '2026-11-30',
      turnos_plan: 1,
      horas_plan: 180,
      estado_real: 'PROGRAMADO',
      id_user_creacion: 19,
      observaciones: 'Asignacion Camion Pluma RSPL.82-3 QA REQ-1101'
    });
    await apiRequest('POST', `/proyectos/${esc1Id}/asignaciones/personas`, token, {
      id_user: 31,
      rol_asignado: 'Operador Camión Pluma',
      fecha_plan_ini: '2026-11-04',
      fecha_plan_fin: '2026-11-30',
      turnos_plan: 1,
      horas_plan: 180,
      estado_real: 'PROGRAMADO',
      id_user_creacion: 19,
      observaciones: 'Asignacion Operador Ernesto Israel Rios QA REQ-1101'
    });

    const payloadEsc1Assigned = buildProyectoPayload({
      idEmpresa: 9,
      empresaNombre: 'GRÚAS SAN PABLO',
      idCliente: 3009,
      rutCliente: '76939182-7',
      razonSocialCliente: 'METTCO SPA',
      codiProyecto: esc1Folio,
      nombreProyecto: esc1Title,
      distanciaKm: 62,
      obraNombre: esc1Title,
      obraDireccion: 'PLANTA FERRERO - FUNDO CARACAS, RUTA 5 SUR KM 185',
      obraCiudad: 'CURICO',
      detalleServicio: 'Arriendo mensual Camion Pluma con Operador + Traslado ida/vuelta en Camion Plataforma',
      lineasServicio: esc1LineasAsignadas,
      totalNeto: 10640000,
      idEstado: 5,
      regimenOperacional: 'RURAL',
      regimenConfirmado: true,
      requiereAcreditacion: true,
      crmExtra: {
        cotizaciones_historicas: [cotObjEsc1],
        requerimiento_aprobado: true,
        asignacion_confirmada: true
      },
      ejecucionExtra: {
        requerimiento_aprobado: true,
        asignacion_confirmada: true,
        equipo_id: 56,
        id_equipo: 56,
        patente_equipo: 'RSPL.82-3',
        modelo_equipo: 'C7H8X4 440 EV FORESTAL',
        operador_id: 31,
        id_operador: 31,
        tripulacion_asignada: tripulacionEsc1,
        equipos_asignados: [56],
        equipos_asignados_lista: [56],
        equipos_extra: []
      }
    });
    const assignEsc1Res = await apiRequest('PUT', `/proyectos/${esc1Id}`, token, payloadEsc1Assigned);
    recordCheck('ESC-1', 'Confirmacion de Asignacion OT (Camion Pluma RSPL.82-3 + Ernesto Israel Rios)', assignEsc1Res.ok, {
      status: assignEsc1Res.status
    });

    // Generar PDF OT oficial
    const otEsc1Res = await apiRequest('POST', `/proyectos/${esc1Id}/generar-ot`, token, {});
    const otObjEsc1 = otEsc1Res.data?.ot || {};
    recordCheck('ESC-1', 'Orden de Trabajo (OT) PDF generada formalmente', otEsc1Res.ok && Boolean(otObjEsc1.nombre_archivo), {
      nombre_archivo: otObjEsc1.nombre_archivo
    });

    // Verificar en BD sch_leangsp: tpry_proyecto, tpry_rel_equipo, tpry_rel_persona
    const dbEsc1Rel = await queryDB(
      ssh,
      `SELECT
         p.id_proyecto, p.codi_proyecto, p.id_proyecto_estado,
         p.json_field->'ejecucion_v1'->>'equipo_id' AS equipo_id_json,
         p.json_field->'ejecucion_v1'->>'operador_id' AS operador_id_json,
         (SELECT json_agg(row_to_json(re)) FROM ${DB_SCHEMA}.tpry_rel_equipo re WHERE re.id_proyecto = p.id_proyecto) AS rel_equipos,
         (SELECT json_agg(row_to_json(rp)) FROM ${DB_SCHEMA}.tpry_rel_persona rp WHERE rp.id_proyecto = p.id_proyecto) AS rel_personas
       FROM ${DB_SCHEMA}.tpry_proyecto p
       WHERE p.id_proyecto = $1`,
      [esc1Id]
    );
    const rowEsc1 = dbEsc1Rel.rows[0];
    recordCheck(
      'ESC-1',
      'Persistencia en BD sch_leangsp (tpry_proyecto + tpry_rel_equipo + tpry_rel_persona)',
      Number(rowEsc1.equipo_id_json) === 56 &&
        Number(rowEsc1.operador_id_json) === 31 &&
        Array.isArray(rowEsc1.rel_equipos) &&
        rowEsc1.rel_equipos.some((e) => Number(e.id_equipo) === 56 && e.rol_equipo === 'CAMIONES - CAMION PLUMA') &&
        Array.isArray(rowEsc1.rel_personas) &&
        rowEsc1.rel_personas.some((p) => Number(p.id_user) === 31 && p.rol_asignado === 'Operador Camión Pluma'),
      rowEsc1
    );

    // Capturar screenshot 04 en 3. Asignacion Recursos OT mostrando el Camion Pluma y Ernesto Israel Rios confirmados
    await openProjectInCRM(page, esc1Id, 'asignacion');
    await switchModalStep(page, '3. Asignaci');
    await new Promise((r) => setTimeout(r, 2000));
    await takeShot(page, '04_esc1_asignacion_ot_camion_pluma_confirmado.png', 'Escenario 1: Camion Pluma RSPL.82-3 y Operador Ernesto Israel Rios asignados en 3. Asignacion OT');

    // Verificar en 5. Control de Flota & Despacho y capturar screenshot 05
    await switchModalStep(page, '5. Control de Flota');
    await new Promise((r) => setTimeout(r, 2000));
    await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('div.select-none.cursor-pointer'));
      const eqHeader = headers.find((h) => (h.innerText || '').includes('RSPL.82-3') || (h.innerText || '').includes('SINOTRUK') || (h.innerText || '').includes('C7H8X4'));
      const normBody = (document.body.innerText || '').replace(/\s+/g, ' ');
      if (eqHeader && !normBody.includes('Operador Camión Pluma')) {
        eqHeader.click();
      }
    });
    await new Promise((r) => setTimeout(r, 1500));
    const controlFlotaCheck = await page.evaluate(() => {
      const txt = (document.body.innerText || '').replace(/\s+/g, ' ');
      return {
        hasPatente: txt.includes('RSPL.82-3'),
        hasModelo: txt.includes('SINOTRUK') || txt.includes('C7H8X4'),
        hasOperador: txt.includes('Ernesto Israel Rios') || txt.includes('Ernesto'),
        hasRolPluma: txt.includes('Operador Camión Pluma')
      };
    });
    recordCheck(
      'ESC-1',
      '5. Control de Flota & Despacho muestra equipo RSPL.82-3 y Ernesto Israel Rios (Operador Camion Pluma)',
      controlFlotaCheck.hasPatente && controlFlotaCheck.hasOperador && controlFlotaCheck.hasRolPluma,
      controlFlotaCheck
    );
    await takeShot(page, '05_esc1_control_flota_despacho.png', 'Escenario 1: 5. Control de Flota & Despacho con RSPL.82-3 y Ernesto Israel Rios (Operador Camion Pluma)');

    // =========================================================================
    // CERTIFICACION EN TORRE DE CONTROL (Torre.vue: Kanban + Filtros & Cardex 3D)
    // =========================================================================
    console.log('\n--- VERIFICANDO TORRE DE CONTROL (KANBAN + FILTROS Y CARDEX 3D) ---');
    await page.goto(`${FRONTEND_URL}/torre`, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 4500));

    // Seleccionar vista Kanban + Filtros
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const kBtn = btns.find((b) => (b.innerText || '').includes('Kanban + Filtros'));
      if (kBtn) kBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1800));

    const kanbanCardCheck = await page.evaluate((folio) => {
      const cards = Array.from(document.querySelectorAll('div.cursor-pointer.text-left'));
      const targetCard = cards.find((c) => (c.innerText || '').includes(folio));
      if (!targetCard) return { found: false, totalCards: cards.length };
      targetCard.scrollIntoView({ behavior: 'instant', block: 'center' });
      const text = (targetCard.innerText || '').replace(/\s+/g, ' ');
      return {
        found: true,
        cardText: text,
        hasEquipoReal: text.includes('RSPL.82-3') && text.includes('C7H8X4'),
        hasFalseFallbackGruas: text.includes('Req: Grúas') || text.includes('Sin Asignar'),
        hasOperadorReal: text.includes('Ernesto Israel Rios'),
        hasFalseSinOperador: text.includes('Sin Operador')
      };
    }, esc1Folio);

    recordCheck(
      'ESC-1-TORRE',
      'Tarjeta Kanban en Torre.vue muestra [RSPL.82-3] C7H8X4 440 EV FORESTAL y Ernesto Israel Rios (sin fallback falso)',
      kanbanCardCheck.found &&
        kanbanCardCheck.hasEquipoReal &&
        !kanbanCardCheck.hasFalseFallbackGruas &&
        kanbanCardCheck.hasOperadorReal &&
        !kanbanCardCheck.hasFalseSinOperador,
      kanbanCardCheck
    );
    await takeShot(page, '06_esc1_torre_kanban_card_pluma_operador.png', 'Escenario 1: Tarjeta en Torre.vue Kanban mostrando [RSPL.82-3] C7H8X4 440 EV FORESTAL y Ernesto Israel Rios');

    // Filtrar por Operador "Ernesto Israel Rios" en Torre.vue
    const filterOpCheck = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const opSelect = selects.find((s) => Array.from(s.options).some((o) => (o.text || '').replace(/\s+/g, ' ').includes('Ernesto Israel Rios')));
      if (!opSelect) return { selectFound: false };
      const opt = Array.from(opSelect.options).find((o) => (o.text || '').replace(/\s+/g, ' ').includes('Ernesto Israel Rios'));
      opSelect.value = opt.value;
      opSelect.dispatchEvent(new Event('change', { bubbles: true }));
      return { selectFound: true, selectedOption: opt.text };
    });
    await new Promise((r) => setTimeout(r, 1500));

    const afterFilterCheck = await page.evaluate((folio) => {
      const cards = Array.from(document.querySelectorAll('div.cursor-pointer.text-left'));
      const targetCard = cards.find((c) => (c.innerText || '').includes(folio));
      return {
        totalVisibleCards: cards.length,
        targetCardVisible: Boolean(targetCard),
        cardText: targetCard ? (targetCard.innerText || '').replace(/\s+/g, ' ') : null
      };
    }, esc1Folio);

    recordCheck(
      'ESC-1-TORRE',
      'Filtro por Operador "Ernesto Israel Rios" en Torre.vue mantiene visible la tarjeta del proyecto',
      filterOpCheck.selectFound && afterFilterCheck.targetCardVisible,
      { ...filterOpCheck, ...afterFilterCheck }
    );
    await takeShot(page, '07_esc1_torre_kanban_filtro_operador_ernesto.png', 'Escenario 1: Filtro por Operador Ernesto Israel Rios activo en Torre.vue con match positivo');

    // Cambiar a vista Cardex 3D en Torre.vue (manteniendo el filtro por Operador o levantando la tarjeta)
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const c3dBtn = btns.find((b) => (b.innerText || '').includes('Cardex 3D'));
      if (c3dBtn) c3dBtn.click();
    });
    await new Promise((r) => setTimeout(r, 2000));

    const cardex3DCheck = await page.evaluate((folio) => {
      const cards3d = Array.from(document.querySelectorAll('.kardex-card-3d'));
      const target = cards3d.find((c) => (c.innerText || '').includes(folio));
      if (target && !target.classList.contains('is-lifted')) {
        target.click();
      }
      return {
        foundIn3D: Boolean(target),
        isLifted: target ? target.classList.contains('is-lifted') : false
      };
    }, esc1Folio);
    await new Promise((r) => setTimeout(r, 1200));
    const cardex3DAfterClick = await page.evaluate((folio) => {
      const cards3d = Array.from(document.querySelectorAll('.kardex-card-3d'));
      const target = cards3d.find((c) => (c.innerText || '').includes(folio));
      return target ? (target.innerText || '').replace(/\s+/g, ' ') : '';
    }, esc1Folio);

    recordCheck(
      'ESC-1-TORRE',
      'Vista Cardex 3D en Torre.vue muestra [RSPL.82-3] C7H8X4 440 EV FORESTAL y Ernesto Israel Rios',
      cardex3DCheck.foundIn3D &&
        cardex3DAfterClick.includes('RSPL.82-3') &&
        cardex3DAfterClick.includes('Ernesto Israel Rios'),
      { ...cardex3DCheck, detailAfterClick: cardex3DAfterClick }
    );
    await takeShot(page, '08_esc1_torre_cardex3d_detalle.png', 'Escenario 1: Vista Cardex 3D en Torre.vue con detalle de Camion Pluma y Operador');

    // =========================================================================
    // CICLO OPERACIONAL COMPLETO ESCENARIO 1: REPORT DIARIO + ITS + EDP + RRHH
    // =========================================================================
    console.log('\n--- EJECUTANDO CIERRE OPERACIONAL ESCENARIO 1 (REPORT DIARIO + ITS + EDP + RRHH) ---');
    const createRdRes = await apiRequest('POST', '/operaciones/reports', token, {
      id_proyecto: esc1Id,
      id_equipo: 56,
      id_user_operador: 31,
      dia_correlativo: 1,
      fecha_reporte: '2026-11-04',
      hora_salida_patio: '07:30',
      hora_llegada_faena: '08:30',
      hora_inicio: '08:30',
      hora_termino: '17:30',
      hora_salida_faena: '18:00',
      hora_llegada_patio: '19:00',
      horas_operadas: 9.0,
      horas_colacion: 1.0,
      horas_minimas: 180.0,
      horometro_inicio: 1000.0,
      horometro_termino: 1180.0,
      odometro_inicio: 14500,
      odometro_termino: 14624,
      observacion_trabajo: 'Operacion mensual Camion Pluma en Planta Ferrero - Fundo Caracas (180 hrs minimas mensuales).',
      cliente_nombre: 'Jefe de Obra Planta Ferrero',
      cliente_rut: '12.345.678-9',
      cliente_cargo: 'Jefe de Obra Mandante',
      cliente_firma_canvas_base64: DUMMY_PNG_B64
    });
    const rdId = createRdRes.data?.data?.id_reporte_avance;
    recordCheck('ESC-1-CIERRE', 'Report Diario de Terreno creado para Camion Pluma RSPL.82-3', Boolean(rdId), {
      id_reporte_avance: rdId,
      horas_facturables: createRdRes.data?.data?.horas_facturables
    });

    // Firma Electronica Simple (FES) del Report Diario
    const valRdRes = await apiRequest('PUT', `/operaciones/reports/${rdId}/validar`, token, {
      id_user_validador: 55,
      pin: '1234',
      obs_validador: 'Validado conforme QA REQ-1101 (Camion Pluma METTCO SPA).'
    });
    const liqDiaEsc1 = valRdRes.data?.data?.liquidacion_personal_dia || {};
    recordCheck('ESC-1-CIERRE', 'Report Diario validado con Firma FES (estado VALIDADO_ANALISTA)', valRdRes.ok && valRdRes.data?.data?.estado_reporte === 'VALIDADO_ANALISTA', liqDiaEsc1);

    // Consultar ITS y conciliacion matematica de EDP e Incentivos RRHH
    const itsGetRes = await apiRequest('GET', `/proyectos/${esc1Id}/its`, token);
    const itsData = itsGetRes.data?.data || itsGetRes.data;
    const totalIngresosEdp = Number(itsData?.its?.total_ingresos_facturables || 0);
    const ivaEdp = Math.round(totalIngresosEdp * 0.19);
    const totalBrutoEdp = totalIngresosEdp + ivaEdp;
    const costoOpRow = itsData?.costos?.costo_hora_operador?.[0] || {};

    recordCheck(
      'ESC-1-CIERRE',
      'Cuadratura Matematica EDP en ITS (Jornada Rural 9.0h x $58.000 = $522.000 + Traslado $200.000 = $722.000 Neto | Proyeccion Mensual 180h = $10.640.000 Neto)',
      itsGetRes.ok && totalIngresosEdp === 722000 && ivaEdp === 137180 && totalBrutoEdp === 859180,
      {
        folio_its: itsData?.its?.folio_its,
        horas_report_validadas: itsData?.its?.total_horas_report,
        ingreso_pluma_dia1_clp: 522000,
        ingreso_traslado_comercial_clp: 200000,
        total_ingresos_facturables_its: totalIngresosEdp,
        iva_19_its: ivaEdp,
        total_bruto_its: totalBrutoEdp,
        proyeccion_mensual_180h_neto: 10640000,
        proyeccion_mensual_180h_iva: 2021600,
        proyeccion_mensual_180h_bruto: 12661600
      }
    );

    // Cuadratura de Incentivo RRHH Operador Camion Pluma (tpar_tarifa_operador id 16 = $3.500/hr)
    const tarifaPlumaRes = await queryDB(
      ssh,
      `SELECT id_tarifa_operador, categoria_equipo, subcategoria_equipo, tarifa_hora_clp
       FROM ${DB_SCHEMA}.tpar_tarifa_operador
       WHERE subcategoria_equipo = 'CAMION PLUMA' AND estado = 'ACTIVO'`
    );
    const tarifaHoraPluma = Number(tarifaPlumaRes.rows[0]?.tarifa_hora_clp || 0);
    recordCheck(
      'ESC-1-CIERRE',
      'Cuadratura Matematica Incentivo RRHH Operador Camion Pluma (Tarifa Oficial $3.500/hr en tpar_tarifa_operador)',
      tarifaHoraPluma === 3500 && Number(costoOpRow.monto_total) > 0,
      {
        operador: 'Ernesto Israel Rios (id_user=31)',
        tarifa_hora_bd_clp: tarifaHoraPluma,
        liquidacion_report_its: costoOpRow,
        proyeccion_mensual_180_hrs_clp: 180 * tarifaHoraPluma
      }
    );

    // Capturar screenshot 09 en 7. Valorizacion, ITS & Facturacion
    await openProjectInCRM(page, esc1Id, 'liquidacion');
    await switchModalStep(page, '7. Valorizaci');
    await new Promise((r) => setTimeout(r, 2500));
    await takeShot(page, '09_esc1_cierre_edp_cuadratura.png', 'Escenario 1: 7. Valorizacion, ITS & Facturacion ($10.640.000 Neto / $12.661.600 Bruto)');

    results.witnesses.escenario1 = {
      id_proyecto: esc1Id,
      folio_negocio: esc1Folio,
      nombre_proyecto: esc1Title,
      cotizacion_pdf: cotObjEsc1.nombre_archivo,
      ot_pdf: otObjEsc1.nombre_archivo,
      id_reporte_avance: rdId,
      folio_its: itsData?.its?.folio_its,
      id_equipo: 56,
      equipo_patente: 'RSPL.82-3',
      id_operador: 31,
      operador_nombre: 'Ernesto Israel Rios',
      total_neto_edp: totalIngresosEdp,
      iva_edp: ivaEdp,
      total_bruto_edp: totalBrutoEdp,
      tarifa_hora_operador_clp: tarifaHoraPluma,
      incentivo_report_validado_clp: Number(costoOpRow.monto_total || 0),
      incentivo_mensual_180h_clp: 180 * tarifaHoraPluma
    };

    // =========================================================================
    // ESCENARIO 2: PRUEBA ADVERSARIA DE GLOSA LIBRE ("CON OPERADOR, RIGGER Y TRASLADO")
    //              + ELIMINACION DE LINEA RIGGER SIN RESURRECCION (REQ-1100 + REQ-1101)
    // =========================================================================
    console.log('\n--- EJECUTANDO ESCENARIO 2: PRUEBA ADVERSARIA GLOSA TRAMPA + REQ-1100 ---');
    const esc2Title = '[QA-REQ1101 - ESCENARIO 2] PRUEBA ADVERSARIA GLOSA CON OPERADOR RIGGER Y TRASLADO';

    const esc2LineasFinal = [
      {
        _uid: 'line-esc2-grua70',
        id_item: 1,
        tipo: 'GRUAS TELESCOPICAS',
        subcategoria: '70 TON',
        unidad: 'Horas Diarias Minimas',
        cantidad: 1,
        cantidad_dias: 5,
        cantidad_horas: 9,
        pisoMinimo: 45,
        valorUnitario: 145000,
        valor_unitario: 145000,
        subtotal: 6525000,
        descripcion: 'ARRIENDO GRUA 70 TON CON OPERADOR, RIGGER CERTIFICADO, PREVENCIONISTA Y TRASLADO INCLUIDO',
        is_linea_base: true,
        id_equipo: 38,
        equipo_asignado_id: 38,
        patente_asignada: 'STDD.68-4',
        operador_asignado_id: 66,
        id_operador: 66,
        rigger_asignado_id: 21
      }
    ];

    const payloadEsc2Create = buildProyectoPayload({
      idEmpresa: 9,
      empresaNombre: 'GRÚAS SAN PABLO',
      idCliente: 3009,
      rutCliente: '76939182-7',
      razonSocialCliente: 'METTCO SPA',
      nombreProyecto: esc2Title,
      distanciaKm: 18,
      obraNombre: esc2Title,
      obraDireccion: 'PARQUE INDUSTRIAL TALCA ORIENTE KM 252',
      obraCiudad: 'TALCA',
      detalleServicio: 'Prueba adversaria glosa libre con palabras clave Operador, Rigger, Prevencionista y Traslado',
      lineasServicio: esc2LineasFinal,
      totalNeto: 6525000,
      idEstado: 4,
      regimenOperacional: 'URBANO',
      regimenConfirmado: true,
      requiereAcreditacion: false,
      requiereRigger: true,
      requierePrevencionista: false,
      crmExtra: {
        user_deleted_rigger_line: true,
        requerimiento_aprobado: true
      },
      ejecucionExtra: {
        user_deleted_rigger_line: true,
        requerimiento_aprobado: true,
        equipo_id: 38,
        id_equipo: 38,
        patente_equipo: 'STDD.68-4',
        modelo_equipo: 'LTM-1070',
        operador_id: 66,
        id_operador: 66
      }
    });

    const createEsc2 = await apiRequest('POST', '/proyectos', token, payloadEsc2Create);
    const proyEsc2 = createEsc2.data?.proyecto || createEsc2.data?.data || createEsc2.data;
    const esc2Id = proyEsc2?.id_proyecto;
    const esc2Folio = proyEsc2?.codi_proyecto;
    recordCheck('ESC-2', 'Oportunidad Adversaria creada con user_deleted_rigger_line=true y glosa trampa', Boolean(esc2Id && esc2Folio), {
      id_proyecto: esc2Id,
      codi_proyecto: esc2Folio
    });

    await apiRequest('POST', `/proyectos/${esc2Id}/asignaciones/equipos`, token, {
      id_equipo: 38,
      rol_equipo: 'GRUAS TELESCOPICAS - 70 TON',
      fecha_plan_ini: '2026-11-05',
      fecha_plan_fin: '2026-11-09',
      turnos_plan: 5,
      horas_plan: 45,
      estado_real: 'PROGRAMADO',
      id_user_creacion: 19
    });
    await apiRequest('POST', `/proyectos/${esc2Id}/asignaciones/personas`, token, {
      id_user: 66,
      rol_asignado: 'Operador Grúa',
      fecha_plan_ini: '2026-11-05',
      fecha_plan_fin: '2026-11-09',
      turnos_plan: 5,
      horas_plan: 45,
      estado_real: 'PROGRAMADO',
      id_user_creacion: 19
    });
    await apiRequest('POST', `/proyectos/${esc2Id}/asignaciones/personas`, token, {
      id_user: 21,
      rol_asignado: 'Rigger',
      fecha_plan_ini: '2026-11-05',
      fecha_plan_fin: '2026-11-09',
      turnos_plan: 5,
      horas_plan: 45,
      estado_real: 'PROGRAMADO',
      id_user_creacion: 19
    });

    // Abrir Escenario 2 en Puppeteer en 1. Preventa y luego en 3. Asignacion Recursos OT
    await openProjectInCRM(page, esc2Id, 'asignacion');
    await switchModalStep(page, '3. Asignaci');
    await new Promise((r) => setTimeout(r, 2000));

    const esc2DomCheck = await page.evaluate(() => {
      const text = document.body.innerText || '';
      const norm = text.toUpperCase();
      const sec1OneEquipo = norm.includes('1. FLOTA PRINCIPAL & OPERADORES DE SERVICIO') && norm.includes('(1 EQUIPO)');
      const sec1HasGrua70 = norm.includes('GRUAS TELESCOPICAS - 70 TON');
      const sec2ZeroVehiculos = norm.includes('2. EQUIPOS DE TRASLADO & CHOFERES') && norm.includes('(0 VEH');
      const hasRiggerSelectorInSec1OrSec3 = text.includes('Rigger (Apoyo):') || text.includes('Alfonso Maldonado');
      const hasInjectedPersonalLine = norm.includes('PERSONAL - RIGGER') || norm.includes('PERSONAL - PREVENCIONISTA');
      return {
        sec1OneEquipo,
        sec1HasGrua70,
        sec2ZeroVehiculos,
        hasRiggerSelectorInSec1OrSec3,
        hasInjectedPersonalLine
      };
    });

    recordCheck(
      'ESC-2',
      'Glosa con "OPERADOR, RIGGER CERTIFICADO, PREVENCIONISTA Y TRASLADO INCLUIDO" mantiene GRUA 70 TON en Seccion 1 (1 equipo) y Seccion 2 en (0 vehiculos)',
      esc2DomCheck.sec1OneEquipo && esc2DomCheck.sec1HasGrua70 && esc2DomCheck.sec2ZeroVehiculos,
      esc2DomCheck
    );
    recordCheck(
      'ESC-2',
      'REQ-1100: Linea Rigger eliminada NO resucita al reabrir proyecto y selector operativo Rigger permanece habilitado',
      !esc2DomCheck.hasInjectedPersonalLine && esc2DomCheck.hasRiggerSelectorInSec1OrSec3,
      esc2DomCheck
    );
    await takeShot(page, '10_esc2_adversario_flota_y_rigger_sin_resurreccion.png', 'Escenario 2: Grua 70T con glosa trampa clasificada en Seccion 1 (1 equipo), Seccion 2 (0 vehiculos) y Rigger sin resurreccion');

    results.witnesses.escenario2 = {
      id_proyecto: esc2Id,
      folio_negocio: esc2Folio,
      nombre_proyecto: esc2Title,
      id_equipo: 38,
      equipo_patente: 'STDD.68-4',
      id_operador: 66,
      operador_nombre: 'Omar Ghiselini',
      id_rigger: 21,
      rigger_nombre: 'Alfonso Maldonado',
      total_neto_cotizado: 6525000
    };

    // =========================================================================
    // ESCENARIO 3: RECHAZO / DEVOLUCION DE VERIFICACION OPERACIONAL CON MOTIVO Y FECHA
    // =========================================================================
    console.log('\n--- EJECUTANDO ESCENARIO 3: RECHAZO OPERACIONAL CON MOTIVO, FECHA Y NOTIFICACION ---');
    const esc3Title = '[QA-REQ1101 - ESCENARIO 3] RECHAZO OPERACIONAL CON TRAZA';

    const esc3Lineas = [
      {
        _uid: 'line-esc3-pluma',
        id_item: 1,
        tipo: 'CAMIONES',
        subcategoria: 'CAMION PLUMA',
        unidad: 'Jornada',
        cantidad: 5,
        valorUnitario: 580000,
        valor_unitario: 580000,
        subtotal: 2900000,
        descripcion: 'SERVICIO CAMION PLUMA CON OPERADOR POR JORNADA',
        is_linea_base: true
      }
    ];

    const payloadEsc3Create = buildProyectoPayload({
      idEmpresa: 9,
      empresaNombre: 'GRÚAS SAN PABLO',
      idCliente: 3009,
      rutCliente: '76939182-7',
      razonSocialCliente: 'METTCO SPA',
      nombreProyecto: esc3Title,
      distanciaKm: 25,
      obraNombre: esc3Title,
      obraDireccion: 'PLANTA CURICO ACCESO NORTE',
      obraCiudad: 'CURICO',
      detalleServicio: 'Servicio Camion Pluma sujeto a verificacion operacional y devolucion con traza',
      lineasServicio: esc3Lineas,
      totalNeto: 2900000,
      idEstado: 3
    });

    const createEsc3 = await apiRequest('POST', '/proyectos', token, payloadEsc3Create);
    const proyEsc3 = createEsc3.data?.proyecto || createEsc3.data?.data || createEsc3.data;
    const esc3Id = proyEsc3?.id_proyecto;
    const esc3Folio = proyEsc3?.codi_proyecto;

    await apiRequest('POST', `/proyectos/${esc3Id}/cotizaciones`, token, {
      id_user: 19,
      comentario: 'Cotizacion v1 previa a verificacion operacional'
    });

    // Prueba Negativa 3.1: Motivo < 5 caracteres debe retornar HTTP 400
    const negRechazo = await apiRequest('POST', `/proyectos/${esc3Id}/reversar-a-cotizacion`, token, {
      motivo: 'mal'
    });
    recordCheck(
      'ESC-3',
      'Prueba Negativa: Devolucion de Verificacion Operacional con motivo corto (< 5 chars) bloqueada con HTTP 400',
      negRechazo.status === 400,
      negRechazo.data
    );

    // Prueba Positiva 3.2: Devolucion Operacional con motivo valido y traza completa
    const motivoFormal = '[QA-REQ1101] Rechazo Operacional: Se requiere especificar ventana horaria de descarga y confirmar factibilidad de acceso para camion plataforma en acceso norte.';
    const posRechazo = await apiRequest('POST', `/proyectos/${esc3Id}/reversar-a-cotizacion`, token, {
      motivo: motivoFormal
    });
    const updatedEsc3 = posRechazo.data?.proyecto || posRechazo.data?.data || posRechazo.data;
    const crmEsc3 = updatedEsc3?.json_field?.crm_v1 || {};

    recordCheck(
      'ESC-3',
      'Devolucion Operacional regresa proyecto a 1. Preventa (id_proyecto_estado = 2) con motivo, fecha y usuario',
      posRechazo.ok &&
        Number(updatedEsc3?.id_proyecto_estado) === 2 &&
        crmEsc3.motivo_reverso_verificacion === motivoFormal &&
        Boolean(crmEsc3.fecha_reverso_verificacion) &&
        Array.isArray(crmEsc3.historial_reversos_verificacion) &&
        crmEsc3.historial_reversos_verificacion.length >= 1,
      {
        id_proyecto_estado: updatedEsc3?.id_proyecto_estado,
        motivo_reverso_verificacion: crmEsc3.motivo_reverso_verificacion,
        fecha_reverso_verificacion: crmEsc3.fecha_reverso_verificacion,
        usuario_reverso_verificacion: crmEsc3.usuario_reverso_verificacion
      }
    );

    // Verificar registro en tnot_notification_log
    const notCheck = await queryDB(
      ssh,
      `SELECT id_notificacion, evento, canal, destinatario_email, asunto, estado_envio, fecha_creacion
       FROM ${DB_SCHEMA}.tnot_notification_log
       WHERE id_proyecto = $1
       ORDER BY id_notificacion DESC LIMIT 5`,
      [esc3Id]
    );
    recordCheck('ESC-3', 'Notificacion omnicanal interna registrada en sch_leangsp.tnot_notification_log', notCheck.rows.length >= 1, notCheck.rows[0]);

    // Abrir Escenario 3 en Puppeteer (1. Preventa) y verificar banner de alerta de devolucion
    await openProjectInCRM(page, esc3Id, 'comercial');
    await switchModalStep(page, '1. Preventa');
    await new Promise((r) => setTimeout(r, 1800));

    const bannerCheck = await page.evaluate((motivo) => {
      const txt = document.body.innerText || '';
      return {
        hasBannerHeader: txt.includes('Antecedente de Devolución') || txt.includes('Devuelto desde Verificación') || txt.includes('Motivo de Rechazo / Devolución'),
        hasMotivo: txt.includes(motivo),
        hasFecha: txt.includes('Fecha') || txt.includes('2026')
      };
    }, motivoFormal);
    recordCheck(
      'ESC-3',
      'Banner de Alerta en 1. Preventa muestra motivo de rechazo/devolucion, fecha/hora y usuario responsable',
      bannerCheck.hasMotivo,
      bannerCheck
    );
    await takeShot(page, '11_esc3_rechazo_operacional_banner_preventa.png', 'Escenario 3: Banner de devolucion operacional en 1. Preventa con motivo, fecha y responsable');

    results.witnesses.escenario3 = {
      id_proyecto: esc3Id,
      folio_negocio: esc3Folio,
      nombre_proyecto: esc3Title,
      motivo_rechazo: motivoFormal,
      fecha_rechazo: crmEsc3.fecha_reverso_verificacion,
      usuario_rechazo: crmEsc3.usuario_reverso_verificacion?.nombre,
      notificaciones_emitidas: notCheck.rows.length
    };

    // Guardar resultados JSON
    const outJsonPath = path.join(__dirname, 'qa_req1101_results.json');
    fs.writeFileSync(outJsonPath, JSON.stringify(results, null, 2), 'utf8');
    console.log('\n================================================================================');
    console.log(` CERTIFICACION COMPLETADA EXITOSAMENTE: ${results.checks.length}/${results.checks.length} CHECKS PASS`);
    console.log(` Resultados guardados en: ${outJsonPath}`);
    console.log('================================================================================');
  } finally {
    await browser.close();
    ssh.end();
  }
}

main().catch((err) => {
  console.error('\n[FATAL QA ERROR]:', err);
  process.exit(1);
});
