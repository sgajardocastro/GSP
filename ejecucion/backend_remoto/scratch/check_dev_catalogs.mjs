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

  console.log("=== CHECK DATA IN DEV TABLES ===");
  const qEquipos = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT count(*) FROM sch_leangsp.tequ_equipo;\\""`);
  console.log("Equipos en DEV:", qEquipos.stdout);

  const qUsers = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT count(*) FROM sch_leangsp.tsec_users;\\""`);
  console.log("Usuarios en DEV:", qUsers.stdout);

  const qRoles = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT count(*) FROM sch_leangsp.tsec_roles;\\""`);
  console.log("Roles en DEV:", qRoles.stdout);

  const qTemplates = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT count(*) FROM sch_leangsp.tsrv_templates;\\""`);
  console.log("Templates en DEV:", qTemplates.stdout);

  const qEmpresas = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT count(*) FROM sch_leangsp.tpar_empresas;\\""`);
  console.log("Empresas en DEV:", qEmpresas.stdout);

  ssh.dispose();
}

inspect().catch(console.error);
