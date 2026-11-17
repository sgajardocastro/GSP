const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function runDataFixOT4() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const script = `
require('/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules/dotenv').config({ path: '/home/nodeadmin/proyectos/lean-services-gsp-prod/.env' });
const pool = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/config/postgresPool');

async function test() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Incorporar el documento 1943 en el reporte legítimo #72
    const update72 = await client.query(\`
      UPDATE sch_leangsp_prod.tedp_reporte_avance
      SET ajustes_analista = jsonb_set(
            COALESCE(ajustes_analista::jsonb, '{}'::jsonb),
            '{documentos_dia}',
            jsonb_build_array(
              jsonb_build_object(
                'id_doc', 1943,
                'titulo', 'METTCO OMAR FUENTES 12.11',
                'categoria', 'OPERACION_DIARIA',
                'id_equipo', 56,
                'mime_type', 'image/jpeg',
                'url_vista', '/api/v1/storage/view/1943',
                'url_descarga', '/api/v1/storage/download/1943',
                'subido_por', 'Control de Gestión',
                'fecha_adjunto', '2026-11-13T20:39:56.814Z',
                'fecha_servicio', '2026-11-12',
                'nombre_archivo', 'METTCO OMAR FUENTES 12.11.jpeg',
                'tipo_documento', 'DOCUMENTO_JORNADA',
                'dia_correlativo', 12,
                'id_reporte_avance', 72
              )
            )
          ) || '{"evidencia_fisica_adjunta": true, "requiere_evidencia_fisica": false}'::jsonb
      WHERE id_reporte_avance = 72
      RETURNING id_reporte_avance, id_equipo, dia_correlativo, ajustes_analista;
    \`);
    console.log('REPORTE 72 ACTUALIZADO:', update72.rows[0]);

    // 2. Eliminar el reporte duplicado #88
    const del88 = await client.query(\`
      DELETE FROM sch_leangsp_prod.tedp_reporte_avance
      WHERE id_reporte_avance = 88 AND id_proyecto = 33 AND dia_correlativo = 12
      RETURNING id_reporte_avance, dia_correlativo;
    \`);
    console.log('REPORTE 88 ELIMINADO:', del88.rows);

    // 3. Alinear el JSON de la OT con el equipo vigente RSPL.82-3 (id_equipo = 56)
    const updateProy = await client.query(\`
      UPDATE sch_leangsp_prod.tpry_proyecto
      SET json_field = jsonb_set(
        json_field,
        '{crm_v1,lineas_servicio,0,equipo_asignado_id}',
        '56'::jsonb
      )
      WHERE id_proyecto = 33
      RETURNING id_proyecto;
    \`);
    console.log('PROYECTO 33 JSON ACTUALIZADO:', updateProy.rows[0]);

    await client.query('COMMIT');
    console.log('TRANSACCION EXITOSA');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('ERROR EN TRANSACCION:', e);
  } finally {
    client.release();
    process.exit(0);
  }
}
test().catch(function(e) { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/datafix_ot4.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/datafix_ot4.js"');
  console.log('RESULT:\n', res.stdout, res.stderr);

  ssh.dispose();
}

runDataFixOT4().catch(console.error);
