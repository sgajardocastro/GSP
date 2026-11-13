const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('Conectado a SSH');

  const sql = `
    UPDATE sch_leangsp.tpry_proyecto
    SET json_field = (json_field - 'facturas_dte' - 'factura') || jsonb_build_object(
      'facturas_dte', '[]'::jsonb,
      'liquidacion_v1', (COALESCE(json_field->'liquidacion_v1', '{}'::jsonb) - 'factura_numero' - 'monto_facturado_neto' - 'monto_facturado_iva' - 'monto_facturado_bruto' - 'cantidad_facturas' - 'archivo_factura') || jsonb_build_object('estado_financiero', 'PENDIENTE_FACTURACION')
    )
    WHERE id_proyecto = 105;
  `;

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql.replace(/"/g, '\\"')}\\""`);
  console.log('Update result:', res.stdout);

  const check = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_proyecto, codi_proyecto, json_field->'facturas_dte' as dtes, json_field->'liquidacion_v1' as liq FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = 105;\\""`);
  console.log('Check result:', check.stdout);

  ssh.dispose();
}

main().catch(err => {
  console.error(err);
  ssh.dispose();
});
