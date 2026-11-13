const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function syncIndependentReleases() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const schemas = ['sch_leangsp', 'sch_leangsp_prod'];
  for (const s of schemas) {
    const sql = `
      -- 1. Eliminar versiones erróneas
      DELETE FROM ${s}.tcfg_releases WHERE version = 'v1.0.122';

      -- 2. Asegurar Portal Web v1.0.121
      INSERT INTO ${s}.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
      VALUES ('v1.0.121', 'Portal Web GSP v1.0.121 - Consola de Mantenimiento Desktop con Medidores Entrada, Fotos 360 y Ficha QR', 'Feature', 'Consola Desktop de Mantenimiento con paridad Spec 71: medidores de entrada con guardado, fotos 360 (6 slots) y ficha QR canónica', '["REQ-1025"]'::jsonb, 'Sergio Gajardo')
      ON CONFLICT (version) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;

      -- 3. Registrar PWA v1.0.38
      INSERT INTO ${s}.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
      VALUES ('v1.0.38', 'PWA Taller Móvil v1.0.38 - Ficha QR Oficial, Medidores Entrada/Cierre, Fotos 360, Nueva OTM y Avisos', 'Feature', 'Módulo Taller Móvil PWA con paridad Spec 71, autocompletado de flota, apertura de OTM general y resolución de avisos de avería', '["REQ-1024", "REQ-1025"]'::jsonb, 'Sergio Gajardo')
      ON CONFLICT (version) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    `;

    await ssh.execCommand(`cat << 'EOF' > /tmp/sync_releases.sql\n${sql}\nEOF`);
    const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/sync_releases.sql"`);
    console.log(`Esquema ${s}:`, res.stdout.replace(/\n+/g, ' ').trim());
  }

  const verifDev = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT id, version, titulo, requerimientos_asociados FROM sch_leangsp.tcfg_releases ORDER BY id DESC LIMIT 5;'"`);
  console.log('\n--- VERIFICACIÓN RELEASES EN DEV ---');
  console.log(verifDev.stdout.trim());

  await ssh.execCommand('rm -f /tmp/sync_releases.sql');
  ssh.dispose();
}

syncIndependentReleases().catch(console.error);
