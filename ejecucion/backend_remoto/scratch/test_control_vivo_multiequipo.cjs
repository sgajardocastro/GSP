const pool = require('../src/config/postgresPool');

// Copiamos la lógica exacta para certificarla contra la base de datos DEV
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

async function testFull() {
  try {
    const fechaConsulta = '2026-10-03';
    const nowMinutos = 16 * 60;
    const esHoy = true;
    const fechaHoyChile = '2026-10-03';

    const proySql = `
      SELECT 
        p.id_proyecto,
        p.codi_proyecto,
        p.nombre_proyecto,
        p.id_proyecto_estado,
        p.fecha_plan_ini,
        p.fecha_plan_fin,
        p.json_field,
        COALESCE(clt.razon_social, clt.name_empresa, p.json_field->>'cliente_nombre', 'Cliente Mandante') AS cliente_nombre,
        COALESCE(p.json_field->>'obra_nombre', p.json_field->'crm_v1'->>'obra_nombre', p.json_field->'ejecucion_v1'->'cliente'->>'obra', p.nombre_proyecto) AS obra_nombre
      FROM sch_leangsp.tpry_proyecto p
      LEFT JOIN sch_leangsp.tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
      WHERE p.id_proyecto_estado IN (4, 5, 6)
        AND (
          $1 BETWEEN COALESCE(p.fecha_plan_ini::date, NULLIF(p.json_field->'ejecucion_v1'->>'fecha_salida_plan', '')::date, CURRENT_DATE - interval '14 days')
                 AND COALESCE(p.fecha_plan_fin::date, NULLIF(p.json_field->'ejecucion_v1'->>'fecha_fin_plan', '')::date, CURRENT_DATE + interval '30 days')
          OR EXISTS (
            SELECT 1 FROM sch_leangsp.tedp_reporte_avance r WHERE r.id_proyecto = p.id_proyecto AND r.fecha_reporte::date = $1
          )
        )
      ORDER BY p.id_proyecto DESC;
    `;
    const proyRes = await pool.query(proySql, [fechaConsulta]);

    const pIds = proyRes.rows.map(p => p.id_proyecto);
    const [uRes, eqRes, relRes] = await Promise.all([
      pool.query('SELECT id_user, name_frst, apellido_pat, movil, email FROM sch_leangsp.tsec_users'),
      pool.query('SELECT id_equipo, patente, modelo, marca, tipo_equipo FROM sch_leangsp.tequ_equipo'),
      pIds.length > 0
        ? pool.query('SELECT id_proyecto, id_equipo, rol_equipo FROM sch_leangsp.tpry_rel_equipo WHERE id_proyecto = ANY($1)', [pIds])
        : { rows: [] }
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

    const relEqMap = new Map();
    relRes.rows.forEach(re => {
      const pid = Number(re.id_proyecto);
      if (!relEqMap.has(pid)) relEqMap.set(pid, []);
      relEqMap.get(pid).push(re);
    });

    const servicios = [];
    const kpis = { total_ots: 0, rojo: 0, amarillo: 0, sinplan: 0, negro: 0, azul: 0, verde: 0, terminado: 0 };

    for (const p of proyRes.rows) {
      const jf = p.json_field || {};
      const ejec = jf.ejecucion_v1 || {};
      const crm = jf.crm_v1 || {};
      const lines = crm.lineas_servicio || jf.lineas_servicio || [];
      const relEquipos = relEqMap.get(Number(p.id_proyecto)) || [];

      // Descubrir equipos asignados a la OT
      const eqList = [];
      const seenEq = new Set();

      lines.forEach(l => {
        const idEq = Number(l.equipo_asignado_id || l.id_equipo);
        if (idEq && !seenEq.has(idEq)) {
          seenEq.add(idEq);
          const eqObj = eqMap.get(idEq);
          const opId = Number(l.operador_asignado_id);
          const uObj = opId && userMap.get(opId);
          eqList.push({
            id_equipo: idEq,
            patente: eqObj?.patente || l.patente || 'S/P',
            modelo: eqObj?.modelo || l.modelo || '',
            tipo_equipo: eqObj?.tipo_equipo || l.tipo || 'EQUIPO',
            rol_equipo: l.subcategoria || l.tipo || 'Equipo Asignado',
            operador: uObj?.nombre || '',
            telefono_operador: uObj?.telefono || ''
          });
        }
      });

      relEquipos.forEach(re => {
        const idEq = Number(re.id_equipo);
        if (idEq && !seenEq.has(idEq)) {
          seenEq.add(idEq);
          const eqObj = eqMap.get(idEq);
          eqList.push({
            id_equipo: idEq,
            patente: eqObj?.patente || 'S/P',
            modelo: eqObj?.modelo || '',
            tipo_equipo: eqObj?.tipo_equipo || 'EQUIPO',
            rol_equipo: re.rol_equipo || 'Equipo Asignado',
            operador: '',
            telefono_operador: ''
          });
        }
      });

      const trip = Array.isArray(ejec.tripulacion_asignada) ? ejec.tripulacion_asignada : [];
      const opTrip = trip.find(t => {
        const c = (t.cargo || t.rol || '').toUpperCase();
        return c.includes('OPERADOR') || c.includes('CHOFER') || c.includes('GRUA');
      });
      const idOpDef = opTrip?.id_user || ejec.operador_id;
      const uDef = idOpDef && userMap.get(Number(idOpDef));

      eqList.forEach((eq, idx) => {
        if (!eq.operador) {
          if (idx === 0 && uDef) {
            eq.operador = uDef.nombre;
            eq.telefono_operador = uDef.telefono;
          } else if (idx === 0 && opTrip?.nombre) {
            eq.operador = opTrip.nombre;
            eq.telefono_operador = opTrip.telefono || '';
          } else {
            eq.operador = 'Sin operador asignado';
            eq.telefono_operador = '';
          }
        }
      });

      if (eqList.length === 0) {
        eqList.push({
          id_equipo: 0,
          patente: 'S/P',
          modelo: '',
          tipo_equipo: ejec.equipo_principal || 'Sin equipo asignado',
          rol_equipo: 'Equipo Principal',
          operador: uDef?.nombre || 'Sin operador asignado',
          telefono_operador: uDef?.telefono || ''
        });
      }

      // Planificación temporal
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

      // Historial completo de reports de la OT (sin flete)
      const histSql = `
        SELECT id_reporte_avance, id_equipo, dia_correlativo, fecha_reporte, estado_reporte, estado_jornada,
               fecha_inicio_servicio, fecha_termino_servicio, fecha_registro, device_timestamp,
               fecha_transmision_termino
        FROM sch_leangsp.tedp_reporte_avance
        WHERE id_proyecto = $1
          AND (token_report IS NULL OR token_report NOT LIKE 'FLT-%')
        ORDER BY dia_correlativo ASC;
      `;
      const hRes = await pool.query(histSql, [p.id_proyecto]);
      const histReports = hRes.rows;

      const equiposEvaluados = [];

      for (const eq of eqList) {
        const eqHistReports = histReports.filter(r => !eq.id_equipo || Number(r.id_equipo) === eq.id_equipo || (histReports.length > 0 && eqList.length === 1));
        const reportsConsumidosEq = eqHistReports.filter(r => r.estado_reporte !== 'JORNADA_EN_CURSO').length;
        const maxDiaReportEq = eqHistReports.reduce((max, r) => Math.max(max, Number(r.dia_correlativo || 0)), 0);

        let totalDiasOTEq = Math.max(1, diasHabilesLista.length, maxDiaReportEq);
        if (diasHabilesLista.length === 0) {
          for (const l of lines) {
            const d = Number(l.cantidad_dias || l.dias || 0);
            if (d > totalDiasOTEq) totalDiasOTEq = d;
          }
        }

        const candadoActivoEq = reportsConsumidosEq >= totalDiasOTEq;

        let diaActualEq = 1;
        let tipoDiaEq = 'INICIO';
        if (diasHabilesLista.length > 0) {
          const idx = diasHabilesLista.indexOf(fechaConsulta);
          if (idx >= 0) {
            diaActualEq = idx + 1;
          } else {
            diaActualEq = fechaConsulta < diasHabilesLista[0] ? 1 : totalDiasOTEq;
          }
        } else if (maxDiaReportEq > 0) {
          diaActualEq = maxDiaReportEq;
        }

        if (totalDiasOTEq === 1) tipoDiaEq = 'UNICO';
        else if (diaActualEq === 1) tipoDiaEq = 'INICIO';
        else if (diaActualEq === totalDiasOTEq) tipoDiaEq = 'TERMINO';
        else tipoDiaEq = 'INTERMEDIO';

        const viajeSql = `
          SELECT * FROM sch_leangsp.tequ_log_desplazamiento
          WHERE id_proyecto = $1 AND (id_equipo = $2 OR $2 = 0 OR id_equipo IS NULL)
            AND (fecha_salida_patio::date = $3 OR fecha_programada::date = $3 OR fecha_registro::date = $3)
          ORDER BY id_log_desplazamiento DESC LIMIT 1;
        `;
        const vRes = await pool.query(viajeSql, [p.id_proyecto, eq.id_equipo, fechaConsulta]);
        const viajeHoy = vRes.rows[0] || null;

        const patioSql = `
          SELECT * FROM sch_leangsp.tsrv_survey
          WHERE ((id_proyecto = $1 AND (id_equipo = $2 OR $2 = 0)) OR (id_equipo = $2 AND $2 > 0))
            AND (fecha_real_ini::date = $3 OR fecha_plan_ini::date = $3 OR created::date = $3)
            AND id_template IN (76, 79)
          ORDER BY id_survey DESC LIMIT 1;
        `;
        const ptRes = await pool.query(patioSql, [p.id_proyecto, eq.id_equipo, fechaConsulta]);
        const patioHoy = ptRes.rows[0] || null;

        const reportHoy = eqHistReports.find(r => {
          if (!r.fecha_reporte) return false;
          const dStr = new Date(r.fecha_reporte).toISOString().split('T')[0];
          return dStr === fechaConsulta || Number(r.dia_correlativo) === Number(diaActualEq);
        }) || null;

        const esEquipoFaena = ['GRUAS', 'GRUA', 'PLUMA', 'PLATAFORMA', 'ALZAHOMBRE', 'MANLIFT', 'ELEVADORA'].some(kw => 
          (eq.tipo_equipo || '').toUpperCase().includes(kw) || (eq.rol_equipo || '').toUpperCase().includes(kw)
        );

        const evalActividad = (clave, nombre, planHoraStr, realHoraStr, ejecutado) => {
          const planMins = parseHoraMinutos(planHoraStr);
          let realMins = realHoraStr ? parseHoraMinutos(realHoraStr) : null;
          let estado = 'azul';
          let desvioMins = 0;

          if (!fSalidaPlan) {
            estado = 'sinplan';
          } else if (candadoActivoEq && clave === 'VIAJE_RETORNO' && !ejecutado) {
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
        if (tipoDiaEq === 'INICIO' || tipoDiaEq === 'UNICO') {
          const inspPlan = ejec.preparacion_salida?.inspecciones_patio?.[eq.id_equipo]?.hora_inspeccion_plan || '07:30';
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

        if (esEquipoFaena) {
          const diaPlanObj = Array.isArray(ejec.plan_diario) ? ejec.plan_diario.find(d => d.fecha === fechaConsulta) : null;
          const repIniPlan = diaPlanObj?.hora_inicio_jornada || (tipoDiaEq === 'INICIO' ? '10:00' : '08:00');
          const repIniOk = reportHoy && (reportHoy.estado_jornada === 'JORNADA_EN_CURSO' || reportHoy.estado_jornada === 'FINALIZADA' || ['VALIDADO_ANALISTA', 'EMITIDO_SELLADO', 'CERRADO', 'REPORT_FIRMADO'].includes(reportHoy.estado_reporte));
          const repIniReal = repIniOk ? (getHoraStrFromDate(reportHoy.fecha_inicio_servicio) || getHoraStrFromDate(reportHoy.device_timestamp) || getHoraStrFromDate(reportHoy.fecha_registro)) : null;
          actividades.push(evalActividad('REPORT_INICIO', 'Report inicio jornada', repIniPlan, repIniReal, repIniOk));

          const repFinPlan = diaPlanObj?.hora_termino_jornada || hFinPlan;
          const repFinOk = reportHoy && (reportHoy.estado_jornada === 'FINALIZADA' || ['VALIDADO_ANALISTA', 'EMITIDO_SELLADO', 'CERRADO', 'REPORT_FIRMADO'].includes(reportHoy.estado_reporte));
          const repFinReal = repFinOk ? (getHoraStrFromDate(reportHoy.fecha_termino_servicio) || getHoraStrFromDate(reportHoy.fecha_transmision_termino) || getHoraStrFromDate(reportHoy.device_timestamp) || getHoraStrFromDate(reportHoy.fecha_registro)) : null;
          actividades.push(evalActividad('REPORT_TERMINO', 'Report término jornada', repFinPlan, repFinReal, repFinOk));
        }

        if (tipoDiaEq === 'TERMINO' || tipoDiaEq === 'UNICO') {
          const retPlan = '18:30';
          const retReal = viajeHoy && viajeHoy.tipo_trayecto === 'RETORNO' ? (getHoraStrFromDate(viajeHoy.fecha_salida_patio) || null) : null;
          const retOk = !!retReal;
          actividades.push(evalActividad('VIAJE_RETORNO', 'Viaje retorno a base', retPlan, retReal, retOk));
        }

        let estadoEquipo = 'verde';
        if (candadoActivoEq) {
          estadoEquipo = 'terminado';
        } else if (!fSalidaPlan) {
          estadoEquipo = 'sinplan';
        } else {
          estadoEquipo = actividades.reduce((peor, act) => {
            return PRI_SEMAFORO[act.estado] > PRI_SEMAFORO[peor] ? act.estado : peor;
          }, 'verde');
        }

        const franjaMultidiaEq = [];
        const cantDiasMostrar = Math.max(totalDiasOTEq, diasHabilesLista.length);
        for (let i = 0; i < cantDiasMostrar; i++) {
          const diaNum = i + 1;
          const fechaDia = diasHabilesLista[i] || `Día ${diaNum}`;
          const esDiaHoy = fechaDia === fechaConsulta || diaNum === diaActualEq;
          let stDia = 'futuro';
          let tieneRep = false;

          const rPrev = eqHistReports.find(hr => {
            const fStr = hr.fecha_reporte ? new Date(hr.fecha_reporte).toISOString().split('T')[0] : '';
            return fStr === fechaDia || Number(hr.dia_correlativo) === diaNum;
          });

          if (rPrev && rPrev.estado_reporte !== 'JORNADA_EN_CURSO') {
            stDia = 'verde';
            tieneRep = true;
          } else if (esDiaHoy) {
            stDia = estadoEquipo;
            tieneRep = !!reportHoy;
          } else if (fechaDia < fechaConsulta) {
            stDia = 'rojo';
          }

          franjaMultidiaEq.push({
            dia: diaNum,
            fecha: fechaDia,
            estado: stDia,
            es_hoy: esDiaHoy,
            tiene_report: tieneRep,
            es_fin: i === cantDiasMostrar - 1
          });
        }

        equiposEvaluados.push({
          id_equipo: eq.id_equipo,
          patente: eq.patente,
          modelo: eq.modelo,
          tipo_equipo: eq.tipo_equipo,
          rol_equipo: eq.rol_equipo,
          nombre_completo: eq.id_equipo > 0 ? `${eq.tipo_equipo} · ${eq.patente} (${eq.modelo})` : eq.tipo_equipo,
          operador: eq.operador,
          telefono_operador: eq.telefono_operador,
          es_equipo_faena: esEquipoFaena,
          dia_actual: diaActualEq,
          dias_totales: totalDiasOTEq,
          tipo_dia: tipoDiaEq,
          reports_consumidos: reportsConsumidosEq,
          candado_activo: candadoActivoEq,
          estado_equipo: estadoEquipo,
          franja_multidia: franjaMultidiaEq,
          actividades
        });
      }

      const eqPrincipal = equiposEvaluados[0];

      let estadoGlobal = equiposEvaluados.reduce((peor, eq) => {
        return PRI_SEMAFORO[eq.estado_equipo] > PRI_SEMAFORO[peor] ? eq.estado_equipo : peor;
      }, 'verde');

      const todosConcluidos = equiposEvaluados.every(eq => eq.candado_activo);
      if (todosConcluidos) estadoGlobal = 'terminado';

      kpis[estadoGlobal] = (kpis[estadoGlobal] || 0) + 1;
      kpis.total_ots++;

      servicios.push({
        id_proyecto: p.id_proyecto,
        codigo_ot: p.codi_proyecto || `OT-${p.id_proyecto}`,
        id_negocio: jf.id_negocio || `NEG-${p.id_proyecto}`,
        cliente: p.cliente_nombre,
        obra: p.obra_nombre,
        equipo_principal: eqPrincipal.nombre_completo,
        operador: eqPrincipal.operador,
        telefono_operador: eqPrincipal.telefono_operador,
        dia_actual: eqPrincipal.dia_actual,
        dias_totales: eqPrincipal.dias_totales,
        tipo_dia: eqPrincipal.tipo_dia,
        reports_consumidos: eqPrincipal.reports_consumidos,
        estado_global: estadoGlobal,
        candado_activo: todosConcluidos,
        sin_plan: !fSalidaPlan,
        franja_multidia: eqPrincipal.franja_multidia,
        actividades: eqPrincipal.actividades,
        equipos: equiposEvaluados
      });
    }

    console.log("TEST COMPLETED. Total OTs:", servicios.length);
    console.log("KPIs:", kpis);
    servicios.forEach(s => {
      console.log(`OT: ${s.codigo_ot} (${s.id_proyecto}) | Estado: ${s.estado_global} | Equipos: ${s.equipos.length}`);
      s.equipos.forEach(e => {
        console.log(`  - ${e.nombre_completo} [${e.estado_equipo}] Op: ${e.operador}`);
      });
    });

  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

testFull();
