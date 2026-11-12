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

  const esFijo = unidad.includes('FIJO') || 
                 unidad.includes('ALZADA') || 
                 tipo.includes('FIJO') || 
                 desc.includes('VALOR FIJO') ||
                 desc.includes('SUMA ALZADA');

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

  if (unidad.includes('DIARIO') || unidad.includes('DIA') || unidad.includes('JORNADA')) {
    const dias = Math.max(1, ctx.diasFaena || Number(linea.cantidad_dias) || cant);
    return valUnit * dias * (Number(linea.cantidad_horas) || 1);
  }

  if (unidad.includes('MES') || unidad.includes('MENSUAL')) {
    const meses = Number(linea.cantidad_meses || cant || 1);
    const hrsMes = Number(linea.cantidad_horas || linea.pisoMinimo || 180);
    return valUnit * meses * hrsMes;
  }

  if (unidad.includes('HORA') || unidad.includes('MINIMA')) {
    const hrs = Number(ctx.totalHorasFacturables !== undefined ? ctx.totalHorasFacturables : (Number(linea.cantidad_horas || linea.pisoMinimo || 8) * Number(linea.cantidad_dias || cant || 1)));
    return valUnit * hrs;
  }

  return valUnit * cant;
}

module.exports = {
  isLineaCobroUnico,
  normalizarLineaCobroUnico,
  calcularSubtotalLinea
};
