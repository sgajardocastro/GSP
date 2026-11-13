const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function getProjectCrm() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT json_field->'crm_v1' FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 1;\\""`);
  console.log(res.stdout);

  ssh.dispose();
}

getProjectCrm().catch(console.error);
