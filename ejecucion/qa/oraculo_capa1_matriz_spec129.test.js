'use strict';

/**
 * ORÁCULO MATEMÁTICO CAPA 1 — MATRIZ DE NEGOCIO SPEC-129 & CASOS REALES DE PRODUCCIÓN
 * Especificación: SPEC-129 / SPEC-130 / SPEC-132
 * Ejecución pura (0 red, 0 SSH, 0 mutación BD): node --test ejecucion/qa/oraculo_capa1_matriz_spec129.test.js
 * Tolerancia matemática permitida: $0 CLP.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const lineaCobroUnico = require('../backend_remoto/src/utils/lineaCobroUnico');
const motor = require('../backend_remoto/src/services/motorValorizacionService');
const tarifasRRHH = require('../backend_remoto/src/services/tarifasOperadorService');

// =============================================================================
// SUITE 1: INVARIANTES DE UNIDAD DE COBRO (lineaCobroUnico.js — SPEC-128 & 129)
// =============================================================================
describe('SUITE 1 — lineaCobroUnico.js: Separación Grupo A (Cobro Único) vs Grupo B (Periódico/Horario)', () => {
  it('[1.2 / 4.1] Valor Fijo Suma Alzada (Barthou $1.000.000 / Plaenge $300.000) fuerza Cant=1 e ignora días', () => {
    const plaenge = { unidad: 'Valor Fijo', cantidad: 2, cantidad_dias: 2, valorUnitario: 300000 };
    assert.equal(lineaCobroUnico.isLineaCobroUnico(plaenge), true);
    const norm = lineaCobroUnico.normalizarLineaCobroUnico(plaenge);
    assert.equal(norm.cantidad, 1);
    assert.equal(norm.subtotal, 300000);
    assert.equal(lineaCobroUnico.calcularSubtotalLinea(plaenge, { diasFaena: 2 }), 300000);
  });

  it('[1.7.M / 1.8.M / 3.1.M] Traslados (Besalco $350.000 / Royal $90.000) fuerzan Cant=1 e ignoran días', () => {
    const besalcoFlete = { tipo: 'TRASLADOS', unidad: 'Traslado Ida/Vuelta', cantidad: 5, valorUnitario: 350000 };
    assert.equal(lineaCobroUnico.isLineaCobroUnico(besalcoFlete), true);
    assert.equal(lineaCobroUnico.calcularSubtotalLinea(besalcoFlete, { diasFaena: 5 }), 350000);
  });

  it('[BUG-02 | 1.3 / 2.1.M / 4.2] Valor Fijo Diario NO es cobro único: 12 días × $65.000 = $780.000 (jamás $65.000 ni × horas)', () => {
    const rentalDiario = {
      unidad: 'Valor Fijo Diario',
      cantidad: 12,
      cantidad_dias: 12,
      cantidad_horas: 8,
      valorUnitario: 65000
    };
    assert.equal(lineaCobroUnico.isLineaCobroUnico(rentalDiario), false, 'Valor Fijo Diario pertenece al Grupo B (por días)');
    const norm = lineaCobroUnico.normalizarLineaCobroUnico(rentalDiario);
    assert.equal(norm.cantidad_dias, 12);
    assert.equal(lineaCobroUnico.calcularSubtotalLinea(rentalDiario), 780000);
  });

  it('[BUG-02 | 2.3.M / 4.6] Valor Fijo Mensual NO es cobro único ni multiplica por 180h: 2 meses × $1.600.000 = $3.200.000', () => {
    const royalMensual = {
      unidad: 'Valor Fijo Mensual',
      cantidad: 2,
      cantidad_meses: 2,
      valorUnitario: 1600000
    };
    assert.equal(lineaCobroUnico.isLineaCobroUnico(royalMensual), false, 'Valor Fijo Mensual pertenece al Grupo B (por meses)');
    assert.equal(lineaCobroUnico.calcularSubtotalLinea(royalMensual), 3200000);
  });

  it('[1.5.M] Horas Mes Minimas (Bolsa Flexible 150h × $50.000 × 1 mes) = $7.500.000', () => {
    const bolsaFlexible = {
      unidad: 'Horas Mes Minimas',
      cantidad_meses: 1,
      cantidad_horas: 150,
      valorUnitario: 50000
    };
    assert.equal(lineaCobroUnico.isLineaCobroUnico(bolsaFlexible), false);
    assert.equal(lineaCobroUnico.calcularSubtotalLinea(bolsaFlexible), 7500000);
  });
});

// =============================================================================
// SUITE 2: MATRIZ SPEC-129 — 5 LÍNEAS DE NEGOCIO Y BLOQUEO DE 9 MODALIDADES TARJADAS
// =============================================================================
describe('SUITE 2 — motorValorizacionService.js: Dominio de 5 Líneas y Candado de 9 Modalidades Descartadas', () => {
  it('[5.0] Soporta 5ª línea INTERNAS (OT-INTERNA) con valor comercial y EDP estrictamente $0', () => {
    assert.equal(motor.LINEAS_NEGOCIO.includes('INTERNAS'), true, 'LINEAS_NEGOCIO debe incluir INTERNAS');
    assert.equal(motor.TIPOS_OT.includes('OT-INTERNA'), true, 'TIPOS_OT debe incluir OT-INTERNA');

    const cotInterna = motor.valorizarArbolCotizacion([
      { id_linea_servicio: 1, linea_negocio: 'INTERNAS', tipo_ot: 'OT-INTERNA', descripcion: 'Traslado Interno Taller', unidad: 'Valor Fijo', valor_unitario: 500000 }
    ]);
    assert.equal(cotInterna.totalNeto, 0, 'Movimiento interno (5.0) siempre tiene total comercial $0');
  });

  it('[Candado Negativo SPEC-129] Rechaza explícitamente las 9 combinaciones descartadas por Jorge & Alfonso', () => {
    assert.equal(typeof motor.validarReglaMatrizSpec129, 'function', 'Debe exportar validarReglaMatrizSpec129');

    const descartados = [
      { caso: '1.4', linea_negocio: 'IZAJE', rol_nodo: 'RAIZ', unidad: 'Valor Fijo Semanal', descripcion: 'Grua 70T Semanal' },
      { caso: '1.6', linea_negocio: 'IZAJE', rol_nodo: 'RAIZ', unidad: 'Valor Fijo Mensual', descripcion: 'Grua 70T Canon Mensual' },
      { caso: '2.2', linea_negocio: 'RENTAL', rol_nodo: 'RAIZ', unidad: 'Valor Fijo Semanal', descripcion: 'Plataforma Tijera Semanal' },
      { caso: '2.4', linea_negocio: 'RENTAL', rol_nodo: 'RAIZ', unidad: 'Horas Mes Minimas', descripcion: 'Plataforma Bolsa 180h' },
      { caso: '3.2', linea_negocio: 'TRANSPORTE', rol_nodo: 'RAIZ', unidad: 'Tarifa por Km', descripcion: 'Flete por Km' },
      { caso: '3.5', linea_negocio: 'TRANSPORTE', rol_nodo: 'HIJO_COMERCIAL', unidad: 'Hora Efectiva', descripcion: 'Sobreestadía en Planta' },
      { caso: '4.3', linea_negocio: 'PROFESIONAL', rol_nodo: 'RAIZ', unidad: 'Horas Diarias Minimas', descripcion: 'Solo Rigger Piso 8h' },
      { caso: '4.5', linea_negocio: 'PROFESIONAL', rol_nodo: 'RAIZ', unidad: 'Valor Fijo Semanal', descripcion: 'Supervisor Semanal' },
      { caso: '4.7', linea_negocio: 'PROFESIONAL', rol_nodo: 'RAIZ', unidad: 'Valor Fijo', subcategoria: 'ESTUDIO DE RIGGING', descripcion: 'Estudio de Rigging y Memoria de Cálculo' }
    ];

    for (const item of descartados) {
      const res = motor.validarReglaMatrizSpec129(item);
      assert.equal(res.valido, false, `El caso descartado ${item.caso} (${item.descripcion}) debió ser rechazado`);
    }
  });

  it('[Combinaciones Activas SPEC-129] Acepta piso flexible (1.1.M), bolsa flexible (1.5.M), Accesorio 4 modos (1.10.M) y Horquilla Dry Lease (2.1.M)', () => {
    const validos = [
      { linea_negocio: 'IZAJE', rol_nodo: 'RAIZ', unidad: 'Horas Diarias Minimas', piso_minimo_horas: 5, valor_unitario: 120000, descripcion: 'Grua 50T Piso 5h' },
      { linea_negocio: 'IZAJE', rol_nodo: 'RAIZ', unidad: 'Horas Mes Minimas', piso_minimo_horas: 120, valor_unitario: 95000, descripcion: 'Grua 80T Bolsa 120h' },
      { linea_negocio: 'IZAJE', rol_nodo: 'ACCESORIO', unidad: 'Valor Fijo Diario', cantidad_dias: 3, valor_unitario: 80000, descripcion: 'Balancín Modular' },
      { linea_negocio: 'IZAJE', rol_nodo: 'ACCESORIO', unidad: 'Hora Efectiva', cantidad_horas: 8, valor_unitario: 25000, descripcion: 'Balancín por Hora' },
      { linea_negocio: 'RENTAL', rol_nodo: 'RAIZ', unidad: 'Valor Fijo Diario', cantidad_dias: 10, valor_unitario: 70000, sin_operador: true, descripcion: 'Grúa Horquilla Arriendo Seco' }
    ];

    for (const item of validos) {
      const res = motor.validarReglaMatrizSpec129(item);
      assert.equal(res.valido, true, `Caso activo válido rechazado por error: ${item.descripcion} (${res.motivo || ''})`);
    }
  });
});

// =============================================================================
// SUITE 3: REPRODUCCIÓN EXACTA DE INCIDENTES REALES DE LA ÚLTIMA SEMANA ($0 CLP)
// =============================================================================
describe('SUITE 3 — Casos Reales de Producción (06-Nov al 13-Nov): Conciliación Cotización -> ITS -> EDP', () => {
  it('[ARQ-01 | Pocuro GSP-2611-00031] Proyecto Mixto: Grúa Horas ($1.280.000) + Flete ($200.000) + Otros Fijo ($200.000) + Rigger Incluido ($0) + Apoyo ($0) = $1.680.000', () => {
    const lineas = [
      { id_linea_servicio: 101, linea_negocio: 'IZAJE', rol_nodo: 'RAIZ', descripcion: 'Grúa 80T', unidad: 'Horas Diarias Minimas', cantidad_dias: 1, piso_minimo_horas: 8, valor_unitario: 160000 },
      { id_linea_servicio: 102, id_linea_servicio_padre: 101, linea_negocio: 'IZAJE', rol_nodo: 'TRASLADO', descripcion: 'Traslado Grúa', unidad: 'Traslado Ida/Vuelta', valor_unitario: 200000 },
      { id_linea_servicio: 103, id_linea_servicio_padre: 101, linea_negocio: 'IZAJE', rol_nodo: 'OTROS', descripcion: 'Reparación Neumático en Faena', unidad: 'Valor Fijo', valor_unitario: 200000 },
      { id_linea_servicio: 104, id_linea_servicio_padre: 101, linea_negocio: 'IZAJE', rol_nodo: 'PERSONAL', descripcion: 'Rigger Incluido', unidad: 'Valor Fijo', valor_unitario: 150000, incluido_en_tarifa: true },
      { id_linea_servicio: 105, id_linea_servicio_padre: 101, linea_negocio: 'IZAJE', rol_nodo: 'APOYO_OPERATIVO', descripcion: 'Tracto Contrapesos', unidad: 'Valor Fijo', valor_unitario: 0, es_apoyo_operativo: true }
    ];

    const conc = motor.conciliarDevengadoProyectoE2E(77, {
      lineasServicio: lineas,
      reportesAvance: [{ id_reporte_avance: 1, id_linea_servicio: 101, total_horas_facturables: 8 }],
      registrosViaje: [{ id_log_desplazamiento: 1, id_linea_servicio: 102, estado_trayecto: 'LLEGADO' }]
    });

    assert.equal(conc.totalPresupuestadoNeto, 1680000);
    assert.equal(conc.totalDevengadoNeto, 1680000, 'El hijo Valor Fijo ($200k) jamás debe borrar las horas de la grúa ($1.280k) ni caer a $0');

    const edp = motor.liquidarEstadoPago2Hitos({
      lineasConciliadas: conc.lineasConciliadas,
      hito1OperacionesAprobado: true,
      hito2ContabilidadAprobado: true
    });
    assert.equal(edp.montoNetoValidado, 1680000);
  });

  it('[ARQ-01B | FEPASA GSP-2611-00001] Grúa 70T con Piso Flexible 9h ($120.000/h) trabajando 7.5h -> cobra $1.080.000', () => {
    const conc = motor.conciliarDevengadoProyectoE2E(30, {
      lineasServicio: [
        { id_linea_servicio: 201, linea_negocio: 'IZAJE', rol_nodo: 'RAIZ', descripcion: 'Grúa 70T', unidad: 'Horas Diarias Minimas', cantidad_dias: 1, piso_minimo_horas: 9, valor_unitario: 120000 }
      ],
      reportesAvance: [{ id_reporte_avance: 10, id_linea_servicio: 201, total_horas_facturables: 7.5 }]
    });
    assert.equal(conc.totalDevengadoNeto, 1080000);
  });

  it('[ARQ-02 | Barthou GSP-2611-00003] Grúa 100T a Valor Fijo ($1.000.000) con report de 9h físicas / 0h facturables -> cobra exacto $1.000.000', () => {
    const conc = motor.conciliarDevengadoProyectoE2E(32, {
      lineasServicio: [
        { id_linea_servicio: 301, linea_negocio: 'IZAJE', rol_nodo: 'RAIZ', descripcion: 'Grúa 100T Suma Alzada', unidad: 'Valor Fijo', valor_unitario: 1000000 }
      ],
      reportesAvance: [{ id_reporte_avance: 20, id_linea_servicio: 301, horas_reales: 9, total_horas_facturables: 0 }]
    });
    assert.equal(conc.totalDevengadoNeto, 1000000);
  });

  it('[ARQ-04 | Besalco GSP-2611-00005 — Acuerdo #6] Override manual Control de Gestión en EDP (5.0h × $250.000 + 1 Flete $350.000 + Otros) = $1.600.000', () => {
    const conc = motor.conciliarDevengadoProyectoE2E(34, {
      lineasServicio: [
        { id_linea_servicio: 401, linea_negocio: 'IZAJE', rol_nodo: 'RAIZ', descripcion: 'Grúa Horquilla', unidad: 'Horas Diarias Minimas', cantidad_dias: 1, piso_minimo_horas: 6, valor_unitario: 250000 },
        { id_linea_servicio: 402, id_linea_servicio_padre: 401, linea_negocio: 'IZAJE', rol_nodo: 'TRASLADO', descripcion: 'Camión Plataforma', unidad: 'Traslado Ida/Vuelta', valor_unitario: 350000 }
      ],
      reportesAvance: [{ id_reporte_avance: 30, id_linea_servicio: 401, total_horas_facturables: 6 }],
      registrosViaje: [{ id_log_desplazamiento: 30, id_linea_servicio: 402, estado_trayecto: 'LLEGADO' }]
    });
    // Antes del override de Yiara: 6 * 250k + 350k = 1.850.000
    assert.equal(conc.totalDevengadoNeto, 1850000);

    // Yiara ajusta manualmente a 5.0h en Carátula EDP (Acuerdo #6)
    const edp = motor.liquidarEstadoPago2Hitos({
      lineasConciliadas: conc.lineasConciliadas,
      ajustesManualesEdp: {
        401: { cantidad_horas: 5, valor_unitario: 250000 }
      },
      hito1OperacionesAprobado: true,
      hito2ContabilidadAprobado: true
    });
    assert.equal(edp.montoNetoValidado, 1600000);
  });

  it('[ARQ-05 | Ferrero 00004 / Mettco 00007 / Inarco 00006 — 1.5.M] Bolsa Mensual Flexible (180h a $50.000) suprime piso diario en jornadas cortas', () => {
    const conc = motor.conciliarDevengadoProyectoE2E(33, {
      lineasServicio: [
        { id_linea_servicio: 501, linea_negocio: 'IZAJE', rol_nodo: 'RAIZ', descripcion: 'Camión Pluma Mensual', unidad: 'Horas Mes Minimas', cantidad_meses: 1, piso_minimo_horas: 180, valor_unitario: 50000 }
      ],
      reportesAvance: [
        { id_reporte_avance: 41, id_linea_servicio: 501, horas_reales: 2, total_horas_facturables: 2 },
        { id_reporte_avance: 42, id_linea_servicio: 501, horas_reales: 4, total_horas_facturables: 4 }
      ]
    });
    assert.equal(conc.totalDevengadoNeto, 9000000, 'Al corte cobra bolsa 180h × $50.000 = $9.000.000');
  });

  it('[ARQ-06 & ARQ-07 | Royal Rental 2.1.M / 2.5.M / 2.6.M / 2.7.M] Rental Diario por Acta 360° (0 reports), 1 sola línea Flete en EDP + Diésel/Daños con foto', () => {
    const conc = motor.conciliarDevengadoProyectoE2E(90, {
      lineasServicio: [
        { id_linea_servicio: 601, linea_negocio: 'RENTAL', rol_nodo: 'RAIZ', descripcion: 'Plataforma Tijera PTE-86', unidad: 'Valor Fijo Diario', cantidad_dias: 12, valor_unitario: 65000 },
        { id_linea_servicio: 602, id_linea_servicio_padre: 601, linea_negocio: 'RENTAL', rol_nodo: 'TRASLADO', descripcion: 'Flete Entrega', unidad: 'Traslado Ida', valor_unitario: 80000 },
        { id_linea_servicio: 603, id_linea_servicio_padre: 601, linea_negocio: 'RENTAL', rol_nodo: 'TRASLADO', descripcion: 'Flete Retiro', unidad: 'Traslado Vuelta', valor_unitario: 80000 }
      ],
      reportesAvance: [], // CERO reports diarios en RENTAL (2.1.M)
      registrosViaje: [
        { id_log_desplazamiento: 61, id_linea_servicio: 602, estado_trayecto: 'LLEGADO' },
        { id_log_desplazamiento: 62, id_linea_servicio: 603, estado_trayecto: 'LLEGADO' }
      ],
      actasRental: [
        {
          id_acta: 1,
          id_linea_servicio: 601,
          fecha_entrega: '2026-11-01',
          fecha_retiro: '2026-11-12',
          dias_arriendo_reales: 12,
          litros_diesel_faltantes: 20,
          valor_litro_diesel: 1350, // Editable (2.7.M: $27.000)
          cargos_danos: [
            { descripcion: 'Reposición baliza rota', monto: 45000, tiene_evidencia_fotografica: true }
          ]
        }
      ],
      costosSubcontratoIts: [
        { concepto: 'OC Transporte Externo Retiro', monto_costo: 75000 } // 2.5.M/2.6.M: figura en ITS, JAMÁS suma línea en EDP
      ]
    });

    // 12 * 65.000 (780.000) + Fletes (160.000) + Diésel (27.000) + Daño c/foto (45.000) = 1.012.000
    assert.equal(conc.totalDevengadoNeto, 1012000);

    const edp = motor.liquidarEstadoPago2Hitos({
      lineasConciliadas: conc.lineasConciliadas,
      consolidarTrasladosRental: true,
      hito1OperacionesAprobado: true,
      hito2ContabilidadAprobado: true
    });
    assert.equal(edp.montoNetoValidado, 1012000);
    const lineasTrasladoEdp = edp.lineasFacturables.filter(l => l.rol_nodo === 'TRASLADO');
    assert.equal(lineasTrasladoEdp.length, 1, 'En Rental EDP debe aparecer UNA sola línea consolidada de traslado (2.5.M / 2.6.M)');
    assert.equal(lineasTrasladoEdp[0].montoNetoFacturable, 160000);
  });

  it('[1.10.M] Accesorio (Balancín Valor Fijo Diario) hereda días de su grúa padre sin exigir report propio ni anular horas de grúa', () => {
    const conc = motor.conciliarDevengadoProyectoE2E(88, {
      lineasServicio: [
        { id_linea_servicio: 701, linea_negocio: 'IZAJE', rol_nodo: 'RAIZ', descripcion: 'Grúa 100T', unidad: 'Horas Diarias Minimas', cantidad_dias: 2, piso_minimo_horas: 8, valor_unitario: 200000 },
        { id_linea_servicio: 702, id_linea_servicio_padre: 701, linea_negocio: 'IZAJE', rol_nodo: 'ACCESORIO', descripcion: 'Balancín Separador 50T', unidad: 'Valor Fijo Diario', cantidad_dias: 2, valor_unitario: 80000 }
      ],
      reportesAvance: [
        { id_reporte_avance: 71, id_linea_servicio: 701, total_horas_facturables: 8 },
        { id_reporte_avance: 72, id_linea_servicio: 701, total_horas_facturables: 8 }
      ]
    });
    // Grúa: 16h * 200.000 = 3.200.000 + Balancín: 2d * 80.000 = 160.000 -> 3.360.000
    assert.equal(conc.totalDevengadoNeto, 3360000);
  });

  it('[ARQ-09 | Plaenge GSP-2611-00002 — 4.1 & 4.2] Solo Rigger sin máquina: Suma Alzada ($300k) vs Jornada Diaria (2d × $150k = $300k)', () => {
    const concFijo = motor.conciliarDevengadoProyectoE2E(31, {
      lineasServicio: [
        { id_linea_servicio: 801, linea_negocio: 'PROFESIONAL', rol_nodo: 'RAIZ', descripcion: 'Solo Rigger Suma Alzada', unidad: 'Valor Fijo', valor_unitario: 300000 }
      ],
      reportesAvance: [
        { id_reporte_avance: 81, id_linea_servicio: 801, total_horas_facturables: 0 },
        { id_reporte_avance: 82, id_linea_servicio: 801, total_horas_facturables: 0 }
      ]
    });
    assert.equal(concFijo.totalDevengadoNeto, 300000);

    const concDiario = motor.conciliarDevengadoProyectoE2E(310, {
      lineasServicio: [
        { id_linea_servicio: 802, linea_negocio: 'PROFESIONAL', rol_nodo: 'RAIZ', descripcion: 'Solo Rigger por Jornada', unidad: 'Valor Fijo Diario', cantidad_dias: 2, valor_unitario: 150000 }
      ],
      reportesAvance: [
        { id_reporte_avance: 83, id_linea_servicio: 802, total_horas_facturables: 8 },
        { id_reporte_avance: 84, id_linea_servicio: 802, total_horas_facturables: 8 }
      ]
    });
    assert.equal(concDiario.totalDevengadoNeto, 300000);
  });
});

// =============================================================================
// SUITE 4: REGLAS RRHH OPERADORES Y CHOFERES (tarifasOperadorService.js — SPEC-129)
// =============================================================================
describe('SUITE 4 — tarifasOperadorService.js: Reglas RRHH Urbano vs Rural (1.7.M) y Choferes $0 Bono (1.8.M / 3.1.M / Ac.#8)', () => {
  it('[BUG-07 | 1.7.M Urbano] En radio URBANO NO se consideran horas de traslado para pago de operador (0h traslado)', () => {
    // Sale de base 07:00, inicia obra 08:30, termina obra 17:30, vuelve a base 19:00, 60m colación -> 8.0h exactas
    const liq = tarifasRRHH.calcularLiquidacionHorasDia({
      hora_salida: '07:00',
      hora_llegada: '08:15',
      hora_inicio: '08:30',
      hora_termino: '17:30',
      hora_retorno: '19:00',
      colacion_minutos: 60,
      regimen: 'URBANO',
      horas_minimas: 8
    });
    assert.equal(liq.horas_flete_pagar, 0);
    assert.equal(liq.horas_totales_pagar, 8, 'En URBANO paga estrictamente obra (08:30 a 17:30 - 1h = 8h), excluyendo traslado 07:00-08:30 y 17:30-19:00');
  });

  it('[1.7.M Rural] En radio RURAL sí paga desde salida de base hasta regreso a base menos colación, respetando horas_minimas=0 en Valor Fijo', () => {
    const liqRural = tarifasRRHH.calcularLiquidacionHorasDia({
      hora_salida: '07:00',
      hora_llegada: '09:00',
      hora_inicio: '09:00',
      hora_termino: '17:00',
      hora_retorno: '19:00',
      colacion_minutos: 60,
      regimen: 'RURAL',
      horas_minimas: 8
    });
    assert.equal(liqRural.horas_totales_pagar, 11);

    // Servicio Rural a Valor Fijo (horas_minimas = 0): 4h obra + 2h traslado = 6h reales (sin inflar a 8h)
    const liqRuralFijo = tarifasRRHH.calcularLiquidacionHorasDia({
      hora_salida: '08:00',
      hora_llegada: '09:00',
      hora_inicio: '09:00',
      hora_termino: '13:00',
      hora_retorno: '14:00',
      colacion_minutos: 0,
      regimen: 'RURAL',
      horas_minimas: 0
    });
    assert.equal(liqRuralFijo.horas_totales_pagar, 6);
  });

  it('[BUG-07 | 1.8.M / 1.11.M / 3.1.M / Acuerdo #8] Choferes de Tracto, Cama Baja y Camioneta tienen $0 bono hora y $0 viático salvo excepción', () => {
    assert.equal(tarifasRRHH.resolverTarifaOperador('TRACTO CAMION', 0), 0, 'Tracto camión no devenga bono hora de grúa');
    assert.equal(tarifasRRHH.resolverTarifaOperador('CAMA BAJA', 0), 0, 'Cama baja no devenga bono hora de grúa');
    assert.equal(tarifasRRHH.resolverTarifaOperador('CAMIONETA', 0), 0, 'Camioneta de apoyo no devenga bono hora de grúa');

    assert.equal(typeof tarifasRRHH.calcularLiquidacionChoferTraslado, 'function', 'Debe exportar calcularLiquidacionChoferTraslado');

    const std = tarifasRRHH.calcularLiquidacionChoferTraslado({
      hora_salida: '07:00',
      hora_retorno: '18:00',
      colacion_minutos: 60,
      excepcion_autorizada: false
    });
    assert.equal(std.bono_hora, 0);
    assert.equal(std.monto_viatico, 0);

    const exc = tarifasRRHH.calcularLiquidacionChoferTraslado({
      hora_salida: '07:00',
      hora_retorno: '18:00',
      colacion_minutos: 60,
      excepcion_autorizada: true,
      tarifa_hora_excepcional: 3500
    });
    assert.equal(exc.bono_hora, 35000); // 10h * $3.500
    assert.equal(exc.monto_viatico, 9000); // 10h -> $7.000 + 2 * $1.000
  });
});

// =============================================================================
// SUITE 5: OLEADA 1B — CONEXIÓN DE CONTROLADORES Y ERRADICACIÓN BUG-03 / BUG-04
// =============================================================================
describe('5. Oleada 1B — Integridad Sintáctica y Clasificación Determinista en Controladores', () => {
  it('Sintaxis limpia (node --check) en los 4 controladores/modelos conectados en Oleada 1B', () => {
    const { execFileSync } = require('node:child_process');
    const path = require('node:path');
    const archivosOleada1B = [
      '../backend_remoto/src/models/proyectoModel.js',
      '../backend_remoto/src/controllers/itsController.js',
      '../backend_remoto/src/controllers/reportDiarioController.js',
      '../backend_remoto/src/controllers/estadoPagoController.js'
    ];
    for (const rel of archivosOleada1B) {
      const abs = path.resolve(__dirname, rel);
      execFileSync(process.execPath, ['--check', abs], { stdio: 'pipe' });
    }
  });

  it('[BUG-04] itsController.esJornadaTraslado reconoce TRASLADO IDA/VUELTA y excluye Registro de Viaje / Grúa / Adicional Fijo', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const srcIts = fs.readFileSync(path.resolve(__dirname, '../backend_remoto/src/controllers/itsController.js'), 'utf8');

    // Verificar que ya no quedan filtros asimétricos .toLowerCase().includes('flete') en getITS
    assert.equal(
      srcIts.includes("toLowerCase().includes('flete')"),
      false,
      'Quedó erradicado el filtro asimétrico .toLowerCase().includes("flete") en itsController.js'
    );

    // Extraer y evaluar las funciones puras esJornadaTraslado / esJornadaAdicionalFijo
    const matchFn = srcIts.match(/function esJornadaTraslado\(j\) \{[\s\S]*?\n\}\n\nfunction esJornadaAdicionalFijo\(j\) \{[\s\S]*?\n\}/);
    assert.ok(matchFn, 'Deben existir esJornadaTraslado y esJornadaAdicionalFijo en itsController.js');
    const { esJornadaTraslado, esJornadaAdicionalFijo } = new Function(`${matchFn[0]}; return { esJornadaTraslado, esJornadaAdicionalFijo };`)();

    assert.equal(esJornadaTraslado({ tipo_servicio: 'TRASLADO IDA/VUELTA', numero_report: 'TRASLADO' }), true);
    assert.equal(esJornadaTraslado({ tipo_servicio: 'Traslado Ida', numero_report: 'FLE-IDA' }), true);
    assert.equal(esJornadaTraslado({ tipo_servicio: 'Flete Solo Retorno', numero_report: 'REP-1' }), true);
    assert.equal(esJornadaTraslado({ tipo_servicio: 'Registro de Viaje', numero_report: 'VIAJE-1' }), false);
    assert.equal(esJornadaTraslado({ tipo_servicio: 'Hora', numero_report: 'REP-10-1' }), false);
    assert.equal(esJornadaTraslado({ tipo_servicio: 'Adicional Fijo', numero_report: 'ADICIONAL-FIJO' }), false);
    assert.equal(esJornadaAdicionalFijo({ tipo_servicio: 'Adicional Fijo', numero_report: 'ADICIONAL-FIJO' }), true);
  });

  it('[BUG-03] proyectoModel, reportDiarioController y estadoPagoController preservan es_valor_fijo=false en proyectos mixtos y consolidan flete Rental', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const srcPry = fs.readFileSync(path.resolve(__dirname, '../backend_remoto/src/models/proyectoModel.js'), 'utf8');
    const srcRep = fs.readFileSync(path.resolve(__dirname, '../backend_remoto/src/controllers/reportDiarioController.js'), 'utf8');
    const srcEdp = fs.readFileSync(path.resolve(__dirname, '../backend_remoto/src/controllers/estadoPagoController.js'), 'utf8');

    assert.ok(srcPry.includes('_sincronizarLineasServicioRelacional'), 'proyectoModel sincroniza tpry_linea_servicio');
    assert.ok(srcRep.includes('valorAdicionalesFijos'), 'reportDiarioController separa valorAdicionalesFijos de esValorFijoComercial');
    assert.ok(srcEdp.includes("concepto: 'Flete / Traslado'"), 'estadoPagoController consolida 1 sola línea Flete / Traslado en Rental');
  });
});

// =============================================================================
// SUITE 6: INVARIANTES DE FRONTEND CRM Y VISTAS PWA (SPEC-129 / SPEC-132)
// =============================================================================
describe('SUITE 6 — Invariantes de Frontend CRM (EstructuradorArbolServicios) y Vistas PWA (Terreno)', () => {
  it('[CRM Estructurador] UNIDADES_POR_CONTEXTO bloquea las 9 combinaciones descartadas (Semanal, Tarifa por Km, Piso Diario Profesional) y habilita Hora Efectiva en Profesional e Internas Valor Fijo', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const srcCrm = fs.readFileSync(path.resolve(__dirname, '../frontend/src/components/CRM/EstructuradorArbolServicios.vue'), 'utf8');

    // Extraer UNIDADES_POR_CONTEXTO
    const matchUnidades = srcCrm.match(/const UNIDADES_POR_CONTEXTO = (\{[\s\S]*?\n\})/);
    assert.ok(matchUnidades, 'Debe existir const UNIDADES_POR_CONTEXTO en EstructuradorArbolServicios.vue');
    const { UNIDADES_POR_CONTEXTO } = new Function(`return { UNIDADES_POR_CONTEXTO: ${matchUnidades[1]} };`)();

    // 1. IZAJE_PRIMARIO: no incluye 'Valor Fijo Semanal' ni 'Valor Fijo Mensual' ni 'Hora Efectiva'
    assert.ok(Array.isArray(UNIDADES_POR_CONTEXTO.IZAJE_PRIMARIO));
    assert.equal(UNIDADES_POR_CONTEXTO.IZAJE_PRIMARIO.includes('Valor Fijo Semanal'), false, 'IZAJE_PRIMARIO no debe incluir Valor Fijo Semanal');
    assert.equal(UNIDADES_POR_CONTEXTO.IZAJE_PRIMARIO.includes('Valor Fijo Mensual'), false, 'IZAJE_PRIMARIO no debe incluir Valor Fijo Mensual');
    assert.equal(UNIDADES_POR_CONTEXTO.IZAJE_PRIMARIO.includes('Hora Efectiva'), false, 'IZAJE_PRIMARIO no debe incluir Hora Efectiva');

    // 2. PROFESIONAL_PRIMARIO (4.1, 4.2, 4.4, 4.6): bloquea 'Valor Fijo Semanal' (4.5) y 'Horas Diarias Minimas' (4.3), habilita 'Hora Efectiva' (4.4)
    assert.ok(Array.isArray(UNIDADES_POR_CONTEXTO.PROFESIONAL_PRIMARIO));
    assert.equal(UNIDADES_POR_CONTEXTO.PROFESIONAL_PRIMARIO.includes('Valor Fijo Semanal'), false, 'PROFESIONAL_PRIMARIO no debe incluir Valor Fijo Semanal (4.5)');
    assert.equal(UNIDADES_POR_CONTEXTO.PROFESIONAL_PRIMARIO.includes('Horas Diarias Minimas'), false, 'PROFESIONAL_PRIMARIO no debe incluir Horas Diarias Minimas (4.3)');
    assert.equal(UNIDADES_POR_CONTEXTO.PROFESIONAL_PRIMARIO.includes('Hora Efectiva'), true, 'PROFESIONAL_PRIMARIO debe incluir Hora Efectiva (4.4)');

    // 3. TRANSPORTE_PRIMARIO (3.1.M, 3.3): bloquea 'Tarifa por Km' (3.2 descartado)
    assert.ok(Array.isArray(UNIDADES_POR_CONTEXTO.TRANSPORTE_PRIMARIO));
    assert.equal(UNIDADES_POR_CONTEXTO.TRANSPORTE_PRIMARIO.includes('Tarifa por Km'), false, 'TRANSPORTE_PRIMARIO no debe incluir Tarifa por Km (3.2 descartado)');

    // 4. INTERNAS_PRIMARIO: exactamente ['Valor Fijo']
    assert.deepEqual(UNIDADES_POR_CONTEXTO.INTERNAS_PRIMARIO, ['Valor Fijo'], 'INTERNAS_PRIMARIO debe ser únicamente [Valor Fijo]');
  });

  it('[CRM Recetas Flete] FLETE_IDA y FLETE_VUELTA nacen con valor_unitario: 0 por defecto', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const srcCrm = fs.readFileSync(path.resolve(__dirname, '../frontend/src/components/CRM/EstructuradorArbolServicios.vue'), 'utf8');

    assert.ok(srcCrm.includes('FLETE_IDA: {'), 'Debe existir receta FLETE_IDA');
    assert.ok(srcCrm.includes('FLETE_VUELTA: {'), 'Debe existir receta FLETE_VUELTA');

    assert.ok(/FLETE_IDA:\s*\{[\s\S]*?valor_unitario:\s*0/.test(srcCrm), 'FLETE_IDA debe tener valor_unitario: 0');
    assert.ok(/FLETE_VUELTA:\s*\{[\s\S]*?valor_unitario:\s*0/.test(srcCrm), 'FLETE_VUELTA debe tener valor_unitario: 0');
  });

  it('[PWA ReportDiarioIzaje.vue] Soporta Contingencia sin Firma Cliente (REQ-1146 / Ac.#7), Solo-Staff y Bloqueo Rigger en Izaje', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const srcReport = fs.readFileSync(path.resolve(__dirname, '../pwa/src/views/ReportDiarioIzaje.vue'), 'utf8');

    // Contingencia sin firma
    assert.ok(srcReport.includes('contingenciaSinFirma'), 'Debe contener reactivo contingenciaSinFirma');
    assert.ok(srcReport.includes('motivoSinFirmaCliente'), 'Debe contener reactivo motivoSinFirmaCliente');
    assert.ok(srcReport.includes('contingencia_sin_firma'), 'Debe enviar contingencia_sin_firma en payload');
    assert.ok(srcReport.includes('motivo_sin_firma_cliente'), 'Debe enviar motivo_sin_firma_cliente en payload');

    // Solo-Staff
    assert.ok(srcReport.includes('esLineaProfesional'), 'Debe detectar línea profesional');
    assert.ok(srcReport.includes('SOLO PERSONAL STAFF'), 'Debe presentar card para servicios solo staff');

    // Bloqueo Rigger en Izaje
    assert.ok(srcReport.includes('esRiggerExclusivoEnIzaje'), 'Debe detectar y bloquear Rigger exclusivo en Izaje');
  });

  it('[PWA ViajeConductor.vue] Soporta Carga de Combustible con litros, hora_carga y valor_total (Acuerdo #1)', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const srcViaje = fs.readFileSync(path.resolve(__dirname, '../pwa/src/views/ViajeConductor.vue'), 'utf8');

    assert.ok(srcViaje.includes('mostrarCargaCombustible'), 'Debe contener flag mostrarCargaCombustible');
    assert.ok(srcViaje.includes('formCargaCombustibleHito'), 'Debe contener formulario formCargaCombustibleHito');
    assert.ok(srcViaje.includes('litros'), 'Debe contener campo litros');
    assert.ok(srcViaje.includes('hora_carga'), 'Debe contener campo hora_carga');
    assert.ok(srcViaje.includes('valor_total'), 'Debe contener campo valor_total');
    assert.ok(srcViaje.includes('carga_combustible'), 'Debe inyectar carga_combustible en payload de hitos');
    assert.ok(srcViaje.includes('validarCargaCombustibleHito'), 'Debe contener función de validación cronológica');
  });
});
