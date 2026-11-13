const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({ host: '138.255.103.18', port: 1295, username: 'root', password: 'lgbl2025.' });
  const q1 = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'sch_leangsp' AND table_name = 'tequ_log_desplazamiento' ORDER BY ordinal_position;\\""`);
  console.log("=== tequ_log_desplazamiento ===");
  console.log(q1.stdout);
  const q2 = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'sch_leangsp' AND table_name = 'tedp_reporte_avance' ORDER BY ordinal_position;\\""`);
  console.log("=== tedp_reporte_avance ===");
  console.log(q2.stdout);
  ssh.dispose();
}

main().catch(console.error);
