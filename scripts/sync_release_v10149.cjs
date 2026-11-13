const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const fs = require('fs');
const path = require('path');
const ssh = new NodeSSH();

async function syncV10149() {
  console.log('=== SINCRONIZANDO RELEASES v1.0.149 (REQ-1057 / SPEC-086) EN BD ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const sql = `
    -- =========================================================================
    -- 1. DEV: BACKLOG (tcfg_backlog) Y RELEASES (tcfg_releases)
    -- =========================================================================
    INSERT INTO sch_leangsp.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
    VALUES (
      'REQ-1057',
      'Expediente Documental Integral E2E de Procesos y OTs en Gestor Documental (Alineación Flujo Izaje vs Plataformas)',
      'Reestructuración canónica del Gestor Documental (Documentos.vue): 5 etapas base de izaje (Comercial, Asignación OT, Logística/Acreditaciones, Operación en Faena, Liquidación/EDP); etapa 6 (Arriendo Plataformas BSM) estrictamente condicional; conteo limpio por cliente (X procesos en Nivel 1) y contadores dinámicos X de Y Etapas Activas.',
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

    INSERT INTO sch_leangsp.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES (
      'v1.0.149',
      'Portal Web GSP v1.0.149 - Reestructuración Canónica Expediente E2E Izaje vs Plataformas en Gestor Documental',
      'Feature',
      'Normalización a 5 etapas base para servicios de izaje; condicionalidad estricta para arriendo de plataformas; agrupación limpia por cliente sin cálculo prematuro de documentos en Nivel 1; y badges dinámicos de etapas.',
      jsonb_build_array('REQ-1057'),
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET
      titulo = EXCLUDED.titulo,
      tipo_release = EXCLUDED.tipo_release,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;

    -- =========================================================================
    -- 2. PROD: BACKLOG Y RELEASES
    -- =========================================================================
    INSERT INTO sch_leangsp_prod.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
    VALUES (
      'REQ-1057',
      'Expediente Documental Integral E2E de Procesos y OTs en Gestor Documental (Alineación Flujo Izaje vs Plataformas)',
      'Reestructuración canónica del Gestor Documental (Documentos.vue): 5 etapas base de izaje (Comercial, Asignación OT, Logística/Acreditaciones, Operación en Faena, Liquidación/EDP); etapa 6 (Arriendo Plataformas BSM) estrictamente condicional; conteo limpio por cliente (X procesos en Nivel 1) y contadores dinámicos X de Y Etapas Activas.',
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

    INSERT INTO sch_leangsp_prod.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES (
      'v1.0.149',
      'Portal Web GSP v1.0.149 - Reestructuración Canónica Expediente E2E Izaje vs Plataformas en Gestor Documental',
      'Feature',
      'Normalización a 5 etapas base para servicios de izaje; condicionalidad estricta para arriendo de plataformas; agrupación limpia por cliente sin cálculo prematuro de documentos en Nivel 1; y badges dinámicos de etapas.',
      jsonb_build_array('REQ-1057'),
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET
      titulo = EXCLUDED.titulo,
      tipo_release = EXCLUDED.tipo_release,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;
  `;

  const localSql = path.join(__dirname, 'temp_sync_v10149.sql');
  fs.writeFileSync(localSql, sql);
  await ssh.putFile(localSql, '/tmp/sync_v10149.sql');
  fs.unlinkSync(localSql);

  const execRes = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sync_v10149.sql"');
  console.log('Resultado Ejecución SQL:\n', execRes.stdout || execRes.stderr);

  await ssh.execCommand('rm -f /tmp/sync_v10149.sql');
  ssh.dispose();
  console.log('=== SINCRONIZACIÓN BD COMPLETADA CON ÉXITO ===');
}

syncV10149().catch(err => {
  console.error('Error sincronizando BD:', err);
  process.exit(1);
});
