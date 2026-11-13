const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });

  console.log('=== COMPARANDO COLUMNAS EN tequ_equipo (DEV vs PROD) ===\n');
  const resEq = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"
    SELECT 
      c.column_name,
      COUNT(CASE WHEN c.table_schema = 'sch_leangsp' THEN 1 END) as in_dev,
      COUNT(CASE WHEN c.table_schema = 'sch_leangsp_prod' THEN 1 END) as in_prod
    FROM information_schema.columns c
    WHERE c.table_name = 'tequ_equipo' AND c.table_schema IN ('sch_leangsp', 'sch_leangsp_prod')
    GROUP BY c.column_name
    HAVING COUNT(DISTINCT c.table_schema) = 1
    ORDER BY c.column_name;
  \\""`);
  console.log('Columnas faltantes en uno de los esquemas (tequ_equipo):\n', resEq.stdout);

  console.log('=== COMPARANDO TABLAS TMNT_* EN DEV vs PROD ===\n');
  const resTables = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"
    SELECT 
      table_name,
      COUNT(CASE WHEN table_schema = 'sch_leangsp' THEN 1 END) as in_dev,
      COUNT(CASE WHEN table_schema = 'sch_leangsp_prod' THEN 1 END) as in_prod
    FROM information_schema.tables
    WHERE table_name LIKE 'tmnt_%' AND table_schema IN ('sch_leangsp', 'sch_leangsp_prod')
    GROUP BY table_name
    ORDER BY table_name;
  \\""`);
  console.log('Tablas tmnt_*:\n', resTables.stdout);

  ssh.dispose();
}
check();
