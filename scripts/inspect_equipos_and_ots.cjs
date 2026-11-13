const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectEquiposAndOts() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const eq = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT id_equipo, patente, codigo_interno, marca, modelo FROM sch_leangsp.tequ_equipo ORDER BY id_equipo ASC LIMIT 10;'"` );
  console.log('Equipos en tequ_equipo:\n', eq.stdout);

  const ots = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT id_ot, numero_ot, id_equipo, estado FROM sch_leangsp.tmnt_ot ORDER BY id_ot DESC LIMIT 10;'"` );
  console.log('OTs en tmnt_ot:\n', ots.stdout);

  const fk = await ssh.execCommand(`su - postgres -c "psql -d postgres -c '\\d sch_leangsp.tmnt_aviso'"` );
  console.log('tmnt_aviso schema:\n', fk.stdout);

  ssh.dispose();
}

inspectEquiposAndOts().catch(console.error);
