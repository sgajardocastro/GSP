const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkFlowStepsCols() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tflw_flow_steps' ORDER BY ordinal_position;\\""`);
  console.log(res.stdout);

  ssh.dispose();
}

checkFlowStepsCols().catch(console.error);
