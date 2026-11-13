const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function syncReleases() {
  console.log('=== SINCRONIZANDO RELEASES REQ-1040 / SPEC-074 (Web v1.0.133) EN DEV Y PROD ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const sqlDev = `
    INSERT INTO sch_leangsp.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
    VALUES (
      'REQ-1040',
      'Estabilización Taller Enterprise: Resolución Multi-Esquema de Técnicos (42 Usuarios), Alerta Roja de Parada de Máquina en Terreno, Banner de Avisos en Bandeja de OTs y Auto-Refresco Reactivo en Consola Web',
      'Formalización canónica SPEC-074; corrección de getTecnicos eliminando prefijo sch_leangsp. y permitiendo usuarios con id_empresa nulo para listar 42 colaboradores clasificados por orden_rol; tira de alerta roja superior y banner en Bandeja de OTs para avisos de terreno; intervalo de auto-refresco reactivo a 30s en MantenimientoView.vue.',
      'Critica',
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
      'v1.0.133',
      'Portal Web GSP v1.0.133 - Estabilización Taller Enterprise: Multi-Esquema Técnicos, Alertas Reactivas de Averías y Auto-Refresco',
      'Feature & Hotfix',
      'Carga exitosa de 42 mecánicos y especialistas en selectores de OTM; barra de alerta roja inmediata para paradas de máquina; aviso contextual en Bandeja de OTs; auto-refresco automático de la consola de mantenimiento cada 30 segundos.',
      jsonb_build_array('REQ-1040'),
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET
      titulo = EXCLUDED.titulo,
      tipo_release = EXCLUDED.tipo_release,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;
  `;

  const sqlProd = `
    INSERT INTO sch_leangsp_prod.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
    VALUES (
      'REQ-1040',
      'Estabilización Taller Enterprise: Resolución Multi-Esquema de Técnicos (42 Usuarios), Alerta Roja de Parada de Máquina en Terreno, Banner de Avisos en Bandeja de OTs y Auto-Refresco Reactivo en Consola Web',
      'Formalización canónica SPEC-074; corrección de getTecnicos eliminando prefijo sch_leangsp. y permitiendo usuarios con id_empresa nulo para listar 42 colaboradores clasificados por orden_rol; tira de alerta roja superior y banner en Bandeja de OTs para avisos de terreno; intervalo de auto-refresco reactivo a 30s en MantenimientoView.vue.',
      'Critica',
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
      'v1.0.133',
      'Portal Web GSP v1.0.133 - Estabilización Taller Enterprise: Multi-Esquema Técnicos, Alertas Reactivas de Averías y Auto-Refresco',
      'Feature & Hotfix',
      'Carga exitosa de 42 mecánicos y especialistas en selectores de OTM; barra de alerta roja inmediata para paradas de máquina; aviso contextual en Bandeja de OTs; auto-refresco automático de la consola de mantenimiento cada 30 segundos.',
      jsonb_build_array('REQ-1040'),
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET
      titulo = EXCLUDED.titulo,
      tipo_release = EXCLUDED.tipo_release,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_spec74.sql\n${sqlDev}\n${sqlProd}\nEOF`);
  const rExec = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sync_spec74.sql"');
  console.log('Resultado SQL:\n', rExec.stdout.trim());
  if (rExec.stderr) console.error('Stderr:', rExec.stderr.trim());

  await ssh.execCommand('rm -f /tmp/sync_spec74.sql');

  console.log('\n--- VERIFICACIÓN RELEASES EN PROD ---');
  const vProd = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT version, titulo, publicado_en FROM sch_leangsp_prod.tcfg_releases ORDER BY id_release DESC LIMIT 3;\\""`);
  console.log(vProd.stdout.trim());

  console.log('\n--- VERIFICACIÓN BACKLOG EN PROD ---');
  const bProd = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT codigo_req, nombre_requerimiento, estado FROM sch_leangsp_prod.tcfg_backlog WHERE codigo_req = 'REQ-1040';\\""`);
  console.log(bProd.stdout.trim());

  ssh.dispose();
  console.log('\n🎉 Backlog y Releases v1.0.133 sincronizados exitosamente.');
}

syncReleases().catch(err => {
  console.error('Error sincronizando releases:', err);
  process.exit(1);
});
