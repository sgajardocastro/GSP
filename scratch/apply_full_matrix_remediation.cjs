const fs = require('fs');

const htmlPath = 'C:\\Users\\sgaja\\.gemini\\antigravity\\brain\\898c9102-cf11-4924-9817-7fc5b04e6408\\matriz_reglas_negocio_cliente_gsp.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. REEMPLAZAR ESTILOS DE ANCHO DE PANTALLA
// De max-width: 1620px a 100% width sin márgenes laterales desperdiciados
html = html.replace(
  '.wrap{max-width:1620px;margin:0 auto;padding:12px}',
  '.wrap{width:100%!important;max-width:100%!important;margin:0!important;padding:8px 14px!important}'
);

// Añadir estilos para pantalla completa, resaltado de cambios en reglas y controles
const extraStyles = `
/* PANTALLA COMPLETA 100% */
html, body { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; overflow-x: auto; }
.card { width: 100% !important; max-width: 100% !important; padding: 12px 14px !important; }
.top { width: 100% !important; max-width: 100% !important; border-radius: 8px !important; margin-bottom: 8px !important; }
.hero { width: 100% !important; max-width: 100% !important; border-radius: 8px !important; padding: 10px 14px !important; }
table { width: 100% !important; min-width: 100% !important; border-collapse: collapse !important; table-layout: auto !important; }
th, td { padding: 6px 8px !important; font-size: 12px !important; line-height: 1.35 !important; }

/* RESALTADO DE REGLAS AJUSTADAS POR JORGE Y ALFONSO */
.change-pill { display: inline-block; background: #fee2e2; color: #b91c1c; font-weight: 800; font-size: 9.5px; padding: 1px 5px; border-radius: 4px; margin-bottom: 3px; border: 1px solid #f87171; letter-spacing: 0.02em; }
.rule-mod-text { color: #991b1b; font-weight: 600; background: #fff5f5; border-left: 3px solid #ef4444; padding: 3px 6px; border-radius: 0 4px 4px 0; margin-top: 3px; }
.rule-ok-text { color: #1e293b; }
.toggle-btn-bar { display: inline-flex; align-items: center; gap: 8px; background: #0f172a; padding: 4px 10px; border-radius: 8px; color: #fff; font-size: 12px; font-weight: 700; cursor: pointer; border: 1px solid #334155; }
.toggle-btn-bar:hover { border-color: #f59e0b; }
`;

html = html.replace('/* BADGES */', extraStyles + '\n/* BADGES */');

// 2. RECONSTRUIR EL ARRAY CASES_31 CON LAS REGLAS INSERTADAS EXACTAMENTE DONDE CORRESPONDE
const updatedCasesCode = `var CASES_31 = [
  /* LÍNEA 1: IZAJE */
  {
    id: "1.1",
    displayId: "1.1.M",
    status: "MODIFICADO",
    l: "IZAJE",
    n: "Grúa Telescópica / Pluma / Horquilla / Manipulador",
    rol: "RAÍZ",
    u: "Horas a Disposición (Piso Horario Flexible)",
    cant: "Días × Horas Acordadas",
    cot: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'><b>Horas a disposición:</b> Días × Horas Acordadas × $/Hora (el piso horario es flexible y se acuerda por equipo en faena; no limitado a 8h o 9h rígidas). Define Urbano (&lt;=30km) o Rural (&gt;30km).</div>",
    ot: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'>Sección 1: Equipo + Operador. Exige Viaje + Report Diario que valida contra el piso de horas pactado para el equipo en faena.</div>",
    its: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'>Fila OPERACION por jornada: liquida <code>max(hrs_reales, piso_acordado) × $/Hora</code> (sin duplicar cobros 2.5x). Costea combustible y viáticos.</div>",
    rrhh: "Operador devenga Bono Hora según tonelaje (<code>tpar_tarifa_operador</code>) + Viático Alimentación progresivo ($7k–$18k).",
    edp: "Consolida horas facturables validadas por Yiara (Hito 1) → Factura Laudus Maritza (Hito 2).",
    cambioAplicado: "Se flexibiliza la valorización a horas a disposición con piso pactado por faena (no necesariamente 8h o 9h)."
  },
  {
    id: "1.2",
    displayId: "1.2",
    status: "CORRECTO",
    l: "IZAJE",
    n: "Grúa Telescópica / Pluma / Horquilla / Manipulador",
    rol: "RAÍZ",
    u: "Valor Fijo (Suma Alzada Maniobra — Caso 003 Barthou)",
    cant: "Cant = 1 Fijo (SPEC-128)",
    cot: "Subtotal = Valor Fijo. horas_minimas = 0.",
    ot: "Sección 1: Equipo + Operador. Viaje + Report Diario con HRS REPORT = 00:00 (solo respaldo).",
    its: "Declara SERVICIO VALOR FIJO. Cobra 100% del Valor Fijo aunque el report tenga 0 hrs (SPEC-125/128).",
    rrhh: "Operador: Bono Hora sobre HRS SERVICIO físicas reales + Viático Alimentación.",
    edp: "Carátula EDP muestra Cant = 1 y Subtotal = Valor Fijo (jamás multiplica por 8h — CASO-20261111-02).",
    cambioAplicado: "Validado OK sin cambios."
  },
  {
    id: "1.3",
    displayId: "1.3",
    status: "CORRECTO",
    l: "IZAJE",
    n: "Grúa Telescópica / Pluma / Horquilla / Manipulador",
    rol: "RAÍZ",
    u: "Valor Fijo Diario (Jornada Completa)",
    cant: "Días",
    cot: "Días × Tarifa Día ($). horas_minimas = 0.",
    ot: "<b>Sección 1: Equipo + Operador.</b> 1 Report Diario por cada día trabajado (aquí SÍ es obligatorio el report como respaldo de jornada).",
    its: "Cobra dias_trabajados × Tarifa Día (sin multiplicar por horas del día).",
    rrhh: "Operador: Bono Hora por horas físicas reales del report + Viático del día.",
    edp: "EDP muestra Cant = Días Ejecutados × Tarifa Día.",
    cambioAplicado: "Validado OK (se ratifica exigencia de report diario por jornada)."
  },
  {
    id: "1.4",
    displayId: "1.4",
    status: "INNECESARIO",
    l: "IZAJE",
    n: "Grúa Telescópica / Pluma / Horquilla / Manipulador",
    rol: "RAÍZ",
    u: "Valor Fijo Semanal",
    cant: "Semanas",
    cot: "Semanas × Tarifa Semana ($).",
    ot: "Sección 1: Equipo + Operador (soporta relevos turnos_operadores).",
    its: "Cobra semanas_devengadas × Tarifa Semana.",
    rrhh: "Operador titular y relevos cobran sus horas físicas en su rango de fechas (SPEC-065 §10).",
    edp: "EDP por semana cumplida o al término.",
    cambioAplicado: "DESCARTE: Modalidad semanal no se utiliza en izaje."
  },
  {
    id: "1.5",
    displayId: "1.5.M",
    status: "MODIFICADO",
    l: "IZAJE",
    n: "Grúa Telescópica / Pluma / Horquilla / Manipulador",
    rol: "RAÍZ",
    u: "Horas Mes a Disposición (Bolsa Flexible)",
    cant: "Meses × Bolsa Horas",
    cot: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'><b>Horas libres a disposición:</b> Meses × Bolsa Horas Acordadas × $/Hora (cualquier número de horas pactado, no fijo a 180h). En cotización son horas libres (no se cotizan horas exceso).</div>",
    ot: "Reports diarios con horas_minimas = 0 (SPEC-115); acumula horas reales día a día sin cerrar la OT.",
    its: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'>Permite Corte Mensual flexible: cobra <code>max(bolsa_acordada, suma_hrs_mes) × $/Hora</code>. Cortes pueden ser por los días que se estimen.</div>",
    rrhh: "Operadores cobran horas reales del mes en Sábana RRHH.",
    edp: "Emite EDP Corte Mensual y DTE MENSUALIDAD manteniendo viva la OT.",
    cambioAplicado: "Horas a disposición con bolsa flexible (no fija 180h) y horas libres de exceso en cotización."
  },
  {
    id: "1.6",
    displayId: "1.6",
    status: "INNECESARIO",
    l: "IZAJE",
    n: "Grúa Telescópica / Pluma / Horquilla / Manipulador",
    rol: "RAÍZ",
    u: "Valor Fijo Mensual (Tarifa Plana Mes)",
    cant: "Meses",
    cot: "Meses × Tarifa Mes ($).",
    ot: "Sección 1: Equipo + Operador(es). Control diario de horómetro y asistencia.",
    its: "Al corte mensual cobra Tarifa Mes (o pro-rata días).",
    rrhh: "Operadores cobran horas físicas reales + viáticos del mes.",
    edp: "Emite EDP Mensual por canon fijo.",
    cambioAplicado: "DESCARTE: En izaje con operador no se usa tarifa plana sin horas."
  },
  {
    id: "1.7",
    displayId: "1.7.M",
    status: "MODIFICADO",
    l: "IZAJE",
    n: "Traslado de Grúa Autopropulsada / Pluma",
    rol: "HIJO COMERCIAL",
    u: "TRASLADO IDA/VUELTA | IDA | RETORNO (Multi-Tramo)",
    cant: "Cant = 1 Fijo (Multi-Punto)",
    cot: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'><b>Cobro Urbano vs. Rural:</b> En zonas urbanas (&lt;=30km) por defecto NO se cobra ($0). En zonas rurales (&gt;30km) se cobra según acuerdo. <b>Permite agregar más de un traslado</b> cuando el servicio se ejecuta en distintos puntos/faenas.</div>",
    ot: "NO crea fila en Sección 2 (SPEC-065): la grúa viaja con su propio operador de Sección 1.",
    its: "Fila única de traslado por el 100% de su valor comercial pactado.",
    rrhh: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'><b>Regla RRHH Conducción:</b> En servicios rurales se pagan horas al operador desde que sale de base hasta que vuelve. En servicios urbanos NO se consideran las horas de traslado para el pago de horas al operador.</div>",
    edp: "EDP muestra las líneas de traslado pactadas con Cant = 1 y Subtotal = Valor.",
    cambioAplicado: "Diferenciación estricta pago horas chofer Rural vs Urbano y soporte de traslados multi-punto."
  },
  {
    id: "1.8",
    displayId: "1.8.M",
    status: "MODIFICADO",
    l: "IZAJE",
    n: "Traslado de Horquilla / Manipulador (En Cama Baja)",
    rol: "HIJO COMERCIAL",
    u: "TRASLADO IDA/VUELTA | IDA | RETORNO",
    cant: "Cant = 1 Fijo",
    cot: "Subtotal = Valor Flete pactado (Cant=1 inmutable, nunca multiplicado por días).",
    ot: "SÍ habilita asignación en Sección 2 (SPEC-065): Operaciones asigna Cama Baja/Plataforma + Chofer.",
    its: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'><b>Flete Propio vs Subcontratado:</b> Si el traslado se subcontrata a un tercero externo, el valor de la OC/factura <b>figura como costo/gasto en ITS</b>, pero <b>NO crea otra línea en el EDP</b> (el cobro al mandante ya está incluido en el valor comercial).</div>",
    rrhh: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'><b>Regla Chofer Cama Baja:</b> Por regla general <b>NO considera bono de grúa ni viático por traslado standard</b> (cubierto en sueldo base), con opción de activación manual solo para casos excepcionales.</div>",
    edp: "EDP muestra Cant = 1 con el valor comercial acordado con el cliente.",
    cambioAplicado: "Chofer sin viático/bono por defecto; flete externo entra a ITS como costo sin línea extra en EDP."
  },
  {
    id: "1.9",
    displayId: "1.9.M",
    status: "MODIFICADO",
    l: "IZAJE",
    n: "Rigger / Señalero en Maniobra",
    rol: "HIJO COMERCIAL",
    u: "Incluido ($0) | Valor Fijo | Diario",
    cant: "Check $0 o Días",
    cot: "Si es incluido: check técnico sin línea $0 (SPEC-125). Si se vende aparte: rama comercial con su tarifa.",
    ot: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'><b>Cero Report de Rigger:</b> En servicios de izaje el Rigger <b>NO realiza report diario</b> (su jornada y labor quedan respaldadas en el report de la grúa).</div>",
    its: "Si es incluido: ingreso $0. Si es aparte: cobra su rama. En Sección 3: rol RIGGER a $0 (Sueldo Fijo).",
    rrhh: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'>Rigger tiene Sueldo Fijo ($0/h). Devenga Viático de Alimentación <b>únicamente por día efectivamente trabajado en faena</b>.</div>",
    edp: "Si es incluido no aparece en EDP; si es facturable aparte se cobra según su modalidad.",
    cambioAplicado: "Rigger no hace report diario en izaje y viático solo aplica por día efectivamente asistido."
  },
  {
    id: "1.10",
    displayId: "1.10.M",
    status: "MODIFICADO",
    l: "IZAJE",
    n: "Accesorio Principal / Ingeniería (Balancín / Plan Izaje)",
    rol: "HIJO COMERCIAL",
    u: "Valor = $0 | Fijo | Diario | Por Horas",
    cant: "1, Días u Horas",
    cot: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'><b>Modalidad Multiformato:</b> Aplica solo a accesorios principales (balancín o plan de izaje, no accesorios menores). Puede valorizarse como <b>Valor = $0 (bonificado)</b>, <b>Valor Fijo</b>, <b>Valor Diario</b> o <b>Por Hora</b>.</div>",
    ot: "Control de despacho en pañol o adjunto Plan de Izaje. Sin operador ni viaje propio.",
    its: "Se liquida en su propia rama y JAMÁS anula las horas mínimas de la grúa padre.",
    rrhh: "Sin costo de operador propio.",
    edp: "Línea independiente en Carátula EDP.",
    cambioAplicado: "Aplica solo a accesorios principales y soporta valor $0, fijo, diario o por horas."
  },
  {
    id: "1.11",
    displayId: "1.11.M",
    status: "MODIFICADO",
    l: "IZAJE",
    n: "Equipo de Apoyo Operativo (Tracto Contrapesos / Camioneta)",
    rol: "HIJO OPERATIVO",
    u: "Uso Interno Operativo ($0 Cliente)",
    cant: "Interno",
    cot: "NO lo ingresa el vendedor: lo agrega Jonathan en Operaciones.",
    ot: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'><b>Asignación y Ramplas:</b> En caso de tractocamión, las ramplas deben registrarse como nodo hijo en OT. Camioneta urbana <b>no genera registro de viaje obligatorio en PWA</b>.</div>",
    its: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'><b>Subcontratación de Contrapesos:</b> Si se subcontratan camiones para trasladar contrapesos, el costo de la OC <b>figura en ITS</b> pero <b>NO se muestra como línea aparte en EDP</b>.</div>",
    rrhh: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'>Conductor registra viaje, pero por regla general <b>NO se pagan horas ni viático</b> (cubiertos en sueldo base), con habilitación manual solo para casos excepcionales.</div>",
    edp: "Oculto en el EDP del cliente (absorbido en la tarifa principal).",
    cambioAplicado: "Ramplas como nodo hijo; fletes externos de contrapesos a ITS sin EDP; chofer sin horas/viático estándar."
  },

  /* LÍNEA 2: ARRIENDO / RENTAL */
  {
    id: "2.1",
    displayId: "2.1.M",
    status: "MODIFICADO",
    l: "RENTAL",
    n: "Plataforma Tijera / Articulada (o Horquilla/Manipulador sin operador)",
    rol: "RAÍZ",
    u: "Valor Fijo Diario (Extensible)",
    cant: "Días",
    cot: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'>Días × Tarifa Día ($). Aplica a Plataformas y excepcionalmente a Horquillas/Manipuladores en arriendo seco. <b>El Contrato de Arriendo NO debe generarse hasta que Operaciones asigne el equipo físico (patente/serie).</b></div>",
    ot: "Sección 1 sin Operador (sin_operador=true). Cero Report Diario. Exige Acta 360° en 2 instancias (Entrega T0 / Retiro T1).",
    its: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'>Cobra <code>(fecha_retiro - fecha_entrega + 1) × Tarifa Día</code>. Extensiones de arriendo pueden liquidarse por día o por mes según acuerdo.</div>",
    rrhh: "Costo hora operador máquina = $0.",
    edp: "EDP con Contrato + ACT_ENTREGA.pdf + ACT_FINAL.pdf.",
    cambioAplicado: "Contrato no se genera hasta que Operaciones asigne el equipo físico; extensiones por día o mes."
  },
  {
    id: "2.2",
    displayId: "2.2",
    status: "INNECESARIO",
    l: "RENTAL",
    n: "Plataforma Tijera / Articulada / Alza Hombre (Dry Lease)",
    rol: "RAÍZ",
    u: "Valor Fijo Semanal (7 días)",
    cant: "Semanas",
    cot: "Semanas × Tarifa Semana ($).",
    ot: "Igual a 2.1: gobernado por Contrato + Acta 360°.",
    its: "Cobra semanas devengadas según fechas del Acta 360°.",
    rrhh: "Costo hora operador máquina = $0.",
    edp: "EDP con respaldo de Contrato y Acta 360°.",
    cambioAplicado: "DESCARTE: Modalidad semanal no aplica en arriendo."
  },
  {
    id: "2.3",
    displayId: "2.3.M",
    status: "MODIFICADO",
    l: "RENTAL",
    n: "Plataforma Tijera / Articulada (Caso Royal RYL-2611-00001)",
    rol: "RAÍZ",
    u: "Valor Fijo Mensual (Horas Libres)",
    cant: "Meses",
    cot: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'>Meses × Tarifa Mes ($). <b>Las horas son libres de uso</b> (NO hay cobro de horas exceso en cotización de arriendo mensual salvo pacto expreso).</div>",
    ot: "Permanece en obra con Acta en estado ENTREGADA hasta que el cliente programe el retiro.",
    its: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'><b>Cortes Flexibles:</b> Los cortes de los servicios mensuales no necesariamente son mensuales calendario; se debe poder cortar y liquidar por la cantidad de días que se estime conveniente.</div>",
    rrhh: "Costo hora operador máquina = $0.",
    edp: "Emite EDP Mensual o por corte de días y EDP de Cierre al retiro.",
    cambioAplicado: "Horas libres de uso (sin horas exceso estándar) y cortes parciales por días flexibles."
  },
  {
    id: "2.4",
    displayId: "2.4",
    status: "INNECESARIO",
    l: "RENTAL",
    n: "Plataforma / Equipo Dry Lease por Bolsa de Horas",
    rol: "RAÍZ",
    u: "Horas Mes Minimas (Bolsa 180h)",
    cant: "Meses × 180h",
    cot: "Meses × 180h × $/Hora.",
    ot: "Controlado por horómetro de entrega y retiro en Acta 360°.",
    its: "Cobra max(180 × meses, horometro_out - horometro_in) × $/Hora.",
    rrhh: "Costo hora operador máquina = $0.",
    edp: "EDP por corte mensual.",
    cambioAplicado: "DESCARTE: Arriendo no se liquida por bolsa de horas horométricas."
  },
  {
    id: "2.5",
    displayId: "2.5.M",
    status: "MODIFICADO",
    l: "RENTAL",
    n: "Flete de Entrega en Obra (Día 1)",
    rol: "HIJO COMERCIAL",
    u: "TRASLADO IDA",
    cant: "Cant = 1 Fijo",
    cot: "Subtotal = Valor Flete Entrega.",
    ot: "En T0 Operaciones asigna Camión propio o transportista tercero. Se firma Instancia 1 (ENTREGA) del Acta.",
    its: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'>Si el traslado es subcontratado a un transportista externo, el costo de la factura <b>figura en ITS</b> pero <b>NO crea línea extra en el EDP</b>.</div>",
    rrhh: "Chofer propio registra viaje de entrega en tequ_log_desplazamiento.",
    edp: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'><b>Línea Única de Traslado:</b> En el EDP solo debe aparecer <b>UNA sola línea consolidada de traslado</b>, con valor editable (la separación de entrega y retiro es de control puramente operacional).</div>",
    cambioAplicado: "En EDP aparece una sola línea de traslado consolidada con valor editable; flete externo entra a ITS."
  },
  {
    id: "2.6",
    displayId: "2.6.M",
    status: "MODIFICADO",
    l: "RENTAL",
    n: "Flete de Retiro desde Obra (Asíncrono)",
    rol: "HIJO COMERCIAL",
    u: "TRASLADO RETORNO (Traslado Vuelta)",
    cant: "Cant = 1 Fijo",
    cot: "Subtotal = Valor Flete Retiro.",
    ot: "Asignación diferida en T1 + Firma 2 (RETIRO) en la misma Acta.",
    its: "Opera igual a 2.5.M: si es flete subcontratado entra a ITS como costo sin línea adicional en EDP.",
    rrhh: "Chofer de retiro registra viaje en el mes en que ocurre T1.",
    edp: "Se consolida en la línea única de traslado en el EDP de Cierre con valor editable.",
    cambioAplicado: "Igual a 2.5: consolidación en línea única de traslado en EDP con valor editable."
  },
  {
    id: "2.7",
    displayId: "2.7.M",
    status: "MODIFICADO",
    l: "RENTAL",
    n: "Liquidación Diésel Faltante y Daños al Retiro",
    rol: "HIJO LIQUIDACIÓN",
    u: "Liquidación Acta Retiro (Valor Editable)",
    cant: "Según Acta Final",
    cot: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'>Estipulado en el Contrato. <b>El valor del diésel debe ser editable</b> (en ningún caso tarifa fija de $1.000/L). No se toman en cuenta horas en servicio rental.</div>",
    ot: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'>Al firmar RETIRO, el Acta compara checklist y combustible. <b>Las diferencias por daños exigen respaldo fotográfico obligatorio</b> de entrega vs retiro.</div>",
    its: "Agrega líneas de cobro por litros faltantes y daños validados con respaldo fotográfico.",
    rrhh: "Sin impacto en RRHH.",
    edp: "Se incorpora al EDP de Cierre respaldado por ACT_FINAL.pdf y fotos comparativas.",
    cambioAplicado: "Valor diésel 100% editable; daños requieren respaldo fotográfico obligatorio; sin horas."
  },

  /* LÍNEA 3: TRANSPORTE */
  {
    id: "3.1",
    displayId: "3.1.M",
    status: "MODIFICADO",
    l: "TRANSPORTE",
    n: "Flete Cama Baja / Rampla (Caso RYL-2611-00002)",
    rol: "RAÍZ",
    u: "TRASLADO IDA/VUELTA | IDA | RETORNO | Valor Fijo",
    cant: "Cant = 1 Fijo (SPEC-128)",
    cot: "Subtotal = Valor Fijo del tramo. horas_minimas = 0.",
    ot: "Sección 2: Tracto + Cama Baja/Rampla + Chofer. CERO Report Diario de Grúa (CASO-20261110-03).",
    its: "Cobra 100% por viaje realizado. Si se anula, se deja en $0.",
    rrhh: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'><b>Regla Choferes Transporte:</b> Los conductores de camiones de transporte <b>NO devengan viático ni pago de horas por traslados</b> (cubiertos en sueldo base), salvo tramos interurbanos especiales autorizados.</div>",
    edp: "EDP por el valor fijo del flete con Comprobante FLT / Guía SII.",
    cambioAplicado: "Conductores de camiones no tienen viático ni pago de horas por traslados standard."
  },
  {
    id: "3.2",
    displayId: "3.2",
    status: "INNECESARIO",
    l: "TRANSPORTE",
    n: "Flete por Kilometraje",
    rol: "RAÍZ",
    u: "Tarifa por Km",
    cant: "Kilómetros",
    cot: "Km Pactados × $/Km.",
    ot: "El Registro de Viaje captura odómetros salida y llegada.",
    its: "Cobra km_validados × $/Km.",
    rrhh: "Igual a 3.1.",
    edp: "EDP detallando Kilómetros × Tarifa.",
    cambioAplicado: "DESCARTE: Flete por kilómetro no se utiliza."
  },
  {
    id: "3.3",
    displayId: "3.3",
    status: "CORRECTO",
    l: "TRANSPORTE",
    n: "Camión por Jornada / Disposición Diaria",
    rol: "RAÍZ",
    u: "Valor Fijo Diario | Horas Diarias Minimas",
    cant: "Días",
    cot: "Días × Tarifa Día (o Días × Hrs Mín × $/Hora).",
    ot: "Sección 2: Camión + Chofer por las jornadas requeridas.",
    its: "Cobra los días u horas efectivas de disposición.",
    rrhh: "Igual a 3.1.",
    edp: "EDP por las jornadas cumplidas.",
    cambioAplicado: "Validado OK sin cambios."
  },
  {
    id: "3.4",
    displayId: "3.4",
    status: "CORRECTO",
    l: "TRANSPORTE",
    n: "Camioneta Escolta / Permisos Vialidad MOP",
    rol: "HIJO COMERCIAL",
    u: "Valor Fijo | Valor Fijo Diario",
    cant: "1 o Días",
    cot: "Subtotal = Valor Fijo o Días × Tarifa.",
    ot: "Si es escolta propia asigna CAMIONETA + Chofer; si es externa vincula OC proveedor.",
    its: "Suma ingreso de la rama y cruza costo de peajes u OC Laudus (sin borrarse).",
    rrhh: "Si es chofer propio, registra su viaje.",
    edp: "Línea adicional en Carátula EDP.",
    cambioAplicado: "Validado OK sin cambios."
  },
  {
    id: "3.5",
    displayId: "3.5",
    status: "INNECESARIO",
    l: "TRANSPORTE",
    n: "Sobreestadía de Camión en Planta",
    rol: "HIJO COMERCIAL",
    u: "Hora Efectiva ($/Hora Espera)",
    cant: "Horas Espera",
    cot: "Horas Sobreestadía × $/Hora.",
    ot: "Respaldado por marcas horarias en tequ_log_desplazamiento.",
    its: "Suma horas_sobreestadia × $/Hora al ingreso.",
    rrhh: "Actualiza condición de viático.",
    edp: "Línea de sobreestadía en EDP.",
    cambioAplicado: "DESCARTE: Sobreestadía no se tarifa como concepto rígido."
  },

  /* LÍNEA 4: PROFESIONALES */
  {
    id: "4.1",
    displayId: "4.1",
    status: "CORRECTO",
    l: "PROFESIONAL",
    n: "Profesional Certificado (Solo Rigger / APR — Caso 002 Plaenge)",
    rol: "RAÍZ",
    u: "Valor Fijo (Suma Alzada Servicio)",
    cant: "Cant = 1 Fijo (SPEC-128)",
    cot: "Cant = 1 inmutable ($300.000 por el servicio completo, dure 1 o 2 días).",
    ot: "Sección 3 sin maquinaria (id_equipo=NULL), bypass Patio (CASO-20261102-04). Reports con 0h como asistencia.",
    its: "NO descarta el servicio aunque los reports tengan 0h (SPEC-128): mantiene fijo $300.000.",
    rrhh: "Rigger/APR con Sueldo Fijo ($0/h) + Viático Alimentación por día asistido (SPEC-117).",
    edp: "Modal EDP, PDF EDP y Contabilidad muestran Cant = 1 y $300.000 (nunca $600.000).",
    cambioAplicado: "Validado OK sin cambios."
  },
  {
    id: "4.2",
    displayId: "4.2",
    status: "CORRECTO",
    l: "PROFESIONAL",
    n: "Profesional Certificado (Rigger / APR / Supervisor)",
    rol: "RAÍZ",
    u: "Valor Fijo Diario (Por Día Completo / Jornada)",
    cant: "Días",
    cot: "Días × Tarifa Día ($) (ej. 2 días × $150.000 = $300.000).",
    ot: "Sección 3 sin maquinaria. <b>Registra obligatoriamente 1 papeleta/report diario</b> por cada día trabajado (aquí SÍ hace report).",
    its: "Cobra dias_asistidos × Tarifa Día (sin multiplicar por horas).",
    rrhh: "Sueldo Fijo ($0/h) + Viático de Alimentación por día asistido.",
    edp: "EDP muestra Cant = Días Asistidos × Tarifa Día.",
    cambioAplicado: "Se ratifica: aquí sí hace report diario de asistencia obligatorio."
  },
  {
    id: "4.3",
    displayId: "4.3",
    status: "INNECESARIO",
    l: "PROFESIONAL",
    n: "Profesional Certificado (Rigger / APR / Supervisor)",
    rol: "RAÍZ",
    u: "Horas Diarias Minimas (Piso 8h/9h + HE)",
    cant: "Días × Hrs Mín",
    cot: "Días × Piso Hrs (8h/9h) × $/Hora.",
    ot: "Sección 3 sin maquinaria. Registra hora inicio, término y colación.",
    its: "Por cada día cobra max(horas_reales, piso_min) × $/Hora.",
    rrhh: "Sueldo Fijo + Viático de Alimentación.",
    edp: "EDP liquida horas facturables.",
    cambioAplicado: "DESCARTE: Profesionales no se cobran por horas mínimas."
  },
  {
    id: "4.4",
    displayId: "4.4",
    status: "CORRECTO",
    l: "PROFESIONAL",
    n: "Profesional Certificado (Rigger / APR / Supervisor)",
    rol: "RAÍZ",
    u: "Hora Efectiva (Sin Mínimo Diario)",
    cant: "Horas Reales",
    cot: "Horas Estimadas × $/Hora (pisoMinimo = 0).",
    ot: "Sección 3 sin maquinaria. Registra horas reales en obra.",
    its: "Cobra suma(horas_reales_validadas) × $/Hora.",
    rrhh: "Igual a 4.3.",
    edp: "EDP liquida Horas Reales × Tarifa Hora.",
    cambioAplicado: "Validado OK sin cambios."
  },
  {
    id: "4.5",
    displayId: "4.5",
    status: "INNECESARIO",
    l: "PROFESIONAL",
    n: "Profesional Certificado (Rigger / APR / Supervisor)",
    rol: "RAÍZ",
    u: "Valor Fijo Semanal",
    cant: "Semanas",
    cot: "Semanas × Tarifa Semana ($).",
    ot: "Sección 3 sin maquinaria. Control de asistencia diaria.",
    its: "Cobra semanas_cumplidas × Tarifa Semana.",
    rrhh: "Viáticos diarios.",
    edp: "EDP por semana cumplida.",
    cambioAplicado: "DESCARTE: Modalidad semanal no aplica."
  },
  {
    id: "4.6",
    displayId: "4.6",
    status: "CORRECTO",
    l: "PROFESIONAL",
    n: "Profesional Certificado (Dotación Permanente)",
    rol: "RAÍZ",
    u: "Valor Fijo Mensual",
    cant: "Meses",
    cot: "Meses × Tarifa Mes ($).",
    ot: "Sección 3 sin maquinaria. Soporta relevos por rango de fechas (turnos_operadores).",
    its: "Permite Corte Mensual de ITS (Tarifa Mes o pro-rata días).",
    rrhh: "Viáticos y alojamiento del mes en Sección 3 y Sábana RRHH.",
    edp: "Emite EDP Mensual a fin de mes manteniendo activa la OT.",
    cambioAplicado: "Validado OK sin cambios."
  },
  {
    id: "4.7",
    displayId: "4.7",
    status: "INNECESARIO",
    l: "PROFESIONAL",
    n: "Estudio de Rigging / Memoria de Cálculo / Plan de Izaje",
    rol: "RAÍZ",
    u: "Valor Fijo (Por Entregable / Hito)",
    cant: "Cant = 1 Fijo",
    cot: "Subtotal = Valor Estudio (Cant=1).",
    ot: "Sin maquinaria, sin viaje y sin report diario. El entregable es el PDF técnico.",
    its: "Cobra 100% al adjuntarse el entregable aprobado.",
    rrhh: "Sin viáticos salvo visita técnica.",
    edp: "EDP con Cant = 1 adjuntando el Estudio / Plan.",
    cambioAplicado: "DESCARTE: Se maneja como accesorio de izaje o servicio independiente."
  },
  {
    id: "4.8",
    displayId: "4.8.M",
    status: "MODIFICADO",
    l: "PROFESIONAL",
    n: "Movilización de Personal / Viáticos por Cuenta Cliente",
    rol: "HIJO COMERCIAL",
    u: "Pestaña 'Otros' en Cotización y EDP (Glosa y Valor Manual)",
    cant: "Glosa Libre",
    cot: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'><b>Pestaña Adicionales/Otros:</b> Innecesario como nodo fijo rígido en el árbol. Basta con una pestaña <b>'Otros'</b> en Cotización y EDP donde se agregue glosa y valor manual en caso de cobrarse al mandante.</div>",
    ot: "Si usa vehículo propio asigna CAMIONETA en Sección 2; si es Uber/Bus/Pensión va a Sección 3 ITS.",
    its: "Cobra la glosa acordada y cruza el gasto real en Sección 3.",
    rrhh: "Reembolso/viático según comprobante o escala.",
    edp: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'>Línea manual agregada desde pestaña Otros con glosa y monto editable.</div>",
    cambioAplicado: "Reemplazado por pestaña 'Otros' en Cotización y EDP con glosa y monto manual libre."
  },

  /* LÍNEA 5: MOVIMIENTOS INTERNOS */
  {
    id: "5.0",
    displayId: "5.0",
    status: "CORRECTO",
    l: "INTERNAS",
    n: "Movimientos Internos de Flota (Entre Bases / Taller)",
    rol: "RAÍZ",
    u: "Valor = $0 (Uso Interno Flota)",
    cant: "Días Estimados",
    cot: "<b>Parte en Punto 3 (Operaciones)</b>, sin cotización comercial previa ($0).",
    ot: "Puede ser cualquier equipo de la flota (sin mandante externo). No lleva report de izaje.",
    its: "<span class='change-pill'>REGLA AJUSTADA</span><div class='rule-mod-text'>No tiene valores facturables pero <b>SÍ debe poder generar ITS opcional</b> en movimientos grandes o costosos que requieran análisis de costos.</div>",
    rrhh: "Registra solo asistencia y viático de chofer según tramo si aplica.",
    edp: "Oculto en facturación / $0.",
    cambioAplicado: "Movimiento interno: parte en Operaciones, sin report, ITS opcional para análisis de costos."
  }
];`;

// Reemplazar la definición de CASES_31 en el HTML
const casesStart = html.indexOf('var CASES_31 = [');
const casesEnd = html.indexOf('];\n\nvar TRANSVERSALES = [');
if (casesStart >= 0 && casesEnd >= 0) {
  html = html.substring(0, casesStart) + updatedCasesCode + html.substring(casesEnd + 2);
  console.log('CASES_31 reemplazado exitosamente.');
} else {
  console.error('ERROR: No se encontró la definición de CASES_31.');
}

// 3. ACTUALIZAR RENDERMATRIX PARA GENERAR LA TABLA DE PANTALLA COMPLETA CON RESALTADO Y BOTÓN TOGGLE
const renderMatrixCode = `
var currentMatFilter = "ALL";
var currentStatusFilter = "ALL";
var ocultarNoNecesarios = true; // Por defecto OCULTAR no necesarios como pide el usuario

function toggleNoNecesarios(){
  ocultarNoNecesarios = !ocultarNoNecesarios;
  var btn = document.getElementById("btnToggleNoNec");
  if(btn){
    if(ocultarNoNecesarios){
      btn.innerHTML = "👁️ <b>Mostrar Casos No Necesarios (9)</b>";
      btn.style.background = "#1e293b";
    } else {
      btn.innerHTML = "🚫 <b>Ocultar Casos No Necesarios (9)</b>";
      btn.style.background = "#b91c1c";
    }
  }
  renderMatrix();
}

function filterMatrix(f, btn){
  currentMatFilter = f;
  var bs = btn.parentNode.querySelectorAll("button");
  for(var i=0;i<bs.length;i++) bs[i].classList.remove("on");
  btn.classList.add("on");
  renderMatrix();
}

function filterStatus(st, btn){
  currentStatusFilter = st;
  var bs = btn.parentNode.querySelectorAll("button");
  for(var i=0;i<bs.length;i++) bs[i].classList.remove("on");
  btn.classList.add("on");
  renderMatrix();
}

function renderMatrix(){
  var q = (document.getElementById("matSearch").value || "").toLowerCase();

  var list = CASES_31.filter(function(c){
    if (ocultarNoNecesarios && c.status === "INNECESARIO") return false;
    var matchL = (currentMatFilter === "ALL" || c.l === currentMatFilter);
    var matchS = (currentStatusFilter === "ALL" || c.status === currentStatusFilter);
    var txt = (c.id+" "+c.displayId+" "+c.l+" "+c.n+" "+c.rol+" "+c.u+" "+c.cot+" "+c.ot+" "+c.its+" "+c.rrhh+" "+c.edp+" "+(c.cambioAplicado||"")).toLowerCase();
    return matchL && matchS && (!q || txt.indexOf(q) >= 0);
  });

  var countVigentes = CASES_31.filter(function(c){return c.status!=="INNECESARIO"}).length;
  var countNoNec = CASES_31.filter(function(c){return c.status==="INNECESARIO"}).length;

  var statsTxt = document.getElementById("matStatsLabel");
  if(statsTxt){
    statsTxt.innerHTML = "Mostrando <b>" + list.length + "</b> de " + CASES_31.length + " casos (" + countVigentes + " vigentes / " + (ocultarNoNecesarios ? "9 ocultos" : "9 mostrados") + ")";
  }

  var h = "<thead><tr>"
    + "<th style='min-width:65px;width:65px'>Caso</th>"
    + "<th style='min-width:75px;width:75px'>Estado</th>"
    + "<th style='min-width:85px;width:85px'>Línea</th>"
    + "<th style='min-width:140px;width:140px'>Nodo / Recurso</th>"
    + "<th style='min-width:75px;width:75px'>Rol</th>"
    + "<th style='min-width:115px;width:115px'>Modalidad (Unidad)</th>"
    + "<th style='min-width:70px;width:70px'>Cant.</th>"
    + "<th style='min-width:180px'>1. Regla en Cotización</th>"
    + "<th style='min-width:180px'>2. Regla en OT y Terreno (PWA)</th>"
    + "<th style='min-width:180px'>3. Regla en ITS</th>"
    + "<th style='min-width:180px'>4. Regla en RRHH / Viáticos</th>"
    + "<th style='min-width:180px'>5. Regla en Carátula EDP</th>"
    + "</tr></thead><tbody>";

  list.forEach(function(c){
    var isDiscard = c.status === "INNECESARIO";
    var isMod = c.status === "MODIFICADO";
    var trClass = isDiscard ? "row-discard" : (isMod ? "row-mod" : "");

    var badgeEstado = "";
    if (isMod) {
      badgeEstado = "<span class='badge b-mod'>MODIFICADO</span>";
    } else if (isDiscard) {
      badgeEstado = "<span class='badge b-discard' style='background:#f1f5f9;color:#64748b;border-color:#cbd5e1'>NO APLICA</span>";
    } else {
      badgeEstado = "<span class='badge b-ok'>VIGENTE</span>";
    }

    var casoCell = "";
    if (isMod) {
      casoCell = "<span class='badge-m'>M</span> <strong style='color:#b91c1c;font-size:12.5px'>" + c.displayId + "</strong>";
    } else if (isDiscard) {
      casoCell = "<strong style='color:#94a3b8'>" + c.displayId + "</strong>";
    } else {
      casoCell = "<strong style='color:#0f172a'>" + c.displayId + "</strong>";
    }

    h += "<tr class='" + trClass + "'>"
      + "<td class='rh mono " + (isMod ? "cell-mod" : "") + " no-strike'>" + casoCell + "</td>"
      + "<td class='no-strike'>" + badgeEstado + "</td>"
      + "<td><span class='badge " + bClassForLinea(c.l) + "'>" + c.l + "</span></td>"
      + "<td><strong>" + c.n + "</strong></td>"
      + "<td><span class='badge " + (c.rol==='RAÍZ'?'b-raiz':(c.rol==='HIJO OPERATIVO'?'b-ope':'b-com')) + "'>" + c.rol + "</span></td>"
      + "<td><code>" + c.u + "</code></td>"
      + "<td class='mono'>" + c.cant + "</td>"
      + "<td>" + c.cot + "</td>"
      + "<td>" + c.ot + "</td>"
      + "<td>" + c.its + "</td>"
      + "<td>" + c.rrhh + "</td>"
      + "<td>" + c.edp + "</td>"
      + "</tr>";
  });
  h += "</tbody>";
  document.getElementById("combinatoriaTable").innerHTML = h;

  // Renderizar Notas Transversales
  var thtml = "";
  TRANSVERSALES.forEach(function(t){
    thtml += "<div style='background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #f59e0b;padding:8px 10px;border-radius:6px'>"
      + "<strong style='color:#0f172a;display:block;margin-bottom:3px'>#" + t.n + ". " + t.t + "</strong>"
      + "<span style='color:#475569;line-height:1.35;display:block'>" + t.d + "</span>"
      + "</div>";
  });
  var tContainer = document.getElementById("transversalesContainer");
  if(tContainer){
    tContainer.innerHTML = thtml;
  }
}
`;

// Reemplazar la función renderMatrix y asociadas en el HTML
const rmStart = html.indexOf('var currentMatFilter = "ALL";');
const rmEnd = html.indexOf('/* =========================================================================\n   5. EXPORTADOR A EXCEL');
if (rmStart >= 0 && rmEnd >= 0) {
  html = html.substring(0, rmStart) + renderMatrixCode + '\n' + html.substring(rmEnd);
  console.log('renderMatrix y filtros reemplazados exitosamente.');
} else {
  console.error('ERROR: No se encontró renderMatrix.');
}

// 4. ACTUALIZAR LA CABECERA DE LA VISTA 2 EN EL HTML PARA INCLUIR EL BOTÓN TOGGLE DESTACADO Y FULL WIDTH
const oldHeaderCard = `<div class="view" id="v-matriz">
  <div class="card">
    <h3>
      <span>Matriz Maestra de Combinatoria y Reglas de Valorización E2E (Revisión Jorge & Alfonso — SPEC-129)</span>
      <button class="btn-xls" onclick="exportarExcel()">📥 Exportar esta Matriz a Excel (.xls)</button>
    </h3>
    <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:10px 14px;margin-bottom:12px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between">
      <div style="font-size:12px;color:#334155;line-height:1.4">
        <strong>Convención de Validación de Cliente:</strong>
        <span style="display:inline-flex;align-items:center;margin-left:8px;gap:4px;"><span class="badge-m">M</span> <strong>En Rojo:</strong> 14 Casos que sufrieron Modificación (<code style="color:#b91c1c">X.X.M</code>)</span>
        <span style="display:inline-flex;align-items:center;margin-left:8px;gap:4px;"><span style="text-decoration:line-through;text-decoration-color:#ef4444;text-decoration-thickness:2px;color:#64748b;font-weight:bold;">En Celeste:</span> 9 Casos que No Aplican (Tarjados con línea roja)</span>
        <span style="display:inline-flex;align-items:center;margin-left:8px;gap:4px;"><span class="badge b-ok">OK</span> <strong>En Blanco:</strong> 10 Casos Correctos y Vigentes</span>
      </div>
      <label style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:800;color:#0f172a;cursor:pointer;background:#fff;padding:6px 12px;border-radius:6px;border:1px solid #94a3b8;box-shadow:0 1px 3px rgba(0,0,0,.08)">
        <input type="checkbox" id="chkOcultarNoNecesarios" onchange="renderMatrix()" style="cursor:pointer;width:15px;height:15px" />
        <span>🚫 Ocultar No Necesarios (Tarjados)</span>
      </label>
    </div>`;

const newHeaderCard = `<div class="view" id="v-matriz" style="width:100%!important;max-width:100%!important;padding:0!important">
  <div class="card" style="width:100%!important;max-width:100%!important;padding:12px!important">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:8px">
      <div>
        <h2 style="margin:0;font-size:17px;color:#0f172a;display:flex;align-items:center;gap:8px">
          <span>Matriz Maestra de Combinatoria E2E — Reglas de Negocio Validadas con Cliente</span>
          <span class="badge b-mod" style="font-size:11px">14 Casos [M] con Regla Ajustada</span>
          <span class="badge b-ok" style="font-size:11px">10 Casos Vigentes</span>
        </h2>
        <div style="font-size:12px;color:#64748b;margin-top:2px" id="matStatsLabel">Cargando estadísticas...</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <button id="btnToggleNoNec" class="toggle-btn-bar" onclick="toggleNoNecesarios()" style="background:#1e293b;padding:7px 14px;border-radius:7px;cursor:pointer">
          👁️ <b>Mostrar Casos No Necesarios (9)</b>
        </button>
        <button class="btn-xls" onclick="exportarExcel()" style="padding:7px 12px">📥 Descargar Matriz (.xls)</button>
      </div>
    </div>

    <!-- BARRA DE INFORMACIÓN Y FILTROS -->
    <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:8px 12px;margin-bottom:8px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between">
      <div style="font-size:12px;color:#334155;display:flex;flex-wrap:wrap;gap:12px;align-items:center">
        <span><b>Convención Visual:</b></span>
        <span style="display:inline-flex;align-items:center;gap:4px"><span class="badge-m">M</span> <b>Reglas Modificadas:</b> El cambio está <span style="background:#fee2e2;color:#b91c1c;font-weight:bold;padding:1px 4px;border-radius:3px">inserto y resaltado</span> en la celda donde aplica.</span>
        <span style="display:inline-flex;align-items:center;gap:4px"><span class="badge b-ok">VIGENTE</span> Casos sin cambios respecto a la operación real.</span>
        <span style="display:inline-flex;align-items:center;gap:4px"><span class="badge b-discard">NO APLICA</span> Casos descartados por Alfonso & Jorge (ocultos por defecto).</span>
      </div>
    </div>`;

html = html.replace(oldHeaderCard, newHeaderCard);

// 5. GUARDAR ARCHIVO
fs.writeFileSync(htmlPath, html, 'utf8');
console.log('HTML actualizado y guardado correctamente en:', htmlPath);
