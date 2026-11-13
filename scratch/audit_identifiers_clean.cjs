const fs = require('fs');
const path = require('path');
const vuePath = path.resolve('ejecucion/frontend/node_modules/@vue/compiler-sfc');
const { parse, compileScript } = require(vuePath);

const source = fs.readFileSync('scratch/Torre_final_assembled.vue', 'utf8');
const { descriptor } = parse(source);
const script = compileScript(descriptor, { id: 'Torre' });

const bindings = new Set(Object.keys(script.bindings || {}));
console.log('Total bindings:', bindings.size);

// Standard globals and Vue built-ins
const globals = new Set([
  'true', 'false', 'null', 'undefined', 'NaN', 'Infinity',
  'Number', 'String', 'Boolean', 'Array', 'Object', 'Date', 'Math', 'JSON', 'Set', 'Map',
  'console', 'window', 'document', 'event', 'arguments',
  '$event', '$emit', '$route', '$router', '$refs', '$slots', '$attrs'
]);

// Check specific identifiers used in Kanban and Cardex
const checkList = [
  'activeView', 'tipoFechaKanbanPro', 'presetFechaKanbanPro', 'fechaDesdeKanbanPro',
  'fechaHastaKanbanPro', 'fechaPuntualKardex', 'densidadKanbanPro', 'fechasDisponiblesKardex',
  'seleccionarFechaPuntualKardex', 'seleccionarPresetFechaPro', 'filtroOperadorKanbanPro',
  'opcionesOperadoresKanban', 'filtroRiggerKanbanPro', 'opcionesRiggersKanban',
  'filtroEquipoKanbanPro', 'opcionesEquiposKanban', 'filtroClienteKanbanPro',
  'opcionesClientesKanban', 'filtroVendedorKanbanPro', 'opcionesVendedoresKanban',
  'tieneFiltrosActivosKanbanPro', 'limpiarFiltrosKanbanPro', 'columnasKanbanPro',
  'estadisticasPreventa', 'abrirModalOperativo', 'esProyectoInterno', 'getFichaOperativa',
  'getPorcentajeAcreditacion', 'getAcreditacionColorClass', 'formatMonto', 'getNombreVendedor',
  'totalLevantadasKardex', 'totalProyectosTablero', 'kardexSoloLevantadas', 'kardexLevantarTodas',
  'tieneCriterioActivoKardex', 'columnasKardex3D', 'hoveredKardexId', 'toggleTarjetaKardexManual',
  'esTarjetaLevantadaKardex', 'esTarjetaCoincidenteCriterio', 'kardexPinesManuales',
  // Gantt identifiers
  'kpisGantt', 'ocultarSinMovimientoGantt', 'rangoDiasGantt', 'modoRangoCustomGantt',
  'seleccionarVentanaDiasGantt', 'fechaDesdeGantt', 'fechaHastaGantt', 'onChangeFechasCustomGantt',
  'gruposCategoriaGantt', 'colapsarTodasCategoriasGantt', 'expandirTodasCategoriasGantt',
  'toggleCategoriaGantt', 'isCategoriaExpandidaGantt', 'diasGantt', 'formatIsoToDdMmYyyy',
  'resolverUltimoMantenimientoEquipo', 'calcularDevengadoEquipoRango', 'getProductividadColor',
  'getProductividadBarClass', 'getEventoEquipoEnDia', 'onClicEventoGantt', 'formatMoneda'
];

let missing = 0;
checkList.forEach(id => {
  if (!bindings.has(id)) {
    console.error('MISSING BINDING:', id);
    missing++;
  }
});

if (missing === 0) {
  console.log('ALL 50+ KEY IDENTIFIERS ARE PRESENT AND BOUND IN SCRIPT SETUP!');
} else {
  console.error(`ERROR: ${missing} missing bindings!`);
  process.exit(1);
}
