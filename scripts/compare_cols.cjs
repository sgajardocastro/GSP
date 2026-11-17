const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function compareTables() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
  -- Columnas que están en DEV pero FALTAN en PROD para las 3 tablas clave
  SELECT 
    c_dev.table_name, 
    c_dev.column_name, 
    c_dev.data_type
  FROM information_schema.columns c_dev
  WHERE c_dev.table_schema = 'sch_leangsp'
    AND c_dev.table_name IN ('tpry_linea_servicio', 'tpry_rel_equipo', 'tpry_rel_persona')
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns c_prod
      WHERE c_prod.table_schema = 'sch_leangsp_prod'
        AND c_prod.table_name = c_dev.table_name
        AND c_prod.column_name = c_dev.column_name
    )
  ORDER BY c_dev.table_name, c_dev.column_name;
  `;

  await ssh.execCommand("cat << 'EOF' > /tmp/compare_cols.sql\n" + sql + "\nEOF");
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/compare_cols.sql"');
  console.log(res.stdout);
  ssh.dispose();
}

compareTables().catch(console.error);
