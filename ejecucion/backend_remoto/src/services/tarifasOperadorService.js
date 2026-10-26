/**
 * Servicio Canónico de Resolución Determinista de Tarifas de Operador
 * Ecosistema Grúas San Pablo (GSP) / LeanGlobal
 * Fuente Oficial: Contabilidad/VALOR_HORA_OPERADOR_2026-10-26.xlsx
 * Especificación Canónica: .agents/specs/78_its_final_viaticos_alimentacion_y_resumen_ejecutivo_costos_spec.md
 */

// 19 Categorías Maestras Oficiales según Contabilidad
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
function resolverTarifaOperador(tipo_equipo, capacidad_ton) {
  const tipoNorm = normalizarTexto(tipo_equipo);
  const ton = extraerTonelaje(tipo_equipo, capacidad_ton);

  // 1. Maquinarias específicas no telescópicas
  if ((tipoNorm.includes('CAMION') && tipoNorm.includes('PLUMA')) || tipoNorm.includes('PLUMA')) {
    return 3500;
  }
  if (tipoNorm.includes('MANIPULADOR')) {
    return 3000;
  }
  if (tipoNorm.includes('HORQUILLA')) {
    return 3000;
  }

  // 2. Grúas Telescópicas / Grúas Móviles por tramo de tonelaje
  if (ton > 0) {
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

module.exports = {
  TARIFAS_MAESTRAS_OPERADOR,
  normalizarTexto,
  extraerTonelaje,
  resolverTarifaOperador,
  resolverTarifaTraslado
};
