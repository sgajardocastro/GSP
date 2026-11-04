const db = require('../config/dbConfig');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const notificacionService = require('../services/notificacionService');
const { generarPdfReportDiario } = require('../services/reportDiarioPdfService');
const { buildStoragePath, STORAGE_ROOT } = require('../config/storageConfig');
const archivoModel = require('../models/archivoModel');
const slaAuditorService = require('../services/slaAuditorService');
const viajeModel = require('../models/viajeModel');
const {
  obtenerTarifasDesdeBD,
  resolverTarifaPorCotizacion,
  calcularDiferenciaHoras,
  calcularLiquidacionHorasDia,
  calcularViaticoAlimentacionDia
} = require('../services/tarifasOperadorService');

// --- REQ-1100 / SPEC-016 §19.4: RESOLUCIÓN UNIFICADA DE PISO MÍNIMO CONTRACTUAL DESDE LA COTIZACIÓN ENVIADA VIGENTE ---
function obtenerLineasOperativasVigentes(jsonField = {}) {
  const jf = typeof jsonField === 'string' ? JSON.parse(jsonField || '{}') : (jsonField || {});
  const crmV1 = jf.crm_v1 || {};
  if (Array.isArray(crmV1.lineas_operativas_vigentes) && crmV1.lineas_operativas_vigentes.length > 0) {
    return crmV1.lineas_operativas_vigentes;
  }
  const cots = Array.isArray(crmV1.cotizaciones_historicas) ? crmV1.cotizaciones_historicas : [];
  const enviadas = cots
    .filter(c => (Array.isArray(c?.eventos_envio) && c.eventos_envio.length > 0) || Boolean(c?.evento_envio))
    .sort((a, b) => Number(b.version || 0) - Number(a.version || 0));
  if (enviadas.length > 0 && Array.isArray(enviadas[0].lineas_snapshot) && enviadas[0].lineas_snapshot.length > 0) {
    return enviadas[0].lineas_snapshot;
  }
  return Array.isArray(crmV1.lineas_servicio) ? crmV1.lineas_servicio : (Array.isArray(jf.lineas_servicio) ? jf.lineas_servicio : []);
}

function resolverPisoMinimoContractualOT(jsonField = {}, targetIdEquipo = null) {
  try {
    const jf = typeof jsonField === 'string' ? JSON.parse(jsonField || '{}') : (jsonField || {});
    const lineas = obtenerLineasOperativasVigentes(jf);
    const eqIdNum = Number(targetIdEquipo || 0);

    let lineaEquipo = eqIdNum > 0
      ? lineas.find(l => (Number(l?.equipo_asignado_id) === eqIdNum || Number(l?.id_equipo) === eqIdNum) && (Number(l?.pisoMinimo || l?.cantidad_horas || 0) > 0 || String(l?.unidad || '').toUpperCase().includes('MES')))
      : null;

    if (!lineaEquipo) {
      lineaEquipo = lineas.find(l => {
        const t = String(l?.tipo || '').toUpperCase();
        return (t.includes('GRUA') || t.includes('GRÚA') || t.includes('CAMION') || t.includes('CAMIÓN') || t.includes('MAQUINARIA')) &&
               (Number(l?.pisoMinimo || l?.cantidad_horas || 0) > 0 || String(l?.unidad || '').toUpperCase().includes('MES'));
      });
    }
    if (!lineaEquipo) {
      lineaEquipo = lineas.find(l => Number(l?.pisoMinimo || l?.cantidad_horas || 0) > 0 || String(l?.unidad || '').toUpperCase().includes('MES'));
    }

    const esUnidadMensual = lineaEquipo
      ? String(lineaEquipo?.unidad || '').toUpperCase().includes('MES')
      : lineas.some(l => String(l?.unidad || '').toUpperCase().includes('MES'));

    // REQ-1109: Servicios mensuales no aplican piso mínimo diario de horas (acumulan horas reales al mes)
    if (esUnidadMensual) {
      return 0;
    }

    if (lineaEquipo && lineaEquipo.pisoMinimo !== undefined && lineaEquipo.pisoMinimo !== null && Number(lineaEquipo.pisoMinimo) > 0 && Number(lineaEquipo.pisoMinimo) <= 24) {
      return Number(lineaEquipo.pisoMinimo);
    }
    if (lineaEquipo && lineaEquipo.cantidad_horas && Number(lineaEquipo.cantidad_horas) > 0 && Number(lineaEquipo.cantidad_horas) <= 24) {
      return Number(lineaEquipo.cantidad_horas);
    }
    if (jf.ejecucion_v1?.servicio?.horas_minimas !== undefined && jf.ejecucion_v1?.servicio?.horas_minimas !== null && Number(jf.ejecucion_v1.servicio.horas_minimas) >= 0) {
      return Number(jf.ejecucion_v1.servicio.horas_minimas);
    }
    if (jf.horas_minimas !== undefined && jf.horas_minimas !== null && Number(jf.horas_minimas) >= 0) {
      return Number(jf.horas_minimas);
    }
  } catch (e) {
    console.warn('[REQ-1100] Error en resolverPisoMinimoContractualOT:', e.message);
  }
  return 8.0;
}

// --- SPEC-106 / REQ-1081: LIQUIDACIÓN DIARIA DE PERSONAL Y VIÁTICOS EN EL REPORT DIARIO ---
function construirLiquidacionPersonalDiaReport({
  rep = {},
  proyectoJson = {},
  viajesProyecto = [],
  catalogoTarifas = []
}) {
  const jf = typeof proyectoJson === 'string' ? JSON.parse(proyectoJson || '{}') : (proyectoJson || {});
  const crmV1 = jf.crm_v1 || {};
  const ejecV1 = jf.ejecucion_v1 || {};

  const distanciaKm = parseFloat(
    crmV1.distancia_km ??
    crmV1.snapshot_comercial?.distancia_km ??
    ejecV1.servicio?.distancia_km ??
    jf.distancia_km ??
    0
  ) || 0;

  const regimenExplicito = String(
    ejecV1.regimen_operacional ||
    crmV1.regimen_operacional ||
    crmV1.tipo_contexto ||
    jf.tipo_contexto ||
    ''
  ).toUpperCase();
  const regimen = (regimenExplicito === 'RURAL' || regimenExplicito === 'URBANO')
    ? regimenExplicito
    : (distanciaKm > 30 ? 'RURAL' : 'URBANO');

  const lineasComerciales = crmV1.lineas_servicio || jf.snapshot_comercial?.lines || jf.lineas_servicio || [];
  const infoTarifa = resolverTarifaPorCotizacion(
    lineasComerciales,
    {
      tipo_equipo: rep.equipo_tipo || 'Grúa',
      equipo_modelo: rep.equipo_modelo || '',
      capacidad_maxima: rep.equipo_capacidad || 0
    },
    catalogoTarifas
  );

  const fmtHHMM = (ts) => {
    if (!ts) return null;
    if (typeof ts === 'string' && /^\d{2}:\d{2}$/.test(ts.trim())) return ts.trim();
    try {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('es-CL', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit', hour12: false });
      }
    } catch (_) {}
    return null;
  };
  const fmtYYYYMMDD = (ts) => {
    if (!ts) return '';
    if (typeof ts === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(ts.trim())) return ts.trim();
    try {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
      }
    } catch (_) {}
    return String(ts).slice(0, 10);
  };

  const fechaStr = rep.fecha_reporte_fmt || fmtYYYYMMDD(rep.fecha_reporte);
  const viajesNorm = (viajesProyecto || []).map(v => ({
    ...v,
    fecha_viaje_fmt: v.fecha_viaje_fmt || fmtYYYYMMDD(v.fecha_salida_patio || v.fecha_llegada_faena || v.fecha_salida_faena || v.fecha_llegada_patio || v.fecha_programada || v.fecha_registro),
    hora_salida_patio: v.hora_salida_patio || fmtHHMM(v.fecha_salida_patio),
    hora_llegada_faena: v.hora_llegada_faena || fmtHHMM(v.fecha_llegada_faena),
    hora_salida_faena: v.hora_salida_faena || fmtHHMM(v.fecha_salida_faena),
    hora_llegada_patio: v.hora_llegada_patio || fmtHHMM(v.fecha_llegada_patio)
  }));
  const viajesDia = viajesNorm.filter(v => {
    if (v.fecha_viaje_fmt !== fechaStr) return false;
    if (rep.id_equipo && v.id_equipo && Number(v.id_equipo) !== Number(rep.id_equipo)) return false;
    return true;
  });

  const ida = viajesDia.find(v => v.hora_salida_patio) || viajesDia.find(v => v.tipo_trayecto === 'IDA' || v.tipo_trayecto === 'IDA_Y_VUELTA') || viajesDia[0] || null;
  const ret = [...viajesDia].reverse().find(v => v.hora_llegada_patio) || [...viajesDia].reverse().find(v => v.tipo_trayecto === 'RETORNO' || v.tipo_trayecto === 'IDA_Y_VUELTA') || null;

  const valAj = rep.ajustes_analista?.valores_ajustados || {};
  const horaInicio = valAj.hora_inicio || rep.hora_inicio || fmtHHMM(rep.fecha_inicio_servicio) || '08:00';
  const horaTermino = valAj.hora_termino || rep.hora_termino || fmtHHMM(rep.fecha_termino_servicio) || '18:00';
  const horaSalida = ida?.hora_salida_patio || rep.hora_salida_patio || horaInicio;
  const horaLlegada = ida?.hora_llegada_faena || horaInicio;
  const horaRetorno = ret?.hora_llegada_patio || rep.hora_llegada_patio || horaTermino;

  let condicionDia = 'IDA_Y_REGRESO';
  if (ida?.hora_salida_patio && ret?.hora_llegada_patio) {
    condicionDia = 'IDA_Y_REGRESO';
  } else if (ida?.hora_salida_patio && !ret?.hora_llegada_patio) {
    condicionDia = 'SALIDA_OBRA';
  } else if (!ida?.hora_salida_patio && ret?.hora_llegada_patio) {
    condicionDia = 'RETORNO_PLANTA';
  } else if (regimen === 'RURAL' && Number(rep.dia_correlativo || 1) > 1) {
    condicionDia = 'PERMANENCIA_OBRA';
  }

  const colacionHoras = valAj.horas_colacion !== undefined && valAj.horas_colacion !== null
    ? Number(valAj.horas_colacion)
    : Number(rep.horas_colacion !== undefined && rep.horas_colacion !== null ? rep.horas_colacion : 1.0);
  const colacionMin = Math.round(colacionHoras * 60);
  const horasMinimas = Number(rep.horas_minimas || 8.0);
  const horasRealesReport = Number(valAj.horas_operadas ?? rep.horas_operadas ?? 0);

  const liqCalc = calcularLiquidacionHorasDia({
    hora_salida: horaSalida,
    hora_llegada: horaLlegada,
    hora_inicio: horaInicio,
    hora_termino: horaTermino,
    hora_retorno: horaRetorno,
    colacion_minutos: colacionMin,
    horas_reales_report: horasRealesReport,
    regimen,
    horas_minimas: horasMinimas
  });

  const viatCalc = calcularViaticoAlimentacionDia({
    condicion_dia: condicionDia,
    hora_salida: horaSalida,
    hora_llegada: horaLlegada,
    hora_inicio: horaInicio,
    hora_termino: horaTermino,
    hora_retorno: horaRetorno,
    colacion_minutos: colacionMin,
    horas_reales_fallback: horasRealesReport
  });

  const etiquetasCondicion = {
    IDA_Y_REGRESO: 'Ida y Regreso en el Día',
    SALIDA_OBRA: 'Salida a Obra (Queda en Faena)',
    PERMANENCIA_OBRA: 'Permanencia en Obra',
    RETORNO_PLANTA: 'Retorno desde Obra a Planta'
  };

  const prevLiq = rep.ajustes_analista?.liquidacion_personal_dia || null;
  const tieneRigger = Boolean(valAj.id_user_rigger || rep.id_user_rigger || rep.rigger_nombre);

  const tarifaSugerida = Number(infoTarifa.valor_hora || 5000);
  const horasFaenaSugeridas = Number(liqCalc.horas_faena_pagar || 0);
  const horasFleteSugeridas = Number(liqCalc.horas_flete_pagar || 0);
  const horasTotalesSugeridas = Number(liqCalc.horas_totales_pagar || 0);
  const viaticoSugerido = Number(viatCalc.monto_viatico || 0);

  const horasFaenaPagar = prevLiq?.horas_faena_pagar !== undefined ? Number(prevLiq.horas_faena_pagar) : horasFaenaSugeridas;
  const horasFletePagar = prevLiq?.horas_flete_pagar !== undefined ? Number(prevLiq.horas_flete_pagar) : horasFleteSugeridas;
  const horasTotalesPagar = prevLiq?.horas_totales_pagar !== undefined
    ? Number(prevLiq.horas_totales_pagar)
    : Number((horasFaenaPagar + horasFletePagar).toFixed(2));
  const precioUnitario = prevLiq?.precio_unitario !== undefined ? Number(prevLiq.precio_unitario) : tarifaSugerida;
  const montoTotalHoraOperador = Math.round(horasTotalesPagar * precioUnitario);

  const montoViaticoOperador = prevLiq?.monto_viatico_operador !== undefined
    ? Number(prevLiq.monto_viatico_operador)
    : viaticoSugerido;
  const horasTotalesRigger = tieneRigger
    ? (prevLiq?.horas_totales_rigger !== undefined ? Number(prevLiq.horas_totales_rigger) : horasTotalesPagar)
    : 0;
  const montoViaticoRigger = tieneRigger
    ? (prevLiq?.monto_viatico_rigger !== undefined ? Number(prevLiq.monto_viatico_rigger) : viaticoSugerido)
    : 0;

  const tarifaModificada = Boolean(prevLiq?.tarifa_modificada || Math.abs(precioUnitario - tarifaSugerida) > 1);
  const horasModificadas = Boolean(prevLiq?.horas_modificadas || Math.abs(horasTotalesPagar - horasTotalesSugeridas) > 0.05);
  const viaticoModificado = Boolean(
    prevLiq?.viatico_modificado ||
    Math.abs(montoViaticoOperador - viaticoSugerido) > 1 ||
    (tieneRigger && Math.abs(montoViaticoRigger - viaticoSugerido) > 1)
  );

  return {
    regimen,
    distancia_km: distanciaKm,
    glosa_comercial: infoTarifa.glosa_comercial || 'Según Cotización',
    toneladas_comercial: infoTarifa.toneladas_comercial || 0,
    hora_salida: prevLiq?.hora_salida || horaSalida,
    hora_llegada: prevLiq?.hora_llegada || horaLlegada,
    hora_inicio: horaInicio,
    hora_termino: horaTermino,
    hora_retorno: prevLiq?.hora_retorno || horaRetorno,
    colacion_horas: colacionHoras,
    condicion_dia: prevLiq?.condicion_dia || viatCalc.condicion_dia,
    condicion_label: etiquetasCondicion[prevLiq?.condicion_dia || viatCalc.condicion_dia] || 'Jornada Diaria',
    desde_viatico: viatCalc.desde,
    hasta_viatico: viatCalc.hasta,
    horas_efectivas_viatico: viatCalc.horas_efectivas,
    horas_redondeadas_viatico: viatCalc.horas_redondeadas,
    // Sugeridos por sistema
    horas_faena_sugeridas: horasFaenaSugeridas,
    horas_flete_sugeridas: horasFleteSugeridas,
    horas_totales_sugeridas: horasTotalesSugeridas,
    tarifa_sugerida: tarifaSugerida,
    viatico_sugerido: viaticoSugerido,
    // Aplicados / Validados para Operador
    horas_faena_pagar: horasFaenaPagar,
    horas_flete_pagar: horasFletePagar,
    horas_totales_pagar: horasTotalesPagar,
    precio_unitario: precioUnitario,
    monto_faena_total: Math.round(horasFaenaPagar * precioUnitario),
    monto_flete_total: Math.round(horasFletePagar * precioUnitario),
    monto_total_hora_operador: montoTotalHoraOperador,
    monto_viatico_operador: montoViaticoOperador,
    total_dia_operador: montoTotalHoraOperador + montoViaticoOperador,
    // Aplicados / Validados para Rigger
    tiene_rigger: tieneRigger,
    horas_totales_rigger: horasTotalesRigger,
    monto_viatico_rigger: montoViaticoRigger,
    // Estado y Auditoría
    tarifa_modificada: tarifaModificada,
    horas_modificadas: horasModificadas,
    viatico_modificado: viaticoModificado,
    validado_rrhh: Boolean(prevLiq?.validado_rrhh || rep.estado_reporte === 'VALIDADO_ANALISTA'),
    modificado_por: prevLiq?.modificado_por || null,
    fecha_validacion_rrhh: prevLiq?.fecha_validacion_rrhh || rep.fecha_validacion || null
  };
}

// --- SPEC 63 / REQ-042: CÓMPUTO DETERMINISTA DE CUOTA Y DÍAS HÁBILES ---
function calcularCupoDiasHabiles(proyecto, maxDiaHistorico = 0) {
  if (!proyecto) return Math.max(1, maxDiaHistorico);
  const jf = proyecto.json_field || {};
  const ejec = jf.ejecucion_v1 || {};
  const crm = jf.crm_v1 || {};
  
  const diasPlanDiario = Array.isArray(ejec.plan_diario) ? ejec.plan_diario.length : 0;

  const lines = crm.lineas_servicio || jf.lineas_servicio || [];
  const lineWithDates = lines.find(l => l.fecha_plan_ini && l.fecha_plan_fin);
  const fechaIni = ejec.fecha_salida_plan || proyecto.fecha_plan_ini || lineWithDates?.fecha_plan_ini || crm.fecha_hora_inicio;
  const fechaFin = ejec.fecha_fin_plan || proyecto.fecha_plan_fin || lineWithDates?.fecha_plan_fin || crm.fecha_hora_termino;

  let diasPorRango = 0;
  if (fechaIni && fechaFin) {
    const sIni = String(fechaIni).split('T')[0];
    const sFin = String(fechaFin).split('T')[0];
    const dIni = new Date(sIni + 'T00:00:00');
    const dFin = new Date(sFin + 'T00:00:00');
    if (!isNaN(dIni.getTime()) && !isNaN(dFin.getTime()) && dFin >= dIni) {
      const diffCal = Math.round((dFin - dIni) / 86400000) + 1;
      diasPorRango = Math.max(1, diffCal);
    }
  }

  let totalDias = Math.max(1, diasPlanDiario, diasPorRango, Number(proyecto.duracion_plan || 0));
  for (const l of lines) {
    const d = Number(l.cantidad_dias || l.duracion_dias || l.dias || 0);
    const m = Number(l.cantidad_meses || 0) * 30;
    let dPlanLinea = 0;
    if (l.fecha_plan_ini && l.fecha_plan_fin) {
      const d1 = new Date(String(l.fecha_plan_ini).split('T')[0] + 'T00:00:00');
      const d2 = new Date(String(l.fecha_plan_fin).split('T')[0] + 'T00:00:00');
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d2 >= d1) {
        dPlanLinea = Math.round((d2 - d1) / 86400000) + 1;
      }
    }
    totalDias = Math.max(totalDias, d, m, dPlanLinea);
  }
  return Math.max(1, totalDias, maxDiaHistorico);
}

async function getReportesConsumidosOT(id_proyecto, dbClient) {
  const q = `
    SELECT COUNT(*) AS total
    FROM tedp_reporte_avance
    WHERE id_proyecto = $1
      AND estado_reporte != 'JORNADA_EN_CURSO'
      AND (token_report IS NULL OR token_report NOT LIKE 'FLT-%')
  `;
  const res = await dbClient.query(q, [id_proyecto]);
  return parseInt(res.rows[0]?.total || '0', 10);
}

// --- SPEC-088 / REQ-1060: IDENTIDAD CANÓNICA DE LA JORNADA DEL REPORT DIARIO ---
// Fecha local operativa (America/Santiago) en formato YYYY-MM-DD (INV-7)
function fechaHoyChile() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
}

// Resolvedor ÚNICO de jornada activa (INV-1, INV-2, INV-3). Usado por contexto, pendientes, inicio y guardar.
async function resolverJornadaActiva(dbClient, id_proyecto, { id_reporte_avance = null, id_equipo = null, id_user = null, equipos_validos = null } = {}) {
  const hoy = fechaHoyChile();
  const selectCols = `
    ra.*,
    to_char(ra.fecha_reporte, 'YYYY-MM-DD') AS fecha_reporte_str,
    to_char(ra.fecha_inicio_servicio AT TIME ZONE 'America/Santiago', 'HH24:MI') AS hora_inicio_str
  `;
  const marcar = (j) => (j ? { ...j, es_dia_anterior: Boolean(j.fecha_reporte_str && j.fecha_reporte_str < hoy) } : null);

  // 1. Identidad explícita por id_reporte_avance
  if (id_reporte_avance) {
    const byId = await dbClient.query(
      `SELECT ${selectCols} FROM tedp_reporte_avance ra
       WHERE ra.id_reporte_avance = $1 AND ra.id_proyecto = $2 AND ra.estado_reporte = 'JORNADA_EN_CURSO'`,
      [id_reporte_avance, id_proyecto]
    );
    if (byId.rows.length > 0) {
      return { jornada: marcar(byId.rows[0]), abiertas: [marcar(byId.rows[0])], huerfanos: [] };
    }
  }

  // 2. Todas las jornadas abiertas de la OT, descartando huérfanos confirmados (INV-2)
  const abRes = await dbClient.query(
    `SELECT ${selectCols},
       EXISTS (
         SELECT 1 FROM tedp_reporte_avance c
         WHERE c.id_proyecto = ra.id_proyecto
           AND c.id_reporte_avance <> ra.id_reporte_avance
           AND c.estado_reporte <> 'JORNADA_EN_CURSO'
           AND c.fecha_reporte = ra.fecha_reporte
           AND (c.id_equipo = ra.id_equipo OR ra.id_equipo IS NULL)
           AND (c.token_report IS NULL OR c.token_report NOT LIKE 'FLT-%')
       ) AS tiene_cierre_mismo_dia
     FROM tedp_reporte_avance ra
     WHERE ra.id_proyecto = $1 AND ra.estado_reporte = 'JORNADA_EN_CURSO'
     ORDER BY ra.id_reporte_avance DESC`,
    [id_proyecto]
  );
  const abiertas = [];
  const huerfanos = [];
  for (const r of abRes.rows) {
    if (r.fecha_reporte_str && r.fecha_reporte_str < hoy && r.tiene_cierre_mismo_dia) {
      huerfanos.push(r);
      console.warn(`[REQ-1060][HUERFANO] Jornada ${r.id_reporte_avance} (OT ${id_proyecto}, eq ${r.id_equipo}, ${r.fecha_reporte_str}) ignorada: ya existe reporte cerrado ese día.`);
    } else {
      abiertas.push(marcar(r));
    }
  }
  if (abiertas.length === 0) return { jornada: null, abiertas, huerfanos };

  // 3. Selección determinista
  //    a) coincidencia exacta de equipo; b) única jornada del operador; c) única jornada de la OT SOLO si el
  //    equipo solicitado no es un equipo válido de la OT (p.ej. vino del viaje del chofer). En OTs multi-grúa,
  //    una grúa válida sin jornada propia NO toma la jornada de otra grúa.
  if (id_equipo) {
    const m = abiertas.find(a => Number(a.id_equipo) === Number(id_equipo));
    if (m) return { jornada: m, abiertas, huerfanos };
  }
  if (id_user) {
    const delUser = abiertas.filter(a => Number(a.id_user_operador) === Number(id_user));
    if (delUser.length === 1) return { jornada: delUser[0], abiertas, huerfanos };
  }
  const equipoEsValido = Boolean(id_equipo) && Array.isArray(equipos_validos) &&
    equipos_validos.map(Number).includes(Number(id_equipo));
  if (!equipoEsValido && abiertas.length === 1) return { jornada: abiertas[0], abiertas, huerfanos };
  return { jornada: null, abiertas, huerfanos };
}

const reportDiarioController = {
  // 1. Obtener contexto y datos precargados para emitir Report Diario (PWA)
  async getReportContexto(req, res) {
    try {
      const { id_proyecto } = req.params;
      const { id_equipo } = req.query; // Soporte para contexto por equipo específico (Spec 35)

      if (!id_proyecto) {
        return res.status(400).json({ error: 'id_proyecto es requerido' });
      }

      // 1.1 Consultar datos del proyecto / OT con Razón Social real del cliente (tpar_empresas)
      const proySql = `
        SELECT 
          p.id_proyecto,
          p.codi_proyecto,
          p.nombre_proyecto,
          p.id_proyecto_estado,
          p.json_field,
          COALESCE(clt.razon_social, clt.name_empresa, p.json_field->>'cliente_nombre', p.json_field->'ejecucion_v1'->'cliente'->>'razon_social', 'Cliente Mandante') AS cliente_nombre,
          COALESCE(clt.rut_empresa, p.json_field->>'cliente_rut', p.json_field->'ejecucion_v1'->'cliente'->>'rut', '') AS cliente_rut,
          COALESCE(p.json_field->>'obra_nombre', p.json_field->'crm_v1'->>'obra_nombre', p.json_field->'ejecucion_v1'->'cliente'->>'obra', p.nombre_proyecto) AS obra_nombre,
          COALESCE(p.json_field->>'obra_direccion', p.json_field->'crm_v1'->>'obra_direccion', p.json_field->'ejecucion_v1'->'cliente'->>'direccion_faena', 'Faena en Terreno') AS obra_direccion
        FROM tpry_proyecto p
        LEFT JOIN tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
        WHERE p.id_proyecto = $1;
      `;
      const proyRes = await db.query(proySql, [id_proyecto]);
      if (proyRes.rows.length === 0) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }
      const proyecto = proyRes.rows[0];

      // 1.2 Consultar equipos asignados (DEDUPLICADOS por id_equipo) con su micro-estado operacional (Spec 35)
      const eqSql = `
        SELECT DISTINCT ON (re.id_equipo)
          re.id_rel_equipo,
          re.id_equipo,
          re.rol_equipo,
          e.patente,
          e.modelo,
          e.marca,
          COALESCE(e.tipo_equipo, 'GRUAS TELESCOPICAS') AS tipo_equipo,
          COALESCE((e.json_data->>'horometro')::numeric, 0) AS horometro_base,
          COALESCE(v.estado_trayecto, 'ARRIBADO') AS estado_operativo,
          v.token_viaje,
          v.km_inicial,
          v.km_final,
          v.horometro_inicial AS horometro_viaje_salida,
          v.horometro_final AS horometro_viaje_llegada,
          v.horometro_grua_inicial AS horometro_grua_llegada
        FROM tpry_rel_equipo re
        JOIN tequ_equipo e ON re.id_equipo = e.id_equipo
        LEFT JOIN LATERAL (
          SELECT estado_trayecto, token_viaje, km_inicial, km_final, horometro_inicial, horometro_final, horometro_grua_inicial
          FROM tequ_log_desplazamiento
          WHERE id_proyecto = re.id_proyecto AND id_equipo = re.id_equipo
          ORDER BY id_log_desplazamiento DESC
          LIMIT 1
        ) v ON TRUE
        WHERE re.id_proyecto = $1
        ORDER BY re.id_equipo, re.id_rel_equipo DESC;
      `;
      const eqRes = await db.query(eqSql, [id_proyecto]);
      let equipos = eqRes.rows;

      // Fallback si no hay equipos en tpry_rel_equipo (Spec 39)
      if (equipos.length === 0 && proyecto.json_field?.ejecucion_v1?.equipos_asignados) {
        const jsonEqs = proyecto.json_field.ejecucion_v1.equipos_asignados;
        for (const eqItem of jsonEqs) {
          const idEq = eqItem.id_equipo || eqItem.id;
          if (idEq) {
            const fallbackEqRes = await db.query(
              `SELECT id_equipo, patente, modelo, marca, COALESCE(tipo_equipo, 'GRUAS TELESCOPICAS') AS tipo_equipo, COALESCE((json_data->>'horometro')::numeric, 0) AS horometro_base, 'ARRIBADO' AS estado_operativo FROM tequ_equipo WHERE id_equipo = $1`,
              [idEq]
            );
            if (fallbackEqRes.rows.length > 0) {
              equipos.push(fallbackEqRes.rows[0]);
            }
          }
        }
      }

      // REQ-1060 / INV-4: Fallback CRM (línea de grúa con equipo asignado). Se ELIMINA el fallback
      // "primer equipo de toda la flota" que asignaba una máquina arbitraria a la OT.
      if (equipos.length === 0) {
        const lineasCrm = proyecto.json_field?.crm_v1?.lineas_servicio || proyecto.json_field?.lineas_servicio || [];
        const idsCrm = [...new Set(lineasCrm
          .filter(l => (l.tipo || '').toUpperCase().includes('GRUA') && l.equipo_asignado_id)
          .map(l => Number(l.equipo_asignado_id)))];
        for (const idEq of idsCrm) {
          const crmEqRes = await db.query(
            `SELECT id_equipo, patente, modelo, marca, COALESCE(tipo_equipo, 'GRUAS TELESCOPICAS') AS tipo_equipo, COALESCE((json_data->>'horometro')::numeric, 0) AS horometro_base, 'ARRIBADO' AS estado_operativo FROM tequ_equipo WHERE id_equipo = $1`,
            [idEq]
          );
          if (crmEqRes.rows.length > 0) equipos.push(crmEqRes.rows[0]);
        }
      }

      // 1.3 Consultar personal / tripulación asignada (DEDUPLICADA por id_user, preservando orden de asignación)
      const perSql = `
        SELECT * FROM (
          SELECT DISTINCT ON (rp.id_user)
            rp.id_rel_persona,
            rp.id_user,
            rp.rol_asignado,
            u.name_frst,
            u.apellido_pat,
            u.apellido_mat,
            u.email,
            u.rut
          FROM tpry_rel_persona rp
          JOIN tsec_users u ON rp.id_user = u.id_user
          WHERE rp.id_proyecto = $1
          ORDER BY rp.id_user, rp.id_rel_persona DESC
        ) sub
        ORDER BY sub.id_rel_persona ASC;
      `;
      const perRes = await db.query(perSql, [id_proyecto]);
      let personas = perRes.rows;

      // Fallback 1: Si no hay personas asignadas en tpry_rel_persona, buscar en tequ_log_desplazamiento
      if (personas.length === 0) {
        const viajeChoferRes = await db.query(`
          SELECT DISTINCT ON (u.id_user)
            1 AS id_rel_persona,
            u.id_user,
            'OPERADOR' AS rol_asignado,
            u.name_frst,
            u.apellido_pat,
            u.apellido_mat,
            u.email,
            u.rut
          FROM tequ_log_desplazamiento d
          JOIN tsec_users u ON d.id_user_chofer = u.id_user
          WHERE d.id_proyecto = $1
          ORDER BY u.id_user, d.id_log_desplazamiento DESC
        `, [id_proyecto]);
        if (viajeChoferRes.rows.length > 0) {
          personas = viajeChoferRes.rows;
        }
      }

      // Fallback 2: Si aun esta vacio, buscar en json_field.ejecucion_v1.tripulacion
      if (personas.length === 0 && proyecto.json_field?.ejecucion_v1?.tripulacion) {
        const trip = proyecto.json_field.ejecucion_v1.tripulacion;
        for (const t of trip) {
          const uid = t.id_user || t.id;
          if (uid) {
            const uRes = await db.query(
              `SELECT 1 AS id_rel_persona, id_user, $2 AS rol_asignado, name_frst, apellido_pat, apellido_mat, email, rut FROM tsec_users WHERE id_user = $1`,
              [uid, t.rol || 'OPERADOR']
            );
            if (uRes.rows.length > 0) personas.push(uRes.rows[0]);
          }
        }
      }

      // 1.3.B Enriquecer vinculación determinista Equipo <-> Operador desde json_field y viajes
      const jfCtx = proyecto.json_field || {};
      const crmCtx = jfCtx.crm_v1 || {};
      const ejecCtx = jfCtx.ejecucion_v1 || {};
      const lineasCtx = Array.isArray(crmCtx.lineas_servicio) ? crmCtx.lineas_servicio : (Array.isArray(jfCtx.lineas_servicio) ? jfCtx.lineas_servicio : []);
      const tripCtx = Array.isArray(ejecCtx.tripulacion_asignada) ? ejecCtx.tripulacion_asignada : [];
      const extrasCtx = Array.isArray(ejecCtx.equipos_extra) ? ejecCtx.equipos_extra : [];
      const inspPatioCtx = ejecCtx.preparacion_salida?.inspecciones_patio || {};

      const eqToUserMap = new Map();
      const userToEqMap = new Map();
      const registrarVinculoEqUser = (idEqRaw, idUserRaw) => {
        const eqN = Number(idEqRaw);
        const usN = Number(idUserRaw);
        if (!eqN || !usN) return;
        if (!eqToUserMap.has(eqN)) eqToUserMap.set(eqN, usN);
        if (!userToEqMap.has(usN)) userToEqMap.set(usN, eqN);
      };

      lineasCtx.forEach(l => registrarVinculoEqUser(l.equipo_asignado_id || l.id_equipo, l.operador_asignado_id || l.chofer_asignado_id));
      tripCtx.forEach(t => registrarVinculoEqUser(t.equipo_asignado_id || t.id_equipo, t.id_user));
      extrasCtx.forEach(ex => registrarVinculoEqUser(ex.id_equipo || ex.equipo_asignado_id, ex.chofer_id || ex.operador_id || ex.id_user));
      Object.entries(inspPatioCtx).forEach(([kEq, valObj]) => registrarVinculoEqUser(kEq, valObj?.operador_id));
      if (ejecCtx.equipo_id && ejecCtx.operador_id) {
        registrarVinculoEqUser(ejecCtx.equipo_id, ejecCtx.operador_id);
      }

      personas = personas.map(p => {
        const nombreCompleto = [p.name_frst, p.apellido_pat, p.apellido_mat].filter(Boolean).join(' ').trim();
        const idEqVinc = userToEqMap.get(Number(p.id_user)) || null;
        return {
          ...p,
          nombre_completo: nombreCompleto || p.email || `Usuario #${p.id_user}`,
          rol: p.rol_asignado || 'OPERADOR',
          id_equipo: idEqVinc
        };
      });

      equipos = equipos.map(eq => {
        const idUsVinc = eqToUserMap.get(Number(eq.id_equipo)) || null;
        const perMatch = idUsVinc ? personas.find(p => Number(p.id_user) === Number(idUsVinc)) : null;
        return {
          ...eq,
          id_user_operador: idUsVinc,
          operador_nombre: perMatch?.nombre_completo || null
        };
      });

      // 1.4 Consultar reports ya emitidos para esta OT
      const repSql = `
        SELECT 
          id_reporte_avance,
          id_equipo,
          dia_correlativo,
          fecha_reporte,
          horometro_inicio,
          horometro_termino,
          horas_operadas,
          horas_facturables,
          horas_sobretiempo,
          estado_reporte,
          cliente_nombre,
          fecha_registro,
          token_report
        FROM tedp_reporte_avance
        WHERE id_proyecto = $1
          AND (token_report IS NULL OR token_report NOT LIKE 'FLT-%')
        ORDER BY fecha_reporte ASC, dia_correlativo ASC, id_reporte_avance ASC;
      `;
      const repRes = await db.query(repSql, [id_proyecto]);
      const reports = repRes.rows;

      // 1.5 REQ-1060 / SPEC-088: Resolución CANÓNICA de jornada activa y equipo (INV-3, INV-4)
      const idUserSolicitante = req.query.id_user ? parseInt(req.query.id_user, 10) : null;
      const idEquipoDeUsuario = idUserSolicitante ? (userToEqMap.get(idUserSolicitante) || null) : null;
      const idEquipoSolicitado = id_equipo ? parseInt(id_equipo, 10) : idEquipoDeUsuario;
      const { jornada: jornadaResuelta, abiertas: jornadasAbiertas } = await resolverJornadaActiva(db, id_proyecto, {
        id_reporte_avance: req.query.id_reporte_avance ? parseInt(req.query.id_reporte_avance, 10) : null,
        id_equipo: idEquipoSolicitado,
        id_user: idUserSolicitante,
        equipos_validos: equipos.map(e => Number(e.id_equipo))
      });
      let jornadaActiva = jornadaResuelta;

      let targetIdEquipo = null;
      if (idEquipoSolicitado && equipos.some(e => Number(e.id_equipo) === idEquipoSolicitado)) {
        targetIdEquipo = idEquipoSolicitado;
        if (jornadaActiva && jornadaActiva.id_equipo && Number(jornadaActiva.id_equipo) !== targetIdEquipo && equipos.length > 1) {
          jornadaActiva = null;
        }
      } else if (jornadaActiva && jornadaActiva.id_equipo) {
        targetIdEquipo = Number(jornadaActiva.id_equipo);
      } else if (idEquipoDeUsuario && equipos.some(e => Number(e.id_equipo) === idEquipoDeUsuario)) {
        targetIdEquipo = idEquipoDeUsuario;
      } else if (equipos.length > 0) {
        targetIdEquipo = Number(equipos[0].id_equipo);
      }
      // Si la jornada abierta usa un equipo fuera de la lista de la OT, se agrega para que la UI lo muestre
      if (targetIdEquipo && !equipos.some(e => Number(e.id_equipo) === targetIdEquipo)) {
        const extraEq = await db.query(
          `SELECT id_equipo, patente, modelo, marca, COALESCE(tipo_equipo, 'GRUAS TELESCOPICAS') AS tipo_equipo, COALESCE((json_data->>'horometro')::numeric, 0) AS horometro_base, 'ARRIBADO' AS estado_operativo FROM tequ_equipo WHERE id_equipo = $1`,
          [targetIdEquipo]
        );
        if (extraEq.rows.length > 0) equipos.push(extraEq.rows[0]);
      }
      const equipoCorregido = Boolean(idEquipoSolicitado && targetIdEquipo && idEquipoSolicitado !== targetIdEquipo);
      if (equipoCorregido) {
        console.warn(`[REQ-1060][EQUIPO_CORREGIDO] OT ${id_proyecto}: solicitado ${idEquipoSolicitado} -> canónico ${targetIdEquipo} (jornada ${jornadaActiva?.id_reporte_avance || 'ninguna'})`);
      }

      const reportsDelEquipo = targetIdEquipo ? reports.filter(r => Number(r.id_equipo) === targetIdEquipo && r.estado_reporte !== 'JORNADA_EN_CURSO') : reports.filter(r => r.estado_reporte !== 'JORNADA_EN_CURSO');

      let diaSugerido = 1;
      let horometroSugerido = null;
      let odometroSugerido = null;

      if (reportsDelEquipo.length > 0) {
        const maxDia = Math.max(...reportsDelEquipo.map(r => Number(r.dia_correlativo) || 0), reportsDelEquipo.length);
        diaSugerido = maxDia + 1;
        const ultimoReport = reportsDelEquipo[reportsDelEquipo.length - 1];
        if (ultimoReport.horometro_termino) {
          horometroSugerido = Number(ultimoReport.horometro_termino);
        }
        if (ultimoReport.odometro_termino) {
          odometroSugerido = Number(ultimoReport.odometro_termino);
        }
      } else if (targetIdEquipo) {
        const eqMatch = equipos.find(e => Number(e.id_equipo) === targetIdEquipo);
        if (eqMatch) {
          if (eqMatch.horometro_grua_llegada) {
            horometroSugerido = Number(eqMatch.horometro_grua_llegada);
          } else if (eqMatch.horometro_viaje_llegada || eqMatch.horometro_viaje_salida) {
            horometroSugerido = Number(eqMatch.horometro_viaje_llegada || eqMatch.horometro_viaje_salida);
          } else if (eqMatch.horometro_base) {
            horometroSugerido = Number(eqMatch.horometro_base);
          }
          if (eqMatch.km_final || eqMatch.km_inicial) {
            odometroSugerido = Number(eqMatch.km_final || eqMatch.km_inicial);
          }
        }
      }

      // Horas mínimas contractuales configuradas en la propuesta / OT (REQ-1100: cotización enviada vigente)
      let horasMinimas = resolverPisoMinimoContractualOT(proyecto.json_field || {}, targetIdEquipo);

      // Sincronizar jornada en curso si tenía un piso antiguo
      if (jornadaActiva && Number(jornadaActiva.horas_minimas) !== Number(horasMinimas)) {
        jornadaActiva.horas_minimas = horasMinimas;
        await db.query('UPDATE tedp_reporte_avance SET horas_minimas = $1 WHERE id_reporte_avance = $2', [horasMinimas, jornadaActiva.id_reporte_avance]);
      }

      // Calcular total de días autorizados de la OT (Spec 63 / REQ-042)
      const maxDiaHistorico = reportsDelEquipo.reduce((m, r) => Math.max(m, Number(r.dia_correlativo || 0)), 0);
      const totalDiasOT = calcularCupoDiasHabiles(proyecto, maxDiaHistorico);

      // Reports de faena que consumen cuota (excluyendo FLETE y jornadas en curso)
      const cantReportesTerminados = reportsDelEquipo.filter(r => 
        r.estado_reporte !== 'JORNADA_EN_CURSO' &&
        (!r.token_report || !r.token_report.startsWith('FLT-'))
      ).length;
      const servicioConcluido = cantReportesTerminados >= totalDiasOT;

      res.json({
        success: true,
        data: {
          proyecto,
          equipos,
          id_equipo_seleccionado: targetIdEquipo,
          id_equipo_solicitado: idEquipoSolicitado,
          equipo_corregido: equipoCorregido,
          jornadas_abiertas: (jornadasAbiertas || []).map(a => ({
            id_reporte_avance: a.id_reporte_avance,
            id_equipo: a.id_equipo,
            id_user_operador: a.id_user_operador,
            fecha_reporte_str: a.fecha_reporte_str,
            hora_inicio_str: a.hora_inicio_str,
            es_dia_anterior: a.es_dia_anterior
          })),
          fecha_hoy: fechaHoyChile(),
          personas: personas,
          reports,
          reports_equipo: reportsDelEquipo,
          dia_sugerido: diaSugerido,
          horometro_sugerido: null,
          odometro_sugerido: odometroSugerido,
          horas_minimas: horasMinimas,
          jornada_activa: jornadaActiva,
          total_dias: totalDiasOT,
          dias_reportados: cantReportesTerminados,
          servicio_concluido: servicioConcluido,
          es_ultimo_dia: diaSugerido >= totalDiasOT
        }
      });
    } catch (err) {
      console.error('Error al obtener contexto de report diario:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 1.B Registrar Inicio de Jornada (Momento 1: Control de Flota - Interno GSP)
  async guardarInicioJornada(req, res) {
    try {
      const {
        id_proyecto,
        id_equipo,
        id_user_operador,
        id_user_rigger,
        dia_correlativo,
        fecha_reporte,
        hora_inicio,
        horometro_inicio,
        odometro_inicio,
        foto_tablero_inicio,
        foto_odometro_inicio
      } = req.body;

      if (!id_proyecto || !fecha_reporte || !id_user_operador) {
        return res.status(400).json({ error: 'id_proyecto, fecha_reporte y id_user_operador son requeridos' });
      }
      // REQ-1060 / INV-4: la jornada SIEMPRE se guarda con un equipo explícito (sin equipo nunca sería recuperable)
      if (!id_equipo) {
        return res.status(400).json({
          success: false,
          codigo: 'EQUIPO_REQUERIDO',
          error: 'La OT no tiene una grúa asignada para registrar la jornada. Contacte a Control de Gestión.'
        });
      }

      const fechaBase = fecha_reporte.split('T')[0];
      const fecha_inicio_servicio = hora_inicio ? `${fechaBase} ${hora_inicio}:00` : null;

      // Resolver pisoMinimo contractual del Estructurador Comercial de la OT (REQ-1100)
      let horasMinimasOT = 8.0;
      try {
        const pryRes = await db.query('SELECT json_field FROM tpry_proyecto WHERE id_proyecto = $1', [id_proyecto]);
        if (pryRes.rows.length > 0) {
          horasMinimasOT = resolverPisoMinimoContractualOT(pryRes.rows[0].json_field || {}, id_equipo);
        }
      } catch (e) {
        console.warn('Error resolviendo pisoMinimo en guardarInicioJornada:', e.message);
      }

      const deviceTs = req.body.device_timestamp ? new Date(req.body.device_timestamp) : null;

      // REQ-1476 / SPEC-006 v1.5: Validación incremental de horómetro y odómetro al inicio de jornada
      if (id_equipo && (horometro_inicio !== undefined && horometro_inicio !== null && horometro_inicio !== '')) {
        const eqAcumRes = await db.query(
          `SELECT COALESCE(horometro_grua_acumulado, 0) AS h_grua, COALESCE(odometro_acumulado, 0) AS odo,
                  (SELECT MAX(horometro_termino) FROM tedp_reporte_avance WHERE id_equipo = $1 AND horometro_termino IS NOT NULL) AS max_rep_horo
           FROM tequ_equipo WHERE id_equipo = $1`,
          [id_equipo]
        );
        if (eqAcumRes.rows.length > 0) {
          const rowAcum = eqAcumRes.rows[0];
          const minHoro = Math.max(Number(rowAcum.h_grua || 0), Number(rowAcum.max_rep_horo || 0));
          if (minHoro > 0 && Number(horometro_inicio) < minHoro) {
            return res.status(422).json({
              success: false,
              error: `El Horómetro de Inicio (${horometro_inicio} hrs) no puede ser menor al último registro acumulado del equipo (${minHoro} hrs).`
            });
          }
          if (odometro_inicio !== undefined && odometro_inicio !== null && odometro_inicio !== '' && Number(rowAcum.odo) > 0 && Number(odometro_inicio) < Number(rowAcum.odo)) {
            return res.status(422).json({
              success: false,
              error: `El Odómetro de Inicio (${odometro_inicio} km) no puede ser menor al último registro acumulado del equipo (${rowAcum.odo} km).`
            });
          }
        }
      }

      // REQ-1012 / Spec 66: Invariante de Secuencia Cronológica Multi-Día (Fail-Closed)
      if (Number(dia_correlativo) > 1) {
        const diaPrevio = Number(dia_correlativo) - 1;
        const prevSql = `
          SELECT id_reporte_avance, dia_correlativo, fecha_reporte, estado_reporte, estado_jornada, horometro_termino
          FROM tedp_reporte_avance
          WHERE id_proyecto = $1 
            AND (id_equipo = $2 OR $2 IS NULL)
            AND (token_report IS NULL OR token_report NOT LIKE 'FLT-%')
          ORDER BY fecha_reporte DESC, id_reporte_avance DESC;
        `;
        const prevRes = await db.query(prevSql, [id_proyecto, id_equipo || null]);
        const cerradosEquipo = prevRes.rows.filter(r => r.estado_reporte !== 'JORNADA_EN_CURSO');
        const maxDiaCerradoEq = cerradosEquipo.reduce((m, r) => Math.max(m, Number(r.dia_correlativo) || 0), 0);
        const totalCerradosEq = Math.max(maxDiaCerradoEq, cerradosEquipo.length);
        const matchDiaPrevio = prevRes.rows.find(r => Number(r.dia_correlativo) === diaPrevio);
        if (totalCerradosEq < diaPrevio || (matchDiaPrevio && matchDiaPrevio.estado_reporte === 'JORNADA_EN_CURSO')) {
          return res.status(409).json({
            success: false,
            codigo: 'DIA_PREVIO_PENDIENTE',
            error: `Secuencia cronológica bloqueada: El reporte del Día ${diaPrevio} aún no ha sido concluido y firmado por el cliente mandante. Debe finalizar y sellar el Día ${diaPrevio} antes de iniciar la jornada del Día ${dia_correlativo}.`
          });
        }
      }

      // REQ-1060 / SPEC-088: Resolver jornada abierta con el resolvedor canónico (INV-1, INV-2, INV-6)
      const { jornada: jornadaExistente } = await resolverJornadaActiva(db, id_proyecto, {
        id_equipo,
        id_user: id_user_operador
      });
      if (jornadaExistente && Number(jornadaExistente.id_equipo) !== Number(id_equipo)) {
        // Hay una jornada abierta de esta OT con otra grúa: se informa en vez de crear una segunda en paralelo silenciosamente
        console.warn(`[REQ-1060][INICIO] OT ${id_proyecto}: jornada ${jornadaExistente.id_reporte_avance} abierta con eq ${jornadaExistente.id_equipo}, inicio solicitado con eq ${id_equipo}.`);
        if (Number(jornadaExistente.id_user_operador) === Number(id_user_operador)) {
          return res.status(409).json({
            success: false,
            codigo: 'JORNADA_ABIERTA_OTRO_EQUIPO',
            id_reporte_avance: jornadaExistente.id_reporte_avance,
            id_equipo: jornadaExistente.id_equipo,
            fecha_reporte: jornadaExistente.fecha_reporte_str,
            error: `Ya tiene una jornada abierta en esta OT (registro ${jornadaExistente.id_reporte_avance}, ${jornadaExistente.fecha_reporte_str}). Vuelva a abrir el Report para registrar su término.`
          });
        }
      }
      const fechaInicioSolicitada = String(fecha_reporte).split('T')[0];
      const existRes = { rows: [] };
      if (jornadaExistente && Number(jornadaExistente.id_equipo) === Number(id_equipo)) {
        if (jornadaExistente.es_dia_anterior && jornadaExistente.fecha_reporte_str !== fechaInicioSolicitada) {
          return res.status(409).json({
            success: false,
            codigo: 'JORNADA_ANTERIOR_ABIERTA',
            id_reporte_avance: jornadaExistente.id_reporte_avance,
            fecha_reporte: jornadaExistente.fecha_reporte_str,
            error: `Existe una jornada abierta del ${jornadaExistente.fecha_reporte_str} (Día ${jornadaExistente.dia_correlativo}) sin cerrar. Debe registrar su término y firma antes de iniciar una nueva jornada.`
          });
        }
        existRes.rows.push({ id_reporte_avance: jornadaExistente.id_reporte_avance });
      }

      let reportRow;
      if (existRes.rows.length > 0) {
        const updateSql = `
          UPDATE tedp_reporte_avance SET
            id_user_rigger = $1,
            dia_correlativo = $2,
            fecha_reporte = $3,
            fecha_inicio_servicio = $4,
            horometro_inicio = $5,
            odometro_inicio = $6,
            foto_tablero_inicio = $7,
            foto_odometro_inicio = COALESCE($8, foto_odometro_inicio),
            horas_minimas = $9,
            device_timestamp = COALESCE($10, device_timestamp),
            estado_jornada = 'JORNADA_EN_CURSO'
          WHERE id_reporte_avance = $11
          RETURNING *;
        `;
        const upRes = await db.query(updateSql, [
          id_user_rigger || null,
          dia_correlativo || 1,
          fecha_reporte,
          fecha_inicio_servicio,
          horometro_inicio || null,
          odometro_inicio || null,
          foto_tablero_inicio || null,
          foto_odometro_inicio || null,
          horasMinimasOT,
          deviceTs,
          existRes.rows[0].id_reporte_avance
        ]);
        reportRow = upRes.rows[0];
      } else {
        // Validación estricta de cuota fail-closed (Spec 63 / REQ-042)
        const proyCupo = await db.query('SELECT json_field, fecha_plan_ini, fecha_plan_fin FROM tpry_proyecto WHERE id_proyecto = $1', [id_proyecto]);
        if (proyCupo.rows.length === 0) {
          return res.status(404).json({ error: 'Proyecto no encontrado para validar cuota operacional' });
        }
        const totalDiasPermitidos = calcularCupoDiasHabiles(proyCupo.rows[0]);
        const reportesConsumidos = await getReportesConsumidosOT(id_proyecto, db);
        if (reportesConsumidos >= totalDiasPermitidos) {
          return res.status(403).json({
            success: false,
            codigo: 'SERVICIO_CONCLUIDO',
            error: `Operación bloqueada por término de faena: Esta orden de trabajo ya completó sus ${totalDiasPermitidos} jornada(s) autorizadas (${reportesConsumidos} reportes finalizados). No es posible iniciar nuevas jornadas.`
          });
        }

        const token_report = crypto.randomBytes(24).toString('hex');
        const insertSql = `
          INSERT INTO tedp_reporte_avance (
            id_proyecto,
            id_equipo,
            id_user_operador,
            id_user_rigger,
            dia_correlativo,
            fecha_reporte,
            unidad_cobro,
            fecha_inicio_servicio,
            horometro_inicio,
            odometro_inicio,
            foto_tablero_inicio,
            foto_odometro_inicio,
            token_report,
            horas_minimas,
            device_timestamp,
            estado_reporte,
            estado_jornada,
            fecha_registro
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'JORNADA_EN_CURSO', 'JORNADA_EN_CURSO', CURRENT_TIMESTAMP
          ) RETURNING *;
        `;
        const inRes = await db.query(insertSql, [
          id_proyecto,
          id_equipo || null,
          id_user_operador,
          id_user_rigger || null,
          dia_correlativo || 1,
          fecha_reporte,
          'HRS_DIA',
          fecha_inicio_servicio,
          horometro_inicio || null,
          odometro_inicio || null,
          foto_tablero_inicio || null,
          foto_odometro_inicio || null,
          token_report,
          horasMinimasOT,
          deviceTs
        ]);
        reportRow = inRes.rows[0];
      }

      if (id_equipo && (horometro_inicio || odometro_inicio)) {
        await db.query(
          `UPDATE tequ_equipo
           SET horometro_grua_acumulado = GREATEST(COALESCE(horometro_grua_acumulado, 0), COALESCE($1::numeric, 0)),
               odometro_acumulado = GREATEST(COALESCE(odometro_acumulado, 0), COALESCE($2::numeric, 0)),
               fecha_ultima_lectura = CURRENT_TIMESTAMP,
               fuente_ultima_lectura = 'REPORT_INICIO'
           WHERE id_equipo = $3`,
          [horometro_inicio || 0, odometro_inicio || 0, id_equipo]
        ).catch(() => {});
      }

      res.json({
        success: true,
        message: 'Inicio de Jornada registrado exitosamente en Control de Flota',
        data: reportRow
      });
    } catch (err) {
      console.error('Error al registrar inicio de jornada:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 2. Obtener todos los reports de un proyecto (Torre de Control)
  async getReportsPorProyecto(req, res) {
    try {
      const { id_proyecto } = req.params;
      if (!id_proyecto) {
        return res.status(400).json({ error: 'id_proyecto es requerido' });
      }

      const sql = `
        SELECT 
          r.id_reporte_avance,
          r.id_proyecto,
          r.id_edp,
          r.id_equipo,
          r.id_user_operador,
          r.id_user_rigger,
          r.id_user_validador,
          r.dia_correlativo,
          r.fecha_reporte,
          to_char(r.fecha_reporte, 'YYYY-MM-DD') AS fecha_reporte_iso,
          r.unidad_cobro,
          r.incluye_flete_independiente,
          r.fecha_inicio_servicio,
          r.fecha_termino_servicio,
          to_char(r.fecha_inicio_servicio AT TIME ZONE 'America/Santiago', 'HH24:MI') AS hora_inicio,
          to_char(r.fecha_termino_servicio AT TIME ZONE 'America/Santiago', 'HH24:MI') AS hora_termino,
          r.ajustes_analista,
          r.latitud_inicio_servicio,
          r.longitud_inicio_servicio,
          r.latitud_termino_servicio,
          r.longitud_termino_servicio,
          r.horas_operadas,
          r.horas_standby,
          r.horas_standby_cliente,
          r.horas_standby_gsp,
          r.motivo_standby,
          r.horas_colacion,
          r.horas_minimas,
          r.horas_facturables,
          r.horas_sobretiempo,
          r.horometro_inicio,
          r.horometro_termino,
          r.odometro_inicio,
          r.odometro_termino,
          r.foto_tablero_inicio,
          r.foto_tablero_termino,
          r.foto_odometro_inicio,
          r.foto_odometro_termino,
          r.foto_horometro,
          r.notas_mecanicas_gsp,
          r.observacion_trabajo,
          r.cliente_nombre,
          r.cliente_rut,
          r.cliente_cargo,
          r.cliente_firma_canvas_base64,
          r.token_report,
          r.estado_reporte,
          r.estado_jornada,
          r.fecha_registro,
          r.fecha_validacion,
          r.fecha_firma_fes,
          r.codigo_validacion_fes,
          r.id_doc_pdf,
          r.obs_validador,
          e.patente AS equipo_patente,
          e.modelo AS equipo_modelo,
          COALESCE(u_op.name_frst || ' ' || u_op.apellido_pat, 'Operador') AS operador_nombre,
          CASE WHEN r.id_user_rigger IS NOT NULL THEN (u_rig.name_frst || ' ' || u_rig.apellido_pat) ELSE NULL END AS rigger_nombre,
          COALESCE(u_val.name_frst || ' ' || u_val.apellido_pat, 'Analista GSP') AS validador_nombre,
          p.codi_proyecto,
          COALESCE(p.json_field->'crm_v1'->>'obra_nombre', p.json_field->>'obra_nombre', p.nombre_proyecto, 'Faena') AS obra_nombre,
          p.json_field AS proyecto_json
        FROM tedp_reporte_avance r
        JOIN tpry_proyecto p ON r.id_proyecto = p.id_proyecto
        LEFT JOIN tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
        LEFT JOIN tequ_equipo e ON r.id_equipo = e.id_equipo
        LEFT JOIN tsec_users u_op ON r.id_user_operador = u_op.id_user
        LEFT JOIN tsec_users u_rig ON r.id_user_rigger = u_rig.id_user
        LEFT JOIN tsec_users u_val ON r.id_user_validador = u_val.id_user
        WHERE r.id_proyecto = $1
        ORDER BY r.fecha_reporte ASC, r.dia_correlativo ASC;
      `;
      const [result, viajesRes, catalogoTarifas] = await Promise.all([
        db.query(sql, [id_proyecto]),
        db.query('SELECT * FROM tequ_log_desplazamiento WHERE id_proyecto = $1 ORDER BY id_log_desplazamiento ASC', [id_proyecto]),
        obtenerTarifasDesdeBD()
      ]);
      const viajesProyecto = viajesRes.rows || [];
      const rowsEnriquecidos = result.rows.map(r => {
        const { proyecto_json, ...rest } = r;
        const fIso = r.fecha_reporte_iso || (r.fecha_reporte ? new Date(r.fecha_reporte).toISOString().split('T')[0] : '');
        const docsFecha = Array.isArray(proyecto_json?.documentos_por_dia?.[fIso]) ? proyecto_json.documentos_por_dia[fIso] : [];
        const docsRep = Array.isArray(r.ajustes_analista?.documentos_dia) ? r.ajustes_analista.documentos_dia : [];
        const vistos = new Set();
        const documentosDia = [];
        for (const d of [...docsFecha, ...docsRep]) {
          if (!d) continue;
          const k = d.id_doc ? `id:${d.id_doc}` : `nm:${d.nombre_archivo || d.titulo}`;
          if (!vistos.has(k)) {
            vistos.add(k);
            documentosDia.push(d);
          }
        }
        return {
          ...rest,
          documentos_dia: documentosDia,
          liquidacion_personal_dia: construirLiquidacionPersonalDiaReport({
            rep: r,
            proyectoJson: proyecto_json,
            viajesProyecto,
            catalogoTarifas
          })
        };
      });
      res.json({ success: true, data: rowsEnriquecidos });
    } catch (err) {
      console.error('Error al obtener reports de proyecto:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 2.1 Obtener bandeja consolidada de pendientes para el Analista de Control de Gestión (PMO)
  async getPendientesAnalista(req, res) {
    try {
      // 1. Reports de terreno (pendientes primero, luego validados recientes)
      const repsQuery = `
        SELECT 
          ra.id_reporte_avance,
          ra.id_proyecto,
          ra.id_equipo,
          ra.id_user_operador,
          ra.id_user_rigger,
          ra.dia_correlativo,
          ra.fecha_reporte,
          ra.fecha_inicio_servicio,
          ra.fecha_termino_servicio,
          to_char(ra.fecha_inicio_servicio AT TIME ZONE 'America/Santiago', 'HH24:MI') AS hora_inicio,
          to_char(ra.fecha_termino_servicio AT TIME ZONE 'America/Santiago', 'HH24:MI') AS hora_termino,
          ra.horas_operadas,
          ra.horas_facturables,
          ra.horas_minimas,
          ra.horas_colacion,
          ra.horometro_inicio,
          ra.horometro_termino,
          ra.odometro_inicio,
          ra.odometro_termino,
          ra.foto_horometro,
          ra.foto_tablero_inicio,
          ra.foto_tablero_termino,
          ra.cliente_nombre,
          ra.cliente_rut,
          ra.cliente_cargo,
          ra.cliente_firma_canvas_base64,
          ra.latitud_inicio_servicio,
          ra.longitud_inicio_servicio,
          ra.accuracy_firma,
          ra.estado_reporte,
          ra.fecha_registro,
          ra.fecha_validacion,
          ra.fecha_firma_fes,
          ra.codigo_validacion_fes,
          ra.id_doc_pdf,
          ra.obs_validador,
          ra.observacion_trabajo,
          ra.notas_mecanicas_gsp,
          ra.ajustes_analista,
          p.codi_proyecto,
          p.json_field AS proyecto_json,
          COALESCE(p.nombre_proyecto, 'Servicio') AS nombre_proyecto,
          COALESCE(clt.razon_social, clt.name_empresa, p.json_field->'crm_v1'->>'cliente_nombre', 'Cliente') AS cliente_nombre,
          COALESCE(p.json_field->'crm_v1'->>'obra_nombre', p.json_field->>'obra_nombre', 'Faena') AS obra_nombre,
          COALESCE(e.patente, 'S/P') AS equipo_patente,
          COALESCE(e.modelo, '') AS equipo_modelo,
          COALESCE(u_op.name_frst || ' ' || u_op.apellido_pat, 'Operador') AS operador_nombre,
          CASE WHEN ra.id_user_rigger IS NOT NULL THEN (u_rig.name_frst || ' ' || u_rig.apellido_pat) ELSE NULL END AS rigger_nombre,
          COALESCE(u_val.name_frst || ' ' || u_val.apellido_pat, 'Analista GSP') AS validador_nombre
        FROM tedp_reporte_avance ra
        LEFT JOIN tpry_proyecto p ON ra.id_proyecto = p.id_proyecto
        LEFT JOIN tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
        LEFT JOIN tequ_equipo e ON ra.id_equipo = e.id_equipo
        LEFT JOIN tsec_users u_op ON ra.id_user_operador = u_op.id_user
        LEFT JOIN tsec_users u_rig ON ra.id_user_rigger = u_rig.id_user
        LEFT JOIN tsec_users u_val ON ra.id_user_validador = u_val.id_user
        ORDER BY 
          CASE WHEN ra.estado_reporte = 'PENDIENTE_VALIDACION' THEN 0 ELSE 1 END,
          ra.fecha_reporte DESC,
          ra.id_reporte_avance DESC
        LIMIT 50;
      `;
      const [repsRes, catalogoTarifas] = await Promise.all([
        db.query(repsQuery),
        obtenerTarifasDesdeBD()
      ]);

      const pryIds = [...new Set(repsRes.rows.map(r => r.id_proyecto).filter(Boolean))];
      const viajesPorProyecto = {};
      if (pryIds.length > 0) {
        const vRes = await db.query(
          'SELECT * FROM tequ_log_desplazamiento WHERE id_proyecto = ANY($1::int[]) ORDER BY id_log_desplazamiento ASC',
          [pryIds]
        );
        for (const v of vRes.rows) {
          if (!viajesPorProyecto[v.id_proyecto]) viajesPorProyecto[v.id_proyecto] = [];
          viajesPorProyecto[v.id_proyecto].push(v);
        }
      }

      const reportsEnriquecidos = repsRes.rows.map(r => {
        const { proyecto_json, ...rest } = r;
        return {
          ...rest,
          liquidacion_personal_dia: construirLiquidacionPersonalDiaReport({
            rep: r,
            proyectoJson: proyecto_json,
            viajesProyecto: viajesPorProyecto[r.id_proyecto] || [],
            catalogoTarifas
          })
        };
      });

      // 2. OTs en ejecución o terminadas con su estado de EDP (independiente de ITS) y Liquidación
      const otsQuery = `
        SELECT 
          p.id_proyecto,
          p.codi_proyecto,
          p.nombre_proyecto,
          p.id_proyecto_estado,
          p.json_field,
          COALESCE(clt.razon_social, clt.name_empresa, p.json_field->'crm_v1'->>'cliente_nombre', 'Cliente') AS cliente_nombre,
          COALESCE(p.json_field->'crm_v1'->>'obra_nombre', p.json_field->>'obra_nombre', 'Faena') AS obra_nombre,
          its.id_its,
          its.folio_its,
          its.estado_its,
          COALESCE(its.total_ingresos_facturables, 0) AS total_ingresos_facturables,
          COALESCE(its.total_costos_operacionales, 0) AS total_costos_operacionales,
          COALESCE(its.utilidad_bruta, 0) AS utilidad_bruta,
          COALESCE(its.margen_porcentaje, 0) AS margen_porcentaje,
          COUNT(ra.id_reporte_avance) FILTER (WHERE ra.estado_reporte = 'VALIDADO_ANALISTA') AS reports_validados,
          COUNT(ra.id_reporte_avance) FILTER (WHERE ra.estado_reporte = 'PENDIENTE_VALIDACION') AS reports_pendientes,
          COUNT(ra.id_reporte_avance) AS total_reports
        FROM tpry_proyecto p
        LEFT JOIN tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
        LEFT JOIN tits_informe_termino its ON p.id_proyecto = its.id_proyecto
        LEFT JOIN tedp_reporte_avance ra ON p.id_proyecto = ra.id_proyecto
        WHERE p.id_proyecto_estado >= 4
        GROUP BY p.id_proyecto, p.codi_proyecto, p.nombre_proyecto, p.id_proyecto_estado, clt.razon_social, clt.name_empresa, p.json_field, its.id_its, its.folio_its, its.estado_its, its.total_ingresos_facturables, its.total_costos_operacionales, its.utilidad_bruta, its.margen_porcentaje
        ORDER BY p.id_proyecto DESC
        LIMIT 50;
      `;
      const otsRes = await db.query(otsQuery);

      const otsEnriquecidas = otsRes.rows.map(o => {
        const jf = typeof o.json_field === 'string' ? JSON.parse(o.json_field || '{}') : (o.json_field || {});
        const crmV1 = jf.crm_v1 || {};
        const edpFlujo = jf.edp_flujo_v1 || null;
        const requiereOc = Boolean(crmV1.requiere_oc_hes ?? jf.datos_generales?.requiere_oc_hes ?? false);
        const ocs = Array.isArray(jf.ordenes_compra)
          ? jf.ordenes_compra
          : (Array.isArray(crmV1.ordenes_compra) ? crmV1.ordenes_compra : []);
        const tieneOc = ocs.length > 0 || Boolean(jf.oc_v1?.numero_oc);
        const numeroOcPrincipal = jf.oc_v1?.numero_oc || ocs[0]?.numero_oc || null;
        const montoTotalOcs = ocs.reduce((acc, item) => acc + (Number(item.monto_neto) || 0), 0) || Number(jf.oc_v1?.monto_neto || 0);
        const edpValidado = Boolean(edpFlujo?.firma_2_contabilidad || edpFlujo?.firma_1_analista);
        const habilitadoFacturar = Boolean(edpValidado && (!requiereOc || tieneOc));
        const montoCotizadoNeto = Number(crmV1.total_neto || jf.snapshot_comercial?.total_neto || o.total_ingresos_facturables || 0);

        return {
          ...o,
          total_ingresos_facturables: Number(o.total_ingresos_facturables) > 0 ? Number(o.total_ingresos_facturables) : montoCotizadoNeto,
          edp_flujo_v1: edpFlujo,
          estado_edp: edpFlujo?.estado || (jf.liquidacion_v1?.factura_numero ? 'FACTURADO' : 'BORRADOR'),
          requiere_oc_hes: requiereOc,
          tiene_oc: tieneOc,
          numero_oc_principal: numeroOcPrincipal,
          monto_total_ocs: montoTotalOcs,
          ordenes_compra: ocs,
          factura_numero: jf.liquidacion_v1?.factura_numero || null,
          habilitado_facturar: habilitadoFacturar
        };
      });

      // 3. Métricas y KPIs consolidados (EDP desacoplado de ITS)
      const pendientesVal = repsRes.rows.filter(r => r.estado_reporte === 'PENDIENTE_VALIDACION').length;
      const conAjustes = repsRes.rows.filter(r => r.ajustes_analista?.modificado).length;
      const otsSinIts = otsEnriquecidas.filter(o => !o.id_its || o.estado_its === 'BORRADOR').length;
      const itsEnAprobacion = otsEnriquecidas.filter(o => ['EN_REVISION_OPERACIONES', 'EN_REVISION_CONTABILIDAD'].includes(o.estado_its)).length;
      const edpListoFacturar = otsEnriquecidas.filter(o => o.habilitado_facturar || o.estado_its === 'CONCLUIDO' || o.edp_flujo_v1?.firma_1_analista).length;

      res.json({
        success: true,
        data: {
          kpis: {
            reports_pendientes: pendientesVal,
            reports_con_ajustes: conAjustes,
            ots_sin_its: otsSinIts,
            its_en_aprobacion: itsEnAprobacion,
            edp_listos_facturar: edpListoFacturar
          },
          reports: reportsEnriquecidos,
          ots_liquidacion: otsEnriquecidas
        }
      });
    } catch (err) {
      console.error('Error al obtener pendientes del analista:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 2.2 Obtener reports pendientes y concluidos para el operador en PWA (Spec 57 / REQ-025)
  async getReportsPendientesUsuario(req, res) {
    try {
      const id_user = req.user?.id_user || req.query.id_user;
      if (!id_user) {
        return res.status(400).json({ error: 'id_user es requerido' });
      }

      const sql = `
        SELECT DISTINCT
          p.id_proyecto,
          p.codi_proyecto,
          p.nombre_proyecto,
          p.id_proyecto_estado,
          p.json_field,
          COALESCE(clt.razon_social, clt.name_empresa, p.json_field->>'cliente_nombre', 'Cliente Mandante') AS cliente_nombre,
          COALESCE(p.json_field->>'obra_nombre', p.json_field->'crm_v1'->>'obra_nombre', 'Faena') AS obra_nombre,
          COALESCE(p.json_field->>'obra_direccion', p.json_field->'crm_v1'->>'obra_direccion', 'Faena') AS obra_direccion,
          v.id_equipo,
          v.patente,
          v.estado_trayecto
        FROM tpry_proyecto p
        LEFT JOIN tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
        LEFT JOIN tequ_log_desplazamiento v ON p.id_proyecto = v.id_proyecto AND v.id_user_chofer = $1
        WHERE (
          v.id_user_chofer = $1
          OR (p.json_field->'ejecucion_v1'->>'operador_id')::text = $1::text
          OR (p.json_field->'ejecucion_v1'->>'rigger_id')::text = $1::text
          OR EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(
              CASE 
                WHEN jsonb_typeof(p.json_field->'ejecucion_v1'->'tripulacion_asignada') = 'array' 
                THEN p.json_field->'ejecucion_v1'->'tripulacion_asignada' 
                ELSE '[]'::jsonb 
              END
            ) elem 
            WHERE (elem->>'id_user')::text = $1::text
          )
          OR EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(
              CASE 
                WHEN jsonb_typeof(p.json_field->'crm_v1'->'lineas_servicio') = 'array' 
                THEN p.json_field->'crm_v1'->'lineas_servicio' 
                ELSE '[]'::jsonb 
              END
            ) l 
            WHERE (l->>'operador_asignado_id')::text = $1::text
               OR (l->>'rigger_asignado_id')::text = $1::text
               OR (l->>'chofer_asignado_id')::text = $1::text
          )
          OR EXISTS (
            SELECT 1 
            FROM tedp_reporte_avance ra 
            WHERE ra.id_proyecto = p.id_proyecto 
              AND (ra.id_user_operador = $1 OR ra.id_user_rigger = $1)
          )
        )
        AND p.id_proyecto_estado IN (4, 5, 6)
        ORDER BY p.id_proyecto DESC;
      `;
      const resProy = await db.query(sql, [id_user]);

      const hoyStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
      const pendientes = [];
      const concluidos = [];
      const proyectosVistos = new Set(); // REQ-1060: una sola fila por OT (el LEFT JOIN a viajes puede duplicar)

      for (const r of resProy.rows) {
        if (proyectosVistos.has(Number(r.id_proyecto))) continue;
        proyectosVistos.add(Number(r.id_proyecto));
        const jf = r.json_field || {};
        const crm = jf.crm_v1 || {};
        const lines = crm.lineas_servicio || [];

        // Consultar reportes existentes para la OT que consumen cuota (excluyendo FLETE)
        const repRes = await db.query(
          `SELECT id_reporte_avance, dia_correlativo, fecha_reporte, estado_reporte, estado_jornada
           FROM tedp_reporte_avance
           WHERE id_proyecto = $1 
             AND estado_reporte != 'JORNADA_EN_CURSO'
             AND (token_report IS NULL OR token_report NOT LIKE 'FLT-%')
           ORDER BY dia_correlativo ASC`,
          [r.id_proyecto]
        );
        const reportes = repRes.rows;
        const cantReportes = reportes.length;
        const maxDiaReport = reportes.reduce((m, x) => Math.max(m, Number(x.dia_correlativo || 0)), 0);

        // Calcular total de días autorizados de la OT (Spec 63 / REQ-042)
        const totalDias = calcularCupoDiasHabiles(r, maxDiaReport);

        // Verificar si hoy ya fue reportado
        const reportadoHoy = reportes.some(x => {
          if (!x.fecha_reporte) return false;
          const f = new Date(x.fecha_reporte).toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
          return f === hoyStr;
        });

        // Resolver primero el equipo específicamente asignado a este id_user en la OT
        const ejec = jf.ejecucion_v1 || {};
        const trip = Array.isArray(ejec.tripulacion_asignada) ? ejec.tripulacion_asignada : [];
        const extras = Array.isArray(ejec.equipos_extra) ? ejec.equipos_extra : [];
        const inspPatio = ejec.preparacion_salida?.inspecciones_patio || {};
        const uidNum = Number(id_user);

        let idEquipoUsuario = null;
        const lineaUser = lines.find(l => Number(l.operador_asignado_id || l.chofer_asignado_id) === uidNum && Number(l.equipo_asignado_id || l.id_equipo));
        if (lineaUser) {
          idEquipoUsuario = Number(lineaUser.equipo_asignado_id || lineaUser.id_equipo);
        }
        if (!idEquipoUsuario) {
          const tripUser = trip.find(t => Number(t.id_user) === uidNum && Number(t.equipo_asignado_id || t.id_equipo));
          if (tripUser) idEquipoUsuario = Number(tripUser.equipo_asignado_id || tripUser.id_equipo);
        }
        if (!idEquipoUsuario) {
          const extraUser = extras.find(ex => Number(ex.chofer_id || ex.operador_id || ex.id_user) === uidNum && Number(ex.id_equipo || ex.equipo_asignado_id));
          if (extraUser) idEquipoUsuario = Number(extraUser.id_equipo || extraUser.equipo_asignado_id);
        }
        if (!idEquipoUsuario) {
          for (const [kEq, vObj] of Object.entries(inspPatio)) {
            if (Number(vObj?.operador_id) === uidNum && Number(kEq)) {
              idEquipoUsuario = Number(kEq);
              break;
            }
          }
        }
        if (!idEquipoUsuario && Number(ejec.operador_id) === uidNum && Number(ejec.equipo_id)) {
          idEquipoUsuario = Number(ejec.equipo_id);
        }
        if (!idEquipoUsuario && r.id_equipo) {
          idEquipoUsuario = Number(r.id_equipo);
        }

        // REQ-1060 / SPEC-088: Jornada activa con el resolvedor canónico (mismo criterio que la vista del Report)
        let { jornada: jornadaCanon } = await resolverJornadaActiva(db, r.id_proyecto, { id_user: uidNum, id_equipo: idEquipoUsuario });
        // En OTs multi-grúa, la jornada de OTRO operador o de OTRO equipo no se le presenta a este usuario como propia
        if (jornadaCanon) {
          const esOtroOperador = jornadaCanon.id_user_operador && Number(jornadaCanon.id_user_operador) !== uidNum;
          const esOtroEquipo = idEquipoUsuario && jornadaCanon.id_equipo && Number(jornadaCanon.id_equipo) !== idEquipoUsuario;
          if (esOtroOperador || esOtroEquipo) {
            const cntEq = await db.query('SELECT COUNT(DISTINCT id_equipo) AS n FROM tpry_rel_equipo WHERE id_proyecto = $1', [r.id_proyecto]);
            if (Number(cntEq.rows[0]?.n || 0) > 1 || esOtroEquipo) jornadaCanon = null;
          }
        }
        const jornadaEnCurso = Boolean(jornadaCanon);

        // REQ-1060 / INV-4: equipo canónico = jornada abierta propia > equipo asignado al usuario > tpry_rel_equipo > línea CRM
        let idEquipo = null;
        let patente = null;
        if (jornadaCanon?.id_equipo) {
          idEquipo = Number(jornadaCanon.id_equipo);
        } else if (idEquipoUsuario) {
          idEquipo = idEquipoUsuario;
        } else {
          const relEqRes = await db.query(
            `SELECT re.id_equipo FROM tpry_rel_equipo re WHERE re.id_proyecto = $1 ORDER BY re.id_equipo ASC LIMIT 1`,
            [r.id_proyecto]
          );
          if (relEqRes.rows.length > 0) {
            idEquipo = Number(relEqRes.rows[0].id_equipo);
          } else {
            const firstCrane = lines.find(l => (l.tipo || '').toUpperCase().includes('GRUA') && l.equipo_asignado_id);
            if (firstCrane?.equipo_asignado_id) {
              idEquipo = Number(firstCrane.equipo_asignado_id);
            }
          }
        }
        if (idEquipo && !patente) {
          const eqRes = await db.query('SELECT patente FROM tequ_equipo WHERE id_equipo = $1', [idEquipo]);
          if (eqRes.rows.length > 0) patente = eqRes.rows[0].patente;
        }
        const jEnCursoRes = { rows: jornadaCanon ? [{
          id_reporte_avance: jornadaCanon.id_reporte_avance,
          id_equipo: jornadaCanon.id_equipo,
          dia_correlativo: jornadaCanon.dia_correlativo,
          fecha_inicio_servicio: jornadaCanon.fecha_inicio_servicio,
          fecha_reporte_str: jornadaCanon.fecha_reporte_str,
          hora_inicio_str: jornadaCanon.hora_inicio_str,
          es_dia_anterior: jornadaCanon.es_dia_anterior,
          horometro_inicio: jornadaCanon.horometro_inicio
        }] : [] };

        const item = {
          id_proyecto: r.id_proyecto,
          codi_proyecto: r.codi_proyecto,
          nombre_proyecto: r.nombre_proyecto,
          cliente_nombre: r.cliente_nombre,
          obra_nombre: r.obra_nombre,
          obra_direccion: r.obra_direccion,
          id_equipo: idEquipo,
          patente: patente || 'S/P',
          total_dias: totalDias,
          dias_reportados: cantReportes,
          dia_a_reportar: cantReportes + 1,
          reportado_hoy: reportadoHoy,
          jornada_en_curso: jornadaEnCurso,
          jornada_datos: jornadaEnCurso ? jEnCursoRes.rows[0] : null,
          id_reporte_avance_activo: jornadaEnCurso ? jEnCursoRes.rows[0].id_reporte_avance : null,
          estado_trayecto: r.estado_trayecto || 'ARRIBADO'
        };

        if (jornadaEnCurso) {
          item.puede_reportar = true;
          item.motivo = 'JORNADA_EN_CURSO';
          const horaIniStr = jEnCursoRes.rows[0].hora_inicio_str || '08:00';
          item.mensaje = jEnCursoRes.rows[0].es_dia_anterior
            ? `Jornada del ${jEnCursoRes.rows[0].fecha_reporte_str} SIN CERRAR (iniciada ${horaIniStr}). Registre su término y firma con mandante.`
            : `Jornada en curso (iniciada ${horaIniStr}). Pendiente registrar término y firmar report con mandante.`;
          pendientes.push(item);
        } else if (cantReportes >= totalDias) {
          item.puede_reportar = false;
          item.motivo = 'SERVICIO_CONCLUIDO';
          item.mensaje = `Faena concluida (${cantReportes} de ${totalDias} días reportados).`;
          concluidos.push(item);
        } else if (reportadoHoy) {
          item.puede_reportar = false;
          item.motivo = 'AL_DIA_HOY';
          item.mensaje = `Jornada de hoy reportada conforme. Siguiente reporte: Día ${cantReportes + 1} mañana.`;
          concluidos.push(item);
        } else {
          item.puede_reportar = true;
          item.motivo = 'PENDIENTE';
          item.mensaje = `Pendiente Reporte: Día ${cantReportes + 1} de ${totalDias}.`;
          pendientes.push(item);
        }
      }

      res.json({
        success: true,
        pendientes,
        concluidos,
        total_pendientes: pendientes.length,
        total_concluidos: concluidos.length
      });
    } catch (err) {
      console.error('Error al obtener reports pendientes del usuario:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 3. Guardar y Sellar Report Diario emitido desde PWA (Momento 2 + Report Mandante)
  async guardarReportDiario(req, res) {
    try {
      let {
        id_reporte_avance,
        id_proyecto,
        id_equipo,
        id_user_operador,
        id_user_rigger,
        dia_correlativo,
        fecha_reporte,
        hora_inicio,
        hora_termino,
        horas_colacion,
        horas_operadas,
        horas_minimas,
        horas_facturables,
        horas_sobretiempo,
        horometro_inicio,
        horometro_termino,
        odometro_inicio,
        odometro_termino,
        foto_tablero_inicio,
        foto_tablero_termino,
        foto_odometro_inicio,
        foto_odometro_termino,
        foto_horometro,
        notas_mecanicas_gsp,
        observacion_trabajo,
        cliente_nombre,
        cliente_rut,
        cliente_cargo,
        cliente_firma_canvas_base64,
        latitud_inicio_servicio,
        longitud_inicio_servicio,
        accuracy_firma,
        horas_standby_cliente,
        horas_standby_gsp,
        motivo_standby
      } = req.body;

      // Normalización de campos alias desde Hoja de Ruta móvil
      dia_correlativo = dia_correlativo || req.body.dia || 1;
      fecha_reporte = fecha_reporte || req.body.fecha || fechaHoyChile(); // REQ-1060 / INV-7: fecha local Chile
      horometro_termino = horometro_termino !== undefined ? horometro_termino : req.body.horometro_final;
      odometro_termino = odometro_termino !== undefined ? odometro_termino : req.body.odometro_final;
      cliente_nombre = cliente_nombre || req.body.mandante_nombre || 'Supervisor Mandante';
      cliente_rut = cliente_rut || req.body.mandante_rut || '';
      cliente_cargo = cliente_cargo || req.body.mandante_cargo || 'ITO Mandante';
      cliente_firma_canvas_base64 = cliente_firma_canvas_base64 || req.body.firma_mandante;
      observacion_trabajo = observacion_trabajo || req.body.maniobra_detalle || '';
      horas_operadas = horas_operadas !== undefined ? horas_operadas : (req.body.horas_efectivas || 0);
      horas_standby_cliente = Number(horas_standby_cliente || req.body.horas_standby || 0);
      horas_standby_gsp = Number(horas_standby_gsp || 0);
      motivo_standby = motivo_standby || req.body.motivo_standby || null;
      if (horas_colacion === undefined && req.body.colacion_minutos !== undefined) {
        horas_colacion = Number((Number(req.body.colacion_minutos) / 60).toFixed(2));
      }
      if (!latitud_inicio_servicio && req.body.gps_sellado?.latitud) {
        latitud_inicio_servicio = req.body.gps_sellado.latitud;
        longitud_inicio_servicio = req.body.gps_sellado.longitud;
      }

      // Si falta id_proyecto o id_user_operador, resolver por token_viaje
      const tokenViajeRef = req.body.token_viaje || req.params?.token;
      if ((!id_proyecto || !id_user_operador || !id_equipo) && tokenViajeRef) {
        try {
          const vRes = await db.query(
            'SELECT id_proyecto, id_equipo, id_user_chofer FROM tequ_log_desplazamiento WHERE token_viaje = $1 LIMIT 1',
            [tokenViajeRef]
          );
          if (vRes.rows.length > 0) {
            id_proyecto = id_proyecto || vRes.rows[0].id_proyecto;
            id_equipo = id_equipo || vRes.rows[0].id_equipo;
            id_user_operador = id_user_operador || vRes.rows[0].id_user_chofer;
          }
        } catch (tokErr) {
          console.warn('[Report] Error resolviendo contexto por token_viaje:', tokErr.message);
        }
      }
      // REQ-1060 / INV-8: sin operador "por defecto" (antes || 55). Si no se puede resolver, se rechaza.
      if (!id_proyecto || !fecha_reporte || !id_user_operador) {
        return res.status(400).json({
          success: false,
          codigo: 'OPERADOR_REQUERIDO',
          error: 'id_proyecto, fecha_reporte y id_user_operador son obligatorios (no se asigna operador por defecto)'
        });
      }

      // REQ-1060 / INV-5: si no viene id_reporte_avance, ADOPTAR la jornada abierta de la OT/equipo (nunca duplicar)
      if (!id_reporte_avance) {
        try {
          const { jornada: jAdoptar } = await resolverJornadaActiva(db, id_proyecto, {
            id_equipo: id_equipo || null,
            id_user: id_user_operador
          });
          const mismaFecha = jAdoptar && jAdoptar.fecha_reporte_str === String(fecha_reporte).split('T')[0];
          if (jAdoptar && mismaFecha && (!id_equipo || Number(jAdoptar.id_equipo) === Number(id_equipo) || Number(jAdoptar.id_user_operador) === Number(id_user_operador))) {
            id_reporte_avance = jAdoptar.id_reporte_avance;
            id_equipo = jAdoptar.id_equipo || id_equipo;
            console.warn(`[REQ-1060][ADOPCION] OT ${id_proyecto}: /report/guardar sin id_reporte_avance adopta jornada abierta ${id_reporte_avance} (eq ${id_equipo}).`);
          }
        } catch (adErr) {
          console.error('[REQ-1060][ADOPCION] Error resolviendo jornada abierta:', adErr.message);
        }
      }

      const deviceTs = req.body.device_timestamp ? new Date(req.body.device_timestamp) : null;

      // Validación estricta de cuota de días autorizados fail-closed (Spec 63 / REQ-042)
      try {
        const proyDiasRes = await db.query(
          'SELECT json_field, fecha_plan_ini, fecha_plan_fin FROM tpry_proyecto WHERE id_proyecto = $1',
          [id_proyecto]
        );
        if (proyDiasRes.rows.length > 0) {
          const totalDiasPermitidos = calcularCupoDiasHabiles(proyDiasRes.rows[0]);
          const totalExistentes = await getReportesConsumidosOT(id_proyecto, db);

          let esNuevoConsumo = true;
          if (id_reporte_avance) {
            const checkActual = await db.query(
              'SELECT estado_reporte FROM tedp_reporte_avance WHERE id_reporte_avance = $1',
              [id_reporte_avance]
            );
            if (checkActual.rows.length > 0 && checkActual.rows[0].estado_reporte !== 'JORNADA_EN_CURSO') {
              esNuevoConsumo = false; // Ya consumía cuota previamente
            }
          }

          if (esNuevoConsumo && totalExistentes >= totalDiasPermitidos) {
            return res.status(403).json({
              success: false,
              codigo: 'SERVICIO_CONCLUIDO',
              error: `Operación bloqueada por término de faena: Esta orden de trabajo ya completó sus ${totalDiasPermitidos} jornada(s) autorizadas (${totalExistentes} reportes finalizados). No es posible emitir nuevos reportes.`
            });
          }
        }
      } catch (checkErr) {
        console.error('[Candado FAIL-CLOSED] Error comprobando cuota de días:', checkErr.message);
        return res.status(500).json({
          success: false,
          error: 'Error de validación de cuota operacional: ' + checkErr.message
        });
      }

      if (!cliente_firma_canvas_base64) {
        return res.status(400).json({ error: 'La firma manual del mandante es obligatoria para emitir el report' });
      }

      const fotoHorometroFinal = foto_tablero_termino || foto_tablero_inicio || foto_horometro || null;

      const fechaBase = fecha_reporte.split('T')[0];
      hora_inicio = hora_inicio || req.body.hora_inicio || '08:00';
      hora_termino = hora_termino || req.body.hora_termino || '18:00';

      const fecha_inicio_servicio = hora_inicio ? `${fechaBase} ${hora_inicio}:00` : null;
      const fecha_termino_servicio = hora_termino ? `${fechaBase} ${hora_termino}:00` : null;

      // Garantizar coherencia contractual del piso mínimo (lineas_servicio de la OT según Estructurador)
      let regimenOperacionalOT = 'URBANO';
      try {
        const pryRes = await db.query('SELECT json_field FROM tpry_proyecto WHERE id_proyecto = $1', [id_proyecto]);
        if (pryRes.rows.length > 0) {
          const jfProy = pryRes.rows[0].json_field || {};
          const distKmOT = Number(jfProy.crm_v1?.distancia_km ?? jfProy.ejecucion_v1?.servicio?.distancia_km ?? jfProy.distancia_km ?? 0);
          const regExpOT = String(
            jfProy.ejecucion_v1?.regimen_operacional ||
            jfProy.crm_v1?.regimen_operacional ||
            jfProy.crm_v1?.tipo_contexto ||
            ''
          ).toUpperCase();
          regimenOperacionalOT = (regExpOT === 'RURAL' || regExpOT === 'URBANO')
            ? regExpOT
            : (distKmOT > 30 ? 'RURAL' : 'URBANO');

          horas_minimas = resolverPisoMinimoContractualOT(jfProy, id_equipo);
        }
      } catch (e) {
        console.warn('Error resolviendo pisoMinimo en guardarReportDiario:', e.message);
      }
      horas_minimas = (horas_minimas !== undefined && horas_minimas !== null && String(horas_minimas).trim() !== '' && !Number.isNaN(Number(horas_minimas)))
        ? Number(horas_minimas)
        : 8.0;

      // Si se enviaron tiempos de salida/llegada de patio en el payload, sincronizar en tequ_log_desplazamiento para trazabilidad integral (Report + ITS + RRHH)
      if (req.body.hora_salida_patio || req.body.hora_llegada_patio) {
        try {
          const tsSalidaPatio = req.body.hora_salida_patio ? `${fechaBase} ${req.body.hora_salida_patio}:00` : null;
          const tsLlegadaFaena = (req.body.hora_llegada_faena || hora_inicio) ? `${fechaBase} ${req.body.hora_llegada_faena || hora_inicio}:00` : null;
          const tsSalidaFaena = (req.body.hora_salida_faena || hora_termino) ? `${fechaBase} ${req.body.hora_salida_faena || hora_termino}:00` : null;
          const tsLlegadaPatio = req.body.hora_llegada_patio ? `${fechaBase} ${req.body.hora_llegada_patio}:00` : null;
          const exViaje = await db.query(
            `SELECT id_log_desplazamiento FROM tequ_log_desplazamiento
             WHERE id_proyecto = $1
               AND TO_CHAR(COALESCE(fecha_salida_patio, fecha_llegada_faena, fecha_programada, fecha_registro) AT TIME ZONE 'America/Santiago', 'YYYY-MM-DD') = $2
               AND ($3::int IS NULL OR id_equipo = $3)
             ORDER BY id_log_desplazamiento ASC LIMIT 1`,
            [id_proyecto, fechaBase, id_equipo || null]
          );
          if (exViaje.rows.length > 0) {
            await db.query(
              `UPDATE tequ_log_desplazamiento SET
                 fecha_salida_patio = COALESCE($1::timestamptz, fecha_salida_patio),
                 fecha_llegada_faena = COALESCE($2::timestamptz, fecha_llegada_faena),
                 fecha_salida_faena = COALESCE($3::timestamptz, fecha_salida_faena),
                 fecha_llegada_patio = COALESCE($4::timestamptz, fecha_llegada_patio),
                 tipo_trayecto = 'IDA_Y_VUELTA',
                 estado_trayecto = 'FINALIZADO'
               WHERE id_log_desplazamiento = $5`,
              [tsSalidaPatio, tsLlegadaFaena, tsSalidaFaena, tsLlegadaPatio, exViaje.rows[0].id_log_desplazamiento]
            );
          } else {
            await db.query(
              `INSERT INTO tequ_log_desplazamiento (
                 id_proyecto, id_equipo, id_user_chofer, tipo_trayecto, estado_trayecto,
                 fecha_salida_patio, fecha_llegada_faena, fecha_salida_faena, fecha_llegada_patio, fecha_programada
               ) VALUES ($1, $2, $3, 'IDA_Y_VUELTA', 'FINALIZADO', $4::timestamptz, $5::timestamptz, $6::timestamptz, $7::timestamptz, $4::timestamptz)`,
              [id_proyecto, id_equipo || null, id_user_operador || null, tsSalidaPatio, tsLlegadaFaena, tsSalidaFaena, tsLlegadaPatio]
            );
          }
        } catch (errSyncViaje) {
          console.warn('Aviso sincronizando tequ_log_desplazamiento en guardarReportDiario:', errSyncViaje.message);
        }
      }

      // Política Urbana: se cobra al cliente desde la salida de la base hasta el término del servicio
      let horasCobroClienteBase = Number(horas_operadas || 0);
      if (regimenOperacionalOT === 'URBANO' && hora_termino) {
        let horaSalidaBase = req.body.hora_salida_patio || null;
        if (!horaSalidaBase) {
          try {
            const idaRes = await db.query(
              `SELECT TO_CHAR(fecha_salida_patio AT TIME ZONE 'America/Santiago', 'HH24:MI') AS hora_salida_patio
               FROM tequ_log_desplazamiento
               WHERE id_proyecto = $1
                 AND TO_CHAR(COALESCE(fecha_salida_patio, fecha_llegada_faena, fecha_programada, fecha_registro) AT TIME ZONE 'America/Santiago', 'YYYY-MM-DD') = $2
                 AND ($3::int IS NULL OR id_equipo = $3)
                 AND fecha_salida_patio IS NOT NULL
               ORDER BY id_log_desplazamiento ASC LIMIT 1`,
              [id_proyecto, fechaBase, id_equipo || null]
            );
            horaSalidaBase = idaRes.rows[0]?.hora_salida_patio || null;
          } catch (errUrb) {
            console.warn('Aviso calculando span urbano cliente desde salida base:', errUrb.message);
          }
        }
        if (horaSalidaBase) {
          const spanUrbanoCliente = calcularDiferenciaHoras(horaSalidaBase, hora_termino);
          const colHrs = Number(horas_colacion !== undefined && horas_colacion !== null ? horas_colacion : 1.0);
          if (spanUrbanoCliente > 0) {
            horasCobroClienteBase = Math.max(0, Number((spanUrbanoCliente - colHrs - horas_standby_gsp).toFixed(2)));
          }
        }
      }

      // Recalcular sobretiempo y facturables con base contractual fidedigna (incluyendo Standby Cliente)
      if (horas_operadas !== undefined && Number(horas_operadas) >= 0) {
        const totalComputable = Math.max(Number(horas_operadas), horasCobroClienteBase) + horas_standby_cliente;
        if (horas_minimas <= 0) {
          horas_sobretiempo = 0;
          horas_facturables = Number(totalComputable.toFixed(1));
        } else {
          horas_sobretiempo = Number(Math.max(0, totalComputable - horas_minimas).toFixed(1));
          horas_facturables = Number(Math.max(totalComputable, horas_minimas).toFixed(1));
        }
      }

      let reportGuardado;

      // REQ-1476 / SPEC-006 v1.5: Validación incremental estricta en cierre de Report Diario
      if (horometro_inicio !== undefined && horometro_inicio !== null && horometro_termino !== undefined && horometro_termino !== null) {
        if (Number(horometro_termino) < Number(horometro_inicio)) {
          return res.status(422).json({
            success: false,
            error: `El Horómetro Final (${horometro_termino} hrs) no puede ser menor al Horómetro Inicial (${horometro_inicio} hrs).`
          });
        }
      }
      if (odometro_inicio !== undefined && odometro_inicio !== null && odometro_termino !== undefined && odometro_termino !== null) {
        if (Number(odometro_termino) < Number(odometro_inicio)) {
          return res.status(422).json({
            success: false,
            error: `El Odómetro Final (${odometro_termino} km) no puede ser menor al Odómetro Inicial (${odometro_inicio} km).`
          });
        }
      }

      if (id_reporte_avance) {
        // Actualizar el registro existente de Momento 1
        const updateSql = `
          UPDATE tedp_reporte_avance SET
            id_equipo = $1,
            id_user_operador = $2,
            id_user_rigger = $3,
            dia_correlativo = $4,
            fecha_reporte = $5,
            fecha_inicio_servicio = $6,
            fecha_termino_servicio = $7,
            latitud_inicio_servicio = $8,
            longitud_inicio_servicio = $9,
            accuracy_firma = $10,
            horas_operadas = $11,
            horas_colacion = $12,
            horas_minimas = $13,
            horas_facturables = $14,
            horas_sobretiempo = $15,
            horometro_inicio = $16,
            horometro_termino = $17,
            odometro_inicio = COALESCE($18, odometro_inicio),
            odometro_termino = $19,
            foto_tablero_inicio = COALESCE($20, foto_tablero_inicio),
            foto_tablero_termino = $21,
            foto_odometro_inicio = COALESCE($22, foto_odometro_inicio),
            foto_odometro_termino = $23,
            foto_horometro = $24,
            notas_mecanicas_gsp = $25,
            observacion_trabajo = $26,
            cliente_nombre = $27,
            cliente_rut = $28,
            cliente_cargo = $29,
            cliente_firma_canvas_base64 = $30,
            horas_standby = $31,
            horas_standby_cliente = $32,
            horas_standby_gsp = $33,
            motivo_standby = $34,
            fecha_transmision_termino = CURRENT_TIMESTAMP,
            device_timestamp = COALESCE($35, device_timestamp),
            estado_reporte = 'PENDIENTE_VALIDACION',
            estado_jornada = 'FINALIZADA'
          WHERE id_reporte_avance = $36
          RETURNING *;
        `;
        const upRes = await db.query(updateSql, [
          id_equipo || null,
          id_user_operador,
          id_user_rigger || null,
          dia_correlativo || 1,
          fecha_reporte,
          fecha_inicio_servicio,
          fecha_termino_servicio,
          latitud_inicio_servicio || null,
          longitud_inicio_servicio || null,
          accuracy_firma || null,
          horas_operadas || 0,
          horas_colacion !== undefined && horas_colacion !== null ? horas_colacion : 1,
          horas_minimas || 8.0,
          horas_facturables || 0,
          horas_sobretiempo || 0,
          horometro_inicio || null,
          horometro_termino || null,
          odometro_inicio || null,
          odometro_termino || null,
          foto_tablero_inicio || null,
          foto_tablero_termino || null,
          foto_odometro_inicio || null,
          foto_odometro_termino || null,
          fotoHorometroFinal,
          notas_mecanicas_gsp || '',
          observacion_trabajo || '',
          cliente_nombre || 'Supervisor Mandante',
          cliente_rut || '',
          cliente_cargo || 'Receptor en Obra',
          cliente_firma_canvas_base64,
          horas_standby_cliente,
          horas_standby_cliente,
          horas_standby_gsp,
          motivo_standby,
          deviceTs,
          id_reporte_avance
        ]);
        reportGuardado = upRes.rows[0];
      } else {
        // Inserción directa en un solo paso
        const token_report = crypto.randomBytes(24).toString('hex');
        const insertSql = `
          INSERT INTO tedp_reporte_avance (
            id_proyecto,
            id_equipo,
            id_user_operador,
            id_user_rigger,
            dia_correlativo,
            fecha_reporte,
            unidad_cobro,
            fecha_inicio_servicio,
            fecha_termino_servicio,
            latitud_inicio_servicio,
            longitud_inicio_servicio,
            accuracy_firma,
            horas_operadas,
            horas_colacion,
            horas_minimas,
            horas_facturables,
            horas_sobretiempo,
            horometro_inicio,
            horometro_termino,
            odometro_inicio,
            odometro_termino,
            foto_tablero_inicio,
            foto_tablero_termino,
            foto_odometro_inicio,
            foto_odometro_termino,
            foto_horometro,
            notas_mecanicas_gsp,
            observacion_trabajo,
            cliente_nombre,
            cliente_rut,
            cliente_cargo,
            cliente_firma_canvas_base64,
            horas_standby,
            horas_standby_cliente,
            horas_standby_gsp,
            motivo_standby,
            token_report,
            device_timestamp,
            fecha_transmision_termino,
            estado_reporte,
            estado_jornada,
            fecha_registro
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, CURRENT_TIMESTAMP, 'PENDIENTE_VALIDACION', 'FINALIZADA', CURRENT_TIMESTAMP
          )
          RETURNING *;
        `;

        const inRes = await db.query(insertSql, [
          id_proyecto,
          id_equipo || null,
          id_user_operador,
          id_user_rigger || null,
          dia_correlativo || 1,
          fecha_reporte,
          'HRS_DIA',
          fecha_inicio_servicio,
          fecha_termino_servicio,
          latitud_inicio_servicio || null,
          longitud_inicio_servicio || null,
          accuracy_firma || null,
          horas_operadas || 0,
          horas_colacion !== undefined && horas_colacion !== null ? horas_colacion : 1,
          horas_minimas || 8.0,
          horas_facturables || 0,
          horas_sobretiempo || 0,
          horometro_inicio || null,
          horometro_termino || null,
          odometro_inicio || null,
          odometro_termino || null,
          foto_tablero_inicio || null,
          foto_tablero_termino || null,
          foto_odometro_inicio || null,
          foto_odometro_termino || null,
          fotoHorometroFinal,
          notas_mecanicas_gsp || '',
          observacion_trabajo || '',
          cliente_nombre || 'Supervisor Mandante',
          cliente_rut || '',
          cliente_cargo || 'Receptor en Obra',
          cliente_firma_canvas_base64,
          horas_standby_cliente,
          horas_standby_cliente,
          horas_standby_gsp,
          motivo_standby,
          token_report,
          deviceTs
        ]);
        reportGuardado = inRes.rows[0];
      }

      // Opcional: Actualizar el horómetro en json_data y columnas acumuladas del equipo si se ingresó
      if (id_equipo && (horometro_termino || odometro_termino)) {
        try {
          await db.query(
            `UPDATE tequ_equipo
             SET json_data = jsonb_set(COALESCE(json_data, '{}'::jsonb), '{horometro}', $1::text::jsonb),
                 horometro_grua_acumulado = GREATEST(COALESCE(horometro_grua_acumulado, 0), COALESCE($2::numeric, 0)),
                 odometro_acumulado = GREATEST(COALESCE(odometro_acumulado, 0), COALESCE($3::numeric, 0)),
                 fecha_ultima_lectura = CURRENT_TIMESTAMP,
                 fuente_ultima_lectura = 'REPORT_CIERRE'
             WHERE id_equipo = $4`,
            [JSON.stringify(horometro_termino || 0), horometro_termino || 0, odometro_termino || 0, id_equipo]
          );
        } catch (e) {
          console.warn('No se pudo actualizar horómetro del equipo:', e.message);
        }
      }

      // REQ-988: Detección del Último Report para activar automáticamente la Hoja de Ruta de RETORNO
      let esUltimoReport = false;
      let viajeRetorno = null;

      try {
        const proyCheckRes = await db.query(
          'SELECT id_proyecto, codi_proyecto, json_field, fecha_plan_ini, fecha_plan_fin FROM tpry_proyecto WHERE id_proyecto = $1',
          [id_proyecto]
        );
        if (proyCheckRes.rows.length > 0) {
          const proyRow = proyCheckRes.rows[0];
          const totalDiasPermitidos = calcularCupoDiasHabiles(proyRow);
          const totalConsumidos = await getReportesConsumidosOT(id_proyecto, db);

          if (Number(dia_correlativo) >= Number(totalDiasPermitidos) || totalConsumidos >= totalDiasPermitidos) {
            esUltimoReport = true;
            viajeRetorno = await viajeModel.crearViajeRetorno({
              id_proyecto,
              id_equipo,
              id_user_chofer: id_user_operador,
              patente: null
            });
            console.log(`[REQ-988] Último Report detectado en OT ${proyRow.codi_proyecto}. Hoja de Ruta de RETORNO activada: ${viajeRetorno.token_viaje}`);
          }
        }
      } catch (errRetorno) {
        console.warn('[REQ-988] Error verificando/creando viaje de retorno:', errRetorno.message);
      }

      // [NIVEL 1 - SPEC-098] Compilar y archivar inmediatamente el PDF oficial de faena al cerrar la jornada
      if (reportGuardado && (cliente_firma_canvas_base64 || horas_operadas)) {
        try {
          const proyRes = await db.query(
            `SELECT p.id_proyecto, p.codi_proyecto, p.nombre_proyecto, p.json_field,
                    COALESCE(clt.name_empresa, clt.razon_social, p.json_field->'crm_v1'->'cliente'->>'razon_social', 'CLIENTE MANDANTE') AS cliente_nombre,
                    COALESCE(clt.rut_empresa, p.json_field->'crm_v1'->'cliente'->>'rut', 'S/R') AS cliente_rut,
                    COALESCE(p.json_field->>'obra_nombre', p.json_field->'crm_v1'->>'obra_nombre', p.json_field->'ejecucion_v1'->'cliente'->>'obra', p.nombre_proyecto) AS obra_nombre,
                    COALESCE(p.json_field->>'obra_direccion', p.json_field->'crm_v1'->>'obra_direccion', p.json_field->'ejecucion_v1'->'cliente'->>'direccion_faena', 'Faena en Terreno') AS obra_direccion
             FROM tpry_proyecto p
             LEFT JOIN tpar_empresas clt ON clt.id_empresa = p.id_empresa_cliente
             WHERE p.id_proyecto = $1`,
            [id_proyecto]
          );
          const proyRow = proyRes.rows[0] || {};
          const eqRes = await db.query('SELECT patente, modelo FROM tequ_equipo WHERE id_equipo = $1', [id_equipo]);
          const opRes = await db.query('SELECT name_frst, apellido_pat FROM tsec_users WHERE id_user = $1', [id_user_operador]);
          const rigRes = id_user_rigger ? await db.query('SELECT name_frst, apellido_pat FROM tsec_users WHERE id_user = $1', [id_user_rigger]) : { rows: [] };

          const pdfBuffer = await generarPdfReportDiario({
            report: {
              ...reportGuardado,
              id_reporte_avance: reportGuardado.id_reporte_avance,
              equipo_patente: eqRes.rows[0]?.patente || 'S/P',
              equipo_modelo: eqRes.rows[0]?.modelo || 'Grúa',
              op_nombre: opRes.rows[0]?.name_frst || '',
              op_apellido: opRes.rows[0]?.apellido_pat || '',
              rig_nombre: rigRes.rows[0]?.name_frst || null,
              rig_apellido: rigRes.rows[0]?.apellido_pat || null,
              cliente_nombre: cliente_nombre || proyRow.cliente_nombre,
              cliente_rut: cliente_rut || proyRow.cliente_rut,
              cliente_cargo: cliente_cargo || 'Receptor en Faena',
              cliente_firma_canvas_base64: cliente_firma_canvas_base64,
              fecha_reporte: fecha_reporte || reportGuardado.fecha_reporte,
              fecha_inicio_servicio: hora_inicio || reportGuardado.fecha_inicio_servicio,
              fecha_termino_servicio: hora_termino || reportGuardado.fecha_termino_servicio
            },
            proyecto: {
              codi_proyecto: proyRow.codi_proyecto || `OT-${id_proyecto}`,
              cliente_nombre: proyRow.cliente_nombre,
              cliente_rut: proyRow.cliente_rut,
              obra_nombre: proyRow.obra_nombre,
              obra_direccion: proyRow.obra_direccion
            },
            validador: null,
            codigoFes: null
          });

          const path_relativo = buildStoragePath('GSP', 'reports');
          const targetDir = path.join(STORAGE_ROOT, path_relativo);
          if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

          const fileName = `Report_Diario_OT_${proyRow.codi_proyecto || id_proyecto}_D${dia_correlativo || 1}_${Date.now()}.pdf`;
          const filePath = path.join(targetDir, fileName);
          fs.writeFileSync(filePath, pdfBuffer);

          const archivoM = new archivoModel();
          const docFile = await archivoM.insertarTfmgFile(
            'REPORT_DIARIO',
            'application/pdf',
            `Report_Diario_OT_${proyRow.codi_proyecto || id_proyecto}_D${dia_correlativo || 1}.pdf`,
            fileName,
            path_relativo,
            id_user_operador || 1,
            'A'
          );

          if (docFile?.id_doc) {
            await db.query('UPDATE tedp_reporte_avance SET id_doc_pdf = $1 WHERE id_reporte_avance = $2', [
              docFile.id_doc,
              reportGuardado.id_reporte_avance
            ]);
            reportGuardado.id_doc_pdf = docFile.id_doc;
          }
        } catch (pdfFaenaErr) {
          console.warn('[ReportDiario] Warning generando PDF en guardado de faena:', pdfFaenaErr.message);
        }
      }

      res.status(201).json({
        success: true,
        message: 'Report Diario guardado y firmado exitosamente',
        data: reportGuardado,
        es_ultimo_report: esUltimoReport,
        token_viaje_retorno: viajeRetorno?.token_viaje || null,
        id_log_desplazamiento_retorno: viajeRetorno?.id_log_desplazamiento || null
      });
    } catch (err) {
      console.error('Error al guardar report diario:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 4. Validar Report Diario (Analista en Torre de Control) — Con PIN FES, PDF Oficial, Dossier y Correo
  async validarReportDiario(req, res) {
    try {
      const { id } = req.params;
      const { id_user_validador, obs_validador, ajustes } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'id_reporte_avance es requerido' });
      }

      // 4.1 Resolver un validador válido en tsec_users
      let validValidadorId = 55; // Default Sergio Gajardo
      if (id_user_validador) {
        const uCheck = await db.query('SELECT id_user FROM tsec_users WHERE id_user = $1', [id_user_validador]);
        if (uCheck.rows.length > 0) {
          validValidadorId = uCheck.rows[0].id_user;
        }
      }

      // 4.2 Validar PIN FES del Analista (Firma Electrónica Simple)
      const pinRaw = req.body.pin ? String(req.body.pin).trim() : '';
      const pinHash = (req.body.pin_hash || req.body.pass_hash_fes || '').trim();

      if (!pinHash && !pinRaw) {
        return res.status(400).json({ error: 'El PIN de 4 dígitos para Firma Electrónica Simple (FES) es obligatorio.' });
      }

      const validadorUserRes = await db.query(
        'SELECT id_user, name_frst, apellido_pat, rut, email, pass_hash_fes FROM tsec_users WHERE id_user = $1',
        [validValidadorId]
      );
      if (validadorUserRes.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario validador no encontrado en el sistema.' });
      }
      const validadorUser = validadorUserRes.rows[0];

      const computedHash = pinHash || crypto.createHash('sha256').update(pinRaw).digest('hex');

      if (!validadorUser.pass_hash_fes) {
        return res.status(400).json({ error: 'El usuario no tiene un PIN de firma FES enrolado en su cuenta.' });
      }

      if (computedHash.toLowerCase() !== validadorUser.pass_hash_fes.toLowerCase()) {
        return res.status(401).json({ error: 'PIN de Firma Electrónica Simple (FES) incorrecto.' });
      }

      // 4.3 Consultar report actual con detalles de proyecto, equipo, operador, rigger y mandante
      const repQuery = `
        SELECT 
          r.*,
          p.codi_proyecto,
          p.json_field as proyecto_json,
          COALESCE(p.nombre_proyecto, 'Servicio de Izaje') as nombre_proyecto,
          COALESCE(clt.razon_social, clt.name_empresa, r.cliente_nombre, 'Cliente Mandante') as cliente_nombre_empresa,
          COALESCE(clt.rut_empresa, r.cliente_rut, '') as cliente_rut_empresa,
          COALESCE(p.json_field->'crm_v1'->>'obra_nombre', p.json_field->>'obra_nombre', 'Faena') as obra_nombre,
          COALESCE(p.json_field->'crm_v1'->>'obra_direccion', p.json_field->>'obra_direccion', 'Terreno en Faena') as obra_direccion,
          COALESCE(e.patente, 'S/P') as equipo_patente,
          COALESCE(e.modelo, '') as equipo_modelo,
          u_op.name_frst as op_nombre,
          u_op.apellido_pat as op_apellido,
          u_op.email as op_email,
          u_rig.name_frst as rig_nombre,
          u_rig.apellido_pat as rig_apellido,
          u_val.name_frst as val_nombre,
          u_val.apellido_pat as val_apellido,
          u_val.rut as val_rut,
          u_val.email as val_email
        FROM tedp_reporte_avance r
        LEFT JOIN tpry_proyecto p ON r.id_proyecto = p.id_proyecto
        LEFT JOIN tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
        LEFT JOIN tequ_equipo e ON r.id_equipo = e.id_equipo
        LEFT JOIN tsec_users u_op ON r.id_user_operador = u_op.id_user
        LEFT JOIN tsec_users u_rig ON r.id_user_rigger = u_rig.id_user
        LEFT JOIN tsec_users u_val ON u_val.id_user = $1
        WHERE r.id_reporte_avance = $2
      `;
      const repRes = await db.query(repQuery, [validValidadorId, id]);

      if (repRes.rows.length === 0) {
        return res.status(404).json({ error: 'Report no encontrado' });
      }

      const rep = repRes.rows[0];

      // 4.4 Evaluar si el analista realizó ajustes numéricos
      let huboAjustes = false;
      let nuevoHorasOperadas = parseFloat(rep.horas_operadas || 0);
      let nuevoHorasFacturables = parseFloat(rep.horas_facturables || nuevoHorasOperadas);
      let nuevoHorasColacion = parseFloat(rep.horas_colacion !== undefined && rep.horas_colacion !== null ? rep.horas_colacion : 1.0);
      let nuevoHorometroInicio = parseFloat(rep.horometro_inicio || 0);
      let nuevoHorometroTermino = parseFloat(rep.horometro_termino || 0);
      let nuevoOdometroInicio = parseFloat(rep.odometro_inicio || 0);
      let nuevoOdometroTermino = parseFloat(rep.odometro_termino || 0);
      let nuevaFechaInicio = rep.fecha_inicio_servicio;
      let nuevaFechaTermino = rep.fecha_termino_servicio;
      let nuevoSobretiempo = parseFloat(rep.horas_sobretiempo || 0);
      let nuevoIdOperador = rep.id_user_operador ? Number(rep.id_user_operador) : null;
      let nuevoIdRigger = rep.id_user_rigger ? Number(rep.id_user_rigger) : null;
      let nuevoOpNombre = rep.op_nombre || '';
      let nuevoOpApellido = rep.op_apellido || '';
      let nuevoOpEmail = rep.op_email || '';
      let nuevoRigNombre = rep.rig_nombre || '';
      let nuevoRigApellido = rep.rig_apellido || '';
      let payloadAjustes = rep.ajustes_analista || null;

      if (ajustes && typeof ajustes === 'object') {
        const hInicio = ajustes.hora_inicio || null;
        const hTermino = ajustes.hora_termino || null;
        const hCol = ajustes.horas_colacion !== undefined && ajustes.horas_colacion !== null ? parseFloat(ajustes.horas_colacion) : null;
        const horoIni = ajustes.horometro_inicio !== undefined && ajustes.horometro_inicio !== null ? parseFloat(ajustes.horometro_inicio) : null;
        const horoFin = ajustes.horometro_termino !== undefined && ajustes.horometro_termino !== null ? parseFloat(ajustes.horometro_termino) : null;
        const odoIni = ajustes.odometro_inicio !== undefined && ajustes.odometro_inicio !== null ? parseFloat(ajustes.odometro_inicio) : null;
        const odoFin = ajustes.odometro_termino !== undefined && ajustes.odometro_termino !== null ? parseFloat(ajustes.odometro_termino) : null;
        const hFact = ajustes.horas_facturables !== undefined && ajustes.horas_facturables !== null ? parseFloat(ajustes.horas_facturables) : null;
        const hOper = ajustes.horas_operadas !== undefined && ajustes.horas_operadas !== null ? parseFloat(ajustes.horas_operadas) : null;
        const reqOpId = ajustes.id_user_operador !== undefined && ajustes.id_user_operador !== null && ajustes.id_user_operador !== ''
          ? Number(ajustes.id_user_operador)
          : null;
        const tieneAjusteRigger = Object.prototype.hasOwnProperty.call(ajustes, 'id_user_rigger');
        const reqRigId = tieneAjusteRigger && ajustes.id_user_rigger !== null && ajustes.id_user_rigger !== ''
          ? Number(ajustes.id_user_rigger)
          : null;

        const parseHHMM = (val, def) => {
          if (!val) return def;
          try {
            const s = String(val).trim();
            if (/^\d{2}:\d{2}$/.test(s)) return s;
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
              return d.toLocaleTimeString('es-CL', {
                timeZone: 'America/Santiago',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });
            }
          } catch (e) {}
          return def;
        };

        const origHInicio = rep.hora_inicio || parseHHMM(rep.fecha_inicio_servicio, '08:00');
        const origHTermino = rep.hora_termino || parseHHMM(rep.fecha_termino_servicio, '18:00');

        const difHInicio = hInicio && hInicio !== origHInicio;
        const difHTermino = hTermino && hTermino !== origHTermino;
        const difCol = hCol !== null && Math.abs(hCol - nuevoHorasColacion) > 0.01;
        const difHoroIni = horoIni !== null && Math.abs(horoIni - nuevoHorometroInicio) > 0.01;
        const difHoroFin = horoFin !== null && Math.abs(horoFin - nuevoHorometroTermino) > 0.01;
        const difOdoIni = odoIni !== null && Math.abs(odoIni - nuevoOdometroInicio) > 0.1;
        const difOdoFin = odoFin !== null && Math.abs(odoFin - nuevoOdometroTermino) > 0.1;
        const difFact = hFact !== null && Math.abs(hFact - nuevoHorasFacturables) > 0.01;
        const difOper = hOper !== null && Math.abs(hOper - nuevoHorasOperadas) > 0.01;
        const difOperador = reqOpId !== null && reqOpId !== nuevoIdOperador;
        const difRigger = tieneAjusteRigger && reqRigId !== nuevoIdRigger;

        if (difHInicio || difHTermino || difCol || difHoroIni || difHoroFin || difOdoIni || difOdoFin || difFact || difOper || difOperador || difRigger) {
          huboAjustes = true;

          const fechaBase = rep.fecha_reporte ? (new Date(rep.fecha_reporte).toISOString().split('T')[0]) : (new Date().toISOString().split('T')[0]);
          if (hInicio) nuevaFechaInicio = `${fechaBase} ${hInicio}:00`;
          if (hTermino) nuevaFechaTermino = `${fechaBase} ${hTermino}:00`;

          const origOperadorNombre = `${rep.op_nombre || ''} ${rep.op_apellido || ''}`.trim() || 'Sin Operador';
          const origRiggerNombre = rep.id_user_rigger ? (`${rep.rig_nombre || ''} ${rep.rig_apellido || ''}`.trim() || 'Rigger') : 'Sin Rigger';

          if (difOperador && reqOpId) {
            const uOpRes = await db.query('SELECT id_user, name_frst, apellido_pat, email FROM tsec_users WHERE id_user = $1', [reqOpId]);
            if (uOpRes.rows.length > 0) {
              nuevoIdOperador = uOpRes.rows[0].id_user;
              nuevoOpNombre = uOpRes.rows[0].name_frst || '';
              nuevoOpApellido = uOpRes.rows[0].apellido_pat || '';
              nuevoOpEmail = uOpRes.rows[0].email || '';
            }
          }
          if (difRigger) {
            if (reqRigId) {
              const uRigRes = await db.query('SELECT id_user, name_frst, apellido_pat FROM tsec_users WHERE id_user = $1', [reqRigId]);
              if (uRigRes.rows.length > 0) {
                nuevoIdRigger = uRigRes.rows[0].id_user;
                nuevoRigNombre = uRigRes.rows[0].name_frst || '';
                nuevoRigApellido = uRigRes.rows[0].apellido_pat || '';
              }
            } else {
              nuevoIdRigger = null;
              nuevoRigNombre = '';
              nuevoRigApellido = '';
            }
          }

          const ajustadoOperadorNombre = `${nuevoOpNombre || ''} ${nuevoOpApellido || ''}`.trim() || 'Sin Operador';
          const ajustadoRiggerNombre = nuevoIdRigger ? (`${nuevoRigNombre || ''} ${nuevoRigApellido || ''}`.trim() || 'Rigger') : 'Sin Rigger';

          payloadAjustes = {
            modificado: true,
            fecha_ajuste: new Date().toISOString(),
            id_user_analista: validValidadorId,
            nombre_analista: `${validadorUser.name_frst} ${validadorUser.apellido_pat || ''}`.trim(),
            valores_originales: {
              hora_inicio: origHInicio,
              hora_termino: origHTermino,
              horas_operadas: nuevoHorasOperadas,
              horas_facturables: nuevoHorasFacturables,
              horas_colacion: nuevoHorasColacion,
              horometro_inicio: nuevoHorometroInicio,
              horometro_termino: nuevoHorometroTermino,
              odometro_inicio: nuevoOdometroInicio,
              odometro_termino: nuevoOdometroTermino,
              id_user_operador: rep.id_user_operador ? Number(rep.id_user_operador) : null,
              operador_nombre: origOperadorNombre,
              id_user_rigger: rep.id_user_rigger ? Number(rep.id_user_rigger) : null,
              rigger_nombre: origRiggerNombre
            },
            valores_ajustados: {
              hora_inicio: hInicio || origHInicio,
              hora_termino: hTermino || origHTermino,
              horas_operadas: hOper !== null ? hOper : nuevoHorasOperadas,
              horas_facturables: hFact !== null ? hFact : nuevoHorasFacturables,
              horas_colacion: hCol !== null ? hCol : nuevoHorasColacion,
              horometro_inicio: horoIni !== null ? horoIni : nuevoHorometroInicio,
              horometro_termino: horoFin !== null ? horoFin : nuevoHorometroTermino,
              odometro_inicio: odoIni !== null ? odoIni : nuevoOdometroInicio,
              odometro_termino: odoFin !== null ? odoFin : nuevoOdometroTermino,
              id_user_operador: nuevoIdOperador,
              operador_nombre: ajustadoOperadorNombre,
              id_user_rigger: nuevoIdRigger,
              rigger_nombre: ajustadoRiggerNombre
            },
            observacion_ajuste: obs_validador || 'Ajustes validados por Control de Gestión'
          };

          if (hFact !== null) nuevoHorasFacturables = hFact;
          if (hOper !== null) nuevoHorasOperadas = hOper;
          if (hCol !== null) nuevoHorasColacion = hCol;
          if (horoIni !== null) nuevoHorometroInicio = horoIni;
          if (horoFin !== null) nuevoHorometroTermino = horoFin;
          if (odoIni !== null) nuevoOdometroInicio = odoIni;
          if (odoFin !== null) nuevoOdometroTermino = odoFin;

          const baseMin = (rep.horas_minimas !== undefined && rep.horas_minimas !== null && String(rep.horas_minimas).trim() !== '')
            ? parseFloat(rep.horas_minimas)
            : 4.0;
          nuevoSobretiempo = baseMin > 0 ? Math.max(0, nuevoHorasFacturables - baseMin) : 0;
        }
      }

      // 4.4.B SPEC-106: Calcular y persistir Liquidación Diaria de Personal y Viáticos (RRHH / Control de Gestión)
      const [viajesResVal, catalogoTarifasVal] = await Promise.all([
        db.query('SELECT * FROM tequ_log_desplazamiento WHERE id_proyecto = $1 ORDER BY id_log_desplazamiento ASC', [rep.id_proyecto]),
        obtenerTarifasDesdeBD()
      ]);
      const liqBase = construirLiquidacionPersonalDiaReport({
        rep: {
          ...rep,
          id_user_operador: nuevoIdOperador,
          operador_nombre: `${nuevoOpNombre || ''} ${nuevoOpApellido || ''}`.trim() || 'Operador',
          id_user_rigger: nuevoIdRigger,
          rigger_nombre: nuevoIdRigger ? (`${nuevoRigNombre || ''} ${nuevoRigApellido || ''}`.trim() || null) : null,
          horas_operadas: nuevoHorasOperadas,
          horas_facturables: nuevoHorasFacturables,
          horas_colacion: nuevoHorasColacion,
          fecha_inicio_servicio: nuevaFechaInicio,
          fecha_termino_servicio: nuevaFechaTermino,
          ajustes_analista: null // Recalcular base fresca con las horas/fechas vigentes
        },
        proyectoJson: rep.proyecto_json,
        viajesProyecto: viajesResVal.rows || [],
        catalogoTarifas: catalogoTarifasVal
      });

      const reqLiq = req.body.liquidacion_personal_dia || ajustes?.liquidacion_personal_dia || null;
      const horasFaenaFinal = reqLiq?.horas_faena_pagar !== undefined && reqLiq?.horas_faena_pagar !== null
        ? Number(reqLiq.horas_faena_pagar)
        : Number(liqBase.horas_faena_pagar || 0);
      const horasFleteFinal = reqLiq?.horas_flete_pagar !== undefined && reqLiq?.horas_flete_pagar !== null
        ? Number(reqLiq.horas_flete_pagar)
        : Number(liqBase.horas_flete_pagar || 0);
      const horasTotalesFinal = Number((horasFaenaFinal + horasFleteFinal).toFixed(2));
      const precioUnitarioFinal = reqLiq?.precio_unitario !== undefined && reqLiq?.precio_unitario !== null
        ? Math.round(Number(reqLiq.precio_unitario))
        : Math.round(Number(liqBase.precio_unitario || 0));
      const tarifaModificada = Math.abs(precioUnitarioFinal - Number(liqBase.tarifa_sugerida || 0)) > 1;
      const montoTotalHoraOpFinal = Math.round(horasTotalesFinal * precioUnitarioFinal);

      // Si el analista no envió un viático manual distinto, o si envió monto_viatico_operador, evaluamos
      const viaticoSugeridoBase = Math.round(Number(liqBase.viatico_sugerido || 0));
      const montoViaticoOpFinal = reqLiq?.monto_viatico_operador !== undefined && reqLiq?.monto_viatico_operador !== null
        ? Math.round(Number(reqLiq.monto_viatico_operador))
        : viaticoSugeridoBase;
      const viaticoModificado = Math.abs(montoViaticoOpFinal - viaticoSugeridoBase) > 1;

      const tieneRiggerFinal = Boolean(nuevoIdRigger);
      const horasTotalesRiggerFinal = tieneRiggerFinal
        ? (reqLiq?.horas_totales_rigger !== undefined && reqLiq?.horas_totales_rigger !== null
            ? Number(reqLiq.horas_totales_rigger)
            : horasTotalesFinal)
        : 0;
      const viaticoSugeridoRigger = tieneRiggerFinal ? viaticoSugeridoBase : 0;
      const montoViaticoRiggerFinal = tieneRiggerFinal
        ? (reqLiq?.monto_viatico_rigger !== undefined && reqLiq?.monto_viatico_rigger !== null
            ? Math.round(Number(reqLiq.monto_viatico_rigger))
            : viaticoSugeridoRigger)
        : 0;
      const viaticoRiggerModificado = tieneRiggerFinal
        ? Math.abs(montoViaticoRiggerFinal - viaticoSugeridoRigger) > 1
        : false;

      const liqFinal = {
        ...liqBase,
        id_user_operador: nuevoIdOperador,
        operador_nombre: `${nuevoOpNombre || ''} ${nuevoOpApellido || ''}`.trim() || 'Operador',
        id_user_rigger: nuevoIdRigger,
        rigger_nombre: tieneRiggerFinal ? (`${nuevoRigNombre || ''} ${nuevoRigApellido || ''}`.trim() || 'Rigger') : null,
        horas_faena_pagar: horasFaenaFinal,
        horas_flete_pagar: horasFleteFinal,
        horas_totales_pagar: horasTotalesFinal,
        precio_unitario: precioUnitarioFinal,
        tarifa_modificada: tarifaModificada,
        monto_faena_total: Math.round(horasFaenaFinal * precioUnitarioFinal),
        monto_flete_total: Math.round(horasFleteFinal * precioUnitarioFinal),
        monto_total_hora_operador: montoTotalHoraOpFinal,
        monto_viatico_sugerido_operador: viaticoSugeridoBase,
        monto_viatico_operador: montoViaticoOpFinal,
        viatico_modificado: viaticoModificado,
        horas_totales_rigger: horasTotalesRiggerFinal,
        monto_viatico_sugerido_rigger: viaticoSugeridoRigger,
        monto_viatico_rigger: montoViaticoRiggerFinal,
        viatico_rigger_modificado: viaticoRiggerModificado,
        validado_rrhh: true,
        fecha_validacion_rrhh: new Date().toISOString(),
        id_user_validador_rrhh: validValidadorId,
        nombre_validador_rrhh: `${validadorUser.name_frst} ${validadorUser.apellido_pat || ''}`.trim()
      };

      payloadAjustes = {
        ...(payloadAjustes && typeof payloadAjustes === 'object' ? payloadAjustes : {}),
        modificado: Boolean(huboAjustes || payloadAjustes?.modificado || tarifaModificada || viaticoModificado || viaticoRiggerModificado),
        liquidacion_personal_dia: liqFinal
      };

      // Código de certificación digital FES
      const codigoFes = `FES-REP-${id}-${Date.now().toString(36).toUpperCase()}`;

      // 4.5 Actualizar en BD el estado y firma FES
      const updateSql = `
        UPDATE tedp_reporte_avance
        SET 
          estado_reporte = 'VALIDADO_ANALISTA',
          id_user_validador = $1,
          fecha_validacion = CURRENT_TIMESTAMP,
          fecha_firma_fes = CURRENT_TIMESTAMP,
          codigo_validacion_fes = $2,
          obs_validador = $3,
          horas_operadas = $4,
          horas_facturables = $5,
          horas_colacion = $6,
          horometro_inicio = $7,
          horometro_termino = $8,
          odometro_inicio = $9,
          odometro_termino = $10,
          fecha_inicio_servicio = $11,
          fecha_termino_servicio = $12,
          horas_sobretiempo = $13,
          ajustes_analista = $14,
          id_user_operador = $15,
          id_user_rigger = $16
        WHERE id_reporte_avance = $17
        RETURNING *;
      `;

      const result = await db.query(updateSql, [
        validValidadorId,
        codigoFes,
        obs_validador || (huboAjustes ? 'Report validado con ajustes por Analista de Operaciones' : 'Report diario validado conforme por Analista de Operaciones'),
        nuevoHorasOperadas,
        nuevoHorasFacturables,
        nuevoHorasColacion,
        nuevoHorometroInicio,
        nuevoHorometroTermino,
        nuevoOdometroInicio,
        nuevoOdometroTermino,
        nuevaFechaInicio,
        nuevaFechaTermino,
        nuevoSobretiempo,
        payloadAjustes ? JSON.stringify(payloadAjustes) : null,
        nuevoIdOperador,
        nuevoIdRigger,
        id
      ]);

      const reportActualizado = result.rows[0];
      reportActualizado.operador_nombre = `${nuevoOpNombre || ''} ${nuevoOpApellido || ''}`.trim() || 'Operador';
      reportActualizado.rigger_nombre = nuevoIdRigger ? (`${nuevoRigNombre || ''} ${nuevoRigApellido || ''}`.trim() || null) : null;
      reportActualizado.liquidacion_personal_dia = liqFinal;

      // 4.6 Generar PDF Oficial del Report Diario con Doble Firma (Mandante GPS + FES Analista)
      let idDocPdf = null;
      let urlPdfView = '';
      let urlPdfDownload = '';

      try {
        const pdfBuffer = await generarPdfReportDiario({
          report: {
            ...rep,
            ...reportActualizado,
            equipo_patente: rep.equipo_patente,
            equipo_modelo: rep.equipo_modelo,
            op_nombre: nuevoOpNombre,
            op_apellido: nuevoOpApellido,
            rig_nombre: nuevoIdRigger ? nuevoRigNombre : null,
            rig_apellido: nuevoIdRigger ? nuevoRigApellido : null,
            val_nombre: validadorUser.name_frst,
            val_apellido: validadorUser.apellido_pat,
            val_rut: validadorUser.rut,
            ajustes_analista: payloadAjustes
          },
          proyecto: {
            codi_proyecto: rep.codi_proyecto,
            cliente_nombre: rep.cliente_nombre_empresa || rep.cliente_nombre,
            cliente_rut: rep.cliente_rut_empresa || rep.cliente_rut,
            obra_nombre: rep.obra_nombre,
            obra_direccion: rep.obra_direccion
          },
          validador: validadorUser,
          codigoFes,
          validacionUrl: `${process.env.APP_BASE_URL || 'https://servidor.leanglobal.cl'}/${(process.env.APP_ENV === 'prod') ? 'lg-gsp-prod' : 'lg-gsp-dev'}/validador-doc`
        });

        // 4.7 Guardar archivo siguiendo leanglobal_file_storage_standard
        const path_relativo = buildStoragePath('GSP', 'reports');
        const targetDir = path.join(STORAGE_ROOT, path_relativo);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const fileName = `Report_Diario_OT_${rep.codi_proyecto || rep.id_proyecto}_D${rep.dia_correlativo || 1}_${Date.now()}.pdf`;
        const filePath = path.join(targetDir, fileName);
        fs.writeFileSync(filePath, pdfBuffer);

        // Guardar metadatos en tfmg_file
        const archivoM = new archivoModel();
        const docFile = await archivoM.insertarTfmgFile(
          'REPORT_DIARIO',
          'application/pdf',
          `Report_Diario_OT_${rep.codi_proyecto || rep.id_proyecto}_D${rep.dia_correlativo || 1}.pdf`,
          fileName,
          path_relativo,
          validValidadorId,
          'A'
        );

        idDocPdf = docFile.id_doc;
        urlPdfView = `/api/v1/storage/view/${idDocPdf}`;
        urlPdfDownload = `/api/v1/storage/download/${idDocPdf}`;

        // Asociar id_doc_pdf a tedp_reporte_avance
        await db.query(
          'UPDATE tedp_reporte_avance SET id_doc_pdf = $1 WHERE id_reporte_avance = $2',
          [idDocPdf, id]
        );
        reportActualizado.id_doc_pdf = idDocPdf;
        reportActualizado.codigo_validacion_fes = codigoFes;

        // 4.8 Adjuntar documento al Dossier del Proyecto en tpry_proyecto (json_field.ejecucion_v1.dossier_documentos)
        try {
          const pryDocRes = await db.query('SELECT json_field FROM tpry_proyecto WHERE id_proyecto = $1', [rep.id_proyecto]);
          if (pryDocRes.rows.length > 0) {
            const jf = pryDocRes.rows[0].json_field || {};
            if (!jf.ejecucion_v1) jf.ejecucion_v1 = {};
            if (!Array.isArray(jf.ejecucion_v1.dossier_documentos)) jf.ejecucion_v1.dossier_documentos = [];

            const docDossierItem = {
              id_doc: idDocPdf,
              tipo_documento: 'REPORT_DIARIO',
              categoria: 'REPORTES_OPERACIONALES',
              nombre: `Report Diario Digital — Día ${rep.dia_correlativo || 1}`,
              folio: `REP-${rep.codi_proyecto || rep.id_proyecto}-D${rep.dia_correlativo || 1}`,
              fecha_emision: new Date().toISOString(),
              fecha_servicio: rep.fecha_reporte,
              id_reporte_avance: Number(id),
              dia_correlativo: rep.dia_correlativo || 1,
              codigo_fes: codigoFes,
              firmado_por: `${validadorUser.name_frst} ${validadorUser.apellido_pat || ''}`.trim(),
              url_view: urlPdfView,
              url_download: urlPdfDownload
            };

            jf.ejecucion_v1.dossier_documentos = jf.ejecucion_v1.dossier_documentos.filter(
              d => Number(d.id_reporte_avance) !== Number(id)
            );
            jf.ejecucion_v1.dossier_documentos.unshift(docDossierItem);

            await db.query('UPDATE tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2', [jf, rep.id_proyecto]);
          }
        } catch (dosErr) {
          console.warn('[DOSSIER] Error adjuntando report a dossier de proyecto:', dosErr.message);
        }
      } catch (errPdf) {
        console.error('[PDF-REPORT] Error al compilar o almacenar PDF del report diario:', errPdf);
      }

      // 4.9 Notificación por CORREO con enlace de descarga del PDF y sello FES
      try {
        const nombreAnalista = `${validadorUser.name_frst} ${validadorUser.apellido_pat || ''}`.trim() || 'Control de Gestión';
        const rutAnalista = validadorUser.rut || '---';
        const nombreOperador = `${rep.op_nombre || ''} ${rep.op_apellido || ''}`.trim() || 'Operador en Terreno';
        const diaNum = rep.dia_correlativo || 1;
        const codiOT = rep.codi_proyecto || `OT-${rep.id_proyecto}`;
        const fechaFormat = rep.fecha_reporte ? new Date(rep.fecha_reporte).toLocaleDateString('es-CL', { timeZone: 'UTC' }) : 'Hoy';

        const asunto = huboAjustes
          ? `[GSP] ⚠️ Report Diario Validado CON AJUSTES — ${codiOT} (Día ${diaNum})`
          : `[GSP] ✅ Report Diario Validado Conforme — ${codiOT} (Día ${diaNum})`;

        let tablaHtml = '';
        if (huboAjustes && payloadAjustes?.valores_originales) {
          const orig = payloadAjustes.valores_originales;
          const ajus = payloadAjustes.valores_ajustados;
          tablaHtml = `
            <div style="margin: 18px 0; background: #0f172a; border-radius: 8px; border: 1px solid #334155; overflow: hidden;">
              <div style="background: #1e293b; padding: 10px 14px; font-weight: bold; color: #f59e0b; font-size: 13px; text-transform: uppercase;">
                🔍 Auditoría de Modificaciones de Terreno
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; color: #cbd5e1;">
                <thead>
                  <tr style="border-bottom: 1px solid #334155; background: #0b1120;">
                    <th style="padding: 8px 12px;">Concepto</th>
                    <th style="padding: 8px 12px; text-align: center;">Reportado en Terreno</th>
                    <th style="padding: 8px 12px; text-align: center;">Validado por Analista</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px solid #1e293b;">
                    <td style="padding: 8px 12px;">Horas Facturables</td>
                    <td style="padding: 8px 12px; text-align: center;"><span style="color: #ef4444; text-decoration: line-through; font-family: monospace;">${orig.horas_facturables} hrs</span></td>
                    <td style="padding: 8px 12px; text-align: center;"><strong style="color: #10b981; font-family: monospace; font-size: 14px;">${ajus.horas_facturables} hrs</strong></td>
                  </tr>
                  <tr style="border-bottom: 1px solid #1e293b;">
                    <td style="padding: 8px 12px;">Horas Efectivas Operadas</td>
                    <td style="padding: 8px 12px; text-align: center;"><span style="color: #ef4444; text-decoration: line-through; font-family: monospace;">${orig.horas_operadas} hrs</span></td>
                    <td style="padding: 8px 12px; text-align: center;"><strong style="color: #10b981; font-family: monospace; font-size: 14px;">${ajus.horas_operadas} hrs</strong></td>
                  </tr>
                  <tr style="border-bottom: 1px solid #1e293b;">
                    <td style="padding: 8px 12px;">Colación</td>
                    <td style="padding: 8px 12px; text-align: center;"><span style="color: #ef4444; text-decoration: line-through; font-family: monospace;">${orig.horas_colacion} hrs</span></td>
                    <td style="padding: 8px 12px; text-align: center;"><strong style="color: #10b981; font-family: monospace;">${ajus.horas_colacion} hrs</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 12px;">Horómetro Motor</td>
                    <td style="padding: 8px 12px; text-align: center;"><span style="color: #ef4444; text-decoration: line-through; font-family: monospace;">${orig.horometro_inicio} ➔ ${orig.horometro_termino}</span></td>
                    <td style="padding: 8px 12px; text-align: center;"><strong style="color: #10b981; font-family: monospace;">${ajus.horometro_inicio} ➔ ${ajus.horometro_termino}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          `;
        } else {
          tablaHtml = `
            <div style="margin: 16px 0; background: #064e3b15; border: 1px solid #05966940; border-radius: 8px; padding: 12px 16px; color: #a7f3d0; font-size: 13px;">
              ✅ <strong>Validación Conforme:</strong> Las horas reportadas (<strong>${nuevoHorasFacturables} hrs</strong>) y horómetros corresponden exactamente a lo registrado en terreno sin discrepancias.
            </div>
          `;
        }

        const baseUrlApp = process.env.APP_BASE_URL || 'https://servidor.leanglobal.cl';
        const envPrefix = (process.env.APP_ENV === 'prod') ? '/lg-gsp-prod' : '/lg-gsp-dev';
        const linkPdfCompleto = idDocPdf ? `${baseUrlApp}${envPrefix}/api/archivo/ver/${idDocPdf}` : (urlPdfView ? `${baseUrlApp}${envPrefix}${urlPdfView}` : '');

        const contenidoMail = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #334155;">
            <p style="font-size: 14px; margin-bottom: 12px;">
              El Analista de Control de Gestión <strong>${nombreAnalista}</strong> ha validado y firmado electrónicamente con su clave PIN el report diario de faena:
            </p>
            <ul style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 24px; font-size: 13px; list-style-type: none; margin: 0 0 16px 0;">
              <li style="margin-bottom: 4px;">📌 <strong>Orden de Trabajo:</strong> <span style="font-family: monospace; color: #0284c7; font-weight: bold;">${codiOT}</span></li>
              <li style="margin-bottom: 4px;">🏢 <strong>Faena / Obra:</strong> ${rep.obra_nombre}</li>
              <li style="margin-bottom: 4px;">🚚 <strong>Grúa / Patente:</strong> ${rep.equipo_patente} (${rep.equipo_modelo})</li>
              <li style="margin-bottom: 4px;">👷 <strong>Operador:</strong> ${nombreOperador}</li>
              <li style="margin-bottom: 4px;">📅 <strong>Fecha Faena:</strong> ${fechaFormat} (Día ${diaNum})</li>
              <li style="margin-bottom: 4px;">🔒 <strong>Código FES Analista:</strong> <span style="font-family: monospace; color: #166534; font-weight: bold;">${codigoFes}</span></li>
            </ul>

            ${tablaHtml}

            ${linkPdfCompleto ? `
              <div style="margin: 22px 0; text-align: center; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px;">
                <div style="font-size: 11px; font-weight: bold; color: #166534; text-transform: uppercase; margin-bottom: 4px;">
                  📄 Documento Oficial Adjuntado al Dossier del Proyecto
                </div>
                <div style="font-size: 12px; color: #15803d; margin-bottom: 12px;">
                  El PDF oficial incluye la firma en pantalla y coordenadas GPS del cliente en terreno más la firma electrónica (FES) del analista.
                </div>
                <a href="${linkPdfCompleto}" target="_blank" style="background: #047857; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 13px; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  DESCARGAR REPORT DIARIO DIGITAL OFICIAL (PDF)
                </a>
              </div>
            ` : ''}

            <div style="background: #fefce8; border-left: 4px solid #eab308; padding: 12px; margin: 16px 0; border-radius: 4px;">
              <strong style="color: #854d0e; font-size: 12px; text-transform: uppercase;">Observaciones del Analista:</strong>
              <p style="margin: 4px 0 0 0; color: #713f12; font-size: 13px;">
                "${obs_validador || (huboAjustes ? 'Ajustes aplicados conforme a auditoría de telemetría.' : 'Aprobado sin observaciones.')}"
              </p>
            </div>
          </div>
        `;

        // Destinatarios: Jefatura de Operaciones + Analista + Operador si tiene email
        const destinatariosSet = new Set(['logistica@arriendosanpablo.cl', 'j.poncenavarrete@gmail.com']);
        if (validadorUser.email) destinatariosSet.add(validadorUser.email);
        if (rep.op_email && rep.op_email.includes('@')) destinatariosSet.add(rep.op_email);

        for (const emailDest of destinatariosSet) {
          notificacionService.despacharEmailSmtp({
            para: emailDest,
            asunto: asunto,
            titulo: huboAjustes ? `Report Validado con Ajustes: ${codiOT}` : `Report Validado Conforme: ${codiOT}`,
            subtitulo: `Día ${diaNum} — Validado con PIN FES por ${nombreAnalista}`,
            contenido: contenidoMail,
            botonTexto: 'VER EN TORRE DE CONTROL',
            botonUrl: notificacionService.construirDeepLink({
              tipoApp: 'WEB',
              ruta: 'crm',
              params: { id_proyecto: rep.id_proyecto, subtab: 'reports' }
            })
          }).catch(e => console.warn(`[NOTIF-REPORT] Error enviando a ${emailDest}:`, e.message));
        }
      } catch (errNotif) {
        console.warn('[NOTIF-REPORT] Aviso: Fallo en envío de correo de validación:', errNotif.message);
      }

      res.json({
        success: true,
        message: huboAjustes 
          ? 'Report diario validado con firma electrónica FES y ajustes del Analista' 
          : 'Report diario validado y firmado electrónicamente con éxito',
        hubo_ajustes: huboAjustes,
        codigo_fes: codigoFes,
        id_doc_pdf: idDocPdf,
        url_pdf_view: urlPdfView,
        url_pdf_download: urlPdfDownload,
        data: reportActualizado
      });
    } catch (err) {
      console.error('Error al validar report diario:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 5. Obtener Resumen y Conciliación Financiera para Estado de Pago (EDP) (Spec 38)
  async getResumenEDP(req, res) {
    try {
      const { id_proyecto } = req.params;
      if (!id_proyecto) {
        return res.status(400).json({ error: 'id_proyecto es requerido' });
      }

      // 5.1 Datos de la OT y Cliente Mandante
      const proySql = `
        SELECT 
          p.id_proyecto,
          p.codi_proyecto,
          p.nombre_proyecto,
          p.id_proyecto_estado,
          p.json_field,
          COALESCE(clt.razon_social, clt.name_empresa, 'Cliente Mandante') AS cliente_nombre,
          COALESCE(clt.rut_empresa, '') AS cliente_rut,
          COALESCE(p.json_field->>'obra_nombre', p.json_field->'crm_v1'->>'obra_nombre', p.nombre_proyecto) AS obra_nombre,
          COALESCE(p.json_field->>'obra_direccion', p.json_field->'crm_v1'->>'obra_direccion', 'Faena en Terreno') AS obra_direccion
        FROM tpry_proyecto p
        LEFT JOIN tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
        WHERE p.id_proyecto = $1;
      `;
      const proyRes = await db.query(proySql, [id_proyecto]);
      if (proyRes.rows.length === 0) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }
      const proyecto = proyRes.rows[0];

      // 5.2 Obtener líneas cotizadas
      const crmV1 = proyecto.json_field?.crm_v1 || {};
      const lineasCotizadas = crmV1.lineas_servicio || crmV1.snapshot_comercial?.lines || [];

      // 5.3 Obtener todos los reports emitidos y fallback a jornadas ITS
      const repSql = `
        SELECT 
          r.id_reporte_avance,
          r.id_equipo,
          r.dia_correlativo,
          r.fecha_reporte,
          r.horas_operadas,
          r.horas_facturables,
          r.horas_sobretiempo,
          r.horometro_inicio,
          r.horometro_termino,
          r.cliente_nombre,
          r.cliente_cargo,
          r.cliente_firma_canvas_base64,
          r.estado_reporte,
          r.fecha_inicio_servicio,
          r.fecha_termino_servicio,
          COALESCE(e.patente, 'S/P') AS equipo_patente,
          COALESCE(e.modelo, 'Grúa') AS equipo_modelo
        FROM tedp_reporte_avance r
        LEFT JOIN tequ_equipo e ON r.id_equipo = e.id_equipo
        WHERE r.id_proyecto = $1
        ORDER BY r.dia_correlativo ASC, r.fecha_reporte ASC;
      `;
      const repRes = await db.query(repSql, [id_proyecto]);
      let reports = repRes.rows;

      let itsRow = null;
      try {
        const itsRes = await db.query(`
          SELECT * FROM tits_informe_termino
          WHERE id_proyecto = $1
          ORDER BY version DESC, id_its DESC LIMIT 1;
        `, [id_proyecto]);
        if (itsRes.rows.length > 0) {
          itsRow = itsRes.rows[0];
          if (reports.length === 0) {
            const jRes = await db.query(`
              SELECT * FROM tits_jornada_detalle
              WHERE id_its = $1 AND COALESCE(es_oculta, false) = false
              ORDER BY orden ASC, fecha ASC;
            `, [itsRow.id_its]);
            reports = jRes.rows.map((j, idx) => ({
              id_reporte_avance: j.id_jornada || (idx + 1),
              dia_correlativo: j.orden || (idx + 1),
              fecha_reporte: j.fecha,
              horas_operadas: Number(j.horas_report || 0),
              horas_facturables: Number(j.horas_report || 0),
              horas_sobretiempo: 0,
              horometro_inicio: j.horometro_inicio || 0,
              horometro_termino: j.horometro_termino || 0,
              cliente_nombre: j.cliente_nombre || 'Supervisor Mandante',
              cliente_cargo: j.cliente_cargo || 'ITO',
              estado_reporte: 'VALIDADO_ANALISTA',
              equipo_patente: j.patente || 'GRÚA',
              equipo_modelo: j.tipo_servicio || 'Grúa'
            }));
          }
        }
      } catch (_) {}

      // 5.4 Motor de Conciliación Financiera
      let totalHorasFacturables = 0;
      let totalHorasSobretiempo = 0;
      reports.forEach(r => {
        totalHorasFacturables += Number(r.horas_facturables) || 0;
        totalHorasSobretiempo += Number(r.horas_sobretiempo) || 0;
      });
      if (totalHorasFacturables === 0 && Number(itsRow?.total_horas_report) > 0) {
        totalHorasFacturables = Number(itsRow.total_horas_report);
      }

      // Calcular montos por línea
      let montoNetoEquipos = 0;
      let montoNetoFlete = 0;
      let montoNetoOtros = 0;

      let lineasCalculadas = lineasCotizadas.map(l => {
        const valUnit = Number(l.valorUnitario) || 0;
        const cant = Number(l.cantidad) || 1;
        let subtotal = 0;
        let horasCalculo = 0;

        if (l.tipo === 'TRASLADOS' || l.subcategoria?.includes('ESCOLTA') || l.subcategoria?.includes('FLETE')) {
          subtotal = valUnit * cant;
          montoNetoFlete += subtotal;
        } else if (l.tipo === 'GRUAS TELESCOPICAS' || l.tipo === 'GRUA HORQUILLA' || l.tipo === 'MANIPULADOR TELESCOPICO' || l.tipo === 'CAMION PLUMA') {
          if (l.unidad === 'Diario') {
            const diasFaena = Math.max(1, reports.length);
            subtotal = valUnit * diasFaena * cant;
            horasCalculo = totalHorasFacturables;
          } else {
            subtotal = valUnit * (totalHorasFacturables > 0 ? totalHorasFacturables : (cant * 8));
            horasCalculo = totalHorasFacturables;
          }
          montoNetoEquipos += subtotal;
        } else {
          subtotal = valUnit * cant;
          montoNetoOtros += subtotal;
        }

        return {
          ...l,
          subtotal_calculado: subtotal,
          horas_aplicadas: horasCalculo
        };
      });

      if (lineasCalculadas.length === 0 && itsRow && Number(itsRow.total_ingresos_facturables) > 0) {
        const ingHoras = Number(itsRow.total_ingresos_horas || 0);
        const ingFlete = Number(itsRow.total_ingresos_fletes || itsRow.valor_flete_pactado || 0);
        montoNetoEquipos = ingHoras > 0 ? ingHoras : Number(itsRow.total_ingresos_facturables) - ingFlete;
        montoNetoFlete = ingFlete;
        lineasCalculadas = [
          {
            tipo: 'GRUAS TELESCOPICAS',
            subcategoria: itsRow.folio_its || 'Servicio Izaje',
            unidad: 'Hora',
            cantidad: 1,
            valorUnitario: Number(itsRow.valor_hora_pactado || 0),
            subtotal_calculado: montoNetoEquipos,
            horas_aplicadas: totalHorasFacturables
          }
        ];
        if (ingFlete > 0) {
          lineasCalculadas.push({
            tipo: 'TRASLADOS',
            subcategoria: 'FLETE MOVILIZACIÓN / DESMOVILIZACIÓN',
            unidad: 'GL',
            cantidad: 1,
            valorUnitario: ingFlete,
            subtotal_calculado: ingFlete,
            horas_aplicadas: 0
          });
        }
      }

      // Cálculo de sobretiempo (tarifa estimada sobretiempo = 1.5x o pactada)
      const tarifaSobretiempoPromedio = montoNetoEquipos > 0 && totalHorasFacturables > 0 
        ? (montoNetoEquipos / totalHorasFacturables) * 1.5 
        : 50000;
      const montoSobretiempoNeto = Math.round(totalHorasSobretiempo * tarifaSobretiempoPromedio);

      const totalNeto = montoNetoEquipos + montoNetoFlete + montoNetoOtros + montoSobretiempoNeto;
      const iva19 = Math.round(totalNeto * 0.19);
      const totalBruto = totalNeto + iva19;

      const liquidacionGuardada = proyecto.json_field?.liquidacion_v1 || null;
      const jfProy = proyecto.json_field || {};
      const crmV1Proy = jfProy.crm_v1 || {};
      const requiereOc = Boolean(crmV1Proy.requiere_oc_hes ?? jfProy.datos_generales?.requiere_oc_hes ?? false);
      const ocsProy = Array.isArray(jfProy.ordenes_compra)
        ? jfProy.ordenes_compra
        : (Array.isArray(crmV1Proy.ordenes_compra) ? crmV1Proy.ordenes_compra : []);
      const tieneOc = ocsProy.length > 0 || Boolean(jfProy.oc_v1?.numero_oc);
      const edpFlujo = jfProy.edp_flujo_v1 || null;
      const edpValidado = Boolean(edpFlujo?.firma_2_contabilidad || edpFlujo?.firma_1_analista);
      const habilitadoFacturar = Boolean(edpValidado && (!requiereOc || tieneOc));

      res.json({
        success: true,
        data: {
          id_proyecto: proyecto.id_proyecto,
          proyecto: {
            id_proyecto: proyecto.id_proyecto,
            codi_proyecto: proyecto.codi_proyecto,
            nombre_proyecto: proyecto.nombre_proyecto,
            id_proyecto_estado: proyecto.id_proyecto_estado,
            cliente_nombre: proyecto.cliente_nombre,
            cliente_rut: proyecto.cliente_rut,
            obra_nombre: proyecto.obra_nombre,
            obra_direccion: proyecto.obra_direccion,
            json_field: proyecto.json_field || {}
          },
          edp_flujo_v1: edpFlujo,
          requiere_oc_hes: requiereOc,
          tiene_oc: tieneOc,
          ordenes_compra: ocsProy,
          habilitado_facturar: habilitadoFacturar,
          lineas_cotizadas: lineasCalculadas,
          reports_validados: reports,
          detalle_jornadas: reports.map(r => ({
            ...r,
            patente: r.equipo_patente || r.patente || 'GRÚA',
            modelo_equipo: r.equipo_modelo || r.modelo || 'Grúa',
            horas_efectivas: r.horas_operadas || r.horas_facturables || 0,
            horas_minimas: 8,
            subtotal_neto: totalHorasFacturables > 0
              ? Math.round((montoNetoEquipos / totalHorasFacturables) * Number(r.horas_facturables || 0))
              : 0
          })),
          resumen_financiero: {
            dias_totales: reports.length,
            horas_facturables_totales: totalHorasFacturables.toFixed(1),
            horas_sobretiempo_totales: totalHorasSobretiempo.toFixed(1),
            monto_equipos_neto: montoNetoEquipos,
            monto_flete_neto: montoNetoFlete,
            monto_otros_neto: montoNetoOtros,
            monto_sobretiempo_neto: montoSobretiempoNeto,
            total_neto: totalNeto,
            iva_19: iva19,
            total_bruto: totalBruto
          },
          liquidacion_guardada: liquidacionGuardada
        }
      });
    } catch (err) {
      console.error('Error al obtener resumen de EDP:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 6. Registrar Facturación y Cerrar Servicio OT (Spec 38)
  async cerrarFacturacion(req, res) {
    try {
      const { 
        id_proyecto, 
        hes_oc_numero, 
        factura_numero, 
        fecha_facturacion, 
        monto_facturado_neto,
        monto_facturado_bruto,
        observaciones_facturacion,
        id_user_cierre
      } = req.body;

      if (!id_proyecto) {
        return res.status(400).json({ error: 'id_proyecto es requerido' });
      }

      const liquidacionData = {
        hes_oc_numero: hes_oc_numero || '',
        factura_numero: factura_numero || '',
        fecha_facturacion: fecha_facturacion || new Date().toISOString().split('T')[0],
        monto_facturado_neto: Number(monto_facturado_neto) || 0,
        monto_facturado_bruto: Number(monto_facturado_bruto) || 0,
        observaciones_facturacion: observaciones_facturacion || '',
        id_user_cierre: id_user_cierre || null,
        fecha_cierre: new Date().toISOString(),
        estado_financiero: 'FACTURADO_CONFORME'
      };

      // Actualizar estado a 7 (Facturado / Cerrado) y guardar liquidacion_v1
      const updateSql = `
        UPDATE tpry_proyecto
        SET 
          id_proyecto_estado = 7,
          json_field = jsonb_set(
            COALESCE(json_field, '{}'::jsonb),
            '{liquidacion_v1}',
            $1::jsonb,
            true
          )
        WHERE id_proyecto = $2
        RETURNING id_proyecto, codi_proyecto, id_proyecto_estado, json_field;
      `;

      const result = await db.query(updateSql, [
        JSON.stringify(liquidacionData),
        id_proyecto
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }

      res.json({
        success: true,
        message: 'OT declarada Facturada y Concluida exitosamente',
        data: result.rows[0]
      });
    } catch (err) {
      console.error('Error al cerrar facturación de OT:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 7. Auditar Incumplimientos de SLA de Validación PMO (Spec 57 / REQ-026)
  async auditarSLA(req, res) {
    try {
      const auditoria = await slaAuditorService.auditarIncumplimientosSLA();
      res.json({ success: true, data: auditoria });
    } catch (err) {
      console.error('[SLA] Error al auditar SLA:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 8. Ejecutar Alertas de SLA WhatsApp y Email (Yiara y Jorge) (Spec 57 / REQ-026)
  async ejecutarAlertasSLA(req, res) {
    try {
      const forzar = req.body?.forzar === true || req.query?.forzar === 'true';
      const resultado = await slaAuditorService.ejecutarAlertasSLA(forzar);
      res.json(resultado);
    } catch (err) {
      console.error('[SLA] Error al ejecutar alertas de SLA:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 9. Normalización de Evidencias Físicas: Adjuntar documento escaneado/foto firmado por mandante
  async adjuntarRespaldoFisico(req, res) {
    try {
      const { id } = req.params;
      const { id_doc, notas_evidencia, id_user } = req.body || {};

      if (!id) {
        return res.status(400).json({ success: false, error: 'id_reporte_avance es requerido' });
      }

      // 1. Obtener reporte existente
      const repRes = await db.query(`
        SELECT r.*, p.codi_proyecto
        FROM tedp_reporte_avance r
        JOIN tpry_proyecto p ON r.id_proyecto = p.id_proyecto
        WHERE r.id_reporte_avance = $1
      `, [id]);

      if (repRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Reporte no encontrado' });
      }
      const rep = repRes.rows[0];

      let idDocFinal = id_doc ? parseInt(id_doc, 10) : null;
      let archivoInfo = null;
      const idUserValidador = id_user || req.user?.id_user || 55;

      // 2. Si se subió un archivo físico
      const uploadedFile = req.files?.archivo || req.files?.file;
      if (uploadedFile) {
        const path_relativo = buildStoragePath('GSP', 'reports');
        const targetDir = path.join(STORAGE_ROOT, path_relativo);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const ext = path.extname(uploadedFile.name) || '.pdf';
        const fileName = `Respaldo_Fisico_OT_${rep.codi_proyecto || rep.id_proyecto}_D${rep.dia_correlativo || 1}_${Date.now()}${ext}`;
        const filePath = path.join(targetDir, fileName);

        if (uploadedFile.mv) {
          await uploadedFile.mv(filePath);
        } else if (uploadedFile.data) {
          fs.writeFileSync(filePath, uploadedFile.data);
        }

        const archivoM = new archivoModel();
        const docFile = await archivoM.insertarTfmgFile(
          'REPORT_FISICO_RESPALDO',
          uploadedFile.mimetype || 'application/pdf',
          uploadedFile.name || fileName,
          fileName,
          path_relativo,
          idUserValidador,
          'A'
        );
        idDocFinal = docFile.id_doc;
        archivoInfo = docFile;
      }

      if (!idDocFinal) {
        return res.status(400).json({ success: false, error: 'Debe adjuntar un archivo (PDF/imagen) o indicar id_doc' });
      }

      // 3. Actualizar tedp_reporte_avance a VALIDADO_ANALISTA con respaldo físico
      const nowIso = new Date().toISOString();
      const ajustesActuales = typeof rep.ajustes_analista === 'object' && rep.ajustes_analista !== null ? rep.ajustes_analista : {};
      const nuevosAjustes = {
        ...ajustesActuales,
        evidencia_fisica_adjunta: true,
        requiere_evidencia_fisica: false,
        fecha_evidencia_adjuntada: nowIso,
        id_doc_evidencia: idDocFinal,
        usuario_adjunto: req.user?.name_frst ? `${req.user.name_frst} ${req.user.apellido_pat || ''}`.trim() : (req.user?.email || 'Control Gestión'),
        notas_evidencia: notas_evidencia || 'Respaldo físico digitalizado y verificado conforme'
      };

      // REQ-1107: Compilar el PDF oficial del Reporte Diario integrando automáticamente el documento/foto adjunto al final como Anexo
      let idDocPdfOficialConAnexo = idDocFinal;
      try {
        const proyResPdf = await db.query(
          `SELECT p.id_proyecto, p.codi_proyecto, p.nombre_proyecto, p.json_field,
                  COALESCE(clt.name_empresa, clt.razon_social, p.json_field->'crm_v1'->'cliente'->>'razon_social', 'CLIENTE MANDANTE') AS cliente_nombre,
                  COALESCE(clt.rut_empresa, p.json_field->'crm_v1'->'cliente'->>'rut', 'S/R') AS cliente_rut,
                  COALESCE(p.json_field->>'obra_nombre', p.json_field->'crm_v1'->>'obra_nombre', p.json_field->'ejecucion_v1'->'cliente'->>'obra', p.nombre_proyecto) AS obra_nombre,
                  COALESCE(p.json_field->>'obra_direccion', p.json_field->'crm_v1'->>'obra_direccion', p.json_field->'ejecucion_v1'->'cliente'->>'direccion_faena', 'Faena en Terreno') AS obra_direccion
           FROM tpry_proyecto p
           LEFT JOIN tpar_empresas clt ON clt.id_empresa = p.id_empresa_cliente
           WHERE p.id_proyecto = $1`,
          [rep.id_proyecto]
        );
        const proyRowPdf = proyResPdf.rows[0] || {};
        const eqResPdf = rep.id_equipo ? await db.query('SELECT patente, modelo FROM tequ_equipo WHERE id_equipo = $1', [rep.id_equipo]) : { rows: [] };
        const opResPdf = rep.id_user_operador ? await db.query('SELECT name_frst, apellido_pat FROM tsec_users WHERE id_user = $1', [rep.id_user_operador]) : { rows: [] };
        const rigResPdf = rep.id_user_rigger ? await db.query('SELECT name_frst, apellido_pat FROM tsec_users WHERE id_user = $1', [rep.id_user_rigger]) : { rows: [] };

        const pdfBufferIntegrado = await generarPdfReportDiario({
          report: {
            ...rep,
            ajustes_analista: nuevosAjustes,
            equipo_patente: eqResPdf.rows[0]?.patente || 'S/P',
            equipo_modelo: eqResPdf.rows[0]?.modelo || 'Grúa',
            op_nombre: opResPdf.rows[0]?.name_frst || '',
            op_apellido: opResPdf.rows[0]?.apellido_pat || '',
            rig_nombre: rigResPdf.rows[0]?.name_frst || null,
            rig_apellido: rigResPdf.rows[0]?.apellido_pat || null
          },
          proyecto: {
            codi_proyecto: proyRowPdf.codi_proyecto || `OT-${rep.id_proyecto}`,
            cliente_nombre: proyRowPdf.cliente_nombre,
            cliente_rut: proyRowPdf.cliente_rut,
            obra_nombre: proyRowPdf.obra_nombre,
            obra_direccion: proyRowPdf.obra_direccion
          },
          idDocEvidencia: idDocFinal,
          validador: { name_frst: nuevosAjustes.usuario_adjunto || 'Control Gestión', apellido_pat: '' },
          codigoFes: rep.codigo_validacion_fes || `FES-ANX-${id}`
        });

        const pathRelPdf = buildStoragePath('GSP', 'reports');
        const targetDirPdf = path.join(STORAGE_ROOT, pathRelPdf);
        if (!fs.existsSync(targetDirPdf)) fs.mkdirSync(targetDirPdf, { recursive: true });
        const fileNamePdf = `Report_Diario_OT_${proyRowPdf.codi_proyecto || rep.id_proyecto}_D${rep.dia_correlativo || 1}_${Date.now()}.pdf`;
        fs.writeFileSync(path.join(targetDirPdf, fileNamePdf), pdfBufferIntegrado);

        const archivoMPdf = new archivoModel();
        const docFilePdf = await archivoMPdf.insertarTfmgFile(
          'REPORT_DIARIO',
          'application/pdf',
          `Report_Diario_OT_${proyRowPdf.codi_proyecto || rep.id_proyecto}_D${rep.dia_correlativo || 1}.pdf`,
          fileNamePdf,
          pathRelPdf,
          idUserValidador,
          'A'
        );
        if (docFilePdf?.id_doc) {
          idDocPdfOficialConAnexo = docFilePdf.id_doc;
        }
      } catch (errCompAnexo) {
        console.warn('[REQ-1107] Aviso compilando PDF oficial con anexo integrado:', errCompAnexo.message);
      }

      const upRes = await db.query(`
        UPDATE tedp_reporte_avance
        SET id_doc_pdf = $1,
            estado_reporte = 'VALIDADO_ANALISTA',
            estado_jornada = 'CONCLUIDO',
            fecha_validacion = COALESCE(fecha_validacion, CURRENT_TIMESTAMP),
            id_user_validador = COALESCE(id_user_validador, $2),
            obs_validador = COALESCE(obs_validador, $3),
            ajustes_analista = $4
        WHERE id_reporte_avance = $5
        RETURNING *;
      `, [
        idDocPdfOficialConAnexo,
        idUserValidador,
        notas_evidencia || 'Validado mediante respaldo físico escaneado',
        JSON.stringify(nuevosAjustes),
        id
      ]);

      const repActualizado = upRes.rows[0];

      // 4. Registrar en dossier_documentos de la OT
      try {
        const proyRes = await db.query('SELECT json_field FROM tpry_proyecto WHERE id_proyecto = $1', [rep.id_proyecto]);
        if (proyRes.rows.length > 0) {
          const jf = proyRes.rows[0].json_field || {};
          if (!jf.ejecucion_v1) jf.ejecucion_v1 = {};
          if (!Array.isArray(jf.ejecucion_v1.dossier_documentos)) jf.ejecucion_v1.dossier_documentos = [];
          jf.ejecucion_v1.dossier_documentos.push({
            id_doc: idDocFinal,
            tipo_documento: 'REPORT_FISICO_RESPALDO',
            titulo: `Respaldo Físico Reporte Día ${rep.dia_correlativo || 1} (OT ${rep.codi_proyecto || rep.id_proyecto})`,
            nombre_archivo: archivoInfo?.name_doc_orig || `Respaldo_D${rep.dia_correlativo}.pdf`,
            url_vista: `/api/v1/storage/view/${idDocFinal}`,
            url_descarga: `/api/v1/storage/download/${idDocFinal}`,
            fecha_adjunto: nowIso
          });
          await db.query('UPDATE tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2', [JSON.stringify(jf), rep.id_proyecto]);
        }
      } catch (errDossier) {
        console.warn('[Dossier] No se pudo agregar al dossier:', errDossier.message);
      }

      res.json({
        success: true,
        message: 'Respaldo físico adjuntado y reporte validado exitosamente',
        data: repActualizado
      });
    } catch (err) {
      console.error('[Adjuntar Respaldo] Error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 10. Regularización Directa Manual de Reporte Físico (Pestaña 6 o API)
  async regularizarReporteManual(req, res) {
    try {
      const {
        id_proyecto,
        id_equipo,
        id_user_operador,
        dia_correlativo,
        fecha_reporte,
        hora_inicio,
        hora_termino,
        horas_colacion,
        horas_minimas,
        horometro_inicio,
        horometro_termino,
        odometro_inicio,
        odometro_termino,
        cliente_nombre,
        cliente_cargo,
        observacion_trabajo,
        motivo
      } = req.body || {};

      if (!id_proyecto || !fecha_reporte) {
        return res.status(400).json({ success: false, error: 'id_proyecto y fecha_reporte son requeridos' });
      }

      // Validar proyecto
      const pRes = await db.query('SELECT id_proyecto, codi_proyecto, json_field FROM tpry_proyecto WHERE id_proyecto = $1', [id_proyecto]);
      if (pRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
      }
      const proyecto = pRes.rows[0];

      // Determinar equipo, operador y rigger (REQ-1090: soporte nativo para servicios Solo Personal / Rigger sin maquinaria)
      let finalEqId = parseInt(id_equipo, 10) || null;
      if (!finalEqId) {
        const eqRes = await db.query('SELECT id_equipo FROM tpry_rel_equipo WHERE id_proyecto = $1 LIMIT 1', [id_proyecto]);
        finalEqId = eqRes.rows[0]?.id_equipo || null;
      }

      const rigRes = await db.query(`
        SELECT u.id_user FROM tpry_rel_persona rp
        JOIN tsec_users u ON rp.id_user = u.id_user
        WHERE rp.id_proyecto = $1 AND UPPER(rp.rol_asignado) LIKE '%RIGGER%'
        ORDER BY rp.id_rel_persona DESC
        LIMIT 1
      `, [id_proyecto]);
      const finalRiggerId = rigRes.rows[0]?.id_user || parseInt(proyecto.json_field?.ejecucion_v1?.rigger_id, 10) || null;

      let finalOpId = parseInt(id_user_operador, 10) || null;
      if (!finalOpId) {
        const uRes = await db.query(`
          SELECT u.id_user FROM tpry_rel_persona rp 
          JOIN tsec_users u ON rp.id_user = u.id_user 
          WHERE rp.id_proyecto = $1 AND (UPPER(rp.rol_asignado) LIKE '%OPERADOR%' OR UPPER(rp.rol_asignado) LIKE '%CHOFER%')
          ORDER BY rp.id_rel_persona DESC
          LIMIT 1
        `, [id_proyecto]);
        finalOpId = uRes.rows[0]?.id_user || finalRiggerId || 53;
      }

      // Determinar correlativo
      let diaCorr = parseInt(dia_correlativo, 10) || 0;
      if (!diaCorr) {
        const maxD = await db.query('SELECT COALESCE(MAX(dia_correlativo), 0) + 1 as next_d FROM tedp_reporte_avance WHERE id_proyecto = $1', [id_proyecto]);
        diaCorr = parseInt(maxD.rows[0]?.next_d || 1, 10);
      }

      // Procesar archivo si viene adjunto en la misma solicitud
      let idDocFinal = null;
      const uploadedFile = req.files?.archivo || req.files?.file;
      if (uploadedFile) {
        const path_relativo = buildStoragePath('GSP', 'reports');
        const targetDir = path.join(STORAGE_ROOT, path_relativo);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        const ext = path.extname(uploadedFile.name) || '.pdf';
        const fileName = `Respaldo_Fisico_OT_${proyecto.codi_proyecto || proyecto.id_proyecto}_D${diaCorr}_${Date.now()}${ext}`;
        const filePath = path.join(targetDir, fileName);

        if (uploadedFile.mv) {
          await uploadedFile.mv(filePath);
        } else if (uploadedFile.data) {
          fs.writeFileSync(filePath, uploadedFile.data);
        }

        const archivoM = new archivoModel();
        const docFile = await archivoM.insertarTfmgFile(
          'REPORT_FISICO_RESPALDO',
          uploadedFile.mimetype || 'application/pdf',
          uploadedFile.name || fileName,
          fileName,
          path_relativo,
          req.user?.id_user || 55,
          'A'
        );
        idDocFinal = docFile.id_doc;
      }

      const tieneDoc = Boolean(idDocFinal);
      // Determinar si es solo inicio de jornada (sin hora_termino explícita o sin horómetro de término ni respaldo físico)
      const tieneTerminoReal = Boolean(
        tieneDoc ||
        (horometro_termino !== undefined && horometro_termino !== null && String(horometro_termino).trim() !== '') ||
        (hora_termino && String(hora_termino).trim() !== '' && String(hora_termino).trim() !== '18:00')
      );

      const hIni = hora_inicio || '08:00';
      const tsIni = `${fecha_reporte} ${hIni}:00`;
      const tsFin = tieneTerminoReal ? `${fecha_reporte} ${hora_termino || '18:00'}:00` : null;

      const diffMin = tsFin ? Math.max(0, (new Date(tsFin) - new Date(tsIni)) / 60000) : 0;
      const colac = tieneTerminoReal ? parseFloat(horas_colacion !== undefined ? horas_colacion : 1.0) : 0;
      const operadas = tieneTerminoReal ? Math.max(0, parseFloat(((diffMin - colac * 60) / 60).toFixed(2))) : 0;
      const pisoContractualOT = resolverPisoMinimoContractualOT(proyecto?.json_field || {}, finalEqId);
      const minimas = (horas_minimas !== undefined && horas_minimas !== null && String(horas_minimas).trim() !== '')
        ? parseFloat(horas_minimas)
        : (pisoContractualOT !== undefined && pisoContractualOT !== null ? parseFloat(pisoContractualOT) : 8.0);
      const facturables = tieneTerminoReal ? (minimas > 0 ? Math.max(operadas, minimas) : operadas) : 0;
      const sobretiempo = tieneTerminoReal ? (minimas > 0 ? Math.max(0, parseFloat((operadas - minimas).toFixed(2))) : 0) : 0;

      const estadoReporte = !tieneTerminoReal
        ? 'JORNADA_EN_CURSO'
        : (tieneDoc ? 'VALIDADO_ANALISTA' : 'REGULARIZADO_MANUAL');
      const estadoJornada = !tieneTerminoReal ? 'JORNADA_EN_CURSO' : 'CONCLUIDO';
      const tokenReport = `REG-${id_proyecto}-D${diaCorr}-${Date.now().toString().slice(-4)}`;

      const ajustesAnalista = {
        origen: 'REGULARIZACION_MANUAL_PMO',
        regularizado_manual: true,
        solo_inicio_jornada: !tieneTerminoReal,
        requiere_evidencia_fisica: !tieneDoc,
        evidencia_fisica_adjunta: tieneDoc,
        id_doc_evidencia: idDocFinal,
        modificado_por: req.user?.name_frst ? `${req.user.name_frst} ${req.user.apellido_pat || ''}`.trim() : (req.user?.email || 'Control Gestión'),
        fecha_regularizacion: new Date().toISOString(),
        motivo: motivo || (!tieneTerminoReal ? 'Apertura manual de inicio de jornada' : 'Carga manual directa de reporte físico')
      };

      const insSql = `
        INSERT INTO tedp_reporte_avance (
          id_proyecto,
          id_equipo,
          id_user_operador,
          id_user_rigger,
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
          horometro_inicio,
          horometro_termino,
          odometro_inicio,
          odometro_termino,
          cliente_nombre,
          cliente_cargo,
          observacion_trabajo,
          token_report,
          estado_reporte,
          estado_jornada,
          id_doc_pdf,
          ajustes_analista,
          fecha_registro,
          fecha_validacion
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'HRS_DIA', $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, CURRENT_TIMESTAMP, $26
        ) RETURNING *;
      `;

      const result = await db.query(insSql, [
        id_proyecto,
        finalEqId,
        finalOpId,
        finalRiggerId,
        diaCorr,
        fecha_reporte,
        tsIni,
        tsFin,
        operadas,
        facturables,
        sobretiempo,
        colac,
        minimas,
        horometro_inicio || null,
        tieneTerminoReal ? (horometro_termino || null) : null,
        odometro_inicio || null,
        tieneTerminoReal ? (odometro_termino || null) : null,
        cliente_nombre || 'Cliente Mandante',
        cliente_cargo || 'Supervisor Faena',
        observacion_trabajo || (!tieneTerminoReal ? 'Inicio de jornada registrado por Control de Gestión' : 'Reporte regularizado físicamente'),
        tokenReport,
        estadoReporte,
        estadoJornada,
        idDocFinal,
        JSON.stringify(ajustesAnalista),
        tieneDoc ? new Date().toISOString() : null
      ]);

      res.status(201).json({
        success: true,
        message: 'Reporte diario regularizado exitosamente',
        data: result.rows[0]
      });
    } catch (err) {
      console.error('[Regularizar Reporte Manual] Error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * 16. Rectificación Retroactiva de Operador y Rigger desde Asignación de Recursos (SPEC-077 / REQ-1043)
   * POST /api/operaciones/report/proyecto/:id_proyecto/rectificar-tripulacion
   */
  async rectificarTripulacionProyecto(req, res) {
    try {
      const { id_proyecto } = req.params;
      const {
        id_equipo,
        id_user_operador_nuevo,
        id_user_rigger_nuevo,
        Alcance,
        fecha_desde,
        fecha_hasta,
        id_user_autor,
        motivo_rectificacion
      } = req.body;

      if (!id_proyecto || (!id_user_operador_nuevo && id_user_rigger_nuevo === undefined)) {
        return res.status(400).json({ success: false, error: 'Se requiere id_proyecto y al menos un operador o rigger a rectificar.' });
      }

      let opInfo = null;
      if (id_user_operador_nuevo) {
        const uRes = await pool.query(`SELECT id_user, user_name, user_lastname, activo FROM tsec_users WHERE id_user = $1`, [id_user_operador_nuevo]);
        if (uRes.rows.length > 0) {
          if (uRes.rows[0].activo === false) {
            return res.status(400).json({ success: false, error: 'El operador seleccionado se encuentra INACTIVO y no puede ser asignado.' });
          }
          opInfo = uRes.rows[0];
        }
      }
      let rigInfo = null;
      if (id_user_rigger_nuevo) {
        const rRes = await pool.query(`SELECT id_user, user_name, user_lastname, activo FROM tsec_users WHERE id_user = $1`, [id_user_rigger_nuevo]);
        if (rRes.rows.length > 0) {
          if (rRes.rows[0].activo === false) {
            return res.status(400).json({ success: false, error: 'El rigger seleccionado se encuentra INACTIVO y no puede ser asignado.' });
          }
          rigInfo = rRes.rows[0];
        }
      }

      const params = [id_proyecto];
      let whereClause = `ra.id_proyecto = $1`;
      if (id_equipo) {
        params.push(id_equipo);
        whereClause += ` AND ra.id_equipo = $${params.length}`;
      }
      if (Alcance === 'RANGO_FECHAS' && fecha_desde && fecha_hasta) {
        params.push(fecha_desde, fecha_hasta);
        whereClause += ` AND ra.fecha_reporte::date BETWEEN $${params.length - 1}::date AND $${params.length}::date`;
      } else if (Alcance === 'PENDIENTES') {
        whereClause += ` AND ra.estado_reporte != 'VALIDADO_ANALISTA'`;
      }

      const repsRes = await pool.query(`
        SELECT ra.*,
               eq.codigo_interno, eq.patente, eq.marca, eq.modelo, eq.capacidad_ton,
               u.user_name as op_nombre, u.user_lastname as op_apellido, u.email as op_email,
               ur.user_name as rig_nombre, ur.user_lastname as rig_apellido,
               val.user_name as val_nombre, val.user_lastname as val_apellido, val.email as val_email,
               p.nombre_proyecto, p.codigo_proyecto, p.json_field as pry_json,
               cli.razon_social as cliente_razon_social, cli.rut_empresa as cliente_rut
        FROM tedp_reporte_avance ra
        LEFT JOIN tlog_equipo eq ON ra.id_equipo = eq.id_equipo
        LEFT JOIN tsec_users u ON ra.id_user_operador = u.id_user
        LEFT JOIN tsec_users ur ON ra.id_user_rigger = ur.id_user
        LEFT JOIN tsec_users val ON ra.id_user_validador_interno = val.id_user
        LEFT JOIN tpry_proyecto p ON ra.id_proyecto = p.id_proyecto
        LEFT JOIN tcrm_cliente cli ON p.id_cliente = cli.id_cliente
        WHERE ${whereClause}
        ORDER BY ra.fecha_reporte ASC, ra.id_reporte ASC
      `, params);

      let reportesActualizados = 0;
      let pdfsRegenerados = 0;

      for (const rep of repsRes.rows) {
        const finalOpId = id_user_operador_nuevo ? Number(id_user_operador_nuevo) : rep.id_user_operador;
        const finalRigId = id_user_rigger_nuevo !== undefined ? (id_user_rigger_nuevo ? Number(id_user_rigger_nuevo) : null) : rep.id_user_rigger;

        const prevAjustes = typeof rep.ajustes_analista === 'object' && rep.ajustes_analista !== null ? rep.ajustes_analista : {};
        const prevOriginales = prevAjustes.valores_originales || {
          id_user_operador: rep.id_user_operador,
          operador_nombre: `${rep.op_nombre || ''} ${rep.op_apellido || ''}`.trim() || null,
          id_user_rigger: rep.id_user_rigger || null,
          rigger_nombre: rep.rig_nombre ? `${rep.rig_nombre || ''} ${rep.rig_apellido || ''}`.trim() : null
        };

        const nuevoOpNombre = opInfo ? opInfo.user_name : rep.op_nombre;
        const nuevoOpApellido = opInfo ? opInfo.user_lastname : rep.op_apellido;
        const nuevoRigNombre = id_user_rigger_nuevo !== undefined ? (rigInfo ? rigInfo.user_name : null) : rep.rig_nombre;
        const nuevoRigApellido = id_user_rigger_nuevo !== undefined ? (rigInfo ? rigInfo.user_lastname : null) : rep.rig_apellido;

        const nuevoAjustes = {
          ...prevAjustes,
          fecha_rectificacion_tripulacion: new Date().toISOString(),
          id_user_rectificador: id_user_autor || null,
          motivo_rectificacion_tripulacion: motivo_rectificacion || 'Rectificación de Operador/Rigger desde Asignación de Recursos OT',
          valores_originales: {
            ...prevOriginales,
            id_user_operador: prevOriginales.id_user_operador ?? rep.id_user_operador,
            operador_nombre: prevOriginales.operador_nombre ?? (`${rep.op_nombre || ''} ${rep.op_apellido || ''}`.trim() || null),
            id_user_rigger: prevOriginales.id_user_rigger !== undefined ? prevOriginales.id_user_rigger : (rep.id_user_rigger || null),
            rigger_nombre: prevOriginales.rigger_nombre !== undefined ? prevOriginales.rigger_nombre : (rep.rig_nombre ? `${rep.rig_nombre || ''} ${rep.rig_apellido || ''}`.trim() : null)
          },
          valores_ajustados: {
            ...(prevAjustes.valores_ajustados || {}),
            id_user_operador: finalOpId,
            operador_nombre: `${nuevoOpNombre || ''} ${nuevoOpApellido || ''}`.trim() || null,
            id_user_rigger: finalRigId,
            rigger_nombre: nuevoRigNombre ? `${nuevoRigNombre || ''} ${nuevoRigApellido || ''}`.trim() : null
          }
        };

        let idDocPdf = rep.id_doc_pdf;
        if (rep.estado_reporte === 'VALIDADO_ANALISTA') {
          try {
            const pryJson = rep.pry_json || {};
            const comV1 = pryJson.comercial_v1 || {};
            const pdfData = {
              ...rep,
              id_user_operador: finalOpId,
              id_user_rigger: finalRigId,
              op_nombre: nuevoOpNombre,
              op_apellido: nuevoOpApellido,
              rig_nombre: nuevoRigNombre,
              rig_apellido: nuevoRigApellido,
              ajustes_analista: nuevoAjustes,
              id_user_validador_interno: rep.id_user_validador_interno || id_user_autor,
              val_nombre: rep.val_nombre || 'Control Gestión',
              val_apellido: rep.val_apellido || 'GSP',
              val_email: rep.val_email || '',
              fecha_validacion_interna: rep.fecha_validacion_interna || new Date().toISOString(),
              comercial_faena: comV1.faena || pryJson.direccion_faena || rep.nombre_proyecto,
              comercial_Modalidad: comV1.Modalidad_tarifa || 'Por Hora'
            };

            const pdfGen = await generarPdfReportDiario(pdfData);
            if (pdfGen && pdfGen.filePath) {
              const docRes = await pool.query(`
                INSERT INTO tdoc_documento (
                  nombre_archivo, ruta_almacenamiento, mime_type, tamano_bytes,
                  id_user_creador, origen_cargado
                ) VALUES ($1, $2, 'application/pdf', $3, $4, 'SISTEMA_FES')
                RETURNING id_documento
              `, [pdfGen.fileName, pdfGen.filePath, pdfGen.sizeBytes, id_user_autor || rep.id_user_validador_interno || 1]);
              idDocPdf = docRes.rows[0].id_documento;
              pdfsRegenerados++;

              await pool.query(`
                INSERT INTO trel_documento (id_documento, tabla_rel, id_registro_rel, tipo_relacion)
                VALUES ($1, 'tpry_proyecto', $2, 'REPORT_DIARIO_FIRMADO')
              `, [idDocPdf, rep.id_proyecto]);
            }
          } catch (pdfErr) {
            console.error('[Rectificar Tripulación] Error regenerando PDF reporte', rep.id_reporte, pdfErr);
          }
        }

        await pool.query(`
          UPDATE tedp_reporte_avance
          SET id_user_operador = $1,
              id_user_rigger = $2,
              ajustes_analista = $3::jsonb,
              id_doc_pdf = $4
          WHERE id_reporte = $5
        `, [finalOpId, finalRigId, JSON.stringify(nuevoAjustes), idDocPdf, rep.id_reporte]);

        reportesActualizados++;
      }

      // Sincronizar también despachos de flota (tlog_despacho_flota) si se rectificó el operador
      let despachosActualizados = 0;
      if (id_user_operador_nuevo) {
        const despParams = [id_user_operador_nuevo, id_proyecto];
        let despWhere = `id_proyecto = $2`;
        if (id_equipo) {
          despParams.push(id_equipo);
          despWhere += ` AND id_equipo = $3`;
        }
        const despRes = await pool.query(`
          UPDATE tlog_despacho_flota
          SET id_user_operador = $1
          WHERE ${despWhere}
        `, despParams);
        despachosActualizados = despRes.rowCount || 0;
      }

      return res.json({
        success: true,
        message: `Tripulación rectificada en ${reportesActualizados} reporte(s) (${pdfsRegenerados} PDFs regenerados) y ${despachosActualizados} registro(s) de despacho.`,
        data: {
          reportes_actualizados: reportesActualizados,
          pdfs_regenerados: pdfsRegenerados,
          despachos_actualizados: despachosActualizados
        }
      });
    } catch (err) {
      console.error('[rectificarTripulacionProyecto] Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // [SPEC-098] Streaming de PDF con Auto-Reparación para Reportes Diarios
  async obtenerPdfReportDiario(req, res) {
    try {
      const { id } = req.params;
      const repRes = await db.query('SELECT * FROM tedp_reporte_avance WHERE id_reporte_avance = $1', [id]);
      if (repRes.rows.length === 0) {
        return res.status(404).send('Reporte diario no encontrado');
      }
      const rep = repRes.rows[0];

      // Si ya tiene PDF oficial compilado (y no apunta únicamente al respaldo bruto sin el formato oficial), servirlo directamente
      const idEvidenciaBruta = rep.ajustes_analista?.id_doc_evidencia || null;
      if (rep.id_doc_pdf && Number(rep.id_doc_pdf) !== Number(idEvidenciaBruta)) {
        req.params.id = rep.id_doc_pdf;
        const archivoController = require('./archivoController');
        return archivoController.verArchivoById(req, res);
      }

      // Si no tiene id_doc_pdf, compilar al vuelo y auto-reparar en base de datos
      const proyRes = await db.query(
        `SELECT p.id_proyecto, p.codi_proyecto, p.nombre_proyecto, p.json_field,
                COALESCE(clt.name_empresa, clt.razon_social, p.json_field->'crm_v1'->'cliente'->>'razon_social', 'CLIENTE MANDANTE') AS cliente_nombre,
                COALESCE(clt.rut_empresa, p.json_field->'crm_v1'->'cliente'->>'rut', 'S/R') AS cliente_rut,
                COALESCE(p.json_field->>'obra_nombre', p.json_field->'crm_v1'->>'obra_nombre', p.json_field->'ejecucion_v1'->'cliente'->>'obra', p.nombre_proyecto) AS obra_nombre,
                COALESCE(p.json_field->>'obra_direccion', p.json_field->'crm_v1'->>'obra_direccion', p.json_field->'ejecucion_v1'->'cliente'->>'direccion_faena', 'Faena en Terreno') AS obra_direccion
         FROM tpry_proyecto p
         LEFT JOIN tpar_empresas clt ON clt.id_empresa = p.id_empresa_cliente
         WHERE p.id_proyecto = $1`,
        [rep.id_proyecto]
      );
      const proyRow = proyRes.rows[0] || {};
      const eqRes = await db.query('SELECT patente, modelo FROM tequ_equipo WHERE id_equipo = $1', [rep.id_equipo]);
      const opRes = await db.query('SELECT name_frst, apellido_pat FROM tsec_users WHERE id_user = $1', [rep.id_user_operador]);
      const rigRes = rep.id_user_rigger ? await db.query('SELECT name_frst, apellido_pat FROM tsec_users WHERE id_user = $1', [rep.id_user_rigger]) : { rows: [] };

      const pdfBuffer = await generarPdfReportDiario({
        report: {
          ...rep,
          equipo_patente: eqRes.rows[0]?.patente || 'S/P',
          equipo_modelo: eqRes.rows[0]?.modelo || 'Grúa',
          op_nombre: opRes.rows[0]?.name_frst || '',
          op_apellido: opRes.rows[0]?.apellido_pat || '',
          rig_nombre: rigRes.rows[0]?.name_frst || null,
          rig_apellido: rigRes.rows[0]?.apellido_pat || null
        },
        proyecto: {
          codi_proyecto: proyRow.codi_proyecto || `OT-${rep.id_proyecto}`,
          cliente_nombre: proyRow.cliente_nombre,
          cliente_rut: proyRow.cliente_rut,
          obra_nombre: proyRow.obra_nombre,
          obra_direccion: proyRow.obra_direccion
        },
        validador: rep.estado_reporte === 'VALIDADO_ANALISTA' ? { name_frst: rep.validador_nombre || 'Analista PMO' } : null,
        codigoFes: rep.codigo_validacion_fes || null
      });

      // Auto-reparar en base de datos para la próxima consulta
      try {
        const path_relativo = buildStoragePath('GSP', 'reports');
        const targetDir = path.join(STORAGE_ROOT, path_relativo);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
        const fileName = `Report_Diario_OT_${proyRow.codi_proyecto || rep.id_proyecto}_D${rep.dia_correlativo || 1}_${Date.now()}.pdf`;
        const filePath = path.join(targetDir, fileName);
        fs.writeFileSync(filePath, pdfBuffer);

        const archivoM = new archivoModel();
        const docFile = await archivoM.insertarTfmgFile(
          'REPORT_DIARIO',
          'application/pdf',
          `Report_Diario_OT_${proyRow.codi_proyecto || rep.id_proyecto}_D${rep.dia_correlativo || 1}.pdf`,
          fileName,
          path_relativo,
          rep.id_user_operador || 1,
          'A'
        );
        if (docFile?.id_doc) {
          await db.query('UPDATE tedp_reporte_avance SET id_doc_pdf = $1 WHERE id_reporte_avance = $2', [docFile.id_doc, id]);
        }
      } catch (saveErr) {
        console.warn('[SPEC-098] Auto-reparación storage warning:', saveErr.message);
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Report_Diario_${proyRow.codi_proyecto || rep.id_proyecto}_D${rep.dia_correlativo || 1}.pdf"`);
      return res.send(pdfBuffer);
    } catch (err) {
      console.error('Error al obtener/compilar PDF dinámico de report:', err);
      res.status(500).send('Error generando PDF: ' + err.message);
    }
  }
};

module.exports = reportDiarioController;

