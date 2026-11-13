const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: 'servidor.leanglobal.cl',
    port: 1295,
    username: 'root',
    password: 'lgbl2025.'
  });

  const envRes = await ssh.execCommand('grep DB_NAME /home/nodeadmin/proyectos/lean-services-gsp/.env');
  console.log('ENV:', envRes.stdout.trim());
  const dbName = envRes.stdout.split('=')[1].trim();

  const sql = `
    INSERT INTO sch_leangsp.tcfg_releases (
      version, fecha_release, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por
    ) VALUES (
      'v1.0.80',
      '2026-10-03',
      'Control Operativo en Vivo Multi-Equipo con la OT como Driver',
      'Feature & UX',
      'Soporte multi-equipo en Control Operativo en Vivo con la OT como driver único, selector interactivo de máquinas por OT, discriminación inteligente de ciclos de izaje vs transporte, rollup del semáforo y búsqueda extendida a la flota completa.',
      $json$["REQ-042"]$json$::jsonb,
      'Sergio Gajardo / Antigravity Agent'
    )
    ON CONFLICT (version) DO UPDATE 
    SET titulo = EXCLUDED.titulo,
        tipo_release = EXCLUDED.tipo_release,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados,
        publicado_por = EXCLUDED.publicado_por;
  `;
  const res = await ssh.execCommand(`su - postgres -c "psql -d ${dbName} -c \\"${sql.replace(/\n/g, ' ')}\\""`);
  console.log('DB Res:', res.stdout.trim() || res.stderr.trim());

  const check = await ssh.execCommand(`su - postgres -c "psql -d ${dbName} -c \\"SELECT version, fecha_release, titulo FROM sch_leangsp.tcfg_releases ORDER BY id_release DESC LIMIT 5;\\""`);
  console.log('Ultimos releases:\n', check.stdout.trim());

  ssh.dispose();
}

run();
