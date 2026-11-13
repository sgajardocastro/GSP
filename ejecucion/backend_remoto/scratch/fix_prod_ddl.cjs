const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== AJUSTANDO DDL EN sch_leangsp_prod ===');
  const sql = `
    -- Agregar evento_tipo a tnot_notification_web si no existe
    ALTER TABLE sch_leangsp_prod.tnot_notification_web 
      ADD COLUMN IF NOT EXISTS evento_tipo VARCHAR(50);

    -- Asegurar columnas en tedp_reporte_avance
    ALTER TABLE sch_leangsp_prod.tedp_reporte_avance
      ADD COLUMN IF NOT EXISTS fecha_transmision_termino TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS device_timestamp TIMESTAMP WITH TIME ZONE;

    -- Asegurar columnas en tequ_log_desplazamiento
    ALTER TABLE sch_leangsp_prod.tequ_log_desplazamiento
      ADD COLUMN IF NOT EXISTS device_timestamp_salida TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS device_timestamp_llegada TIMESTAMP WITH TIME ZONE;

    -- Grants completos
    GRANT ALL ON ALL TABLES IN SCHEMA sch_leangsp_prod TO usr_leangsp_prod;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA sch_leangsp_prod TO usr_leangsp_prod;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/fix_prod_ddl.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/fix_prod_ddl.sql"');
  console.log(res.stdout.trim() || res.stderr.trim());
  await ssh.execCommand('rm -f /tmp/fix_prod_ddl.sql');

  // Probar endpoint notificaciones de nuevo
  console.log('\n=== PROBANDO ENDPOINT NOTIFICACIONES (puerto 3016) ===');
  const curlNotif = await ssh.execCommand('curl -i http://localhost:3016/api/operaciones/control-vivo/notificaciones');
  console.log(curlNotif.stdout);

  ssh.dispose();
}

run();
