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

  console.log('--- AUDITORIA DE DUPLICADOS EN TSEC_USERS ---');
  const sql = `
    SELECT 
      LOWER(TRIM(COALESCE(name_frst, '') || ' ' || COALESCE(apellido_pat, ''))) as nombre_completo,
      COUNT(*) as repeticiones,
      ARRAY_AGG(id_user ORDER BY id_user) as ids,
      ARRAY_AGG(COALESCE(rut, 'S/R')) as ruts,
      ARRAY_AGG(COALESCE(email, 'S/E')) as emails
    FROM sch_leangsp_prod.tsec_users
    WHERE activo = true
    GROUP BY LOWER(TRIM(COALESCE(name_frst, '') || ' ' || COALESCE(apellido_pat, '')))
    HAVING COUNT(*) > 1;
  `;
  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql.replace(/\n/g, ' ')}\\""`);
  console.log(res.stdout);

  ssh.dispose();
}

main().catch(console.error);
