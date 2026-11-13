const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({ host: '138.255.103.18', port: 1295, username: 'root', password: 'lgbl2025.' });
  const sql = `
    ALTER TABLE sch_leangsp.tequ_log_desplazamiento ADD COLUMN IF NOT EXISTS horometro_grua_inicial numeric;
    ALTER TABLE sch_leangsp_prod.tequ_log_desplazamiento ADD COLUMN IF NOT EXISTS horometro_grua_inicial numeric;
  `;
  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql}\\""`);
  console.log('DDL Output:', res.stdout);
  ssh.dispose();
}

main().catch(console.error);
