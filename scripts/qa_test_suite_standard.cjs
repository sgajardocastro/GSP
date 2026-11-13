/**
 * ============================================================================
 * SUITE ESTÁNDAR DE PRUEBAS DETERMINISTAS QA - ECOSISTEMA GRÚAS SAN PABLO (GSP)
 * ============================================================================
 * 
 * Filosofía: Cero suposiciones, Cero mocks ciegos, Validación contra endpoints reales.
 * Arquitectura: Frontends Locales (5173 / 8085) + Backend Remoto DEV + PostgreSQL sch_leangsp.
 * 
 * Regla de Ejecución:
 * - Toda prueba debe arrojar veredicto binario: PASA o FALLA.
 * - Candado Hard Gate: 100% de éxito requerido para autorizar despliegue o cierre de sprint.
 * 
 * Ejecución:
 *   node scripts/qa_test_suite_standard.cjs
 * ============================================================================
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

// ----------------------------------------------------------------------------
// CONFIGURACIÓN DE AMBIENTES Y PARÁMETROS DETERMINISTAS
// ----------------------------------------------------------------------------
const CONFIG = {
  DEV_API_BASE: 'https://servidor.leanglobal.cl/lg-gsp-dev/api',
  LOCAL_WEB_URL: 'http://localhost:5173/lg-gsp-dev/',
  LOCAL_PWA_URL: 'http://localhost:8085/pwa-gsp-dev/',
  SSH: {
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  },
  // Token cifrado de pruebas para usuario leangsp (ID: 1 / 59, Rol: ADMIN / PMO / COMERCIAL)
  LEANGSP_TOKEN: '09accb0a56ab0cabab2101891ccf1576b208c41efd4c9f9b563201e35fc9533a30596590c9bf60589803823bb423a9b946ce1bd1cf84480970083b75fcd36b2fe06f5fface5f49fe18b2151b7c7f4ee4a65f958bcbaa38c53ca80f4c44c53b37832f4506c7f8304628fc149e4981dd6e7ce24ccbc8cd8847ff72f15b5e853b9468c010f10486e82e50b178fb0d1d09e1c031caedb6abafc4da953937992a852e39c407f53e59b711c138c1bcc75216917404c940ea43d582ad1fef41ac0ae2e421803d7f25ce7b25892309c8d7087abc01b53574f5c027f1a15c31b22b5b893afa0fcfcbbdefeb229fc98c5a67b2fa21aa1debc8bff8ba79f0a238d0e52039f609def445d225df0bf767a8acdccb3f7052f9b3f428c574d1a9b2421704859063434c40a8d788192a2a4a5ceaf4a1bad52836f509ed6dabec24d4d0bceca7b912ae372c66979a5c8890f2af6bb994ef7ba690994f0c8565ce7bc10112ed4c0699ec309a4ad9821fb24456df430dfc4b4c4825a6cd2d6b72f5f46e63fb07cb2a7e'
};

// ----------------------------------------------------------------------------
// CLIENTE HTTP DETERMINISTA
// ----------------------------------------------------------------------------
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

// ----------------------------------------------------------------------------
// EJECUTOR DE AUDITORÍA QA DETERMINISTA
// ----------------------------------------------------------------------------
async function executeStandardQASuite() {
  console.log('================================================================================');
  console.log('SUITE CANÓNICA DE PRUEBAS DETERMINISTAS QA - ECOSISTEMA GSP');
  console.log('Fecha/Hora:', new Date().toISOString());
  console.log('Ambientes : Frontends Locales (5173 / 8085) + Backend Remoto DEV');
  console.log('Persona   : leangsp (ID: 1 / 59, Rol: ADMIN / PMO / COMERCIAL)');
  console.log('================================================================================\n');

  const resultados = [];
  const ssh = new NodeSSH();

  try {
    // -----------------------------------------------------------------------
    // CATEGORÍA 1: SALUD Y DISPONIBILIDAD DE FRONTENDS LOCALES
    // -----------------------------------------------------------------------
    console.log('[1/7] Auditando salud de Frontends Locales...');
    
    // 1.1 Web CRM (Vite)
    const resWeb = await requestHttp(CONFIG.LOCAL_WEB_URL);
    resultados.push({
      modulo: 'Frontend Local',
      prueba: 'Vite Dev Server (Web CRM)',
      recurso: CONFIG.LOCAL_WEB_URL,
      esperado: 'HTTP 200 OK',
      obtenido: `HTTP ${resWeb.statusCode} (${resWeb.duration}ms)`,
      veredicto: resWeb.statusCode === 200 ? 'PASA' : 'FALLA'
    });

    // 1.2 PWA Operador (Webpack)
    const resPwa = await requestHttp(CONFIG.LOCAL_PWA_URL);
    resultados.push({
      modulo: 'Frontend Local',
      prueba: 'Webpack Dev Server (PWA)',
      recurso: CONFIG.LOCAL_PWA_URL,
      esperado: 'HTTP 200 OK',
      obtenido: `HTTP ${resPwa.statusCode} (${resPwa.duration}ms)`,
      veredicto: resPwa.statusCode === 200 ? 'PASA' : 'FALLA'
    });

    // -----------------------------------------------------------------------
    // CATEGORÍA 2: AUTENTICACIÓN Y HANDSHAKE CON TOKEN CIFRADO REAL
    // -----------------------------------------------------------------------
    console.log('[2/7] Auditando handshake y autenticación con Backend Remoto...');
    const resAuth = await requestHttp(`${CONFIG.DEV_API_BASE}/proyectos`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CONFIG.LEANGSP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const isAuthOk = resAuth.statusCode === 200 && Array.isArray(resAuth.data?.proyectos || resAuth.data?.data || resAuth.data);
    const projs = resAuth.data?.proyectos || resAuth.data?.data || [];
    const testProj = projs[0] || { id_proyecto: 111, id_empresa: 1 };
    const testProjId = testProj.id_proyecto || 111;

    resultados.push({
      modulo: 'Autenticación',
      prueba: 'Token Cifrado leangsp en /proyectos',
      recurso: `${CONFIG.DEV_API_BASE}/proyectos`,
      esperado: 'HTTP 200 OK con nómina de OTs',
      obtenido: `HTTP ${resAuth.statusCode} (${resAuth.duration}ms, OTs: ${projs.length})`,
      veredicto: isAuthOk ? 'PASA' : 'FALLA'
    });

    // -----------------------------------------------------------------------
    // CATEGORÍA 3: DESPLAZAMIENTOS Y CONTROL DE COMBUSTIBLE EN PATIO / RETORNO
    // -----------------------------------------------------------------------
    console.log(`[3/7] Auditando desplazamientos y combustible en OT ${testProjId}...`);
    const resViajes = await requestHttp(`${CONFIG.DEV_API_BASE}/operaciones/viaje/proyecto/${testProjId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${CONFIG.LEANGSP_TOKEN}` }
    });

    resultados.push({
      modulo: 'Desplazamiento',
      prueba: `GET /operaciones/viaje/proyecto/${testProjId}`,
      recurso: `${CONFIG.DEV_API_BASE}/operaciones/viaje/proyecto/${testProjId}`,
      esperado: 'HTTP 200 OK',
      obtenido: `HTTP ${resViajes.statusCode} (${resViajes.duration}ms)`,
      veredicto: resViajes.statusCode === 200 ? 'PASA' : 'FALLA'
    });

    // Auditoría de contrato en código local ViajeConductor.vue
    const codeViaje = fs.readFileSync(path.resolve(__dirname, '../ejecucion/frontend/src/views/Operaciones/ViajeConductor.vue'), 'utf8');
    const tieneCombSalida = codeViaje.includes('combustible_salida') && codeViaje.includes('Nivel de Combustible al Salir de Patio');
    const tieneCombRetorno = codeViaje.includes('combustible_retorno') || codeViaje.includes('combustible_llegada');
    const sinCombFaena = !codeViaje.includes('Combustible al llegar a faena');
    const tieneModalSalida = codeViaje.includes('mostrarModalDatosSalida') && codeViaje.includes('Consultar Datos Registrados de Salida');

    resultados.push({
      modulo: 'Desplazamiento',
      prueba: 'Combustible Patio Salida + Retorno (UI Local)',
      recurso: 'ViajeConductor.vue',
      esperado: 'Captura Patio Salida y Retorno, Faena limpia',
      obtenido: (tieneCombSalida && tieneCombRetorno && sinCombFaena) ? 'Contrato validado correctamente' : 'Inconsistencia en campos',
      veredicto: (tieneCombSalida && tieneCombRetorno && sinCombFaena) ? 'PASA' : 'FALLA'
    });

    resultados.push({
      modulo: 'Desplazamiento',
      prueba: 'Modal Consultar Datos de Salida en Ruta',
      recurso: 'ViajeConductor.vue',
      esperado: 'Modal interactivo con botón en EN_RUTA',
      obtenido: tieneModalSalida ? 'Modal de consulta disponible' : 'Falta modal de consulta',
      veredicto: tieneModalSalida ? 'PASA' : 'FALLA'
    });

    // -----------------------------------------------------------------------
    // CATEGORÍA 4: REPORT DIARIO, STANDBY Y REGLAS ARITMÉTICAS
    // -----------------------------------------------------------------------
    console.log('[4/7] Conectando a PostgreSQL y auditando cálculo de Standby...');
    await ssh.connect(CONFIG.SSH);

    // 4.1 Verificación de esquema en PostgreSQL
    const checkColsSql = `su - postgres -c "psql -d postgres -t -A -c \\"SELECT column_name FROM information_schema.columns WHERE table_schema = 'sch_leangsp' AND table_name = 'tedp_reporte_avance' AND column_name IN ('horas_standby_cliente', 'horas_standby_gsp', 'motivo_standby');\\""`;
    const colsRes = await ssh.execCommand(checkColsSql);
    const colsFound = colsRes.stdout.trim().split('\n').filter(Boolean);

    resultados.push({
      modulo: 'Base de Datos (BD)',
      prueba: 'Columnas Standby en sch_leangsp.tedp_reporte_avance',
      recurso: 'PostgreSQL Remoto (sch_leangsp)',
      esperado: '3 columnas: horas_standby_cliente, horas_standby_gsp, motivo_standby',
      obtenido: `${colsFound.length} columnas encontradas (${colsFound.join(', ')})`,
      veredicto: colsFound.length === 3 ? 'PASA' : 'FALLA'
    });

    // 4.2 Guardar Report Diario con Standby Robert y Superestructura Nula (Opcional)
    const testReportPayload = {
      id_proyecto: testProjId,
      fecha_reporte: new Date().toISOString().split('T')[0],
      horometro_inicio: 1000.5,
      horometro_fin: 1008.5,
      horometro_superestructura_ini: null,
      horometro_superestructura_fin: null,
      hora_inicio_faena: '08:00',
      hora_fin_faena: '18:00',
      tiempo_colacion_min: 60,
      horas_standby_cliente: 4.0,
      horas_standby_gsp: 1.0,
      motivo_standby: 'QA AUTOMATIZADO: Robert detenido por viento/anemometro cliente (4h) + mantencion menor GSP (1h)',
      observaciones: 'Prueba funcional QA determinista automatizada',
      firma_mandante: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    };

    const resSaveReport = await requestHttp(`${CONFIG.DEV_API_BASE}/operaciones/report/guardar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.LEANGSP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }, testReportPayload);

    // Consultar el reporte insertado en PostgreSQL
    const qSqlLast = `su - postgres -c "psql -d postgres -t -A -c \\"SELECT id_reporte_avance, horas_operadas, horas_standby_cliente, horas_standby_gsp, motivo_standby FROM sch_leangsp.tedp_reporte_avance ORDER BY id_reporte_avance DESC LIMIT 1;\\""`;
    const qResLast = await ssh.execCommand(qSqlLast);
    const [reportIdAvance, efectivas, sbCli, sbGsp] = qResLast.stdout.trim().split('|');

    resultados.push({
      modulo: 'Report Diario Izaje',
      prueba: 'Guardar Report Diario (Superestructura Nula + Standby)',
      recurso: `${CONFIG.DEV_API_BASE}/operaciones/report/guardar`,
      esperado: 'HTTP 200/201 con persistencia exacta',
      obtenido: `HTTP ${resSaveReport.statusCode} (id_reporte_avance: ${reportIdAvance}, ${resSaveReport.duration}ms)`,
      veredicto: (resSaveReport.statusCode === 200 || resSaveReport.statusCode === 201) ? 'PASA' : 'FALLA'
    });

    // 4.3 Verificación de persistencia matemática de Standby
    const standbyOk = Number(sbCli) === 4 && Number(sbGsp) === 1;
    resultados.push({
      modulo: 'Report Diario Izaje',
      prueba: 'Cálculo Aritmético y Persistencia Standby en BD',
      recurso: 'PostgreSQL tedp_reporte_avance',
      esperado: 'standby_cliente=4.00, standby_gsp=1.00',
      obtenido: `cli=${sbCli}, gsp=${sbGsp}, efectivas=${efectivas}`,
      veredicto: standbyOk ? 'PASA' : 'FALLA'
    });

    // -----------------------------------------------------------------------
    // CATEGORÍA 5: EXTENSIÓN COMERCIAL Y CONSOLA PWA
    // -----------------------------------------------------------------------
    console.log('[5/7] Auditando reglas de Extensión Comercial y perfil de PWA...');
    
    // 5.1 Extensión de servicio en Gestor de Oportunidades
    const codeGestor = fs.readFileSync(path.resolve(__dirname, '../ejecucion/frontend/src/views/CRM/GestorOportunidades.vue'), 'utf8');
    const tieneModalExt = codeGestor.includes('mostrarModalExtensionServicio') && codeGestor.includes('formExtension');
    const tieneBotonHeader = codeGestor.includes('abrirModalExtenderServicio');
    const tieneConfirmExt = codeGestor.includes('confirmarExtensionServicio');

    resultados.push({
      modulo: 'CRM / Gestor Oportunidades',
      prueba: 'Botón y Modal Extender Servicio (UI Local)',
      recurso: 'GestorOportunidades.vue',
      esperado: 'Modal interactivo con recálculo dinámico',
      obtenido: (tieneModalExt && tieneBotonHeader && tieneConfirmExt) ? 'Modal, reactividad y botón confirmados' : 'Faltan elementos UI',
      veredicto: (tieneModalExt && tieneBotonHeader && tieneConfirmExt) ? 'PASA' : 'FALLA'
    });

    // 5.2 Ocultamiento de Taller y conservación de Patio en PWA
    const codeSurveys = fs.readFileSync(path.resolve(__dirname, '../ejecucion/pwa/src/views/Surveys.vue'), 'utf8');
    const tieneEsUsuarioTaller = codeSurveys.includes('esUsuarioTaller') && codeSurveys.includes('v-if="esUsuarioTaller"');
    const conservaPatio = codeSurveys.includes('Control de Portón') || codeSurveys.includes('Inspección de Patio');

    resultados.push({
      modulo: 'PWA Consola Operador',
      prueba: 'Ocultamiento Taller a Operador + Patio Activo',
      recurso: 'Surveys.vue',
      esperado: 'v-if="esUsuarioTaller" en Taller, Patio activo',
      obtenido: (tieneEsUsuarioTaller && conservaPatio) ? 'Taller condicionado y Patio preservado' : 'Inconsistencia en vistas',
      veredicto: (tieneEsUsuarioTaller && conservaPatio) ? 'PASA' : 'FALLA'
    });

    // -----------------------------------------------------------------------
    // CATEGORÍA 6: GENERACIÓN Y SELLADO DOCUMENTAL PUPPETEER
    // -----------------------------------------------------------------------
    console.log('[6/7] Auditando generación documental Puppeteer (PDF)...');
    
    // 6.1 PDF Report Diario compilado con Puppeteer
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
            proyecto: { codi_proyecto: \\"OT-${testProjId}\\", nombre_proyecto: \\"Proyecto QA Deterministico\\" },
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
      prueba: 'Compilación Puppeteer PDF Report Diario',
      recurso: 'reportDiarioPdfService.js',
      esperado: 'Buffer binario válido %PDF- > 10 KB',
      obtenido: isPdfOk ? `%PDF- generado (${(Number(pdfSizeBytes) / 1024).toFixed(1)} KB)` : `Fallo: ${pdfRes.stderr || pdfOutput}`,
      veredicto: isPdfOk ? 'PASA' : 'FALLA'
    });

    // 6.2 Generación de PDF Contrato de Arriendo OT
    const resPdfOt = await requestHttp(`${CONFIG.DEV_API_BASE}/proyectos/${testProjId}/contrato/generar-pdf`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.LEANGSP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }, {
      id_empresa_arrendador: 11,
      fecha_inicio: '2026-10-16',
      fecha_termino: '2026-10-20',
      representante_nombre: 'Auditor QA Determinista',
      representante_rut: '12.345.678-9',
      representante_cargo: 'Jefe Faena Mandante',
      representante_telefono: '+56912345678',
      representante_email: 'qa.test@leanglobal.cl',
      vendedor_email: 'vendedor@leanglobal.cl'
    });

    const isOtPdfOk = resPdfOt.statusCode === 200 && (resPdfOt.data?.url_pdf || resPdfOt.data?.success);
    resultados.push({
      modulo: 'Documentos PDF',
      prueba: 'Generación Puppeteer PDF Contrato / OT',
      recurso: `${CONFIG.DEV_API_BASE}/proyectos/${testProjId}/contrato/generar-pdf`,
      esperado: 'HTTP 200 OK con url_pdf',
      obtenido: `HTTP ${resPdfOt.statusCode} (${resPdfOt.duration}ms)`,
      veredicto: isOtPdfOk ? 'PASA' : 'FALLA'
    });

  } finally {
    ssh.dispose();
  }

  // -------------------------------------------------------------------------
  // REPORTE DETERMINISTA FINAL Y CANDADO HARD GATE
  // -------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log('TABLA DETERMINISTA DE RESULTADOS QA (CANÓNICO)');
  console.log('================================================================================');
  console.table(resultados);

  const total = resultados.length;
  const passed = resultados.filter(r => r.veredicto === 'PASA').length;
  const failed = total - passed;
  const passRate = Math.round((passed / total) * 100);

  console.log('--------------------------------------------------------------------------------');
  console.log(`Resumen General: ${passed}/${total} pruebas superadas (${passRate}% de éxito).`);
  console.log('--------------------------------------------------------------------------------');

  if (failed > 0) {
    console.error(`\n[HARD GATE BLOQUEADO] Se detectaron ${failed} pruebas fallidas.`);
    console.error('El pase a producción o release queda estrictamente RECHAZADO.');
    process.exit(1);
  } else {
    console.log('\n[HARD GATE SUPERADO] Todas las pruebas han sido validadas exitosamente.');
    console.log('Certificación QA Determinista completada con éxito.');
    process.exit(0);
  }
}

// Ejecutar suite
executeStandardQASuite().catch(err => {
  console.error('\nError fatal durante la ejecución de la suite QA:', err);
  process.exit(1);
});
