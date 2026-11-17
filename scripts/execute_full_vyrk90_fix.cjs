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

  // 1. Data fix SQL
  const sql = `
BEGIN;

-- Purgar equipo 52 en tpry_rel_equipo
UPDATE sch_leangsp_prod.tpry_rel_equipo
SET estado_real = 'REEMPLAZADO'
WHERE id_proyecto = 97 AND id_equipo = 52;

-- Asegurar que 53 y 79 estén PROGRAMADO
UPDATE sch_leangsp_prod.tpry_rel_equipo
SET estado_real = 'PROGRAMADO', rol_equipo = 'GRUAS TELESCOPICAS'
WHERE id_proyecto = 97 AND id_equipo = 53;

UPDATE sch_leangsp_prod.tpry_rel_equipo
SET estado_real = 'PROGRAMADO', rol_equipo = 'Equipo Traslado'
WHERE id_proyecto = 97 AND id_equipo = 79;

-- Actualizar json_field ejecucion_v1.equipo_id a 53
UPDATE sch_leangsp_prod.tpry_proyecto
SET json_field = jsonb_set(
  json_field,
  '{ejecucion_v1,equipo_id}',
  '53'::jsonb
)
WHERE id_proyecto = 97;

-- Auditar estado final de tpry_rel_equipo
SELECT re.id_rel_equipo, re.id_proyecto, re.id_equipo, re.rol_equipo, re.estado_real, e.patente, e.modelo
FROM sch_leangsp_prod.tpry_rel_equipo re
JOIN sch_leangsp_prod.tequ_equipo e ON re.id_equipo = e.id_equipo
WHERE re.id_proyecto = 97;

COMMIT;
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/clean_ot47_eq.sql\n" + sql + "\nEOF");
  const resSql = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/clean_ot47_eq.sql"');
  console.log('=== SALIDA SQL ===\n', resSql.stdout);

  // 2. Upload proyectoModel.js
  const localModel = path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/proyectoModel.js');
  const remoteModel = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/proyectoModel.js';
  console.log('Subiendo proyectoModel.js actualizado...');
  await ssh.putFile(localModel, remoteModel);

  // 3. Restart PM2
  console.log('Reiniciando PM2...');
  await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');

  // 4. Trigger OT 47 generation
  const nodeScript = `
const proyectoModel = require('./src/models/proyectoModel');
const pm = new proyectoModel();

async function run() {
  console.log('Generando OT Version 10 para id_proyecto 97 (GSP-2611-00047)...');
  const res = await pm.generarOTVersion(97);
  console.log('Resultado generacion:', JSON.stringify(res.ot, null, 2));
  process.exit(0);
}

run().catch(err => {
  console.error('Error generando OT 47:', err);
  process.exit(1);
});
`;

  await ssh.execCommand(`cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp-prod/trigger_ot47.js\n${nodeScript}\nEOF`);
  const resGen = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node trigger_ot47.js"');
  console.log('=== SALIDA GENERACION OT 47 ===\n', resGen.stdout);
  if (resGen.stderr) console.error('=== STDERR ===\n', resGen.stderr);

  await ssh.execCommand('rm -f /home/nodeadmin/proyectos/lean-services-gsp-prod/trigger_ot47.js /tmp/clean_ot47_eq.sql');
  ssh.dispose();
}

run().catch(console.error);
