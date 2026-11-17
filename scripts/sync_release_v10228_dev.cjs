const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function syncRelease() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const nodeScript = `
const { Pool } = require('/home/nodeadmin/proyectos/lean-services-gsp/node_modules/pg');
const pool = new Pool({
  user: 'usr_leangsp',
  password: 'usr_gsp_123',
  host: 'localhost',
  database: 'postgres',
  port: 5432
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query(\`
      INSERT INTO sch_leangsp.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
      VALUES (
        'REQ-1185',
        'Blindaje Canónico E2E SPEC-16 §28: Erradicación Integral de json_field desde Asignación hasta Facturación',
        'SPEC-16 §28: Unificación arquitectónica de blindaje anti-resurrección en 4 capas. Tablas relacionales tpry_linea_servicio, tpry_rel_equipo, tpry_rel_persona, tedp_reporte_avance, tits_* y tedp_estado_pago como única fuente de verdad a partir de estado Adjudicado. Índice único físico uq_tedp_proyecto_dia_equipo. Sanitización de fechas YYYY-MM-DD y soporte canónico de relevos y convoy.',
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
    \`);
    console.log('✔ Backlog REQ-1185 insertado/actualizado en sch_leangsp');

    await client.query(\`
      INSERT INTO sch_leangsp.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por, fecha_release)
      VALUES (
        'v1.0.228',
        'Portal Web GSP y Backend v1.0.228 - SPEC-16 §28 Erradicación json_field y Blindaje Canónico E2E',
        'MAJOR',
        'Eliminación total de lecturas/escrituras en tpry_proyecto.json_field para proyectos adjudicados. Tablas relacionales como autoridad absoluta en Backend, Web, PWA y Motores PDF. Índice físico de unicidad en tedp_reporte_avance. Soporte multi-máquina y sanitización estricta de fechas.',
        $1,
        'Sergio Gajardo',
        CURRENT_DATE
      )
    \`, [JSON.stringify(['REQ-1185'])]);
    console.log('✔ Release v1.0.228 insertado en sch_leangsp.tcfg_releases');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Error insertando release:', err);
  process.exit(1);
});
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/sync_rel_v10228.js\n" + nodeScript + "\nEOF");
  const res = await ssh.execCommand('/home/nodeadmin/.nvm/versions/node/v16.20.2/bin/node /tmp/sync_rel_v10228.js');
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);

  ssh.dispose();
}

syncRelease().catch(console.error);
