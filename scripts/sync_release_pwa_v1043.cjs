const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function syncIndependentReleases() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const schemas = ['sch_leangsp', 'sch_leangsp_prod'];
  for (const s of schemas) {
    console.log(`\n--- Sincronizando ${s} ---`);
    const sql = `
      -- 1. Registrar PWA v1.0.43 en tcfg_releases
      INSERT INTO ${s}.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
      VALUES (
        'v1.0.43',
        'PWA GSP v1.0.43 - Resiliencia Operativa Report Diario, Hora de Inicio Rectificable y Flexibilidad Momento 2',
        'Feature',
        'Hora de inicio editable en Momento 2 de faena, navegacion flexible a Momento 2 y regularizacion operativa OT 16 en Produccion',
        '["REQ-1044"]'::jsonb,
        'Sergio Gajardo'
      )
      ON CONFLICT (version) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;

      -- 2. Registrar REQ-1044 en tcfg_backlog
      INSERT INTO ${s}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, estado, fecha_implementacion, solicitado_por, creado_por)
      VALUES (
        'REQ-1044',
        'Resiliencia Report Diario PWA: Hora de Inicio Rectificable en Terreno y Flexibilidad Momento 2',
        'Permite al operador rectificar hora de inicio en Momento 2 y erradica bloqueo de navegacion con horometro base',
        'Alta',
        'Implementado',
        CURRENT_DATE,
        'Operaciones / Terreno',
        'Sergio Gajardo'
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        estado = 'Implementado',
        fecha_implementacion = CURRENT_DATE;
    `;

    await ssh.execCommand(`cat << 'EOF' > /tmp/sync_releases_1043.sql\n${sql}\nEOF`);
    const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/sync_releases_1043.sql"`);
    console.log(`Esquema ${s}:`, res.stdout.replace(/\n+/g, ' ').trim() || res.stderr.trim());
  }

  console.log('\n--- VERIFICACIÓN RELEASES EN PROD ---');
  const verifProd = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT id, version, titulo, requerimientos_asociados FROM sch_leangsp_prod.tcfg_releases ORDER BY id DESC LIMIT 5;'"` );
  console.log(verifProd.stdout.trim());

  console.log('\n--- VERIFICACIÓN BACKLOG EN PROD ---');
  const verifBacklog = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT id, codigo_req, nombre_requerimiento, estado FROM sch_leangsp_prod.tcfg_backlog WHERE codigo_req = \\'REQ-1044\\';'"` );
  console.log(verifBacklog.stdout.trim());

  await ssh.execCommand('rm -f /tmp/sync_releases_1043.sql');
  ssh.dispose();
  console.log('\n✅ Gobernanza BD sincronizada exitosamente.');
}

syncIndependentReleases().catch(console.error);
