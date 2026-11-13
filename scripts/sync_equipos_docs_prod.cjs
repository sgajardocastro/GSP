const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function syncCertificadosToProd() {
  console.log('Iniciando sincronización inmediata de certificados a PROD...');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const sql = `
BEGIN;

-- 1. Sincronizar tipos de certificado
INSERT INTO sch_leangsp_prod.tequ_tipos_certificado (
  id_tipo_certificado, nombre_tipo, descripcion, obligatorio, dias_alerta_vencimiento, estado, created_at
)
SELECT 
  id_tipo_certificado, nombre_tipo, descripcion, obligatorio, dias_alerta_vencimiento, estado, created_at
FROM sch_leangsp.tequ_tipos_certificado
ON CONFLICT (id_tipo_certificado) DO UPDATE SET
  nombre_tipo = EXCLUDED.nombre_tipo,
  descripcion = EXCLUDED.descripcion,
  obligatorio = EXCLUDED.obligatorio,
  dias_alerta_vencimiento = EXCLUDED.dias_alerta_vencimiento,
  estado = EXCLUDED.estado;

SELECT setval(
  'sch_leangsp_prod.tequ_tipos_certificado_id_tipo_certificado_seq', 
  COALESCE((SELECT MAX(id_tipo_certificado) FROM sch_leangsp_prod.tequ_tipos_certificado), 1)
);

-- 2. Sincronizar registros de tfmg_file vinculados a los certificados
INSERT INTO sch_leangsp_prod.tfmg_file (
  id_doc, tipo_doc, fecha_creacion, mimetype, name_doc_orig, name_doc_interno, path_doc, id_proceso, id_user, estado
)
SELECT 
  f.id_doc, f.tipo_doc, f.fecha_creacion, f.mimetype, f.name_doc_orig, f.name_doc_interno, f.path_doc, f.id_proceso, f.id_user, f.estado
FROM sch_leangsp.tfmg_file f
WHERE f.id_doc IN (
  SELECT DISTINCT ce.id_doc 
  FROM sch_leangsp.tequ_certificados_equipo ce 
  WHERE ce.id_doc IS NOT NULL
)
ON CONFLICT (id_doc) DO NOTHING;

SELECT setval(
  'sch_leangsp_prod.tfmg_file_id_doc_seq', 
  COALESCE((SELECT MAX(id_doc) FROM sch_leangsp_prod.tfmg_file), 1)
);

-- 3. Sincronizar los 289 certificados de equipos
INSERT INTO sch_leangsp_prod.tequ_certificados_equipo (
  id_certificado, id_equipo, id_tipo_certificado, entidad_emisora, numero_certificado,
  fecha_emision, fecha_vencimiento, id_doc, estado_validacion, observaciones,
  id_usuario_valida, fecha_validacion, id_usuario_creacion, created_at, updated_at
)
SELECT 
  ce.id_certificado, ce.id_equipo, ce.id_tipo_certificado, ce.entidad_emisora, ce.numero_certificado,
  ce.fecha_emision, ce.fecha_vencimiento, ce.id_doc, ce.estado_validacion, ce.observaciones,
  ce.id_usuario_valida, ce.fecha_validacion, ce.id_usuario_creacion, ce.created_at, ce.updated_at
FROM sch_leangsp.tequ_certificados_equipo ce
WHERE ce.id_equipo IN (SELECT id_equipo FROM sch_leangsp_prod.tequ_equipo)
ON CONFLICT (id_certificado) DO UPDATE SET
  id_equipo = EXCLUDED.id_equipo,
  id_tipo_certificado = EXCLUDED.id_tipo_certificado,
  entidad_emisora = EXCLUDED.entidad_emisora,
  numero_certificado = EXCLUDED.numero_certificado,
  fecha_emision = EXCLUDED.fecha_emision,
  fecha_vencimiento = EXCLUDED.fecha_vencimiento,
  id_doc = EXCLUDED.id_doc,
  estado_validacion = EXCLUDED.estado_validacion,
  observaciones = EXCLUDED.observaciones,
  updated_at = NOW();

SELECT setval(
  'sch_leangsp_prod.tequ_certificados_equipo_id_certificado_seq', 
  COALESCE((SELECT MAX(id_certificado) FROM sch_leangsp_prod.tequ_certificados_equipo), 1)
);

-- 4. Permisos para el usuario de producción
GRANT ALL ON ALL TABLES IN SCHEMA sch_leangsp_prod TO usr_leangsp_prod;
GRANT ALL ON ALL SEQUENCES IN SCHEMA sch_leangsp_prod TO usr_leangsp_prod;

COMMIT;
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_certs_prod.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sync_certs_prod.sql"');
  console.log('Resultado migración:\n', res.stdout);

  // Verificación
  const v1 = await ssh.execCommand("su - postgres -c \"psql -d postgres -t -c 'SELECT count(*) FROM sch_leangsp_prod.tequ_tipos_certificado;'\"");
  const v2 = await ssh.execCommand("su - postgres -c \"psql -d postgres -t -c 'SELECT count(*) FROM sch_leangsp_prod.tequ_certificados_equipo;'\"");
  const v3 = await ssh.execCommand("su - postgres -c \"psql -d postgres -t -c 'SELECT count(*) FROM sch_leangsp_prod.tfmg_file;'\"");
  
  console.log(`Verificación PROD -> Tipos: ${v1.stdout.trim()} | Certificados: ${v2.stdout.trim()} | Archivos: ${v3.stdout.trim()}`);

  ssh.dispose();
}

syncCertificadosToProd().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
