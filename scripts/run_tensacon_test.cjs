const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const script = `
    const db = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/config/database');
    
    async function test() {
      try {
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

        const snapLines = crmV1.lineas_servicio || (jf.snapshot_comercial && jf.snapshot_comercial.lines) || jf.lines || [];
        const ajustesTesoreria = jf.edp_ajustes_v1 || null;
        const descuentoMonto = Number((ajustesTesoreria && ajustesTesoreria.descuento_tesoreria) || 0);

        let totalHorasFact = 0;
        let totalST = 0;
        reports.forEach(r => {
          totalHorasFact += Number(r.horas_facturables || 0);
          totalST += Number(r.horas_sobretiempo || 0);
        });

        console.log('=== DATOS HORAS ===');
        console.log('totalHorasFact:', totalHorasFact);
        console.log('totalST:', totalST);

        let subtotalBase = 0;
        let detalles_adicionales = [];

        if (snapLines.length > 0) {
          const tarifasEditadas = (ajustesTesoreria && ajustesTesoreria.tarifas_editadas) || {};
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

          const montoST = (ajustesTesoreria && ajustesTesoreria.sobretiempo_override !== null && ajustesTesoreria.sobretiempo_override !== undefined)
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

        console.log('=== SUBTOTAL BASE EDP ===');
        console.log('subtotalBase:', subtotalBase);
        console.log('=== DETALLES ADICIONALES ===');
        console.log(JSON.stringify(detalles_adicionales, null, 2));

        const neto = Math.max(0, Math.round(subtotalBase - descuentoMonto));
        const iva = Math.round(neto * 0.19);
        const total = neto + iva;
        console.log('=== TOTALES EDP ===');
        console.log('Neto:', neto, 'IVA:', iva, 'Total:', total);
      } catch (err) {
        console.error('ERROR EN TEST:', err);
      } finally {
        process.exit(0);
      }
    }
    test();
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/test_tensacon.js\n${script}\nEOF`);
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/test_tensacon.js"');
  console.log(res.stdout || res.stderr);

  await ssh.execCommand('rm -f /tmp/test_tensacon.js');
  ssh.dispose();
}

run().catch(e => { console.error(e); if (ssh) ssh.dispose(); });
