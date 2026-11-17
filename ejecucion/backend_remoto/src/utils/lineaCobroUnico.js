/**
 * lineaCobroUnico.js
 * Módulo Canónico de Gobernanza de Líneas de Cobro Único (SPEC-128 / Rule 15)
 * Ecosistema: Grúas San Pablo (GSP) / LeanGlobal Platform
 * 
 * Regla de Oro Constitucional:
 * Toda línea de "Valor Fijo" (Suma Alzada) o "TRASLADOS" (Ida, Retorno, Ida/Vuelta)
 * es un cobro único e indivisible. La cantidad siempre es 1 y el subtotal es 1 × valorUnitario.
 * Queda terminantemente prohibido multiplicar por cantidad o particionar en mitades arbitrarias.
 */

function isLineaCobroUnico(linea) {
  if (!linea || typeof linea !== 'object') return false;
  const unidad = String(linea.unidad || linea.unidad_cobro || '').trim().toUpperCase();
  const tipo = String(linea.tipo || linea.categoria || '').trim().toUpperCase();
  const desc = String(linea.descripcion || linea.concepto || '').trim().toUpperCase();
  const subcat = String(linea.subcategoria || '').trim().toUpperCase();

  const esFijoPeriodico = unidad.includes('DIARIO') ||
                          unidad.includes('DIA') ||
                          unidad.includes('DÍA') ||
                          unidad.includes('JORNADA') ||
                          unidad.includes('SEMAN') ||
                          unidad.includes('MENSUAL') ||
                          unidad.includes('MES');

  const esFijo = !esFijoPeriodico && (
                 unidad === 'VALOR FIJO' ||
                 unidad === 'FIJO' ||
                 unidad.includes('ALZADA') ||
                 tipo === 'VALOR FIJO' ||
                 desc.includes('SUMA ALZADA') ||
                 (desc.includes('VALOR FIJO') && !desc.includes('DIARIO') && !desc.includes('MENSUAL') && !desc.includes('SEMANAL'))
                 );

  const esTraslado = tipo === 'TRASLADOS' || 
                     tipo.includes('TRASLADO') || 
                     tipo.includes('FLETE') || 
                     unidad.startsWith('TRASLADO') || 
                     unidad.includes('FLETE') ||
                     subcat.includes('FLETE') ||
                     desc.includes('TRASLADO') ||
                     desc.includes('FLETE');

  return Boolean(esFijo || esTraslado);
}

function normalizarLineaCobroUnico(linea) {
  if (!linea || typeof linea !== 'object') return linea;
  if (!isLineaCobroUnico(linea)) return linea;

  const valUnit = Number(linea.valorUnitario !== undefined ? linea.valorUnitario : (linea.valor_unitario !== undefined ? linea.valor_unitario : (linea.precio_unitario || linea.tarifa || 0))) || 0;

  return {
    ...linea,
    cantidad: 1,
    cantidad_dias: null,
    cantidad_meses: null,
    cantidad_horas: null,
    pisoMinimo: 0,
    valorUnitario: valUnit,
    valor_unitario: valUnit,
    subtotal: valUnit,
    subtotal_calculado: valUnit
  };
}

function calcularSubtotalLinea(linea, ctx = {}) {
  if (!linea || typeof linea !== 'object') return 0;
  const valUnit = Number(linea.valorUnitario !== undefined ? linea.valorUnitario : (linea.valor_unitario !== undefined ? linea.valor_unitario : (linea.precio_unitario || linea.tarifa || 0))) || 0;

  if (isLineaCobroUnico(linea)) {
    return valUnit;
  }

  const unidad = String(linea.unidad || linea.unidad_cobro || '').trim().toUpperCase();
  const cant = Number(linea.cantidad || 1);
  const lineaNegocio = String(linea.linea_negocio || linea.linea_servicio || '').trim().toUpperCase();
  const esRental = lineaNegocio === 'RENTAL' || String(linea.tipo_ot || '').toUpperCase().includes('RENTAL') || String(linea.tipo || '').toUpperCase().includes('ALZA') || String(linea.subcategoria || '').toUpperCase().includes('TIJERA');

  if ((unidad.includes('DIARIO') || unidad.includes('DIA') || unidad.includes('DÍA') || unidad.includes('JORNADA')) && !unidad.includes('HORA') && !unidad.includes('MINIMA') && !unidad.includes('MÍNIMA')) {
    const dias = esRental
      ? Math.max(1, Number(linea.cantidad_dias || linea.cantidad || 1))
      : Math.max(1, ctx.diasFaena || Number(linea.cantidad_dias || linea.cantidad || 1));
    return Math.round(valUnit * dias);
  }

  if ((unidad.includes('MES') || unidad.includes('MENSUAL')) && (unidad.includes('HORA') || unidad.includes('MINIMA') || unidad.includes('MÍNIMA') || unidad.includes('BOLSA'))) {
    const meses = Math.max(1, Number(linea.cantidad_meses || cant || 1));
    const hrsMes = Math.max(1, Number(linea.cantidad_horas || linea.piso_minimo_horas || linea.pisoMinimo || 180));
    return Math.round(valUnit * meses * hrsMes);
  }

  if (unidad.includes('MES') || unidad.includes('MENSUAL') || unidad.includes('CANON')) {
    const meses = Math.max(1, Number(linea.cantidad_meses || cant || 1));
    return Math.round(valUnit * meses);
  }

  if (unidad.includes('HORA') || unidad.includes('MINIMA') || unidad.includes('MÍNIMA')) {
    const hrs = Number(ctx.totalHorasFacturables !== undefined ? ctx.totalHorasFacturables : (Number(linea.cantidad_horas || linea.piso_minimo_horas || linea.pisoMinimo || 8) * Number(linea.cantidad_dias || cant || 1)));
    return Math.round(valUnit * hrs);
  }

  return Math.round(valUnit * cant);
}

module.exports = {
  isLineaCobroUnico,
  normalizarLineaCobroUnico,
  calcularSubtotalLinea
};
