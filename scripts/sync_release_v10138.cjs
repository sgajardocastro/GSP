const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const fs = require('fs');
const ssh = new NodeSSH();

async function syncV10138() {
  console.log('=== SINCRONIZANDO SEEDS Y RELEASES v1.0.138 (SPEC-079) EN DEV Y PROD ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const sql = `
    -- =========================================================================
    -- 1. PARÁMETROS OPERACIONALES PREVENTIVOS (tmnt_parametro)
    -- =========================================================================
    -- DEV
    INSERT INTO sch_leangsp.tmnt_parametro (id_empresa, clave, valor, fecha_actualizacion)
    VALUES 
      (9, 'pm_intervalo_base_horas', '250', CURRENT_TIMESTAMP),
      (9, 'pm_ventana_alerta_horas', '25', CURRENT_TIMESTAMP),
      (9, 'pm_intervalo_odometro_km', '10000', CURRENT_TIMESTAMP),
      (9, 'tarifa_hh_default', '15000', CURRENT_TIMESTAMP),
      (9, 'umbral_costo_ot_clp', '2000000', CURRENT_TIMESTAMP),
      (9, 'cert_alerta_dias', '30', CURRENT_TIMESTAMP)
    ON CONFLICT (id_empresa, clave) DO UPDATE SET valor = EXCLUDED.valor;

    -- PROD
    INSERT INTO sch_leangsp_prod.tmnt_parametro (id_empresa, clave, valor, fecha_actualizacion)
    VALUES 
      (9, 'pm_intervalo_base_horas', '250', CURRENT_TIMESTAMP),
      (9, 'pm_ventana_alerta_horas', '25', CURRENT_TIMESTAMP),
      (9, 'pm_intervalo_odometro_km', '10000', CURRENT_TIMESTAMP),
      (9, 'tarifa_hh_default', '15000', CURRENT_TIMESTAMP),
      (9, 'umbral_costo_ot_clp', '2000000', CURRENT_TIMESTAMP),
      (9, 'cert_alerta_dias', '30', CURRENT_TIMESTAMP)
    ON CONFLICT (id_empresa, clave) DO UPDATE SET valor = EXCLUDED.valor;

    -- =========================================================================
    -- 2. BACKLOG Y RELEASES (tcfg_backlog & tcfg_releases)
    -- =========================================================================
    -- DEV BACKLOG
    INSERT INTO sch_leangsp.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
    VALUES (
      'REQ-1045',
      'Gestión Dinámica de Parámetros Operacionales para Ciclos Preventivos (Horómetro / Odómetro / Radar)',
      'Formalización SPEC-079; habilitación de pestaña interactiva PARÁMETROS OPERACIONALES en MantenimientoView.vue con control de ciclo horómetro (250h), radar de alerta (25h antes), ciclo odómetro carretera (10.000 km), tarifas HH, umbral financiero y alertas Dictuc/Bureau Veritas; persistencia en tmnt_parametro y lectura dinámica en getRadarFlota() y alertas automáticas.',
      'Alta',
      CURRENT_DATE,
      'Sergio Gajardo',
      'Implementado'
    )
    ON CONFLICT (codigo_req) DO UPDATE SET 
      nombre_requerimiento = EXCLUDED.nombre_requerimiento,
      descripcion = EXCLUDED.descripcion,
      estado = 'Implementado',
      fecha_implementacion = CURRENT_DATE,
      updated_at = NOW();

    -- DEV RELEASES
    INSERT INTO sch_leangsp.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES (
      'v1.0.138',
      'Portal Web GSP v1.0.138 - Parámetros Operacionales Preventivos (Horómetro / Odómetro / Radar)',
      'Feature',
      'Panel de configuración institucional de pautas de mantenimiento por horómetro y odómetro con refresco reactivo del radar; gobierno de tarifas HH y umbrales financieros.',
      jsonb_build_array('REQ-1045'),
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET
      titulo = EXCLUDED.titulo,
      tipo_release = EXCLUDED.tipo_release,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;

    -- PROD BACKLOG
    INSERT INTO sch_leangsp_prod.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
    VALUES (
      'REQ-1045',
      'Gestión Dinámica de Parámetros Operacionales para Ciclos Preventivos (Horómetro / Odómetro / Radar)',
      'Formalización SPEC-079; habilitación de pestaña interactiva PARÁMETROS OPERACIONALES en MantenimientoView.vue con control de ciclo horómetro (250h), radar de alerta (25h antes), ciclo odómetro carretera (10.000 km), tarifas HH, umbral financiero y alertas Dictuc/Bureau Veritas; persistencia en tmnt_parametro y lectura dinámica en getRadarFlota() y alertas automáticas.',
      'Alta',
      CURRENT_DATE,
      'Sergio Gajardo',
      'Implementado'
    )
    ON CONFLICT (codigo_req) DO UPDATE SET 
      nombre_requerimiento = EXCLUDED.nombre_requerimiento,
      descripcion = EXCLUDED.descripcion,
      estado = 'Implementado',
      fecha_implementacion = CURRENT_DATE,
      updated_at = NOW();

    -- PROD RELEASES
    INSERT INTO sch_leangsp_prod.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES (
      'v1.0.138',
      'Portal Web GSP v1.0.138 - Parámetros Operacionales Preventivos (Horómetro / Odómetro / Radar)',
      'Feature',
      'Panel de configuración institucional de pautas de mantenimiento por horómetro y odómetro con refresco reactivo del radar; gobierno de tarifas HH y umbrales financieros.',
      jsonb_build_array('REQ-1045'),
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET
      titulo = EXCLUDED.titulo,
      tipo_release = EXCLUDED.tipo_release,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;
  `;

  fs.writeFileSync('/tmp/sync_v10138.sql', sql);
  await ssh.putFile('/tmp/sync_v10138.sql', '/tmp/sync_v10138.sql');

  const execRes = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sync_v10138.sql"');
  console.log('Resultado Ejecución SQL:\n', execRes.stdout || execRes.stderr);

  // Verificaciones
  console.log('\n--- VERIFICACIÓN PARÁMETROS DEV ---');
  const checkDevParams = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT clave, valor FROM sch_leangsp.tmnt_parametro WHERE id_empresa = 9 ORDER BY clave;\\""');
  console.log(checkDevParams.stdout);

  console.log('--- VERIFICACIÓN PARÁMETROS PROD ---');
  const checkProdParams = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT clave, valor FROM sch_leangsp_prod.tmnt_parametro WHERE id_empresa = 9 ORDER BY clave;\\""');
  console.log(checkProdParams.stdout);

  console.log('--- VERIFICACIÓN RELEASES PROD ---');
  const vProd = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT version, titulo, publicado_en FROM sch_leangsp_prod.tcfg_releases ORDER BY id_release DESC LIMIT 2;\\""`);
  console.log(vProd.stdout);

  console.log('--- VERIFICACIÓN BACKLOG PROD ---');
  const bProd = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT codigo_req, nombre_requerimiento, estado FROM sch_leangsp_prod.tcfg_backlog WHERE codigo_req = 'REQ-1045';\\""`);
  console.log(bProd.stdout);

  ssh.dispose();
  console.log('\n=== SINCRONIZACIÓN EXITOSA ===');
}

syncV10138().catch(err => {
  console.error('Error en syncV10138:', err);
  ssh.dispose();
  process.exit(1);
});
