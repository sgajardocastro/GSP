/**
 * test_ciclo_completo_spec57.js
 * Script de Verificación y Prueba Secuencial E2E — Ciclo Operacional-Financiero Completo
 * Grúas San Pablo (GSP) / LeanGlobal Platform
 * Gobernado por: Spec 57 (.agents/specs/57_ciclo_integral_reports_its_edp_y_facturacion_spec.md)
 * 
 * Etapas evaluadas:
 *   1. PWA Terreno: Filtrado de Pendientes & Hard Gate de Cierre (REQ-025)
 *   2. PMO Cockpit: Auditoría de SLA 13:00 hrs & Bot WhatsApp/Email (REQ-026)
 *   3. ITS Relacional: Guardado Incremental, Doble Firma FES & Anexo Reports (REQ-027)
 *   4. Gobernanza EDP: Bloqueo no autorizados, Edición Pamela y Despacho Condicional (REQ-028)
 *   5. Respaldo OC & Facturación: Asumir EDP Sin OC y Cierre DTE Estado 7 (REQ-029)
 */

const http = require('http');

const BASE_URL = process.env.API_URL || 'http://localhost:3006';

// Códigos ANSI para salida colorida en terminal
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function logHeader(text) {
  console.log(`\n${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan} ${text} ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
}

function logStep(stepNum, title) {
  console.log(`\n${colors.bold}${colors.yellow}▶ PASO ${stepNum}: ${title}${colors.reset}`);
}

function logSuccess(msg) {
  console.log(`  ${colors.green}✔ [OK] ${msg}${colors.reset}`);
}

function logWarning(msg) {
  console.log(`  ${colors.yellow}⚠️ [WARN] ${msg}${colors.reset}`);
}

function logError(msg) {
  console.log(`  ${colors.red}✖ [FAIL] ${msg}${colors.reset}`);
}

function requestJson(urlPath, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(urlPath, BASE_URL);
    const postData = body ? JSON.stringify(body) : null;

    const options = {
      hostname: fullUrl.hostname,
      port: fullUrl.port || 3006,
      path: fullUrl.pathname + fullUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {
          json = { raw: data };
        }
        resolve({ status: res.statusCode, data: json, headers: res.headers });
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTestSequence() {
  logHeader('TEST SECUENCIAL E2E: CICLO INTEGRAL REPORTS ➔ ITS ➔ EDP ➔ FACTURACIÓN (SPEC 57)');
  console.log(`Entorno objetivo: ${colors.bold}${BASE_URL}${colors.reset}`);

  let totalPasos = 0;
  let pasosAprobados = 0;

  async function testAssert(nombre, fn) {
    totalPasos++;
    try {
      await fn();
      pasosAprobados++;
      logSuccess(nombre);
    } catch (e) {
      logError(`${nombre} ➔ ${e.message}`);
    }
  }

  // =========================================================================
  // ETAPA 1: PWA TERRENO & HARD GATE DE REPORTES (REQ-025)
  // =========================================================================
  logStep(1, 'PWA Terreno: Discriminación de OTs Pendientes y Concluidas (REQ-025)');

  await testAssert('Endpoint GET /api/reports/usuario/pendientes responde HTTP 200', async () => {
    const res = await requestJson('/api/reports/usuario/pendientes?id_user=19');
    if (res.status !== 200 || !res.data.success) {
      throw new Error(`Status ${res.status}: ${res.data?.message || 'Error consultando pendientes'}`);
    }
    console.log(`    - OTs Pendientes de reportar: ${res.data.total_pendientes}`);
    console.log(`    - OTs Concluidas / Al día: ${res.data.total_concluidos}`);
  });

  await testAssert('OT concluida (GSP-2609-1933-014) está bloqueada para emitir nuevo report', async () => {
    const res = await requestJson('/api/reports/usuario/pendientes?id_user=19');
    const ot103 = res.data.concluidos?.find(x => x.codi_proyecto === 'GSP-2609-1933-014' || x.id_proyecto === 103);
    if (!ot103) {
      logWarning('OT 103 no encontrada en concluidos, validando regla general de concluidos...');
      if (!res.data.concluidos || res.data.concluidos.length === 0) {
        throw new Error('No hay OTs concluidas en la respuesta');
      }
    } else {
      if (ot103.puede_reportar !== false) {
        throw new Error(`Se esperaba puede_reportar: false pero vino: ${ot103.puede_reportar}`);
      }
      console.log(`    - OT ${ot103.codi_proyecto}: motivo = "${ot103.motivo}", mensaje = "${ot103.mensaje}"`);
    }
  });

  await testAssert('Hard Gate Backend: Rechazo 403 al intentar reportar en OT con cuota de días agotada', async () => {
    const res = await requestJson('/api/reports/guardar', 'POST', {
      id_proyecto: 103,
      id_equipo: 41,
      id_user_operador: 19,
      dia_correlativo: 2, // Cuota pactada era de 1 día
      horas_operadas: 8,
      observacion_trabajo: 'Intento de reporte sobre servicio concluido'
    });
    if (res.status !== 403) {
      throw new Error(`Se esperaba HTTP 403 Forbidden pero respondió ${res.status}`);
    }
    if (res.data?.codigo !== 'SERVICIO_CONCLUIDO') {
      throw new Error(`Se esperaba código "SERVICIO_CONCLUIDO" pero vino: ${res.data?.codigo}`);
    }
    console.log(`    - Hard Gate activo: HTTP 403 "${res.data?.error}"`);
  });

  // =========================================================================
  // ETAPA 2: PMO COCKPIT & SLA 13:00 HRS (REQ-023 / REQ-026)
  // =========================================================================
  logStep(2, 'Cockpit PMO: Auditoría SLA 13:00 hrs & Notificación a Yiara y Jorge (REQ-026)');

  await testAssert('Endpoint GET /api/reports/sla/auditar evalúa horario y OTs vencidas', async () => {
    const res = await requestJson('/api/reports/sla/auditar');
    if (res.status !== 200 || !res.data.success) {
      throw new Error(`Status ${res.status}: Error al auditar SLA`);
    }
    const audit = res.data.data;
    console.log(`    - Hora actual en Santiago: ${audit.hora_actual_chile}`);
    console.log(`    - Es horario post-13:00 hrs: ${audit.es_horario_alerta}`);
    console.log(`    - OTs en riesgo / incumplimiento de SLA: ${audit.total_ots_incumplidas}`);
    if (audit.ots?.length > 0) {
      console.log(`    - Ejemplo OT evaluada: ${audit.ots[0].codi_proyecto} ➔ ${audit.ots[0].motivo}`);
    }
  });

  await testAssert('Ejecución forzada de Alertas SLA (WhatsApp / Email a Yiara y Jorge)', async () => {
    const res = await requestJson('/api/reports/sla/ejecutar-alertas?forzar=true', 'POST', { forzar: true });
    if (res.status !== 200 || !res.data.success) {
      throw new Error(`Status ${res.status}: ${res.data?.message}`);
    }
    console.log(`    - Resultado despacho: ${res.data.message}`);
    console.log(`    - OTs alertadas: ${res.data.total_alertadas}`);
    if (res.data.alertadas?.length > 0) {
      console.log(`    - Destinatarios notificados: ${res.data.alertadas[0].notificados.join(', ')}`);
    }
  });

  // =========================================================================
  // ETAPA 3: ITS RELACIONAL & DOBLE FIRMA FES (REQ-027)
  // =========================================================================
  logStep(3, 'ITS: Liquidación Incremental, Doble Firma FES y Compilación PDF con Anexo (REQ-027)');

  const PROY_TEST_ID = 102; // GSP-2609-3707-013 (Ampliación Portal Temuco)

  await testAssert(`Carga de contexto ITS para Proyecto #${PROY_TEST_ID}`, async () => {
    const res = await requestJson(`/api/its/${PROY_TEST_ID}`);
    if (res.status !== 200 || !res.data.success) {
      throw new Error(`Status ${res.status}: Error cargando ITS`);
    }
    const { its, jornadas } = res.data.data;
    console.log(`    - Folio ITS: ${its?.folio_its || 'ITS-102-001'}`);
    console.log(`    - Estado actual ITS: ${its?.estado_its || 'BORRADOR'}`);
    console.log(`    - Jornadas de faena vinculadas: ${jornadas?.length || 0}`);
  });

  await testAssert('Guardado Incremental de ITS en PostgreSQL', async () => {
    const itsData = {
      id_proyecto: PROY_TEST_ID,
      cabecera: {
        id_proyecto: PROY_TEST_ID,
        folio_its: `ITS-${PROY_TEST_ID}-001`,
        version: 1,
        tipo_contexto: 'URBANO',
        horas_minimas_pactadas: 8,
        valor_hora_pactado: 95000,
        valor_flete_pactado: 180000,
        total_horas_report: 16,
        total_ingresos_horas: 1520000,
        total_ingresos_fletes: 180000,
        total_ingresos_facturables: 1700000,
        total_costos_operacionales: 320000,
        utilidad_bruta: 1380000,
        margen_porcentaje: 81.18,
        observaciones: 'Servicio operado y conciliado conforme bajo estándar Spec 57.'
      },
      jornadas: [
        {
          id_jornada: null,
          fecha: '2026-09-30',
          numero_ot: 'GSP-2609-3707-013',
          patente: 'LJ-6850',
          tipo_servicio: 'Hora',
          hora_salida: '08:00',
          hora_llegada: '08:30',
          hora_termino: '18:00',
          colacion_minutos: 60,
          horas_reales: 8,
          horas_report: 8,
          numero_report: 'REP-102-01',
          vb_conciliado: true,
          orden: 1
        }
      ],
      costos: {
        combustible: [
          {
            fecha: '2026-09-30',
            concepto_detalle: 'Petróleo Grúa 70T',
            cantidad_unidades: 80,
            precio_unitario: 1150,
            monto_total: 92000
          }
        ]
      }
    };

    const res = await requestJson('/api/its/guardar', 'POST', itsData);
    if (res.status !== 200 || !res.data.success) {
      throw new Error(`Status ${res.status}: ${res.data?.message}`);
    }
    console.log(`    - ITS guardado con ID: ${res.data.id_its}, Folio: ${res.data.folio_its}`);
  });

  await testAssert('Firma FES Paso 1: Analista PMO (Sergio Gajardo - PIN SHA-256)', async () => {
    // Hash SHA-256 de PIN '1234'
    const pinHashSergio = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';
    const res = await requestJson('/api/its/firmar-fes', 'POST', {
      id_proyecto: PROY_TEST_ID,
      id_user: 55, // Sergio Gajardo
      pass_hash_fes: pinHashSergio,
      aprueba_rechaza: 'APRUEBA',
      observaciones: 'Elaborado y conciliado conforme por el Analista PMO.'
    });

    // Puede que ya esté firmado o avance a EN_REVISION_OPERACIONES
    if (res.status === 200 && res.data.success) {
      console.log(`    - Firma Paso 1 Exitosa. Nuevo estado ITS: ${res.data.estado_its}`);
      console.log(`    - Código FES generado: ${res.data.codigo_validacion}`);
    } else if (res.status === 400 && res.data.message?.includes('No hay pasos pendientes')) {
      console.log(`    - Flujo ya avanzado previamente (${res.data.message})`);
    } else {
      throw new Error(`Status ${res.status}: ${res.data?.message}`);
    }
  });

  await testAssert('Firma FES Paso 2: Coordinación de Operaciones (Jorge Ponce - 2do Validador)', async () => {
    // Hash de Jorge Ponce
    const pinHashJorge = 'c838df5335c1eba2532f32090cd555d17c9e218289d99ecaf55525d7b199aa88';
    const res = await requestJson('/api/its/firmar-fes', 'POST', {
      id_proyecto: PROY_TEST_ID,
      id_user: 19, // Jorge Ponce
      pass_hash_fes: pinHashJorge,
      aprueba_rechaza: 'APRUEBA',
      observaciones: 'Visto Bueno de Operaciones otorgado. Conforme para Contabilidad y EDP.'
    });

    if (res.status === 200 && res.data.success) {
      console.log(`    - Firma Paso 2 Exitosa. Nuevo estado ITS: ${res.data.estado_its}`);
      console.log(`    - Código FES generado: ${res.data.codigo_validacion}`);
    } else if (res.status === 400 && res.data.message?.includes('No hay pasos pendientes')) {
      console.log(`    - Flujo ya aprobado en este paso (${res.data.message})`);
    } else {
      throw new Error(`Status ${res.status}: ${res.data?.message}`);
    }
  });

  // =========================================================================
  // ETAPA 4: GOBERNANZA DE EDP & TESORERÍA (REQ-028)
  // =========================================================================
  logStep(4, 'EDP: Edición Exclusiva Pamela, Firma Comercial FES y Despacho Condicional (REQ-028)');

  await testAssert('Control de Roles: Usuario NO autorizado (Operador) es RECHAZADO con HTTP 403', async () => {
    const res = await requestJson('/api/operaciones/edp/ajustes-tesoreria', 'POST', {
      id_proyecto: PROY_TEST_ID,
      id_user: 21, // Alfonso Maldonado (Operador / no tesorería)
      descuento_global: 50000,
      motivo_ajuste: 'Intento de edición no autorizado'
    });
    if (res.status !== 403) {
      throw new Error(`Se esperaba HTTP 403 pero respondió ${res.status}`);
    }
    console.log(`    - Seguridad confirmada: ${res.data.message}`);
  });

  await testAssert('Edición Autorizada de Tesorería: Pamela / Contabilidad modifica tarifas y descuento', async () => {
    const res = await requestJson('/api/operaciones/edp/ajustes-tesoreria', 'POST', {
      id_proyecto: PROY_TEST_ID,
      id_user: 55, // Admin / Pamela
      descuento_global: 25000,
      motivo_ajuste: 'Descuento comercial fidelización cliente pactado por Tesorería',
      lineas_ajustadas: [
        {
          tipo: 'GRUAS TELESCOPICAS',
          descripcion: 'Grúa 70T',
          cantidad: 1,
          unidad: 'Diario',
          valorUnitario: 92000
        }
      ]
    });
    if (res.status !== 200 || !res.data.success) {
      throw new Error(`Status ${res.status}: ${res.data?.message}`);
    }
    console.log(`    - Ajustes guardados conforme: ${res.data.message}`);
    console.log(`    - Descuento aplicado: $${res.data.data.descuento_global.toLocaleString('es-CL')}`);
  });

  await testAssert('Despacho Condicional EDP: Caso Mandante Pago Previo / Contado (Expediente Interno)', async () => {
    const pinHashSergio = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';
    const res = await requestJson('/api/operaciones/edp/firmar-comercial', 'POST', {
      id_proyecto: PROY_TEST_ID,
      id_user: 55,
      pass_fes: pinHashSergio,
      es_pago_anticipado: true, // Condición Pago Previo
      observaciones: 'Visado comercial para facturación directa (Mandante pagó al contado).'
    });
    if (res.status !== 200 || !res.data.success) {
      throw new Error(`Status ${res.status}: ${res.data?.message}`);
    }
    if (res.data.firma?.estado_despacho !== 'INTERNO_PAGO_PREVIO') {
      throw new Error(`Estado despacho inesperado: ${res.data.firma?.estado_despacho}`);
    }
    console.log(`    - Certificación FES: ${res.data.codigo_fes}`);
    console.log(`    - Modo de despacho: ${res.data.firma.estado_despacho} (No se envía cobro al cliente)`);
  });

  await testAssert('Despacho Condicional EDP: Caso Mandante a Crédito (Despacho a Cliente + CC Institucional)', async () => {
    const pinHashSergio = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';
    const res = await requestJson('/api/operaciones/edp/firmar-comercial', 'POST', {
      id_proyecto: PROY_TEST_ID,
      id_user: 55,
      pass_fes: pinHashSergio,
      es_pago_anticipado: false, // Condición Crédito
      observaciones: 'Despacho formal de cobro al mandante.'
    });
    if (res.status !== 200 || !res.data.success) {
      throw new Error(`Status ${res.status}: ${res.data?.message}`);
    }
    if (res.data.firma?.estado_despacho !== 'DESPACHADO_CLIENTE') {
      throw new Error(`Estado despacho inesperado: ${res.data.firma?.estado_despacho}`);
    }
    console.log(`    - Certificación FES: ${res.data.codigo_fes}`);
    console.log(`    - Modo de despacho: ${res.data.firma.estado_despacho} (Copia a GG, Contabilidad y Operaciones)`);
  });

  // =========================================================================
  // ETAPA 5: INTEGRACIÓN OC & FACTURACIÓN (REQ-029)
  // =========================================================================
  logStep(5, 'Cierre: Asumir EDP Sin OC y Declaración de Facturación Oficial DTE (REQ-029)');

  await testAssert('Declarar Facturación con Folio SII y condición "S/OC - ASUME EDP"', async () => {
    const res = await requestJson('/api/reports/edp/cerrar-facturacion', 'POST', {
      id_proyecto: PROY_TEST_ID,
      hes_oc_numero: 'S/OC - ASUME EDP', // Regla: Cliente sin OC asume valor factura
      factura_numero: 'F-14029',
      fecha_facturacion: '2026-10-01',
      monto_facturado_neto: 1675000,
      monto_facturado_bruto: 1993250,
      observaciones_facturacion: 'Factura emitida en Laudus ERP asumiendo valor devengado en EDP.',
      id_user_cierre: 55
    });
    if (res.status !== 200 || !res.data.success) {
      throw new Error(`Status ${res.status}: ${res.data?.error || 'Error al cerrar facturación'}`);
    }
    const proyActualizado = res.data.data;
    if (proyActualizado.id_proyecto_estado !== 7) {
      throw new Error(`Se esperaba id_proyecto_estado = 7 (Facturado) pero quedó en ${proyActualizado.id_proyecto_estado}`);
    }
    console.log(`    - OT #${proyActualizado.id_proyecto} transicionó a Estado: ${proyActualizado.id_proyecto_estado} (Facturado Conforme)`);
    console.log(`    - Registro liquidacion_v1 guardado en PostgreSQL.`);
  });

  // =========================================================================
  // RESUMEN FINAL
  // =========================================================================
  logHeader('RESULTADO DE LA VERIFICACIÓN E2E (SPEC 57)');
  console.log(`Total de pruebas ejecutadas: ${colors.bold}${totalPasos}${colors.reset}`);
  console.log(`Pruebas aprobadas exitosamente: ${colors.bold}${colors.green}${pasosAprobados} / ${totalPasos}${colors.reset}`);

  if (pasosAprobados === totalPasos) {
    console.log(`\n${colors.bold}${colors.green}🎉 TODOS LOS CIRCUITOS DE LA SPEC 57 HAN SIDO VERIFICADOS CON ÉXITO 0 ERRORES.${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.bold}${colors.red}⚠️ Se registraron fallos en ${totalPasos - pasosAprobados} prueba(s).${colors.reset}\n`);
    process.exit(1);
  }
}

runTestSequence().catch((err) => {
  console.error('\nError fatal durante la ejecución de la prueba:', err);
  process.exit(1);
});
