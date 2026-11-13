const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const schemas = [
    { s: 'sch_leangsp', id: 105 },
    { s: 'sch_leangsp_prod', id: 1 }
  ];

  for (const item of schemas) {
    console.log(`\nConfigurando Proyecto LeanGlobal de Prueba en ${item.s} (ID: ${item.id})...`);

    const sql = `
      UPDATE ${item.s}.tpry_proyecto
      SET 
        nombre_proyecto = 'Servicio Izaje Planta LeanGlobal (Prueba Facturacion DTE)',
        id_proyecto_estado = 5,
        fecha_plan_ini = CURRENT_DATE - INTERVAL '5 days',
        fecha_plan_fin = CURRENT_DATE,
        json_field = jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                json_field,
                '{crm_v1,monto_neto_total}', '1820000'::jsonb
              ),
              '{edp_flujo_v1}', jsonb_build_object(
                'estado', 'LISTO_FACTURAR',
                'folio_edp', 'EDP-2026-001',
                'monto_edp_neto', 1820000,
                'monto_total_edp', 1820000,
                'tiene_oc', true,
                'numero_oc', '12990',
                'monto_total_ocs', 1820000,
                'habilitado_facturar', true,
                'estado_facturacion_inmediata', 'HABILITADO_FACTURAR',
                'firma_1_analista', jsonb_build_object(
                  'ok', true,
                  'firmante_nombre', 'Yara Ctl. Gestion',
                  'fecha_firma', (NOW() - INTERVAL '2 days')::text
                ),
                'firma_2_contabilidad', jsonb_build_object(
                  'ok', true,
                  'firmante_nombre', 'Maritza Contabilidad',
                  'fecha_firma', (NOW() - INTERVAL '1 day')::text
                ),
                'firma_3_comercial', jsonb_build_object(
                  'ok', true,
                  'firmante_nombre', 'Luis Comercial',
                  'fecha_firma', (NOW() - INTERVAL '12 hours')::text
                )
              )
            ),
            '{ordenes_compra}', jsonb_build_array(
              jsonb_build_object(
                'id', 'oc-12990',
                'numero_oc', '12990',
                'fecha_emision', (CURRENT_DATE - INTERVAL '4 days')::text,
                'monto_neto', 1820000,
                'asumido_sin_oc', false
              )
            )
          ),
          '{facturas_dte}', '[]'::jsonb
        )
      WHERE id_proyecto = ${item.id};
    `;

    // Escribir archivo temporal SQL en el servidor para evitar problemas de escape en bash
    await ssh.execCommand(`cat << 'EOF' > /tmp/update_proy_${item.s}.sql\n${sql}\nEOF`);
    const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/update_proy_${item.s}.sql"`);
    console.log(`Resultado ${item.s}:`, res.stdout.trim() || res.stderr);
  }

  ssh.dispose();
}

run().catch(console.error);
