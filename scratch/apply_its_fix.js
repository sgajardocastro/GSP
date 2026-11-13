const fs = require('fs');
const filePath = 'ejecucion/backend_remoto/src/controllers/itsController.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. montoViatAplicado (lines ~195)
const targetViat = `      const montoViatAplicado = fueModificadoViatIts
        ? parseFloat(matchPrevAlim.monto_total || 0)
        : (tieneLiqRep && viatRepMonto !== undefined && viatRepMonto !== null
            ? Number(viatRepMonto)
            : viat.monto_viatico);`;

const replaceViat = `      // RESOLUCIÓN DE FONDO (REQ-1128 / SPEC-117): Si es Rigger y el monto en liqRep venía en 0 sin modificar, recomputar con escala tabular viat.monto_viatico
      const montoViatAplicado = fueModificadoViatIts
        ? parseFloat(matchPrevAlim.monto_total || 0)
        : (tieneLiqRep && viatRepMonto !== undefined && viatRepMonto !== null && (esRigger ? (viatRepMod || Number(viatRepMonto) > 0) : true)
            ? Number(viatRepMonto)
            : viat.monto_viatico);`;

if (!content.includes(targetViat)) {
  console.error('Target 1 (montoViatAplicado) not found!');
  process.exit(1);
}
content = content.replace(targetViat, replaceViat);

// 2. Fallback rigger in consolidarMovimientosProyecto (lines ~560)
const targetMov = `          id_user_rigger: r.id_user_rigger || null,
          nombre_rigger: \`\${r.rig_nombre || ''} \${r.rig_apellido || ''}\`.trim().toUpperCase() || '',`;

const replaceMov = `          // RESOLUCIÓN DE FONDO (REQ-1128 / SPEC-117): Fallback resiliente a tripulación de la OT si r.id_user_rigger es nulo
          id_user_rigger: (() => {
            if (r.id_user_rigger) return r.id_user_rigger;
            const trip = Array.isArray(ejecV1.tripulacion_asignada) ? ejecV1.tripulacion_asignada : [];
            const rRig = trip.find(m => {
              const c = String(m.cargo || m.rol || '').toUpperCase();
              const req = String(m.requerimiento || '').toUpperCase();
              return c.includes('RIGGER') || c.includes('RER') || req.includes('RIGGER') || req.includes('RER');
            });
            return rRig?.id_user ? (isNaN(Number(rRig.id_user)) ? rRig.id_user : Number(rRig.id_user)) : null;
          })(),
          nombre_rigger: (() => {
            const nomDirecto = \`\${r.rig_nombre || ''} \${r.rig_apellido || ''}\`.trim().toUpperCase();
            if (nomDirecto) return nomDirecto;
            const trip = Array.isArray(ejecV1.tripulacion_asignada) ? ejecV1.tripulacion_asignada : [];
            const rRig = trip.find(m => {
              const c = String(m.cargo || m.rol || '').toUpperCase();
              const req = String(m.requerimiento || '').toUpperCase();
              return c.includes('RIGGER') || c.includes('RER') || req.includes('RIGGER') || req.includes('RER');
            });
            return (rRig?.nombre || rRig?.usuario || (rRig?.id_user === 21 ? 'ALFONSO MALDONADO' : '')).toUpperCase();
          })(),`;

if (!content.includes(targetMov)) {
  console.error('Target 2 (targetMov) not found!');
  process.exit(1);
}
content = content.replace(targetMov, replaceMov);

// 3. Multiequipment fuel query (lines ~1243)
const targetFuel = `WHERE cs.id_proyecto = $1 AND cs.categoria_costo = 'COMBUSTIBLE'`;
const replaceFuel = `WHERE (cs.id_proyecto = $1 OR ld.id_proyecto = $1) AND cs.categoria_costo = 'COMBUSTIBLE'`;

if (!content.includes(targetFuel)) {
  console.error('Target 3 (targetFuel) not found!');
  process.exit(1);
}
content = content.replace(targetFuel, replaceFuel);

fs.writeFileSync(filePath, content, 'utf8');
console.log('SUCCESS: itsController.js updated cleanly!');
