const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('=== BÚSQUEDA DETALLADA ===\n');

  // Buscar equipo 73 o patente JC.2796-2
  const rEq = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT id_equipo, patente, marca, modelo, subcategoria, estado FROM sch_leangsp_prod.tequ_equipo WHERE patente ILIKE \\"%JC%\\" OR id_equipo = 73;'"`);
  console.log('Equipo JC.2796-2:\n', rEq.stdout);

  // Buscar usuario Luis Mercado o id_user = 40
  const rUsr = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT id_user, name_frst, name_last, id_tipo_cargo, rut FROM sch_leangsp_prod.tsec_usuario WHERE id_user = 40 OR name_last ILIKE \\"%Mercado%\\";'"`);
  console.log('Usuario Luis Mercado:\n', rUsr.stdout);

  // Buscar en tequ_log_desplazamiento
  const rLogs = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT * FROM sch_leangsp_prod.tequ_log_desplazamiento WHERE id_equipo = 73 OR id_proyecto = 32 OR id_user_chofer = 40 LIMIT 10;'"`);
  console.log('Logs desplazamiento:\n', rLogs.stdout);

  // Buscar en tpry_proyecto id_proyecto = 32 json_field
  const rJf = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT id_proyecto, codi_proyecto, json_field FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 32;'"`);
  console.log('Proyecto 32 json_field:\n', rJf.stdout.slice(0, 1000));

  ssh.dispose();
}

main().catch(console.error);
