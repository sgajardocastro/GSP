import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function fixEquipos() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295,
    readyTimeout: 15000
  });

  console.log("=== CHECK id_empresa = 9 EN tpar_empresas ===");
  const checkEmpresa = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_empresa, name_empresa, rut_empresa FROM sch_leangsp_prod.tpar_empresas WHERE id_empresa = 9;\\""`);
  console.log(checkEmpresa.stdout);

  console.log("=== IF MISSING, COPY FROM sch_leangsp ===");
  const copyEmpresa9 = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"INSERT INTO sch_leangsp_prod.tpar_empresas SELECT * FROM sch_leangsp.tpar_empresas WHERE id_empresa = 9 ON CONFLICT DO NOTHING;\\""`);
  console.log(copyEmpresa9.stdout);

  console.log("=== COPY tequ_equipo ===");
  const copyEquipos = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"INSERT INTO sch_leangsp_prod.tequ_equipo SELECT * FROM sch_leangsp.tequ_equipo ON CONFLICT DO NOTHING;\\""`);
  console.log(copyEquipos.stdout);
  console.log(copyEquipos.stderr);

  const countEquipos = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -c \\"SELECT count(*) FROM sch_leangsp_prod.tequ_equipo;\\""`);
  console.log(`Equipos en sch_leangsp_prod: ${countEquipos.stdout.trim()}`);

  ssh.dispose();
}

fixEquipos().catch(console.error);
