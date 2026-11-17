const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function fixLineaServicioCols() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
  ALTER TABLE sch_leangsp_prod.tpry_linea_servicio 
      ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS orden INT DEFAULT 1,
      ADD COLUMN IF NOT EXISTS id_categoria INT,
      ADD COLUMN IF NOT EXISTS id_subcategoria INT;

  ALTER TABLE sch_leangsp.tpry_linea_servicio 
      ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS orden INT DEFAULT 1;

  SELECT table_schema, column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'tpry_linea_servicio' 
    AND column_name IN ('activo', 'orden', 'id_categoria', 'id_subcategoria')
  ORDER BY table_schema, column_name;
  `;

  await ssh.execCommand("cat << 'EOF' > /tmp/fix_tpry_linea.sql\n" + sql + "\nEOF");
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/fix_tpry_linea.sql"');
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);

  ssh.dispose();
}

fixLineaServicioCols().catch(console.error);
