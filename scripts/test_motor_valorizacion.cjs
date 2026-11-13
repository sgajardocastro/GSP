/**
 * test_motor_valorizacion.cjs
 * 
 * BATERÍA DE PRUEBAS UNITARIAS Y CERTIFICACIÓN MATEMÁTICA CANÓNICA
 * Especificación: SPEC-130
 * Ecosistema: Grúas San Pablo (GSP) / LeanGlobal Platform
 * 
 * Ejecución local: node scripts/test_motor_valorizacion.cjs
 */

'use strict';

const path = require('path');
const motor = require('../ejecucion/backend_remoto/src/services/motorValorizacionService');

let passedTests = 0;
let failedTests = 0;

function assertStrictEqual(actual, expected, testName) {
  if (actual === expected) {
    console.log(`  [OK] ${testName}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    console.error(`         Esperado: ${expected} (${typeof expected})`);
    console.error(`         Obtenido: ${actual} (${typeof actual})`);
    failedTests++;
  }
}

function assertTrue(condition, testName) {
  assertStrictEqual(Boolean(condition), true, testName);
}

console.log('================================================================');
console.log('INICIANDO CERTIFICACIÓN MATEMÁTICA DEL MOTOR DE VALORIZACIÓN (SPEC-130)');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// BLOQUE 1: Normalización de las 10 Unidades Canónicas Limpias
// -----------------------------------------------------------------------------
console.log('--- BLOQUE 1: Normalización de Unidades Canónicas ---');

const pruebasNormalizacion = [
  // Grupo A: Cobros Únicos y Traslados
  { input: 'Valor Fijo', esperado: 'Valor Fijo' },
  { input: 'Suma Alzada', esperado: 'Valor Fijo' },
  { input: 'fijo', esperado: 'Valor Fijo' },
  { input: 'SERVICIO CERRADO', esperado: 'Valor Fijo' },
  { input: 'Traslado Ida', esperado: 'Traslado Ida' },
  { input: 'Solo Ida', esperado: 'Traslado Ida' },
  { input: 'Traslado Vuelta', esperado: 'Traslado Vuelta' },
  { input: 'Traslado Retorno', esperado: 'Traslado Vuelta' },
  { input: 'Solo Retorno', esperado: 'Traslado Vuelta' },
  { input: 'Traslado Ida/Vuelta', esperado: 'Traslado Ida/Vuelta' },
  { input: 'Traslado Ida y Vuelta', esperado: 'Traslado Ida/Vuelta' },
  { input: 'Traslado', esperado: 'Traslado Ida/Vuelta' },
  { input: 'Flete', esperado: 'Traslado Ida/Vuelta' },
  
  // Grupo B: Tiempo y Período
  { input: 'Hora Efectiva', esperado: 'Hora Efectiva' },
  { input: 'Por Hora Efectiva', esperado: 'Hora Efectiva' },
  { input: 'Horas Diarias Minimas', esperado: 'Horas Diarias Minimas' },
  { input: 'HORAS_DIARIAS_MINIMAS', esperado: 'Horas Diarias Minimas' },
  { input: 'Por Hora', esperado: 'Horas Diarias Minimas' },
  { input: 'hrs', esperado: 'Horas Diarias Minimas' },
  { input: 'Horas Mes Minimas', esperado: 'Horas Mes Minimas' },
  { input: 'Horas Mensuales Minimas', esperado: 'Horas Mes Minimas' },
  { input: 'Bolsa 180h', esperado: 'Horas Mes Minimas' },
  { input: 'Valor Fijo Diario', esperado: 'Valor Fijo Diario' },
  { input: 'Diario', esperado: 'Valor Fijo Diario' },
  { input: 'Jornada', esperado: 'Valor Fijo Diario' },
  { input: 'Valor Fijo Semanal', esperado: 'Valor Fijo Semanal' },
  { input: 'Semanal', esperado: 'Valor Fijo Semanal' },
  { input: 'Valor Fijo Mensual', esperado: 'Valor Fijo Mensual' },
  { input: 'Mensual', esperado: 'Valor Fijo Mensual' },
  { input: 'Canon Mensual', esperado: 'Valor Fijo Mensual' }
];

pruebasNormalizacion.forEach(({ input, esperado }) => {
  assertStrictEqual(motor.normalizarUnidad(input), esperado, `Normalizar: "${input}" -> "${esperado}"`);
});

// -----------------------------------------------------------------------------
// BLOQUE 2: Certificación Matemática de las 10 Unidades Canónicas
// -----------------------------------------------------------------------------
console.log('\n--- BLOQUE 2: Fórmulas Matemáticas de las 10 Unidades ---');

// 1. Valor Fijo (Grupo A)
assertStrictEqual(
  motor.calcularSubtotalNodo({
    unidad: 'Valor Fijo',
    valor_unitario: 1000000,
    cantidad: 5 // Debe ser ignorado por regla de cobro único
  }),
  1000000,
  '1. Valor Fijo: $1.000.000 plano (ignora cantidad=5)'
);

// 2. Traslado Ida (Grupo A)
assertStrictEqual(
  motor.calcularSubtotalNodo({
    unidad: 'Traslado Ida',
    valor_unitario: 450000,
    cantidad: 2
  }),
  450000,
  '2. Traslado Ida: $450.000 plano'
);

// 3. Traslado Vuelta (Grupo A)
assertStrictEqual(
  motor.calcularSubtotalNodo({
    unidad: 'Traslado Vuelta',
    valor_unitario: 400000,
    piso_minimo_horas: 8 // Debe ignorar piso
  }),
  400000,
  '3. Traslado Vuelta: $400.000 plano'
);

// 4. Traslado Ida/Vuelta (Grupo A)
assertStrictEqual(
  motor.calcularSubtotalNodo({
    unidad: 'Traslado Ida/Vuelta',
    valor_unitario: 160000
  }),
  160000,
  '4. Traslado Ida/Vuelta: $160.000 plano e indivisible'
);

// 5. Hora Efectiva (Grupo B)
assertStrictEqual(
  motor.calcularSubtotalNodo({
    unidad: 'Hora Efectiva',
    valor_unitario: 50000,
    cantidad_horas: 15
  }),
  750000,
  '5. Hora Efectiva: 15h × $50.000 = $750.000'
);

// 6. Horas Diarias Minimas (Grupo B)
assertStrictEqual(
  motor.calcularSubtotalNodo({
    unidad: 'Horas Diarias Minimas',
    valor_unitario: 120000,
    cantidad_dias: 2,
    piso_minimo_horas: 9
  }),
  2160000,
  '6. Horas Diarias Minimas: 2 días × 9h mín × $120.000 = $2.160.000'
);

// 7. Horas Mes Minimas (Grupo B)
assertStrictEqual(
  motor.calcularSubtotalNodo({
    unidad: 'Horas Mes Minimas',
    valor_unitario: 95000,
    cantidad_meses: 1,
    piso_minimo_horas: 180
  }),
  17100000,
  '7. Horas Mes Minimas: 1 mes × 180h × $95.000 = $17.100.000'
);

// 8. Valor Fijo Diario (Grupo B)
assertStrictEqual(
  motor.calcularSubtotalNodo({
    unidad: 'Valor Fijo Diario',
    valor_unitario: 150000,
    cantidad_dias: 4
  }),
  600000,
  '8. Valor Fijo Diario: 4 días × $150.000 = $600.000'
);

// 9. Valor Fijo Semanal (Grupo B)
assertStrictEqual(
  motor.calcularSubtotalNodo({
    unidad: 'Valor Fijo Semanal',
    valor_unitario: 1200000,
    cantidad_semanas: 2
  }),
  2400000,
  '9. Valor Fijo Semanal: 2 semanas × $1.200.000 = $2.400.000'
);

// 10. Valor Fijo Mensual (Grupo B)
assertStrictEqual(
  motor.calcularSubtotalNodo({
    unidad: 'Valor Fijo Mensual',
    valor_unitario: 650000,
    cantidad_meses: 1
  }),
  650000,
  '10. Valor Fijo Mensual: 1 mes × $650.000 = $650.000'
);

// -----------------------------------------------------------------------------
// BLOQUE 3: Reglas de Excepción Constitucionales ($0, Inclusión y Apoyo)
// -----------------------------------------------------------------------------
console.log('\n--- BLOQUE 3: Reglas de Inclusión y Apoyo Operativo ($0) ---');

assertStrictEqual(
  motor.calcularSubtotalNodo({
    unidad: 'Horas Diarias Minimas',
    valor_unitario: 80000,
    cantidad_dias: 2,
    piso_minimo_horas: 8,
    incluido_en_tarifa: true
  }),
  0,
  'Línea con incluido_en_tarifa=true retorna subtotal $0'
);

assertStrictEqual(
  motor.calcularSubtotalNodo({
    unidad: 'Traslado Ida/Vuelta',
    valor_unitario: 0,
    es_apoyo_operativo: true
  }),
  0,
  'Línea de apoyo operativo interno sin precio comercial retorna subtotal $0'
);

// -----------------------------------------------------------------------------
// BLOQUE 4: Valorización de Árbol Comercial y Clasificación por Línea
// -----------------------------------------------------------------------------
console.log('\n--- BLOQUE 4: Árbol Comercial Jerárquico y Detección de Ciclos ---');

const arbolCasoReal = [
  {
    id_linea_servicio: 1,
    descripcion: 'Grúa Telescópica 70T Faena FEPASA',
    subcategoria: 'Grúas Telescópicas',
    unidad: 'Horas Diarias Minimas',
    cantidad_dias: 2,
    piso_minimo_horas: 9,
    valor_unitario: 120000
  },
  {
    id_linea_servicio: 2,
    id_linea_servicio_padre: 1,
    descripcion: 'Traslado Grúa Base - Faena - Base',
    unidad: 'Traslado Ida/Vuelta',
    valor_unitario: 350000
  },
  {
    id_linea_servicio: 3,
    id_linea_servicio_padre: 1,
    descripcion: 'Rigger de Maniobra Acreditado',
    unidad: 'Valor Fijo',
    valor_unitario: 0,
    incluido_en_tarifa: true
  }
];

const resultadoArbol = motor.valorizarArbolCotizacion(arbolCasoReal);

assertTrue(resultadoArbol.esValido, 'Árbol FEPASA es estructuralmente válido');
assertStrictEqual(resultadoArbol.totalNeto, 2510000, 'Total Neto Árbol FEPASA: $2.160.000 + $350.000 + $0 = $2.510.000');
assertStrictEqual(resultadoArbol.resumenPorLinea.IZAJE, 2510000, 'Línea IZAJE consolida $2.510.000');
assertStrictEqual(resultadoArbol.nodosNormalizados[2].subtotal, 0, 'Nodo Rigger incluido persiste con subtotal $0');

// Test de detección de auto-dependencia cíclica
const arbolCiclico = [
  {
    id_linea_servicio: 10,
    id_linea_servicio_padre: 10, // Auto-referencia
    descripcion: 'Nodo Inválido',
    unidad: 'Valor Fijo',
    valor_unitario: 500000
  }
];

const resultadoCiclico = motor.valorizarArbolCotizacion(arbolCiclico);
assertTrue(!resultadoCiclico.esValido, 'Detecta auto-dependencia cíclica (nodo.id === nodo.parentId)');
assertTrue(resultadoCiclico.errores.length > 0, 'Registra mensaje de error de auto-dependencia');

// -----------------------------------------------------------------------------
// BLOQUE 5: Conciliación de Devengo E2E (Terreno vs. Presupuesto)
// -----------------------------------------------------------------------------
console.log('\n--- BLOQUE 5: Conciliación E2E en Terreno (ITS) ---');

// Caso 1: Rigger a Valor Fijo (Plaenge) con reports de 0h facturables
const conciliacionPlaenge = motor.conciliarDevengadoProyectoE2E(2, {
  lineasServicio: [
    {
      id_linea_servicio: 101,
      descripcion: 'Servicio Profesional Rigger Plaenge',
      linea_negocio: 'PROFESIONAL',
      unidad: 'Valor Fijo',
      valor_unitario: 300000
    }
  ],
  reportesAvance: [
    { id_reporte_avance: 1, total_horas_facturables: 0, horas_reales: 8 }
  ]
});

assertStrictEqual(
  conciliacionPlaenge.totalDevengadoNeto,
  300000,
  'Plaenge: Rigger a Valor Fijo devenga $300.000 aunque report tenga 0h facturables'
);

// Caso 2: Grúa con Horas Diarias Mínimas y exceso de horas en terreno
const conciliacionExceso = motor.conciliarDevengadoProyectoE2E(1, {
  lineasServicio: [
    {
      id_linea_servicio: 201,
      descripcion: 'Grúa 70T',
      linea_negocio: 'IZAJE',
      unidad: 'Horas Diarias Minimas',
      piso_minimo_horas: 9,
      valor_unitario: 100000,
      cantidad_dias: 2
    }
  ],
  reportesAvance: [
    { id_reporte_avance: 1, total_horas_facturables: 10 }, // Supera piso de 9h -> cobra 10h
    { id_reporte_avance: 2, total_horas_facturables: 6 }   // No supera piso de 9h -> cobra 9h piso
  ]
});

assertStrictEqual(
  conciliacionExceso.totalPresupuestadoNeto,
  1800000,
  'Presupuesto inicial: 2 días × 9h × $100.000 = $1.800.000'
);
assertStrictEqual(
  conciliacionExceso.totalDevengadoNeto,
  1900000,
  'Devengo real: (10h + 9h piso) × $100.000 = $1.900.000'
);
assertStrictEqual(
  conciliacionExceso.desviacionNeto,
  100000,
  'Desviación positiva de $100.000 por 1h de sobretiempo'
);

// -----------------------------------------------------------------------------
// BLOQUE 6: Liquidación de Estado de Pago (EDP) en 2 Hitos
// -----------------------------------------------------------------------------
console.log('\n--- BLOQUE 6: Liquidación de Estado de Pago en 2 Hitos ---');

const lineasParaEdp = conciliacionExceso.lineasConciliadas;

// Bloqueo sin Hito 1 (Operaciones)
const edpSinHito1 = motor.liquidarEstadoPago2Hitos({
  lineasConciliadas: lineasParaEdp,
  hito1OperacionesAprobado: false,
  hito2ContabilidadAprobado: false
});

assertStrictEqual(edpSinHito1.montoTotalFacturable, 0, 'Sin Hito 1 de Operaciones el total facturable es $0');
assertTrue(!edpSinHito1.esFacturable, 'Bloqueado para facturación');

// Aprobación en Hito 1 pendiente de Hito 2
const edpConHito1 = motor.liquidarEstadoPago2Hitos({
  lineasConciliadas: lineasParaEdp,
  hito1OperacionesAprobado: true,
  hito2ContabilidadAprobado: false
});

assertStrictEqual(edpConHito1.montoNetoValidado, 1900000, 'Monto neto validado por Operaciones: $1.900.000');
assertTrue(!edpConHito1.esFacturable, 'Aún no es facturable en Laudus sin Hito 2 de Contabilidad');

// Aprobación en Ambos Hitos (Flujo Completo)
const edpAprobadoTotal = motor.liquidarEstadoPago2Hitos({
  lineasConciliadas: lineasParaEdp,
  hito1OperacionesAprobado: true,
  hito2ContabilidadAprobado: true,
  tasaIva: 0.19,
  retencionGarantiaPorcentaje: 0.05
});

assertStrictEqual(edpAprobadoTotal.montoNetoValidado, 1900000, 'Neto final: $1.900.000');
assertStrictEqual(edpAprobadoTotal.montoIva, 361000, 'IVA 19%: $361.000');
assertStrictEqual(edpAprobadoTotal.montoRetencion, 95000, 'Retención 5%: $95.000');
assertStrictEqual(edpAprobadoTotal.montoTotalFacturable, 2166000, 'Total Facturable: $1.900.000 + $361.000 - $95.000 = $2.166.000');
assertTrue(edpAprobadoTotal.esFacturable, '100% Facturable para emisión DTE en Laudus / SII');

// -----------------------------------------------------------------------------
// BLOQUE 7: Certificación Relacional por Identificadores Numéricos (SPEC-130)
// -----------------------------------------------------------------------------
console.log('\n--- BLOQUE 7: Certificación Relacional por IDs Numéricos (SPEC-130) ---');

// 1. Preservación estricta de IDs en valorización de árbol
const arbolRelacional = [
  {
    id_linea_servicio: 5001,
    id_categoria: 40,
    id_subcategoria: 54,
    id_equipo_sugerido: 38,
    descripcion: 'Grúa Telescópica 70 Ton',
    linea_negocio: 'IZAJE',
    unidad: 'Horas Diarias Minimas',
    piso_minimo_horas: 8,
    cantidad_dias: 1,
    valor_unitario: 120000
  },
  {
    id_linea_servicio: 5002,
    id_linea_servicio_padre: 5001,
    id_categoria: 62,
    id_subcategoria: 84,
    descripcion: 'Semirremolque Transporte',
    linea_negocio: 'TRANSPORTE',
    unidad: 'Traslado Ida/Vuelta',
    valor_unitario: 250000
  },
  {
    id_linea_servicio: 5003,
    id_linea_servicio_padre: 5001,
    id_categoria: 151,
    id_subcategoria: 160,
    descripcion: 'Rigger de Maniobra',
    linea_negocio: 'PROFESIONAL',
    unidad: 'Valor Fijo Diario',
    cantidad_dias: 1,
    valor_unitario: 80000
  }
];

const resArbolRel = motor.valorizarArbolCotizacion(arbolRelacional);
assertTrue(resArbolRel.esValido, 'Árbol relacional por IDs es válido');
assertStrictEqual(resArbolRel.nodosNormalizados[0].id_categoria, 40, 'Línea 1 conserva id_categoria = 40 (GRUAS TELESCOPICAS)');
assertStrictEqual(resArbolRel.nodosNormalizados[0].id_subcategoria, 54, 'Línea 1 conserva id_subcategoria = 54 (GRUA 70 TON)');
assertStrictEqual(resArbolRel.nodosNormalizados[0].id_equipo_sugerido, 38, 'Línea 1 conserva id_equipo_sugerido = 38');
assertStrictEqual(resArbolRel.nodosNormalizados[1].id_categoria, 62, 'Línea 2 conserva id_categoria = 62 (CAMIONES)');
assertStrictEqual(resArbolRel.nodosNormalizados[1].id_subcategoria, 84, 'Línea 2 conserva id_subcategoria = 84 (SEMIREMOLQUE)');
assertStrictEqual(resArbolRel.nodosNormalizados[2].id_categoria, 151, 'Línea 3 conserva id_categoria = 151 (PERSONAL CERTIFICADO)');
assertStrictEqual(resArbolRel.nodosNormalizados[2].id_subcategoria, 160, 'Línea 3 conserva id_subcategoria = 160 (RIGGER)');

// 2. Conciliación Multi-Línea Selectiva E2E por id_linea_servicio
const conciliacionMultiLinea = motor.conciliarDevengadoProyectoE2E(88, {
  lineasServicio: [
    {
      id_linea_servicio: 1001,
      id_categoria: 40,
      id_subcategoria: 54,
      descripcion: 'Grúa 70T Faena Principal',
      linea_negocio: 'IZAJE',
      unidad: 'Horas Diarias Minimas',
      piso_minimo_horas: 8,
      cantidad_dias: 1,
      valor_unitario: 100000 // Presupuesto: 1d * 8h * 100.000 = 800.000
    },
    {
      id_linea_servicio: 1002,
      id_categoria: 62,
      id_subcategoria: 71,
      descripcion: 'Camión Pluma Apoyo Faena',
      linea_negocio: 'IZAJE',
      unidad: 'Horas Diarias Minimas',
      piso_minimo_horas: 5,
      cantidad_dias: 1,
      valor_unitario: 60000 // Presupuesto: 1d * 5h * 60.000 = 300.000
    }
  ],
  reportesAvance: [
    // Reporte de la Grúa 70T (supera piso de 8h con 10h efectivas) -> Devenga 10h * 100.000 = 1.000.000
    { id_reporte_avance: 901, id_linea_servicio: 1001, total_horas_facturables: 10 },
    // Reporte del Camión Pluma (bajo piso de 5h con 3h) -> Devenga 5h piso * 60.000 = 300.000
    { id_reporte_avance: 902, id_linea_servicio: 1002, total_horas_facturables: 3 }
  ]
});

assertStrictEqual(conciliacionMultiLinea.totalPresupuestadoNeto, 1100000, 'Presupuesto total combinado: $800.000 + $300.000 = $1.100.000');
assertStrictEqual(conciliacionMultiLinea.lineasConciliadas[0].devengadoNeto, 1000000, 'Línea Grúa 1001 devenga exactamente $1.000.000 por su propio reporte');
assertStrictEqual(conciliacionMultiLinea.lineasConciliadas[1].devengadoNeto, 300000, 'Línea Camión 1002 devenga exactamente $300.000 aplicando su piso de 5h');
assertStrictEqual(conciliacionMultiLinea.totalDevengadoNeto, 1300000, 'Devengo total exacto: $1.000.000 + $300.000 = $1.300.000');
assertStrictEqual(conciliacionMultiLinea.desviacionNeto, 200000, 'Desviación neta total: +$200.000');

// 3. Liquidación formal de EDP con propagación de claves foráneas
const edpRelacional = motor.liquidarEstadoPago2Hitos({
  lineasConciliadas: conciliacionMultiLinea.lineasConciliadas,
  hito1OperacionesAprobado: true,
  hito2ContabilidadAprobado: true,
  tasaIva: 0.19,
  retencionGarantiaPorcentaje: 0
});

assertTrue(edpRelacional.esFacturable, 'EDP relacional 100% facturable');
assertStrictEqual(edpRelacional.lineasFacturables.length, 2, '2 líneas facturables generadas');
assertStrictEqual(edpRelacional.lineasFacturables[0].id_linea_servicio, 1001, 'Línea facturable 1 vinculada a FK id_linea_servicio = 1001');
assertStrictEqual(edpRelacional.lineasFacturables[0].id_categoria, 40, 'Línea facturable 1 vinculada a FK id_categoria = 40');
assertStrictEqual(edpRelacional.lineasFacturables[0].id_subcategoria, 54, 'Línea facturable 1 vinculada a FK id_subcategoria = 54');
assertStrictEqual(edpRelacional.lineasFacturables[1].id_linea_servicio, 1002, 'Línea facturable 2 vinculada a FK id_linea_servicio = 1002');
assertStrictEqual(edpRelacional.lineasFacturables[1].id_categoria, 62, 'Línea facturable 2 vinculada a FK id_categoria = 62');
assertStrictEqual(edpRelacional.lineasFacturables[1].id_subcategoria, 71, 'Línea facturable 2 vinculada a FK id_subcategoria = 71');
assertStrictEqual(edpRelacional.montoTotalFacturable, 1547000, 'Total facturable con IVA: $1.300.000 + 19% ($247.000) = $1.547.000');

// -----------------------------------------------------------------------------
// REPORTE DE RESULTADOS DE PRUEBAS
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`RESUMEN DE CERTIFICACIÓN MATEMÁTICA:`);
console.log(`  Total pruebas ejecutadas: ${passedTests + failedTests}`);
console.log(`  Exitosas:                 ${passedTests}`);
console.log(`  Fallidas:                 ${failedTests}`);
console.log('================================================================');

if (failedTests > 0) {
  console.error('\nERROR: Fallaron pruebas en el motor de valorización.');
  process.exit(1);
} else {
  console.log('\nCERTIFICACIÓN 100% EXITOSA: El motor único cumple todas las reglas constitucionales.');
  process.exit(0);
}
