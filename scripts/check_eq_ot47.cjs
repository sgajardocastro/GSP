const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function checkEqOT47() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const sql = `
SELECT 
  re.id_rel_equipo,
  re.id_proyecto,
  re.id_equipo,
  re.rol_equipo,
  re.estado_real,
  e.patente,
  e.modelo,
  e.marca
FROM sch_leangsp_prod.tpry_rel_equipo re
JOIN sch_leangsp_prod.tequ_equipo e ON re.id_equipo = e.id_equipo
WHERE re.id_proyecto = 97;
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/check_eq_ot47.sql\n" + sql + "\nEOF");
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/check_eq_ot47.sql"');
  console.log(res.stdout);
  ssh.dispose();
}

checkEqOT47().catch(console.error);
