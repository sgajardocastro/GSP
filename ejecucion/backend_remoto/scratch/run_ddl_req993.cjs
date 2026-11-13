const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function runDDL() {
  console.log('🔌 Conectando SSH para ejecutar DDL REQ-993...');
  try {
    await ssh.connect({
      host: '138.255.103.18',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295,
      readyTimeout: 15000
    });
    console.log('✅ SSH Conectado.');

    const sqlScript = `
BEGIN;

-- 1. DEV: sch_leangsp.tedp_reporte_avance
ALTER TABLE sch_leangsp.tedp_reporte_avance 
  ADD COLUMN IF NOT EXISTS foto_odometro_inicio TEXT,
  ADD COLUMN IF NOT EXISTS foto_odometro_termino TEXT;

-- 2. PROD: sch_leangsp_prod.tedp_reporte_avance
ALTER TABLE sch_leangsp_prod.tedp_reporte_avance 
  ADD COLUMN IF NOT EXISTS foto_odometro_inicio TEXT,
  ADD COLUMN IF NOT EXISTS foto_odometro_termino TEXT;

COMMENT ON COLUMN sch_leangsp.tedp_reporte_avance.foto_odometro_inicio IS 'Evidencia fotográfica independiente del odómetro/kilometraje al inicio de faena';
COMMENT ON COLUMN sch_leangsp.tedp_reporte_avance.foto_odometro_termino IS 'Evidencia fotográfica independiente del odómetro/kilometraje al término de faena';
COMMENT ON COLUMN sch_leangsp_prod.tedp_reporte_avance.foto_odometro_inicio IS 'Evidencia fotográfica independiente del odómetro/kilometraje al inicio de faena';
COMMENT ON COLUMN sch_leangsp_prod.tedp_reporte_avance.foto_odometro_termino IS 'Evidencia fotográfica independiente del odómetro/kilometraje al término de faena';

COMMIT;
`;

    await ssh.execCommand(`cat << 'EOF' > /tmp/ddl_req993.sql\n${sqlScript}\nEOF`);
    console.log('📄 Script DDL transferido a /tmp/ddl_req993.sql');

    const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/ddl_req993.sql"');
    console.log('DDL Result:\n', res.stdout, res.stderr);

    const checkDev = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = \'sch_leangsp\' AND table_name = \'tedp_reporte_avance\' AND column_name LIKE \'%odometro%\';\\""');
    console.log('DEV Columnas Odómetro:\n', checkDev.stdout);

    const checkProd = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = \'sch_leangsp_prod\' AND table_name = \'tedp_reporte_avance\' AND column_name LIKE \'%odometro%\';\\""');
    console.log('PROD Columnas Odómetro:\n', checkProd.stdout);

  } catch (err) {
    console.error('❌ Error ejecutando DDL REQ-993:', err);
  } finally {
    ssh.dispose();
  }
}

runDDL();
