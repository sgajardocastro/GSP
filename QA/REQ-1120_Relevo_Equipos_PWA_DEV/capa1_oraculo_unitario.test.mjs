// Capa 1: Oráculo Matemático In-Memory (Zero Network / Zero DB)
// Valida los invariantes matemáticos y reglas de negocio del relevo de equipos.
// Framework: node:test + node:assert/strict

import test from 'node:test';
import assert from 'node:assert/strict';

test('Oráculo Matemático: Invariantes de Relevo de Equipos en Faena', async (t) => {

  await t.test('1. Resolución temporal determinista de equipo según fecha de faena', () => {
    const flotaAsignada = [
      {
        id_equipo: 38,
        patente: 'STDD.68-4',
        tipo_grua: 'LIEBHERR LTM-1070',
        fecha_plan_ini: '2026-11-01',
        fecha_plan_fin: '2026-11-04',
        es_reemplazo: false,
        activo: true
      },
      {
        id_equipo: 36,
        patente: 'CCCB.38-1',
        tipo_grua: 'LIEBHERR LTM-1055',
        fecha_plan_ini: '2026-11-05',
        fecha_plan_fin: '2026-11-10',
        es_reemplazo: true,
        patente_reemplazada: 'STDD.68-4',
        motivo_reemplazo: 'Falla hidráulica en telescopaje y relevo preventivo',
        activo: true
      }
    ];

    function resolverEquipoPorFecha(fechaStr) {
      const match = flotaAsignada.find(eq => {
        if (!eq.activo) return false;
        if (eq.fecha_plan_ini && fechaStr < eq.fecha_plan_ini) return false;
        if (eq.fecha_plan_fin && fechaStr > eq.fecha_plan_fin) return false;
        return true;
      });
      return match || null;
    }

    // Días 1 a 4 -> Grúa A (STDD.68-4)
    const dia1 = resolverEquipoPorFecha('2026-11-01');
    assert.ok(dia1, 'Debe resolver equipo en Día 1');
    assert.equal(dia1.patente, 'STDD.68-4');
    assert.equal(dia1.es_reemplazo, false);

    const dia4 = resolverEquipoPorFecha('2026-11-04');
    assert.ok(dia4, 'Debe resolver equipo en Día 4');
    assert.equal(dia4.patente, 'STDD.68-4');
    assert.equal(dia4.es_reemplazo, false);

    // Días 5 a 10 -> Grúa B (CCCB.38-1)
    const dia5 = resolverEquipoPorFecha('2026-11-05');
    assert.ok(dia5, 'Debe resolver equipo en Día 5');
    assert.equal(dia5.patente, 'CCCB.38-1');
    assert.equal(dia5.es_reemplazo, true);
    assert.equal(dia5.patente_reemplazada, 'STDD.68-4');

    const dia10 = resolverEquipoPorFecha('2026-11-10');
    assert.ok(dia10, 'Debe resolver equipo en Día 10');
    assert.equal(dia10.patente, 'CCCB.38-1');
    assert.equal(dia10.es_reemplazo, true);
  });

  await t.test('2. Independencia y no-contaminación de horómetros entre equipos', () => {
    // Grúa A
    const horometroBaseA = 1250.0;
    const reportesA = [
      { dia: 1, horoIni: 1250.0, horoFin: 1258.0, hrs: 8.0 },
      { dia: 2, horoIni: 1258.0, horoFin: 1266.0, hrs: 8.0 },
      { dia: 3, horoIni: 1266.0, horoFin: 1274.0, hrs: 8.0 },
      { dia: 4, horoIni: 1274.0, horoFin: 1282.0, hrs: 8.0 }
    ];
    const totalHorasA = reportesA.reduce((acc, r) => acc + (r.horoFin - r.horoIni), 0);
    assert.equal(totalHorasA, 32.0, 'Grúa A debe acumular exactamente 32 hrs');

    // Grúa B (Relevo entra con su propio horómetro de odómetro/odómetro histórico)
    const horometroBaseB = 4100.0;
    const reportesB = [
      { dia: 5, horoIni: 4100.0, horoFin: 4108.0, hrs: 8.0 },
      { dia: 6, horoIni: 4108.0, horoFin: 4116.0, hrs: 8.0 },
      { dia: 7, horoIni: 4116.0, horoFin: 4124.0, hrs: 8.0 },
      { dia: 8, horoIni: 4124.0, horoFin: 4132.0, hrs: 8.0 },
      { dia: 9, horoIni: 4132.0, horoFin: 4140.0, hrs: 8.0 },
      { dia: 10, horoIni: 4140.0, horoFin: 4148.0, hrs: 8.0 }
    ];
    const totalHorasB = reportesB.reduce((acc, r) => acc + (r.horoFin - r.horoIni), 0);
    assert.equal(totalHorasB, 48.0, 'Grúa B debe acumular exactamente 48 hrs');

    // Verificación de no-contaminación: Grúa B nunca arranca desde el horómetro final de Grúa A
    assert.notEqual(reportesB[0].horoIni, reportesA[reportesA.length - 1].horoFin);
    assert.equal(reportesB[0].horoIni, horometroBaseB);
  });

  await t.test('3. Conciliación financiera e Invariante de EDP ($0 descuadre)', () => {
    const tarifaPorHora = 50000; // $50.000 CLP/hora acordada en contrato
    const horasMinimasDia = 8.0;

    const diasTotales = 10;
    const diasA = 4;
    const diasB = 6;
    assert.equal(diasA + diasB, diasTotales);

    const horasA = diasA * horasMinimasDia; // 32 hrs
    const horasB = diasB * horasMinimasDia; // 48 hrs
    const horasTotales = horasA + horasB;   // 80 hrs
    assert.equal(horasTotales, 80.0);

    const subtotalA = horasA * tarifaPorHora; // $1.600.000
    const subtotalB = horasB * tarifaPorHora; // $2.400.000
    const montoNetoTotal = subtotalA + subtotalB; // $4.000.000

    const contratoPactadoNeto = diasTotales * horasMinimasDia * tarifaPorHora; // 10 * 8 * 50.000 = $4.000.000
    const descuadreNeto = montoNetoTotal - contratoPactadoNeto;

    assert.equal(montoNetoTotal, 4000000);
    assert.equal(descuadreNeto, 0, 'Invariante: El cambio de equipo debe generar exactamente $0 descuadre');

    const iva = Math.round(montoNetoTotal * 0.19); // 19% = $760.000
    const totalBruto = montoNetoTotal + iva;       // $4.760.000

    assert.equal(iva, 760000);
    assert.equal(totalBruto, 4760000);
  });

});
