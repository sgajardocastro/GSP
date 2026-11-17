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
BEGIN;

-- 1. Eliminar desplazamiento fantasma 67
DELETE FROM sch_leangsp_prod.tequ_log_desplazamiento
WHERE id_log_desplazamiento = 67 AND id_proyecto = 74;

-- 2. Eliminar equipo 39 de inspecciones_patio en json_field
UPDATE sch_leangsp_prod.tpry_proyecto
SET json_field = jsonb_set(
  json_field,
  '{ejecucion_v1,preparacion_salida,inspecciones_patio}',
  (json_field->'ejecucion_v1'->'preparacion_salida'->'inspecciones_patio') - '39'
)
WHERE id_proyecto = 74;

COMMIT;
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/execute_fix_74.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/execute_fix_74.sql"');
  console.log('SQL Execution Output:\n', res.stdout);
  console.log('SQL Execution Stderr:\n', res.stderr);

  // Verificación en BD
  const checkSql = `
SELECT id_log_desplazamiento, id_proyecto, id_equipo, id_user_chofer, patente
FROM sch_leangsp_prod.tequ_log_desplazamiento
WHERE id_proyecto = 74;

SELECT jsonb_pretty(json_field->'ejecucion_v1'->'preparacion_salida'->'inspecciones_patio')
FROM sch_leangsp_prod.tpry_proyecto
WHERE id_proyecto = 74;
`;
  await ssh.execCommand(`cat << 'EOF' > /tmp/check_fix_74.sql\n${sql}\nEOF`);
  const checkRes = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT id_log_desplazamiento, id_proyecto, id_equipo, patente FROM sch_leangsp_prod.tequ_log_desplazamiento WHERE id_proyecto = 74;\\" "');
  console.log('Verified desplazamientos:\n', checkRes.stdout);

  const checkPatio = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT jsonb_pretty(json_field->\'ejecucion_v1\'->\'preparacion_salida\'->\'inspecciones_patio\') FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 74;\\" "');
  console.log('Verified inspecciones_patio:\n', checkPatio.stdout);

  ssh.dispose();
}

run().catch(console.error);
