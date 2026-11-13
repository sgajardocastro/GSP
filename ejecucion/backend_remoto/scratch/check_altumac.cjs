const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: 'lgbl2025.'
  });

  const sql = `SELECT * FROM sch_leangsp_prod.tpar_proyecto_estado ORDER BY id_proyecto_estado;`;
  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql}\\""`);
  console.log('ESTADOS:\n', res.stdout);

  // También veamos Altumac completo
  const sqlAltumac = `SELECT id_proyecto, codi_proyecto, nombre_proyecto, id_proyecto_estado, json_field->'its_v1' as its_v1, json_field->'liquidacion_v1' as liq, json_field->'flujo_etapas' as etapas FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 2;`;
  const resAlt = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlAltumac}\\""`);
  console.log('ALTUMAC:\n', resAlt.stdout);

  ssh.dispose();
}

run().catch(console.error);
