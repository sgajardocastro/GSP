const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const run = async (title, sql) => {
    console.log(`\n=================== ${title} ===================`);
    const cleanSql = sql.replace(/\s+/g, ' ').trim();
    const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${cleanSql}\\""`);
    console.log(res.stdout || res.stderr);
  };

  await run('BUSCAR CCCB EN COTIZACIONES / OTs', `
    SELECT id_proyecto, codi_proyecto, nombre_proyecto, fecha_creacion
    FROM sch_leangsp_prod.tpry_proyecto
    WHERE json_field::text ILIKE '%CCCB%' OR json_field::text ILIKE '%LTM-1055%'
    ORDER BY id_proyecto DESC LIMIT 5;
  `);

  await run('BUSCAR CCCB EN SURVEYS / CHECKLISTS', `
    SELECT id_survey, id_equipo, tipo_survey, json_data->>'kilometraje' as km, json_data->>'odometro' as odo, fecha_creacion
    FROM sch_leangsp_prod.tsrv_surveys
    WHERE id_equipo = 36 OR json_data::text ILIKE '%CCCB%'
    ORDER BY id_survey DESC LIMIT 5;
  `);

  await run('BUSCAR EN TABLA TALLER / MANTENCION', `
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'sch_leangsp_prod' AND (table_name LIKE '%ot%' OR table_name LIKE '%mant%' OR table_name LIKE '%plan%');
  `);

  ssh.dispose();
}

main().catch(err => {
  console.error(err);
  ssh.dispose();
});
