const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: 'lgbl2025.'
  });

  const sql = `
    SELECT 
      id_proyecto, 
      codi_proyecto, 
      nombre_proyecto, 
      id_proyecto_estado, 
      json_field->>'estado' as json_estado,
      json_field->'crm_v1'->'opportunity'->>'cliente_nombre' as cliente,
      json_field->'its_v1'->>'estado' as its_estado,
      json_field->'edp_v1'->>'estado' as edp_estado
    FROM sch_leangsp_prod.tpry_proyecto 
    WHERE nombre_proyecto ILIKE '%altumac%' 
       OR codi_proyecto ILIKE '%altumac%' 
       OR json_field::text ILIKE '%altumac%'
       OR codi_proyecto ILIKE '%002'
       OR codi_proyecto ILIKE '%-02'
       OR codi_proyecto ILIKE '%-2';
  `;

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql.replace(/\n/g, ' ')}\\""`);
  console.log('RESULTS PROD:\n', res.stdout);

  const resDev = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql.replace('sch_leangsp_prod', 'sch_leangsp').replace(/\n/g, ' ')}\\""`);
  console.log('RESULTS DEV:\n', resDev.stdout);

  ssh.dispose();
}

run().catch(console.error);
