const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const script = `
    const { Pool } = require('pg');

    async function sync() {
      // 1. PROD
      const poolProd = new Pool({
        user: 'usr_leangsp_prod',
        password: 'usr_gsp_prod_2026!',
        host: 'localhost',
        database: 'postgres',
        port: 5432
      });

      await poolProd.query(\`
        INSERT INTO sch_leangsp_prod.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
        VALUES (
          'v1.0.65',
          'PWA GSP v1.0.65 & Backend v1.0.207 - Deshabilitación Temporal Odómetro Incremental y Saneamiento Flota',
          'Hotfix',
          'Deshabilitación de la regla de kilometraje incremental en PWA y backend para destrabar inicio y cierre de jornadas; saneamiento de odómetros corruptos en flota e invalidación de Service Worker móvil.',
          jsonb_build_array('REQ-1143'),
          'Sergio Gajardo'
        )
        ON CONFLICT (version) DO UPDATE SET
          titulo = EXCLUDED.titulo,
          descripcion_impacto = EXCLUDED.descripcion_impacto,
          requerimientos_asociados = EXCLUDED.requerimientos_asociados,
          updated_at = NOW();
      \`);
      console.log('Release registrada en PROD con exito.');
      await poolProd.end();

      // 2. DEV
      const poolDev = new Pool({
        user: 'usr_leangsp',
        password: 'usr_gsp_dev_2026!',
        host: 'localhost',
        database: 'postgres',
        port: 5432
      });

      await poolDev.query(\`
        INSERT INTO sch_leangsp.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
        VALUES (
          'v1.0.65',
          'PWA GSP v1.0.65 & Backend v1.0.207 - Deshabilitación Temporal Odómetro Incremental y Saneamiento Flota',
          'Hotfix',
          'Deshabilitación de la regla de kilometraje incremental en PWA y backend para destrabar inicio y cierre de jornadas; saneamiento de odómetros corruptos en flota e invalidación de Service Worker móvil.',
          jsonb_build_array('REQ-1143'),
          'Sergio Gajardo'
        )
        ON CONFLICT (version) DO UPDATE SET
          titulo = EXCLUDED.titulo,
          descripcion_impacto = EXCLUDED.descripcion_impacto,
          requerimientos_asociados = EXCLUDED.requerimientos_asociados,
          updated_at = NOW();
      \`);
      console.log('Release registrada en DEV con exito.');
      await poolDev.end();
    }

    sync().catch(e => { console.error('Error:', e); process.exit(1); });
  `;

  const res = await ssh.execCommand(`node -e "${script.replace(/"/g, '\\"').replace(/\$/g, '\\$')}"`);
  console.log('STDOUT:', res.stdout);
  console.log('STDERR:', res.stderr);

  ssh.dispose();
}

run().catch(console.error);
