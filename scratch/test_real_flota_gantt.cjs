const { Pool } = require('../ejecucion/backend_remoto/node_modules/pg');

async function testWithRealDb() {
  const pool = new Pool({
    host: '138.255.103.18',
    port: 5432,
    user: 'postgres',
    password: process.env.DB_PASSWORD || 'lgbl2025.',
    database: 'db_leanglobal_prod'
  });

  console.log('Querying real equipments from sch_leangsp_prod...');
  const resEq = await pool.query('SELECT * FROM sch_leangsp_prod.tequ_equipo WHERE status = 1');
  console.log(`Loaded ${resEq.rows.length} equipments.`);

  const resOts = await pool.query('SELECT id_proyecto, codi_proyecto, id_proyecto_estado, fecha_plan_ini, fecha_real_ini, fecha_creacion, fecha_plan_fin, fecha_real_fin, json_field FROM sch_leangsp_prod.tpry_proyecto');
  console.log(`Loaded ${resOts.rows.length} projects.`);

  await pool.end();

  // Test date formatting
  const formatIsoToDdMmYyyy = (fStr) => {
    if (!fStr) return '—'
    const partes = String(fStr).slice(0, 10).split('-')
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`
    }
    return String(fStr)
  };

  const resolverUltimoMantenimientoEquipo = (eq) => {
    const mnt = eq.mnt_info || {}
    const fechaRaw = mnt.fecha_ultima_mantencion || eq.fecha_ultima_mantencion || mnt.ultima_fecha_ot || eq.fecha_ultima_lectura || null
    const fechaFmt = fechaRaw ? formatIsoToDdMmYyyy(String(fechaRaw).slice(0, 10)) : null
    const pauta = mnt.ultima_pauta_ejecutada || eq.ultima_pauta_ejecutada || mnt.ultimo_tipo_mantencion || null
    const horoService = Number(mnt.ultimo_horometro_service || eq.ultimo_horometro_service || 0)
    const horoActual = Number(eq.horometro_grua_acumulado || eq.horometro_chasis_acumulado || mnt.horometro_actual || 0)
    const odoActual = Number(eq.odometro_acumulado || mnt.odometro_actual || 0)

    if (eq.estado === 'MANTENCION' || mnt.ot_activa) {
      const folioOt = mnt.ot_activa?.numero_ot || mnt.numero_ot_activa || 'En Taller'
      return {
        label: `🔧 ${folioOt}`,
        sub: pauta || (fechaFmt ? `Ingreso: ${fechaFmt}` : 'Mantención activa'),
        classes: 'text-amber-400',
        tooltip: `Equipo actualmente en mantención (${folioOt})`
      }
    }

    if (pauta || fechaFmt || horoService > 0) {
      const labelPrincipal = fechaFmt || (pauta ? String(pauta) : `${horoService.toLocaleString('es-CL')} hrs`)
      const subParts = []
      if (pauta && fechaFmt) subParts.push(pauta)
      if (horoService > 0) subParts.push(`@${horoService.toLocaleString('es-CL')}h`)
      else if (horoActual > 0) subParts.push(`${horoActual.toLocaleString('es-CL')}h acum.`)
      else if (odoActual > 0) subParts.push(`${odoActual.toLocaleString('es-CL')}km`)
      return {
        label: labelPrincipal,
        sub: subParts.join(' · ') || 'Al día',
        classes: 'text-emerald-300',
        tooltip: `Último mantenimiento: ${labelPrincipal} ${subParts.join(' ')}`
      }
    }

    if (horoActual > 0 || odoActual > 0) {
      return {
        label: 'Sin OTM previa',
        sub: horoActual > 0 ? `Horo: ${horoActual.toLocaleString('es-CL')}h` : `Odo: ${odoActual.toLocaleString('es-CL')}km`,
        classes: 'text-slate-400',
        tooltip: 'Sin orden de mantenimiento cerrada registrada en sistema'
      }
    }

    return {
      label: 'Sin registro',
      sub: 'Preventivo al día',
      classes: 'text-slate-500',
      tooltip: 'Sin mantenciones registradas en el historial'
    }
  };

  let errors = 0;
  for (const eq of resEq.rows) {
    try {
      const mnt = resolverUltimoMantenimientoEquipo(eq);
      if (!mnt.label) throw new Error('Missing label');
    } catch (err) {
      console.error(`Error processing equipment ${eq.id_equipo} (${eq.patente}):`, err.message);
      errors++;
    }
  }

  console.log(`Simulation on ${resEq.rows.length} real equipments: ${errors} errors.`);
}

testWithRealDb().catch(console.error);
