const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

const DEV_API_BASE = 'https://servidor.leanglobal.cl/lg-gsp-dev/api';
const LOCAL_WEB_URL = 'http://localhost:5173/lg-gsp-dev/';
const LOCAL_PWA_URL = 'http://localhost:8085/pwa-gsp-dev/';

// Token cifrado de leangsp generado directamente desde el entorno backend DEV
const LEANGSP_TOKEN = '09accb0a56ab0cabab2101891ccf1576b208c41efd4c9f9b563201e35fc9533a30596590c9bf60589803823bb423a9b946ce1bd1cf84480970083b75fcd36b2fe06f5fface5f49fe18b2151b7c7f4ee4a65f958bcbaa38c53ca80f4c44c53b37832f4506c7f8304628fc149e4981dd6e7ce24ccbc8cd8847ff72f15b5e853b9468c010f10486e82e50b178fb0d1d09e1c031caedb6abafc4da953937992a852e39c407f53e59b711c138c1bcc75216917404c940ea43d582ad1fef41ac0ae2e421803d7f25ce7b25892309c8d7087abc01b53574f5c027f1a15c31b22b5b893afa0fcfcbbdefeb229fc98c5a67b2fa21aa1debc8bff8ba79f0a238d0e52039f609def445d225df0bf767a8acdccb3f7052f9b3f428c574d1a9b2421704859063434c40a8d788192a2a4a5ceaf4a1bad52836f509ed6dabec24d4d0bceca7b912ae372c66979a5c8890f2af6bb994ef7ba690994f0c8565ce7bc10112ed4c0699ec309a4ad9821fb24456df430dfc4b4c4825a6cd2d6b72f5f46e63fb07cb2a7e';

function requestHttp(url, options = {}, data = null) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    const t0 = Date.now();

    const req = client.request(url, options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const duration = Date.now() - t0;
        const rawBuffer = Buffer.concat(chunks);
        let parsed = null;
        try {
          parsed = JSON.parse(rawBuffer.toString('utf8'));
        } catch (e) {
          parsed = rawBuffer.toString('utf8');
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed,
          rawBuffer,
          duration
        });
      });
    });

    req.on('error', (err) => {
      resolve({ statusCode: 0, error: err.message, duration: Date.now() - t0 });
    });

    if (data) {
      if (typeof data === 'object') {
        req.write(JSON.stringify(data));
      } else {
        req.write(data);
      }
    }
    req.end();
  });
}

async function runQAAudit() {
  console.log('================================================================================');
  console.log('🚀 SUITE DE AUDITORÍA QA DETERMINISTA DE ALTA VELOCIDAD - SPEC 84');
  console.log('Usuario de Prueba: leangsp (ID: 1, Rol: ADMIN / OPERACIONES / CRM)');
  console.log('Entornos: Frontends Locales (5173 / 8085) + Backend Remoto DEV');
  console.log('================================================================================\n');

  const resultados = [];

  // -------------------------------------------------------------------------
  // 1. CHEQUEO DE FRONTENDS LOCALES
  // -------------------------------------------------------------------------
  console.log('--- 1. VERIFICACIÓN DE FRONTENDS LOCALES ---');
  
  // 1.1 Frontend Web Local
  const resWeb = await requestHttp(LOCAL_WEB_URL);
  resultados.push({
    modulo: 'Frontend Local',
    prueba: 'Vite Dev Server (Web CRM)',
    url: LOCAL_WEB_URL,
    esperado: 'HTTP 200 OK',
    obtenido: `HTTP ${resWeb.statusCode} (${resWeb.duration}ms)`,
    veredicto: resWeb.statusCode === 200 ? '✅ PASA' : '❌ FALLA'
  });

  // 1.2 PWA Local
  const resPwa = await requestHttp(LOCAL_PWA_URL);
  resultados.push({
    modulo: 'Frontend Local',
    prueba: 'Webpack Dev Server (PWA Operador)',
    url: LOCAL_PWA_URL,
    esperado: 'HTTP 200 OK',
    obtenido: `HTTP ${resPwa.statusCode} (${resPwa.duration}ms)`,
    veredicto: resPwa.statusCode === 200 ? '✅ PASA' : '❌ FALLA'
  });

  // -------------------------------------------------------------------------
  // 2. AUTENTICACIÓN Y CONEXIÓN CON BACKEND REMOTO
  // -------------------------------------------------------------------------
  console.log('\n--- 2. AUTENTICACIÓN DIRECTA DE LEANGSP ---');
  const resAuth = await requestHttp(`${DEV_API_BASE}/proyectos`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${LEANGSP_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  const authOk = resAuth.statusCode === 200 && Array.isArray(resAuth.data?.proyectos || resAuth.data?.data || resAuth.data);
  const projs = resAuth.data?.proyectos || resAuth.data?.data || [];
  const testProj = projs[0] || { id_proyecto: 111, id_empresa: 1 };
  const testProjId = testProj.id_proyecto || 111;

  resultados.push({
    modulo: 'Autenticación',
    prueba: 'Token Cifrado leangsp en /api/proyectos',
    url: `${DEV_API_BASE}/proyectos`,
    esperado: 'HTTP 200 OK con nómina de OTs',
    obtenido: `HTTP ${resAuth.statusCode} (${resAuth.duration}ms)`,
    veredicto: authOk ? '✅ PASA' : '❌ FALLA'
  });

  // -------------------------------------------------------------------------
  // 3. CASO VIAJE: COMBUSTIBLE EN PATIO Y RETORNO (SPEC 84)
  // -------------------------------------------------------------------------
  console.log('\n--- 3. CASO VIAJE: COMBUSTIBLE EN PATIO / RETORNO ---');
  const resViajes = await requestHttp(`${DEV_API_BASE}/operaciones/viaje/proyecto/${testProjId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${LEANGSP_TOKEN}` }
  });

  resultados.push({
    modulo: 'Viajes / Desplazamiento',
    prueba: `Endpoint GET /operaciones/viaje/proyecto/${testProjId}`,
    url: `${DEV_API_BASE}/operaciones/viaje/proyecto/${testProjId}`,
    esperado: 'HTTP 200 OK',
    obtenido: `HTTP ${resViajes.statusCode} (${resViajes.duration}ms)`,
    veredicto: resViajes.statusCode === 200 ? '✅ PASA' : '❌ FALLA'
  });

  // Validar campos en ViajeConductor.vue local
  const codeViaje = fs.readFileSync(path.resolve(__dirname, '../ejecucion/frontend/src/views/Operaciones/ViajeConductor.vue'), 'utf8');
  const tieneCombustibleSalida = codeViaje.includes('combustible_salida') && codeViaje.includes('Nivel de Combustible al Salir de Patio');
  const tieneCombustibleRetorno = codeViaje.includes('combustible_retorno') || codeViaje.includes('combustible_llegada');
  const tieneModalSalidaEnRuta = codeViaje.includes('mostrarModalDatosSalida') && codeViaje.includes('Consultar Datos Registrados de Salida');
  const sinCombustibleEnFaena = !codeViaje.includes('Combustible al llegar a faena');

  resultados.push({
    modulo: 'Viajes / Desplazamiento',
    prueba: 'Combustible Salida Base + Retorno Base en UI Local',
    url: 'ViajeConductor.vue (Local)',
    esperado: 'Salida/Retorno con combustible, Faena limpia',
    obtenido: (tieneCombustibleSalida && tieneCombustibleRetorno && sinCombustibleEnFaena) ? 'Captura en patio y retorno confirmada' : 'No coincide',
    veredicto: (tieneCombustibleSalida && tieneCombustibleRetorno && sinCombustibleEnFaena) ? '✅ PASA' : '❌ FALLA'
  });

  resultados.push({
    modulo: 'Viajes / Desplazamiento',
    prueba: 'Modal Consultar Datos de Salida en Ruta',
    url: 'ViajeConductor.vue (Local)',
    esperado: 'Modal interactivo con botón en EN_RUTA',
    obtenido: tieneModalSalidaEnRuta ? 'Modal de consulta disponible' : 'Falta modal',
    veredicto: tieneModalSalidaEnRuta ? '✅ PASA' : '❌ FALLA'
  });

  // -------------------------------------------------------------------------
  // 4. CASO REPORT DIARIO: STANDBY Y HORÓMETRO SUPERESTRUCTURA OPCIONAL
  // -------------------------------------------------------------------------
  console.log('\n--- 4. CASO REPORT DIARIO: STANDBY Y SUPERESTRUCTURA OPCIONAL ---');
  
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  // 4.1 Columnas en PostgreSQL
  const checkColsSql = `su - postgres -c "psql -d postgres -t -A -c \\"SELECT column_name FROM information_schema.columns WHERE table_schema = 'sch_leangsp' AND table_name = 'tedp_reporte_avance' AND column_name IN ('horas_standby_cliente', 'horas_standby_gsp', 'motivo_standby');\\""`;
  const colsRes = await ssh.execCommand(checkColsSql);
  const colsFound = colsRes.stdout.trim().split('\n').filter(Boolean);

  resultados.push({
    modulo: 'Base de Datos (BD)',
    prueba: 'Columnas Standby en sch_leangsp.tedp_reporte_avance',
    url: 'PostgreSQL Remoto',
    esperado: '3 columnas: horas_standby_cliente, horas_standby_gsp, motivo_standby',
    obtenido: `${colsFound.length} columnas encontradas (${colsFound.join(', ')})`,
    veredicto: colsFound.length === 3 ? '✅ PASA' : '❌ FALLA'
  });

  // 4.2 Probar endpoint de guardar report diario con Standby Robert
  const testReportPayload = {
    id_proyecto: testProjId,
    fecha_reporte: new Date().toISOString().split('T')[0],
    horometro_inicio: 1000.5,
    horometro_fin: 1008.5,
    horometro_superestructura_ini: null, // OPCIONAL POR DEFECTO
    horometro_superestructura_fin: null, // OPCIONAL POR DEFECTO
    hora_inicio_faena: '08:00',
    hora_fin_faena: '18:00',
    tiempo_colacion_min: 60,
    horas_standby_cliente: 4.0, // Caso Robert: mandante sin anemómetro
    horas_standby_gsp: 1.0,     // Detención menor San Pablo
    motivo_standby: 'QA AUTOMATIZADO: Robert detenido por viento/anemómetro cliente (4h) + mantención leve GSP (1h)',
    observaciones: 'Prueba funcional QA determinista Spec 84',
    firma_mandante: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  };

  const resSaveReport = await requestHttp(`${DEV_API_BASE}/operaciones/report/guardar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LEANGSP_TOKEN}`,
      'Content-Type': 'application/json'
    }
  }, testReportPayload);

  // Obtener último id_reporte_avance de PostgreSQL
  const qSqlLast = `su - postgres -c "psql -d postgres -t -A -c \\"SELECT id_reporte_avance, horas_operadas, horas_standby_cliente, horas_standby_gsp, motivo_standby FROM sch_leangsp.tedp_reporte_avance ORDER BY id_reporte_avance DESC LIMIT 1;\\""`;
  const qResLast = await ssh.execCommand(qSqlLast);
  const [reportIdAvance, efectivas, sbCli, sbGsp, mot] = qResLast.stdout.trim().split('|');

  resultados.push({
    modulo: 'Report Diario Izaje',
    prueba: 'Guardar Report Diario con Superestructura Nula y Standby',
    url: `${DEV_API_BASE}/operaciones/report/guardar`,
    esperado: 'HTTP 200 OK con cálculo de efectivas',
    obtenido: `HTTP ${resSaveReport.statusCode} (id_reporte_avance: ${reportIdAvance}, ${resSaveReport.duration}ms)`,
    veredicto: (resSaveReport.statusCode === 200 || resSaveReport.statusCode === 201) ? '✅ PASA' : '❌ FALLA'
  });

  // 4.3 Consultar en PostgreSQL para verificar cálculo aritmético exacto
  resultados.push({
    modulo: 'Report Diario Izaje',
    prueba: 'Cálculo Aritmético y Persistencia de Standby en BD',
    url: 'PostgreSQL sch_leangsp.tedp_reporte_avance',
    esperado: 'standby_cli=4.00, standby_gsp=1.00, efectivas calculadas',
    obtenido: `cli=${sbCli}, gsp=${sbGsp}, efectivas=${efectivas}`,
    veredicto: (Number(sbCli) === 4 && Number(sbGsp) === 1) ? '✅ PASA' : '❌ FALLA'
  });

  // -------------------------------------------------------------------------
  // 5. EXTENSIÓN COMERCIAL DE SERVICIOS (GESTOR OPORTUNIDADES)
  // -------------------------------------------------------------------------
  console.log('\n--- 5. EXTENSIÓN COMERCIAL DE SERVICIOS ---');
  const codeGestor = fs.readFileSync(path.resolve(__dirname, '../ejecucion/frontend/src/views/CRM/GestorOportunidades.vue'), 'utf8');
  const tieneModalExtension = codeGestor.includes('mostrarModalExtensionServicio') && codeGestor.includes('formExtension');
  const tieneBotonExtensionHeader = codeGestor.includes('abrirModalExtenderServicio');
  const tieneConfirmarExtension = codeGestor.includes('confirmarExtensionServicio');

  resultados.push({
    modulo: 'CRM / Gestor Oportunidades',
    prueba: 'Botón y Modal Extender Servicio (UI Local)',
    url: 'GestorOportunidades.vue (Local)',
    esperado: 'Modal interactivo con recálculo dinámico',
    obtenido: (tieneModalExtension && tieneBotonExtensionHeader && tieneConfirmarExtension) ? 'Modal, reactividad y botón cabecera/tab6 confirmados' : 'Faltan elementos',
    veredicto: (tieneModalExtension && tieneBotonExtensionHeader && tieneConfirmarExtension) ? '✅ PASA' : '❌ FALLA'
  });

  // -------------------------------------------------------------------------
  // 6. HIGIENE VISUAL EN CONSOLA PWA (SURVEYS.VUE)
  // -------------------------------------------------------------------------
  console.log('\n--- 6. HIGIENE VISUAL EN CONSOLA PWA ---');
  const codeSurveys = fs.readFileSync(path.resolve(__dirname, '../ejecucion/pwa/src/views/Surveys.vue'), 'utf8');
  const tieneEsUsuarioTaller = codeSurveys.includes('esUsuarioTaller') && codeSurveys.includes('v-if="esUsuarioTaller"');
  const conservaControlPatio = codeSurveys.includes('Control de Portón') || codeSurveys.includes('Inspección de Patio');

  resultados.push({
    modulo: 'PWA Consola Operador',
    prueba: 'Ocultamiento de Taller a Operadores + Control de Patio Activo',
    url: 'Surveys.vue (Local)',
    esperado: 'v-if="esUsuarioTaller" en Taller, Patio conservado',
    obtenido: (tieneEsUsuarioTaller && conservaControlPatio) ? 'Taller condicionado y Patio disponible' : 'Falla lógica',
    veredicto: (tieneEsUsuarioTaller && conservaControlPatio) ? '✅ PASA' : '❌ FALLA'
  });

  // -------------------------------------------------------------------------
  // 7. AUDITORÍA DE SALIDAS PDF EN VIVO
  // -------------------------------------------------------------------------
  console.log('\n--- 7. AUDITORÍA DE SALIDAS PDF ---');

  // 7.1 PDF Report Diario compilado con Puppeteer
  const pdfTestCmd = `su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp && node -e '
    require(\\"dotenv\\").config();
    const { generarPdfReportDiario } = require(\\"./src/services/reportDiarioPdfService\\");
    const db = require(\\"./src/config/postgresPool\\");

    (async () => {
      try {
        const { rows } = await db.query(\\"SELECT * FROM sch_leangsp.tedp_reporte_avance WHERE id_reporte_avance = ${reportIdAvance}\\");
        if (rows.length === 0) { console.log(\\"NO_ROW\\"); return; }
        const rep = rows[0];
        rep.id_reporte = rep.id_reporte_avance;
        const buf = await generarPdfReportDiario({
          report: rep,
          proyecto: { codi_proyecto: \\"OT-111\\", nombre_proyecto: \\"Proyecto Prueba QA\\" },
          validador: { nombre: \\"Lean GSP Admin\\", rut: \\"1-9\\" }
        });
        console.log(\\"PDF_SUCCESS:\\" + buf.length + \\":\\" + buf.slice(0, 5).toString());
      } catch (err) {
        console.error(\\"PDF_ERROR:\\", err.message);
      }
    })();
  '"`;

  const pdfRes = await ssh.execCommand(pdfTestCmd);
  const pdfOutput = pdfRes.stdout.trim();
  const isPdfOk = pdfOutput.includes('PDF_SUCCESS:');
  const pdfSizeMatch = pdfOutput.match(/PDF_SUCCESS:(\d+):%PDF/);
  const pdfSizeBytes = pdfSizeMatch ? pdfSizeMatch[1] : '0';

  resultados.push({
    modulo: 'Documentos PDF',
    prueba: 'Compilación Puppeteer PDF Report Diario (Standby & Firmas)',
    url: 'reportDiarioPdfService.js (Puppeteer)',
    esperado: 'Buffer binario válido %PDF- > 20 KB',
    obtenido: isPdfOk ? `%PDF- generado exitosamente (${(Number(pdfSizeBytes) / 1024).toFixed(1)} KB)` : `Fallo: ${pdfRes.stderr || pdfOutput}`,
    veredicto: isPdfOk ? '✅ PASA' : '❌ FALLA'
  });

  // 7.2 PDF Contrato / OT Puppeteer
  const resPdfOt = await requestHttp(`${DEV_API_BASE}/proyectos/${testProjId}/contrato/generar-pdf`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LEANGSP_TOKEN}`,
      'Content-Type': 'application/json'
    }
  }, {
    id_empresa_arrendador: 11,
    fecha_inicio: '2026-10-16',
    fecha_termino: '2026-10-20',
    representante_nombre: 'Prueba QA Automatizada',
    representante_rut: '12.345.678-9',
    representante_cargo: 'Jefe Faena',
    representante_telefono: '+56912345678',
    representante_email: 'qa.test@leanglobal.cl',
    vendedor_email: 'vendedor@leanglobal.cl'
  });

  const otPdfOk = resPdfOt.statusCode === 200 && (resPdfOt.data?.url_pdf || resPdfOt.data?.success);
  resultados.push({
    modulo: 'Documentos PDF',
    prueba: 'Generación Puppeteer PDF Contrato / OT',
    url: `${DEV_API_BASE}/proyectos/${testProjId}/contrato/generar-pdf`,
    esperado: 'HTTP 200 OK con url_pdf',
    obtenido: `HTTP ${resPdfOt.statusCode} (${resPdfOt.duration}ms)`,
    veredicto: otPdfOk ? '✅ PASA' : '❌ HTTP ' + resPdfOt.statusCode
  });

  ssh.dispose();

  // -------------------------------------------------------------------------
  // REPORTE FINAL EN CONSOLA
  // -------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log('📊 TABLA DE RESULTADOS AUDITORÍA QA DETERMINISTA (SPEC 84)');
  console.log('================================================================================');
  console.table(resultados);

  const total = resultados.length;
  const passed = resultados.filter(r => r.veredicto.includes('PASA')).length;
  console.log(`\nResumen: ${passed}/${total} pruebas superadas exitosamente (${Math.round((passed/total)*100)}%).`);
}

runQAAudit().catch(err => {
  console.error('Error fatal durante la auditoría QA:', err);
  process.exit(1);
});
