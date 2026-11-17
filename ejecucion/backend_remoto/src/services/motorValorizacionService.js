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

const LINEAS_NEGOCIO = Object.freeze(['IZAJE', 'RENTAL', 'TRANSPORTE', 'PROFESIONAL', 'INTERNAS']);
const TIPOS_OT = Object.freeze(['OT-MANIOBRA', 'OT-RENTAL', 'OT-FLETE', 'OT-STAFF', 'OT-INTERNA']);
const ROLES_NODO = Object.freeze(['RAIZ', 'HIJO_COMERCIAL', 'APOYO_OPERATIVO', 'ACCESORIO', 'PERSONAL', 'TRASLADO', 'OTROS', 'LIQUIDACION_ACTA']);

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
    'VALOR FIJO MENSUAL': 'Valor Fijo Mensual',
    'TARIFA POR KM': 'Tarifa por Km'
  };

  if (mapaExacto[raw]) {
    return mapaExacto[raw];
  }

  if (raw.includes('TARIFA POR KM') || raw.includes('POR KM') || raw === 'KM' || raw.includes('$/KM')) {
    return 'Tarifa por Km';
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
  const mk = (lineaNegocio, tipoOt) => ({
    lineaNegocio,
    tipoOt,
    linea_negocio: lineaNegocio,
    tipo_ot: tipoOt
  });
  const linExplicita = String(item.linea_negocio || item.linea_servicio || '').trim().toUpperCase();
  if (linExplicita === 'INTERNAS' || String(item.tipo_ot || '').trim().toUpperCase() === 'OT-INTERNA') {
    return mk('INTERNAS', 'OT-INTERNA');
  }
  if (linExplicita === 'RENTAL' || item.sin_operador === true) {
    return mk('RENTAL', 'OT-RENTAL');
  }
  if (linExplicita === 'TRANSPORTE') {
    return mk('TRANSPORTE', 'OT-FLETE');
  }
  if (linExplicita === 'PROFESIONAL') {
    return mk('PROFESIONAL', 'OT-STAFF');
  }
  if (linExplicita === 'IZAJE') {
    return mk('IZAJE', 'OT-MANIOBRA');
  }

  const desc = String(item.descripcion || item.concepto || item.tipo || '').toUpperCase();
  const subcat = String(item.subcategoria || '').toUpperCase();
  const raw = `${desc} ${subcat}`;

  if (raw.includes('MOVIMIENTO INTERNO') || raw.includes('OT-INTERNA') || raw.includes('TRASLADO INTERNO')) {
    return mk('INTERNAS', 'OT-INTERNA');
  }
  if (raw.includes('TIJERA') || raw.includes('PLATAFORMA') || raw.includes('BRAZO ARTIC') || raw.includes('ALZA HOMBRE') || raw.includes('RENTAL') || raw.includes('DRY LEASE')) {
    return mk('RENTAL', 'OT-RENTAL');
  }
  if (raw.includes('CAMA BAJA') || raw.includes('RAMPLA') || raw.includes('FLETE PURO') || raw.includes('TRANSPORTE') || raw.includes('LOGISTICA DEL SUR')) {
    return mk('TRANSPORTE', 'OT-FLETE');
  }
  if (raw.includes('RIGGER') || raw.includes('SUPERVISOR') || raw.includes('APR') || raw.includes('PREVENCION') || raw.includes('PLAN DE IZAJE') || raw.includes('ESTUDIO RIGGING') || raw.includes('MEMORIA')) {
    return mk('PROFESIONAL', 'OT-STAFF');
  }

  // Default constitucional: IZAJE (Grúas telescópicas, camiones pluma, horquillas y manipuladores)
  return mk('IZAJE', 'OT-MANIOBRA');
}

/**
 * Valida deterministamente si un nodo cumple la Matriz Maestra SPEC-129 y bloquea las 9 combinaciones descartadas.
 * @param {object} nodo - Configuración de la línea de servicio.
 * @returns {{ valido: boolean, codigo?: string, motivo?: string }}
 */
function validarReglaMatrizSpec129(nodo = {}) {
  if (!nodo || typeof nodo !== 'object') {
    return { valido: false, codigo: 'NODO_INVALIDO', motivo: 'Nodo de servicio vacío o inválido.' };
  }

  const { lineaNegocio } = clasificarLineaNegocio(nodo);
  const unidad = normalizarUnidad(nodo.unidad || nodo.unidad_cobro);
  const rol = String(nodo.rol_nodo || (nodo.id_linea_servicio_padre ? 'HIJO_COMERCIAL' : 'RAIZ')).trim().toUpperCase();
  const texto = `${nodo.subcategoria || ''} ${nodo.descripcion || ''} ${nodo.concepto || ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  // 1.4 / 2.2 / 4.5: Valor Fijo Semanal descartado transversalmente
  if (unidad === 'Valor Fijo Semanal') {
    return { valido: false, codigo: 'DESCARTADO_SEMANAL', motivo: 'Modalidad Valor Fijo Semanal descartada en SPEC-129 (1.4 / 2.2 / 4.5).' };
  }

  // 3.2: Tarifa por Km descartada
  if (unidad === 'Tarifa por Km') {
    return { valido: false, codigo: 'DESCARTADO_3_2_KM', motivo: 'Modalidad Tarifa por Km descartada en SPEC-129 (3.2).' };
  }

  // 1.6: Izaje Raíz a Valor Fijo Mensual descartado (debe usar Bolsa Mensual Flexible 1.5.M)
  if (lineaNegocio === 'IZAJE' && rol === 'RAIZ' && unidad === 'Valor Fijo Mensual') {
    return { valido: false, codigo: 'DESCARTADO_1_6', motivo: 'Valor Fijo Mensual descartado en raíz de Izaje (SPEC-129 1.6); utilice Horas Mes Mínimas (1.5.M).' };
  }

  // 2.4: Rental Raíz por Bolsa de Horas Mes descartado (debe usar Valor Fijo Mensual Horas Libres 2.3.M)
  if (lineaNegocio === 'RENTAL' && rol === 'RAIZ' && unidad === 'Horas Mes Minimas') {
    return { valido: false, codigo: 'DESCARTADO_2_4', motivo: 'Horas Mes Mínimas descartado en Rental sin operador (SPEC-129 2.4); utilice Valor Fijo Mensual (2.3.M).' };
  }

  // 3.5: Sobreestadía en Transporte por Hora Efectiva descartada
  if (lineaNegocio === 'TRANSPORTE' && rol !== 'RAIZ' && unidad === 'Hora Efectiva') {
    return { valido: false, codigo: 'DESCARTADO_3_5', motivo: 'Sobreestadía en planta por Hora Efectiva descartada en Transporte (SPEC-129 3.5).' };
  }

  // 4.3: Profesional Raíz por Horas Diarias Mínimas descartado
  if (lineaNegocio === 'PROFESIONAL' && rol === 'RAIZ' && unidad === 'Horas Diarias Minimas') {
    return { valido: false, codigo: 'DESCARTADO_4_3', motivo: 'Horas Diarias Mínimas descartado en Servicios Profesionales (SPEC-129 4.3).' };
  }

  // 4.7: Estudio de Rigging / Memoria de Cálculo como servicio raíz independiente descartado
  if (lineaNegocio === 'PROFESIONAL' && rol === 'RAIZ' && (texto.includes('ESTUDIO DE RIGGING') || texto.includes('ESTUDIO RIGGING') || texto.includes('MEMORIA DE CALCULO'))) {
    return { valido: false, codigo: 'DESCARTADO_4_7', motivo: 'Estudio de Rigging independiente descartado como raíz (SPEC-129 4.7); utilice Accesorio 1.10.M o pestaña Otros 4.8.M.' };
  }

  return { valido: true };
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

  // Regla SPEC-129 (5.0): Movimientos internos de flota tienen valor comercial estrictamente $0.
  if (String(nodo.linea_negocio || nodo.linea_servicio || '').toUpperCase() === 'INTERNAS' ||
      String(nodo.tipo_ot || '').toUpperCase() === 'OT-INTERNA') {
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
      resumenPorLinea: { IZAJE: 0, RENTAL: 0, TRANSPORTE: 0, PROFESIONAL: 0, INTERNAS: 0 },
      nodosNormalizados: [],
      esValido: false,
      errores: ['El parámetro servicios debe ser un arreglo.']
    };
  }

  const errores = [];
  const nodosNormalizados = [];
  const idsVistos = new Set();
  const resumenPorLinea = { IZAJE: 0, RENTAL: 0, TRANSPORTE: 0, PROFESIONAL: 0, INTERNAS: 0 };
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
    const subtotal = calcularSubtotalNodo({ ...raw, linea_negocio: raw.linea_negocio || lineaNegocio, tipo_ot: raw.tipo_ot || tipoOt, unidad });

    const esGrupoA = GRUPO_A_COBRO_UNICO.includes(unidad);
    const nodoNormalizado = {
      id_linea_servicio: idNodo,
      id_servicio: raw.id_servicio || null,
      id_linea_servicio_padre: idPadre,
      id_categoria: raw.id_categoria ? Number(raw.id_categoria) : null,
      id_subcategoria: raw.id_subcategoria ? Number(raw.id_subcategoria) : null,
      id_equipo_sugerido: raw.id_equipo_sugerido ? Number(raw.id_equipo_sugerido) : null,
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

function calcularDiasInclusiveActa(fechaEntrega, fechaRetiro) {
  if (!fechaEntrega || !fechaRetiro) return 0;
  const d1 = new Date(fechaEntrega);
  const d2 = new Date(fechaRetiro);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return 0;
  const diffMs = d2.getTime() - d1.getTime();
  return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
}

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
  const costosSubcontratoIts = Array.isArray(params.costosSubcontratoIts) ? params.costosSubcontratoIts : [];

  let totalPresupuestadoNeto = 0;
  let totalDevengadoNeto = 0;
  const lineasConciliadas = [];
  const hayEjecucionGlobalProyecto = reportesAvance.length > 0 || actasRental.length > 0 || registrosViaje.length > 0;

  for (const linea of lineasServicio) {
    const unidad = normalizarUnidad(linea.unidad || linea.unidad_cobro);
    const { lineaNegocio, tipoOt } = clasificarLineaNegocio(linea);
    const lineaNegUpper = String(linea.linea_negocio || lineaNegocio).toUpperCase();
    const rolUpper = String(linea.rol_nodo || (linea.id_linea_servicio_padre ? 'HIJO_COMERCIAL' : 'RAIZ')).toUpperCase();
    const presupuestado = calcularSubtotalNodo({ ...linea, linea_negocio: lineaNegUpper, unidad });
    totalPresupuestadoNeto += presupuestado;

    const idLinea = linea.id_linea_servicio !== undefined ? linea.id_linea_servicio : (linea.id || linea.id_linea || null);
    const idPadre = linea.id_linea_servicio_padre || linea.parentId || null;
    const idSrv = linea.id_servicio || null;

    // Filtrado estricto por clave foránea (SPEC-130)
    const reportesTienenFk = reportesAvance.some(r => r.id_linea_servicio !== undefined && r.id_linea_servicio !== null);
    const reportesParaLinea = reportesTienenFk
      ? reportesAvance.filter(r => String(r.id_linea_servicio) === String(idLinea))
      : (reportesAvance.some(r => r.id_servicio !== undefined && r.id_servicio !== null)
          ? reportesAvance.filter(r => String(r.id_servicio) === String(idSrv))
          : reportesAvance);

    const reportesPadre = (idPadre !== null && reportesTienenFk)
      ? reportesAvance.filter(r => String(r.id_linea_servicio) === String(idPadre))
      : [];

    const viajesTienenFk = registrosViaje.some(v => v.id_linea_servicio !== undefined && v.id_linea_servicio !== null);
    const viajesParaLinea = viajesTienenFk
      ? registrosViaje.filter(v => String(v.id_linea_servicio) === String(idLinea))
      : (registrosViaje.some(v => v.id_servicio !== undefined && v.id_servicio !== null)
          ? registrosViaje.filter(v => String(v.id_servicio) === String(idSrv))
          : registrosViaje);

    const actasTienenFk = actasRental.some(a => a.id_linea_servicio !== undefined && a.id_linea_servicio !== null);
    const actasParaLinea = actasTienenFk
      ? actasRental.filter(a => String(a.id_linea_servicio) === String(idLinea))
      : (actasRental.some(a => a.id_servicio !== undefined && a.id_servicio !== null)
          ? actasRental.filter(a => String(a.id_servicio) === String(idSrv))
          : actasRental);

    const valorUnitario = Number(linea.valor_unitario !== undefined ? linea.valor_unitario : (linea.valorUnitario || linea.tarifa || 0)) || 0;
    let devengado = 0;
    const evidencias = [];

    if (lineaNegUpper === 'INTERNAS' || String(linea.tipo_ot || tipoOt).toUpperCase() === 'OT-INTERNA') {
      devengado = 0;
      evidencias.push('Movimiento interno de flota (SPEC-129 5.0: $0 comercial / $0 EDP)');
    } else if (linea.incluido_en_tarifa === true || linea.incluido === true || linea.es_apoyo_operativo === true) {
      devengado = 0;
      evidencias.push('Línea incluida o de apoyo operativo interno ($0 comercial)');
    } else if (unidad === 'Valor Fijo') {
      // Invariante SPEC-128 / Caso Plaenge / Caso Barthou / Caso Pocuro (hijos 'OTROS'/'ACCESORIO'):
      const esRamaSecundaria = Boolean(idPadre !== null || ['OTROS', 'ACCESORIO', 'HIJO_COMERCIAL'].includes(rolUpper));
      const hayEjecucion = reportesParaLinea.length > 0 || actasParaLinea.length > 0 || viajesParaLinea.length > 0 || (esRamaSecundaria && hayEjecucionGlobalProyecto);
      devengado = hayEjecucion ? valorUnitario : 0;
      evidencias.push(hayEjecucion ? 'Valor Fijo devengado 100% por ejecución registrada' : 'Pendiente de inicio en terreno');
    } else if (unidad === 'Traslado Ida' || unidad === 'Traslado Vuelta' || unidad === 'Traslado Ida/Vuelta') {
      const viajesCompletados = viajesParaLinea.filter(v => v.estado_trayecto === 'LLEGADO' || v.fecha_llegada_faena || v.fecha_llegada_patio);
      if (viajesCompletados.length > 0 || reportesParaLinea.length > 0) {
        devengado = valorUnitario;
        evidencias.push(`Traslado ejecutado con ${viajesCompletados.length} viaje(s) validado(s)`);
      } else {
        devengado = 0;
        evidencias.push('Traslado pendiente de ejecución');
      }
    } else if (unidad === 'Horas Diarias Minimas') {
      const pisoDiario = Math.max(1, Number(linea.piso_minimo_horas || linea.pisoMinimo || 8));
      let totalHorasDevengadas = 0;

      if (reportesParaLinea.length > 0) {
        for (const rep of reportesParaLinea) {
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
      const fuenteReportes = (reportesParaLinea.length === 0 && reportesPadre.length > 0) ? reportesPadre : reportesParaLinea;
      let totalHorasEfectivas = 0;
      for (const rep of fuenteReportes) {
        const hrs = Number(rep.total_horas_facturables !== undefined ? rep.total_horas_facturables : (rep.horas_reales || 0));
        totalHorasEfectivas += hrs;
      }
      devengado = Math.round(totalHorasEfectivas * valorUnitario);
      evidencias.push(`Total horas efectivas registradas: ${totalHorasEfectivas}h`);
    } else if (unidad === 'Horas Mes Minimas') {
      const bolsa = Math.max(1, Number(linea.piso_minimo_horas || linea.pisoMinimo || 180));
      let totalHorasMes = 0;
      for (const rep of reportesParaLinea) {
        totalHorasMes += Number(rep.horas_reales || rep.total_horas_facturables || 0);
      }
      const horasFacturables = Math.max(bolsa, totalHorasMes);
      devengado = Math.round(horasFacturables * valorUnitario);
      evidencias.push(`Corte bolsa mes: ${totalHorasMes}h acumuladas vs ${bolsa}h mínimas -> ${horasFacturables}h facturables`);
    } else if (unidad === 'Valor Fijo Diario') {
      // Regla SPEC-129 (2.1.M Rental Diario por Acta 360° vs 1.3 / 4.2 / 1.10.M Accesorio heredando jornadas del padre)
      if (lineaNegUpper === 'RENTAL' || actasParaLinea.length > 0) {
        if (actasParaLinea.length > 0) {
          const acta = actasParaLinea[0];
          const diasActa = Math.max(0, Number(acta.dias_arriendo_reales || acta.dias_totales || calcularDiasInclusiveActa(acta.fecha_entrega, acta.fecha_retiro) || 0));
          devengado = Math.round(diasActa * valorUnitario);
          evidencias.push(`Acta Rental 360°: ${diasActa} día(s) efectivos de arriendo`);
        } else {
          devengado = 0;
          evidencias.push('Rental pendiente de Acta 360°');
        }
      } else {
        const fuenteDias = (reportesParaLinea.length === 0 && reportesPadre.length > 0) ? reportesPadre : reportesParaLinea;
        const diasReportados = Math.max(0, fuenteDias.length);
        devengado = Math.round(diasReportados * valorUnitario);
        evidencias.push(`${diasReportados} jornada(s) diaria(s) respaldada(s)`);
      }
    } else if (unidad === 'Valor Fijo Semanal') {
      const diasReportados = Math.max(0, reportesParaLinea.length);
      const semanas = Math.ceil(diasReportados / 7) || (diasReportados > 0 ? 1 : 0);
      devengado = Math.round(semanas * valorUnitario);
      evidencias.push(`${diasReportados} día(s) -> ${semanas} semana(s) devengada(s)`);
    } else if (unidad === 'Valor Fijo Mensual') {
      if (actasParaLinea.length > 0) {
        const acta = actasParaLinea[0];
        const diasFaena = Number(acta.dias_arriendo_reales || acta.dias_totales || 30);
        devengado = Math.round((diasFaena / 30) * valorUnitario);
        evidencias.push(`Acta Rental: ${diasFaena} días en obra -> pro-rata (${diasFaena}/30)`);
      } else {
        const diasReportados = Math.min(30, reportesParaLinea.length || 30);
        devengado = Math.round((diasReportados / 30) * valorUnitario);
        evidencias.push(`Devengo mensual pro-rata ${diasReportados}/30 días`);
      }
    } else {
      devengado = presupuestado;
      evidencias.push('Devengo estándar aplicado');
    }

    totalDevengadoNeto += devengado;

    lineasConciliadas.push({
      id_linea_servicio: idLinea,
      id_linea_servicio_padre: idPadre,
      id_servicio: idSrv,
      id_categoria: linea.id_categoria ? Number(linea.id_categoria) : null,
      id_subcategoria: linea.id_subcategoria ? Number(linea.id_subcategoria) : null,
      id_equipo_sugerido: linea.id_equipo_sugerido ? Number(linea.id_equipo_sugerido) : null,
      descripcion: linea.descripcion,
      linea_negocio: lineaNegUpper,
      tipo_ot: linea.tipo_ot || tipoOt,
      rol_nodo: rolUpper,
      unidad: unidad,
      valor_unitario: valorUnitario,
      presupuestadoNeto: presupuestado,
      devengadoNeto: devengado,
      desviacion: devengado - presupuestado,
      evidenciasVinculadas: evidencias,
      estadoConciliacion: devengado > 0 ? 'DEVENGADO' : 'PENDIENTE'
    });

    // Regla SPEC-129 (2.7.M): Liquidación de Diésel Faltante ($/L editable) y Daños con Evidencia Fotográfica al Retiro Rental
    if (lineaNegUpper === 'RENTAL' && rolUpper === 'RAIZ' && actasParaLinea.length > 0) {
      for (const acta of actasParaLinea) {
        const litrosFaltantes = Math.max(0, Number(acta.litros_diesel_faltantes || 0));
        const valorLitro = Math.max(0, Number(acta.valor_litro_diesel || 0));
        if (litrosFaltantes > 0 && valorLitro > 0) {
          const montoDiesel = Math.round(litrosFaltantes * valorLitro);
          totalDevengadoNeto += montoDiesel;
          lineasConciliadas.push({
            id_linea_servicio: `acta_diesel_${acta.id_acta || idLinea}`,
            id_linea_servicio_padre: idLinea,
            descripcion: `Reposición Combustible Diésel (${litrosFaltantes} L × $${valorLitro}/L)`,
            linea_negocio: 'RENTAL',
            tipo_ot: 'OT-RENTAL',
            rol_nodo: 'LIQUIDACION_ACTA',
            unidad: 'Valor Fijo',
            valor_unitario: montoDiesel,
            presupuestadoNeto: 0,
            devengadoNeto: montoDiesel,
            desviacion: montoDiesel,
            evidenciasVinculadas: ['Acta 360° Retiro — Diferencia de combustible'],
            estadoConciliacion: 'DEVENGADO'
          });
        }

        const danos = Array.isArray(acta.cargos_danos) ? acta.cargos_danos : [];
        for (let dIdx = 0; dIdx < danos.length; dIdx++) {
          const dano = danos[dIdx] || {};
          const montoDano = Math.max(0, Math.round(Number(dano.monto || 0)));
          if (montoDano > 0 && dano.tiene_evidencia_fotografica === true) {
            totalDevengadoNeto += montoDano;
            lineasConciliadas.push({
              id_linea_servicio: `acta_dano_${acta.id_acta || idLinea}_${dIdx + 1}`,
              id_linea_servicio_padre: idLinea,
              descripcion: dano.descripcion || `Cargo por Daño en Acta Retiro #${dIdx + 1}`,
              linea_negocio: 'RENTAL',
              tipo_ot: 'OT-RENTAL',
              rol_nodo: 'LIQUIDACION_ACTA',
              unidad: 'Valor Fijo',
              valor_unitario: montoDano,
              presupuestadoNeto: 0,
              devengadoNeto: montoDano,
              desviacion: montoDano,
              evidenciasVinculadas: ['Acta 360° Retiro — Respaldo fotográfico verificado'],
              estadoConciliacion: 'DEVENGADO'
            });
          }
        }
      }
    }
  }

  // Regla SPEC-129 (1.8.M / 1.11.M / 2.5.M / 2.6.M): Los fletes o camiones subcontratados (OC) figuran en ITS como costo, JAMÁS en EDP.
  const totalCostosSubcontratoIts = costosSubcontratoIts.reduce((acc, c) => acc + Math.max(0, Math.round(Number(c?.monto_costo || 0))), 0);

  return {
    idProyecto: Number(idProyecto),
    totalPresupuestadoNeto: Math.round(totalPresupuestadoNeto),
    totalDevengadoNeto: Math.round(totalDevengadoNeto),
    desviacionNeto: Math.round(totalDevengadoNeto - totalPresupuestadoNeto),
    totalCostosSubcontratoIts,
    lineasConciliadas
  };
}

// -----------------------------------------------------------------------------
// 5. LIQUIDACIÓN DE ESTADO DE PAGO EN 2 HITOS (OPERACIONES -> CONTABILIDAD)
// -----------------------------------------------------------------------------

/**
 * Liquida formalmente un Estado de Pago respetando el circuito de 2 hitos inmutables,
 * consolidación de traslado único en Rental (2.5.M/2.6.M) y overrides manuales de Control de Gestión (Acuerdo #6).
 */
function liquidarEstadoPago2Hitos(params = {}) {
  const lineasConciliadas = Array.isArray(params.lineasConciliadas) ? params.lineasConciliadas : [];
  const ajustesManualesEdp = (params.ajustesManualesEdp && typeof params.ajustesManualesEdp === 'object') ? params.ajustesManualesEdp : {};
  const otrosItemsManuales = Array.isArray(params.otrosItemsManuales) ? params.otrosItemsManuales : [];
  const consolidarTrasladosRental = params.consolidarTrasladosRental !== undefined
    ? Boolean(params.consolidarTrasladosRental)
    : lineasConciliadas.some(l => String(l?.linea_negocio || '').toUpperCase() === 'RENTAL');
  const hito1Operaciones = Boolean(params.hito1OperacionesAprobado);
  const hito2Contabilidad = Boolean(params.hito2ContabilidadAprobado);
  const tasaIva = Number(params.tasaIva !== undefined ? params.tasaIva : 0.19);
  const retencionPorcentaje = Number(params.retencionGarantiaPorcentaje || 0);

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

  let montoNetoValidado = 0;
  const lineasFacturables = [];
  let acumuladoTrasladoRental = 0;
  let plantillaTrasladoRental = null;

  for (const lin of lineasConciliadas) {
    if (String(lin.linea_negocio || '').toUpperCase() === 'INTERNAS') {
      continue;
    }

    const key = lin.id_linea_servicio !== undefined && lin.id_linea_servicio !== null ? String(lin.id_linea_servicio) : null;
    const ajuste = key && ajustesManualesEdp[key] ? ajustesManualesEdp[key] : null;
    let neto = Math.round(Number(lin.devengadoNeto || 0));
    let descripcionFinal = lin.descripcion;

    if (ajuste) {
      if (ajuste.glosa) descripcionFinal = String(ajuste.glosa).trim();
      const vu = ajuste.valor_unitario !== undefined ? Number(ajuste.valor_unitario) : Number(lin.valor_unitario || 0);
      if (ajuste.monto_neto !== undefined) {
        neto = Math.round(Number(ajuste.monto_neto));
      } else if (ajuste.cantidad_horas !== undefined) {
        neto = Math.round(Number(ajuste.cantidad_horas) * vu);
      } else if (ajuste.cantidad !== undefined) {
        neto = Math.round(Number(ajuste.cantidad) * vu);
      }
    }

    const esTrasladoRental = consolidarTrasladosRental &&
      String(lin.linea_negocio || '').toUpperCase() === 'RENTAL' &&
      String(lin.rol_nodo || '').toUpperCase() === 'TRASLADO';

    if (esTrasladoRental) {
      acumuladoTrasladoRental += Math.max(0, neto);
      if (!plantillaTrasladoRental) plantillaTrasladoRental = lin;
      continue;
    }

    if (neto > 0) {
      montoNetoValidado += neto;
      lineasFacturables.push({
        ...lin,
        descripcion: descripcionFinal,
        montoNetoFacturable: neto
      });
    }
  }

  if (plantillaTrasladoRental && acumuladoTrasladoRental > 0) {
    const montoTrasladoFinal = ajustesManualesEdp.TRASLADO_RENTAL_CONSOLIDADO?.monto_neto !== undefined
      ? Math.round(Number(ajustesManualesEdp.TRASLADO_RENTAL_CONSOLIDADO.monto_neto))
      : acumuladoTrasladoRental;
    if (montoTrasladoFinal > 0) {
      montoNetoValidado += montoTrasladoFinal;
      lineasFacturables.push({
        ...plantillaTrasladoRental,
        id_linea_servicio: 'TRASLADO_RENTAL_CONSOLIDADO',
        descripcion: ajustesManualesEdp.TRASLADO_RENTAL_CONSOLIDADO?.glosa || 'Flete / Traslado',
        rol_nodo: 'TRASLADO',
        unidad: 'Traslado Ida/Vuelta',
        cantidad: 1,
        devengadoNeto: montoTrasladoFinal,
        montoNetoFacturable: montoTrasladoFinal
      });
    }
  }

  for (let oIdx = 0; oIdx < otrosItemsManuales.length; oIdx++) {
    const otro = otrosItemsManuales[oIdx] || {};
    const netoOtro = Math.max(0, Math.round(Number(otro.monto_neto || otro.valor || 0)));
    if (netoOtro > 0) {
      montoNetoValidado += netoOtro;
      lineasFacturables.push({
        id_linea_servicio: `otros_manual_${oIdx + 1}`,
        descripcion: String(otro.descripcion || otro.glosa || `Adicional #${oIdx + 1}`).trim(),
        rol_nodo: 'OTROS',
        unidad: 'Valor Fijo',
        cantidad: 1,
        devengadoNeto: netoOtro,
        montoNetoFacturable: netoOtro
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
  validarReglaMatrizSpec129,
  calcularSubtotalNodo,
  valorizarArbolCotizacion,
  conciliarDevengadoProyectoE2E,
  liquidarEstadoPago2Hitos
};
