const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function findVarchar3All() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const sql = `
    SELECT table_schema, table_name, column_name, data_type, character_maximum_length 
    FROM information_schema.columns 
    WHERE character_maximum_length = 3;
  `;

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c '${sql.replace(/\n/g, ' ')}'"` );
  console.log('Columns with length 3 across all tables:\n', res.stdout);

  ssh.dispose();
}

findVarchar3All().catch(console.error);
