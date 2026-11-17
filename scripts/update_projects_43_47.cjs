const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function updateProjects() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
BEGIN;
UPDATE sch_leangsp_prod.tpry_proyecto 
SET id_proyecto_estado = 3 
WHERE id_proyecto IN (91, 97);

SELECT id_proyecto, codi_proyecto, nombre_proyecto, id_proyecto_estado 
FROM sch_leangsp_prod.tpry_proyecto 
WHERE id_proyecto IN (91, 97);
COMMIT;
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/update.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/update.sql"');
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);

  ssh.dispose();
}

updateProjects().catch(console.error);
