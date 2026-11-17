const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function fixProdDatabase() {
  console.log('--- INICIANDO CORRECCIÓN DDL EN BASE DE DATOS DE PRODUCCIÓN ---');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('✔ Conectado a servidor de producción.');

  const sql = `
-- 1. Asegurar columnas id_linea_servicio y activo en tpry_rel_equipo (PROD)
ALTER TABLE sch_leangsp_prod.tpry_rel_equipo 
    ADD COLUMN IF NOT EXISTS id_linea_servicio BIGINT REFERENCES sch_leangsp_prod.tpry_linea_servicio(id_linea_servicio) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_tpry_rel_equipo_linea ON sch_leangsp_prod.tpry_rel_equipo(id_linea_servicio);

-- 2. Asegurar columnas id_linea_servicio y activo en tpry_rel_persona (PROD)
ALTER TABLE sch_leangsp_prod.tpry_rel_persona 
    ADD COLUMN IF NOT EXISTS id_linea_servicio BIGINT REFERENCES sch_leangsp_prod.tpry_linea_servicio(id_linea_servicio) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_tpry_rel_persona_linea ON sch_leangsp_prod.tpry_rel_persona(id_linea_servicio);

-- 3. Verificar columnas añadidas en tpry_rel_equipo y tpry_rel_persona
SELECT table_schema, table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('tpry_rel_equipo', 'tpry_rel_persona')
  AND table_schema = 'sch_leangsp_prod'
  AND column_name IN ('id_linea_servicio', 'activo');
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/fix_prod_columns.sql\n" + sql + "\nEOF");
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/fix_prod_columns.sql"');
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);

  ssh.dispose();
  console.log('--- DDL EN PRODUCCIÓN APLICADO EXITOSAMENTE ---');
}

fixProdDatabase().catch(err => {
  console.error('Error fatal aplicando DDL en producción:', err);
  process.exit(1);
});
