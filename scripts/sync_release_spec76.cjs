const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function syncReleases() {
  console.log('=== SINCRONIZANDO RELEASES REQ-1041 / SPEC-076 (Web v1.0.134) EN DEV Y PROD ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sqlDev = `
    INSERT INTO sch_leangsp.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
    VALUES (
      'REQ-1041',
      'Almacenamiento Canónico LG-Storage, Previsualización Resiliente Anti-Popups y Despacho Dual de Contratos',
      'Formalización canónica SPEC-076; almacenamiento determinista bajo /u05/LeanDocs/GSP/{env}/contratos/{YYYY}/{MM} con path_doc relativo POSIX en tfmg_file; fallback multi-directorio para resolución de contratos legacy; apertura resiliente de pestaña previa a compilación y botón WhatsApp Web directo en CRM.',
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
      'v1.0.134',
      'Portal Web GSP v1.0.134 - Almacenamiento Canónico LG-Storage, Previsualización Resiliente y Despacho Dual de Contratos',
      'Feature & Hotfix',
      'Almacenamiento físico bajo /u05/LeanDocs, resolución determinista en /api/archivo/ver/1467, previsualización sin bloqueo de popups y despacho dual (WhatsApp Baileys + WhatsApp Web directo).',
      jsonb_build_array('REQ-1041'),
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
      'REQ-1041',
      'Almacenamiento Canónico LG-Storage, Previsualización Resiliente Anti-Popups y Despacho Dual de Contratos',
      'Formalización canónica SPEC-076; almacenamiento determinista bajo /u05/LeanDocs/GSP/{env}/contratos/{YYYY}/{MM} con path_doc relativo POSIX en tfmg_file; fallback multi-directorio para resolución de contratos legacy; apertura resiliente de pestaña previa a compilación y botón WhatsApp Web directo en CRM.',
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
      'v1.0.134',
      'Portal Web GSP v1.0.134 - Almacenamiento Canónico LG-Storage, Previsualización Resiliente y Despacho Dual de Contratos',
      'Feature & Hotfix',
      'Almacenamiento físico bajo /u05/LeanDocs, resolución determinista en /api/archivo/ver/1467, previsualización sin bloqueo de popups y despacho dual (WhatsApp Baileys + WhatsApp Web directo).',
      jsonb_build_array('REQ-1041'),
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET
      titulo = EXCLUDED.titulo,
      tipo_release = EXCLUDED.tipo_release,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_spec76.sql\n${sqlDev}\n${sqlProd}\nEOF`);
  const rExec = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sync_spec76.sql"');
  console.log('Resultado SQL:\n', rExec.stdout.trim());
  if (rExec.stderr) console.error('Stderr:', rExec.stderr.trim());

  await ssh.execCommand('rm -f /tmp/sync_spec76.sql');

  console.log('\n--- VERIFICACIÓN RELEASES EN PROD ---');
  const vProd = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT version, titulo, publicado_en FROM sch_leangsp_prod.tcfg_releases ORDER BY id_release DESC LIMIT 3;\\""`);
  console.log(vProd.stdout.trim());

  console.log('\n--- VERIFICACIÓN RELEASES EN DEV ---');
  const vDev = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT version, titulo, publicado_en FROM sch_leangsp.tcfg_releases ORDER BY id_release DESC LIMIT 3;\\""`);
  console.log(vDev.stdout.trim());

  console.log('\n--- VERIFICACIÓN BACKLOG EN PROD ---');
  const bProd = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT codigo_req, nombre_requerimiento, estado FROM sch_leangsp_prod.tcfg_backlog WHERE codigo_req = 'REQ-1041';\\""`);
  console.log(bProd.stdout.trim());

  ssh.dispose();
  console.log('\n🎉 Backlog y Releases v1.0.134 sincronizados exitosamente.');
}

syncReleases().catch(err => {
  console.error('Error sincronizando releases:', err);
  process.exit(1);
});
