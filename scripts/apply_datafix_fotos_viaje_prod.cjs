const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function runDataFix() {
  console.log('--- INICIANDO DATA FIX FOTOS TELEMETRÍA VIAJE ---');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
-- 1. Auditar estado previo en PROD
SELECT id_log_desplazamiento, token_viaje, foto_tablero_salida_path, foto_tablero_llegada_path
FROM sch_leangsp_prod.tequ_log_desplazamiento
WHERE id_log_desplazamiento = 104 OR token_viaje = 'vj_86_39_7dc3d0ca';

-- 2. Corregir rutas en PROD anteponiendo el prefijo corporativo
UPDATE sch_leangsp_prod.tequ_log_desplazamiento
SET 
  foto_tablero_salida_path = REPLACE(foto_tablero_salida_path, '/api/v1/storage/view/', 'https://servidor.leanglobal.cl/lg-gsp-prod/api/v1/storage/view/'),
  foto_tablero_llegada_path = REPLACE(foto_tablero_llegada_path, '/api/v1/storage/view/', 'https://servidor.leanglobal.cl/lg-gsp-prod/api/v1/storage/view/'),
  foto_odometro_salida_path = REPLACE(foto_odometro_salida_path, '/api/v1/storage/view/', 'https://servidor.leanglobal.cl/lg-gsp-prod/api/v1/storage/view/'),
  foto_horometro_salida_path = REPLACE(foto_horometro_salida_path, '/api/v1/storage/view/', 'https://servidor.leanglobal.cl/lg-gsp-prod/api/v1/storage/view/'),
  foto_odometro_llegada_path = REPLACE(foto_odometro_llegada_path, '/api/v1/storage/view/', 'https://servidor.leanglobal.cl/lg-gsp-prod/api/v1/storage/view/'),
  foto_horometro_camion_llegada_path = REPLACE(foto_horometro_camion_llegada_path, '/api/v1/storage/view/', 'https://servidor.leanglobal.cl/lg-gsp-prod/api/v1/storage/view/')
WHERE foto_tablero_salida_path LIKE '/api/v1/storage/view/%'
   OR foto_tablero_llegada_path LIKE '/api/v1/storage/view/%'
   OR foto_odometro_salida_path LIKE '/api/v1/storage/view/%'
   OR foto_odometro_llegada_path LIKE '/api/v1/storage/view/%';

-- 3. Auditar estado previo y corregir también en DEV por consistencia
UPDATE sch_leangsp.tequ_log_desplazamiento
SET 
  foto_tablero_salida_path = REPLACE(foto_tablero_salida_path, '/api/v1/storage/view/', 'https://servidor.leanglobal.cl/lg-gsp-dev/api/v1/storage/view/'),
  foto_tablero_llegada_path = REPLACE(foto_tablero_llegada_path, '/api/v1/storage/view/', 'https://servidor.leanglobal.cl/lg-gsp-dev/api/v1/storage/view/'),
  foto_odometro_salida_path = REPLACE(foto_odometro_salida_path, '/api/v1/storage/view/', 'https://servidor.leanglobal.cl/lg-gsp-dev/api/v1/storage/view/'),
  foto_horometro_salida_path = REPLACE(foto_horometro_salida_path, '/api/v1/storage/view/', 'https://servidor.leanglobal.cl/lg-gsp-dev/api/v1/storage/view/'),
  foto_odometro_llegada_path = REPLACE(foto_odometro_llegada_path, '/api/v1/storage/view/', 'https://servidor.leanglobal.cl/lg-gsp-dev/api/v1/storage/view/'),
  foto_horometro_camion_llegada_path = REPLACE(foto_horometro_camion_llegada_path, '/api/v1/storage/view/', 'https://servidor.leanglobal.cl/lg-gsp-dev/api/v1/storage/view/')
WHERE foto_tablero_salida_path LIKE '/api/v1/storage/view/%'
   OR foto_tablero_llegada_path LIKE '/api/v1/storage/view/%'
   OR foto_odometro_salida_path LIKE '/api/v1/storage/view/%'
   OR foto_odometro_llegada_path LIKE '/api/v1/storage/view/%';

-- 4. Verificar resultado final en PROD
SELECT id_log_desplazamiento, token_viaje, foto_tablero_salida_path, foto_tablero_llegada_path
FROM sch_leangsp_prod.tequ_log_desplazamiento
WHERE id_log_desplazamiento = 104 OR token_viaje = 'vj_86_39_7dc3d0ca';
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/datafix_viaje_fotos.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/datafix_viaje_fotos.sql"');
  console.log('STDOUT:\n', res.stdout);
  if (res.stderr) console.error('STDERR:\n', res.stderr);

  ssh.dispose();
  console.log('--- DATA FIX FINALIZADO EXITOSAMENTE ---');
}

runDataFix().catch(err => {
  console.error('Error fatal ejecutando data fix:', err);
  process.exit(1);
});
