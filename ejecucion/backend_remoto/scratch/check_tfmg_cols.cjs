const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkTfmg() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== COLUMNAS TFMG_FILE EN DEV ===');
  const resDev = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'sch_leangsp' AND table_name = 'tfmg_file' ORDER BY ordinal_position;\\""`);
  console.log(resDev.stdout);

  console.log('=== COLUMNAS TFMG_FILE EN PROD ===');
  const resProd = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tfmg_file' ORDER BY ordinal_position;\\""`);
  console.log(resProd.stdout);

  ssh.dispose();
}

checkTfmg().catch(console.error);
