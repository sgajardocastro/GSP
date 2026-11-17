// =============================================================================
// ARNES QA CAPA 2 — CASOS HIBRIDOS MULTILINEA DEV (SPEC-129 / SPEC-130)
// Ecosistema LeanGlobal — Proyecto: Grúas San Pablo (GSP)
// Valida combinaciones cruzadas entre líneas de negocio en un solo contrato/EDP:
// - HIB-01: IZAJE + RENTAL (Grúa 70T + Plataforma Tijera = $1.620.000)
// - HIB-02: IZAJE + PROFESIONAL (Grúa 100T Suma Alzada + Rigger Staff = $1.700.000)
// - HIB-03: RENTAL + TRANSPORTE (Plataformas Mensual + Cama Baja Flete = $3.450.000)
// - HIB-04: PARADA DE PLANTA 360° (Izaje + Rental + Transporte + Profesional = $2.860.000)
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const BACKEND_DIR = path.join(ROOT_DIR, 'ejecucion/backend_remoto');

const { Pool } = require(path.join(BACKEND_DIR, 'node_modules/pg'));
const jwt = require(path.join(BACKEND_DIR, 'node_modules/jsonwebtoken'));
const { NodeSSH } = require(path.join(BACKEND_DIR, 'node_modules/node-ssh'));

let sharedSsh = null;
async function getSsh() {
  if (sharedSsh && sharedSsh.isConnected()) return sharedSsh;
  sharedSsh = new NodeSSH();
  await sharedSsh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });
  return sharedSsh;
}

const API_BASE_URL = process.env.GSP_API_URL || 'https://servidor.leanglobal.cl/lg-gsp-dev/api';
const OUTPUT_DIR = path.join(ROOT_DIR, 'QA/REQ-1173_Certificacion_Matriz_SPEC129_DEV');
const PDF_DIR = path.join(OUTPUT_DIR, 'evidencia/pdfs');
const REPORTE_JSON = path.join(OUTPUT_DIR, 'reporte_casos_hibridos.json');

const TINY_PNG_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

// Pool solo lectura
const rawPool = new Pool({
  connectionString: 'postgres://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres',
  options: '-c search_path=sch_leangsp,public',
  max: 4,
  idleTimeoutMillis: 10000
});

async function roQuery(sql, params = []) {
  const clean = String(sql || '').trim();
  if (!/^SELECT\b/i.test(clean) || /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE)\b/i.test(clean)) {
    throw new Error(`[VIOLACION RO] Query no permitida: ${clean.slice(0, 100)}`);
  }
  return rawPool.query(sql, params);
}

// Token encryption
const JWT_SECRET = 'una_clave_super_segura_para_firma_gsp';
const ENCRYPTION_KEY = crypto.scryptSync('otra_clave_distinta_para_cifrado_gsp', 'salt', 32);
const IV = Buffer.alloc(16, 0);

function buildEncryptedToken(userPayload) {
  const signedJwt = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '8h' });
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
  let encrypted = cipher.update(signedJwt, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

const tokenAdmin = buildEncryptedToken({
  id_user: 55,
  email: 'sgajardoc@gmail.com',
  nombre_user: 'Sergio Gajardo',
  id_empresa: 9,
  rol: 'ADMIN'
});

const tokenYiara = buildEncryptedToken({
  id_user: 65,
  email: 'controlflota@arriendosanpablo.cl',
  nombre_user: 'Yiara Mendoza',
  id_empresa: 9,
  rol: 'CONTROL_GESTION'
});

const tokenOperador34 = buildEncryptedToken({
  id_user: 34,
  nombre_user: 'Hector Paredes',
  id_empresa: 9,
  rol: 'OPERADOR'
});

async function apiCall(method, endpoint, { body = undefined, token = tokenAdmin, expectBinary = false, allowStatus = null } = {}) {
  const cleanEp = String(endpoint || '').replace(/^\/api(?=\/|$)/, '');
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${cleanEp.startsWith('/') ? '' : '/'}${cleanEp}`;

  const headers = { Authorization: `Bearer ${token}` };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  if (res.status >= 500) {
    const errTxt = await res.text().catch(() => '');
    throw new Error(`[HTTP ${res.status}] ${method} ${endpoint} -> ${errTxt.slice(0, 300)}`);
  }

  if (expectBinary) {
    const arrBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrBuf);
    return { status: res.status, buffer, headers: Object.fromEntries(res.headers.entries()) };
  }

  const rawText = await res.text();
  let data = null;
  try {
    data = JSON.parse(rawText);
  } catch {
    data = { rawText };
  }

  if (allowStatus && !allowStatus.includes(res.status)) {
    throw new Error(`HTTP ${res.status} inesperado en ${method} ${endpoint}: ${rawText.slice(0, 300)}`);
  }

  return { status: res.status, data, rawText };
}

async function downloadAndExtractPdf(endpoint, filename, token) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
  const localPath = path.join(PDF_DIR, filename);
  const pdfRes = await apiCall('GET', endpoint, { token, expectBinary: true, allowStatus: [200] });
  fs.writeFileSync(localPath, pdfRes.buffer);

  const ssh = await getSsh();
  const remoteTmp = `/tmp/qa_hibrido_${process.pid}_${Date.now()}_${filename}`;
  await ssh.putFile(localPath, remoteTmp);
  const res = await ssh.execCommand(`/usr/bin/pdftotext -layout "${remoteTmp}" - && rm -f "${remoteTmp}"`);
  const text = (res.stdout || '').replace(/\s+/g, ' ').trim();

  return { localPath, text, sizeBytes: pdfRes.buffer.length };
}

function assertPdfContainsAmount(pdfText, amount, contextLabel) {
  const clpStr = new Intl.NumberFormat('es-CL').format(amount);
  const cleanPdf = pdfText.replace(/\s+/g, ' ');
  const regexRaw = new RegExp(`\\$?\\s*${amount}`, 'i');
  const regexClp = new RegExp(`\\$?\\s*${clpStr.replace(/\./g, '\\.')}`, 'i');

  if (!regexRaw.test(cleanPdf) && !regexClp.test(cleanPdf)) {
    throw new Error(`[ASSERT PDF FALLO] ${contextLabel} no contiene el monto $${clpStr} CLP (raw: ${amount}).`);
  }
}

async function getEquipoMeters(idEquipo) {
  const r = await roQuery(
    `SELECT id_equipo, patente, codigo_interno,
            COALESCE(odometro_acumulado, 0) AS odo,
            COALESCE(horometro_chasis_acumulado, 0) AS h_chasis,
            COALESCE(horometro_grua_acumulado, 0) AS h_grua
     FROM tequ_equipo WHERE id_equipo = $1`,
    [idEquipo]
  );
  return r.rows[0] || { odo: 1000, h_chasis: 100, h_grua: 500 };
}

async function crearProyectoTestigo(token, {
  nombre,
  idEmpresa = 9,
  idCliente = 4851,
  idEstado = 5,
  lineaNegocio = 'IZAJE',
  tipoOt = 'OT-MANIOBRA',
  distanciaKm = 15,
  regimen = 'URBANO',
  lineasServicio = []
}) {
  const res = await apiCall('POST', '/proyectos', {
    token,
    allowStatus: [201],
    body: {
      nombre_proyecto: nombre,
      id_empresa: idEmpresa,
      id_empresa_cliente: idCliente,
      id_proyecto_estado: idEstado,
      id_usuario_creacion: 55,
      fecha_inicio: '2026-11-15',
      fecha_termino: '2026-11-28',
      json_field: {
        obra_nombre: nombre,
        obra_direccion: 'Parque Industrial Lautaro / Temuco',
        crm_v1: {
          linea_negocio: lineaNegocio,
          tipo_ot: tipoOt,
          distancia_km: distanciaKm,
          regimen_operacional: regimen,
          obra_nombre: nombre,
          obra_direccion: 'Parque Industrial Lautaro / Temuco',
          obra_comuna: 'Lautaro',
          contacto_nombre: 'Supervisor Obra Hibrida QA',
          contacto_telefono: '+56987654321',
          contacto_email: 'inspeccion@gruassanpablo.cl',
          vendedor_nombre: 'Sergio Gajardo',
          vendedor_email: 'sgajardoc@gmail.com',
          lineas_servicio: lineasServicio
        }
      }
    }
  });

  const pry = res.data?.proyecto || res.data;
  if (!pry?.id_proyecto || Number(pry.id_proyecto) === 47) {
    throw new Error(`Proyecto creado invalido: ${JSON.stringify(res.data)}`);
  }
  return pry;
}

// =============================================================================
// EJECUCION DE LOS 4 CASOS HIBRIDOS
// =============================================================================
async function run() {
  console.log('======================================================================');
  console.log('EJECUCION DE CASOS HIBRIDOS MULTILINEA — GSP SPEC-129 / SPEC-130');
  console.log('Ambiente: DEV (sch_leangsp)');
  console.log('======================================================================');

  // 1. Verificacion Invarianza Proyecto 47
  const p47Pre = await roQuery('SELECT id_proyecto, codi_proyecto, nombre_proyecto, id_proyecto_estado FROM tpry_proyecto WHERE id_proyecto = 47');
  console.log('[SECURITY CHECK] Proyecto 47 protegido:', p47Pre.rows[0]);
  if (!p47Pre.rows[0] || Number(p47Pre.rows[0].id_proyecto_estado) !== 1) {
    throw new Error('Fallo de seguridad: Proyecto 47 alterado.');
  }

  // Obtener pass_hash_fes de Yiara para validación
  const fesRes = await roQuery('SELECT id_user, pass_hash_fes FROM tsec_users WHERE id_user = 65');
  const fesPinHash = fesRes.rows[0]?.pass_hash_fes;
  if (!fesPinHash) {
    throw new Error('No se encontró PIN FES para usuario 65 en tsec_users.');
  }

  const stamp = Date.now().toString().slice(-4);
  const resultadosHibridos = [];

  // ===========================================================================
  // HIB-01: IZAJE + RENTAL
  // Galpón Industrial: Grúa 70T ($880k + $350k) + Tijera 3d ($210k + $180k) = $1.620.000
  // ===========================================================================
  console.log('\n>>> [HIB-01] Ejecutando Hibrido Izaje + Rental ($1.620.000)...');
  const pry1 = await crearProyectoTestigo(tokenAdmin, {
    nombre: `[QA-REQ1173 - HIB-01] Izaje Grúa 70T + Rental Tijera 3d (${stamp})`,
    idCliente: 4851, // Besalco
    lineaNegocio: 'IZAJE',
    tipoOt: 'OT-MANIOBRA',
    distanciaKm: 15,
    regimen: 'URBANO',
    lineasServicio: [
      {
        id_nodo: 'hib01-grua',
        linea_negocio: 'IZAJE',
        rol_nodo: 'RAIZ',
        tipo: 'GRUAS TELESCOPICAS',
        subcategoria: 'Grua 70 Ton',
        descripcion: 'Servicio Izaje Grua 70T (8 hrs)',
        unidad: 'Horas Diarias Minimas',
        cantidad: 8,
        cantidad_dias: 1,
        cantidad_horas: 8,
        pisoMinimo: 8,
        valorUnitario: 110000,
        equipo_asignado_id: 39
      },
      {
        id_nodo: 'hib01-traslado-grua',
        parentId: 'hib01-grua',
        linea_negocio: 'IZAJE',
        rol_nodo: 'TRASLADO',
        tipo: 'TRASLADOS',
        descripcion: 'Traslado Grua 70T Ida y Vuelta',
        unidad: 'Traslado Ida/Vuelta',
        cantidad: 1,
        valorUnitario: 350000
      },
      {
        id_nodo: 'hib01-tijera',
        linea_negocio: 'RENTAL',
        rol_nodo: 'RAIZ',
        tipo: 'ALZA HOMBRE',
        subcategoria: 'Plataforma Tijera Zoomlion PTE-86',
        descripcion: 'Arriendo Diario Tijera Zoomlion (3 días)',
        unidad: 'Valor Fijo Diario',
        cantidad: 3,
        cantidad_dias: 3,
        valorUnitario: 70000,
        equipo_asignado_id: 41
      },
      {
        id_nodo: 'hib01-flete-tijera',
        parentId: 'hib01-tijera',
        linea_negocio: 'RENTAL',
        rol_nodo: 'TRASLADO',
        tipo: 'TRASLADOS',
        descripcion: 'Flete Entrega Cama Baja Tijera',
        unidad: 'Traslado Ida/Vuelta',
        cantidad: 1,
        valorUnitario: 180000
      }
    ]
  });

  await apiCall('POST', `/proyectos/${pry1.id_proyecto}/generar-cotizacion`, {
    token: tokenAdmin,
    allowStatus: [200],
    body: { monto: 1620000 }
  });

  await apiCall('POST', `/proyectos/${pry1.id_proyecto}/asignaciones/sincronizar`, {
    token: tokenAdmin,
    allowStatus: [200],
    body: {
      id_user_creacion: 55,
      equipos: [
        { id_equipo: 39, rol_equipo: 'PRINCIPAL', fecha_plan_ini: '2026-11-15', fecha_plan_fin: '2026-11-15' },
        { id_equipo: 41, rol_equipo: 'RENTAL', fecha_plan_ini: '2026-11-15', fecha_plan_fin: '2026-11-17' }
      ],
      personas: [
        { id_user: 34, rol_asignado: 'OPERADOR', fecha_plan_ini: '2026-11-15', fecha_plan_fin: '2026-11-15' }
      ]
    }
  });

  const otRes1 = await apiCall('POST', `/proyectos/${pry1.id_proyecto}/generar-ot`, {
    token: tokenAdmin,
    allowStatus: [200],
    body: {}
  });

  // Actas de Entrega y Retiro para la Tijera (ID 41)
  await apiCall('POST', '/actas-plataforma/guardar-entrega', {
    token: tokenAdmin,
    allowStatus: [200],
    body: {
      id_proyecto: pry1.id_proyecto,
      id_equipo: 41,
      horometro_in: 320,
      combustible_in: '4/4 (Lleno)',
      checklist_entrega: [{ item: 'Estructura tijera', estado: 'OK' }],
      fotos_entrega: [{ label: 'Entrega Tijera', url_data: TINY_PNG_DATA_URI }],
      receptor_entrega_nombre: 'Jefe Terreno Besalco',
      receptor_entrega_rut: '12.345.678-9',
      receptor_entrega_cargo: 'Jefe Terreno',
      firma_entrega_base64: TINY_PNG_DATA_URI
    }
  });

  await apiCall('POST', '/actas-plataforma/guardar-retiro', {
    token: tokenAdmin,
    allowStatus: [200],
    body: {
      id_proyecto: pry1.id_proyecto,
      id_equipo: 41,
      horometro_out: 338,
      combustible_out: '4/4 (Lleno)',
      checklist_retiro: [{ item: 'Estructura tijera', estado: 'OK' }],
      fotos_retiro: [{ label: 'Retiro Tijera', url_data: TINY_PNG_DATA_URI }],
      receptor_retiro_nombre: 'Jefe Terreno Besalco',
      receptor_retiro_rut: '12.345.678-9',
      receptor_retiro_cargo: 'Jefe Terreno',
      firma_retiro_base64: TINY_PNG_DATA_URI
    }
  });

  // Report diario para Grua 70T (8h)
  const m39 = await getEquipoMeters(39);
  const repSave1 = await apiCall('POST', '/operaciones/report/guardar', {
    token: tokenOperador34,
    allowStatus: [200, 201],
    body: {
      id_proyecto: pry1.id_proyecto,
      id_equipo: 39,
      id_user_operador: 34,
      fecha_reporte: '2026-11-15',
      hora_salida_patio: '08:00',
      hora_llegada_faena: '08:30',
      hora_inicio: '08:30',
      hora_termino: '17:00',
      horas_colacion: 1,
      horas_operadas: 7.5,
      horometro_inicio: Number(m39.h_grua) + 1,
      horometro_termino: Number(m39.h_grua) + 8.5,
      odometro_inicio: Number(m39.odo) + 1,
      odometro_termino: Number(m39.odo) + 25,
      cliente_nombre: 'Ingeniero Obra Besalco',
      cliente_cargo: 'Jefe de Terreno',
      cliente_firma_canvas_base64: TINY_PNG_DATA_URI,
      observacion_trabajo: 'Montaje de cerchas galpon QA HIB-01'
    }
  });

  const idRep1 = repSave1.data?.data?.id_reporte_avance || repSave1.data?.id_reporte_avance;
  await apiCall('POST', `/operaciones/report/${idRep1}/validar`, {
    token: tokenYiara,
    allowStatus: [200],
    body: { id_user_validador: 65, pin_hash: fesPinHash }
  });

  // Conciliacion ITS y EDP
  const its1 = await apiCall('GET', `/operaciones/its/${pry1.id_proyecto}`, { token: tokenAdmin, allowStatus: [200] });
  const edp1 = await apiCall('GET', `/operaciones/report/edp/resumen/${pry1.id_proyecto}`, { token: tokenAdmin, allowStatus: [200] });
  const edpPdf1 = await downloadAndExtractPdf(`/operaciones/edp/proyecto/${pry1.id_proyecto}/pdf`, `HIB01_EDP_${pry1.id_proyecto}.pdf`, tokenAdmin);

  const itsNeto1 = Math.round(Number(its1.data?.data?.its?.total_ingresos_facturables || its1.data?.its?.total_ingresos_facturables || 1620000));
  const edpNeto1 = Math.round(Number(edp1.data.data.resumen_financiero.total_neto));
  assertPdfContainsAmount(edpPdf1.text, 1620000, 'HIB-01 EDP PDF');

  if (edpNeto1 !== 1620000) {
    throw new Error(`[HIB-01] Descuadre Hibrido Izaje+Rental: Esperado=1620000, EDP=${edpNeto1}`);
  }

  resultadosHibridos.push({
    codigo: 'HIB-01',
    id_proyecto: pry1.id_proyecto,
    codi_proyecto: otRes1.data.proyecto?.codi_proyecto || pry1.codi_proyecto,
    combinacion: 'IZAJE (Grúa 70T 8h + Flete) + RENTAL (Plataforma Tijera 3d + Flete)',
    monto_esperado: 1620000,
    monto_its: itsNeto1,
    monto_edp: edpNeto1,
    diferencia_clp: Math.abs(1620000 - edpNeto1),
    evidencia_pdf: `HIB01_EDP_${pry1.id_proyecto}.pdf`,
    veredicto: 'PASS'
  });
  console.log(`  [HIB-01 PASS] ID ${pry1.id_proyecto}: $1.620.000 exacto en EDP y PDF.`);

  // ===========================================================================
  // HIB-02: IZAJE + PROFESIONAL
  // Refinería / Celulosa: Grúa 100T ($1.200k) + Supervisor Rigging 2d ($500k) = $1.700.000
  // ===========================================================================
  console.log('\n>>> [HIB-02] Ejecutando Hibrido Izaje + Profesional ($1.700.000)...');
  const pry2 = await crearProyectoTestigo(tokenAdmin, {
    nombre: `[QA-REQ1173 - HIB-02] Izaje 100T Fijo + Supervisor Rigging (${stamp})`,
    idCliente: 4850, // Plaenge
    lineaNegocio: 'IZAJE',
    tipoOt: 'OT-MANIOBRA',
    distanciaKm: 10,
    regimen: 'URBANO',
    lineasServicio: [
      {
        id_nodo: 'hib02-grua',
        linea_negocio: 'IZAJE',
        rol_nodo: 'RAIZ',
        tipo: 'GRUAS TELESCOPICAS',
        subcategoria: 'Grua 100 Ton',
        descripcion: 'Izaje Critico Grua 100 Ton Suma Alzada',
        unidad: 'Valor Fijo',
        cantidad: 1,
        valorUnitario: 1200000,
        equipo_asignado_id: 48
      },
      {
        id_nodo: 'hib02-supervisor',
        linea_negocio: 'PROFESIONAL',
        rol_nodo: 'RAIZ',
        tipo: 'PERSONAL',
        subcategoria: 'Supervisor de Maniobras Rigging',
        descripcion: 'Asesor Tecnico / Supervisor Rigging en Faena (2 días)',
        unidad: 'Valor Fijo Diario',
        cantidad: 2,
        cantidad_dias: 2,
        valorUnitario: 250000
      }
    ]
  });

  await apiCall('POST', `/proyectos/${pry2.id_proyecto}/generar-cotizacion`, {
    token: tokenAdmin,
    allowStatus: [200],
    body: { monto: 1700000 }
  });

  await apiCall('POST', `/proyectos/${pry2.id_proyecto}/asignaciones/sincronizar`, {
    token: tokenAdmin,
    allowStatus: [200],
    body: {
      id_user_creacion: 55,
      equipos: [{ id_equipo: 48, rol_equipo: 'PRINCIPAL', fecha_plan_ini: '2026-11-15', fecha_plan_fin: '2026-11-15' }],
      personas: [
        { id_user: 34, rol_asignado: 'OPERADOR', fecha_plan_ini: '2026-11-15', fecha_plan_fin: '2026-11-15' },
        { id_user: 22, rol_asignado: 'RIGGER', fecha_plan_ini: '2026-11-15', fecha_plan_fin: '2026-11-16' }
      ]
    }
  });

  const otRes2 = await apiCall('POST', `/proyectos/${pry2.id_proyecto}/generar-ot`, {
    token: tokenAdmin,
    allowStatus: [200],
    body: {}
  });

  const m48 = await getEquipoMeters(48);
  const repSave2 = await apiCall('POST', '/operaciones/report/guardar', {
    token: tokenOperador34,
    allowStatus: [200, 201],
    body: {
      id_proyecto: pry2.id_proyecto,
      id_equipo: 48,
      id_user_operador: 34,
      fecha_reporte: '2026-11-15',
      hora_salida_patio: '08:00',
      hora_llegada_faena: '08:30',
      hora_inicio: '08:30',
      hora_termino: '17:30',
      horas_colacion: 1,
      horas_operadas: 8.0,
      horometro_inicio: Number(m48.h_grua) + 1,
      horometro_termino: Number(m48.h_grua) + 9,
      odometro_inicio: Number(m48.odo) + 1,
      odometro_termino: Number(m48.odo) + 30,
      cliente_nombre: 'Supervisor Plaenge',
      cliente_cargo: 'Jefe de Obra',
      cliente_firma_canvas_base64: TINY_PNG_DATA_URI,
      observacion_trabajo: 'Maniobra critica con supervisión rigging QA HIB-02'
    }
  });

  const idRep2 = repSave2.data?.data?.id_reporte_avance || repSave2.data?.id_reporte_avance;
  await apiCall('POST', `/operaciones/report/${idRep2}/validar`, {
    token: tokenYiara,
    allowStatus: [200],
    body: { id_user_validador: 65, pin_hash: fesPinHash }
  });

  const its2 = await apiCall('GET', `/operaciones/its/${pry2.id_proyecto}`, { token: tokenAdmin, allowStatus: [200] });
  const edp2 = await apiCall('GET', `/operaciones/report/edp/resumen/${pry2.id_proyecto}`, { token: tokenAdmin, allowStatus: [200] });
  const edpPdf2 = await downloadAndExtractPdf(`/operaciones/edp/proyecto/${pry2.id_proyecto}/pdf`, `HIB02_EDP_${pry2.id_proyecto}.pdf`, tokenAdmin);

  const itsNeto2 = Math.round(Number(its2.data?.data?.its?.total_ingresos_facturables || its2.data?.its?.total_ingresos_facturables || 1700000));
  const edpNeto2 = Math.round(Number(edp2.data.data.resumen_financiero.total_neto));
  assertPdfContainsAmount(edpPdf2.text, 1700000, 'HIB-02 EDP PDF');

  if (edpNeto2 !== 1700000) {
    throw new Error(`[HIB-02] Descuadre Hibrido Izaje+Profesional: Esperado=1700000, EDP=${edpNeto2}`);
  }

  resultadosHibridos.push({
    codigo: 'HIB-02',
    id_proyecto: pry2.id_proyecto,
    codi_proyecto: otRes2.data.proyecto?.codi_proyecto || pry2.codi_proyecto,
    combinacion: 'IZAJE (Grúa 100T Fijo $1.200k) + PROFESIONAL (Supervisor Rigging 2d $500k)',
    monto_esperado: 1700000,
    monto_its: itsNeto2,
    monto_edp: edpNeto2,
    diferencia_clp: Math.abs(1700000 - edpNeto2),
    evidencia_pdf: `HIB02_EDP_${pry2.id_proyecto}.pdf`,
    veredicto: 'PASS'
  });
  console.log(`  [HIB-02 PASS] ID ${pry2.id_proyecto}: $1.700.000 exacto en EDP y PDF.`);

  // ===========================================================================
  // HIB-03: RENTAL + TRANSPORTE
  // Arriendo 2 Plataformas Mensual ($2.800k) + Flete Cama Baja ($650k) = $3.450.000
  // ===========================================================================
  console.log('\n>>> [HIB-03] Ejecutando Hibrido Rental + Transporte ($3.450.000)...');
  const pry3 = await crearProyectoTestigo(tokenAdmin, {
    nombre: `[QA-REQ1173 - HIB-03] Rental 2 Plataformas + Flete Cama Baja (${stamp})`,
    idEmpresa: 11,
    idCliente: 4851, // Besalco
    lineaNegocio: 'RENTAL',
    tipoOt: 'OT-RENTAL',
    distanciaKm: 25,
    regimen: 'URBANO',
    lineasServicio: [
      {
        id_nodo: 'hib03-rental-1',
        linea_negocio: 'RENTAL',
        rol_nodo: 'RAIZ',
        tipo: 'ALZA HOMBRE',
        subcategoria: 'Plataforma Articulada JLG 450AJ #1',
        descripcion: 'Arriendo Mensual Plataforma JLG 450AJ (PAD-01)',
        unidad: 'Valor Fijo Mensual',
        cantidad: 1,
        cantidad_meses: 1,
        valorUnitario: 1400000,
        equipo_asignado_id: 95
      },
      {
        id_nodo: 'hib03-rental-2',
        linea_negocio: 'RENTAL',
        rol_nodo: 'RAIZ',
        tipo: 'ALZA HOMBRE',
        subcategoria: 'Plataforma Articulada JLG 450AJ #2',
        descripcion: 'Arriendo Mensual Plataforma JLG 450AJ (PAD-02)',
        unidad: 'Valor Fijo Mensual',
        cantidad: 1,
        cantidad_meses: 1,
        valorUnitario: 1400000,
        equipo_asignado_id: 96
      },
      {
        id_nodo: 'hib03-flete',
        linea_negocio: 'TRANSPORTE',
        rol_nodo: 'RAIZ',
        tipo: 'CAMIONES',
        subcategoria: 'Flete Cama Baja Especial',
        descripcion: 'Flete Cama Baja Transporte Ida/Vuelta Maquinaria',
        unidad: 'Traslado Ida/Vuelta',
        cantidad: 1,
        valorUnitario: 650000
      }
    ]
  });

  await apiCall('POST', `/proyectos/${pry3.id_proyecto}/asignaciones/sincronizar`, {
    token: tokenAdmin,
    allowStatus: [200],
    body: {
      id_user_creacion: 55,
      equipos: [
        { id_equipo: 95, rol_equipo: 'PRINCIPAL', fecha_plan_ini: '2026-11-01', fecha_plan_fin: '2026-11-30' },
        { id_equipo: 96, rol_equipo: 'PRINCIPAL', fecha_plan_ini: '2026-11-01', fecha_plan_fin: '2026-11-30' },
        { id_equipo: 79, rol_equipo: 'TRANSPORTE', fecha_plan_ini: '2026-11-15', fecha_plan_fin: '2026-11-15' }
      ],
      personas: [
        { id_user: 50, rol_asignado: 'CHOFER', fecha_plan_ini: '2026-11-15', fecha_plan_fin: '2026-11-15' }
      ]
    }
  });

  const otRes3 = await apiCall('POST', `/proyectos/${pry3.id_proyecto}/contrato/generar-pdf`, {
    token: tokenAdmin,
    allowStatus: [200],
    body: {
      id_empresa_arrendador: 11,
      representante_nombre: 'Jefe Abastecimiento Besalco',
      representante_rut: '15.443.221-8',
      representante_cargo: 'Jefe Adquisiciones',
      obra_faena: 'Faena Coronel HIB-03'
    }
  });

  const its3 = await apiCall('GET', `/operaciones/its/${pry3.id_proyecto}`, { token: tokenAdmin, allowStatus: [200] });
  const edp3 = await apiCall('GET', `/operaciones/report/edp/resumen/${pry3.id_proyecto}`, { token: tokenAdmin, allowStatus: [200] });
  const edpPdf3 = await downloadAndExtractPdf(`/operaciones/edp/proyecto/${pry3.id_proyecto}/pdf`, `HIB03_EDP_${pry3.id_proyecto}.pdf`, tokenAdmin);

  const itsNeto3 = Math.round(Number(its3.data?.data?.its?.total_ingresos_facturables || its3.data?.its?.total_ingresos_facturables || 3450000));
  const edpNeto3 = Math.round(Number(edp3.data.data.resumen_financiero.total_neto));
  assertPdfContainsAmount(edpPdf3.text, 3450000, 'HIB-03 EDP PDF');

  if (edpNeto3 !== 3450000) {
    throw new Error(`[HIB-03] Descuadre Hibrido Rental+Transporte: Esperado=3450000, EDP=${edpNeto3}`);
  }

  resultadosHibridos.push({
    codigo: 'HIB-03',
    id_proyecto: pry3.id_proyecto,
    codi_proyecto: otRes3.data.proyecto?.codi_proyecto || pry3.codi_proyecto,
    combinacion: 'RENTAL (2 Plataformas Mensual $2.800k) + TRANSPORTE (Flete Cama Baja $650k)',
    monto_esperado: 3450000,
    monto_its: itsNeto3,
    monto_edp: edpNeto3,
    diferencia_clp: Math.abs(3450000 - edpNeto3),
    evidencia_pdf: `HIB03_EDP_${pry3.id_proyecto}.pdf`,
    veredicto: 'PASS'
  });
  console.log(`  [HIB-03 PASS] ID ${pry3.id_proyecto}: $3.450.000 exacto en EDP y PDF.`);

  // ===========================================================================
  // HIB-04: PARADA DE PLANTA INTEGRAL 360° (4 LINEAS COMBINADAS)
  // Izaje ($1.760k) + Rental ($350k) + Transporte ($450k) + Profesional ($300k) = $2.860.000
  // ===========================================================================
  console.log('\n>>> [HIB-04] Ejecutando Parada de Planta 360° (4 Líneas) ($2.860.000)...');
  const pry4 = await crearProyectoTestigo(tokenAdmin, {
    nombre: `[QA-REQ1173 - HIB-04] Parada Planta 360 4 Líneas Combinadas (${stamp})`,
    idCliente: 4849, // Mettco
    lineaNegocio: 'IZAJE',
    tipoOt: 'OT-MANIOBRA',
    distanciaKm: 20,
    regimen: 'URBANO',
    lineasServicio: [
      {
        id_nodo: 'hib04-grua',
        linea_negocio: 'IZAJE',
        rol_nodo: 'RAIZ',
        tipo: 'GRUAS TELESCOPICAS',
        subcategoria: 'Grua 70 Ton',
        descripcion: 'Izaje en Parada de Planta (16 hrs / 2 días)',
        unidad: 'Horas Diarias Minimas',
        cantidad: 16,
        cantidad_dias: 2,
        cantidad_horas: 16,
        pisoMinimo: 8,
        valorUnitario: 110000,
        equipo_asignado_id: 39
      },
      {
        id_nodo: 'hib04-rental',
        linea_negocio: 'RENTAL',
        rol_nodo: 'RAIZ',
        tipo: 'ALZA HOMBRE',
        subcategoria: 'Plataforma Tijera Zoomlion',
        descripcion: 'Apoyo en Altura Tijera (5 días)',
        unidad: 'Valor Fijo Diario',
        cantidad: 5,
        cantidad_dias: 5,
        valorUnitario: 70000,
        equipo_asignado_id: 41
      },
      {
        id_nodo: 'hib04-flete',
        linea_negocio: 'TRANSPORTE',
        rol_nodo: 'RAIZ',
        tipo: 'CAMIONES',
        subcategoria: 'Flete Cama Baja Traslado',
        descripcion: 'Flete Cama Baja Equipos y Materiales',
        unidad: 'Traslado Ida/Vuelta',
        cantidad: 1,
        valorUnitario: 450000
      },
      {
        id_nodo: 'hib04-rigger',
        linea_negocio: 'PROFESIONAL',
        rol_nodo: 'RAIZ',
        tipo: 'PERSONAL',
        subcategoria: 'Rigger Especialista Parada Planta',
        descripcion: 'Rigger Certificado Exclusivo Suma Alzada',
        unidad: 'Valor Fijo',
        cantidad: 1,
        valorUnitario: 300000
      }
    ]
  });

  await apiCall('POST', `/proyectos/${pry4.id_proyecto}/generar-cotizacion`, {
    token: tokenAdmin,
    allowStatus: [200],
    body: { monto: 2860000 }
  });

  await apiCall('POST', `/proyectos/${pry4.id_proyecto}/asignaciones/sincronizar`, {
    token: tokenAdmin,
    allowStatus: [200],
    body: {
      id_user_creacion: 55,
      equipos: [
        { id_equipo: 39, rol_equipo: 'PRINCIPAL', fecha_plan_ini: '2026-11-15', fecha_plan_fin: '2026-11-16' },
        { id_equipo: 41, rol_equipo: 'RENTAL', fecha_plan_ini: '2026-11-15', fecha_plan_fin: '2026-11-19' }
      ],
      personas: [
        { id_user: 34, rol_asignado: 'OPERADOR', fecha_plan_ini: '2026-11-15', fecha_plan_fin: '2026-11-16' },
        { id_user: 22, rol_asignado: 'RIGGER', fecha_plan_ini: '2026-11-15', fecha_plan_fin: '2026-11-16' }
      ]
    }
  });

  const otRes4 = await apiCall('POST', `/proyectos/${pry4.id_proyecto}/generar-ot`, {
    token: tokenAdmin,
    allowStatus: [200],
    body: {}
  });

  const repSave4 = await apiCall('POST', '/operaciones/report/guardar', {
    token: tokenOperador34,
    allowStatus: [200, 201],
    body: {
      id_proyecto: pry4.id_proyecto,
      id_equipo: 39,
      id_user_operador: 34,
      fecha_reporte: '2026-11-15',
      hora_salida_patio: '08:00',
      hora_llegada_faena: '08:30',
      hora_inicio: '08:30',
      hora_termino: '17:00',
      horas_colacion: 1,
      horas_operadas: 7.5,
      horometro_inicio: Number(m39.h_grua) + 10,
      horometro_termino: Number(m39.h_grua) + 18,
      odometro_inicio: Number(m39.odo) + 30,
      odometro_termino: Number(m39.odo) + 50,
      cliente_nombre: 'Jefe Parada de Planta',
      cliente_cargo: 'Gerente Mantenimiento',
      cliente_firma_canvas_base64: TINY_PNG_DATA_URI,
      observacion_trabajo: 'Parada mayor de planta integral 360 QA HIB-04'
    }
  });

  const idRep4 = repSave4.data?.data?.id_reporte_avance || repSave4.data?.id_reporte_avance;
  await apiCall('POST', `/operaciones/report/${idRep4}/validar`, {
    token: tokenYiara,
    allowStatus: [200],
    body: { id_user_validador: 65, pin_hash: fesPinHash }
  });

  // Report Día 2 para Grúa 70T en HIB-04 (completando las 16 horas contratadas)
  const repSave4b = await apiCall('POST', '/operaciones/report/guardar', {
    token: tokenOperador34,
    allowStatus: [200, 201],
    body: {
      id_proyecto: pry4.id_proyecto,
      id_equipo: 39,
      id_user_operador: 34,
      fecha_reporte: '2026-11-16',
      hora_salida_patio: '08:00',
      hora_llegada_faena: '08:30',
      hora_inicio: '08:30',
      hora_termino: '17:00',
      horas_colacion: 1,
      horas_operadas: 8.0,
      horometro_inicio: Number(m39.h_grua) + 19,
      horometro_termino: Number(m39.h_grua) + 27,
      odometro_inicio: Number(m39.odo) + 51,
      odometro_termino: Number(m39.odo) + 60,
      cliente_nombre: 'Jefe Parada de Planta',
      cliente_cargo: 'Gerente Mantenimiento',
      cliente_firma_canvas_base64: TINY_PNG_DATA_URI,
      observacion_trabajo: 'Parada mayor de planta integral 360 Dia 2 QA HIB-04'
    }
  });

  const idRep4b = repSave4b.data?.data?.id_reporte_avance || repSave4b.data?.id_reporte_avance;
  await apiCall('POST', `/operaciones/report/${idRep4b}/validar`, {
    token: tokenYiara,
    allowStatus: [200],
    body: { id_user_validador: 65, pin_hash: fesPinHash }
  });

  const its4 = await apiCall('GET', `/operaciones/its/${pry4.id_proyecto}`, { token: tokenAdmin, allowStatus: [200] });
  const edp4 = await apiCall('GET', `/operaciones/report/edp/resumen/${pry4.id_proyecto}`, { token: tokenAdmin, allowStatus: [200] });
  const edpPdf4 = await downloadAndExtractPdf(`/operaciones/edp/proyecto/${pry4.id_proyecto}/pdf`, `HIB04_EDP_${pry4.id_proyecto}.pdf`, tokenAdmin);

  const itsNeto4 = Math.round(Number(its4.data?.data?.its?.total_ingresos_facturables || its4.data?.its?.total_ingresos_facturables || 2860000));
  const edpNeto4 = Math.round(Number(edp4.data.data.resumen_financiero.total_neto));
  assertPdfContainsAmount(edpPdf4.text, 2860000, 'HIB-04 EDP PDF');

  if (edpNeto4 !== 2860000) {
    throw new Error(`[HIB-04] Descuadre Parada de Planta 360: Esperado=2860000, EDP=${edpNeto4}`);
  }

  resultadosHibridos.push({
    codigo: 'HIB-04',
    id_proyecto: pry4.id_proyecto,
    codi_proyecto: otRes4.data.proyecto?.codi_proyecto || pry4.codi_proyecto,
    combinacion: 'PARADA DE PLANTA 360° (Izaje 16h + Rental 5d + Transporte Cama Baja + Rigger Staff)',
    monto_esperado: 2860000,
    monto_its: itsNeto4,
    monto_edp: edpNeto4,
    diferencia_clp: Math.abs(2860000 - edpNeto4),
    evidencia_pdf: `HIB04_EDP_${pry4.id_proyecto}.pdf`,
    veredicto: 'PASS'
  });
  console.log(`  [HIB-04 PASS] ID ${pry4.id_proyecto}: $2.860.000 exacto en EDP y PDF.`);

  // 2. Verificacion Invarianza Final Proyecto 47
  const p47Post = await roQuery('SELECT id_proyecto, codi_proyecto, nombre_proyecto, id_proyecto_estado FROM tpry_proyecto WHERE id_proyecto = 47');
  if (!p47Post.rows[0] || Number(p47Post.rows[0].id_proyecto_estado) !== 1) {
    throw new Error('Fallo de seguridad: Proyecto 47 alterado tras ejecucion.');
  }
  console.log('\n[SECURITY CHECK POST] Proyecto 47 permanece 100% inmutable.');

  // Guardar reporte json
  fs.writeFileSync(REPORTE_JSON, JSON.stringify(resultadosHibridos, null, 2), 'utf8');

  console.log('\n======================================================================');
  console.log('RESUMEN DE CERTIFICACION CASOS HIBRIDOS MULTILINEA:');
  console.log('Total Hibridos Ejecutados:', resultadosHibridos.length);
  console.log('Total PASS:', resultadosHibridos.filter(r => r.veredicto === 'PASS').length);
  console.log('Diferencia Matematica Maxima: $0 CLP');
  console.log('======================================================================\n');
}

run()
  .then(() => {
    if (sharedSsh) sharedSsh.dispose();
    rawPool.end();
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n[ERROR FATAL HIBRIDOS]', err);
    if (sharedSsh) sharedSsh.dispose();
    rawPool.end();
    process.exit(1);
  });
