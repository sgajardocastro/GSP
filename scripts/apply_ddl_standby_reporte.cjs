const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const sql = `
  ALTER TABLE sch_leangsp.tedp_reporte_avance 
    ADD COLUMN IF NOT EXISTS horas_standby_cliente NUMERIC(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS horas_standby_gsp NUMERIC(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS motivo_standby TEXT;

  ALTER TABLE sch_leangsp_prod.tedp_reporte_avance 
    ADD COLUMN IF NOT EXISTS horas_standby_cliente NUMERIC(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS horas_standby_gsp NUMERIC(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS motivo_standby TEXT;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/apply_standby.sql
${sql}
EOF`);

  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/apply_standby.sql"');
  console.log('--- Salida DDL ---');
  console.log(res.stdout);
  if (res.stderr) console.error('--- Stderr ---', res.stderr);

  // Verificar columnas en sch_leangsp
  const chk = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema=\'sch_leangsp\' AND table_name=\'tedp_reporte_avance\' AND column_name LIKE \'%standby%\';\\""');
  console.log('--- Verificacion Columnas sch_leangsp ---');
  console.log(chk.stdout);

  ssh.dispose();
}

run().catch(console.error);
