const pool = require('../src/config/postgresPool');

async function testResolution() {
  try {
    // 1. Usuarios
    const uRes = await pool.query('SELECT id_user, name_frst, apellido_pat, movil, email FROM sch_leangsp.tsec_users');
    const userMap = new Map();
    uRes.rows.forEach(u => {
      const nombre = [u.name_frst, u.apellido_pat].filter(Boolean).join(' ').trim() || u.email;
      userMap.set(Number(u.id_user), { nombre, telefono: u.movil || '' });
    });

    // 2. Equipos
    const eqRes = await pool.query('SELECT id_equipo, patente, modelo, marca, tipo_equipo FROM sch_leangsp.tequ_equipo');
    const eqMap = new Map();
    eqRes.rows.forEach(e => {
      eqMap.set(Number(e.id_equipo), e);
    });

    // 3. Proyecto 103
    const pRes = await pool.query('SELECT * FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = 103');
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
      const cargo = (t.cargo || t.rol || '').toUpperCase();
      return cargo.includes('OPERADOR') || cargo.includes('CHOFER') || cargo.includes('GRUA');
    });
    const idOp = opTrip?.id_user || ejec.operador_id || firstEq?.operador_asignado_id;
    if (idOp && userMap.has(Number(idOp))) {
      const u = userMap.get(Number(idOp));
      operadorNombre = u.nombre;
      operadorTelefono = u.telefono;
    }

    console.log('EQUIPO RESUELTO:', equipoNombre);
    console.log('OPERADOR RESUELTO:', operadorNombre, '| TELÉFONO:', operadorTelefono);

    // 4. Reportes sin el filtro destructivo
    const repSql = `
      SELECT id_reporte_avance, dia_correlativo, fecha_reporte, estado_reporte,
             fecha_inicio_servicio, fecha_termino_servicio, token_report
      FROM sch_leangsp.tedp_reporte_avance
      WHERE id_proyecto = 103
        AND (token_report IS NULL OR token_report NOT LIKE 'FLT-%')
      ORDER BY dia_correlativo ASC;
    `;
    const rRes = await pool.query(repSql);
    console.log('TOTAL REPORTES REALES ENCONTRADOS:', rRes.rows.length);
    console.table(rRes.rows);

  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

testResolution();
