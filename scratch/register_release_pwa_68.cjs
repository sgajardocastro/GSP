const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const sql = `
    INSERT INTO sch_leangsp.tcfg_releases (
      version,
      fecha_release,
      titulo,
      tipo_release,
      descripcion_impacto,
      requerimientos_asociados,
      publicado_por
    ) VALUES (
      'PWA v1.0.68',
      CURRENT_DATE,
      'PWA Operaciones GSP v1.0.68 - SPEC-133 Storage Helper, Canvas 1024px @ 0.70 y Fail-Open',
      'FEATURE',
      'Compresión fotográfica Canvas 1024px @ 0.70 en cliente móvil y despacho multipart independiente a /api/v1/storage/upload. Desacoplamiento de Base64 de la red móvil e inyección de id_doc en reportes y viajes. Desbloqueo operativo de jornadas adicionales en faena.',
      '["REQ-1180"]'::jsonb,
      'Antigravity'
    ) RETURNING id, version, fecha_release, titulo;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/insert_rel_pwa68.sql
${sql}
EOF`);

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/insert_rel_pwa68.sql"`);
  console.log("Salida BD:\n", res.stdout || res.stderr);
  await ssh.execCommand(`rm -f /tmp/insert_rel_pwa68.sql`);

  ssh.dispose();
}

run().catch(console.error);
