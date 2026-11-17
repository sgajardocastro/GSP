const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkProjects5152() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
  SELECT id_proyecto, codi_proyecto, nombre_proyecto, id_proyecto_estado 
  FROM sch_leangsp_prod.tpry_proyecto 
  WHERE codi_proyecto LIKE '%00051%' OR codi_proyecto LIKE '%00052%'
  ORDER BY id_proyecto;
  `;

  await ssh.execCommand("cat << 'EOF' > /tmp/q_p5152.sql\n" + sql + "\nEOF");
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/q_p5152.sql"');
  console.log(res.stdout);
  ssh.dispose();
}

checkProjects5152().catch(console.error);
