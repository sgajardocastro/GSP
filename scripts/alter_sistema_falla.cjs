const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function widenColumns() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('1. Altering sch_leangsp.tmnt_ot.sistema_falla...');
  const res1 = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"ALTER TABLE sch_leangsp.tmnt_ot ALTER COLUMN sistema_falla TYPE character varying(50);\\""');
  console.log('Res1 stdout:', res1.stdout, 'stderr:', res1.stderr);

  console.log('2. Altering sch_leangsp.tmnt_hallazgo.sistema...');
  const res2 = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"ALTER TABLE sch_leangsp.tmnt_hallazgo ALTER COLUMN sistema TYPE character varying(50);\\""');
  console.log('Res2 stdout:', res2.stdout, 'stderr:', res2.stderr);

  console.log('3. Verifying columns in information_schema...');
  const res3 = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT table_name, column_name, character_maximum_length FROM information_schema.columns WHERE table_schema = \'sch_leangsp\' AND column_name IN (\'sistema_falla\', \'sistema\');\\""');
  console.log('Res3:\n', res3.stdout);

  ssh.dispose();
}

widenColumns().catch(console.error);
