const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectDeep() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const script = `
    const { Client } = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules/pg');
    const client = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      database: 'postgres'
    });

    async function run() {
      await client.connect();

      // 1. Proyecto
      const resP = await client.query("SELECT id_proyecto, codi_proyecto, nombre_proyecto, json_field FROM sch_leangsp_prod.tpry_proyecto WHERE codi_proyecto ILIKE '%233-004%'");
      const p = resP.rows[0];
      console.log('--- PROYECTO ---');
      console.log('ID:', p.id_proyecto, 'Codi:', p.codi_proyecto, 'Nombre:', p.nombre_proyecto);
      
      const jf = p.json_field || {};
      console.log('Cliente:', jf.cliente_nombre || jf.empresa_cliente, 'RUT:', jf.cliente_rut);
      console.log('Vendedor:', jf.vendedor_nombre, 'Cotizacion:', jf.numero_cotizacion || jf.id_cotizacion);
      console.log('Cotizacion Data:', JSON.stringify(jf.cotizacion_resumen || jf.cotizacion || {}, null, 2));
      console.log('EDP en json_field:', JSON.stringify(jf.edp_caratula || jf.edp || jf.estado_pago || {}, null, 2));

      // 2. Estado de Pago en tedp_estado_pago
      const resEdp = await client.query("SELECT * FROM sch_leangsp_prod.tedp_estado_pago WHERE id_proyecto = $1", [p.id_proyecto]);
      console.log('--- TEDP_ESTADO_PAGO ---');
      console.log(JSON.stringify(resEdp.rows, null, 2));

      // 3. Detalle de EDP en tedp_estado_pago_detalle
      const resEdpDet = await client.query("SELECT * FROM sch_leangsp_prod.tedp_estado_pago_detalle WHERE id_proyecto = $1 OR id_estado_pago IN (SELECT id_estado_pago FROM sch_leangsp_prod.tedp_estado_pago WHERE id_proyecto = $1)", [p.id_proyecto]);
      console.log('--- TEDP_ESTADO_PAGO_DETALLE ---');
      console.log(JSON.stringify(resEdpDet.rows, null, 2));

      // 4. Reports de avance
      const resRep = await client.query("SELECT id_reporte_avance, fecha_reporte, horas_operadas, horas_facturables, horas_sobretiempo, json_field FROM sch_leangsp_prod.tedp_reporte_avance WHERE id_proyecto = $1", [p.id_proyecto]);
      console.log('--- REPORTS DE AVANCE ---');
      console.log(JSON.stringify(resRep.rows.map(r => {
        const jf = r.json_field || {};
        return {
          id: r.id_reporte_avance,
          fecha: r.fecha_reporte,
          operadas: r.horas_operadas,
          facturables: r.horas_facturables,
          sobretiempo: r.horas_sobretiempo,
          tipo_sobretiempo: jf.tipo_sobretiempo,
          valor_sobretiempo: jf.valor_sobretiempo,
          tarifa_sobretiempo: jf.tarifa_sobretiempo,
          total_report: jf.monto_total_report,
          jf: jf
        };
      }), null, 2));

      // 5. Lineas de cotizacion / items cobrados
      const resLineas = await client.query("SELECT * FROM sch_leangsp_prod.tpry_gantt_tarea_v2 WHERE id_proyecto = $1", [p.id_proyecto]);
      console.log('--- LINEAS GANTT / COTIZACION ---');
      console.log(JSON.stringify(resLineas.rows.map(l => ({
        id: l.id_tarea,
        nombre: l.nombre_tarea,
        unidad: l.unidad_cobro,
        cantidad: l.cantidad,
        precio_unitario: l.precio_unitario,
        total: l.total,
        jf: l.json_field
      })), null, 2));

      await client.end();
    }
    run().catch(console.error);
  `;

  const b64 = Buffer.from(script).toString('base64');
  const res = await ssh.execCommand(`node -e "eval(Buffer.from('${b64}', 'base64').toString())"`);
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);

  ssh.dispose();
}

inspectDeep().catch(e => { console.error(e); if (ssh) ssh.dispose(); });
