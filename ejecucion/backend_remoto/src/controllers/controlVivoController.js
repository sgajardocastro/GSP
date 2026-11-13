const fs = require('fs');
const path = require('path');
const pool = require('../config/postgresPool');
const { config } = require('../config/config');
const { buildStoragePath, STORAGE_ROOT } = require('../config/storageConfig');
const archivoModel = require('../models/archivoModel');
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

function formatLocalIsoDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Catálogo de Feriados de Chile (Fijos + Móviles 2025-2027) para Ribbon PMO (REQ-1824)
const FERIADOS_CHILE_FIJOS = {
  '01-01': 'Año Nuevo',
  '05-01': 'Día del Trabajo',
  '05-21': 'Glorias Navales',
  '06-20': 'Pueblos Indígenas',
  '06-21': 'Pueblos Indígenas',
  '06-29': 'San Pedro y San Pablo',
  '07-16': 'Virgen del Carmen',
  '08-15': 'Asunción de la Virgen',
  '09-18': 'Independencia Nacional',
  '09-19': 'Glorias del Ejército',
  '10-12': 'Encuentro de Dos Mundos',
  '10-31': 'Iglesias Evangélicas',
  '11-01': 'Todos los Santos',
  '12-08': 'Inmaculada Concepción',
  '12-25': 'Navidad'
};

const FERIADOS_CHILE_MOVILES = {
  '2025-04-18': 'Viernes Santo',
  '2025-04-19': 'Sábado Santo',
  '2026-04-03': 'Viernes Santo',
  '2026-04-04': 'Sábado Santo',
  '2027-03-26': 'Viernes Santo',
  '2027-03-27': 'Sábado Santo'
};

function obtenerNombreFeriadoChile(fechaIsoStr) {
  if (!fechaIsoStr) return null;
  const f = String(fechaIsoStr).split('T')[0];
  if (FERIADOS_CHILE_MOVILES[f]) return FERIADOS_CHILE_MOVILES[f];
  const mmdd = f.slice(5, 10);
  return FERIADOS_CHILE_FIJOS[mmdd] || null;
}

function evaluarNaturalezaDiaCalendario(fechaIsoStr, overridesMap = {}) {
  const fStr = String(fechaIsoStr).split('T')[0];
  const d = new Date(fStr + 'T00:00:00');
  const day = isNaN(d.getTime()) ? 1 : d.getDay(); // 0=Dom, 6=Sab
  const nombreFeriado = obtenerNombreFeriadoChile(fStr);
  const esSabado = day === 6;
  const esDomingo = day === 0;
  const esFeriado = !!nombreFeriado;
  const esFdsOFeriado = esSabado || esDomingo || esFeriado;

  let etiquetaNoLaboral = 'NO LAB';
  let motivoNoLaboral = 'Día No Laboral';
  if (esFeriado) {
    etiquetaNoLaboral = 'FERIADO';
    motivoNoLaboral = `Feriado: ${nombreFeriado}`;
  } else if (esSabado) {
    etiquetaNoLaboral = 'SÁB FDS';
    motivoNoLaboral = 'Sábado (Fin de Semana)';
  } else if (esDomingo) {
    etiquetaNoLaboral = 'DOM FDS';
    motivoNoLaboral = 'Domingo (Fin de Semana)';
  }

  const defaultLaboral = !esFdsOFeriado;
  const tieneOverride = overridesMap && Object.prototype.hasOwnProperty.call(overridesMap, fStr);
  const esLaboral = tieneOverride ? Boolean(overridesMap[fStr]) : defaultLaboral;

  return {
    fecha: fStr,
    es_laboral: esLaboral,
    es_fds_o_feriado: esFdsOFeriado,
    es_sabado: esSabado,
    es_domingo: esDomingo,
    es_feriado: esFeriado,
    nombre_feriado: nombreFeriado,
    etiqueta_no_laboral: etiquetaNoLaboral,
    motivo_no_laboral: motivoNoLaboral,
    override_laboral: tieneOverride
  };
}

// Construye el calendario corrido completo entre fechaIniStr y fechaFinStr incluyendo Sábados, Domingos y Feriados (más el FDS/Feriado contiguo al cierre)
function getCalendarioCompletoRibbon(fechaIniStr, fechaFinStr, overridesMap = {}) {
  const calendario = [];
  if (!fechaIniStr || !fechaFinStr) return calendario;
  const dIni = new Date(String(fechaIniStr).split('T')[0] + 'T00:00:00');
  let dFin = new Date(String(fechaFinStr).split('T')[0] + 'T00:00:00');
  if (isNaN(dIni.getTime()) || isNaN(dFin.getTime()) || dFin < dIni) return calendario;

  // Extender dFin si existen fechas con override explícito posteriores
  if (overridesMap && typeof overridesMap === 'object') {
    for (const k of Object.keys(overridesMap)) {
      const dk = new Date(String(k).split('T')[0] + 'T00:00:00');
      if (!isNaN(dk.getTime()) && dk > dFin && (dk - dIni) / 86400000 <= 366) {
        dFin = dk;
      }
    }
  }

  let curr = new Date(dIni);
  while (curr <= dFin && calendario.length < 366) {
    const fStr = formatLocalIsoDate(curr);
    calendario.push(evaluarNaturalezaDiaCalendario(fStr, overridesMap));
    curr.setDate(curr.getDate() + 1);
  }

  // Si el rango termina antes de un Sábado, Domingo o Feriado contiguo, desplegar también esos días en rojo (FDS/Feriado) en el Ribbon
  let extraGuard = 0;
  while (extraGuard < 5 && calendario.length < 366) {
    const fNextStr = formatLocalIsoDate(curr);
    const infoNext = evaluarNaturalezaDiaCalendario(fNextStr, overridesMap);
    if (infoNext.es_fds_o_feriado || infoNext.override_laboral) {
      calendario.push(infoNext);
      curr.setDate(curr.getDate() + 1);
      extraGuard++;
    } else {
      break;
    }
  }

  return calendario;
}

// Calcular lista de días laborales entre dos fechas (excluye Sábados y Domingos, con fallback si el rango es de fin de semana)
function getListaDiasHabiles(fechaIniStr, fechaFinStr, overridesMap = {}) {
  const cal = getCalendarioCompletoRibbon(fechaIniStr, fechaFinStr, overridesMap);
  const laborales = cal.filter(c => c.es_laboral).map(c => c.fecha);
  return laborales.length > 0 ? laborales : cal.map(c => c.fecha);
}

// Generar N días hábiles a partir de una fecha inicial YYYY-MM-DD
function generarNDiasHabilesDesde(fechaIniStr, cantidadDias, overridesMap = {}) {
  const res = [];
  if (!fechaIniStr) return res;
  const dIni = new Date(String(fechaIniStr).split('T')[0] + 'T00:00:00');
  if (isNaN(dIni.getTime())) return res;
  const meta = Math.max(1, Number(cantidadDias) || 1);
  let curr = new Date(dIni);
  let guard = 0;
  while (res.length < meta && guard < 366) {
    const fStr = formatLocalIsoDate(curr);
    const info = evaluarNaturalezaDiaCalendario(fStr, overridesMap);
    if (info.es_laboral) {
      res.push(fStr);
    } else if (meta === 1 && res.length === 0) {
      res.push(fStr);
    }
    curr.setDate(curr.getDate() + 1);
    guard++;
  }
  return res;
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
        WHERE p.id_proyecto_estado IN (4, 5, 6, 7, 8)
          AND (
            -- 1. Dentro de la ventana de fechas planificadas
            $1 BETWEEN COALESCE(p.fecha_plan_ini::date, NULLIF(p.json_field->'ejecucion_v1'->>'fecha_salida_plan', '')::date, CURRENT_DATE - interval '14 days')
                   AND COALESCE(p.fecha_plan_fin::date, NULLIF(p.json_field->'ejecucion_v1'->>'fecha_fin_plan', '')::date, CURRENT_DATE + interval '30 days')
            -- 2. O existe reporte emitido en la fecha consultada
            OR EXISTS (
              SELECT 1 FROM ${SCHEMA}.tedp_reporte_avance r WHERE r.id_proyecto = p.id_proyecto AND r.fecha_reporte::date = $1
            )
            -- 3. O existe viaje/desplazamiento en la fecha consultada
            OR EXISTS (
              SELECT 1 FROM ${SCHEMA}.tequ_log_desplazamiento v 
              WHERE v.id_proyecto = p.id_proyecto 
                AND (v.fecha_salida_patio::date = $1 OR v.fecha_llegada_faena::date = $1 OR v.fecha_programada::date = $1)
            )
            -- 4. O existe inspección de patio en la fecha consultada
            OR EXISTS (
              SELECT 1 FROM ${SCHEMA}.tsrv_survey s 
              WHERE s.id_proyecto = p.id_proyecto 
                AND (s.fecha_real_ini::date = $1 OR s.created::date = $1)
                AND s.id_template IN (76, 79)
            )
            -- 5. O el ITS fue elaborado/creado en la fecha consultada
            OR EXISTS (
              SELECT 1 FROM ${SCHEMA}.tits_informe_termino its 
              WHERE its.id_proyecto = p.id_proyecto 
                AND (its.fecha_elaborado::date = $1 OR its.fecha_creacion::date = $1)
            )
            -- 6. O es un servicio activo en faena/ruta cuya conclusión no ocurrió antes de la fecha consultada
            OR (
              p.id_proyecto_estado IN (4, 5, 6, 7)
              AND COALESCE(p.fecha_plan_ini::date, NULLIF(p.json_field->'ejecucion_v1'->>'fecha_salida_plan', '')::date) <= $1
              AND NOT EXISTS (
                SELECT 1 FROM ${SCHEMA}.tits_informe_termino its 
                WHERE its.id_proyecto = p.id_proyecto 
                  AND its.estado_its = 'CONCLUIDO' 
                  AND its.fecha_elaborado::date < $1
              )
            )
          )
        ORDER BY p.id_proyecto DESC;
      `;
      const proyRes = await pool.query(proySql, [fechaConsulta]);

      // Precargar catálogos de usuarios, equipos y asignaciones tpry_rel_equipo / tpry_rel_persona
      const pIds = proyRes.rows.map(p => p.id_proyecto);
      const [uRes, eqRes, relRes, relPersRes, itsRes, edpRes] = await Promise.all([
        pool.query(`SELECT id_user, name_frst, apellido_pat, movil, email FROM ${SCHEMA}.tsec_users`),
        pool.query(`SELECT id_equipo, patente, modelo, marca, tipo_equipo FROM ${SCHEMA}.tequ_equipo`),
        pIds.length > 0
          ? pool.query(`SELECT id_proyecto, id_equipo, rol_equipo FROM ${SCHEMA}.tpry_rel_equipo WHERE id_proyecto = ANY($1)`, [pIds])
          : { rows: [] },
        pIds.length > 0
          ? pool.query(`SELECT id_proyecto, id_user, rol_asignado FROM ${SCHEMA}.tpry_rel_persona WHERE id_proyecto = ANY($1) ORDER BY id_rel_persona DESC`, [pIds])
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

      const relPersMap = new Map();
      relPersRes.rows.forEach(rp => {
        const pid = Number(rp.id_proyecto);
        if (!relPersMap.has(pid)) relPersMap.set(pid, []);
        relPersMap.get(pid).push(rp);
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

        // Historial completo de reports de la OT (sin fletes puros) y equipos con viajes registrados
        const histSql = `
          SELECT r.id_reporte_avance, r.id_equipo, r.dia_correlativo, r.fecha_reporte,
                 to_char(r.fecha_reporte, 'YYYY-MM-DD') AS fecha_reporte_iso,
                 r.estado_reporte, r.estado_jornada,
                 r.fecha_inicio_servicio, r.fecha_termino_servicio, r.fecha_registro, r.device_timestamp,
                 r.fecha_transmision_termino, r.id_doc_pdf, r.ajustes_analista,
                 r.obs_validador, r.id_user_validador,
                 CONCAT_WS(' ', u_val.name_frst, u_val.apellido_pat) AS validador_nombre
          FROM ${SCHEMA}.tedp_reporte_avance r
          LEFT JOIN ${SCHEMA}.tsec_users u_val ON r.id_user_validador = u_val.id_user
          WHERE r.id_proyecto = $1
            AND (r.token_report IS NULL OR r.token_report NOT LIKE 'FLT-%')
          ORDER BY r.fecha_reporte ASC, r.dia_correlativo ASC;
        `;
        const [hRes, vOtRes] = await Promise.all([
          pool.query(histSql, [p.id_proyecto]),
          pool.query(`SELECT DISTINCT id_equipo FROM ${SCHEMA}.tequ_log_desplazamiento WHERE id_proyecto = $1 AND id_equipo IS NOT NULL`, [p.id_proyecto])
        ]);
        const histReports = hRes.rows;
        const viajesOT = vOtRes.rows;

        // Descubrir todos los equipos asignados a la OT y resolver operador específico por equipo
        const eqList = [];
        const seenEq = new Set();
        const trip = Array.isArray(ejec.tripulacion_asignada) ? ejec.tripulacion_asignada : [];
        const eqExtras = Array.isArray(ejec.equipos_extra) ? ejec.equipos_extra : [];
        const inspPatioMap = ejec.preparacion_salida?.inspecciones_patio || {};
        const relPersOT = relPersMap.get(Number(p.id_proyecto)) || [];

        const resolverOperadorDeEquipo = (idEqNum, fechaRef = fechaConsulta) => {
          if (!idEqNum) return null;
          const esIsoRef = typeof fechaRef === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaRef);

          // 0. Prioridad REQ-1118: Turnos de operadores por rango de fecha (turnos_operadores y tripulacion_asignada)
          if (esIsoRef) {
            for (const l of lines) {
              const lEq = Number(l.equipo_asignado_id || l.id_equipo);
              if (lEq === idEqNum && Array.isArray(l.turnos_operadores) && l.turnos_operadores.length > 0) {
                const turnoMatch = l.turnos_operadores.find(t => {
                  const fI = String(t.fecha_ini || t.fecha_inicio || '').slice(0, 10);
                  const fF = String(t.fecha_fin || t.fecha_termino || fI || '').slice(0, 10);
                  return fI && fechaRef >= fI && (!fF || fechaRef <= fF);
                });
                const tOpId = Number(turnoMatch?.operador_id || turnoMatch?.id_user);
                if (tOpId) {
                  const u = userMap.get(tOpId);
                  if (u) return u;
                  if (turnoMatch?.operador_nombre) return { id_user: tOpId, nombre: turnoMatch.operador_nombre, telefono: '' };
                }
              }
            }
            for (const t of trip) {
              const tEq = Number(t.equipo_asignado_id || t.id_equipo);
              const tUid = Number(t.id_user);
              if (tEq === idEqNum && tUid) {
                const fI = String(t.fecha_plan_ini || t.fecha_ini || t.fecha_inicio || '').slice(0, 10);
                const fF = String(t.fecha_plan_fin || t.fecha_fin || t.fecha_termino || fI || '').slice(0, 10);
                if (fI && fechaRef >= fI && (!fF || fechaRef <= fF)) {
                  const u = userMap.get(tUid);
                  if (u) return u;
                  if (t.nombre) return { id_user: tUid, nombre: t.nombre, telefono: t.telefono || '' };
                }
              }
            }
          }

          // 1. Líneas de servicio con operador_asignado_id o chofer_asignado_id para este id_equipo
          for (const l of lines) {
            const lEq = Number(l.equipo_asignado_id || l.id_equipo);
            const lOp = Number(l.operador_asignado_id || l.chofer_asignado_id);
            if (lEq === idEqNum && lOp) {
              const u = userMap.get(lOp);
              if (u) return u;
            }
          }
          // 2. Tripulación asignada con equipo_asignado_id === idEqNum
          for (const t of trip) {
            const tEq = Number(t.equipo_asignado_id || t.id_equipo);
            const tUid = Number(t.id_user);
            if (tEq === idEqNum && tUid) {
              const u = userMap.get(tUid);
              if (u) return u;
              if (t.nombre) return { id_user: tUid, nombre: t.nombre, telefono: t.telefono || '' };
            }
          }
          // 3. Equipos extra (Cama Baja / Camión Plataforma) con id_equipo === idEqNum
          for (const ex of eqExtras) {
            const exEq = Number(ex.id_equipo || ex.equipo_asignado_id);
            const exUid = Number(ex.chofer_id || ex.operador_id || ex.id_user);
            if (exEq === idEqNum && exUid) {
              const u = userMap.get(exUid);
              if (u) return u;
            }
          }
          // 4. Inspecciones de patio por id_equipo
          const inspEq = inspPatioMap[String(idEqNum)] || inspPatioMap[idEqNum];
          if (inspEq && Number(inspEq.operador_id)) {
            const u = userMap.get(Number(inspEq.operador_id));
            if (u) return u;
          }
          // 5. Cabecera ejecucion_v1 (equipo_id -> operador_id)
          if (Number(ejec.equipo_id) === idEqNum && Number(ejec.operador_id)) {
            const u = userMap.get(Number(ejec.operador_id));
            if (u) return u;
          }
          return null;
        };

        lines.forEach(l => {
          const idEq = Number(l.equipo_asignado_id || l.id_equipo);
          if (idEq && !seenEq.has(idEq)) {
            // Si ya existe asignación formal en tpry_rel_equipo y este idEq de lines fue reemplazado (no está en tpry_rel_equipo, ni tiene viajes ni reports), omitir equipo fantasma
            const estaEnRelEquipos = relEquipos.some(re => Number(re.id_equipo) === idEq);
            const tieneActividadReal = viajesOT.some(v => Number(v.id_equipo) === idEq) || histReports.some(r => Number(r.id_equipo) === idEq);
            if (relEquipos.length > 0 && !estaEnRelEquipos && !tieneActividadReal) {
              return;
            }
            seenEq.add(idEq);
            const eqObj = eqMap.get(idEq);
            const uObj = resolverOperadorDeEquipo(idEq, fechaConsulta);
            const lineWithRole = lines.find(x => Number(x.equipo_asignado_id || x.id_equipo) === idEq && !String(x.tipo || '').toUpperCase().includes('TRASLADO')) || l;
            eqList.push({
              id_equipo: idEq,
              patente: eqObj?.patente || l.patente || 'S/P',
              modelo: eqObj?.modelo || l.modelo || '',
              tipo_equipo: eqObj?.tipo_equipo || lineWithRole.tipo || l.tipo || 'EQUIPO',
              rol_equipo: lineWithRole.subcategoria || lineWithRole.tipo || l.subcategoria || l.tipo || 'Equipo Asignado',
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
            const uObj = resolverOperadorDeEquipo(idEq);
            eqList.push({
              id_equipo: idEq,
              patente: eqObj?.patente || 'S/P',
              modelo: eqObj?.modelo || '',
              tipo_equipo: eqObj?.tipo_equipo || 'EQUIPO',
              rol_equipo: re.rol_equipo || 'Equipo Asignado',
              operador: uObj?.nombre || '',
              telefono_operador: uObj?.telefono || ''
            });
          }
        });

        eqExtras.forEach(ex => {
          const idEq = Number(ex.id_equipo || ex.equipo_asignado_id);
          if (idEq && !seenEq.has(idEq)) {
            seenEq.add(idEq);
            const eqObj = eqMap.get(idEq);
            const uObj = resolverOperadorDeEquipo(idEq);
            eqList.push({
              id_equipo: idEq,
              patente: eqObj?.patente || ex.patente || 'S/P',
              modelo: eqObj?.modelo || ex.modelo || '',
              tipo_equipo: eqObj?.tipo_equipo || ex.tipo || 'CAMIONES',
              rol_equipo: ex.rol || ex.subcategoria || 'Equipo de Apoyo',
              operador: uObj?.nombre || '',
              telefono_operador: uObj?.telefono || ''
            });
          }
        });

        // Operador por defecto de la OT si alguno quedó sin operador específico
        const opTrip = trip.find(t => {
          const c = (t.cargo || t.rol || '').toUpperCase();
          return c.includes('OPERADOR') || c.includes('CHOFER') || c.includes('GRUA');
        });
        const idOpDef = opTrip?.id_user || ejec.operador_id;
        const uDef = idOpDef && userMap.get(Number(idOpDef));

        eqList.forEach((eq, idx) => {
          if (!eq.operador) {
            const uEsp = resolverOperadorDeEquipo(eq.id_equipo);
            if (uEsp?.nombre) {
              eq.operador = uEsp.nombre;
              eq.telefono_operador = uEsp.telefono || '';
            } else if (idx === 0 && uDef) {
              eq.operador = uDef.nombre;
              eq.telefono_operador = uDef.telefono;
            } else if (idx === 0 && opTrip?.nombre) {
              eq.operador = opTrip.nombre;
              eq.telefono_operador = opTrip.telefono || '';
            } else {
              // Fallback: buscar en tpry_rel_persona un operador/chofer distinto a los ya asignados
              const usados = new Set(eqList.map(x => x.operador).filter(Boolean));
              const altPers = relPersOT.map(rp => userMap.get(Number(rp.id_user))).find(u => u && u.nombre && !usados.has(u.nombre));
              if (altPers) {
                eq.operador = altPers.nombre;
                eq.telefono_operador = altPers.telefono || '';
              } else {
                eq.operador = 'Sin operador asignado';
                eq.telefono_operador = '';
              }
            }
          }
        });

        if (eqList.length === 0) {
          // REQ-1090: Soporte para Servicios Exclusivos de Personal Certificado / Solo Rigger sin Maquinaria
          const relPers = relPersMap.get(Number(p.id_proyecto)) || [];
          const espTrip = trip.find(t => t.id_user) || (Array.isArray(ejec.especialistas_terreno) ? ejec.especialistas_terreno.find(e => e.id_user) : null);
          const idPersSolo = espTrip?.id_user || (ejec.rigger_id && ejec.rigger_id !== 'RIG-201' ? ejec.rigger_id : null) || relPers[0]?.id_user || idOpDef;
          const uPersSolo = idPersSolo ? userMap.get(Number(idPersSolo)) : uDef;
          const esServicioPersonal = lines.some(l => String(l.tipo || '').toUpperCase().includes('PERSONAL') || String(l.subcategoria || '').toUpperCase().includes('RIGGER')) || Boolean(uPersSolo);

          eqList.push({
            id_equipo: 0,
            patente: esServicioPersonal ? 'PERSONAL' : 'S/P',
            modelo: esServicioPersonal ? (espTrip?.cargo || relPers[0]?.rol_asignado || 'Rigger Certificado') : '',
            tipo_equipo: esServicioPersonal ? 'SERVICIO RIGGER / ESPECIALISTA' : (ejec.equipo_principal || 'Sin equipo asignado'),
            rol_equipo: esServicioPersonal ? (espTrip?.cargo || relPers[0]?.rol_asignado || 'Rigger Certificado') : 'Equipo Principal',
            operador: uPersSolo?.nombre || espTrip?.nombre || 'Sin operador asignado',
            telefono_operador: uPersSolo?.telefono || espTrip?.telefono || ''
          });
        }

        // Planificación temporal
        const fSalidaPlan = ejec.fecha_salida_plan || (p.fecha_plan_ini ? p.fecha_plan_ini.toISOString().split('T')[0] : null);
        const hSalidaPlan = ejec.hora_salida_plan || '08:00';
        let fFinPlan = ejec.fecha_fin_plan || (p.fecha_plan_fin ? p.fecha_plan_fin.toISOString().split('T')[0] : null);
        const hFinPlan = ejec.hora_fin_plan || '18:00';
        const hLlegadaPlan = ejec.hora_llegada_plan || '09:30';

        // Calcular días contratados/objetivo desde las líneas de servicio
        let diasComerciales = 0;
        let tieneMesMinimo = false;
        for (const l of lines) {
          if (String(l.unidad || '').toUpperCase().includes('MES')) {
            tieneMesMinimo = true;
          }
          const d = Number(l.cantidad_dias || l.dias || 0);
          if (d > diasComerciales) diasComerciales = d;
        }

        const diasLaboralesOverride = p.json_field?.dias_laborales_override || ejec.dias_laborales_override || {};

        if (fSalidaPlan) {
          if (tieneMesMinimo && !fFinPlan) {
            const dIniMes = new Date(String(fSalidaPlan).split('T')[0] + 'T00:00:00');
            if (!isNaN(dIniMes.getTime())) {
              const dFinMes = new Date(dIniMes.getFullYear(), dIniMes.getMonth() + 1, 0);
              fFinPlan = formatLocalIsoDate(dFinMes);
            }
          } else if (diasComerciales > 1) {
            const generados = generarNDiasHabilesDesde(fSalidaPlan, diasComerciales, diasLaboralesOverride);
            if (generados.length > 0) {
              const finCalculado = generados[generados.length - 1];
              if (!fFinPlan || fFinPlan < finCalculado) {
                fFinPlan = finCalculado;
              }
            }
          } else if (!fFinPlan) {
            fFinPlan = fSalidaPlan;
          }
        }

        let calendarioRibbon = [];
        let diasHabilesLista = [];
        if (fSalidaPlan && fFinPlan) {
          calendarioRibbon = getCalendarioCompletoRibbon(fSalidaPlan, fFinPlan, diasLaboralesOverride);
          diasHabilesLista = calendarioRibbon.filter(c => c.es_laboral).map(c => c.fecha);
        } else if (Array.isArray(ejec.plan_diario) && ejec.plan_diario.length > 0) {
          const planFechas = ejec.plan_diario.map(pd => pd.fecha).filter(Boolean).sort();
          if (planFechas.length > 0) {
            calendarioRibbon = getCalendarioCompletoRibbon(planFechas[0], planFechas[planFechas.length - 1], diasLaboralesOverride);
            diasHabilesLista = calendarioRibbon.filter(c => c.es_laboral).map(c => c.fecha);
          }
        }

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

          // Todos los viajes del equipo en la OT (orden cronológico)
          const viajeSql = `
            SELECT * FROM ${SCHEMA}.tequ_log_desplazamiento
            WHERE id_proyecto = $1 AND (id_equipo = $2 OR $2 = 0 OR id_equipo IS NULL)
            ORDER BY id_log_desplazamiento ASC;
          `;
          const vRes = await pool.query(viajeSql, [p.id_proyecto, eq.id_equipo]);
          const viajesEq = vRes.rows;

          if ((!eq.operador || eq.operador === 'Sin operador asignado') && viajesEq.length > 0) {
            const vConChofer = [...viajesEq].reverse().find(v => Number(v.id_user_chofer));
            if (vConChofer) {
              const uCh = userMap.get(Number(vConChofer.id_user_chofer));
              if (uCh?.nombre) {
                eq.operador = uCh.nombre;
                eq.telefono_operador = uCh.telefono || '';
              }
            }
          }

          // Todas las inspecciones patio del equipo
          const patioSql = `
            SELECT * FROM ${SCHEMA}.tsrv_survey
            WHERE ((id_proyecto = $1 AND (id_equipo = $2 OR $2 = 0)) OR (id_equipo = $2 AND $2 > 0))
              AND id_template IN (76, 79)
            ORDER BY id_survey ASC;
          `;
          const ptRes = await pool.query(patioSql, [p.id_proyecto, eq.id_equipo]);
          const patioSurveysEq = ptRes.rows;

          const esEquipoFaena = ['GRUAS', 'GRUA', 'PLUMA', 'PLATAFORMA', 'ALZAHOMBRE', 'MANLIFT', 'ELEVADORA'].some(kw => 
            (eq.tipo_equipo || '').toUpperCase().includes(kw) || (eq.rol_equipo || '').toUpperCase().includes(kw)
          );

          // Helper de evaluación de actividad para una fecha y clave dada (con soporte de override administrativo)
          const evalActividadParaFecha = (fDia, clave, nombre, planHoraStr, realHoraStr, ejecutado) => {
            const ovr = p.json_field?.control_vivo_overrides?.[fDia]?.[String(eq.id_equipo)]?.[clave]
                     || p.json_field?.control_vivo_overrides?.[fDia]?.[eq.id_equipo]?.[clave]
                     || p.json_field?.control_vivo_overrides?.[fDia]?.['TODOS']?.[clave];
            let esOverride = false;
            let modificadoPor = null;
            if (ovr && ovr.hora_real && ovr.hora_real !== '--:--') {
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
            } else if (candadoActivoEq && (clave === 'VIAJE_RETORNO' || clave === 'LLEGADA_BASE') && !ejecutado) {
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
              if (fDia === fechaHoyChile) {
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
              } else if (fDia < fechaHoyChile) {
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

          // Helper para consolidar documentos adjuntos a un día específico (REQ-1099)
          const obtenerDocumentosDia = (fDia, diaNum, rDia) => {
            const lista = [];
            const vistos = new Set();
            const docsPorFecha = Array.isArray(p.json_field?.documentos_por_dia?.[fDia])
              ? p.json_field.documentos_por_dia[fDia]
              : [];
            const docsReport = Array.isArray(rDia?.ajustes_analista?.documentos_dia)
              ? rDia.ajustes_analista.documentos_dia
              : [];
            for (const doc of [...docsPorFecha, ...docsReport]) {
              if (!doc) continue;
              const key = doc.id_doc ? `id:${doc.id_doc}` : `nm:${doc.nombre_archivo || doc.titulo}`;
              if (!vistos.has(key)) {
                vistos.add(key);
                lista.push(doc);
              }
            }
            if (rDia?.id_doc_pdf && !vistos.has(`id:${rDia.id_doc_pdf}`)) {
              vistos.add(`id:${rDia.id_doc_pdf}`);
              lista.push({
                id_doc: rDia.id_doc_pdf,
                tipo_documento: rDia.ajustes_analista?.evidencia_fisica_adjunta ? 'REPORT_FISICO_RESPALDO' : 'REPORT_DIARIO',
                titulo: rDia.ajustes_analista?.evidencia_fisica_adjunta ? `Respaldo Físico Día ${diaNum || 1}` : `PDF Oficial Report Día ${diaNum || 1}`,
                nombre_archivo: rDia.ajustes_analista?.evidencia_fisica_adjunta ? `Respaldo_D${diaNum || 1}.pdf` : `Report_D${diaNum || 1}.pdf`,
                fecha_servicio: fDia,
                dia_correlativo: diaNum || 1,
                url_vista: `/api/v1/storage/view/${rDia.id_doc_pdf}`,
                url_descarga: `/api/v1/storage/download/${rDia.id_doc_pdf}`
              });
            }
            return lista;
          };

          // Función para calcular actividades y estado de un día específico
          const calcularActividadesDia = (diaNum, fDia, tDia) => {
            const esFechaIso = typeof fDia === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fDia);
            // REQ-1099: Emparejar estrictamente por fecha calendario YYYY-MM-DD para impedir contaminación cruzada entre días
            const rDia = eqHistReports.find(r => {
              if (!r.fecha_reporte && !r.fecha_reporte_iso) return false;
              const dStr = r.fecha_reporte_iso || new Date(r.fecha_reporte).toISOString().split('T')[0];
              if (esFechaIso) {
                return dStr === fDia;
              }
              return Number(r.dia_correlativo) === Number(diaNum);
            }) || null;

            const vDiaIda = (tDia === 'INICIO' || tDia === 'UNICO')
              ? (viajesEq.find(v => {
                  if (v.tipo_trayecto === 'RETORNO') return false;
                  const fV = v.fecha_salida_patio ? new Date(v.fecha_salida_patio).toISOString().split('T')[0] : (v.fecha_programada ? new Date(v.fecha_programada).toISOString().split('T')[0] : '');
                  return !esFechaIso || !fV || fV === fDia;
                }) || viajesEq.find(v => v.tipo_trayecto !== 'RETORNO') || null)
              : null;

            const vDiaRet = (tDia === 'TERMINO' || tDia === 'UNICO')
              ? (viajesEq.find(v => v.tipo_trayecto === 'RETORNO') || viajesEq.find(v => v.fecha_salida_faena || v.fecha_llegada_patio) || null)
              : null;

            const ptDia = (tDia === 'INICIO' || tDia === 'UNICO')
              ? (patioSurveysEq.find(pt => {
                  const dIni = pt.fecha_real_ini ? new Date(pt.fecha_real_ini).toISOString().split('T')[0] : '';
                  const dC = pt.created ? new Date(pt.created).toISOString().split('T')[0] : '';
                  return dIni === fDia || dC === fDia;
                }) || patioSurveysEq[0] || null)
              : null;

            const acts = [];
            if (tDia === 'INICIO' || tDia === 'UNICO') {
              const inspPlan = ejec.preparacion_salida?.inspecciones_patio?.[eq.id_equipo]?.hora_inspeccion_plan || '07:30';
              const inspReal = ptDia ? (getHoraStrFromDate(ptDia.fecha_real_ini) || getHoraStrFromDate(ptDia.created)) : null;
              const inspOk = ptDia && ['COMPLETADO', 'FINALIZADO', 'EJECUTADO', 'APROBADO', 'VALIDADO'].includes(String(ptDia.estado_srv).toUpperCase());
              acts.push(evalActividadParaFecha(fDia, 'INSPECCION_PATIO', 'Inspección de patio', inspPlan, inspReal, inspOk));

              const salReal = vDiaIda ? (getHoraStrFromDate(vDiaIda.device_timestamp_salida) || getHoraStrFromDate(vDiaIda.fecha_salida_patio)) : null;
              const salOk = vDiaIda && (vDiaIda.estado_trayecto === 'EN_RUTA' || vDiaIda.estado_trayecto === 'ARRIBADO' || !!vDiaIda.fecha_salida_patio);
              acts.push(evalActividadParaFecha(fDia, 'SALIDA_BASE', 'Salida patio (inicio viaje)', hSalidaPlan, salReal, salOk));

              const llegReal = vDiaIda ? (getHoraStrFromDate(vDiaIda.device_timestamp_llegada) || getHoraStrFromDate(vDiaIda.fecha_llegada_faena)) : null;
              const llegOk = vDiaIda && (vDiaIda.estado_trayecto === 'ARRIBADO' || !!vDiaIda.fecha_llegada_faena);
              acts.push(evalActividadParaFecha(fDia, 'LLEGADA_FAENA', 'Llegada faena (fin viaje)', hLlegadaPlan, llegReal, llegOk));
            }

            if (esEquipoFaena) {
              const diaPlanObj = Array.isArray(ejec.plan_diario) ? ejec.plan_diario.find(d => d.fecha === fDia) : null;
              const repIniPlan = diaPlanObj?.hora_inicio_jornada || (tDia === 'INICIO' ? '10:00' : '08:00');
              const repIniOk = !!rDia && (
                !!rDia.fecha_inicio_servicio ||
                rDia.estado_jornada === 'JORNADA_EN_CURSO' ||
                rDia.estado_jornada === 'CONCLUIDO' ||
                rDia.estado_jornada === 'FINALIZADA' ||
                ['PENDIENTE_VALIDACION', 'VALIDADO_ANALISTA', 'REGULARIZADO_MANUAL', 'EMITIDO_SELLADO', 'CERRADO', 'REPORT_FIRMADO'].includes(rDia.estado_reporte)
              );
              const repIniReal = repIniOk ? (getHoraStrFromDate(rDia.fecha_inicio_servicio) || getHoraStrFromDate(rDia.device_timestamp) || getHoraStrFromDate(rDia.fecha_registro)) : null;
              acts.push(evalActividadParaFecha(fDia, 'REPORT_INICIO', 'Report inicio jornada', repIniPlan, repIniReal, repIniOk));

              // REQ-1099: No autocompletar REPORT_TERMINO con fecha_registro cuando el servicio sigue en ejecución (fecha_termino_servicio IS NULL)
              const repFinPlan = diaPlanObj?.hora_termino_jornada || hFinPlan;
              const horaFinExtraida = rDia ? (getHoraStrFromDate(rDia.fecha_termino_servicio) || getHoraStrFromDate(rDia.fecha_transmision_termino)) : null;
              const tieneTerminoEfectivo = !!horaFinExtraida && !(horaFinExtraida === '00:00' && ['REGULARIZADO_MANUAL', 'JORNADA_EN_CURSO'].includes(rDia?.estado_reporte));
              const repFinOk = !!rDia && tieneTerminoEfectivo;
              const repFinReal = repFinOk ? horaFinExtraida : null;
              acts.push(evalActividadParaFecha(fDia, 'REPORT_TERMINO', 'Report término jornada', repFinPlan, repFinReal, repFinOk));
            }

            if (tDia === 'TERMINO' || tDia === 'UNICO') {
              const retPlan = '18:30';
              const retReal = vDiaRet ? (getHoraStrFromDate(vDiaRet.fecha_salida_faena) || getHoraStrFromDate(vDiaRet.fecha_salida_patio) || null) : null;
              const retOk = !!retReal;
              const actRet = evalActividadParaFecha(fDia, 'VIAJE_RETORNO', 'Viaje retorno a base', retPlan, retReal, retOk);
              acts.push(actRet);

              const llegBasePlan = '19:00';
              const llegBaseRaw = vDiaRet ? (getHoraStrFromDate(vDiaRet.fecha_llegada_patio) || null) : null;
              const ovrLlegBase = p.json_field?.control_vivo_overrides?.[fDia]?.[String(eq.id_equipo)]?.['LLEGADA_BASE']
                               || p.json_field?.control_vivo_overrides?.[fDia]?.[eq.id_equipo]?.['LLEGADA_BASE']
                               || p.json_field?.control_vivo_overrides?.[fDia]?.['TODOS']?.['LLEGADA_BASE'];
              const fallbackRetOvr = (!llegBaseRaw && !ovrLlegBase?.hora_real && actRet.override && actRet.ejecutado) ? actRet.hora_real : null;
              const llegBaseReal = llegBaseRaw || fallbackRetOvr;
              const llegBaseOk = !!llegBaseReal;
              acts.push(evalActividadParaFecha(fDia, 'LLEGADA_BASE', 'Llegada a planta (fin retorno)', llegBasePlan, llegBaseReal, llegBaseOk));
            }

            let stDia = 'verde';
            if (candadoActivoEq && (diaNum === totalDiasOTEq)) {
              stDia = 'terminado';
            } else if (!fSalidaPlan) {
              stDia = 'sinplan';
            } else if (fDia > fechaHoyChile && !rDia) {
              stDia = 'azul';
            } else {
              stDia = acts.reduce((peor, act) => {
                return PRI_SEMAFORO[act.estado] > PRI_SEMAFORO[peor] ? act.estado : peor;
              }, 'verde');
            }

            return {
              actividades: acts,
              estado: stDia,
              report: rDia,
              viaje: vDiaRet || vDiaIda,
              documentos_dia: obtenerDocumentosDia(fDia, diaNum, rDia)
            };
          };

          // Construcción de la Franja Multi-Día con desglose por cada jornada
          const franjaMultidiaEq = [];
          if (calendarioRibbon.length > 0) {
            const totalLaboralesEnCalendario = Math.max(1, calendarioRibbon.filter(c => c.es_laboral).length);
            let contadorLaboral = 0;
            for (let i = 0; i < calendarioRibbon.length; i++) {
              const itemCal = calendarioRibbon[i];
              const fechaDia = itemCal.fecha;
              if (!itemCal.es_laboral) {
                franjaMultidiaEq.push({
                  dia: null,
                  fecha: fechaDia,
                  es_laboral: false,
                  es_fds_o_feriado: itemCal.es_fds_o_feriado,
                  etiqueta_no_laboral: itemCal.etiqueta_no_laboral,
                  motivo_no_laboral: itemCal.motivo_no_laboral,
                  override_laboral: itemCal.override_laboral,
                  tipo_dia: 'NO_LABORAL',
                  estado: 'no_laboral',
                  es_hoy: fechaDia === fechaConsulta,
                  tiene_report: false,
                  report_firmado: false,
                  id_reporte_avance: null,
                  estado_reporte: null,
                  tiene_viaje: false,
                  id_log_desplazamiento: null,
                  token_viaje: null,
                  viaje_resumen: null,
                  es_fin: false,
                  actividades: [],
                  documentos_dia: obtenerDocumentosDia(fechaDia, null, null)
                });
                continue;
              }

              contadorLaboral++;
              const diaNum = contadorLaboral;
              const esDiaHoy = fechaDia === fechaConsulta || diaNum === diaActualEq;
              const tDia = (totalLaboralesEnCalendario === 1) ? 'UNICO' : (diaNum === 1 ? 'INICIO' : (diaNum === totalLaboralesEnCalendario ? 'TERMINO' : 'INTERMEDIO'));
              const evalDia = calcularActividadesDia(diaNum, fechaDia, tDia);
              const rPrev = evalDia.report;
              const vRepr = evalDia.viaje;
              const tieneHitoReportOvr = evalDia.actividades.some(a => ['REPORT_INICIO', 'REPORT_TERMINO'].includes(a.clave) && a.ejecutado);

              const opDiaObj = resolverOperadorDeEquipo(eq.id_equipo, fechaDia);
              franjaMultidiaEq.push({
                dia: diaNum,
                fecha: fechaDia,
                operador: opDiaObj?.nombre || eq.operador,
                telefono_operador: opDiaObj?.telefono || eq.telefono_operador,
                es_laboral: true,
                es_fds_o_feriado: itemCal.es_fds_o_feriado,
                etiqueta_no_laboral: itemCal.etiqueta_no_laboral,
                motivo_no_laboral: itemCal.motivo_no_laboral,
                override_laboral: itemCal.override_laboral,
                tipo_dia: tDia,
                estado: evalDia.estado,
                es_hoy: esDiaHoy,
                tiene_report: !!rPrev || tieneHitoReportOvr,
                report_firmado: !!rPrev && ['EMITIDO_SELLADO', 'VALIDADO_ANALISTA', 'REGULARIZADO_MANUAL', 'CERRADO', 'REPORT_FIRMADO'].includes(rPrev.estado_reporte),
                id_reporte_avance: rPrev ? rPrev.id_reporte_avance : null,
                estado_reporte: rPrev ? rPrev.estado_reporte : null,
                obs_validador: (rPrev && rPrev.obs_validador) ? rPrev.obs_validador : (jf.obs_validador_por_dia?.[fechaDia] || null),
                validador_nombre: rPrev?.validador_nombre || (jf.obs_validador_meta?.[fechaDia]?.autor || null),
                tiene_viaje: !!vRepr,
                id_log_desplazamiento: vRepr ? vRepr.id_log_desplazamiento : null,
                token_viaje: vRepr ? vRepr.token_viaje : null,
                viaje_resumen: vRepr ? {
                  id_log_desplazamiento: vRepr.id_log_desplazamiento,
                  token_viaje: vRepr.token_viaje,
                  tipo_trayecto: vRepr.tipo_trayecto,
                  estado_trayecto: vRepr.estado_trayecto,
                  patente: vRepr.patente || eq.patente,
                  km_inicial: vRepr.km_inicial,
                  km_final: vRepr.km_final,
                  horometro_inicial: vRepr.horometro_inicial,
                  horometro_final: vRepr.horometro_final,
                  fecha_salida_patio: vRepr.fecha_salida_patio,
                  fecha_llegada_faena: vRepr.fecha_llegada_faena,
                  fecha_salida_faena: vRepr.fecha_salida_faena,
                  fecha_llegada_patio: vRepr.fecha_llegada_patio
                } : null,
                es_fin: diaNum === totalLaboralesEnCalendario,
                actividades: evalDia.actividades,
                documentos_dia: evalDia.documentos_dia || []
              });
            }
          } else {
            const cantDiasMostrar = Math.max(totalDiasOTEq, diasHabilesLista.length);
            for (let i = 0; i < cantDiasMostrar; i++) {
              const diaNum = i + 1;
              const fechaDia = diasHabilesLista[i] || `Día ${diaNum}`;
              const esDiaHoy = fechaDia === fechaConsulta || diaNum === diaActualEq;
              const tDia = (cantDiasMostrar === 1) ? 'UNICO' : (diaNum === 1 ? 'INICIO' : (diaNum === cantDiasMostrar ? 'TERMINO' : 'INTERMEDIO'));
              const evalDia = calcularActividadesDia(diaNum, fechaDia, tDia);
              const rPrev = evalDia.report;
              const vRepr = evalDia.viaje;
              const tieneHitoReportOvr = evalDia.actividades.some(a => ['REPORT_INICIO', 'REPORT_TERMINO'].includes(a.clave) && a.ejecutado);
              const opDiaObj = resolverOperadorDeEquipo(eq.id_equipo, fechaDia);
              franjaMultidiaEq.push({
                dia: diaNum,
                fecha: fechaDia,
                operador: opDiaObj?.nombre || eq.operador,
                telefono_operador: opDiaObj?.telefono || eq.telefono_operador,
                es_laboral: true,
                es_fds_o_feriado: false,
                etiqueta_no_laboral: null,
                motivo_no_laboral: null,
                override_laboral: false,
                tipo_dia: tDia,
                estado: evalDia.estado,
                es_hoy: esDiaHoy,
                tiene_report: !!rPrev || tieneHitoReportOvr,
                report_firmado: !!rPrev && ['EMITIDO_SELLADO', 'VALIDADO_ANALISTA', 'REGULARIZADO_MANUAL', 'CERRADO', 'REPORT_FIRMADO'].includes(rPrev.estado_reporte),
                id_reporte_avance: rPrev ? rPrev.id_reporte_avance : null,
                estado_reporte: rPrev ? rPrev.estado_reporte : null,
                obs_validador: (rPrev && rPrev.obs_validador) ? rPrev.obs_validador : (jf.obs_validador_por_dia?.[fechaDia] || null),
                validador_nombre: rPrev?.validador_nombre || (jf.obs_validador_meta?.[fechaDia]?.autor || null),
                tiene_viaje: !!vRepr,
                id_log_desplazamiento: vRepr ? vRepr.id_log_desplazamiento : null,
                token_viaje: vRepr ? vRepr.token_viaje : null,
                viaje_resumen: null,
                es_fin: i === cantDiasMostrar - 1,
                actividades: evalDia.actividades,
                documentos_dia: evalDia.documentos_dia || []
              });
            }
          }

          // Actividades y estado activo para la fecha consultada (compatibilidad hacia atrás)
          const diaConsultadoItem = franjaMultidiaEq.find(d => d.es_laboral && d.es_hoy) || franjaMultidiaEq.find(d => d.es_laboral) || franjaMultidiaEq[0];
          const actividadesEq = diaConsultadoItem ? diaConsultadoItem.actividades : [];
          let estadoEquipo = diaConsultadoItem ? diaConsultadoItem.estado : 'verde';
          if (candadoActivoEq) {
            estadoEquipo = 'terminado';
          }

          equiposEvaluados.push({
            id_equipo: eq.id_equipo,
            patente: eq.patente,
            modelo: eq.modelo,
            tipo_equipo: eq.tipo_equipo,
            rol_equipo: eq.rol_equipo,
            nombre_completo: eq.id_equipo > 0 ? `${eq.tipo_equipo} · ${eq.patente} (${eq.modelo})` : eq.tipo_equipo,
            operador: diaConsultadoItem?.operador || eq.operador,
            telefono_operador: diaConsultadoItem?.telefono_operador || eq.telefono_operador,
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

        const otVers = Array.isArray(jf.ejecucion_v1?.ot_versiones) ? jf.ejecucion_v1.ot_versiones : [];
        const ultimaOtVer = otVers.length > 0
          ? [...otVers].sort((a, b) => Number(b.version || 0) - Number(a.version || 0))[0]
          : null;

        servicios.push({
          id_proyecto: p.id_proyecto,
          codigo_ot: p.codi_proyecto || `OT-${p.id_proyecto}`,
          ot_id_doc: ultimaOtVer?.id_doc || null,
          ot_url: ultimaOtVer?.url || null,
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

  // 5. REQ-997 / REQ-1099: Carga manual, corrección y limpieza (--:--) de horas de hitos por Control de Gestión (Yiara / Adm)
  async overrideHitoActividad(req, res) {
    try {
      const { id_proyecto, id_equipo, fecha, dia, clave_actividad, hora_real, motivo, es_laboral, limpiar, id_reporte_avance, obs_validador } = req.body || {};
      const esLimpiar = Boolean(limpiar) || hora_real === '' || hora_real === null || hora_real === '--:--';
      if (!id_proyecto || !clave_actividad || (!['TOGGLE_DIA_LABORAL', 'OBS_VALIDADOR'].includes(clave_actividad) && !esLimpiar && !hora_real)) {
        return res.status(400).json({ success: false, message: 'Faltan parámetros requeridos: id_proyecto, clave_actividad, hora_real' });
      }

      const nowChile = getChileTime();
      const fechaOperativa = fecha || nowChile.toISOString().split('T')[0];
      const modificadoPor = req.user?.name_frst ? `${req.user.name_frst} ${req.user.apellido_pat || ''}`.trim() : (req.user?.email || 'YIARA (Control Gestión)');
      const eqIdKey = id_equipo ? String(id_equipo) : 'TODOS';
      const eqIdNum = parseInt(id_equipo, 10) || 0;

      // 1. Obtener y actualizar json_field en tpry_proyecto
      const proyRes = await pool.query(
        `SELECT id_proyecto, codi_proyecto, fecha_plan_ini, fecha_plan_fin, json_field FROM ${SCHEMA}.tpry_proyecto WHERE id_proyecto = $1`,
        [id_proyecto]
      );
      if (proyRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
      }

      const pRow = proyRes.rows[0];
      let jsonField = pRow.json_field || {};
      if (typeof jsonField === 'string') {
        try { jsonField = JSON.parse(jsonField); } catch (e) { jsonField = {}; }
      }

      // REQ-1824: Toggle explícito de día laboral / no laboral (FDS o Feriado) desde el botón X / + del Ribbon
      if (clave_actividad === 'TOGGLE_DIA_LABORAL') {
        if (!jsonField.dias_laborales_override) jsonField.dias_laborales_override = {};
        jsonField.dias_laborales_override[fechaOperativa] = Boolean(es_laboral);
        if (jsonField.ejecucion_v1) {
          if (!jsonField.ejecucion_v1.dias_laborales_override) jsonField.ejecucion_v1.dias_laborales_override = {};
          jsonField.ejecucion_v1.dias_laborales_override[fechaOperativa] = Boolean(es_laboral);
        }
        await pool.query(`UPDATE ${SCHEMA}.tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2`, [JSON.stringify(jsonField), id_proyecto]);
        return res.json({
          success: true,
          message: `Día ${fechaOperativa} actualizado a ${es_laboral ? 'LABORAL' : 'NO LABORAL'} por ${modificadoPor}`,
          data: { id_proyecto, fecha: fechaOperativa, es_laboral: Boolean(es_laboral) }
        });
      }

      // REQ-1120: Guardar o actualizar Observaciones de Validación del Report Diario (obs_validador) desde Report o Torre PMO
      if (clave_actividad === 'OBS_VALIDADOR') {
        const textoObs = String(obs_validador !== undefined ? obs_validador : (motivo || '')).trim();
        const userIdVal = req.user?.id_user || null;

        if (!jsonField.obs_validador_por_dia) jsonField.obs_validador_por_dia = {};
        if (!jsonField.obs_validador_meta) jsonField.obs_validador_meta = {};
        if (textoObs) {
          jsonField.obs_validador_por_dia[fechaOperativa] = textoObs;
          jsonField.obs_validador_meta[fechaOperativa] = {
            autor: modificadoPor,
            fecha_actualizacion: nowChile.toISOString()
          };
        } else {
          delete jsonField.obs_validador_por_dia[fechaOperativa];
          delete jsonField.obs_validador_meta[fechaOperativa];
        }
        await pool.query(`UPDATE ${SCHEMA}.tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2`, [JSON.stringify(jsonField), id_proyecto]);

        let updatedReportId = null;
        if (id_reporte_avance) {
          const updRep = await pool.query(
            `UPDATE ${SCHEMA}.tedp_reporte_avance
             SET obs_validador = $1,
                 id_user_validador = COALESCE($2, id_user_validador)
             WHERE id_reporte_avance = $3
             RETURNING id_reporte_avance`,
            [textoObs || null, userIdVal, id_reporte_avance]
          );
          if (updRep.rows.length > 0) updatedReportId = updRep.rows[0].id_reporte_avance;
        } else {
          const updRep = await pool.query(
            `UPDATE ${SCHEMA}.tedp_reporte_avance
             SET obs_validador = $1,
                 id_user_validador = COALESCE($2, id_user_validador)
             WHERE id_proyecto = $3
               AND to_char(fecha_reporte, 'YYYY-MM-DD') = $4
               AND ($5 = 0 OR id_equipo = $5 OR id_equipo IS NULL)
             RETURNING id_reporte_avance`,
            [textoObs || null, userIdVal, id_proyecto, fechaOperativa, eqIdNum]
          );
          if (updRep.rows.length > 0) updatedReportId = updRep.rows[0].id_reporte_avance;
        }

        return res.json({
          success: true,
          message: `Observaciones de validación actualizadas para el día ${fechaOperativa}`,
          data: {
            id_proyecto,
            fecha: fechaOperativa,
            id_reporte_avance: updatedReportId,
            obs_validador: textoObs || null,
            validador_nombre: modificadoPor
          }
        });
      }

      // Helper para calcular el día correlativo real según calendario laboral de la OT (REQ-1099)
      const calcularDiaCorrelativoCalendario = () => {
        const ejec = jsonField.ejecucion_v1 || {};
        const crm = jsonField.crm_v1 || {};
        const lines = Array.isArray(crm.lineas_servicio) ? crm.lineas_servicio : (Array.isArray(jsonField.lineas_servicio) ? jsonField.lineas_servicio : []);
        const fSal = ejec.fecha_salida_plan || (pRow.fecha_plan_ini ? new Date(pRow.fecha_plan_ini).toISOString().split('T')[0] : null);
        let fFin = ejec.fecha_fin_plan || (pRow.fecha_plan_fin ? new Date(pRow.fecha_plan_fin).toISOString().split('T')[0] : null);
        const diasLaboralesOverride = jsonField.dias_laborales_override || ejec.dias_laborales_override || {};

        let diasCom = 0;
        let tieneMes = false;
        for (const l of lines) {
          if (String(l.unidad || '').toUpperCase().includes('MES')) tieneMes = true;
          const d = Number(l.cantidad_dias || l.dias || 0);
          if (d > diasCom) diasCom = d;
        }
        if (fSal) {
          if (tieneMes && !fFin) {
            const dIniMes = new Date(String(fSal).split('T')[0] + 'T00:00:00');
            if (!isNaN(dIniMes.getTime())) {
              fFin = formatLocalIsoDate(new Date(dIniMes.getFullYear(), dIniMes.getMonth() + 1, 0));
            }
          } else if (diasCom > 1) {
            const gen = generarNDiasHabilesDesde(fSal, diasCom, diasLaboralesOverride);
            if (gen.length > 0 && (!fFin || fFin < gen[gen.length - 1])) {
              fFin = gen[gen.length - 1];
            }
          } else if (!fFin) {
            fFin = fSal;
          }
          if (fFin && fechaOperativa > fFin) fFin = fechaOperativa;
          const habiles = getListaDiasHabiles(fSal, fFin || fechaOperativa, diasLaboralesOverride);
          const idx = habiles.indexOf(fechaOperativa);
          if (idx >= 0) return idx + 1;
        }
        if (Number(dia) > 0) return Number(dia);
        return 1;
      };

      // Helper para resolver el operador asignado real de la OT/equipo (evita caer en operador genérico #53/#94)
      const resolverOperadorAsignado = async (targetEqId) => {
        const ejec = jsonField.ejecucion_v1 || {};
        const crm = jsonField.crm_v1 || {};
        const lines = Array.isArray(crm.lineas_servicio) ? crm.lineas_servicio : (Array.isArray(jsonField.lineas_servicio) ? jsonField.lineas_servicio : []);
        if (targetEqId && fechaOperativa) {
          for (const l of lines) {
            if (Number(l.equipo_asignado_id || l.id_equipo) === Number(targetEqId) && Array.isArray(l.turnos_operadores)) {
              const tM = l.turnos_operadores.find(t => {
                const fI = String(t.fecha_ini || t.fecha_inicio || '').slice(0, 10);
                const fF = String(t.fecha_fin || t.fecha_termino || fI || '').slice(0, 10);
                return fI && fechaOperativa >= fI && (!fF || fechaOperativa <= fF);
              });
              if (Number(tM?.operador_id || tM?.id_user) > 0) return Number(tM.operador_id || tM.id_user);
            }
          }
          if (Array.isArray(ejec.tripulacion_asignada)) {
            const tM = ejec.tripulacion_asignada.find(t => {
              if (Number(t.equipo_asignado_id || t.id_equipo) !== Number(targetEqId) || !Number(t.id_user)) return false;
              const fI = String(t.fecha_plan_ini || t.fecha_ini || t.fecha_inicio || '').slice(0, 10);
              const fF = String(t.fecha_plan_fin || t.fecha_fin || t.fecha_termino || fI || '').slice(0, 10);
              return fI && fechaOperativa >= fI && (!fF || fechaOperativa <= fF);
            });
            if (tM && Number(tM.id_user) > 0) return Number(tM.id_user);
          }
        }
        if (targetEqId) {
          const lineEq = lines.find(l => Number(l.equipo_asignado_id || l.id_equipo) === Number(targetEqId) && Number(l.operador_asignado_id || l.id_user_operador) > 0);
          if (lineEq) return Number(lineEq.operador_asignado_id || lineEq.id_user_operador);
        }
        const lineAnyOp = lines.find(l => Number(l.operador_asignado_id || l.id_user_operador) > 0);
        if (lineAnyOp) return Number(lineAnyOp.operador_asignado_id || lineAnyOp.id_user_operador);

        if (Array.isArray(ejec.tripulacion_asignada)) {
          const tMatch = targetEqId
            ? ejec.tripulacion_asignada.find(t => Number(t.id_equipo) === Number(targetEqId) && Number(t.id_user) > 0)
            : ejec.tripulacion_asignada.find(t => Number(t.id_user) > 0);
          if (tMatch) return Number(tMatch.id_user);
        }
        if (Number(ejec.operador_id) > 0) return Number(ejec.operador_id);

        const relUser = await pool.query(
          `SELECT u.id_user FROM ${SCHEMA}.tpry_rel_persona rp 
           JOIN ${SCHEMA}.tsec_users u ON rp.id_user = u.id_user 
           WHERE rp.id_proyecto = $1 
             AND (UPPER(rp.rol_asignado) LIKE '%OPERADOR%' OR UPPER(rp.rol_asignado) LIKE '%CHOFER%')
           ORDER BY rp.id_rel_persona DESC LIMIT 1`,
          [id_proyecto]
        ).catch(() => ({ rows: [] }));
        return relUser.rows[0]?.id_user || 53;
      };

      // REQ-1099: Si el usuario limpia el campo (--:--), eliminar override y reabrir jornada si era REPORT_TERMINO
      if (esLimpiar) {
        if (jsonField.control_vivo_overrides?.[fechaOperativa]) {
          if (jsonField.control_vivo_overrides[fechaOperativa][eqIdKey]) {
            delete jsonField.control_vivo_overrides[fechaOperativa][eqIdKey][clave_actividad];
          }
          if (jsonField.control_vivo_overrides[fechaOperativa]['TODOS']) {
            delete jsonField.control_vivo_overrides[fechaOperativa]['TODOS'][clave_actividad];
          }
        }
        await pool.query(`UPDATE ${SCHEMA}.tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2`, [JSON.stringify(jsonField), id_proyecto]);

        if (clave_actividad === 'REPORT_TERMINO') {
          await pool.query(
            `UPDATE ${SCHEMA}.tedp_reporte_avance
             SET fecha_termino_servicio = NULL,
                 horas_operadas = 0,
                 horas_sobretiempo = 0,
                 estado_jornada = 'JORNADA_EN_CURSO',
                 estado_reporte = CASE WHEN estado_reporte = 'REGULARIZADO_MANUAL' THEN 'JORNADA_EN_CURSO' ELSE estado_reporte END
             WHERE id_proyecto = $1
               AND (fecha_reporte = $2 OR fecha_inicio_servicio::date = $2)
               AND (id_equipo = $3 OR $3 = 0 OR id_equipo IS NULL)`,
            [id_proyecto, fechaOperativa, eqIdNum]
          ).catch(errCl => console.warn('[Override Hito] Error limpiando REPORT_TERMINO:', errCl.message));
        } else if (clave_actividad === 'REPORT_INICIO') {
          await pool.query(
            `UPDATE ${SCHEMA}.tedp_reporte_avance
             SET fecha_inicio_servicio = NULL
             WHERE id_proyecto = $1
               AND (fecha_reporte = $2 OR fecha_inicio_servicio::date = $2)
               AND (id_equipo = $3 OR $3 = 0 OR id_equipo IS NULL)
               AND fecha_termino_servicio IS NULL`,
            [id_proyecto, fechaOperativa, eqIdNum]
          ).catch(() => {});
        }

        return res.json({
          success: true,
          message: `Hito ${clave_actividad} dejado en blanco (--:--) exitosamente.`,
          data: {
            id_proyecto,
            id_equipo,
            fecha: fechaOperativa,
            clave_actividad,
            hora_real: null,
            limpiado: true,
            modificado_por: modificadoPor
          }
        });
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
      } else if (clave_actividad === 'VIAJE_RETORNO' || clave_actividad === 'LLEGADA_BASE') {
        const vRetExist = await pool.query(
          `SELECT id_log_desplazamiento FROM ${SCHEMA}.tequ_log_desplazamiento 
           WHERE id_proyecto = $1 AND (id_equipo = $2 OR $2 = 0 OR id_equipo IS NULL) 
             AND tipo_trayecto = 'RETORNO'
           ORDER BY id_log_desplazamiento DESC LIMIT 1`,
          [id_proyecto, eqIdNum]
        ).catch(() => ({ rows: [] }));

        if (vRetExist.rows.length > 0) {
          if (clave_actividad === 'VIAJE_RETORNO') {
            await pool.query(
              `UPDATE ${SCHEMA}.tequ_log_desplazamiento 
               SET fecha_salida_faena = $1,
                   estado_trayecto = COALESCE(estado_trayecto, 'EN_RUTA')
               WHERE id_log_desplazamiento = $2`,
              [tsHito, vRetExist.rows[0].id_log_desplazamiento]
            ).catch(() => {});
          } else {
            await pool.query(
              `UPDATE ${SCHEMA}.tequ_log_desplazamiento 
               SET fecha_llegada_patio = $1,
                   estado_trayecto = 'CONCLUIDO'
               WHERE id_log_desplazamiento = $2`,
              [tsHito, vRetExist.rows[0].id_log_desplazamiento]
            ).catch(() => {});
          }
        } else {
          const colRet = clave_actividad === 'VIAJE_RETORNO' ? 'fecha_salida_faena' : 'fecha_llegada_patio';
          const estRet = clave_actividad === 'VIAJE_RETORNO' ? 'EN_RUTA' : 'CONCLUIDO';
          await pool.query(
            `INSERT INTO ${SCHEMA}.tequ_log_desplazamiento (
               id_proyecto, id_equipo, tipo_trayecto, ${colRet}, fecha_programada, estado_trayecto, token_viaje, fecha_registro
             ) VALUES ($1, $2, 'RETORNO', $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
            [id_proyecto, eqIdNum || null, tsHito, fechaOperativa, estRet, `vj-ret-${id_proyecto}-${eqIdNum || 1}-${Date.now().toString().slice(-4)}`]
          ).catch(() => {});
        }
      } else if (clave_actividad === 'REPORT_INICIO' || clave_actividad === 'REPORT_TERMINO') {
        const diaCorr = calcularDiaCorrelativoCalendario();
        // REQ-1100: Resolver piso mínimo contractual desde la cotización enviada vigente o estructura operativa vigente
        const resolverPisoMinimoContractual = (targetEqId) => {
          const crmObj = jsonField.crm_v1 || {};
          const cots = Array.isArray(crmObj.cotizaciones_historicas) ? crmObj.cotizaciones_historicas : [];
          const enviadas = cots
            .filter(c => (Array.isArray(c?.eventos_envio) && c.eventos_envio.length > 0) || Boolean(c?.evento_envio))
            .sort((a, b) => Number(b.version || 0) - Number(a.version || 0));
          const snapshotEnviada = (enviadas.length > 0 && Array.isArray(enviadas[0].lineas_snapshot) && enviadas[0].lineas_snapshot.length > 0)
            ? enviadas[0].lineas_snapshot
            : null;
          const lineasVigentes = (Array.isArray(crmObj.lineas_operativas_vigentes) && crmObj.lineas_operativas_vigentes.length > 0)
            ? crmObj.lineas_operativas_vigentes
            : (snapshotEnviada || (Array.isArray(crmObj.lineas_servicio) ? crmObj.lineas_servicio : []));

          const eqNum = Number(targetEqId || 0);
          let match = eqNum > 0
            ? lineasVigentes.find(l => (Number(l?.equipo_asignado_id || 0) === eqNum || Number(l?.id_equipo || 0) === eqNum) && (Number(l?.pisoMinimo || l?.cantidad_horas || 0) > 0 || String(l?.unidad || '').toUpperCase().includes('MES')))
            : null;
          if (!match) {
            match = lineasVigentes.find(l => {
              const t = String(l?.tipo || '').toUpperCase();
              return (t.includes('GRUA') || t.includes('GRÚA') || t.includes('CAMION') || t.includes('CAMIÓN') || t.includes('MAQUINARIA')) &&
                     (Number(l?.pisoMinimo || l?.cantidad_horas || 0) > 0 || String(l?.unidad || '').toUpperCase().includes('MES'));
            });
          }
          if (!match) {
            match = lineasVigentes.find(l => Number(l?.pisoMinimo || l?.cantidad_horas || 0) > 0 || String(l?.unidad || '').toUpperCase().includes('MES'));
          }

          const esUnidadMensual = match
            ? String(match?.unidad || '').toUpperCase().includes('MES')
            : lineasVigentes.some(l => String(l?.unidad || '').toUpperCase().includes('MES'));

          // REQ-1125 / SPEC-115: Servicios mensuales no aplican piso mínimo diario de horas (acumulan horas reales al mes)
          if (esUnidadMensual) {
            return 0.0;
          }

          const val = Number(match?.pisoMinimo || match?.cantidad_horas || 0);
          return (val > 0 && val <= 24) ? val : 8.0;
        };

        // UPSERT determinista en tedp_reporte_avance estrictamente por fecha_reporte = fechaOperativa
        const rExist = await pool.query(
          `SELECT id_reporte_avance, id_equipo, id_user_operador, dia_correlativo, fecha_inicio_servicio, fecha_termino_servicio, 
                  horas_minimas, horas_colacion, ajustes_analista, id_doc_pdf, estado_reporte, estado_jornada
           FROM ${SCHEMA}.tedp_reporte_avance
           WHERE id_proyecto = $1 
             AND (fecha_reporte = $2 OR fecha_inicio_servicio::date = $2)
             AND (id_equipo = $3 OR $3 = 0 OR id_equipo IS NULL)
           ORDER BY id_reporte_avance DESC LIMIT 1`,
          [id_proyecto, fechaOperativa, eqIdNum]
        ).catch(() => ({ rows: [] }));

        if (rExist.rows.length > 0) {
          const row = rExist.rows[0];
          const finalOpId = await resolverOperadorAsignado(row.id_equipo || eqIdNum);
          const pisoMinimo = resolverPisoMinimoContractual(row.id_equipo || eqIdNum);
          let newInicio = clave_actividad === 'REPORT_INICIO'
            ? tsHito
            : (row.fecha_inicio_servicio ? `${fechaOperativa} ${getHoraStrFromDate(row.fecha_inicio_servicio) || '08:00'}:00` : `${fechaOperativa} 08:00:00`);
          let newTermino = clave_actividad === 'REPORT_TERMINO'
            ? tsHito
            : (row.fecha_termino_servicio ? `${fechaOperativa} ${getHoraStrFromDate(row.fecha_termino_servicio)}:00` : null);

          // Si el término anterior era "00:00" residual y estamos editando inicio, limpiarlo
          if (clave_actividad === 'REPORT_INICIO' && newTermino && newTermino.endsWith('00:00:00')) {
            newTermino = null;
          }

          let horasOperadas = 0;
          let horasFacturables = pisoMinimo;
          let horasSobretiempo = 0;
          let estadoJornada = newTermino ? 'CONCLUIDO' : 'JORNADA_EN_CURSO';
          let estadoReporte = row.estado_reporte || 'JORNADA_EN_CURSO';

          if (newInicio && newTermino) {
            const diffMin = Math.max(0, (new Date(newTermino) - new Date(newInicio)) / (1000 * 60));
            // RESOLUCIÓN DE FONDO (CERO PARCHES): Respetar estrictamente 0 colación si fue definido así
            const colacMin = (row.horas_colacion !== null && row.horas_colacion !== undefined && !isNaN(parseFloat(row.horas_colacion)))
              ? Math.max(0, parseFloat(row.horas_colacion) * 60)
              : 0;
            horasOperadas = Math.max(0, parseFloat(((diffMin - colacMin) / 60).toFixed(2)));
            horasFacturables = pisoMinimo > 0 ? Math.max(horasOperadas, pisoMinimo) : horasOperadas;
            horasSobretiempo = pisoMinimo > 0 ? Math.max(0, parseFloat((horasOperadas - pisoMinimo).toFixed(2))) : 0;
            estadoJornada = 'CONCLUIDO';
            if (estadoReporte === 'JORNADA_EN_CURSO') {
              estadoReporte = 'REGULARIZADO_MANUAL';
            }
          } else {
            estadoJornada = 'JORNADA_EN_CURSO';
            if (estadoReporte === 'REGULARIZADO_MANUAL') {
              estadoReporte = 'JORNADA_EN_CURSO';
            }
          }

          const docsFecha = Array.isArray(jsonField.documentos_por_dia?.[fechaOperativa]) ? jsonField.documentos_por_dia[fechaOperativa] : [];
          const nuevosAjustes = {
            ...(row.ajustes_analista || {}),
            origen: 'TORRE_CONTROL',
            regularizado_manual: true,
            solo_inicio_jornada: !newTermino,
            requiere_evidencia_fisica: !row.id_doc_pdf && docsFecha.length === 0,
            documentos_dia: docsFecha.length > 0 ? docsFecha : (row.ajustes_analista?.documentos_dia || []),
            ultimo_override: {
              clave_actividad,
              hora_real,
              modificado_por: modificadoPor,
              fecha: nowChile.toISOString()
            }
          };

          await pool.query(
            `UPDATE ${SCHEMA}.tedp_reporte_avance SET
               dia_correlativo = $1,
               id_user_operador = COALESCE($2, id_user_operador),
               fecha_inicio_servicio = $3,
               fecha_termino_servicio = $4,
               horas_operadas = $5,
               horas_facturables = $6,
               horas_sobretiempo = $7,
               estado_jornada = $8,
               estado_reporte = $9,
               ajustes_analista = $10,
               horas_minimas = $11
             WHERE id_reporte_avance = $12`,
            [
              diaCorr,
              finalOpId,
              newInicio,
              newTermino,
              horasOperadas,
              horasFacturables,
              horasSobretiempo,
              estadoJornada,
              estadoReporte,
              JSON.stringify(nuevosAjustes),
              pisoMinimo,
              row.id_reporte_avance
            ]
          ).catch(errUp => console.warn('[Override Hito] Error actualizando reporte existente:', errUp.message));
        } else {
          // INSERT de nuevo reporte para esa fecha calendario exacta
          let finalEqId = eqIdNum;
          if (!finalEqId) {
            const relEq = await pool.query(`SELECT id_equipo FROM ${SCHEMA}.tpry_rel_equipo WHERE id_proyecto = $1 LIMIT 1`, [id_proyecto]).catch(() => ({ rows: [] }));
            finalEqId = relEq.rows[0]?.id_equipo || 35;
          }

          const finalOpId = await resolverOperadorAsignado(finalEqId);
          const pisoMinimo = resolverPisoMinimoContractual(finalEqId);

          const ovrIniPrevio = jsonField.control_vivo_overrides?.[fechaOperativa]?.[eqIdKey]?.['REPORT_INICIO']?.hora_real;
          let newInicio = clave_actividad === 'REPORT_INICIO'
            ? tsHito
            : `${fechaOperativa} ${ovrIniPrevio || '08:00'}:00`;
          let newTermino = clave_actividad === 'REPORT_TERMINO' ? tsHito : null;

          let horasOperadas = 0;
          let horasFacturables = pisoMinimo;
          let horasSobretiempo = 0;
          // REQ-1099: Si solo se ingresó REPORT_INICIO, mantener la jornada EN CURSO (nunca cerrarla automáticamente)
          let estadoJornada = newTermino ? 'CONCLUIDO' : 'JORNADA_EN_CURSO';
          let estadoReporte = newTermino ? 'REGULARIZADO_MANUAL' : 'JORNADA_EN_CURSO';

          if (clave_actividad === 'REPORT_TERMINO' && newTermino) {
            const diffMin = Math.max(0, (new Date(newTermino) - new Date(newInicio)) / (1000 * 60));
            // RESOLUCIÓN DE FONDO (CERO PARCHES): No restar 60 min arbitrarios en regularización manual
            horasOperadas = Math.max(0, parseFloat((diffMin / 60).toFixed(2)));
            horasFacturables = pisoMinimo > 0 ? Math.max(horasOperadas, pisoMinimo) : horasOperadas;
            horasSobretiempo = pisoMinimo > 0 ? Math.max(0, parseFloat((horasOperadas - pisoMinimo).toFixed(2))) : 0;
          }

          const docsFecha = Array.isArray(jsonField.documentos_por_dia?.[fechaOperativa]) ? jsonField.documentos_por_dia[fechaOperativa] : [];
          const idDocInicial = docsFecha[0]?.id_doc || null;

          const tokenReport = `REG-${id_proyecto}-D${diaCorr}-${Date.now().toString().slice(-4)}`;
          const ajustesJson = {
            origen: 'TORRE_CONTROL',
            regularizado_manual: true,
            solo_inicio_jornada: !newTermino,
            requiere_evidencia_fisica: !idDocInicial,
            evidencia_fisica_adjunta: Boolean(idDocInicial),
            documentos_dia: docsFecha,
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
               id_doc_pdf,
               ajustes_analista,
               fecha_registro
             ) VALUES (
               $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0.0, $12, $13, $14, $15, $16, $17, CURRENT_TIMESTAMP
             )`,
            [
              id_proyecto,
              finalEqId,
              finalOpId,
              diaCorr,
              fechaOperativa,
              pisoMinimo === 0 ? 'HRS_MES' : 'HRS_DIA',
              newInicio,
              newTermino,
              horasOperadas,
              horasFacturables,
              horasSobretiempo,
              pisoMinimo,
              tokenReport,
              estadoReporte,
              estadoJornada,
              idDocInicial,
              JSON.stringify(ajustesJson)
            ]
          ).catch(errIns => console.warn('[Override Hito] Error insertando reporte desde Torre Control:', errIns.message));
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
  },

  // 6. REQ-1099: Adjuntar cualquier documento o fotografía asociada a un día de servicio (desde Matriz PMO o Visor Report Día X)
  async adjuntarDocumentoDia(req, res) {
    try {
      const {
        id_proyecto,
        id_equipo,
        fecha,
        dia,
        id_reporte_avance,
        tipo_documento,
        titulo,
        descripcion
      } = req.body || {};

      if (!id_proyecto) {
        return res.status(400).json({ success: false, message: 'id_proyecto es requerido' });
      }

      const uploadedFile = req.files?.archivo || req.files?.file;
      if (!uploadedFile) {
        return res.status(400).json({ success: false, message: 'Debe seleccionar un archivo o fotografía para adjuntar' });
      }

      const nowChile = getChileTime();
      const nowIso = new Date().toISOString();
      const fechaOperativa = (fecha ? String(fecha).split('T')[0] : null) || nowChile.toISOString().split('T')[0];
      const diaNum = parseInt(dia, 10) || 1;
      const eqIdNum = parseInt(id_equipo, 10) || 0;
      const idUserAutor = req.user?.id_user || 65;
      const subidoPor = req.user?.name_frst ? `${req.user.name_frst} ${req.user.apellido_pat || ''}`.trim() : (req.user?.email || 'Control de Gestión');

      const proyRes = await pool.query(
        `SELECT id_proyecto, codi_proyecto, json_field FROM ${SCHEMA}.tpry_proyecto WHERE id_proyecto = $1`,
        [id_proyecto]
      );
      if (proyRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
      }
      const pRow = proyRes.rows[0];
      let jsonField = pRow.json_field || {};
      if (typeof jsonField === 'string') {
        try { jsonField = JSON.parse(jsonField); } catch (e) { jsonField = {}; }
      }

      // 1. Almacenar archivo en disco y registrar en tfmg_file
      const path_relativo = buildStoragePath('GSP', 'reports');
      const targetDir = path.join(STORAGE_ROOT, path_relativo);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const ext = path.extname(uploadedFile.name) || '.pdf';
      const safeCode = (pRow.codi_proyecto || `OT_${id_proyecto}`).replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `Doc_Servicio_${safeCode}_D${diaNum}_${fechaOperativa}_${Date.now()}${ext}`;
      const filePath = path.join(targetDir, fileName);

      if (uploadedFile.mv) {
        await uploadedFile.mv(filePath);
      } else if (uploadedFile.data) {
        fs.writeFileSync(filePath, uploadedFile.data);
      }

      const archivoM = new archivoModel();
      const docFile = await archivoM.insertarTfmgFile(
        tipo_documento || 'DOCUMENTO_JORNADA',
        uploadedFile.mimetype || 'application/octet-stream',
        uploadedFile.name || fileName,
        fileName,
        path_relativo,
        idUserAutor,
        'A'
      );

      const idDoc = docFile.id_doc;
      const docItem = {
        id_doc: idDoc,
        tipo_documento: tipo_documento || 'DOCUMENTO_JORNADA',
        categoria: 'OPERACION_DIARIA',
        titulo: (titulo || descripcion || uploadedFile.name || `Documento Día ${diaNum}`).trim(),
        descripcion: (descripcion || '').trim(),
        nombre_archivo: uploadedFile.name || fileName,
        mime_type: uploadedFile.mimetype || 'application/octet-stream',
        fecha_servicio: fechaOperativa,
        dia_correlativo: diaNum,
        id_equipo: eqIdNum || null,
        id_reporte_avance: id_reporte_avance ? Number(id_reporte_avance) : null,
        subido_por: subidoPor,
        fecha_adjunto: nowIso,
        url_vista: `/api/v1/storage/view/${idDoc}`,
        url_descarga: `/api/v1/storage/download/${idDoc}`
      };

      // 2. Guardar en json_field.documentos_por_dia[fechaOperativa] y en ejecucion_v1.dossier_documentos
      if (!jsonField.documentos_por_dia) jsonField.documentos_por_dia = {};
      if (!Array.isArray(jsonField.documentos_por_dia[fechaOperativa])) {
        jsonField.documentos_por_dia[fechaOperativa] = [];
      }
      jsonField.documentos_por_dia[fechaOperativa].push(docItem);

      if (!jsonField.ejecucion_v1) jsonField.ejecucion_v1 = {};
      if (!Array.isArray(jsonField.ejecucion_v1.dossier_documentos)) {
        jsonField.ejecucion_v1.dossier_documentos = [];
      }
      jsonField.ejecucion_v1.dossier_documentos.unshift({
        ...docItem,
        nombre: `${docItem.titulo} — Día ${diaNum} (${fechaOperativa})`,
        url_view: docItem.url_vista,
        url_download: docItem.url_descarga
      });

      await pool.query(
        `UPDATE ${SCHEMA}.tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2`,
        [JSON.stringify(jsonField), id_proyecto]
      );

      // 3. Vincular también al registro tedp_reporte_avance del día si existe
      let repTarget = null;
      if (id_reporte_avance) {
        const rById = await pool.query(
          `SELECT id_reporte_avance, id_doc_pdf, ajustes_analista FROM ${SCHEMA}.tedp_reporte_avance WHERE id_reporte_avance = $1`,
          [id_reporte_avance]
        ).catch(() => ({ rows: [] }));
        repTarget = rById.rows[0] || null;
      }
      if (!repTarget) {
        const rByDate = await pool.query(
          `SELECT id_reporte_avance, id_doc_pdf, ajustes_analista FROM ${SCHEMA}.tedp_reporte_avance
           WHERE id_proyecto = $1 AND fecha_reporte = $2 AND (id_equipo = $3 OR $3 = 0 OR id_equipo IS NULL)
           ORDER BY id_reporte_avance DESC LIMIT 1`,
          [id_proyecto, fechaOperativa, eqIdNum]
        ).catch(() => ({ rows: [] }));
        repTarget = rByDate.rows[0] || null;
      }

      if (repTarget) {
        const ajPrev = typeof repTarget.ajustes_analista === 'object' && repTarget.ajustes_analista !== null ? repTarget.ajustes_analista : {};
        const docsPrev = Array.isArray(ajPrev.documentos_dia) ? ajPrev.documentos_dia : [];
        const nuevosAjustes = {
          ...ajPrev,
          evidencia_fisica_adjunta: true,
          requiere_evidencia_fisica: false,
          documentos_dia: [...docsPrev.filter(d => Number(d.id_doc) !== Number(idDoc)), docItem]
        };
        await pool.query(
          `UPDATE ${SCHEMA}.tedp_reporte_avance
           SET id_doc_pdf = COALESCE(id_doc_pdf, $1),
               ajustes_analista = $2
           WHERE id_reporte_avance = $3`,
          [idDoc, JSON.stringify(nuevosAjustes), repTarget.id_reporte_avance]
        ).catch(errRep => console.warn('[Adjuntar Doc Día] Warning actualizando tedp_reporte_avance:', errRep.message));
      }

      res.json({
        success: true,
        message: `Documento "${docItem.nombre_archivo}" adjuntado exitosamente al Día ${diaNum} (${fechaOperativa}).`,
        data: {
          documento: docItem,
          documentos_dia: jsonField.documentos_por_dia[fechaOperativa]
        }
      });
    } catch (err) {
      console.error('[Adjuntar Documento Día] Error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 7. REQ-1099: Eliminar un documento adjunto a un día de servicio
  async eliminarDocumentoDia(req, res) {
    try {
      const { id_doc } = req.params;
      const { id_proyecto, fecha, id_reporte_avance } = req.query || req.body || {};
      if (!id_doc || !id_proyecto) {
        return res.status(400).json({ success: false, message: 'id_doc e id_proyecto son requeridos' });
      }

      const proyRes = await pool.query(`SELECT json_field FROM ${SCHEMA}.tpry_proyecto WHERE id_proyecto = $1`, [id_proyecto]);
      if (proyRes.rows.length > 0) {
        let jf = proyRes.rows[0].json_field || {};
        if (typeof jf === 'string') {
          try { jf = JSON.parse(jf); } catch (e) { jf = {}; }
        }
        if (jf.documentos_por_dia) {
          for (const k of Object.keys(jf.documentos_por_dia)) {
            if (!fecha || k === fecha) {
              jf.documentos_por_dia[k] = (jf.documentos_por_dia[k] || []).filter(d => Number(d.id_doc) !== Number(id_doc));
            }
          }
        }
        if (Array.isArray(jf.ejecucion_v1?.dossier_documentos)) {
          jf.ejecucion_v1.dossier_documentos = jf.ejecucion_v1.dossier_documentos.filter(d => Number(d.id_doc) !== Number(id_doc));
        }
        await pool.query(`UPDATE ${SCHEMA}.tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2`, [JSON.stringify(jf), id_proyecto]);
      }

      if (id_reporte_avance) {
        const repRes = await pool.query(`SELECT ajustes_analista, id_doc_pdf FROM ${SCHEMA}.tedp_reporte_avance WHERE id_reporte_avance = $1`, [id_reporte_avance]);
        if (repRes.rows.length > 0) {
          const aj = repRes.rows[0].ajustes_analista || {};
          if (Array.isArray(aj.documentos_dia)) {
            aj.documentos_dia = aj.documentos_dia.filter(d => Number(d.id_doc) !== Number(id_doc));
          }
          const newDocPdf = Number(repRes.rows[0].id_doc_pdf) === Number(id_doc) ? (aj.documentos_dia?.[0]?.id_doc || null) : repRes.rows[0].id_doc_pdf;
          await pool.query(`UPDATE ${SCHEMA}.tedp_reporte_avance SET id_doc_pdf = $1, ajustes_analista = $2 WHERE id_reporte_avance = $3`, [newDocPdf, JSON.stringify(aj), id_reporte_avance]);
        }
      }

      res.json({ success: true, message: 'Documento desvinculado del día exitosamente' });
    } catch (err) {
      console.error('[Eliminar Documento Día] Error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = controlVivoController;

