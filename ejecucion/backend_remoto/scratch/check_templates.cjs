const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkTemplates() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== TEMPLATES EN DEV ===');
  const resDev = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_template, id_tipo_srv, id_flow_tmpl, id_empresa_cliente FROM sch_leangsp.tsrv_templates;\\""`);
  console.log(resDev.stdout);

  console.log('=== TEMPLATES EN PROD ===');
  const resProd = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_template, id_tipo_srv, id_flow_tmpl, id_empresa_cliente FROM sch_leangsp_prod.tsrv_templates;\\""`);
  console.log(resProd.stdout);

  ssh.dispose();
}

checkTemplates().catch(console.error);
