const pool = require('../src/config/postgresPool');

async function testMultiEquipo() {
  try {
    const fechaConsulta = '2026-10-03';

    // 1. Precarga catálogos
    const [uRes, eqRes] = await Promise.all([
      pool.query('SELECT id_user, name_frst, apellido_pat, movil, email FROM sch_leangsp.tsec_users'),
      pool.query('SELECT id_equipo, patente, modelo, marca, tipo_equipo FROM sch_leangsp.tequ_equipo')
    ]);

    const userMap = new Map();
    uRes.rows.forEach(u => {
      const nombre = [u.name_frst, u.apellido_pat].filter(Boolean).join(' ').trim() || u.email;
      userMap.set(Number(u.id_user), { nombre, telefono: u.movil || '' });
    });

    const eqMap = new Map();
    eqRes.rows.forEach(e => {
      eqMap.set(Number(e.id_equipo), e);
    });

    // 2. Proyectos de prueba
    const pRes = await pool.query(`
      SELECT p.id_proyecto, p.codi_proyecto, p.json_field,
             (SELECT json_agg(re.*) FROM sch_leangsp.tpry_rel_equipo re WHERE re.id_proyecto = p.id_proyecto) as rel_equipos
      FROM sch_leangsp.tpry_proyecto p
      WHERE p.id_proyecto IN (98, 103, 99, 95)
      ORDER BY p.id_proyecto DESC
    `);

    for (const p of pRes.rows) {
      console.log(`\n=================== OT ${p.codi_proyecto} (ID ${p.id_proyecto}) ===================`);
      const jf = p.json_field || {};
      const ejec = jf.ejecucion_v1 || {};
      const crm = jf.crm_v1 || {};
      const lines = crm.lineas_servicio || jf.lineas_servicio || [];
      const relEquipos = p.rel_equipos || [];

      // Mapear equipos
      const eqList = [];
      const seen = new Set();

      // De lineas_servicio
      lines.forEach(l => {
        const idEq = Number(l.equipo_asignado_id || l.id_equipo);
        if (idEq && !seen.has(idEq)) {
          seen.add(idEq);
          const eqObj = eqMap.get(idEq);
          const opId = Number(l.operador_asignado_id);
          const uObj = opId && userMap.get(opId);
          eqList.push({
            id_equipo: idEq,
            patente: eqObj?.patente || l.patente || 'S/P',
            modelo: eqObj?.modelo || l.modelo || '',
            tipo_equipo: eqObj?.tipo_equipo || l.tipo || 'EQUIPO',
            rol_equipo: l.subcategoria || l.tipo || 'Equipo Asignado',
            operador: uObj?.nombre || 'Sin operador asignado',
            telefono_operador: uObj?.telefono || ''
          });
        }
      });

      // De tpry_rel_equipo
      relEquipos.forEach(re => {
        const idEq = Number(re.id_equipo);
        if (idEq && !seen.has(idEq)) {
          seen.add(idEq);
          const eqObj = eqMap.get(idEq);
          eqList.push({
            id_equipo: idEq,
            patente: eqObj?.patente || 'S/P',
            modelo: eqObj?.modelo || '',
            tipo_equipo: eqObj?.tipo_equipo || 'EQUIPO',
            rol_equipo: re.rol_equipo || 'Equipo Asignado',
            operador: 'Sin operador asignado',
            telefono_operador: ''
          });
        }
      });

      // Si aún no hay equipos pero hay equipo_principal
      if (eqList.length === 0 && ejec.equipo_principal) {
        eqList.push({
          id_equipo: 0,
          patente: 'S/P',
          modelo: '',
          tipo_equipo: 'EQUIPO',
          rol_equipo: 'Equipo Principal',
          operador: 'Sin operador asignado',
          telefono_operador: ''
        });
      }

      console.log(`Equipos detectados (${eqList.length}):`);
      eqList.forEach((eq, idx) => {
        console.log(`  [${idx + 1}] ID ${eq.id_equipo}: ${eq.tipo_equipo} · ${eq.patente} (${eq.modelo}) | Rol: ${eq.rol_equipo} | Op: ${eq.operador} (${eq.telefono_operador})`);
      });
    }

  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

testMultiEquipo();
