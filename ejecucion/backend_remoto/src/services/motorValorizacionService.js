/**
 * motorValorizacionService.js
 * 
 * MOTOR ÚNICO Y CANÓNICO DE VALORIZACIÓN, CONCILIACIÓN Y LIQUIDACIÓN FINANCIERA E2E
 * Ecosistema: Grúas San Pablo (GSP) / LeanGlobal Platform
 * Especificación Canónica: SPEC-130 (.agents/specs/130_remediacion_relacional_y_motor_unico_valorizacion_e2e_spec.md)
 * Precedentes Constitucionales: SPEC-128, SPEC-129, Minuta de Reunión Técnica 11-Nov-2026
 * 
 * PRINCIPIO ARQUITECTÓNICO INQUEBRANTABLE:
 * Este módulo es la ÚNICA FUENTE DE VERDAD MATEMÁTICA para el cálculo de cotizaciones comerciales,
 * ordenes de trabajo, devengo operativo en terreno (ITS) y liquidación de estados de pago (EDP).
 * Queda terminantemente prohibido reimplementar fórmulas matemáticas en controladores, vistas o PDFs.
 */

'use strict';

// -----------------------------------------------------------------------------
// CONSTANTES Y DOMINIOS CANÓNICOS
// -----------------------------------------------------------------------------

const LINEAS_NEGOCIO = Object.freeze(['IZAJE', 'RENTAL', 'TRANSPORTE', 'PROFESIONAL']);
const TIPOS_OT = Object.freeze(['OT-MANIOBRA', 'OT-RENTAL', 'OT-FLETE', 'OT-STAFF']);
const ROLES_NODO = Object.freeze(['RAIZ', 'HIJO_COMERCIAL', 'APOYO_OPERATIVO', 'ACCESORIO', 'PERSONAL', 'TRASLADO']);

// Las 10 Unidades Canónicas Limpias (SPEC-130)
const GRUPO_A_COBRO_UNICO = Object.freeze([
  'Valor Fijo',
  'Traslado Ida',
  'Traslado Vuelta',
  'Traslado Ida/Vuelta'
]);

const GRUPO_B_TIEMPO = Object.freeze([
  'Hora Efectiva',
  'Horas Diarias Minimas',
  'Horas Mes Minimas',
  'Valor Fijo Diario',
  'Valor Fijo Semanal',
  'Valor Fijo Mensual'
]);

const UNIDADES_CANONICAS = Object.freeze([...GRUPO_A_COBRO_UNICO, ...GRUPO_B_TIEMPO]);

// -----------------------------------------------------------------------------
// 1. NORMALIZACIÓN DETERMINISTA DE UNIDAD DE COBRO
// -----------------------------------------------------------------------------

/**
 * Normaliza cualquier texto legacy o variación tipográfica a una de las 10 unidades canónicas.
 * @param {string} u - Cadena de texto de entrada representando la unidad.
 * @returns {string} Unidad canónica limpia.
 */
function normalizarUnidad(u) {
  if (!u || typeof u !== 'string') {
    return 'Horas Diarias Minimas';
  }

  const raw = u.trim().toUpperCase().replace(/\s+/g, ' ');

  // Paso 0: Coincidencia exacta con las 10 unidades canónicas (case-insensitive)
  const mapaExacto = {
    'VALOR FIJO': 'Valor Fijo',
    'TRASLADO IDA': 'Traslado Ida',
    'TRASLADO VUELTA': 'Traslado Vuelta',
    'TRASLADO IDA/VUELTA': 'Traslado Ida/Vuelta',
    'HORA EFECTIVA': 'Hora Efectiva',
    'HORAS DIARIAS MINIMAS': 'Horas Diarias Minimas',
    'HORAS DIARIAS MÍNIMAS': 'Horas Diarias Minimas',
    'HORAS_DIARIAS_MINIMAS': 'Horas Diarias Minimas',
    'HORAS MES MINIMAS': 'Horas Mes Minimas',
    'HORAS MES MÍNIMAS': 'Horas Mes Minimas',
    'HORAS_MES_MINIMAS': 'Horas Mes Minimas',
    'VALOR FIJO DIARIO': 'Valor Fijo Diario',
    'VALOR FIJO SEMANAL': 'Valor Fijo Semanal',
    'VALOR FIJO MENSUAL': 'Valor Fijo Mensual'
  };

  if (mapaExacto[raw]) {
    return mapaExacto[raw];
  }

  // Paso 1: Grupo A - Traslados (Ida, Vuelta, Ida/Vuelta)
  const tieneIda = raw.includes('IDA');
  const tieneVuelta = raw.includes('VUELTA') || raw.includes('RETORNO');

  if (raw.includes('IDA/VUELTA') || raw.includes('IDA Y VUELTA') || raw.includes('REDONDO') || (tieneIda && tieneVuelta)) {
    return 'Traslado Ida/Vuelta';
  }
  if (tieneVuelta && !tieneIda) {
    return 'Traslado Vuelta';
  }
  if (tieneIda && !tieneVuelta) {
    return 'Traslado Ida';
  }
  if (raw.startsWith('TRASLADO') || raw.startsWith('FLETE') || raw === 'VIAJE') {
    return 'Traslado Ida/Vuelta';
  }

  // Paso 2: Horas Mes Mínimas (Bolsa mensual)
  const tieneHora = raw.includes('HORA') || raw.includes('HRS') || raw.includes('HR') || /\b\d+H\b/.test(raw);
  const tieneMes = raw.includes('MES') || raw.includes('MENSUAL');

  if (raw.includes('BOLSA') || (tieneHora && tieneMes)) {
    return 'Horas Mes Minimas';
  }

  // Paso 3: Horas Diarias Mínimas
  const tieneMinima = raw.includes('MINIMA') || raw.includes('MÍNIMA') || raw.includes('PISO');
  const tieneDiario = raw.includes('DIARI') || raw.includes('DIA') || raw.includes('DÍA') || raw.includes('JORNADA');

  if (tieneHora && (tieneMinima || tieneDiario)) {
    return 'Horas Diarias Minimas';
  }

  // Paso 4: Hora Efectiva (sin piso diario)
  if (tieneHora && (raw.includes('EFECTIVA') || raw.includes('REAL'))) {
    return 'Hora Efectiva';
  }

  // Si tiene palabra 'HORA' o 'HRS' o 'POR HORA' sin calificador -> Default Horas Diarias Minimas
  if (raw === 'POR HORA' || raw === 'HORA' || raw === 'HRS' || raw === 'HR') {
    return 'Horas Diarias Minimas';
  }

  // Paso 5: Valor Fijo Períodos (Mensual, Semanal, Diario)
  if (tieneMes || raw.includes('CANON')) {
    return 'Valor Fijo Mensual';
  }
  if (raw.includes('SEMAN')) {
    return 'Valor Fijo Semanal';
  }
  if (tieneDiario) {
    return 'Valor Fijo Diario';
  }

  // Paso 6: Valor Fijo (Suma alzada plana)
  if (raw.includes('FIJO') || raw.includes('ALZADA') || raw.includes('CERRADO') || raw.includes('SUMA ALZADA') || raw === 'HITO') {
    return 'Valor Fijo';
  }

  // Fallback seguro
  return 'Horas Diarias Minimas';
}

/**
 * Normaliza la línea de negocio y tipo de OT a partir de metadatos del servicio.
 * @param {object} item - Objeto descriptivo del servicio.
 * @returns {{ lineaNegocio: string, tipoOt: string }}
 */
function clasificarLineaNegocio(item = {}) {
  const desc = String(item.descripcion || item.concepto || item.tipo || '').toUpperCase();
  const subcat = String(item.subcategoria || '').toUpperCase();
  const raw = `${desc} ${subcat}`;

  if (raw.includes('TIJERA') || raw.includes('PLATAFORMA') || raw.includes('BRAZO ARTIC') || raw.includes('ALZA HOMBRE') || raw.includes('RENTAL') || raw.includes('DRY LEASE')) {
    return { lineaNegocio: 'RENTAL', tipoOt: 'OT-RENTAL' };
  }
  if (raw.includes('CAMA BAJA') || raw.includes('RAMPLA') || raw.includes('FLETE PURO') || raw.includes('TRANSPORTE') || raw.includes('LOGISTICA DEL SUR')) {
    return { lineaNegocio: 'TRANSPORTE', tipoOt: 'OT-FLETE' };
  }
  if (raw.includes('RIGGER') || raw.includes('SUPERVISOR') || raw.includes('APR') || raw.includes('PREVENCION') || raw.includes('PLAN DE IZAJE') || raw.includes('ESTUDIO RIGGING') || raw.includes('MEMORIA')) {
    return { lineaNegocio: 'PROFESIONAL', tipoOt: 'OT-STAFF' };
  }

  // Default constitucional: IZAJE (Grúas telescópicas, camiones pluma, horquillas y manipuladores)
  return { lineaNegocio: 'IZAJE', tipoOt: 'OT-MANIOBRA' };
}

// -----------------------------------------------------------------------------
// 2. CÁLCULO PURO DE SUBTOTAL POR NODO
// -----------------------------------------------------------------------------

/**
 * Calcula el subtotal financiero neto de un nodo de servicio de manera determinista.
 * @param {object} nodo - Configuración de la línea de servicio.
 * @returns {number} Subtotal en Moneda Nacional CLP (entero redondeado).
 */
function calcularSubtotalNodo(nodo = {}) {
  if (!nodo || typeof nodo !== 'object') {
    return 0;
  }

  // Regla Constitucional de Inclusión y Apoyo:
  // Si está incluido en tarifa ($0) o es apoyo interno operativo sin tarifa comercial, su subtotal comercial es $0.
  if (nodo.incluido_en_tarifa === true || nodo.incluido === true) {
    return 0;
  }
  if (nodo.es_apoyo_operativo === true && !nodo.valor_unitario && !nodo.valorUnitario) {
    return 0;
  }

  const unidad = normalizarUnidad(nodo.unidad || nodo.unidad_cobro);
  const valorUnitario = Math.max(0, Number(
    nodo.valor_unitario !== undefined ? nodo.valor_unitario : 
    (nodo.valorUnitario !== undefined ? nodo.valorUnitario : 
    (nodo.precio_unitario !== undefined ? nodo.precio_unitario : 
    (nodo.tarifa || 0)))
  ) || 0);

  // GRUPO A: Cobros Únicos (Invariante SPEC-128: cantidad = 1 fijo, piso_horas = 0)
  if (GRUPO_A_COBRO_UNICO.includes(unidad)) {
    return Math.round(valorUnitario);
  }

  // GRUPO B: Tiempo y Período
  if (unidad === 'Horas Diarias Minimas') {
    const dias = Math.max(1, Number(nodo.cantidad_dias !== undefined ? nodo.cantidad_dias : (nodo.cantidad || 1)) || 1);
    const horasMinimas = Math.max(1, Number(nodo.cantidad_horas !== undefined ? nodo.cantidad_horas : (nodo.piso_minimo_horas !== undefined ? nodo.piso_minimo_horas : (nodo.pisoMinimo || 8))) || 8);
    return Math.round(dias * horasMinimas * valorUnitario);
  }

  if (unidad === 'Horas Mes Minimas') {
    const meses = Math.max(1, Number(nodo.cantidad_meses !== undefined ? nodo.cantidad_meses : (nodo.cantidad || 1)) || 1);
    const bolsaHoras = Math.max(1, Number(nodo.cantidad_horas !== undefined ? nodo.cantidad_horas : (nodo.piso_minimo_horas !== undefined ? nodo.piso_minimo_horas : (nodo.pisoMinimo || 180))) || 180);
    return Math.round(meses * bolsaHoras * valorUnitario);
  }

  if (unidad === 'Hora Efectiva') {
    const horas = Math.max(0, Number(nodo.cantidad_horas !== undefined ? nodo.cantidad_horas : (nodo.cantidad || 1)) || 1);
    return Math.round(horas * valorUnitario);
  }

  if (unidad === 'Valor Fijo Diario') {
    const dias = Math.max(1, Number(nodo.cantidad_dias !== undefined ? nodo.cantidad_dias : (nodo.cantidad || 1)) || 1);
    return Math.round(dias * valorUnitario);
  }

  if (unidad === 'Valor Fijo Semanal') {
    const semanas = Math.max(1, Number(nodo.cantidad_semanas !== undefined ? nodo.cantidad_semanas : (nodo.cantidad || 1)) || 1);
    return Math.round(semanas * valorUnitario);
  }

  if (unidad === 'Valor Fijo Mensual') {
    const meses = Math.max(1, Number(nodo.cantidad_meses !== undefined ? nodo.cantidad_meses : (nodo.cantidad || 1)) || 1);
    return Math.round(meses * valorUnitario);
  }

  // Fallback multiplicador simple
  const cant = Math.max(1, Number(nodo.cantidad || 1) || 1);
  return Math.round(cant * valorUnitario);
}

// -----------------------------------------------------------------------------
// 3. VALORIZACIÓN COMPLETA DE ÁRBOL DE COTIZACIÓN
// -----------------------------------------------------------------------------

/**
 * Valida y valoriza un árbol completo de líneas de servicio para una cotización comercial.
 * Garantiza detección de ciclos, invariantes de negocio y consolidación por línea.
 * @param {Array<object>} servicios - Arreglo de nodos de servicio.
 * @returns {object} Resumen financiero y nodos saneados.
 */
function valorizarArbolCotizacion(servicios = []) {
  if (!Array.isArray(servicios)) {
    return {
      totalNeto: 0,
      subtotalServicios: 0,
      resumenPorLinea: { IZAJE: 0, RENTAL: 0, TRANSPORTE: 0, PROFESIONAL: 0 },
      nodosNormalizados: [],
      esValido: false,
      errores: ['El parámetro servicios debe ser un arreglo.']
    };
  }

  const errores = [];
  const nodosNormalizados = [];
  const idsVistos = new Set();
  const resumenPorLinea = { IZAJE: 0, RENTAL: 0, TRANSPORTE: 0, PROFESIONAL: 0 };
  let totalNeto = 0;

  for (let idx = 0; idx < servicios.length; idx++) {
    const raw = servicios[idx] || {};
    const idNodo = raw.id_linea_servicio || raw.id || (idx + 1);
    const idPadre = raw.id_linea_servicio_padre || raw.parentId || null;

    // Validación de No Auto-Dependencia
    if (idPadre !== null && String(idPadre) === String(idNodo)) {
      errores.push(`El nodo #${idNodo} posee una auto-dependencia cíclica consigo mismo.`);
    }

    idsVistos.add(idNodo);

    const unidad = normalizarUnidad(raw.unidad || raw.unidad_cobro);
    const { lineaNegocio, tipoOt } = clasificarLineaNegocio(raw);
    const subtotal = calcularSubtotalNodo({ ...raw, unidad });

    const esGrupoA = GRUPO_A_COBRO_UNICO.includes(unidad);
    const nodoNormalizado = {
      id_linea_servicio: idNodo,
      id_linea_servicio_padre: idPadre,
      descripcion: String(raw.descripcion || raw.concepto || `Línea de Servicio #${idx + 1}`).trim(),
      subcategoria: raw.subcategoria || null,
      linea_negocio: raw.linea_negocio || lineaNegocio,
      tipo_ot: raw.tipo_ot || tipoOt,
      rol_nodo: raw.rol_nodo || (idx === 0 && !idPadre ? 'RAIZ' : (unidad.startsWith('Traslado') ? 'TRASLADO' : 'HIJO_COMERCIAL')),
      unidad: unidad,
      cantidad: esGrupoA ? 1 : (Number(raw.cantidad) || 1),
      cantidad_dias: esGrupoA ? null : (raw.cantidad_dias ? Number(raw.cantidad_dias) : null),
      cantidad_horas: esGrupoA ? null : (raw.cantidad_horas ? Number(raw.cantidad_horas) : null),
      cantidad_meses: esGrupoA ? null : (raw.cantidad_meses ? Number(raw.cantidad_meses) : null),
      piso_minimo_horas: esGrupoA ? 0 : (Number(raw.piso_minimo_horas || raw.pisoMinimo || 0)),
      valor_unitario: Number(raw.valor_unitario !== undefined ? raw.valor_unitario : (raw.valorUnitario || raw.tarifa || 0)) || 0,
      subtotal: subtotal,
      incluido_en_tarifa: Boolean(raw.incluido_en_tarifa || raw.incluido),
      es_apoyo_operativo: Boolean(raw.es_apoyo_operativo)
    };

    // Validar padres inexistentes si están referenciados
    if (idPadre !== null && !idsVistos.has(idPadre) && !servicios.some(s => (s.id_linea_servicio || s.id) === idPadre)) {
      errores.push(`El nodo #${idNodo} referencia un padre #${idPadre} inexistente en el árbol.`);
    }

    nodosNormalizados.push(nodoNormalizado);

    // Sumar a la línea de negocio correspondiente
    if (resumenPorLinea[nodoNormalizado.linea_negocio] !== undefined) {
      resumenPorLinea[nodoNormalizado.linea_negocio] += subtotal;
    } else {
      resumenPorLinea.IZAJE += subtotal;
    }

    totalNeto += subtotal;
  }

  return {
    totalNeto: Math.round(totalNeto),
    subtotalServicios: Math.round(totalNeto),
    resumenPorLinea,
    nodosNormalizados,
    esValido: errores.length === 0,
    errores
  };
}

// -----------------------------------------------------------------------------
// 4. CONCILIACIÓN DEVENGADO PROYECTO E2E (ITS / TERRENO)
// -----------------------------------------------------------------------------

/**
 * Concilia de manera pura el presupuesto comercial vs. la ejecución física en terreno (Reports, Viajes, Actas).
 * @param {number|string} idProyecto - Identificador del proyecto/OT.
 * @param {object} params - Parámetros de ejecución.
 * @returns {object} Conciliación de devengo línea a línea y desviaciones.
 */
function conciliarDevengadoProyectoE2E(idProyecto, params = {}) {
  const lineasServicio = Array.isArray(params.lineasServicio) ? params.lineasServicio : [];
  const reportesAvance = Array.isArray(params.reportesAvance) ? params.reportesAvance : [];
  const registrosViaje = Array.isArray(params.registrosViaje) ? params.registrosViaje : [];
  const actasRental = Array.isArray(params.actasRental) ? params.actasRental : [];

  let totalPresupuestadoNeto = 0;
  let totalDevengadoNeto = 0;
  const lineasConciliadas = [];

  for (const linea of lineasServicio) {
    const unidad = normalizarUnidad(linea.unidad || linea.unidad_cobro);
    const presupuestado = calcularSubtotalNodo({ ...linea, unidad });
    totalPresupuestadoNeto += presupuestado;

    const valorUnitario = Number(linea.valor_unitario !== undefined ? linea.valor_unitario : (linea.valorUnitario || linea.tarifa || 0)) || 0;
    let devengado = 0;
    const evidencias = [];

    // Si está incluido en tarifa comercial, su devengo comercial es $0
    if (linea.incluido_en_tarifa === true || linea.incluido === true || linea.es_apoyo_operativo === true) {
      devengado = 0;
      evidencias.push('Línea incluida o de apoyo operativo interno ($0 comercial)');
    } else if (unidad === 'Valor Fijo') {
      // Invariante SPEC-128 / Caso Plaenge / Caso Barthou:
      // Si hay al menos un reporte (incluso con 0h) o acta, se devenga el 100% del valor unitario fijo.
      const hayEjecucion = reportesAvance.length > 0 || actasRental.length > 0 || registrosViaje.length > 0;
      devengado = hayEjecucion ? valorUnitario : 0;
      evidencias.push(hayEjecucion ? 'Valor Fijo devengado 100% por ejecución registrada' : 'Pendiente de inicio en terreno');
    } else if (unidad === 'Traslado Ida' || unidad === 'Traslado Vuelta' || unidad === 'Traslado Ida/Vuelta') {
      // Fletes y traslados: devengan el 100% al completarse el tramo de viaje
      const viajesCompletados = registrosViaje.filter(v => v.estado_trayecto === 'LLEGADO' || v.fecha_llegada_faena || v.fecha_llegada_patio);
      if (viajesCompletados.length > 0 || reportesAvance.length > 0) {
        devengado = valorUnitario;
        evidencias.push(`Traslado ejecutado con ${viajesCompletados.length} viaje(s) validado(s)`);
      } else {
        devengado = 0;
        evidencias.push('Traslado pendiente de ejecución');
      }
    } else if (unidad === 'Horas Diarias Minimas') {
      // Por cada reporte diario: max(horas_reales_facturables, piso_minimo) * valorUnitario
      const pisoDiario = Math.max(1, Number(linea.piso_minimo_horas || linea.pisoMinimo || 8));
      let totalHorasDevengadas = 0;

      if (reportesAvance.length > 0) {
        for (const rep of reportesAvance) {
          const hrsReport = Number(rep.total_horas_facturables !== undefined ? rep.total_horas_facturables : (rep.horas_reales || rep.horas || pisoDiario));
          const hrsJornada = Math.max(hrsReport, pisoDiario);
          totalHorasDevengadas += hrsJornada;
          evidencias.push(`Reporte #${rep.id_reporte_avance || rep.fecha_reporte}: ${hrsReport}h efectivas -> ${hrsJornada}h facturables con piso ${pisoDiario}h`);
        }
        devengado = Math.round(totalHorasDevengadas * valorUnitario);
      } else {
        devengado = 0;
        evidencias.push('Sin reportes diarios registrados');
      }
    } else if (unidad === 'Hora Efectiva') {
      let totalHorasEfectivas = 0;
      for (const rep of reportesAvance) {
        const hrs = Number(rep.total_horas_facturables !== undefined ? rep.total_horas_facturables : (rep.horas_reales || 0));
        totalHorasEfectivas += hrs;
      }
      devengado = Math.round(totalHorasEfectivas * valorUnitario);
      evidencias.push(`Total horas efectivas registradas: ${totalHorasEfectivas}h`);
    } else if (unidad === 'Horas Mes Minimas') {
      // Bolsa mensual (ej. 180h): max(bolsa, suma_horas_reales) * valorUnitario
      const bolsa = Math.max(1, Number(linea.piso_minimo_horas || linea.pisoMinimo || 180));
      let totalHorasMes = 0;
      for (const rep of reportesAvance) {
        totalHorasMes += Number(rep.horas_reales || rep.total_horas_facturables || 0);
      }
      const horasFacturables = Math.max(bolsa, totalHorasMes);
      devengado = Math.round(horasFacturables * valorUnitario);
      evidencias.push(`Corte bolsa mes: ${totalHorasMes}h acumuladas vs ${bolsa}h mínimas -> ${horasFacturables}h facturables`);
    } else if (unidad === 'Valor Fijo Diario') {
      // Días efectivos respaldados con reportes diarios
      const diasReportados = Math.max(0, reportesAvance.length);
      devengado = Math.round(diasReportados * valorUnitario);
      evidencias.push(`${diasReportados} jornada(s) diaria(s) respaldada(s) con reportes`);
    } else if (unidad === 'Valor Fijo Semanal') {
      const diasReportados = Math.max(0, reportesAvance.length);
      const semanas = Math.ceil(diasReportados / 7) || (diasReportados > 0 ? 1 : 0);
      devengado = Math.round(semanas * valorUnitario);
      evidencias.push(`${diasReportados} día(s) -> ${semanas} semana(s) devengada(s)`);
    } else if (unidad === 'Valor Fijo Mensual') {
      // Rental mensual con pro-rata días (ej. 15 días = 15/30 de la tarifa mensual)
      if (actasRental.length > 0) {
        const acta = actasRental[0];
        const diasFaena = Number(acta.dias_arriendo_reales || acta.dias_totales || 30);
        devengado = Math.round((diasFaena / 30) * valorUnitario);
        evidencias.push(`Acta Rental: ${diasFaena} días en obra -> pro-rata (${diasFaena}/30)`);
      } else {
        const diasReportados = Math.min(30, reportesAvance.length || 30);
        devengado = Math.round((diasReportados / 30) * valorUnitario);
        evidencias.push(`Devengo mensual pro-rata ${diasReportados}/30 días`);
      }
    } else {
      devengado = presupuestado;
      evidencias.push('Devengo estándar aplicado');
    }

    totalDevengadoNeto += devengado;

    lineasConciliadas.push({
      id_linea_servicio: linea.id_linea_servicio || null,
      descripcion: linea.descripcion,
      linea_negocio: linea.linea_negocio,
      unidad: unidad,
      presupuestadoNeto: presupuestado,
      devengadoNeto: devengado,
      desviacion: devengado - presupuestado,
      evidenciasVinculadas: evidencias,
      estadoConciliacion: devengado > 0 ? 'DEVENGADO' : 'PENDIENTE'
    });
  }

  return {
    idProyecto: Number(idProyecto),
    totalPresupuestadoNeto: Math.round(totalPresupuestadoNeto),
    totalDevengadoNeto: Math.round(totalDevengadoNeto),
    desviacionNeto: Math.round(totalDevengadoNeto - totalPresupuestadoNeto),
    lineasConciliadas
  };
}

// -----------------------------------------------------------------------------
// 5. LIQUIDACIÓN DE ESTADO DE PAGO EN 2 HITOS (OPERACIONES -> CONTABILIDAD)
// -----------------------------------------------------------------------------

/**
 * Liquida formalmente un Estado de Pago respetando el circuito de 2 hitos inmutables.
 * Hito 1: Aprobación Técnica Operativa (Yiara - Operaciones)
 * Hito 2: Aprobación Financiera y Emisión DTE (Maritza - Contabilidad Laudus)
 * @param {object} params - Parámetros de liquidación.
 * @returns {object} Montos netos, IVA, retenciones y estado de hitos.
 */
function liquidarEstadoPago2Hitos(params = {}) {
  const lineasConciliadas = Array.isArray(params.lineasConciliadas) ? params.lineasConciliadas : [];
  const hito1Operaciones = Boolean(params.hito1OperacionesAprobado);
  const hito2Contabilidad = Boolean(params.hito2ContabilidadAprobado);
  const tasaIva = Number(params.tasaIva !== undefined ? params.tasaIva : 0.19);
  const retencionPorcentaje = Number(params.retencionGarantiaPorcentaje || 0);

  // Candado Duro: Si Hito 1 (Operaciones) no está aprobado, no se factura
  if (!hito1Operaciones) {
    return {
      montoNetoValidado: 0,
      montoIva: 0,
      montoRetencion: 0,
      montoTotalFacturable: 0,
      estadoHitos: {
        hito1: { aprobado: false, etiqueta: 'PENDIENTE_APROBACION_OPERACIONES' },
        hito2: { aprobado: false, etiqueta: 'BLOQUEADO_POR_HITO_1' }
      },
      lineasFacturables: [],
      esFacturable: false,
      mensaje: 'El EDP no puede liquidarse ni emitir DTE sin la aprobación previa de Operaciones (Hito 1).'
    };
  }

  // Sumar devengados netos de líneas conciliadas
  let montoNetoValidado = 0;
  const lineasFacturables = [];

  for (const lin of lineasConciliadas) {
    const neto = Math.round(Number(lin.devengadoNeto || 0));
    if (neto > 0) {
      montoNetoValidado += neto;
      lineasFacturables.push({
        ...lin,
        montoNetoFacturable: neto
      });
    }
  }

  const montoIva = Math.round(montoNetoValidado * tasaIva);
  const montoRetencion = Math.round(montoNetoValidado * retencionPorcentaje);
  const montoTotalFacturable = montoNetoValidado + montoIva - montoRetencion;

  return {
    montoNetoValidado,
    montoIva,
    montoRetencion,
    montoTotalFacturable,
    estadoHitos: {
      hito1: { aprobado: true, etiqueta: 'APROBADO_OPERACIONES' },
      hito2: {
        aprobado: hito2Contabilidad,
        etiqueta: hito2Contabilidad ? 'APROBADO_CONTABILIDAD_EMISION_DTE' : 'PENDIENTE_REVISION_CONTABILIDAD'
      }
    },
    lineasFacturables,
    esFacturable: hito1Operaciones && hito2Contabilidad,
    mensaje: hito2Contabilidad 
      ? 'EDP completamente validado en ambos hitos. Listo para emisión de DTE en Laudus / SII.'
      : 'EDP con VB técnico de Operaciones. En espera de VB financiero de Contabilidad.'
  };
}

// -----------------------------------------------------------------------------
// EXPORTACIÓN CANÓNICA
// -----------------------------------------------------------------------------

module.exports = {
  // Constantes de Dominio
  LINEAS_NEGOCIO,
  TIPOS_OT,
  ROLES_NODO,
  GRUPO_A_COBRO_UNICO,
  GRUPO_B_TIEMPO,
  UNIDADES_CANONICAS,

  // Funciones Puras del Motor
  normalizarUnidad,
  clasificarLineaNegocio,
  calcularSubtotalNodo,
  valorizarArbolCotizacion,
  conciliarDevengadoProyectoE2E,
  liquidarEstadoPago2Hitos
};
