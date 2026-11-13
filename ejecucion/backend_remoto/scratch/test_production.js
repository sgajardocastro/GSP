const pool = require('../src/config/dbConfig.js');

function calcularSubtotalLinea(l) {
  if (!l) return 0;
  if (l.subtotal !== undefined && l.subtotal !== null && Number(l.subtotal) > 0) {
    return Number(l.subtotal);
  }
  const vu = Number(l.valor_unitario !== undefined ? l.valor_unitario : (l.valorUnitario || 0));
  if (l.unidad === 'Horas Diarias Minimas' || l.unidad === 'Horas Diarias' || l.unidad === 'Diario' || l.unidad === 'Jornada') {
    const dias = Number(l.cantidad_dias !== undefined ? l.cantidad_dias : l.cantidad) || 1;
    const horas = Number(l.cantidad_horas !== undefined ? l.cantidad_horas : (l.pisoMinimo || 8));
    return dias * horas * vu;
  }
  if (l.unidad === 'Horas Mes Minimas' || l.unidad === 'Horas Mensuales Minimas' || l.unidad === 'Mensual') {
    const meses = Number(l.cantidad_meses !== undefined ? l.cantidad_meses : l.cantidad) || 1;
    const horas = Number(l.cantidad_horas !== undefined ? l.cantidad_horas : (l.pisoMinimo || 180));
    return meses * horas * vu;
  }
  const cant = Number(l.cantidad) || 1;
  return cant * vu;
}

async function run() {
  try {
    const eqRes = await pool.query("SELECT id_equipo, patente, modelo FROM tequ_equipo ORDER BY id_equipo");
    const proyRes = await pool.query("SELECT id_proyecto, codi_proyecto, id_proyecto_estado, json_field FROM tpry_proyecto WHERE id_proyecto_estado NOT IN (99, 6)");

    const produccionPorEquipo = {};
    eqRes.rows.forEach(e => {
      produccionPorEquipo[e.id_equipo] = {
        id_equipo: e.id_equipo,
        patente: e.patente,
        modelo: e.modelo,
        totalProducido: 0,
        ots: []
      };
    });

    for (const p of proyRes.rows) {
      const ej = p.json_field?.ejecucion_v1 || {};
      const crm = p.json_field?.crm_v1 || {};
      const patGrua = (ej.patente_grua || '').toUpperCase().trim();
      const lineas = crm.lineas_servicio || ej.snapshot_comercial?.lines || [];

      // Check each equipment
      for (const eq of eqRes.rows) {
        const idEq = Number(eq.id_equipo);
        const patEq = (eq.patente || '').toUpperCase().trim();
        let montoEqEnProyecto = 0;

        // 1. Direct line matches
        let lineMatched = false;
        if (Array.isArray(lineas) && lineas.length > 0) {
          for (const l of lineas) {
            const lId = Number(l.id_equipo || l.equipo_asignado_id);
            const lPat = (l.patente || '').toUpperCase().trim();
            if ((lId && lId === idEq) || (lPat && lPat === patEq)) {
              montoEqEnProyecto += calcularSubtotalLinea(l);
              lineMatched = true;
            }
          }
        }

        // 2. If no direct line matched, but equipment is the primary crane of project
        if (!lineMatched && patEq && (patGrua === patEq)) {
          // Take crane lines or total
          const craneLines = lineas.filter(l => {
            const desc = (l.descripcion || l.item || '').toLowerCase();
            return desc.includes('grúa') || desc.includes('grua') || desc.includes('telescópica') || desc.includes('faena');
          });
          if (craneLines.length > 0) {
            montoEqEnProyecto += craneLines.reduce((s, l) => s + calcularSubtotalLinea(l), 0);
          } else if (p.monto_neto) {
            montoEqEnProyecto += Number(p.monto_neto);
          }
        }

        if (montoEqEnProyecto > 0) {
          produccionPorEquipo[idEq].totalProducido += montoEqEnProyecto;
          produccionPorEquipo[idEq].ots.push({ ot: p.codi_proyecto, monto: montoEqEnProyecto });
        }
      }
    }

    const conProduccion = Object.values(produccionPorEquipo).filter(e => e.totalProducido > 0);
    console.log(`Equipos con producción económica (${conProduccion.length}):`);
    conProduccion.forEach(e => {
      console.log(`ID ${e.id_equipo} | Patente: ${e.patente} | Modelo: ${e.modelo} | Total: $${e.totalProducido.toLocaleString('es-CL')} (OTs: ${e.ots.map(o => `${o.ot}: $${o.monto}`).join(', ')})`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
