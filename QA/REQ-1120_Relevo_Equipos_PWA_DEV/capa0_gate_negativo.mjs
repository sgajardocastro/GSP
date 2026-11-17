// Capa 0: Gate Negativo Determinista (Anti-Happy Path)
// Valida que la API rechaza activamente estados, traslapes y parámetros inválidos con HTTP 400/409/404.

const API_BASE = 'https://servidor.leanglobal.cl/lg-gsp-dev/api';

async function testGateNegativo() {
  console.log('=== INICIANDO CAPA 0: GATE NEGATIVO DETERMINISTA ===\n');
  let exitos = 0;
  let total = 0;

  // Test 1: Intento de inicio de jornada sin id_equipo en proyecto de izaje (HTTP 400 o 409 Bloqueo de Gatekeeper)
  total++;
  try {
    const res = await fetch(`${API_BASE}/operaciones/report/inicio-jornada`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_proyecto: 1, // Proyecto dummy
        id_equipo: null,
        id_user_operador: 62,
        dia_correlativo: 1,
        fecha_reporte: '2026-11-15'
      })
    });
    if (res.status === 400 || res.status === 409) {
      console.log(`✅ Test 1 PASÓ: Rechazo determinista HTTP ${res.status} - Bloqueo de validación/gatekeeper.`);
      exitos++;
    } else {
      console.error(`❌ FALLO Test 1: Debió rechazar con 400 o 409 pero respondió HTTP ${res.status}`);
    }
  } catch (err) {
    console.error('❌ FALLO Test 1 con error:', err.message);
  }

  // Test 2: Intento de inicio de jornada sin id_user_operador (HTTP 400)
  total++;
  try {
    const res = await fetch(`${API_BASE}/operaciones/report/inicio-jornada`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_proyecto: 1,
        id_equipo: 38,
        id_user_operador: null,
        dia_correlativo: 1,
        fecha_reporte: '2026-11-15'
      })
    });
    if (res.status === 400) {
      console.log(`✅ Test 2 PASÓ: Rechazo determinista HTTP ${res.status} - Operador requerido.`);
      exitos++;
    } else {
      console.error(`❌ FALLO Test 2: Debió rechazar con 400 pero respondió HTTP ${res.status}`);
    }
  } catch (err) {
    console.error('❌ FALLO Test 2 con error:', err.message);
  }

  // Test 3: Consulta de contexto sin id_proyecto (HTTP 404)
  total++;
  try {
    const res = await fetch(`${API_BASE}/operaciones/report/contexto/`);
    if (res.status === 404 || res.status === 400) {
      console.log(`✅ Test 3 PASÓ: Rechazo determinista HTTP ${res.status} - Ruta exige id_proyecto.`);
      exitos++;
    } else {
      console.error(`❌ FALLO Test 3: Debió rechazar pero respondió HTTP ${res.status}`);
    }
  } catch (err) {
    console.error('❌ FALLO Test 3 con error:', err.message);
  }

  // Test 4: Consulta de reports pendientes sin id_user (HTTP 400)
  total++;
  try {
    const res = await fetch(`${API_BASE}/operaciones/reports/usuario/pendientes`);
    if (res.status === 400) {
      console.log(`✅ Test 4 PASÓ: Rechazo determinista HTTP ${res.status} - id_user es requerido.`);
      exitos++;
    } else {
      console.error(`❌ FALLO Test 4: Debió rechazar con 400 pero respondió HTTP ${res.status}`);
    }
  } catch (err) {
    console.error('❌ FALLO Test 4 con error:', err.message);
  }

  console.log(`\n=== RESUMEN CAPA 0: ${exitos}/${total} TESTS PASADOS (100% Determinista) ===\n`);
  if (exitos !== total) process.exit(1);
}

testGateNegativo().catch(e => {
  console.error('ERROR CAPA 0:', e);
  process.exit(1);
});
