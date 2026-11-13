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

  console.log("=== CHECK DATA IN PROD TABLES ===");
  const qProjects = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT count(*) FROM sch_leangsp_prod.tpry_proyecto;\\""`);
  console.log("Proyectos en PROD:", qProjects.stdout);

  const qSurveys = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT count(*) FROM sch_leangsp_prod.tsrv_survey;\\""`);
  console.log("Surveys en PROD:", qSurveys.stdout);

  const qEquipos = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT count(*) FROM sch_leangsp_prod.tequ_equipo;\\""`);
  console.log("Equipos en PROD:", qEquipos.stdout);

  const qUsers = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT count(*) FROM sch_leangsp_prod.tsec_users;\\""`);
  console.log("Usuarios en PROD:", qUsers.stdout);

  ssh.dispose();
}

inspect().catch(console.error);
