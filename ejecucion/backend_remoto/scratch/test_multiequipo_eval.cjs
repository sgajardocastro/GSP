const pool = require('../src/config/postgresPool');

const PRI_SEMAFORO = {
  rojo: 7,
  amarillo: 6,
  sinplan: 5,
  negro: 4,
  azul: 3,
  verde: 2,
  terminado: 1
};

function parseHoraMinutos(horaStr) {
  if (!horaStr || typeof horaStr !== 'string') return 480;
  const parts = horaStr.split(':');
  return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
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

async function testMultiEquipoEval() {
  try {
    const fechaConsulta = '2026-10-03';
    const nowMinutos = 16 * 60; // 16:00
    const esHoy = true;
    const fechaHoyChile = '2026-10-03';

    // Catálogos
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

    // Proyectos
    const pRes = await pool.query(`
      SELECT p.id_proyecto, p.codi_proyecto, p.nombre_proyecto, p.fecha_plan_ini, p.fecha_plan_fin, p.json_field,
             (SELECT json_agg(re.*) FROM sch_leangsp.tpry_rel_equipo re WHERE re.id_proyecto = p.id_proyecto) as rel_equipos
      FROM sch_leangsp.tpry_proyecto p
      WHERE p.id_proyecto IN (103, 98)
    `);

    for (const p of pRes.rows) {
      const jf = p.json_field || {};
      const ejec = jf.ejecucion_v1 || {};
      const crm = jf.crm_v1 || {};
      const lines = crm.lineas_servicio || jf.lineas_servicio || [];
      const relEquipos = p.rel_equipos || [];

      // Días hábiles
      const fSalidaPlan = ejec.fecha_salida_plan || (p.fecha_plan_ini ? p.fecha_plan_ini.toISOString().split('T')[0] : null);
      const hSalidaPlan = ejec.hora_salida_plan || '08:00';
      const fFinPlan = ejec.fecha_fin_plan || (p.fecha_plan_fin ? p.fecha_plan_fin.toISOString().split('T')[0] : null);
      const hFinPlan = ejec.hora_fin_plan || '18:00';
      const hLlegadaPlan = ejec.hora_llegada_plan || '09:30';

      let diasHabilesLista = [];
      if (Array.isArray(ejec.plan_diario) && ejec.plan_diario.length > 0) {
        diasHabilesLista = ejec.plan_diario.map(pd => pd.fecha);
      } else if (fSalidaPlan && fFinPlan) {
        diasHabilesLista = getListaDiasHabiles(fSalidaPlan, fFinPlan);
      }

      // Historial reportes de la OT (todos)
      const hRes = await pool.query(`
        SELECT id_reporte_avance, id_equipo, dia_correlativo, fecha_reporte, estado_reporte, estado_jornada,
               fecha_inicio_servicio, fecha_termino_servicio, fecha_registro, device_timestamp,
               fecha_transmision_termino
        FROM sch_leangsp.tedp_reporte_avance
        WHERE id_proyecto = $1
          AND (token_report IS NULL OR token_report NOT LIKE 'FLT-%')
        ORDER BY dia_correlativo ASC;
      `, [p.id_proyecto]);
      const allHistReports = hRes.rows;

      // Descubrir equipos asignados
      const eqList = [];
      const seen = new Set();

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

      if (eqList.length === 0) {
        eqList.push({
          id_equipo: 0,
          patente: 'S/P',
          modelo: '',
          tipo_equipo: 'Sin equipo asignado',
          rol_equipo: 'Equipo Principal',
          operador: 'Sin operador asignado',
          telefono_operador: ''
        });
      }

      // Evaluar cada equipo
      const equiposEvaluados = [];

      for (const eq of eqList) {
        const eqHistReports = allHistReports.filter(r => !eq.id_equipo || Number(r.id_equipo) === eq.id_equipo || (allHistReports.length > 0 && eqList.length === 1));
        const reportsConsumidos = eqHistReports.filter(r => r.estado_reporte !== 'JORNADA_EN_CURSO').length;
        const maxDiaReport = eqHistReports.reduce((max, r) => Math.max(max, Number(r.dia_correlativo || 0)), 0);
        let totalDiasOT = Math.max(1, diasHabilesLista.length, maxDiaReport);
        const candadoActivo = reportsConsumidos >= totalDiasOT;

        let diaActual = 1;
        let tipoDia = 'INICIO';
        if (diasHabilesLista.length > 0) {
          const idx = diasHabilesLista.indexOf(fechaConsulta);
          if (idx >= 0) diaActual = idx + 1;
          else diaActual = fechaConsulta < diasHabilesLista[0] ? 1 : totalDiasOT;
        } else if (maxDiaReport > 0) {
          diaActual = maxDiaReport;
        }

        if (totalDiasOT === 1) tipoDia = 'UNICO';
        else if (diaActual === 1) tipoDia = 'INICIO';
        else if (diaActual === totalDiasOT) tipoDia = 'TERMINO';
        else tipoDia = 'INTERMEDIO';

        // Viaje del equipo
        const vRes = await pool.query(`
          SELECT * FROM sch_leangsp.tequ_log_desplazamiento
          WHERE id_proyecto = $1 AND (id_equipo = $2 OR $2 = 0 OR $2 IS NULL)
            AND (fecha_salida_patio::date = $3 OR fecha_programada::date = $3 OR fecha_registro::date = $3)
          ORDER BY id_log_desplazamiento DESC LIMIT 1;
        `, [p.id_proyecto, eq.id_equipo, fechaConsulta]);
        const viajeHoy = vRes.rows[0] || null;

        // Inspección patio del equipo
        const ptRes = await pool.query(`
          SELECT * FROM sch_leangsp.tsrv_survey
          WHERE ((id_proyecto = $1 AND id_equipo = $2) OR (id_equipo = $2 AND $2 > 0))
            AND (fecha_real_ini::date = $3 OR fecha_plan_ini::date = $3 OR created::date = $3)
            AND id_template IN (76, 79)
          ORDER BY id_survey DESC LIMIT 1;
        `, [p.id_proyecto, eq.id_equipo, fechaConsulta]);
        const patioHoy = ptRes.rows[0] || null;

        // Reporte de hoy del equipo
        const reportHoy = eqHistReports.find(r => {
          if (!r.fecha_reporte) return false;
          const dStr = new Date(r.fecha_reporte).toISOString().split('T')[0];
          return dStr === fechaConsulta || Number(r.dia_correlativo) === Number(diaActual);
        }) || null;

        const evalActividad = (clave, nombre, planHoraStr, realHoraStr, ejecutado) => {
          const planMins = parseHoraMinutos(planHoraStr);
          let realMins = realHoraStr ? parseHoraMinutos(realHoraStr) : null;
          let estado = 'azul';
          let desvioMins = 0;

          if (!fSalidaPlan) {
            estado = 'sinplan';
          } else if (candadoActivo && clave === 'VIAJE_RETORNO' && !ejecutado) {
            estado = 'azul';
            desvioMins = 0;
          } else if (ejecutado && realMins !== null) {
            if (realMins <= planMins) {
              estado = 'verde';
              desvioMins = 0;
            } else {
              estado = 'negro';
              desvioMins = realMins - planMins;
            }
          } else {
            if (esHoy) {
              if (nowMinutos >= planMins) {
                estado = 'rojo';
                desvioMins = nowMinutos - planMins;
              } else if (planMins - nowMinutos < 60) {
                estado = 'amarillo';
                desvioMins = planMins - nowMinutos;
              } else {
                estado = 'azul';
                desvioMins = planMins - nowMinutos;
              }
            } else if (fechaConsulta < fechaHoyChile) {
              estado = 'rojo';
              desvioMins = 999;
            } else {
              estado = 'azul';
              desvioMins = 0;
            }
          }

          return {
            clave,
            nombre,
            hora_plan: planHoraStr,
            hora_real: realHoraStr || null,
            ejecutado: !!ejecutado,
            estado,
            desvio_minutos: desvioMins
          };
        };

        const actividades = [];
        if (tipoDia === 'INICIO' || tipoDia === 'UNICO') {
          const inspPlan = '07:30';
          const inspReal = patioHoy ? (getHoraStrFromDate(patioHoy.fecha_real_ini) || getHoraStrFromDate(patioHoy.created)) : null;
          const inspOk = patioHoy && ['COMPLETADO', 'FINALIZADO', 'EJECUTADO', 'APROBADO', 'VALIDADO'].includes(String(patioHoy.estado_srv).toUpperCase());
          actividades.push(evalActividad('INSPECCION_PATIO', 'Inspección de patio', inspPlan, inspReal, inspOk));

          const salReal = viajeHoy ? (getHoraStrFromDate(viajeHoy.device_timestamp_salida) || getHoraStrFromDate(viajeHoy.fecha_salida_patio)) : null;
          const salOk = viajeHoy && (viajeHoy.estado_trayecto === 'EN_RUTA' || viajeHoy.estado_trayecto === 'ARRIBADO' || !!viajeHoy.fecha_salida_patio);
          actividades.push(evalActividad('SALIDA_BASE', 'Salida patio (inicio viaje)', hSalidaPlan, salReal, salOk));

          const llegReal = viajeHoy ? (getHoraStrFromDate(viajeHoy.device_timestamp_llegada) || getHoraStrFromDate(viajeHoy.fecha_llegada_faena)) : null;
          const llegOk = viajeHoy && (viajeHoy.estado_trayecto === 'ARRIBADO' || !!viajeHoy.fecha_llegada_faena);
          actividades.push(evalActividad('LLEGADA_FAENA', 'Llegada faena (fin viaje)', hLlegadaPlan, llegReal, llegOk));
        }

        const repIniPlan = tipoDia === 'INICIO' ? '10:00' : '08:00';
        const repIniOk = reportHoy && (reportHoy.estado_jornada === 'JORNADA_EN_CURSO' || reportHoy.estado_jornada === 'FINALIZADA' || ['VALIDADO_ANALISTA', 'EMITIDO_SELLADO', 'CERRADO', 'REPORT_FIRMADO'].includes(reportHoy.estado_reporte));
        const repIniReal = repIniOk ? (getHoraStrFromDate(reportHoy.fecha_inicio_servicio) || getHoraStrFromDate(reportHoy.device_timestamp) || getHoraStrFromDate(reportHoy.fecha_registro)) : null;
        actividades.push(evalActividad('REPORT_INICIO', 'Report inicio jornada', repIniPlan, repIniReal, repIniOk));

        const repFinPlan = hFinPlan;
        const repFinOk = reportHoy && (reportHoy.estado_jornada === 'FINALIZADA' || ['VALIDADO_ANALISTA', 'EMITIDO_SELLADO', 'CERRADO', 'REPORT_FIRMADO'].includes(reportHoy.estado_reporte));
        const repFinReal = repFinOk ? (getHoraStrFromDate(reportHoy.fecha_termino_servicio) || getHoraStrFromDate(reportHoy.fecha_transmision_termino) || getHoraStrFromDate(reportHoy.device_timestamp) || getHoraStrFromDate(reportHoy.fecha_registro)) : null;
        actividades.push(evalActividad('REPORT_TERMINO', 'Report término jornada', repFinPlan, repFinReal, repFinOk));

        if (tipoDia === 'TERMINO' || tipoDia === 'UNICO') {
          const retPlan = '18:30';
          const retReal = viajeHoy && viajeHoy.tipo_trayecto === 'RETORNO' ? (getHoraStrFromDate(viajeHoy.fecha_salida_patio) || null) : null;
          actividades.push(evalActividad('VIAJE_RETORNO', 'Viaje retorno a base', retPlan, retReal, !!retReal));
        }

        let estadoEquipo = 'verde';
        if (candadoActivo) estadoEquipo = 'terminado';
        else if (!fSalidaPlan) estadoEquipo = 'sinplan';
        else {
          estadoEquipo = actividades.reduce((peor, act) => PRI_SEMAFORO[act.estado] > PRI_SEMAFORO[peor] ? act.estado : peor, 'verde');
        }

        equiposEvaluados.push({
          ...eq,
          nombre_completo: `${eq.tipo_equipo} · ${eq.patente} (${eq.modelo})`,
          dia_actual: diaActual,
          dias_totales: totalDiasOT,
          tipo_dia: tipoDia,
          reports_consumidos: reportsConsumidos,
          candado_activo: candadoActivo,
          estado_equipo: estadoEquipo,
          actividades
        });
      }

      // Estado global de la OT (peor de sus equipos)
      const estadoGlobal = equiposEvaluados.reduce((peor, eq) => {
        return PRI_SEMAFORO[eq.estado_equipo] > PRI_SEMAFORO[peor] ? eq.estado_equipo : peor;
      }, 'verde');

      const todosConcluidos = equiposEvaluados.every(e => e.candado_activo);

      console.log(`\nOT ${p.codi_proyecto} EVALUADA:`);
      console.log(`  Estado Global (Rollup): ${estadoGlobal}`);
      console.log(`  Todos Concluidos: ${todosConcluidos}`);
      console.log(`  Equipos (${equiposEvaluados.length}):`);
      equiposEvaluados.forEach(e => {
        console.log(`    - ${e.nombre_completo}: Estado=${e.estado_equipo}, Reports=${e.reports_consumidos}/${e.dias_totales}, Op=${e.operador}`);
      });
    }

  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

testMultiEquipoEval();
