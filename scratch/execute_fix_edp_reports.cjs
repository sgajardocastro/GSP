const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const sql = `
UPDATE sch_leangsp_prod.tedp_reporte_avance
SET horas_sobretiempo = 0.00,
    horas_minimas = 0.00
WHERE id_proyecto = 33
  AND id_reporte_avance IN (18, 30);
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/update_reports_33.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/update_reports_33.sql"');
  console.log('Update result:\n', res.stdout);

  // Verificar
  const checkSql = `
SELECT id_reporte_avance, dia_correlativo, fecha_reporte, horas_operadas, horas_facturables, horas_sobretiempo, horas_minimas
FROM sch_leangsp_prod.tedp_reporte_avance
WHERE id_proyecto = 33
ORDER BY dia_correlativo;
`;
  await ssh.execCommand(`cat << 'EOF' > /tmp/check_reports_33.sql\n${checkSql}\nEOF`);
  const checkRes = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/check_reports_33.sql"');
  console.log('Verified reports:\n', checkRes.stdout);

  ssh.dispose();
}

run().catch(console.error);
