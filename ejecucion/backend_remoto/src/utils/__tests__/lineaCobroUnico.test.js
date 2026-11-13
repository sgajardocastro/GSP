const { isLineaCobroUnico, normalizarLineaCobroUnico, calcularSubtotalLinea } = require('../utils/lineaCobroUnico');

describe('lineaCobroUnico', () => {
  test('detecta valor fijo y traslados', () => {
    expect(isLineaCobroUnico({ unidad: 'Valor Fijo' })).toBe(true);
    expect(isLineaCobroUnico({ tipo: 'TRASLADOS' })).toBe(true);
    expect(isLineaCobroUnico({ unidad: 'TRASLADO IDA/VUELTA' })).toBe(true);
    expect(isLineaCobroUnico({ unidad: 'Horas Diarias Minimas' })).toBe(false);
  });

  test('normaliza forzando cantidad 1 y subtotal igual a valor unitario', () => {
    const l1 = normalizarLineaCobroUnico({ tipo: 'OTROS', unidad: 'Valor Fijo', cantidad: 2, valorUnitario: 300000 });
    expect(l1.cantidad).toBe(1);
    expect(l1.subtotal_calculado).toBe(300000);

    const l2 = normalizarLineaCobroUnico({ tipo: 'TRASLADOS', unidad: 'TRASLADO IDA/VUELTA', cantidad: 6, valorUnitario: 160000 });
    expect(l2.cantidad).toBe(1);
    expect(l2.subtotal_calculado).toBe(160000);
  });

  test('calcula subtotal ignorando cantidad en cobro unico', () => {
    const sub = calcularSubtotalLinea({ tipo: 'OTROS', unidad: 'Valor Fijo', cantidad: 5, valorUnitario: 300000 });
    expect(sub).toBe(300000);
  });
});
