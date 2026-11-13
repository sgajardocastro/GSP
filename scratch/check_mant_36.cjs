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

  await run('COLUMNAS TMNT_OT', `
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tmnt_ot';
  `);

  await run('REGISTROS EN TMNT_OT CON EQUIPO 36', `
    SELECT id_ot, id_equipo, odometro_inicio, horometro_inicio, fecha_creacion
    FROM sch_leangsp_prod.tmnt_ot
    WHERE id_equipo = 36;
  `);

  ssh.dispose();
}

main().catch(err => {
  console.error(err);
  ssh.dispose();
});
