const fs = require('fs');
const filePath = 'ejecucion/backend_remoto/src/controllers/reportDiarioController.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Colacion fallback in construirLiquidacionPersonalDiaReport (lines ~184)
const targetCol = `  const colacionHoras = valAj.horas_colacion !== undefined && valAj.horas_colacion !== null
    ? Number(valAj.horas_colacion)
    : Number(rep.horas_colacion !== undefined && rep.horas_colacion !== null ? rep.horas_colacion : 1.0);`;

const replaceCol = `  // RESOLUCIÓN DE FONDO (CERO PARCHES): Preservar estrictamente 0 colación si fue definido así
  const colacionHoras = (valAj.horas_colacion !== undefined && valAj.horas_colacion !== null && !isNaN(Number(valAj.horas_colacion)))
    ? Number(valAj.horas_colacion)
    : (rep.horas_colacion !== undefined && rep.horas_colacion !== null && !isNaN(Number(rep.horas_colacion))
        ? Number(rep.horas_colacion)
        : 0.0);`;

if (!content.includes(targetCol)) {
  console.error('Target 1 (colacion) not found!');
  process.exit(1);
}
content = content.replace(targetCol, replaceCol);

// 2. Rigger fallback in construirLiquidacionPersonalDiaReport (lines ~220)
const targetRig = `  const prevLiq = rep.ajustes_analista?.liquidacion_personal_dia || null;
  const tieneRigger = Boolean(valAj.id_user_rigger || rep.id_user_rigger || rep.rigger_nombre);

  const tarifaSugerida = Number(infoTarifa.valor_hora || 5000);
  const horasFaenaSugeridas = Number(liqCalc.horas_faena_pagar || 0);
  const horasFleteSugeridas = Number(liqCalc.horas_flete_pagar || 0);
  const horasTotalesSugeridas = Number(liqCalc.horas_totales_pagar || 0);
  const viaticoSugerido = Number(viatCalc.monto_viatico || 0);

  const horasFaenaPagar = prevLiq?.horas_faena_pagar !== undefined ? Number(prevLiq.horas_faena_pagar) : horasFaenaSugeridas;
  const horasFletePagar = prevLiq?.horas_flete_pagar !== undefined ? Number(prevLiq.horas_flete_pagar) : horasFleteSugeridas;
  const horasTotalesPagar = prevLiq?.horas_totales_pagar !== undefined
    ? Number(prevLiq.horas_totales_pagar)
    : Number((horasFaenaPagar + horasFletePagar).toFixed(2));
  const precioUnitario = prevLiq?.precio_unitario !== undefined ? Number(prevLiq.precio_unitario) : tarifaSugerida;
  const montoTotalHoraOperador = Math.round(horasTotalesPagar * precioUnitario);

  const montoViaticoOperador = prevLiq?.monto_viatico_operador !== undefined
    ? Number(prevLiq.monto_viatico_operador)
    : viaticoSugerido;
  const horasTotalesRigger = tieneRigger
    ? (prevLiq?.horas_totales_rigger !== undefined ? Number(prevLiq.horas_totales_rigger) : horasTotalesPagar)
    : 0;
  const montoViaticoRigger = tieneRigger
    ? (prevLiq?.monto_viatico_rigger !== undefined ? Number(prevLiq.monto_viatico_rigger) : viaticoSugerido)
    : 0;`;

const replaceRig = `  const prevLiq = rep.ajustes_analista?.liquidacion_personal_dia || null;

  // RESOLUCIÓN DE FONDO (REQ-1128 / SPEC-117): Fallback resiliente a tripulación asignada de la OT si id_user_rigger es nulo
  let riggerId = valAj.id_user_rigger || rep.id_user_rigger || null;
  let riggerNom = rep.rigger_nombre || valAj.rigger_nombre || null;

  if (!riggerId && !riggerNom) {
    const tripulacion = Array.isArray(ejecV1.tripulacion_asignada) ? ejecV1.tripulacion_asignada : [];
    const riggerTrip = tripulacion.find(m => {
      const cargo = String(m.cargo || m.rol || '').toUpperCase();
      const req = String(m.requerimiento || '').toUpperCase();
      const isRigger = cargo.includes('RIGGER') || cargo.includes('RER') || req.includes('RIGGER') || req.includes('RER');
      if (!isRigger) return false;
      if (rep.id_equipo && m.equipo_asignado_id && Number(m.equipo_asignado_id) !== Number(rep.id_equipo)) {
        return false;
      }
      return true;
    });
    if (riggerTrip) {
      riggerId = riggerTrip.id_user || null;
      riggerNom = riggerTrip.nombre || riggerTrip.usuario || 'ALFONSO MALDONADO';
    }
  }

  const tieneRigger = Boolean(riggerId || riggerNom);

  const tarifaSugerida = Number(infoTarifa.valor_hora || 5000);
  const horasFaenaSugeridas = Number(liqCalc.horas_faena_pagar || 0);
  const horasFleteSugeridas = Number(liqCalc.horas_flete_pagar || 0);
  const horasTotalesSugeridas = Number(liqCalc.horas_totales_pagar || 0);
  const viaticoSugerido = Number(viatCalc.monto_viatico || 0);

  const horasFaenaPagar = prevLiq?.horas_faena_pagar !== undefined ? Number(prevLiq.horas_faena_pagar) : horasFaenaSugeridas;
  const horasFletePagar = prevLiq?.horas_flete_pagar !== undefined ? Number(prevLiq.horas_flete_pagar) : horasFleteSugeridas;
  const horasTotalesPagar = prevLiq?.horas_totales_pagar !== undefined
    ? Number(prevLiq.horas_totales_pagar)
    : Number((horasFaenaPagar + horasFletePagar).toFixed(2));
  const precioUnitario = prevLiq?.precio_unitario !== undefined ? Number(prevLiq.precio_unitario) : tarifaSugerida;
  const montoTotalHoraOperador = Math.round(horasTotalesPagar * precioUnitario);

  const montoViaticoOperador = prevLiq?.monto_viatico_operador !== undefined
    ? Number(prevLiq.monto_viatico_operador)
    : viaticoSugerido;
  const horasTotalesRigger = tieneRigger
    ? (prevLiq?.horas_totales_rigger !== undefined ? Number(prevLiq.horas_totales_rigger) : horasTotalesPagar)
    : 0;
  const viaticoRiggerModificado = Boolean(prevLiq?.viatico_rigger_modificado);
  const montoViaticoRigger = tieneRigger
    ? (viaticoRiggerModificado && prevLiq?.monto_viatico_rigger !== undefined
        ? Number(prevLiq.monto_viatico_rigger)
        : viaticoSugerido)
    : 0;`;

if (!content.includes(targetRig)) {
  console.error('Target 2 (rigger) not found!');
  process.exit(1);
}
content = content.replace(targetRig, replaceRig);

// 3. Return object in construirLiquidacionPersonalDiaReport (lines ~290)
const targetRet = `    // Aplicados / Validados para Rigger
    tiene_rigger: tieneRigger,
    horas_totales_rigger: horasTotalesRigger,
    monto_viatico_rigger: montoViaticoRigger,`;

const replaceRet = `    // Aplicados / Validados para Rigger
    tiene_rigger: tieneRigger,
    id_user_rigger: riggerId ? (isNaN(Number(riggerId)) ? riggerId : Number(riggerId)) : null,
    rigger_nombre: riggerNom,
    horas_totales_rigger: horasTotalesRigger,
    monto_viatico_rigger: montoViaticoRigger,
    monto_viatico_sugerido_rigger: tieneRigger ? viaticoSugerido : 0,
    viatico_rigger_modificado: viaticoRiggerModificado,`;

if (!content.includes(targetRet)) {
  console.error('Target 3 (return) not found!');
  process.exit(1);
}
content = content.replace(targetRet, replaceRet);

// 4. colHrs in line 1835
const targetColHrs = `const colHrs = Number(horas_colacion !== undefined && horas_colacion !== null ? horas_colacion : 1.0);`;
const replaceColHrs = `const colHrs = (horas_colacion !== undefined && horas_colacion !== null && !isNaN(Number(horas_colacion)))
            ? Number(horas_colacion)
            : 0.0;`;
if (!content.includes(targetColHrs)) {
  console.error('Target 4 (colHrs) not found!');
  process.exit(1);
}
content = content.replace(targetColHrs, replaceColHrs);

// 5. Line 1931 & Line 2025 (horas_colacion in inserts)
const targetInsertCol = `horas_colacion !== undefined && horas_colacion !== null ? horas_colacion : 1,`;
if (!content.includes(targetInsertCol)) {
  console.error('Target 5 (insert col) not found!');
  process.exit(1);
}
content = content.replaceAll(targetInsertCol, `(horas_colacion !== undefined && horas_colacion !== null && !isNaN(Number(horas_colacion))) ? Number(horas_colacion) : 0,`);

// 6. Line 2283 (nuevoHorasColacion)
const targetNuevoCol = `let nuevoHorasColacion = parseFloat(rep.horas_colacion !== undefined && rep.horas_colacion !== null ? rep.horas_colacion : 1.0);`;
const replaceNuevoCol = `let nuevoHorasColacion = (rep.horas_colacion !== undefined && rep.horas_colacion !== null && !isNaN(parseFloat(rep.horas_colacion)))
        ? parseFloat(rep.horas_colacion)
        : 0.0;`;
if (!content.includes(targetNuevoCol)) {
  console.error('Target 6 (nuevoHorasColacion) not found!');
  process.exit(1);
}
content = content.replace(targetNuevoCol, replaceNuevoCol);

// 7. Line 3489 (colac)
const targetColac = `const colac = tieneTerminoReal ? parseFloat(horas_colacion !== undefined ? horas_colacion : 1.0) : 0;`;
const replaceColac = `const colac = tieneTerminoReal
        ? ((horas_colacion !== undefined && horas_colacion !== null && !isNaN(parseFloat(horas_colacion)))
            ? parseFloat(horas_colacion)
            : 0.0)
        : 0;`;
if (!content.includes(targetColac)) {
  console.error('Target 7 (colac) not found!');
  process.exit(1);
}
content = content.replace(targetColac, replaceColac);

fs.writeFileSync(filePath, content, 'utf8');
console.log('SUCCESS: reportDiarioController.js updated cleanly!');
