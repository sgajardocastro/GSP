const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectEdpData() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const script = `
    const db = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/config/database');
    
    async function test() {
      const idProyecto = 4;
      const proyRes = await db.query("SELECT * FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = $1", [idProyecto]);
      const proyecto = proyRes.rows[0];
      const jf = typeof proyecto.json_field === 'string' ? JSON.parse(proyecto.json_field || '{}') : (proyecto.json_field || {});
      const crmV1 = jf.crm_v1 || {};

      let itsRow = null;
      const itsRes = await db.query("SELECT * FROM sch_leangsp_prod.tits_informe_termino WHERE id_proyecto = $1 ORDER BY version DESC, id_its DESC LIMIT 1;", [idProyecto]);
      if (itsRes.rows.length > 0) itsRow = itsRes.rows[0];

      const repRes = await db.query("SELECT * FROM sch_leangsp_prod.tedp_reporte_avance WHERE id_proyecto = $1 ORDER BY fecha_reporte ASC, dia_correlativo ASC;", [idProyecto]);
      const reports = repRes.rows;

      const snapLines = crmV1.lineas_servicio || jf.snapshot_comercial?.lines || jf.lines || [];
      const ajustesTesoreria = jf.edp_ajustes_v1 || null;
      const descuentoMonto = Number(ajustesTesoreria?.descuento_tesoreria || 0);

      let totalHorasFact = 0;
      let totalST = 0;
      reports.forEach(r => {
        totalHorasFact += Number(r.horas_facturables || 0);
        totalST += Number(r.horas_sobretiempo || 0);
      });

      console.log('totalHorasFact:', totalHorasFact);
      console.log('totalST:', totalST);

      let subtotalBase = 0;
      let detalles_adicionales = [];

      if (snapLines.length > 0) {
        const tarifasEditadas = ajustesTesoreria?.tarifas_editadas || {};
        const diasFaena = Math.max(1, reports.length);

        snapLines.forEach((l, idx) => {
          const valUnit = tarifasEditadas[idx] !== undefined
            ? Number(tarifasEditadas[idx])
            : Number(l.valorUnitario || l.precio_unitario || 0);
          const cant = Number(l.cantidad || 1);
          let sub = 0;
          let cantMostrar = cant;
          let unidadMostrar = l.unidad || 'GL';

          if (l.tipo === 'TRASLADOS' || (l.subcategoria || '').includes('FLETE') || (l.subcategoria || '').includes('ESCOLTA')) {
            sub = valUnit * cant;
          } else if (['GRUAS TELESCOPICAS', 'GRUA HORQUILLA', 'MANIPULADOR TELESCOPICO', 'CAMION PLUMA'].includes(l.tipo)) {
            if (l.unidad === 'Diario') {
              sub = valUnit * diasFaena * cant;
              cantMostrar = diasFaena + ' d';
            } else {
              const hrsAplicar = totalHorasFact > 0 ? totalHorasFact : (cant * 8);
              sub = valUnit * hrsAplicar;
              cantMostrar = hrsAplicar.toFixed(1) + ' hrs';
              unidadMostrar = 'Horas';
            }
          } else {
            sub = Number(l.subtotal_calculado || l.subtotal || (valUnit * cant));
          }

          subtotalBase += sub;
          detalles_adicionales.push({
            concepto: (l.tipo || 'Servicio') + (l.subcategoria ? ' — ' + l.subcategoria : ''),
            subtitulo: l.descripcion || '',
            unidad_cobro: unidadMostrar,
            cantidad: cantMostrar,
            precio_unitario: valUnit,
            monto_subtotal: Math.round(sub)
          });
        });

        const montoST = ajustesTesoreria?.sobretiempo_override !== null && ajustesTesoreria?.sobretiempo_override !== undefined
          ? Number(ajustesTesoreria.sobretiempo_override)
          : (totalST > 0 ? Math.round(totalST * 65000) : 0);

        if (montoST > 0) {
          subtotalBase += montoST;
          detalles_adicionales.push({
            concepto: 'Recargo Horas Sobretiempo / Extensión de Jornada',
            subtitulo: 'Horas adicionales autorizadas en faena',
            unidad_cobro: 'Horas ST',
            cantidad: totalST.toFixed(1) + ' hrs',
            precio_unitario: totalST > 0 ? Math.round(montoST / totalST) : montoST,
            monto_subtotal: Math.round(montoST)
          });
        }
      }

      console.log('subtotalBase:', subtotalBase);
      console.log('detalles_adicionales:', JSON.stringify(detalles_adicionales, null, 2));

      process.exit(0);
    }
    test().catch(e => { console.error(e); process.exit(1); });
  `;

  const b64 = Buffer.from(script).toString('base64');
  const res = await ssh.execCommand(`su - nodeadmin -c "node -e \\"eval(Buffer.from('${b64}', 'base64').toString())\\""`);
  console.log(res.stdout || res.stderr);
  ssh.dispose();
}

inspectEdpData().catch(e => { console.error(e); if (ssh) ssh.dispose(); });
