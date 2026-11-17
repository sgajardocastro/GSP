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
      'v1.0.227',
      CURRENT_DATE,
      'Portal Web GSP y Backend v1.0.227 - SPEC-134 Erradicación Duplicados Flota y Blindaje Defensivo OT',
      'HOTFIX / MEJORAS',
      'Resolución estructural en 4 niveles del producto cruz en asignaciones de flota y tripulación. Unificación y consolidación de id_linea_servicio en frontend (GestorOportunidades.vue), controlador backend (asignacionRecursosController.js), blindaje defensivo en motor de OT (proyectoModel.js) y saneamiento en PostgreSQL. OT v15 certificada con exactamente 2 vehículos sin duplicidad.',
      '["REQ-1180", "SPEC-134", "CASO-20261116-04"]'::jsonb,
      'Antigravity'
    ) RETURNING id, version, titulo, creado_at;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/register_release_227.sql
${sql}
EOF`);

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/register_release_227.sql"`);
  console.log("Release registrada en BD:\n", res.stdout || res.stderr);
  await ssh.execCommand(`rm -f /tmp/register_release_227.sql`);

  ssh.dispose();
}

run().catch(console.error);
