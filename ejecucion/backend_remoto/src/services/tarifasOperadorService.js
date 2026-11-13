/**
 * Servicio Canónico de Resolución Determinista de Tarifas de Operador
 * Ecosistema Grúas San Pablo (GSP) / LeanGlobal
 * Fuente Oficial PostgreSQL: Tabla paramétrica tpar_tarifa_operador (sch_leangsp / sch_leangsp_prod)
 * Especificación Canónica: .agents/specs/78_its_final_viaticos_alimentacion_y_resumen_ejecutivo_costos_spec.md
 */

// 19 Categorías Maestras Oficiales en tpar_tarifa_operador
const TARIFAS_MAESTRAS_OPERADOR = [
  { id: 1, equipo: 'GRUAS TELESCOPICAS 40 TON', toneladas: 40, valor_hora: 5000 },
  { id: 2, equipo: 'GRUAS TELESCOPICAS 50 TON', toneladas: 50, valor_hora: 5000 },
  { id: 3, equipo: 'GRUAS TELESCOPICAS 55 TON', toneladas: 55, valor_hora: 5000 },
  { id: 4, equipo: 'GRUAS TELESCOPICAS 60 TON', toneladas: 60, valor_hora: 6000 },
  { id: 5, equipo: 'GRUAS TELESCOPICAS 70 TON', toneladas: 70, valor_hora: 6000 },
  { id: 6, equipo: 'GRUAS TELESCOPICAS 75 TON', toneladas: 75, valor_hora: 6000 },
  { id: 7, equipo: 'GRUAS TELESCOPICAS 80 TON', toneladas: 80, valor_hora: 6000 },
  { id: 8, equipo: 'GRUAS TELESCOPICAS 90 TON', toneladas: 90, valor_hora: 6000 },
  { id: 9, equipo: 'GRUAS TELESCOPICAS 100 TON', toneladas: 100, valor_hora: 7000 },
  { id: 10, equipo: 'GRUAS TELESCOPICAS 120 TON', toneladas: 120, valor_hora: 7000 },
  { id: 11, equipo: 'GRUAS TELESCOPICAS 150 TON', toneladas: 150, valor_hora: 10000 },
  { id: 12, equipo: 'GRUAS TELESCOPICAS 160 TON', toneladas: 160, valor_hora: 10000 },
  { id: 13, equipo: 'GRUAS TELESCOPICAS 220 TON', toneladas: 220, valor_hora: 13000 },
  { id: 14, equipo: 'GRUAS TELESCOPICAS 250 TON', toneladas: 250, valor_hora: 13000 },
  { id: 19, equipo: 'GRUA TELESCOPICA 300 TON', toneladas: 300, valor_hora: 13000 },
  { id: 15, equipo: 'GRUAS TELESCOPICAS 400 TON', toneladas: 400, valor_hora: 20000 },
  { id: 16, equipo: 'CAMION PLUMA', toneladas: 0, valor_hora: 3500 },
  { id: 17, equipo: 'MANIPULADOR TELESCÓPICO', toneladas: 0, valor_hora: 3000 },
  { id: 18, equipo: 'GRUA HORQUILLA', toneladas: 0, valor_hora: 3000 }
];

/**
 * Asegura la existencia y poblamiento de la tabla paramétrica PostgreSQL tpar_tarifa_operador
 * y retorna el catálogo activo desde la base de datos.
 */
async function obtenerTarifasDesdeBD(pool) {
  if (!pool) return TARIFAS_MAESTRAS_OPERADOR;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tpar_tarifa_operador (
        id_tarifa_operador INT PRIMARY KEY,
        categoria_equipo VARCHAR(120) NOT NULL,
        toneladas NUMERIC(10,2) DEFAULT 0,
        valor_hora NUMERIC(12,2) NOT NULL,
        activo BOOLEAN DEFAULT TRUE,
        fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const countRes = await pool.query('SELECT COUNT(*)::int AS total FROM tpar_tarifa_operador;');
    if ((countRes.rows[0]?.total || 0) === 0) {
      for (const item of TARIFAS_MAESTRAS_OPERADOR) {
        await pool.query(
          `INSERT INTO tpar_tarifa_operador (id_tarifa_operador, categoria_equipo, toneladas, valor_hora, activo)
           VALUES ($1, $2, $3, $4, TRUE)
           ON CONFLICT (id_tarifa_operador) DO UPDATE
           SET categoria_equipo = EXCLUDED.categoria_equipo,
               toneladas = EXCLUDED.toneladas,
               valor_hora = EXCLUDED.valor_hora;`,
          [item.id, item.equipo, item.toneladas, item.valor_hora]
        );
      }
    }
    const res = await pool.query('SELECT id_tarifa_operador AS id, categoria_equipo AS equipo, toneladas::float AS toneladas, valor_hora::float AS valor_hora FROM tpar_tarifa_operador WHERE activo = TRUE ORDER BY id_tarifa_operador ASC;');
    return res.rows.length > 0 ? res.rows : TARIFAS_MAESTRAS_OPERADOR;
  } catch (err) {
    return TARIFAS_MAESTRAS_OPERADOR;
  }
}

/**
 * Normaliza cadenas de texto eliminando tildes y caracteres especiales
 */
function normalizarTexto(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

/**
 * Extrae tonelaje numérico desde texto o modelo si no se proveyó directamente
 */
function extraerTonelaje(tipo_equipo, capacidad_ton) {
  const cap = parseFloat(capacidad_ton);
  if (!isNaN(cap) && cap > 0) return cap;

  const str = normalizarTexto(tipo_equipo);
  // Buscar patrones como "50 TON", "50T", "400 TONELADAS", o números asociados a modelo
  const matchTon = str.match(/(\d+)\s*(?:TON|TONELADAS|T\b)/);
  if (matchTon) {
    const val = parseFloat(matchTon[1]);
    if (!isNaN(val) && val > 0) return val;
  }

  // Buscar número aislado de tonelaje común
  const matchNum = str.match(/\b(400|300|250|220|160|150|120|100|90|80|75|70|60|55|50|40)\b/);
  if (matchNum) {
    const val = parseFloat(matchNum[1]);
    if (!isNaN(val) && val > 0) return val;
  }

  return 0;
}

/**
 * Resuelve deterministamente la tarifa por hora de operador ($)
 * @param {string} tipo_equipo - Nombre, tipo o modelo de equipo
 * @param {number|string} [capacidad_ton] - Capacidad nominal en toneladas
 * @returns {number} Tarifa por hora en pesos chilenos ($)
 */
function resolverTarifaOperador(tipo_equipo, capacidad_ton, catalogo = TARIFAS_MAESTRAS_OPERADOR) {
  const tipoNorm = normalizarTexto(tipo_equipo);
  const ton = extraerTonelaje(tipo_equipo, capacidad_ton);
  const lista = Array.isArray(catalogo) && catalogo.length > 0 ? catalogo : TARIFAS_MAESTRAS_OPERADOR;

  // 1. Maquinarias específicas no telescópicas
  if ((tipoNorm.includes('CAMION') && tipoNorm.includes('PLUMA')) || tipoNorm.includes('PLUMA')) {
    const matchPluma = lista.find(t => normalizarTexto(t.equipo).includes('PLUMA'));
    return matchPluma ? Number(matchPluma.valor_hora) : 3500;
  }
  if (tipoNorm.includes('MANIPULADOR')) {
    const matchManip = lista.find(t => normalizarTexto(t.equipo).includes('MANIPULADOR'));
    return matchManip ? Number(matchManip.valor_hora) : 3000;
  }
  if (tipoNorm.includes('HORQUILLA')) {
    const matchHorq = lista.find(t => normalizarTexto(t.equipo).includes('HORQUILLA'));
    return matchHorq ? Number(matchHorq.valor_hora) : 3000;
  }

  // 2. Grúas Telescópicas / Grúas Móviles por tramo de tonelaje
  if (ton > 0) {
    const exact = lista.find(t => Number(t.toneladas) === ton);
    if (exact) return Number(exact.valor_hora);
    if (ton <= 55) return 5000;       // 40t - 55t ($5.000)
    if (ton <= 90) return 6000;       // 60t - 90t ($6.000)
    if (ton <= 120) return 7000;      // 100t - 120t ($7.000)
    if (ton <= 160) return 10000;     // 150t - 160t ($10.000)
    if (ton <= 300) return 13000;     // 220t - 300t ($13.000)
    return 20000;                     // 400t+ ($20.000)
  }

  // 3. Fallback por defecto si no se especificó tonelaje ni tipo especial
  return 5000;
}

/**
 * Regla de Traslado: La tarifa por hora de traslado es IDÉNTICA a la tarifa de servicio de la máquina asignada
 */
function resolverTarifaTraslado(tipo_equipo, capacidad_ton) {
  return resolverTarifaOperador(tipo_equipo, capacidad_ton);
}

/**
 * Resuelve el valor hora del operador según el CRITERIO COMERCIAL MANDANTE:
 * Busca primero el equipo/tonelaje comprometido en las líneas de servicio de la cotización (crm_v1.lineas_servicio).
 * Solo si la cotización no especifica equipo/tonelaje usa el equipo físico como respaldo.
 */
function resolverTarifaPorCotizacion(lineasServicio = [], equipoFisicoFallback = {}, catalogo = TARIFAS_MAESTRAS_OPERADOR) {
  if (Array.isArray(lineasServicio) && lineasServicio.length > 0) {
    for (const l of lineasServicio) {
      const desc = normalizarTexto(`${l.subcategoria || ''} ${l.descripcion || ''} ${l.concepto || ''} ${l.equipo || ''} ${l.familia || ''}`);
      const unid = normalizarTexto(l.unidad || l.unidad_cobro || '');
      const esFlete = l.tipo === 'TRASLADOS' || unid.includes('FLETE') || unid.includes('TRASLADO') || desc.includes('FLETE') || desc.includes('CAMA BAJA');
      if (esFlete) continue;

      const tonComercial = extraerTonelaje(desc, l.toneladas || l.capacidad_ton || l.capacidad_maxima);
      if (tonComercial > 0 || desc.includes('PLUMA') || desc.includes('MANIPULADOR') || desc.includes('HORQUILLA')) {
        return {
          valor_hora: resolverTarifaOperador(desc, tonComercial, catalogo),
          toneladas_comercial: tonComercial,
          glosa_comercial: (l.subcategoria || l.descripcion || l.concepto || `${tonComercial} TON`).trim()
        };
      }
    }
  }
  const fallbackTexto = `${equipoFisicoFallback.tipo_equipo || ''} ${equipoFisicoFallback.equipo_modelo || ''}`.trim();
  const fallbackTon = extraerTonelaje(fallbackTexto, equipoFisicoFallback.capacidad_maxima);
  return {
    valor_hora: resolverTarifaOperador(fallbackTexto, fallbackTon, catalogo),
    toneladas_comercial: fallbackTon,
    glosa_comercial: fallbackTexto || 'Estándar'
  };
}

/**
 * Calcula diferencia en horas decimales entre dos horas en formato HH:MM
 */
function calcularDiferenciaHoras(horaInicio, horaFin) {
  if (!horaInicio || !horaFin || typeof horaInicio !== 'string' || typeof horaFin !== 'string') return 0;
  const m1 = horaInicio.trim().match(/^(\d{1,2}):(\d{2})/);
  const m2 = horaFin.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m1 || !m2) return 0;
  const min1 = parseInt(m1[1], 10) * 60 + parseInt(m1[2], 10);
  let min2 = parseInt(m2[1], 10) * 60 + parseInt(m2[2], 10);
  if (min2 < min1) min2 += 24 * 60;
  return Number(((min2 - min1) / 60).toFixed(2));
}

/**
 * Calcula las horas del registro diario por persona (Operador o Rigger).
 * - Colación nunca se paga (se descuenta según el report).
 * - Stand By (Cliente y San Pablo) sí se paga al trabajador (no se descuenta).
 */
function calcularLiquidacionHorasDia({
  hora_salida,
  hora_llegada,
  hora_inicio,
  hora_termino,
  hora_retorno,
  colacion_minutos = 0,
  horas_reales_report = 0,
  regimen = 'URBANO',
  horas_minimas = 8
}) {
  const colacionHoras = Number(((parseFloat(colacion_minutos) || 0) / 60).toFixed(2));
  const esRural = String(regimen || '').toUpperCase() === 'RURAL';

  const inicioObra = hora_llegada || hora_inicio || hora_salida;
  const terminoObra = hora_termino || hora_retorno;
  const spanObraBruto = calcularDiferenciaHoras(inicioObra, terminoObra);
  const horasRealesEquipo = spanObraBruto > 0
    ? Math.max(0, Number((spanObraBruto - colacionHoras).toFixed(2)))
    : Math.max(0, Number((parseFloat(horas_reales_report) || 0).toFixed(2)));

  if (!esRural) {
    // Política Urbana: No se paga traslado de equipo, únicamente se consideran las horas reportadas del servicio
    // contabilizadas desde salida de base (o inicio) hasta término en obra menos colación.
    const inicioUrbano = hora_salida || hora_inicio || hora_llegada;
    const terminoUrbano = hora_termino || hora_retorno;
    const spanUrbanoBruto = calcularDiferenciaHoras(inicioUrbano, terminoUrbano);
    const hrsPagar = spanUrbanoBruto > 0
      ? Math.max(0, Number((spanUrbanoBruto - colacionHoras).toFixed(2)))
      : horasRealesEquipo;
    return {
      horas_reales_equipo: hrsPagar,
      horas_faena_pagar: hrsPagar,
      horas_flete_pagar: 0,
      horas_totales_pagar: hrsPagar,
      monto_flete_total: 0,
      colacion_horas: colacionHoras
    };
  }

  // Política Rural: Si las horas reales son menores a las mínimas, el traslado cubre la brecha
  // y solo se paga la diferencia positiva por sobre las horas mínimas.
  const minPactado = parseFloat(horas_minimas) || 8;
  const horasFaenaPagar = horasRealesEquipo > 0 ? Math.max(minPactado, horasRealesEquipo) : 0;
  const hrsIda = (hora_salida && inicioObra && hora_salida !== inicioObra)
    ? calcularDiferenciaHoras(hora_salida, inicioObra)
    : 0;
  const hrsRetorno = (terminoObra && hora_retorno && terminoObra !== hora_retorno)
    ? calcularDiferenciaHoras(terminoObra, hora_retorno)
    : 0;
  const hrsTrasladoBruto = Math.max(0, Number((hrsIda + hrsRetorno).toFixed(2)));
  const horasFletePagar = (horasRealesEquipo > 0 && horasRealesEquipo < minPactado)
    ? Math.max(0, Number(((horasRealesEquipo + hrsTrasladoBruto) - minPactado).toFixed(2)))
    : hrsTrasladoBruto;

  return {
    horas_reales_equipo: horasRealesEquipo,
    horas_faena_pagar: horasFaenaPagar,
    horas_flete_pagar: horasFletePagar,
    horas_totales_pagar: Number((horasFaenaPagar + horasFletePagar).toFixed(2)),
    colacion_horas: colacionHoras
  };
}

/**
 * Calcula el Viático de Alimentación diario según la escala tabular oficial:
 * - Menos de 8 horas reales efectivas (redondeadas, descontada colación): $0 (No aplica viático).
 * - 8 horas reales efectivas: $7.000.
 * - Cada hora adicional sobre 8: +$1.000.
 * - Tope máximo diario: $18.000.
 */
function calcularViaticoAlimentacionDia({
  condicion_dia = 'IDA_Y_REGRESO',
  hora_salida,
  hora_llegada,
  hora_inicio,
  hora_termino,
  hora_retorno,
  colacion_minutos = 0,
  horas_reales_fallback = 0
}) {
  const colacionHoras = Number(((parseFloat(colacion_minutos) || 0) / 60).toFixed(2));
  let desde = hora_salida || hora_inicio || hora_llegada || null;
  let hasta = hora_retorno || hora_termino || null;

  if (condicion_dia === 'SALIDA_OBRA') {
    desde = hora_salida || hora_inicio || hora_llegada;
    hasta = hora_termino || hora_retorno;
  } else if (condicion_dia === 'PERMANENCIA_OBRA') {
    desde = hora_inicio || hora_llegada || hora_salida;
    hasta = hora_termino;
  } else if (condicion_dia === 'RETORNO_PLANTA') {
    desde = hora_inicio || hora_llegada || hora_salida;
    hasta = hora_retorno || hora_termino;
  }

  const spanBruto = calcularDiferenciaHoras(desde, hasta);
  const horasEfectivas = spanBruto > 0
    ? Math.max(0, Number((spanBruto - colacionHoras).toFixed(2)))
    : Math.max(0, Number(((parseFloat(horas_reales_fallback) || 0) - colacionHoras).toFixed(2)));
  const horasRedondeadas = Math.round(horasEfectivas);

  let montoViatico = 0;
  if (horasRedondeadas >= 8) {
    montoViatico = Math.min(18000, 7000 + (horasRedondeadas - 8) * 1000);
  }

  return {
    condicion_dia,
    desde: desde || '--:--',
    hasta: hasta || '--:--',
    colacion_horas: colacionHoras,
    horas_efectivas: horasEfectivas,
    horas_redondeadas: horasRedondeadas,
    monto_viatico: montoViatico
  };
}

module.exports = {
  TARIFAS_MAESTRAS_OPERADOR,
  obtenerTarifasDesdeBD,
  normalizarTexto,
  extraerTonelaje,
  resolverTarifaOperador,
  resolverTarifaTraslado,
  resolverTarifaPorCotizacion,
  calcularDiferenciaHoras,
  calcularLiquidacionHorasDia,
  calcularViaticoAlimentacionDia
};
