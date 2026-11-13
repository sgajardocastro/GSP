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

  const sql = `
    SELECT 
      id_user, name_frst, apellido_pat, rut, email, activo, fecha_creacion,
      (SELECT count(*) FROM sch_leangsp_prod.tedp_reporte_avance WHERE id_user_operador = u.id_user OR id_user_rigger = u.id_user) as reportes,
      (SELECT count(*) FROM sch_leangsp_prod.tequ_log_desplazamiento WHERE id_user_chofer = u.id_user) as viajes
    FROM sch_leangsp_prod.tsec_users u
    WHERE id_user IN (8, 27);
  `;
  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql.replace(/\n/g, ' ')}\\""`);
  console.log(res.stdout);

  ssh.dispose();
}

main().catch(console.error);
