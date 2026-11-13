const pool = require('../src/config/postgresPool');

// --- UTILIDADES ---
function parseHoraMinutos(horaStr) {
  if (!horaStr || typeof horaStr !== 'string') return 480;
  const parts = horaStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

function getHoraStrFromDate(dateVal) {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('es-CL', {
    timeZone: 'America/Santiago',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function getListaDiasHabiles(fechaIniStr, fechaFinStr) {
  const lista = [];
  if (!fechaIniStr || !fechaFinStr) return lista;
  const dIni = new Date(String(fechaIniStr).split('T')[0] + 'T00:00:00');
  const dFin = new Date(String(fechaFinStr).split('T')[0] + 'T00:00:00');
  if (isNaN(dIni.getTime()) || isNaN(dFin.getTime()) || dFin < dIni) return lista;

  let curr = new Date(dIni);
  while (curr <= dFin) {
    const day = curr.getDay();
    if (day !== 0 && day !== 6) {
      lista.push(curr.toISOString().split('T')[0]);
    }
    curr.setDate(curr.getDate() + 1);
  }
  return lista;
}

async function testCase014() {
  try {
    const fechaConsulta = '2026-10-03';

    // 1. Catálogo Usuarios
    const uRes = await pool.query('SELECT id_user, name_frst, apellido_pat, movil, email FROM sch_leangsp.tsec_users');
    const userMap = new Map();
    uRes.rows.forEach(u => {
      const nombre = [u.name_frst, u.apellido_pat].filter(Boolean).join(' ').trim() || u.email;
      userMap.set(Number(u.id_user), { nombre, telefono: u.movil || '' });
    });

    // 2. Catálogo Equipos
    const eqRes = await pool.query('SELECT id_equipo, patente, modelo, marca, tipo_equipo FROM sch_leangsp.tequ_equipo');
    const eqMap = new Map();
    eqRes.rows.forEach(e => {
      eqMap.set(Number(e.id_equipo), e);
    });

    // 3. Proyecto 103
    const pRes = await pool.query(`
      SELECT p.*, 
        COALESCE(clt.razon_social, clt.name_empresa, p.json_field->>'cliente_nombre', 'Cliente Mandante') AS cliente_nombre,
        COALESCE(p.json_field->>'obra_nombre', p.json_field->'crm_v1'->>'obra_nombre', p.json_field->'ejecucion_v1'->'cliente'->>'obra', p.nombre_proyecto) AS obra_nombre
      FROM sch_leangsp.tpry_proyecto p
      LEFT JOIN sch_leangsp.tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
      WHERE p.id_proyecto = 103
    `);
    const p = pRes.rows[0];
    const jf = p.json_field || {};
    const ejec = jf.ejecucion_v1 || {};
    const crm = jf.crm_v1 || {};
    const lines = crm.lineas_servicio || jf.lineas_servicio || [];

    // Resolver Grúa Principal
    let equipoNombre = 'Sin equipo asignado';
    let idEquipoPrincipal = null;
    const firstEq = lines.find(l => (l.tipo || '').toUpperCase().includes('GRUA') || l.equipo_asignado_id);
    if (firstEq) {
      idEquipoPrincipal = firstEq.equipo_asignado_id || firstEq.id_equipo;
      const eqObj = eqMap.get(Number(idEquipoPrincipal));
      if (eqObj) {
        equipoNombre = `${eqObj.tipo_equipo || 'Grúa'} · ${eqObj.patente} (${eqObj.modelo || ''})`;
      } else {
        equipoNombre = firstEq.tipo || firstEq.modelo || 'Grúa Principal';
        if (firstEq.patente) equipoNombre += ` · ${firstEq.patente}`;
      }
    }

    // Resolver Operador
    let operadorNombre = 'Sin operador asignado';
    let operadorTelefono = '';
    const trip = ejec.tripulacion_asignada || [];
    const opTrip = trip.find(t => {
      const c = (t.cargo || t.rol || '').toUpperCase();
      return c.includes('OPERADOR') || c.includes('CHOFER') || c.includes('GRUA');
    });
    const idOp = opTrip?.id_user || ejec.operador_id || firstEq?.operador_asignado_id;
    if (idOp && userMap.has(Number(idOp))) {
      const u = userMap.get(Number(idOp));
      operadorNombre = u.nombre;
      operadorTelefono = u.telefono;
    }

    // Historial Reportes Reales (sin filtro flete destructivo)
    const histSql = `
      SELECT id_reporte_avance, dia_correlativo, fecha_reporte, estado_reporte,
             fecha_inicio_servicio, fecha_termino_servicio, fecha_registro, device_timestamp
      FROM sch_leangsp.tedp_reporte_avance
      WHERE id_proyecto = $1
        AND (token_report IS NULL OR token_report NOT LIKE 'FLT-%')
      ORDER BY dia_correlativo ASC;
    `;
    const hRes = await pool.query(histSql, [p.id_proyecto]);
    const histReports = hRes.rows;
    const reportsConsumidos = histReports.filter(r => r.estado_reporte !== 'JORNADA_EN_CURSO').length;

    // Planificación temporal
    const fSalidaPlan = ejec.fecha_salida_plan || (p.fecha_plan_ini ? p.fecha_plan_ini.toISOString().split('T')[0] : null);
    const fFinPlan = ejec.fecha_fin_plan || (p.fecha_plan_fin ? p.fecha_plan_fin.toISOString().split('T')[0] : null);

    let diasHabilesLista = [];
    if (Array.isArray(ejec.plan_diario) && ejec.plan_diario.length > 0) {
      diasHabilesLista = ejec.plan_diario.map(pd => pd.fecha);
    } else if (fSalidaPlan && fFinPlan) {
      diasHabilesLista = getListaDiasHabiles(fSalidaPlan, fFinPlan);
    }

    const maxDiaReport = histReports.reduce((max, r) => Math.max(max, Number(r.dia_correlativo || 0)), 0);
    let totalDiasOT = Math.max(1, diasHabilesLista.length, maxDiaReport);
    const candadoActivo = reportsConsumidos >= totalDiasOT;

    // Determinar día actual
    let diaActual = 1;
    let tipoDia = 'INICIO';
    if (diasHabilesLista.length > 0) {
      const idx = diasHabilesLista.indexOf(fechaConsulta);
      if (idx >= 0) {
        diaActual = idx + 1;
      } else {
        diaActual = fechaConsulta < diasHabilesLista[0] ? 1 : totalDiasOT;
      }
    } else if (maxDiaReport > 0) {
      diaActual = maxDiaReport;
    }

    if (totalDiasOT === 1) tipoDia = 'UNICO';
    else if (diaActual === 1) tipoDia = 'INICIO';
    else if (diaActual === totalDiasOT) tipoDia = 'TERMINO';
    else tipoDia = 'INTERMEDIO';

    // Reporte del día
    const repHoy = histReports.find(r => {
      if (!r.fecha_reporte) return false;
      const dStr = new Date(r.fecha_reporte).toISOString().split('T')[0];
      return dStr === fechaConsulta || r.dia_correlativo === diaActual;
    }) || null;

    console.log('--- RESULTADO CORREGIDO PARA CASO 014 ---');
    console.log('OT:', p.codi_proyecto);
    console.log('Cliente:', p.cliente_nombre);
    console.log('Equipo:', equipoNombre);
    console.log('Operador:', operadorNombre, '| Tel:', operadorTelefono);
    console.log('Día Actual:', diaActual, 'de', totalDiasOT, `(${tipoDia})`);
    console.log('Reports consumidos:', reportsConsumidos, 'de', totalDiasOT);
    console.log('Candado activo (Concluido):', candadoActivo);
    console.log('Reporte Hoy:', repHoy ? `ID #${repHoy.id_reporte_avance} (Día ${repHoy.dia_correlativo})` : 'NO');
    if (repHoy) {
      console.log('  Hora Inicio:', getHoraStrFromDate(repHoy.fecha_inicio_servicio));
      console.log('  Hora Término:', getHoraStrFromDate(repHoy.fecha_termino_servicio));
      console.log('  Estado Reporte:', repHoy.estado_reporte);
    }
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

testCase014();
