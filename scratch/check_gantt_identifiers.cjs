const fs = require('fs');

const content = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8');

const identifiers = [
  'kpisGantt',
  'ocultarSinMovimientoGantt',
  'formatMoneda',
  'rangoDiasGantt',
  'modoRangoCustomGantt',
  'seleccionarVentanaDiasGantt',
  'fechaDesdeGantt',
  'fechaHastaGantt',
  'onChangeFechasCustomGantt',
  'onCambioFechaCustomGantt',
  'toggleTodasCategoriasGantt',
  'todasCategoriasAbiertasGantt',
  'cargandoProyectos',
  'filtroCategoriaGantt',
  'busquedaGantt',
  'diasGantt',
  'gruposCategoriaGantt',
  'toggleCategoriaGantt',
  'esCategoriaAbiertaGantt',
  'getProductividadColor',
  'getProductividadBarClass',
  'getEventoEquipoEnDia',
  'onClicEventoGantt'
];

identifiers.forEach(id => {
  const inScript = content.lastIndexOf(id) > content.indexOf('<script');
  console.log(`${id}: in script? ${inScript}`);
});
