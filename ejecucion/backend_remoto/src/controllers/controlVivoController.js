const pool = require('../config/postgresPool');
const { config } = require('../config/config');
const SCHEMA = config.dbSchema || 'sch_leangsp';

// --- UTILIDADES DE TIEMPO (Zona Horaria America/Santiago UTC-3) ---
function getChileTime() {
  const s = new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' });
  return new Date(s);
}

function parseHoraMinutos(horaStr) {
  if (!horaStr || typeof horaStr !== 'string') return 480; // default 08:00
  const parts = horaStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

function formatMinutosHora(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
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

// Calcular lista de días hábiles entre dos fechas (excluye Sábados y Domingos)
function getListaDiasHabiles(fechaIniStr, fechaFinStr) {
  const lista = [];
  if (!fechaIniStr || !fechaFinStr) return lista;
  const dIni = new Date(String(fechaIniStr).split('T')[0] + 'T00:00:00');
  const dFin = new Date(String(fechaFinStr).split('T')[0] + 'T00:00:00');
  if (isNaN(dIni.getTime()) || isNaN(dFin.getTime()) || dFin < dIni) return lista;

  let curr = new Date(dIni);
  while (curr <= dFin) {
    const day = curr.getDay();
    if (day !== 0 && day !== 6) { // 0=Dom, 6=Sab
      lista.push(curr.toISOString().split('T')[0]);
    }
    curr.setDate(curr.getDate() + 1);
  }
  return lista;
}

// REQ-991: SLA Día Hábil Siguiente 13:00 hrs para cierre de ITS
function calcularSlaDiaHabilSiguiente13hrs(fechaTerminoStr, nowChile) {
  if (!fechaTerminoStr) return { vencido: false, esHoyVence: false, fechaLimite: null };
  const dTerm = new Date(String(fechaTerminoStr).split('T')[0] + 'T00:00:00');
  if (isNaN(dTerm.getTime())) return { vencido: false, esHoyVence: false, fechaLimite: null };

  // Encontrar el siguiente día hábil posterior a la fecha de término
  let dSiguiente = new Date(dTerm);
  dSiguiente.setDate(dSiguiente.getDate() + 1);
  while (dSiguiente.getDay() === 0 || dSiguiente.getDay() === 6) { // 0=Dom, 6=Sab
    dSiguiente.setDate(dSiguiente.getDate() + 1);
  }

  const sSiguiente = dSiguiente.toISOString().split('T')[0];
  const sHoy = nowChile.toISOString().split('T')[0];
  const minsChile = nowChile.getHours() * 60 + nowChile.getMinutes();
  const limite13hrs = 13 * 60; // 13:00 hrs CLT = 780 min

  if (sHoy > sSiguiente) {
    return { vencido: true, esHoyVence: false, fechaLimite: sSiguiente };
  } else if (sHoy === sSiguiente) {
    if (minsChile >= limite13hrs) {
      return { vencido: true, esHoyVence: true, fechaLimite: sSiguiente };
    } else {
      return { vencido: false, esHoyVence: true, fechaLimite: sSiguiente };
    }
  } else {
    return { vencido: false, esHoyVence: false, fechaLimite: sSiguiente };
  }
}

const PRI_SEMAFORO = {
  rojo: 7,
  amarillo: 6,
  sinplan: 5,
  negro: 4,
  azul: 3,
  verde: 2,
  terminado: 1
};

const controlVivoController = {
  // 1. Monitor Consolidado del Día (Spec 63 / REQ-042)
  async getControlVivo(req, res) {
    try {
      const nowChile = getChileTime();
      const fechaHoyChile = nowChile.toISOString().split('T')[0];
      const horaActualStr = String(nowChile.getHours()).padStart(2, '0') + ':' + String(nowChile.getMinutes()).padStart(2, '0');
      const nowMinutos = nowChile.getHours() * 60 + nowChile.getMinutes();

      const fechaConsulta = req.query.fecha || fechaHoyChile;
      const esHoy = fechaConsulta === fechaHoyChile;

      // 1.1 Consultar OTs activas relevantes para la fecha
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
        FROM ${SCHEMA}.tpry_proyecto p
        LEFT JOIN ${SCHEMA}.tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
        WHERE p.id_proyecto_estado IN (4, 5, 6)
          AND (
            $1 BETWEEN COALESCE(p.fecha_plan_ini::date, NULLIF(p.json_field->'ejecucion_v1'->>'fecha_salida_plan', '')::date, CURRENT_DATE - interval '14 days')
                   AND COALESCE(p.fecha_plan_fin::date, NULLIF(p.json_field->'ejecucion_v1'->>'fecha_fin_plan', '')::date, CURRENT_DATE + interval '30 days')
            OR EXISTS (
              SELECT 1 FROM ${SCHEMA}.tedp_reporte_avance r WHERE r.id_proyecto = p.id_proyecto AND r.fecha_reporte::date = $1
            )
          )
        ORDER BY p.id_proyecto DESC;
      `;
      const proyRes = await pool.query(proySql, [fechaConsulta]);

      // Precargar catálogos de usuarios, equipos y asignaciones tpry_rel_equipo
      const pIds = proyRes.rows.map(p => p.id_proyecto);
      const [uRes, eqRes, relRes, itsRes, edpRes] = await Promise.all([
        pool.query(`SELECT id_user, name_frst, apellido_pat, movil, email FROM ${SCHEMA}.tsec_users`),
        pool.query(`SELECT id_equipo, patente, modelo, marca, tipo_equipo FROM ${SCHEMA}.tequ_equipo`),
        pIds.length > 0
          ? pool.query(`SELECT id_proyecto, id_equipo, rol_equipo FROM ${SCHEMA}.tpry_rel_equipo WHERE id_proyecto = ANY($1)`, [pIds])
          : { rows: [] },
        pIds.length > 0
          ? pool.query(`SELECT id_proyecto, id_its, folio_its, estado_its, fecha_creacion, fecha_elaborado, total_ingresos_facturables FROM ${SCHEMA}.tits_informe_termino WHERE id_proyecto = ANY($1)`, [pIds])
          : { rows: [] },
        pIds.length > 0
          ? pool.query(`SELECT id_proyecto, id_edp, numero_edp, estado_edp, monto_total, folio_factura_erp, fecha_facturacion_erp FROM ${SCHEMA}.tedp_estado_pago WHERE id_proyecto = ANY($1)`, [pIds])
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

      const itsMap = new Map();
      itsRes.rows.forEach(it => {
        itsMap.set(Number(it.id_proyecto), it);
      });

      const edpMap = new Map();
      edpRes.rows.forEach(ed => {
        edpMap.set(Number(ed.id_proyecto), ed);
      });

      const servicios = [];
      const kpis = { 
        total_ots: 0, rojo: 0, amarillo: 0, sinplan: 0, negro: 0, azul: 0, verde: 0, terminado: 0,
        pipeline: { its_listos: 0, its_sla_retraso: 0, edp_listos: 0, oc_listas: 0, facturas_listas: 0 }
      };
      const alertasInWebNuevas = [];

      for (const p of proyRes.rows) {
        const jf = p.json_field || {};
        const ejec = jf.ejecucion_v1 || {};
        const crm = jf.crm_v1 || {};
        const lines = crm.lineas_servicio || jf.lineas_servicio || [];
        const relEquipos = relEqMap.get(Number(p.id_proyecto)) || [];

        // Descubrir todos los equipos asignados a la OT
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

        // Operador por defecto de la OT si alguno quedó sin operador
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

        // Historial completo de reports de la OT (sin fletes puros)
        const histSql = `
          SELECT id_reporte_avance, id_equipo, dia_correlativo, fecha_reporte, estado_reporte, estado_jornada,
                 fecha_inicio_servicio, fecha_termino_servicio, fecha_registro, device_timestamp,
                 fecha_transmision_termino
          FROM ${SCHEMA}.tedp_reporte_avance
          WHERE id_proyecto = $1
            AND (token_report IS NULL OR token_report NOT LIKE 'FLT-%')
          ORDER BY dia_correlativo ASC;
        `;
        const hRes = await pool.query(histSql, [p.id_proyecto]);
        const histReports = hRes.rows;

        // Evaluar cada equipo individualmente
        const equiposEvaluados = [];

        for (const eq of eqList) {
          // Filtrar reportes del equipo (si hay más de 1 equipo se discrimina por id_equipo)
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

          // Viaje del equipo
          const viajeSql = `
            SELECT * FROM ${SCHEMA}.tequ_log_desplazamiento
            WHERE id_proyecto = $1 AND (id_equipo = $2 OR $2 = 0 OR id_equipo IS NULL)
              AND (fecha_salida_patio::date = $3 OR fecha_programada::date = $3 OR fecha_registro::date = $3)
            ORDER BY id_log_desplazamiento DESC LIMIT 1;
          `;
          const vRes = await pool.query(viajeSql, [p.id_proyecto, eq.id_equipo, fechaConsulta]);
          const viajeHoy = vRes.rows[0] || null;

          // Inspección patio del equipo
          const patioSql = `
            SELECT * FROM ${SCHEMA}.tsrv_survey
            WHERE ((id_proyecto = $1 AND (id_equipo = $2 OR $2 = 0)) OR (id_equipo = $2 AND $2 > 0))
              AND (fecha_real_ini::date = $3 OR fecha_plan_ini::date = $3 OR created::date = $3)
              AND id_template IN (76, 79)
            ORDER BY id_survey DESC LIMIT 1;
          `;
          const ptRes = await pool.query(patioSql, [p.id_proyecto, eq.id_equipo, fechaConsulta]);
          const patioHoy = ptRes.rows[0] || null;

          // Reporte de faena del día para este equipo
          const reportHoy = eqHistReports.find(r => {
            if (!r.fecha_reporte) return false;
            const dStr = new Date(r.fecha_reporte).toISOString().split('T')[0];
            return dStr === fechaConsulta || Number(r.dia_correlativo) === Number(diaActualEq);
          }) || null;

          const esEquipoFaena = ['GRUAS', 'GRUA', 'PLUMA', 'PLATAFORMA', 'ALZAHOMBRE', 'MANLIFT', 'ELEVADORA'].some(kw => 
            (eq.tipo_equipo || '').toUpperCase().includes(kw) || (eq.rol_equipo || '').toUpperCase().includes(kw)
          );

          const getOverrideHito = (clave) => {
            const byEq = p.json_field?.control_vivo_overrides?.[fechaConsulta]?.[String(eq.id_equipo)]?.[clave]
                      || p.json_field?.control_vivo_overrides?.[fechaConsulta]?.[eq.id_equipo]?.[clave]
                      || p.json_field?.control_vivo_overrides?.[fechaConsulta]?.['TODOS']?.[clave];
            return byEq || null;
          };

          // Helper de evaluación de actividad para el equipo (con soporte de override administrativo)
          const evalActividadEq = (clave, nombre, planHoraStr, realHoraStr, ejecutado) => {
            const ovr = getOverrideHito(clave);
            let esOverride = false;
            let modificadoPor = null;
            if (ovr && ovr.hora_real) {
              realHoraStr = ovr.hora_real;
              ejecutado = true;
              esOverride = true;
              modificadoPor = ovr.modificado_por || 'YIARA';
            }

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
              desvio_minutos: desvioMins,
              override: esOverride,
              modificado_por: modificadoPor
            };
          };

          const actividadesEq = [];
          if (tipoDiaEq === 'INICIO' || tipoDiaEq === 'UNICO') {
            const inspPlan = ejec.preparacion_salida?.inspecciones_patio?.[eq.id_equipo]?.hora_inspeccion_plan || '07:30';
            const inspReal = patioHoy ? (getHoraStrFromDate(patioHoy.fecha_real_ini) || getHoraStrFromDate(patioHoy.created)) : null;
            const inspOk = patioHoy && ['COMPLETADO', 'FINALIZADO', 'EJECUTADO', 'APROBADO', 'VALIDADO'].includes(String(patioHoy.estado_srv).toUpperCase());
            actividadesEq.push(evalActividadEq('INSPECCION_PATIO', 'Inspección de patio', inspPlan, inspReal, inspOk));

            const salReal = viajeHoy ? (getHoraStrFromDate(viajeHoy.device_timestamp_salida) || getHoraStrFromDate(viajeHoy.fecha_salida_patio)) : null;
            const salOk = viajeHoy && (viajeHoy.estado_trayecto === 'EN_RUTA' || viajeHoy.estado_trayecto === 'ARRIBADO' || !!viajeHoy.fecha_salida_patio);
            actividadesEq.push(evalActividadEq('SALIDA_BASE', 'Salida patio (inicio viaje)', hSalidaPlan, salReal, salOk));

            const llegReal = viajeHoy ? (getHoraStrFromDate(viajeHoy.device_timestamp_llegada) || getHoraStrFromDate(viajeHoy.fecha_llegada_faena)) : null;
            const llegOk = viajeHoy && (viajeHoy.estado_trayecto === 'ARRIBADO' || !!viajeHoy.fecha_llegada_faena);
            actividadesEq.push(evalActividadEq('LLEGADA_FAENA', 'Llegada faena (fin viaje)', hLlegadaPlan, llegReal, llegOk));
          }

          if (esEquipoFaena) {
            const diaPlanObj = Array.isArray(ejec.plan_diario) ? ejec.plan_diario.find(d => d.fecha === fechaConsulta) : null;
            const repIniPlan = diaPlanObj?.hora_inicio_jornada || (tipoDiaEq === 'INICIO' ? '10:00' : '08:00');
            const repIniOk = reportHoy && (reportHoy.estado_jornada === 'JORNADA_EN_CURSO' || reportHoy.estado_jornada === 'FINALIZADA' || ['VALIDADO_ANALISTA', 'EMITIDO_SELLADO', 'CERRADO', 'REPORT_FIRMADO'].includes(reportHoy.estado_reporte));
            const repIniReal = repIniOk ? (getHoraStrFromDate(reportHoy.fecha_inicio_servicio) || getHoraStrFromDate(reportHoy.device_timestamp) || getHoraStrFromDate(reportHoy.fecha_registro)) : null;
            actividadesEq.push(evalActividadEq('REPORT_INICIO', 'Report inicio jornada', repIniPlan, repIniReal, repIniOk));

            const repFinPlan = diaPlanObj?.hora_termino_jornada || hFinPlan;
            const repFinOk = reportHoy && (reportHoy.estado_jornada === 'FINALIZADA' || ['VALIDADO_ANALISTA', 'EMITIDO_SELLADO', 'CERRADO', 'REPORT_FIRMADO'].includes(reportHoy.estado_reporte));
            const repFinReal = repFinOk ? (getHoraStrFromDate(reportHoy.fecha_termino_servicio) || getHoraStrFromDate(reportHoy.fecha_transmision_termino) || getHoraStrFromDate(reportHoy.device_timestamp) || getHoraStrFromDate(reportHoy.fecha_registro)) : null;
            actividadesEq.push(evalActividadEq('REPORT_TERMINO', 'Report término jornada', repFinPlan, repFinReal, repFinOk));
          }

          if (tipoDiaEq === 'TERMINO' || tipoDiaEq === 'UNICO') {
            const retPlan = '18:30';
            const retReal = viajeHoy && viajeHoy.tipo_trayecto === 'RETORNO' ? (getHoraStrFromDate(viajeHoy.fecha_salida_patio) || null) : null;
            const retOk = !!retReal;
            actividadesEq.push(evalActividadEq('VIAJE_RETORNO', 'Viaje retorno a base', retPlan, retReal, retOk));
          }

          let estadoEquipo = 'verde';
          if (candadoActivoEq) {
            estadoEquipo = 'terminado';
          } else if (!fSalidaPlan) {
            estadoEquipo = 'sinplan';
          } else {
            estadoEquipo = actividadesEq.reduce((peor, act) => {
              return PRI_SEMAFORO[act.estado] > PRI_SEMAFORO[peor] ? act.estado : peor;
            }, 'verde');
          }

          // Franja multi-día del equipo
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
            actividades: actividadesEq
          });
        }

        const eqPrincipal = equiposEvaluados[0];

        // Estado global de la OT: peor estado entre sus equipos (Rollup Opción B)
        let estadoGlobal = equiposEvaluados.reduce((peor, eq) => {
          return PRI_SEMAFORO[eq.estado_equipo] > PRI_SEMAFORO[peor] ? eq.estado_equipo : peor;
        }, 'verde');

        const todosConcluidos = equiposEvaluados.every(eq => eq.candado_activo);
        const candadoActivoOT = todosConcluidos;
        if (candadoActivoOT) estadoGlobal = 'terminado';

        // Registrar alertas in-web si hay eventos críticos en algún equipo de la OT
        if (esHoy && !candadoActivoOT) {
          for (const eq of equiposEvaluados) {
            for (const a of eq.actividades) {
              if (a.estado === 'rojo') {
                alertasInWebNuevas.push({
                  id_proyecto: p.id_proyecto,
                  codigo_ot: p.codi_proyecto,
                  evento_tipo: 'VENCIDO',
                  hito_clave: a.clave,
                  fecha_operativa: fechaHoyChile,
                  mensaje: `${p.codi_proyecto} (${eq.patente}): ${a.nombre} VENCIDO (planificado ${a.hora_plan} hrs).`,
                  severidad: 'ALTA'
                });
              } else if (a.estado === 'amarillo') {
                alertasInWebNuevas.push({
                  id_proyecto: p.id_proyecto,
                  codigo_ot: p.codi_proyecto,
                  evento_tipo: 'POR_VENCER',
                  hito_clave: a.clave,
                  fecha_operativa: fechaHoyChile,
                  mensaje: `${p.codi_proyecto} (${eq.patente}): ${a.nombre} vence a las ${a.hora_plan} hrs.`,
                  severidad: 'MEDIA'
                });
              }
            }
          }
        }
        if (esHoy && candadoActivoOT) {
          alertasInWebNuevas.push({
            id_proyecto: p.id_proyecto,
            codigo_ot: p.codi_proyecto,
            evento_tipo: 'CANDADO',
            hito_clave: 'CANDADO_ACTIVO',
            fecha_operativa: fechaHoyChile,
            mensaje: `${p.codi_proyecto}: Candado operacional activo (${eqPrincipal.reports_consumidos}/${eqPrincipal.dias_totales} reports completados).`,
            severidad: 'BAJA'
          });
        }

        // --- REQ-991: EVALUACIÓN DETERMINISTA DE PIPELINE DOCUMENTAL & SLA 13:00 HRS ---
        const rawIts = itsMap.get(Number(p.id_proyecto));
        const rawEdp = edpMap.get(Number(p.id_proyecto));

        // 1. ITS (Informe de Término de Servicio)
        let itsDoc = { estado: 'pendiente', etiqueta: 'Pendiente', folio: null, id_its: null, alerta_sla: null };
        if (rawIts && ['CONCLUIDO', 'EMITIDO', 'FIRMADO_FES', 'APROBADO'].includes(String(rawIts.estado_its || '').toUpperCase())) {
          itsDoc = {
            estado: 'listo',
            etiqueta: 'Listo',
            folio: rawIts.folio_its || `ITS-${rawIts.id_its}`,
            id_its: rawIts.id_its,
            fecha: rawIts.fecha_elaborado || rawIts.fecha_creacion,
            alerta_sla: null
          };
          kpis.pipeline.its_listos++;
        } else if (rawIts) {
          itsDoc = {
            estado: 'en_curso',
            etiqueta: 'En Borrador',
            folio: rawIts.folio_its || `ITS-${rawIts.id_its}`,
            id_its: rawIts.id_its,
            alerta_sla: null
          };
        } else {
          // Si no hay ITS aún: evaluar si ya terminó el servicio y aplica SLA 13:00 hrs
          const fechaUltimoReport = histReports.length > 0 ? histReports[histReports.length - 1].fecha_reporte : null;
          const fechaTerminoRef = candadoActivoOT ? (fechaUltimoReport || fFinPlan || fechaHoyChile) : (fFinPlan && fFinPlan < fechaHoyChile ? fFinPlan : null);

          if (fechaTerminoRef) {
            const slaRes = calcularSlaDiaHabilSiguiente13hrs(fechaTerminoRef, nowChile);
            if (slaRes.vencido) {
              itsDoc = {
                estado: 'rojo_sla',
                etiqueta: 'Retraso SLA 13:00',
                alerta_sla: 'Retraso SLA 13:00 hrs',
                fecha_limite: slaRes.fechaLimite
              };
              kpis.pipeline.its_sla_retraso++;
              if (esHoy) {
                alertasInWebNuevas.push({
                  id_proyecto: p.id_proyecto,
                  codigo_ot: p.codi_proyecto,
                  evento_tipo: 'SLA_ITS_VENCIDO',
                  hito_clave: 'ITS_SLA_13HRS',
                  fecha_operativa: fechaHoyChile,
                  mensaje: `${p.codi_proyecto}: Informe de Término (ITS) con retraso crítico de SLA (debía emitirse a las 13:00 hrs).`,
                  severidad: 'ALTA'
                });
              }
            } else if (slaRes.esHoyVence) {
              itsDoc = {
                estado: 'por_vencer',
                etiqueta: 'Vence 13:00',
                alerta_sla: 'Vence hoy a las 13:00 hrs',
                fecha_limite: slaRes.fechaLimite
              };
            }
          }
        }

        // 2. EDP (Estado de Pago)
        let edpDoc = { estado: 'pendiente', etiqueta: 'Pendiente', numero: null, id_edp: null, monto: 0 };
        if (rawEdp && ['APROBADO', 'FACTURADO', 'CONCLUIDO'].includes(String(rawEdp.estado_edp || '').toUpperCase())) {
          edpDoc = {
            estado: 'listo',
            etiqueta: 'Listo',
            numero: rawEdp.numero_edp || `EDP-${rawEdp.id_edp}`,
            id_edp: rawEdp.id_edp,
            monto: rawEdp.monto_total
          };
          kpis.pipeline.edp_listos++;
        } else if (rawEdp) {
          edpDoc = {
            estado: 'en_curso',
            etiqueta: 'En Curso',
            numero: rawEdp.numero_edp || `EDP-${rawEdp.id_edp}`,
            id_edp: rawEdp.id_edp,
            monto: rawEdp.monto_total
          };
        } else if (itsDoc.estado === 'listo') {
          edpDoc = { estado: 'en_curso', etiqueta: 'Por Emitir', numero: null, id_edp: null, monto: 0 };
        }

        // 3. OC / HES (Orden de Compra)
        const numOC = jf.crm_v1?.opportunity?.orden_compra || jf.orden_compra || jf.crm_v1?.orden_compra || jf.crm_v1?.oc_numero || jf.ejecucion_v1?.orden_compra;
        let ocDoc = { estado: 'pendiente', etiqueta: 'Pendiente', numero: null };
        if (numOC && String(numOC).trim().length > 0) {
          ocDoc = { estado: 'listo', etiqueta: 'Listo', numero: String(numOC).trim() };
          kpis.pipeline.oc_listas++;
        } else if (candadoActivoOT || itsDoc.estado === 'listo') {
          ocDoc = { estado: 'en_curso', etiqueta: 'En Gestión', numero: null };
        }

        // 4. FACTURA
        const numFactura = rawEdp?.folio_factura_erp || (rawEdp?.estado_edp === 'FACTURADO' ? 'Facturado' : null) || jf.facturacion?.numero_factura;
        let facDoc = { estado: 'pendiente', etiqueta: 'Pendiente', numero: null, fecha: null };
        if (numFactura && String(numFactura).trim().length > 0) {
          facDoc = { estado: 'listo', etiqueta: 'Listo', numero: String(numFactura).trim(), fecha: rawEdp?.fecha_facturacion_erp || null };
          kpis.pipeline.facturas_listas++;
        } else if (edpDoc.estado === 'listo') {
          facDoc = { estado: 'en_curso', etiqueta: 'Por Facturar', numero: null, fecha: null };
        }

        const pipelineDocumental = {
          its: itsDoc,
          edp: edpDoc,
          oc: ocDoc,
          factura: facDoc,
          alerta_sla: itsDoc.alerta_sla
        };

        // Acumular KPI
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
          candado_activo: candadoActivoOT,
          sin_plan: !fSalidaPlan,
          franja_multidia: eqPrincipal.franja_multidia,
          actividades: eqPrincipal.actividades,
          documental: pipelineDocumental,
          equipos: equiposEvaluados
        });
      }

      // Ordenar servicios por gravedad de excepción
      servicios.sort((a, b) => PRI_SEMAFORO[b.estado_global] - PRI_SEMAFORO[a.estado_global]);

      // Insertar alertas in-web deduplicadas (fire-and-forget seguro)
      if (alertasInWebNuevas.length > 0) {
        (async () => {
          for (const al of alertasInWebNuevas) {
            try {
              const checkSql = `
                SELECT id_notificacion FROM ${SCHEMA}.tnot_notification_web
                WHERE id_proyecto = $1 AND hito_clave = $2 AND fecha_operativa = $3 AND evento_tipo = $4
                LIMIT 1;
              `;
              const exists = await pool.query(checkSql, [al.id_proyecto, al.hito_clave, al.fecha_operativa, al.evento_tipo]);
              if (exists.rows.length === 0) {
                await pool.query(`
                  INSERT INTO ${SCHEMA}.tnot_notification_web (
                    id_proyecto, codigo_ot, evento_tipo, hito_clave, fecha_operativa, mensaje, severidad
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7);
                `, [al.id_proyecto, al.codigo_ot, al.evento_tipo, al.hito_clave, al.fecha_operativa, al.mensaje, al.severidad]);
              }
            } catch (errAl) {
              console.warn('[Alerta In-Web] Error registrando alerta:', errAl.message);
            }
          }
        })();
      }

      res.json({
        success: true,
        fecha: fechaConsulta,
        hora_actual: horaActualStr,
        ventana_activa: nowMinutos >= 420 && nowMinutos <= 1200, // 07:00 a 20:00
        kpis,
        servicios
      });
    } catch (err) {
      console.error('[Control Vivo] Error consolidando vista en vivo:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 2. Obtener Notificaciones In-Web del Día
  async getNotificacionesWeb(req, res) {
    try {
      const nowChile = getChileTime();
      const fechaHoyChile = nowChile.toISOString().split('T')[0];
      const fechaConsulta = req.query.fecha || fechaHoyChile;

      const sql = `
        SELECT 
          id_notificacion,
          id_proyecto,
          codigo_ot,
          evento_tipo,
          hito_clave,
          fecha_operativa,
          mensaje,
          severidad,
          creado_en,
          leido_por
        FROM ${SCHEMA}.tnot_notification_web
        WHERE fecha_operativa = $1
        ORDER BY 
          CASE severidad WHEN 'ALTA' THEN 1 WHEN 'MEDIA' THEN 2 ELSE 3 END ASC,
          id_notificacion DESC
        LIMIT 100;
      `;
      const result = await pool.query(sql, [fechaConsulta]);
      res.json({ success: true, data: result.rows });
    } catch (err) {
      console.error('[Notificaciones Web] Error listando:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 3. Marcar notificación como leída
  async marcarNotificacionLeida(req, res) {
    try {
      const { id } = req.params;
      const { leido_por } = req.body || {};
      const usuario = leido_por || req.user?.email || 'USUARIO';

      await pool.query(`
        UPDATE ${SCHEMA}.tnot_notification_web
        SET leido_por = $1
        WHERE id_notificacion = $2;
      `, [usuario, id]);

      res.json({ success: true, message: 'Notificación marcada como leída' });
    } catch (err) {
      console.error('[Notificaciones Web] Error marcando leída:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 4. Marcar todas las notificaciones del día como leídas
  async marcarTodasLeidas(req, res) {
    try {
      const { fecha, leido_por } = req.body || {};
      const nowChile = getChileTime();
      const fechaOperativa = fecha || nowChile.toISOString().split('T')[0];
      const usuario = leido_por || req.user?.email || 'USUARIO';

      await pool.query(`
        UPDATE ${SCHEMA}.tnot_notification_web
        SET leido_por = $1
        WHERE fecha_operativa = $2 AND leido_por IS NULL;
      `, [usuario, fechaOperativa]);

      res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
    } catch (err) {
      console.error('[Notificaciones Web] Error marcando todas leídas:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 5. REQ-997 / Caso 2: Carga manual y corrección rápida de horas de hitos por Control de Gestión (Yiara / Adm)
  async overrideHitoActividad(req, res) {
    try {
      const { id_proyecto, id_equipo, fecha, clave_actividad, hora_real, motivo } = req.body || {};
      if (!id_proyecto || !clave_actividad || !hora_real) {
        return res.status(400).json({ success: false, message: 'Faltan parámetros requeridos: id_proyecto, clave_actividad, hora_real' });
      }

      const nowChile = getChileTime();
      const fechaOperativa = fecha || nowChile.toISOString().split('T')[0];
      const modificadoPor = req.user?.name_frst ? `${req.user.name_frst} ${req.user.apellido_pat || ''}`.trim() : (req.user?.email || 'YIARA (Control Gestión)');
      const eqIdKey = id_equipo ? String(id_equipo) : 'TODOS';

      // 1. Obtener y actualizar json_field en tpry_proyecto
      const proyRes = await pool.query(`SELECT json_field FROM ${SCHEMA}.tpry_proyecto WHERE id_proyecto = $1`, [id_proyecto]);
      if (proyRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
      }

      let jsonField = proyRes.rows[0].json_field || {};
      if (typeof jsonField === 'string') {
        try { jsonField = JSON.parse(jsonField); } catch (e) { jsonField = {}; }
      }

      if (!jsonField.control_vivo_overrides) jsonField.control_vivo_overrides = {};
      if (!jsonField.control_vivo_overrides[fechaOperativa]) jsonField.control_vivo_overrides[fechaOperativa] = {};
      if (!jsonField.control_vivo_overrides[fechaOperativa][eqIdKey]) jsonField.control_vivo_overrides[fechaOperativa][eqIdKey] = {};

      jsonField.control_vivo_overrides[fechaOperativa][eqIdKey][clave_actividad] = {
        hora_real,
        modificado_por: modificadoPor,
        fecha_registro: nowChile.toISOString(),
        motivo: motivo || 'Ajuste manual de Torre de Control'
      };

      await pool.query(`UPDATE ${SCHEMA}.tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2`, [JSON.stringify(jsonField), id_proyecto]);

      // 2. Sincronización colateral no destructiva en tablas operativas para que aguas abajo (Conta, RRHH, ITS, EDP) tengan el dato
      const tsHito = `${fechaOperativa} ${hora_real}:00`;
      const eqIdNum = parseInt(id_equipo, 10) || 0;

      if (clave_actividad === 'SALIDA_BASE') {
        const vExist = await pool.query(
          `SELECT id_log_desplazamiento FROM ${SCHEMA}.tequ_log_desplazamiento 
           WHERE id_proyecto = $1 AND (id_equipo = $2 OR $2 = 0 OR id_equipo IS NULL) 
             AND (fecha_salida_patio::date = $3 OR fecha_programada::date = $3 OR fecha_registro::date = $3)
           LIMIT 1`,
          [id_proyecto, eqIdNum, fechaOperativa]
        ).catch(() => ({ rows: [] }));

        if (vExist.rows.length > 0) {
          await pool.query(
            `UPDATE ${SCHEMA}.tequ_log_desplazamiento 
             SET fecha_salida_patio = $1,
                 device_timestamp_salida = COALESCE(device_timestamp_salida, $1::timestamptz),
                 estado_trayecto = COALESCE(estado_trayecto, 'EN_RUTA')
             WHERE id_log_desplazamiento = $2`,
            [tsHito, vExist.rows[0].id_log_desplazamiento]
          ).catch(() => {});
        } else {
          await pool.query(
            `INSERT INTO ${SCHEMA}.tequ_log_desplazamiento (
               id_proyecto, id_equipo, fecha_salida_patio, fecha_programada, estado_trayecto, token_viaje, fecha_registro
             ) VALUES ($1, $2, $3, $4, 'EN_RUTA', $5, CURRENT_TIMESTAMP)`,
            [id_proyecto, eqIdNum || null, tsHito, fechaOperativa, `vj-${id_proyecto}-${eqIdNum || 1}-${Date.now().toString().slice(-4)}`]
          ).catch(() => {});
        }
      } else if (clave_actividad === 'LLEGADA_FAENA') {
        const vExist = await pool.query(
          `SELECT id_log_desplazamiento FROM ${SCHEMA}.tequ_log_desplazamiento 
           WHERE id_proyecto = $1 AND (id_equipo = $2 OR $2 = 0 OR id_equipo IS NULL) 
             AND (fecha_salida_patio::date = $3 OR fecha_programada::date = $3 OR fecha_registro::date = $3)
           LIMIT 1`,
          [id_proyecto, eqIdNum, fechaOperativa]
        ).catch(() => ({ rows: [] }));

        if (vExist.rows.length > 0) {
          await pool.query(
            `UPDATE ${SCHEMA}.tequ_log_desplazamiento 
             SET fecha_llegada_faena = $1,
                 device_timestamp_llegada = COALESCE(device_timestamp_llegada, $1::timestamptz),
                 estado_trayecto = 'ARRIBADO'
             WHERE id_log_desplazamiento = $2`,
            [tsHito, vExist.rows[0].id_log_desplazamiento]
          ).catch(() => {});
        } else {
          await pool.query(
            `INSERT INTO ${SCHEMA}.tequ_log_desplazamiento (
               id_proyecto, id_equipo, fecha_llegada_faena, fecha_programada, estado_trayecto, token_viaje, fecha_registro
             ) VALUES ($1, $2, $3, $4, 'ARRIBADO', $5, CURRENT_TIMESTAMP)`,
            [id_proyecto, eqIdNum || null, tsHito, fechaOperativa, `vj-${id_proyecto}-${eqIdNum || 1}-${Date.now().toString().slice(-4)}`]
          ).catch(() => {});
        }
      } else if (clave_actividad === 'REPORT_INICIO' || clave_actividad === 'REPORT_TERMINO') {
        // UPSERT determinista en tedp_reporte_avance
        const rExist = await pool.query(
          `SELECT id_reporte_avance, dia_correlativo, fecha_inicio_servicio, fecha_termino_servicio, 
                  horas_minimas, horas_colacion, ajustes_analista, id_doc_pdf, estado_reporte, estado_jornada
           FROM ${SCHEMA}.tedp_reporte_avance
           WHERE id_proyecto = $1 
             AND (fecha_reporte = $2 OR fecha_inicio_servicio::date = $2 OR fecha_registro::date = $2)
             AND (id_equipo = $3 OR $3 = 0 OR id_equipo IS NULL)
           ORDER BY id_reporte_avance DESC LIMIT 1`,
          [id_proyecto, fechaOperativa, eqIdNum]
        ).catch(() => ({ rows: [] }));

        if (rExist.rows.length > 0) {
          const row = rExist.rows[0];
          let newInicio = clave_actividad === 'REPORT_INICIO' ? tsHito : (row.fecha_inicio_servicio ? new Date(row.fecha_inicio_servicio).toISOString() : `${fechaOperativa} 08:00:00`);
          let newTermino = clave_actividad === 'REPORT_TERMINO' ? tsHito : (row.fecha_termino_servicio ? new Date(row.fecha_termino_servicio).toISOString() : null);

          let horasOperadas = 0;
          let horasFacturables = parseFloat(row.horas_minimas || 8.0);
          let horasSobretiempo = 0;
          let estadoJornada = row.estado_jornada || 'JORNADA_EN_CURSO';

          if (newInicio && newTermino) {
            const diffMin = Math.max(0, (new Date(newTermino) - new Date(newInicio)) / (1000 * 60));
            const colacMin = parseFloat(row.horas_colacion || 1.0) * 60;
            horasOperadas = Math.max(0, parseFloat(((diffMin - colacMin) / 60).toFixed(2)));
            horasFacturables = Math.max(horasOperadas, parseFloat(row.horas_minimas || 8.0));
            horasSobretiempo = Math.max(0, parseFloat((horasOperadas - parseFloat(row.horas_minimas || 8.0)).toFixed(2)));
            estadoJornada = 'CONCLUIDO';
          }

          const nuevosAjustes = {
            ...(row.ajustes_analista || {}),
            origen: 'TORRE_CONTROL',
            regularizado_manual: true,
            requiere_evidencia_fisica: !row.id_doc_pdf,
            ultimo_override: {
              clave_actividad,
              hora_real,
              modificado_por: modificadoPor,
              fecha: nowChile.toISOString()
            }
          };

          await pool.query(
            `UPDATE ${SCHEMA}.tedp_reporte_avance SET
               fecha_inicio_servicio = $1,
               fecha_termino_servicio = $2,
               horas_operadas = $3,
               horas_facturables = $4,
               horas_sobretiempo = $5,
               estado_jornada = $6,
               ajustes_analista = $7
             WHERE id_reporte_avance = $8`,
            [
              newInicio,
              newTermino,
              horasOperadas,
              horasFacturables,
              horasSobretiempo,
              estadoJornada,
              JSON.stringify(nuevosAjustes),
              row.id_reporte_avance
            ]
          ).catch(errUp => console.warn('[Override Hito] Error actualizando reporte existente:', errUp.message));
        } else {
          // INSERT de nuevo reporte regularizado
          let finalEqId = eqIdNum;
          if (!finalEqId) {
            const relEq = await pool.query(`SELECT id_equipo FROM ${SCHEMA}.tpry_rel_equipo WHERE id_proyecto = $1 LIMIT 1`, [id_proyecto]).catch(() => ({ rows: [] }));
            finalEqId = relEq.rows[0]?.id_equipo || 35;
          }

          const relUser = await pool.query(
            `SELECT u.id_user FROM ${SCHEMA}.tpry_rel_persona rp 
             JOIN ${SCHEMA}.tsec_users u ON rp.id_user = u.id_user 
             WHERE rp.id_proyecto = $1 
               AND (UPPER(rp.rol_asignado) LIKE '%OPERADOR%' OR UPPER(rp.rol_asignado) LIKE '%CHOFER%')
             LIMIT 1`,
            [id_proyecto]
          ).catch(() => ({ rows: [] }));
          const finalOpId = relUser.rows[0]?.id_user || 53;

          const dRes = await pool.query(`SELECT COALESCE(MAX(dia_correlativo), 0) + 1 AS next_dia FROM ${SCHEMA}.tedp_reporte_avance WHERE id_proyecto = $1`, [id_proyecto]).catch(() => ({ rows: [{ next_dia: 1 }] }));
          const diaCorr = parseInt(dRes.rows[0]?.next_dia || 1, 10);

          let newInicio = clave_actividad === 'REPORT_INICIO' ? tsHito : `${fechaOperativa} 08:00:00`;
          let newTermino = clave_actividad === 'REPORT_TERMINO' ? tsHito : null;

          let horasOperadas = 0;
          let horasFacturables = 8.0;
          let horasSobretiempo = 0;
          let estadoJornada = 'JORNADA_EN_CURSO';

          if (clave_actividad === 'REPORT_TERMINO') {
            const diffMin = Math.max(0, (new Date(newTermino) - new Date(newInicio)) / (1000 * 60));
            horasOperadas = Math.max(0, parseFloat(((diffMin - 60) / 60).toFixed(2)));
            horasFacturables = Math.max(horasOperadas, 8.0);
            horasSobretiempo = Math.max(0, parseFloat((horasOperadas - 8.0).toFixed(2)));
            estadoJornada = 'CONCLUIDO';
          }

          const tokenReport = `REG-${id_proyecto}-D${diaCorr}-${Date.now().toString().slice(-4)}`;
          const ajustesJson = {
            origen: 'TORRE_CONTROL',
            regularizado_manual: true,
            requiere_evidencia_fisica: true,
            modificado_por: modificadoPor,
            fecha_regularizacion: nowChile.toISOString(),
            motivo: motivo || 'Carga manual de horas desde Torre de Control'
          };

          await pool.query(
            `INSERT INTO ${SCHEMA}.tedp_reporte_avance (
               id_proyecto,
               id_equipo,
               id_user_operador,
               dia_correlativo,
               fecha_reporte,
               unidad_cobro,
               fecha_inicio_servicio,
               fecha_termino_servicio,
               horas_operadas,
               horas_facturables,
               horas_sobretiempo,
               horas_colacion,
               horas_minimas,
               token_report,
               estado_reporte,
               estado_jornada,
               ajustes_analista,
               fecha_registro
             ) VALUES (
               $1, $2, $3, $4, $5, 'HRS_DIA', $6, $7, $8, $9, $10, 1.0, 8.0, $11, 'REGULARIZADO_MANUAL', $12, $13, CURRENT_TIMESTAMP
             )`,
            [
              id_proyecto,
              finalEqId,
              finalOpId,
              diaCorr,
              fechaOperativa,
              newInicio,
              newTermino,
              horasOperadas,
              horasFacturables,
              horasSobretiempo,
              tokenReport,
              estadoJornada,
              JSON.stringify(ajustesJson)
            ]
          ).catch(errIns => console.warn('[Override Hito] Error insertando reporte regularizado:', errIns.message));
        }
      }

      res.json({
        success: true,
        message: `Hito ${clave_actividad} actualizado a las ${hora_real} exitosamente.`,
        data: {
          id_proyecto,
          id_equipo,
          fecha: fechaOperativa,
          clave_actividad,
          hora_real,
          modificado_por: modificadoPor
        }
      });
    } catch (err) {
      console.error('[Override Hito] Error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

module.exports = controlVivoController;

