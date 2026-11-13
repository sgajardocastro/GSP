const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });

  console.log('=== BUSCAR EN PROD ===');
  const p = await ssh.execCommand("PGPASSWORD=usr_gsp_prod_2026! psql -h localhost -U usr_leangsp_prod -d postgres -c \"SELECT id_user, name_frst, apellido_pat, email FROM sch_leangsp_prod.tsec_users WHERE name_frst ILIKE '%omar%' OR apellido_pat ILIKE '%ghis%' OR email ILIKE '%ghis%' OR email ILIKE '%omar%';\"");
  console.log(p.stdout);

  console.log('=== BUSCAR EN DEV ===');
  const d = await ssh.execCommand("PGPASSWORD=usr_gsp_123 psql -h localhost -U usr_leangsp -d postgres -c \"SELECT id_user, name_frst, apellido_pat, email FROM sch_leangsp.tsec_users WHERE name_frst ILIKE '%omar%' OR apellido_pat ILIKE '%ghis%' OR email ILIKE '%ghis%' OR email ILIKE '%omar%';\"");
  console.log(d.stdout);

  ssh.dispose();
}

run().catch(console.error);
