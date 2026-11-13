import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function inspect() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295,
    readyTimeout: 15000
  });

  console.log("=== PSQL SUPERUSER TABLE COUNT ===");
  const psqlRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -c \\"SELECT schemaname, count(*) FROM pg_tables WHERE schemaname IN ('sch_leangsp', 'sch_leangsp_prod') GROUP BY schemaname;\\""`);
  console.log(psqlRes.stdout);

  console.log("=== PSQL SUPERUSER SEQUENCE COUNT ===");
  const seqRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -c \\"SELECT sequence_schema, count(*) FROM information_schema.sequences WHERE sequence_schema IN ('sch_leangsp', 'sch_leangsp_prod') GROUP BY sequence_schema;\\""`);
  console.log(seqRes.stdout);

  ssh.dispose();
}

inspect().catch(console.error);
