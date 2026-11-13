const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
SET search_path TO sch_leangsp;
UPDATE tpry_proyecto
SET id_proyecto_estado = CASE WHEN id_proyecto_estado < 4 THEN 4 ELSE id_proyecto_estado END,
    estado_vb_gerencia = 'NO_REQUERIDO',
    sucursal_origen = CASE WHEN sucursal_origen IN ('Temuco', 'Valdivia', 'Puerto Montt', 'Los Ángeles') THEN sucursal_origen ELSE 'Temuco' END,
    sucursal_destino = CASE WHEN sucursal_destino IN ('Temuco', 'Valdivia', 'Puerto Montt', 'Los Ángeles') THEN sucursal_destino ELSE 'Puerto Montt' END,
    json_field = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              COALESCE(json_field, '{}'::jsonb),
              '{crm_v1,requiere_vb_gerencia}', 'false'::jsonb, true
            ),
            '{crm_v1,estado_vb_gerencia}', '"NO_REQUERIDO"'::jsonb, true
          ),
          '{ejecucion_v1,estado_requerimiento}', '"APROBADO"'::jsonb, true
        ),
        '{ejecucion_v1,subtab_activa}', '"asignacion"'::jsonb, true
      ),
      '{crm_v1,lineas_servicio}', '[{"id":1,"is_linea_base":true,"tipo":"GRUAS TELESCOPICAS","subcategoria":"GRÚA TELESCÓPICA","descripcion":"Movimiento Sucursal Temuco ➔ Puerto Montt (Ida y Vuelta)","cantidad":1,"unidad":"Ida y Vuelta","valor_unitario":0,"equipo_asignado_id":"","operador_asignado_id":"","fecha_plan_ini":"2026-10-20","fecha_plan_fin":"2026-10-21"}]'::jsonb, true
    )
WHERE es_interno = true OR codi_proyecto LIKE 'INT-%';
DELETE FROM tapr_gerencia_token WHERE tipo_entidad = 'REQUERIMIENTO_INTERNO';
SELECT id_proyecto, codi_proyecto, id_proyecto_estado, sucursal_origen, sucursal_destino, estado_vb_gerencia FROM tpry_proyecto WHERE es_interno = true OR codi_proyecto LIKE 'INT-%';
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/fix_int.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('sudo -u postgres psql -d postgres -f /tmp/fix_int.sql');
  console.log(res.stdout || res.stderr);
  ssh.dispose();
}

run().catch(e => { console.error(e); process.exit(1); });
