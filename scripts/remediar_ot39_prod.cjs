const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function remediate() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
BEGIN;

-- 1. Auditar estado previo en tpry_rel_persona para proyecto 86
SELECT id_rel_persona, id_proyecto, id_user, rol_asignado, estado_real 
FROM sch_leangsp_prod.tpry_rel_persona 
WHERE id_proyecto = 86;

-- 2. Marcar a Victor Marquez (id_user = 52) como REEMPLAZADO en proyecto 86
UPDATE sch_leangsp_prod.tpry_rel_persona
SET estado_real = 'REEMPLAZADO'
WHERE id_proyecto = 86 AND id_user = 52;

-- 3. Asegurar que Nicolas Ceballos (id_user = 45) esté como PROGRAMADO y Operador Grúa
UPDATE sch_leangsp_prod.tpry_rel_persona
SET estado_real = 'PROGRAMADO', rol_asignado = 'Operador Grúa'
WHERE id_proyecto = 86 AND id_user = 45;

-- 4. Asegurar que Jose Espinoza (id_user = 101) esté como PROGRAMADO y Rigger
UPDATE sch_leangsp_prod.tpry_rel_persona
SET estado_real = 'PROGRAMADO', rol_asignado = 'Rigger'
WHERE id_proyecto = 86 AND id_user = 101;

-- 5. Auditar estado nuevo en tpry_rel_persona para proyecto 86
SELECT id_rel_persona, id_proyecto, id_user, rol_asignado, estado_real 
FROM sch_leangsp_prod.tpry_rel_persona 
WHERE id_proyecto = 86;

-- 6. Actualizar tequ_log_desplazamiento para proyecto 86 (log 104) para asignar a Nicolas Ceballos (45)
UPDATE sch_leangsp_prod.tequ_log_desplazamiento
SET id_user_chofer = 45
WHERE id_proyecto = 86 AND id_log_desplazamiento = 104;

-- 7. Cerrar viaje residual anterior de Nicolas Ceballos (log 94 de OT 46)
UPDATE sch_leangsp_prod.tequ_log_desplazamiento
SET estado_trayecto = 'FINALIZADO', fecha_llegada_faena = NOW()
WHERE id_user_chofer = 45 AND id_proyecto != 86 AND estado_trayecto NOT IN ('FINALIZADO', 'CANCELADO');

COMMIT;
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/remediar_ot39.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/remediar_ot39.sql"');
  console.log('=== SALIDA SQL ===');
  console.log(res.stdout);
  if (res.stderr) console.error('=== STDERR ===', res.stderr);

  ssh.dispose();
}

remediate().catch(console.error);
