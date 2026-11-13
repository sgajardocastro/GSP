/**
 * itsPdfService.js
 * Servicio de Generación de PDF Oficial del Informe de Término de Servicio (ITS)
 * Ecosistema: Grúas San Pablo (GSP) / LeanGlobal Platform
 * Formato Canónico: Aprobado y Socializado en Transición (ItsTransicionView.vue)
 * Gobernanza: Erradicación de términos no canónicos (P&L/Óptimo), inclusión de Vendedor y Horas Mínimas,
 * y supresión total de categorías y partidas en $0.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const LOGO_GSP_BASE64 = 'data:image/png;base64,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';


function parseMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const hh = parseInt(parts[0], 10);
  const mm = parseInt(parts[1], 10);
  if (isNaN(hh) || isNaN(mm)) return null;
  return hh * 60 + mm;
}

function diffMinutes(startStr, endStr) {
  const m1 = parseMinutes(startStr);
  const m2 = parseMinutes(endStr);
  if (m1 === null || m2 === null) return 0;
  let diff = m2 - m1;
  if (diff < 0) diff += 24 * 60;
  return diff;
}

function formatMinutesToHHMM(mins) {
  if (!mins || isNaN(mins) || mins <= 0) return '00:00';
  const totalM = Math.round(mins);
  const h = Math.floor(totalM / 60);
  const m = totalM % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatCLP(val) {
  const num = Math.round(Number(val) || 0);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatDateCL(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch (e) {
    return String(dateStr);
  }
}

function formatDateTimeCL(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch (e) {
    return String(dateStr);
  }
}

function esLineaRiggerFantasma(l) {
  if (!l || typeof l !== 'object') return false;
  const tipo = String(l.tipo || l.categoria || '').toUpperCase();
  const subcat = String(l.subcategoria || '').toUpperCase();
  const desc = String(l.descripcion || l.concepto || '').toUpperCase();
  const esPersonalRigger = tipo.includes('PERSONAL') || subcat.includes('RIGGER') || desc.includes('RIGGER');
  const valor = Number(l.valorUnitario || l.valor_unitario || l.precio_unitario || l.subtotal || 0);
  return esPersonalRigger && valor <= 0;
}

function esHashHex(str) {
  return typeof str === 'string' && /^[0-9a-fA-F]{12,64}$/.test(str);
}

/**
 * Maquetación HTML del documento ITS oficial
 */
function buildItsHtml(data) {
  const { its, proyecto, jornadas, costos, firmas, validacionUrl, asignaciones } = data;

  let logoBase64 = '';
  try {
    const candidatePaths = [
      path.join(__dirname, '../../../frontend/public/logo-sanpablo.png'),
      path.join(__dirname, '../../../frontend/public/logo_gsp.png'),
      path.join(process.cwd(), '../frontend/public/logo-sanpablo.png'),
      path.join(process.cwd(), 'public/logo-sanpablo.png'),
      path.join(__dirname, '../public/logo-sanpablo.png')
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        const fileBuf = fs.readFileSync(p);
        logoBase64 = `data:image/png;base64,${fileBuf.toString('base64')}`;
        break;
      }
    }
  } catch (e) {}
  if (!logoBase64) {
    logoBase64 = LOGO_GSP_BASE64;
  }

  const folio = its?.folio_its || `ITS-${proyecto?.id_proyecto || '00'}`;
  const version = its?.version || 1;
  const fEmision = formatDateCL(its?.fecha_creacion || new Date());

  const jfProy = proyecto?.json_field ? (typeof proyecto.json_field === 'string' ? JSON.parse(proyecto.json_field) : proyecto.json_field) : {};
  const crmV1 = jfProy?.crm_v1 || {};
  const lineasCrmRaw = crmV1.lineas_operativas_vigentes || crmV1.lineas_servicio || [];
  const lineasCrm = (lineasCrmRaw || []).filter(l => !esLineaRiggerFantasma(l));
  const lineaMensual = lineasCrm.find(l => String(l?.unidad || '').toUpperCase().includes('MES'));
  const esModalidadMensual = Boolean(lineaMensual) || its?.tipo_contexto === 'MENSUAL';

  const cliente = proyecto?.cliente_nombre || 'CLIENTE MANDANTE';
  const rut = proyecto?.cliente_rut || '—';
  const empresa = proyecto?.empresa_razon_social || proyecto?.empresa_nombre_fantasia || proyecto?.empresa_facturacion || 'ARRIENDO DE GRÚAS SAN PABLO SPA';
  const empresaNombreFantasia = proyecto?.empresa_nombre_fantasia || 'SAN PABLO';
  const vendedor = (
    proyecto?.ejecutivo_comercial ||
    proyecto?.vendedor ||
    crmV1?.ejecutivo_comercial ||
    crmV1?.vendedor ||
    crmV1?.vendedor_nombre ||
    crmV1?.snapshot_comercial?.vendedor ||
    proyecto?.creado_por_nombre ||
    'No Asignado'
  ).toUpperCase();
  const ciudad = proyecto?.obra_ciudad || proyecto?.ciudad || 'Santiago';
  const codigoOt = proyecto?.codi_proyecto || `GSP-OT-${proyecto?.id_proyecto || 'N/A'}`;
  const cotizacion = proyecto?.cod_cotizacion || proyecto?.numero_cotizacion || crmV1?.numero_cotizacion || codigoOt;
  const fIni = formatDateCL(its?.fecha_inicio || proyecto?.fecha_inicio || (jornadas && jornadas[0]?.fecha));
  const fFin = formatDateCL(its?.fecha_termino || proyecto?.fecha_termino || (jornadas && jornadas[jornadas.length - 1]?.fecha));
  const fechas = `${fIni} AL ${fFin}`;

  const esValorFijo = Boolean(
    its?.es_valor_fijo || 
    Number(its?.valor_fijo_pactado || its?.valor_fijo || crmV1?.valor_fijo || 0) > 0 || 
    lineasCrm.some(l => String(l.unidad || '').toUpperCase().includes('FIJO'))
  );
  const valorFijo = Number(
    its?.valor_fijo_pactado || 
    its?.valor_fijo || 
    crmV1?.valor_fijo || 
    (esValorFijo ? (its?.total_ingresos_horas || its?.valor_hora_pactado || 0) : 0)
  );
  const valorFlete = Number(its?.valor_flete_pactado || crmV1?.valor_flete || crmV1?.flete || 0);
  const valorHora = esValorFijo ? 0 : Number(its?.valor_hora_pactado || 0);

  const regimen = its?.tipo_contexto === 'RURAL' ? 'RÉGIMEN RURAL' : (esModalidadMensual ? 'MODALIDAD MENSUAL' : 'RÉGIMEN URBANO');
  const tipoServicio = esValorFijo
    ? 'SERVICIO VALOR FIJO (SUMA ALZADA)'
    : (proyecto?.tipo_servicio || (esModalidadMensual ? 'Arriendo Mensual de Grúa' : 'Servicio por Hora / Jornada'));

  // Tripulación deduplicada con nombres reales y cargos
  const tripMap = new Map();
  const tripArr = Array.isArray(jfProy?.ejecucion_v1?.tripulacion_asignada) ? jfProy.ejecucion_v1.tripulacion_asignada : [];
  tripArr.forEach(t => {
    const nom = (t.nombre_trabajador || t.nombre_completo || t.nombre || t.name_frst || t.personal || t.usuario || '').trim();
    const cargo = (t.cargo || t.rol || t.tipo || '').trim();
    if (nom && !tripMap.has(nom.toUpperCase())) {
      tripMap.set(nom.toUpperCase(), cargo ? `${nom} (${cargo})` : nom);
    }
  });
  (costos?.costo_hora_operador || []).forEach(c => {
    const nom = (c.nombre_personal || c.personal || '').trim();
    const rol = (c.rol_personal || c.categoria || 'Operador').trim();
    if (nom && !tripMap.has(nom.toUpperCase())) {
      tripMap.set(nom.toUpperCase(), `${nom} (${rol})`);
    }
  });
  (costos?.alimentacion || []).forEach(c => {
    const nom = (c.nombre_personal || c.personal || '').trim();
    if (nom && !tripMap.has(nom.toUpperCase())) {
      tripMap.set(nom.toUpperCase(), nom);
    }
  });
  const tripulacionStr = Array.from(tripMap.values()).join(', ') || 'Personal GSP Asignado';

  // Buscar patente real y modelo real de grúa operada desde jornadas o costos
  const jorGruaReal = (jornadas || []).find(j => j.patente && j.patente !== 'S/P' && j.patente !== 'PERSONAL' && !String(j.tipo_servicio || '').toLowerCase().includes('flete'));
  const costoGruaReal = (costos?.costo_hora_operador || []).find(c => c.patente && c.patente !== 'S/P');
  const patenteGruaReal = jorGruaReal?.patente || costoGruaReal?.patente;
  const modeloGruaReal = jorGruaReal?.equipo_modelo || costoGruaReal?.subcategoria;

  // Filtrar líneas CRM: excluir riggers fantasma y fletes para equipos
  const lineasEquiposCrm = lineasCrm.filter(l => {
    const tipo = String(l.tipo || l.categoria || '').toUpperCase();
    const desc = String(l.descripcion || l.concepto || '').toUpperCase();
    const unid = String(l.unidad || '').toUpperCase();
    const esFlete = tipo.includes('TRASLADO') || tipo.includes('FLETE') || unid.includes('FLETE') || unid.includes('TRASLADO') || desc.includes('FLETE') || desc.includes('TRASLADO');
    return !esFlete;
  });

  // 1. Grúa Principal
  const eqGruaPrincipal = (asignaciones?.equipos || []).find(e => {
    const tipo = String(e.tipo_equipo || '').toUpperCase();
    return tipo.includes('GRÚA') || tipo.includes('GRUA');
  }) || asignaciones?.equipos?.[0];

  const descComercialGrua = (lineasEquiposCrm[0] && lineasEquiposCrm[0].descripcion) || proyecto?.glosa_servicio || proyecto?.nombre_proyecto || 'Servicio de Grúa e Izaje';
  const tripGruaStr = eqGruaPrincipal?.tripulacion_str || (() => {
    const partes = [];
    const op = (asignaciones?.personal || []).find(p => String(p.rol_personal || '').toUpperCase().includes('OPERADOR'));
    const rig = (asignaciones?.personal || []).find(p => String(p.rol_personal || '').toUpperCase().includes('RIGGER'));
    if (op) partes.push(`${op.name_frst} ${op.apellido_pat || ''}`.trim() + ' (OPERADOR GRÚA)');
    if (rig) partes.push(`${rig.name_frst} ${rig.apellido_pat || ''}`.trim() + ' (RIGGER)');
    return partes.join(', ') || 'Personal Operacional Asignado';
  })();

  const grúaPrincipalObj = {
    patente: patenteGruaReal || eqGruaPrincipal?.patente || 'S/P',
    subcategoria: modeloGruaReal ? `GRÚA / ${modeloGruaReal}` : (eqGruaPrincipal?.modelo ? `GRÚA / ${eqGruaPrincipal.modelo}` : 'GRÚA PRINCIPAL'),
    glosa_comercial: descComercialGrua,
    horas_minimas: esValorFijo ? 'NO APLICA (VALOR FIJO)' : '9 HORAS DIARIAS',
    valor_hora_display: esValorFijo ? '— (VALOR FIJO)' : `$${formatCLP(valorHora)}`,
    ots_asociadas: codigoOt,
    personal_tripulacion: tripGruaStr
  };

  const equipos = [grúaPrincipalObj];
  const patentesYaMostradas = new Set([(grúaPrincipalObj.patente || '').replace(/[^A-Z0-9]/gi, '').toUpperCase()]);

  // 2. Incorporar equipos adicionales de asignaciones?.equipos o jornadas (ej. Tracto Camión)
  const poolEquiposExtra = [
    ...(asignaciones?.equipos || []),
    ...(jornadas || []).map(j => ({ patente: j.patente, modelo: j.equipo_modelo, tipo_equipo: j.tipo_servicio, conductor_nombre: j.conductor_nombre, tripulacion_str: j.conductor_nombre ? `${j.conductor_nombre} (CONDUCTOR)` : '' }))
  ];

  poolEquiposExtra.forEach(eq => {
    const rawPat = eq.patente || '';
    const normP = rawPat.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (!normP || normP === 'PERSONAL' || normP === 'SP' || patentesYaMostradas.has(normP)) return;

    // Descartar semirremolques, ramplas accesorios y camionetas livianas de supervisión/escolta
    const esAccesorio = String(eq.modelo || eq.tipo_equipo || '').toUpperCase().includes('SR 3M') || String(eq.tipo_equipo || '').toUpperCase().includes('RAMPLA') || String(eq.tipo_equipo || '').toUpperCase().includes('SEMI-REMOLQUE') || String(eq.tipo_equipo || '').toUpperCase().includes('SEMIRREMOLQUE');
    if (esAccesorio) return;

    const esVehiculoLiviano = normP.startsWith('RK') || normP.startsWith('CL') || String(eq.modelo || '').toUpperCase().includes('CAMIONETA') || String(eq.modelo || '').toUpperCase().includes('DX');
    if (esVehiculoLiviano) return;

    // Si ya mostramos un tracto camión y viene otro, evitar duplicar
    const esTracto = String(eq.tipo_equipo || eq.modelo || '').toUpperCase().includes('TRACTO') || String(eq.tipo_equipo || eq.modelo || '').toUpperCase().includes('CAMION') || String(eq.tipo_equipo || eq.modelo || '').toUpperCase().includes('TRANSPORTE');
    if (esTracto) {
      if (patentesYaMostradas.has('TRACTO_INCLUIDO')) return;
      patentesYaMostradas.add('TRACTO_INCLUIDO');
      patentesYaMostradas.add(normP);
      equipos.push({
        patente: rawPat,
        subcategoria: `TRACTO CAMIÓN / ${eq.modelo || 'TRANSPORTE Y APOYO'} (TRANSPORTE Y APOYO)`,
        glosa_comercial: 'TRANSPORTE Y APOYO OPERACIONAL',
        horas_minimas: esValorFijo ? 'INCLUIDO EN SERVICIO' : 'NO APLICA',
        valor_hora_display: esValorFijo ? '— (INCLUIDO)' : '—',
        ots_asociadas: codigoOt,
        personal_tripulacion: eq.tripulacion_str || (asignaciones?.personal?.find(p => String(p.rol_personal || '').toUpperCase().includes('CONDUCTOR') || String(p.rol_personal || '').toUpperCase().includes('CHOFER'))?.name_frst ? `${asignaciones.personal.find(p => String(p.rol_personal || '').toUpperCase().includes('CONDUCTOR') || String(p.rol_personal || '').toUpperCase().includes('CHOFER')).name_frst} (CONDUCTOR)` : 'Personal Asignado')
      });
    } else {
      patentesYaMostradas.add(normP);
      equipos.push({
        patente: rawPat,
        subcategoria: eq.modelo || eq.subcategoria || 'EQUIPO DE APOYO',
        glosa_comercial: '',
        horas_minimas: esValorFijo ? 'INCLUIDO EN SERVICIO' : 'NO APLICA',
        valor_hora_display: esValorFijo ? '— (INCLUIDO)' : '—',
        ots_asociadas: codigoOt,
        personal_tripulacion: eq.tripulacion_str || 'PERSONAL GSP ASIGNADO'
      });
    }
  });

  // Jornadas de terreno con columnas de ancho controlado (SPEC-121)
  const esUrbano = (its?.tipo_contexto === 'URBANO') || (!its?.tipo_contexto && !esModalidadMensual);
  let totalHorasReportNum = 0;
  let totMinServicio = 0;
  let totMinViaticos = 0;
  let totViaticosMonto = 0;

  const jornadasRows = (jornadas || []).map((j, idx) => {
    const hSal = j.hora_salida ? String(j.hora_salida).slice(0, 5) : '—';
    const hLle = j.hora_llegada ? String(j.hora_llegada).slice(0, 5) : '—';
    const hTer = j.hora_termino ? String(j.hora_termino).slice(0, 5) : '—';
    const hRet = j.hora_retorno ? String(j.hora_retorno).slice(0, 5) : '—';
    const colMin = j.colacion_minutos !== null && j.colacion_minutos !== undefined ? Number(j.colacion_minutos) : (j.colacion ? 60 : 0);
    const colStr = colMin > 0 ? `${String(Math.floor(colMin / 60)).padStart(2, '0')}:${String(colMin % 60).padStart(2, '0')}` : '00:00';

    // 1. Hrs Servicio (Urbano vs Rural) en formato hh:mm
    let minServ = 0;
    if (j.hora_termino && (j.hora_salida || j.hora_llegada)) {
      const iniServ = esUrbano ? (j.hora_salida || j.hora_llegada) : (j.hora_llegada || j.hora_salida);
      minServ = Math.max(0, diffMinutes(iniServ, j.hora_termino) - colMin);
    } else if (j.horas_reales) {
      minServ = Math.round(Number(j.horas_reales) * 60);
    }
    totMinServicio += minServ;

    // 2. Hrs Viáticos (Puerta a Puerta Universal) en formato hh:mm
    let minViat = 0;
    if ((j.hora_salida || j.hora_llegada) && (j.hora_retorno || j.hora_termino)) {
      const iniViat = j.hora_salida || j.hora_llegada;
      const finViat = j.hora_retorno || j.hora_termino;
      minViat = Math.max(0, diffMinutes(iniViat, finViat) - colMin);
    } else if (j.horas_viaticos) {
      minViat = Math.round(Number(j.horas_viaticos) * 60);
    }
    totMinViaticos += minViat;

    // 3. Monto Viático (Escala tabular: < 8h = $0; 8h = $7.000; +$1.000/h extra, tope $18.000)
    const hrsViatNum = minViat / 60;
    const hRed = Math.round(hrsViatNum);
    const viaticoMonto = hRed < 8 ? 0 : Math.min(18000, 7000 + (hRed - 8) * 1000);
    totViaticosMonto += viaticoMonto;

    const hrsRep = Number(j.horas_report || 0);
    const esViajeJornada = (j.tipo_servicio === 'Registro de Viaje');
    if (!esViajeJornada) {
      totalHorasReportNum += hrsRep;
    }
    const numReportFinal = (j.numero_report && j.numero_report.startsWith('VIAJE-'))
      ? j.numero_report
      : ((!j.numero_report || esHashHex(j.numero_report) || j.numero_report.length >= 16)
          ? `REP-${proyecto?.id_proyecto || 'OT'}-${j.id_reporte_avance || (idx + 1)}`
          : j.numero_report);

    const tipoServicioLabel = esViajeJornada
      ? `Registro de Viaje${j.tipo_viaje ? `<br/><span style="font-size: 7.5px; color: #475569; font-weight: bold;">(${String(j.tipo_viaje).replace(/_/g, ' ')})</span>` : ''}${j.comentario_viaje ? `<br/><span style="font-size: 7px; color: #64748b; font-style: italic;">${j.comentario_viaje}</span>` : ''}`
      : ((esValorFijo || String(j.tipo_servicio || '').includes('Fijo')) ? 'Valor Fijo' : (j.tipo_servicio || 'Hora'));

    const choferOpNombre = j.conductor_nombre || j.operador_nombre || '';

    return `
      <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f8fafc;'}">
        <td style="padding: 3.5px 4px; text-align: center; font-weight: 600; border-right: 1px solid #e2e8f0; white-space: nowrap;">${formatDateCL(j.fecha)}</td>
        <td style="padding: 3.5px 4px; text-align: center; font-weight: 800; color: #1e3a8a; border-right: 1px solid #e2e8f0; white-space: nowrap;">${j.numero_ot || codigoOt}</td>
        <td style="padding: 3.5px 4px; text-align: center; color: #334155; border-right: 1px solid #e2e8f0;">${tipoServicioLabel}</td>
        <td style="padding: 3.5px 4px; text-align: center; font-weight: 700; border-right: 1px solid #e2e8f0; white-space: nowrap;">
          <div style="font-weight: 800; color: #0f172a;">${j.patente || '—'}</div>
          ${choferOpNombre ? `
            <div style="font-size: 7px; color: #475569; font-weight: 700; text-transform: uppercase; margin-top: 1px;">
              ${choferOpNombre}
            </div>
          ` : ''}
        </td>
        <td style="padding: 3.5px 4px; text-align: center; border-right: 1px solid #e2e8f0;">${hSal}</td>
        <td style="padding: 3.5px 4px; text-align: center; border-right: 1px solid #e2e8f0;">${hLle}</td>
        <td style="padding: 3.5px 4px; text-align: center; border-right: 1px solid #e2e8f0;">${hTer}</td>
        <td style="padding: 3.5px 4px; text-align: center; border-right: 1px solid #e2e8f0;">${hRet}</td>
        <td style="padding: 3.5px 4px; text-align: center; border-right: 1px solid #e2e8f0;">${colStr}</td>
        <td style="padding: 3.5px 4px; text-align: center; font-weight: 800; color: #1d4ed8; border-right: 1px solid #e2e8f0; font-family: monospace;">${minServ > 0 ? formatMinutesToHHMM(minServ) : '00:00'}</td>
        <td style="padding: 3.5px 4px; text-align: center; font-weight: 800; color: #0284c7; border-right: 1px solid #e2e8f0; font-family: monospace;">${minViat > 0 ? formatMinutesToHHMM(minViat) : '00:00'}</td>
        <td style="padding: 3.5px 4px; text-align: center; font-weight: 800; color: #047857; border-right: 1px solid #e2e8f0; font-family: monospace;">${hrsRep > 0 ? formatMinutesToHHMM(Math.round(hrsRep * 60)) : '—'}</td>
        <td style="padding: 3.5px 4px; text-align: center; font-weight: 700; white-space: nowrap;">${numReportFinal}</td>
      </tr>
    `;
  }).join('');

  // Costos operacionales directos: SUPRESIÓN ESTRICTA DE FILAS Y CATEGORÍAS CON MONTO $0
  const filterCostRows = (arr) => (arr || []).filter(r => (Number(r.monto_total !== undefined ? r.monto_total : r.monto) || 0) > 0);

  const alimRows = filterCostRows(costos?.alimentacion);
  const peajesRows = filterCostRows(costos?.peajes);
  const pensionRows = filterCostRows(costos?.pensiones);
  const movilRows = filterCostRows(costos?.movilizacion);
  const pextRows = filterCostRows(costos?.personal_externo);
  const feriadoRows = filterCostRows(costos?.feriados);
  const subcontRows = filterCostRows(costos?.subcontratacion_flete);
  const extraRows = filterCostRows(costos?.gastos_extraordinarios);
  const combRows = filterCostRows(costos?.combustible);
  const operadorRows = (costos?.costo_hora_operador || []).filter(r => (Number(r.monto_total !== undefined ? r.monto_total : r.monto) || 0) > 0 && r.tarifa_no_aplica !== true);

  const sumMonto = (arr) => arr.reduce((acc, r) => acc + (Number(r.monto_total !== undefined ? r.monto_total : r.monto) || 0), 0);

  const totAlim = sumMonto(alimRows) || totViaticosMonto;
  const totPeajes = sumMonto(peajesRows);
  const totPension = sumMonto(pensionRows);
  const totMovil = sumMonto(movilRows);
  const totPext = sumMonto(pextRows);
  const totFeriados = sumMonto(feriadoRows);
  const totSubcont = sumMonto(subcontRows);
  const totExtra = sumMonto(extraRows);
  const totComb = sumMonto(combRows);
  const totCostoOperadores = sumMonto(operadorRows);

  let bloquesCostosHtml = '';

  if (alimRows.length > 0) {
    bloquesCostosHtml += `
      <div style="border: 1px solid #cbd5e1; margin-bottom: 5px; page-break-inside: avoid; break-inside: avoid;">
        <div style="background-color: #f1f5f9; padding: 4px 8px; font-size: 9.5px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
          <span>⬢ VIATICO ALIMENTACION PERSONAL</span>
          <span style="font-weight: 800; font-size: 9.5px; color: #0f172a;">Total: $${formatCLP(totAlim)}</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
          <thead>
            <tr style="background-color: #f8fafc; color: #0f172a; font-weight: 800; border-bottom: 1px solid #e2e8f0;">
              <th style="padding: 3px 4px; text-align: center; width: 18%; border-right: 1px solid #e2e8f0;">Fecha</th>
              <th style="padding: 3px 4px; text-align: left; width: 35%; border-right: 1px solid #e2e8f0;">Personal</th>
              <th style="padding: 3px 4px; text-align: left; border-right: 1px solid #e2e8f0;">Concepto</th>
              <th style="padding: 3px 4px; text-align: right; width: 20%;">Monto ($)</th>
            </tr>
          </thead>
          <tbody>
            ${alimRows.map(r => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 3px 4px; text-align: center; font-weight: bold; color: #0f172a; background-color: #f8fafc; border-right: 1px solid #e2e8f0;">${formatDateCL(r.fecha)}</td>
                <td style="padding: 3px 6px; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">${r.personal || r.nombre_personal || r.nombre || '—'}</td>
                <td style="padding: 3px 4px; font-weight: bold; color: #1e293b; border-right: 1px solid #e2e8f0;">${r.concepto_detalle || r.condicion_label || r.detalle || r.concepto || r.glosa || 'Alimentación Operador'}</td>
                <td style="padding: 3px 4px; text-align: right; font-weight: 800; font-size: 10px; color: #0f172a;">$${formatCLP(r.monto_total || r.monto || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  if (peajesRows.length > 0) {
    bloquesCostosHtml += `
      <div style="border: 1px solid #cbd5e1; margin-bottom: 5px; page-break-inside: avoid; break-inside: avoid;">
        <div style="background-color: #f1f5f9; padding: 4px 8px; font-size: 9.5px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
          <span>⬢ PEAJES Y TAG DE RUTA</span>
          <span style="font-weight: 800; font-size: 9.5px; color: #0f172a;">Total: $${formatCLP(totPeajes)}</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
          <thead>
            <tr style="background-color: #f8fafc; font-weight: 800; border-bottom: 1px solid #e2e8f0;">
              <th style="padding: 3px 4px; text-align: center; width: 14%; border-right: 1px solid #e2e8f0;">Fecha</th>
              <th style="padding: 3px 4px; text-align: center; width: 15%; border-right: 1px solid #e2e8f0;">Patente</th>
              <th style="padding: 3px 4px; text-align: left; width: 22%; border-right: 1px solid #e2e8f0;">Personal</th>
              <th style="padding: 3px 4px; text-align: left; border-right: 1px solid #e2e8f0;">Detalle / Ruta / Tag / Vehículo</th>
              <th style="padding: 3px 4px; text-align: right; width: 18%;">Monto ($)</th>
            </tr>
          </thead>
          <tbody>
            ${peajesRows.map(r => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 3px 4px; text-align: center; border-right: 1px solid #e2e8f0;">${formatDateCL(r.fecha)}</td>
                <td style="padding: 3px 4px; text-align: center; font-weight: 800; border-right: 1px solid #e2e8f0;">${r.patente || '—'}</td>
                <td style="padding: 3px 4px; font-weight: bold; border-right: 1px solid #e2e8f0;">${r.personal || r.nombre_personal || '—'}</td>
                <td style="padding: 3px 4px; border-right: 1px solid #e2e8f0;">${r.concepto_detalle || r.detalle || r.concepto || r.glosa || 'Peaje de ruta'}</td>
                <td style="padding: 3px 4px; text-align: right; font-weight: 800;">$${formatCLP(r.monto_total || r.monto || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  if (pensionRows.length > 0) {
    bloquesCostosHtml += `
      <div style="border: 1px solid #cbd5e1; margin-bottom: 5px; page-break-inside: avoid; break-inside: avoid;">
        <div style="background-color: #f1f5f9; padding: 4px 8px; font-size: 9.5px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
          <span>⬢ PENSIONES Y ALOJAMIENTO FAENA</span>
          <span style="font-weight: 800; font-size: 9.5px; color: #0f172a;">Total: $${formatCLP(totPension)}</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
          <thead>
            <tr style="background-color: #f8fafc; font-weight: 800; border-bottom: 1px solid #e2e8f0;">
              <th style="padding: 3px 4px; text-align: center; width: 14%; border-right: 1px solid #e2e8f0;">Fecha</th>
              <th style="padding: 3px 4px; text-align: left; width: 28%; border-right: 1px solid #e2e8f0;">Personal</th>
              <th style="padding: 3px 4px; text-align: left; border-right: 1px solid #e2e8f0;">Detalle / Alojamiento</th>
              <th style="padding: 3px 4px; text-align: right; width: 18%;">Monto ($)</th>
            </tr>
          </thead>
          <tbody>
            ${pensionRows.map(r => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 2px 4px; text-align: center; border-right: 1px solid #e2e8f0;">${formatDateCL(r.fecha)}</td>
                <td style="padding: 2px 4px; font-weight: bold; border-right: 1px solid #e2e8f0;">${r.personal || r.nombre_personal || '—'}</td>
                <td style="padding: 2px 4px; border-right: 1px solid #e2e8f0;">${r.concepto_detalle || r.detalle || r.concepto || r.glosa || 'Pensión / Hospedaje'}</td>
                <td style="padding: 2px 4px; text-align: right; font-weight: 800;">$${formatCLP(r.monto_total || r.monto || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  if (combRows.length > 0) {
    bloquesCostosHtml += `
      <div style="border: 1px solid #cbd5e1; margin-bottom: 5px; page-break-inside: avoid; break-inside: avoid;">
        <div style="background-color: #f1f5f9; padding: 4px 8px; font-size: 9.5px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
          <span>⬢ COMBUSTIBLE DIESEL EN RUTA Y FAENA</span>
          <span style="font-weight: 800; font-size: 9.5px; color: #0f172a;">Total: $${formatCLP(totComb)}</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
          <thead>
            <tr style="background-color: #f8fafc; font-weight: 800; border-bottom: 1px solid #e2e8f0;">
              <th style="padding: 3px 4px; text-align: center; width: 14%; border-right: 1px solid #e2e8f0;">Fecha</th>
              <th style="padding: 3px 4px; text-align: center; width: 14%; border-right: 1px solid #e2e8f0;">Patente</th>
              <th style="padding: 3px 4px; text-align: left; width: 24%; border-right: 1px solid #e2e8f0;">Chofer / Operador</th>
              <th style="padding: 3px 4px; text-align: left; border-right: 1px solid #e2e8f0;">Detalle / Litros</th>
              <th style="padding: 3px 4px; text-align: right; width: 18%;">Monto ($)</th>
            </tr>
          </thead>
          <tbody>
            ${combRows.map(r => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 3px 4px; text-align: center; border-right: 1px solid #e2e8f0;">${formatDateCL(r.fecha)}</td>
                <td style="padding: 3px 4px; text-align: center; font-weight: 800; border-right: 1px solid #e2e8f0;">${r.patente || '—'}</td>
                <td style="padding: 3px 4px; font-weight: bold; border-right: 1px solid #e2e8f0;">${r.personal || r.nombre_personal || '—'}</td>
                <td style="padding: 3px 4px; border-right: 1px solid #e2e8f0;">${r.concepto_detalle || r.detalle || (r.litros ? `${r.litros} Lts Diesel` : 'Carga Combustible')}</td>
                <td style="padding: 3px 4px; text-align: right; font-weight: 800;">$${formatCLP(r.monto_total || r.monto || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  if (movilRows.length > 0) {
    bloquesCostosHtml += `
      <div style="border: 1px solid #cbd5e1; margin-bottom: 5px; page-break-inside: avoid; break-inside: avoid;">
        <div style="background-color: #f1f5f9; padding: 4px 8px; font-size: 9.5px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
          <span>⬢ MOVILIZACION PERSONAL (PASAJES, UBER, TAXI)</span>
          <span style="font-weight: 800; font-size: 9.5px; color: #0f172a;">Total: $${formatCLP(totMovil)}</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
          <thead>
            <tr style="background-color: #f8fafc; color: #0f172a; font-weight: 800; border-bottom: 1px solid #e2e8f0;">
              <th style="padding: 3px 4px; text-align: center; width: 14%; border-right: 1px solid #e2e8f0;">Fecha</th>
              <th style="padding: 3px 4px; text-align: left; width: 28%; border-right: 1px solid #e2e8f0;">Personal</th>
              <th style="padding: 3px 4px; text-align: left; border-right: 1px solid #e2e8f0;">Detalle / Tramo</th>
              <th style="padding: 3px 4px; text-align: right; width: 18%;">Monto ($)</th>
            </tr>
          </thead>
          <tbody>
            ${movilRows.map(r => {
              const textoMovil = (r.tipo_movilizacion && r.ruta_detalle && !String(r.concepto_detalle || '').includes(r.ruta_detalle))
                ? `${r.tipo_movilizacion} — ${r.ruta_detalle}`
                : (r.concepto_detalle || r.detalle || r.concepto || r.glosa || '—');
              return `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 3px 4px; text-align: center; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">${formatDateCL(r.fecha)}</td>
                <td style="padding: 3px 4px; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">${r.personal || r.nombre_personal || '—'}</td>
                <td style="padding: 3px 4px; font-weight: bold; color: #1e293b; border-right: 1px solid #e2e8f0;">${textoMovil}</td>
                <td style="padding: 3px 4px; text-align: right; font-weight: 800; font-size: 10px; color: #0f172a;">$${formatCLP(r.monto_total || r.monto || 0)}</td>
              </tr>
            `;}).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  if (pextRows.length > 0 || feriadoRows.length > 0) {
    const combinedPext = [...pextRows, ...feriadoRows];
    bloquesCostosHtml += `
      <div style="border: 1px solid #cbd5e1; margin-bottom: 5px; page-break-inside: avoid; break-inside: avoid;">
        <div style="background-color: #f1f5f9; padding: 4px 8px; font-size: 9.5px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
          <span>⬢ PERSONAL EXTERNO, RIGGERS Y FERIADOS</span>
          <span style="font-weight: 800; font-size: 9.5px; color: #0f172a;">Total: $${formatCLP(totPext + totFeriados)}</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
          <thead>
            <tr style="background-color: #f8fafc; color: #0f172a; font-weight: 800; border-bottom: 1px solid #e2e8f0;">
              <th style="padding: 3px 4px; text-align: center; width: 14%; border-right: 1px solid #e2e8f0;">Fecha</th>
              <th style="padding: 3px 4px; text-align: left; width: 28%; border-right: 1px solid #e2e8f0;">Personal</th>
              <th style="padding: 3px 4px; text-align: left; border-right: 1px solid #e2e8f0;">Detalle / Servicio</th>
              <th style="padding: 3px 4px; text-align: right; width: 18%;">Monto ($)</th>
            </tr>
          </thead>
          <tbody>
            ${combinedPext.map(r => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 3px 4px; text-align: center; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">${formatDateCL(r.fecha)}</td>
                <td style="padding: 3px 4px; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">${r.personal || r.nombre_personal || '—'}</td>
                <td style="padding: 3px 4px; font-weight: bold; color: #1e293b; border-right: 1px solid #e2e8f0;">${r.concepto_detalle || r.detalle || r.concepto || r.glosa || 'Apoyo Rigger / Personal'}</td>
                <td style="padding: 3px 4px; text-align: right; font-weight: 800; font-size: 10px; color: #0f172a;">$${formatCLP(r.monto_total || r.monto || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  if (subcontRows.length > 0) {
    bloquesCostosHtml += `
      <div style="border: 1px solid #cbd5e1; margin-bottom: 5px; page-break-inside: avoid; break-inside: avoid;">
        <div style="background-color: #f1f5f9; padding: 4px 8px; font-size: 9.5px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
          <span>⬢ SUBCONTRATACION FLETE EXTERNO</span>
          <span style="font-weight: 800; font-size: 9.5px; color: #0f172a;">Total: $${formatCLP(totSubcont)}</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
          <thead>
            <tr style="background-color: #f8fafc; color: #0f172a; font-weight: 800; border-bottom: 1px solid #e2e8f0;">
              <th style="padding: 3px 4px; text-align: center; width: 16%; border-right: 1px solid #e2e8f0;">Fecha</th>
              <th style="padding: 3px 4px; text-align: left; border-right: 1px solid #e2e8f0;">Descripción / Servicio Flete Subcontratado</th>
              <th style="padding: 3px 4px; text-align: right; width: 20%;">Monto ($)</th>
            </tr>
          </thead>
          <tbody>
            ${subcontRows.map(r => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 3px 4px; text-align: center; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">${formatDateCL(r.fecha)}</td>
                <td style="padding: 3px 4px; font-weight: bold; color: #1e293b; border-right: 1px solid #e2e8f0;">${r.concepto_detalle || r.detalle || r.descripcion || r.concepto || r.glosa || '—'}</td>
                <td style="padding: 3px 4px; text-align: right; font-weight: 800; font-size: 10px; color: #0f172a;">$${formatCLP(r.monto_total || r.monto || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  if (extraRows.length > 0) {
    bloquesCostosHtml += `
      <div style="border: 1px solid #cbd5e1; margin-bottom: 5px; page-break-inside: avoid; break-inside: avoid;">
        <div style="background-color: #f1f5f9; padding: 4px 8px; font-size: 9.5px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
          <span>⬢ GASTOS EXTRAORDINARIOS</span>
          <span style="font-weight: 800; font-size: 9.5px; color: #0f172a;">Total: $${formatCLP(totExtra)}</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
          <thead>
            <tr style="background-color: #f8fafc; color: #0f172a; font-weight: 800; border-bottom: 1px solid #e2e8f0;">
              <th style="padding: 3px 4px; text-align: center; width: 18%; border-right: 1px solid #e2e8f0;">Fecha</th>
              <th style="padding: 3px 4px; text-align: left; border-right: 1px solid #e2e8f0;">Detalle / Gastos Máquina / Faena</th>
              <th style="padding: 3px 4px; text-align: right; width: 20%;">Monto ($)</th>
            </tr>
          </thead>
          <tbody>
            ${extraRows.map(r => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 3px 4px; text-align: center; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">${formatDateCL(r.fecha)}</td>
                <td style="padding: 3px 4px; font-weight: bold; color: #1e293b; border-right: 1px solid #e2e8f0;">${r.concepto_detalle || r.detalle || r.concepto || r.glosa || '—'}</td>
                <td style="padding: 3px 4px; text-align: right; font-weight: 800; font-size: 10px; color: #0f172a;">$${formatCLP(r.monto_total || r.monto || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  if (operadorRows.length > 0) {
    bloquesCostosHtml += `
      <div style="border: 1px solid #cbd5e1; margin-bottom: 5px; page-break-inside: avoid; break-inside: avoid;">
        <div style="background-color: #f1f5f9; padding: 4px 8px; font-size: 9.5px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
          <span>⬢ COSTO VALOR HORA OPERADOR (HORAS REPORT)</span>
          <span style="font-weight: 800; font-size: 9.5px; color: #0f172a;">Total: $${formatCLP(totCostoOperadores)}</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
          <thead>
            <tr style="background-color: #f8fafc; color: #0f172a; font-weight: 800; border-bottom: 1px solid #e2e8f0;">
              <th style="padding: 3px 4px; text-align: left; width: 25%; border-right: 1px solid #e2e8f0;">Equipo (Patente / Subcat)</th>
              <th style="padding: 3px 4px; text-align: left; border-right: 1px solid #e2e8f0;">Categoría Equipo / Maestra</th>
              <th style="padding: 3px 4px; text-align: right; width: 18%; border-right: 1px solid #e2e8f0;">Valor Hora ($)</th>
              <th style="padding: 3px 4px; text-align: right; width: 15%; border-right: 1px solid #e2e8f0;">Horas Report</th>
              <th style="padding: 3px 4px; text-align: right; width: 20%;">Total Costo Operador ($)</th>
            </tr>
          </thead>
          <tbody>
            ${operadorRows.map(r => {
              const patOp = r.patente && r.patente !== 'S/P' ? r.patente : (patenteGruaReal || asignaciones?.equipos?.[0]?.patente || 'S/P');
              const subcatOp = r.subcategoria || modeloGruaReal || 'Grúa Telescópica';
              const hrsOp = Number(r.cantidad_unidades || r.horas_report || 0);
              const valHoraOp = Number(r.precio_unitario || r.valor_hora || 0);
              return `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 3px 4px; border-right: 1px solid #e2e8f0;">
                  <div style="font-weight: 800; color: #0f172a; font-size: 10px;">${patOp}</div>
                  <div style="font-size: 8.5px; color: #475569; font-weight: bold;">${subcatOp}</div>
                </td>
                <td style="padding: 3px 4px; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">${r.nombre_personal ? `${r.nombre_personal} (${r.rol_personal || 'OPERADOR'})` : (r.rol_personal || r.categoria || 'OPERADOR')}</td>
                <td style="padding: 3px 4px; text-align: right; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">$${formatCLP(valHoraOp)}</td>
                <td style="padding: 3px 4px; text-align: right; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">${hrsOp > 0 ? formatMinutesToHHMM(Math.round(hrsOp * 60)) : '00:00'}</td>
                <td style="padding: 3px 4px; text-align: right; font-weight: 800; font-size: 10px; color: #0f172a;">$${formatCLP(r.monto_total || r.monto || 0)}</td>
              </tr>
            `;}).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  if (!bloquesCostosHtml) {
    bloquesCostosHtml = `
      <div style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: center; color: #64748b; font-weight: 600; font-size: 9.5px; background-color: #f8fafc; font-style: italic;">
        Sin costos operacionales directos adicionales imputados a la orden ($0)
      </div>
    `;
  }

  // Cálculos financieros y resultado del servicio
  const totalHoras = Number(its?.total_horas_report) || totalHorasReportNum;
  const totalVenta = esValorFijo 
    ? (valorFijo + valorFlete)
    : (Number(its?.total_ingresos_facturables) || (totalHoras * valorHora + valorFlete));
  const totalCostos = Number(its?.total_costos_operacionales) || (totAlim + totPeajes + totPension + totMovil + totPext + totFeriados + totSubcont + totExtra + totComb + totCostoOperadores);
  const utilidad = Number(its?.utilidad_bruta) || (totalVenta - totalCostos);
  const margen = totalVenta > 0 ? Number(((utilidad / totalVenta) * 100).toFixed(1)) : 0;
  const getPct = (val) => totalVenta > 0 ? ((Number(val || 0) / totalVenta) * 100).toFixed(1) : '0.0';

  // Resumen de costos operacionales mostrando estrictamente los 10 puntos conceptuales (SPEC-121 / Jorge Ponce)
  const costosResumenItems = [
    { num: 1, label: 'Viáticos de Alimentación', monto: totAlim },
    { num: 2, label: 'Peajes y TAG', monto: totPeajes },
    { num: 3, label: 'Combustibles Diesel', monto: totComb },
    { num: 4, label: 'Pensiones y Alojamiento', monto: totPension },
    { num: 5, label: 'Movilización y Traslados', monto: totMovil },
    { num: 6, label: 'Personal Externo y Riggers', monto: totPext },
    { num: 7, label: 'Feriados y Domingos', monto: totFeriados },
    { num: 8, label: 'Subcontratación Flete Externo', monto: totSubcont },
    { num: 9, label: 'Gastos Extraordinarios', monto: totExtra },
    { num: 10, label: 'Costo Valor Hora Operador', monto: totCostoOperadores }
  ];

  const costosResumenHtml = costosResumenItems.map(item => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 2.5px 5px; color: #0f172a; font-weight: ${item.monto > 0 ? '700' : 'normal'};">
        ${item.num}. ${item.label}
      </td>
      <td style="padding: 2.5px 5px; text-align: right; font-weight: 800; color: ${item.monto > 0 ? '#0f172a' : '#94a3b8'};">
        ${formatCLP(item.monto)}
      </td>
      <td style="padding: 2.5px 5px; text-align: right; font-weight: 800; color: #64748b;">
        ${getPct(item.monto)}%
      </td>
    </tr>
  `).join('');

  // Firmas FES (Paso 1, Paso 2, Paso 3) e Historial Trazabilidad de Rechazos
  const f1 = firmas?.paso1 || {};
  const f2 = firmas?.paso2 || {};
  const f3 = firmas?.paso3 || {};

  // GOBERNANZA FES: Si el documento está en corrección, borrador o rechazado (en poder de Yiara),
  // los sellos superiores se presentan en blanco (⏳ PENDIENTE). Ningún rechazo se estampa como aprobación.
  const estadoItsUpper = String(its?.estado_its || '').toUpperCase();
  const esDocEnManosYiara = ['EN_CORRECCION', 'BORRADOR', 'RECHAZADO'].includes(estadoItsUpper) || f1?.estado_paso === 'PENDIENTE';

  const paso1Aprobado = !esDocEnManosYiara && Boolean(f1?.id_fes && f1?.aprueba_rechaza === 'APRUEBA' && f1?.estado_paso === 'APROBADO');
  const paso2Aprobado = !esDocEnManosYiara && Boolean(f2?.id_fes && f2?.aprueba_rechaza === 'APRUEBA' && f2?.estado_paso === 'APROBADO');
  const paso3Aprobado = !esDocEnManosYiara && Boolean(f3?.id_fes && f3?.aprueba_rechaza === 'APRUEBA' && f3?.estado_paso === 'APROBADO');

  const historialEventos = firmas?.historialEventos || [];
  let historialRechazosHtml = '';
  if (historialEventos.length > 0) {
    const histRows = historialEventos.map((ev, idx) => {
      const esRechazo = ev.aprueba_rechaza === 'RECHAZA';
      const badgeBg = esRechazo ? '#fee2e2' : '#dcfce7';
      const badgeColor = esRechazo ? '#b91c1c' : '#15803d';
      const badgeBorder = esRechazo ? '#fca5a5' : '#86efac';
      const badgeText = esRechazo ? 'DEVOLUCIÓN / RECHAZO' : 'APROBADO / FIRMA';
      const obsText = ev.observaciones || ev.motivo_rechazo || '—';

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f8fafc;'}">
          <td style="padding: 3px 5px; white-space: nowrap; color: #475569; border-right: 1px solid #e2e8f0;">${formatDateTimeCL(ev.fecha_firma)}</td>
          <td style="padding: 3px 5px; font-weight: 700; color: #0f172a; border-right: 1px solid #e2e8f0;">${ev.nombre_usuario || 'Usuario'}</td>
          <td style="padding: 3px 5px; color: #64748b; border-right: 1px solid #e2e8f0;">${ev.rol_nom || 'Operaciones'}</td>
          <td style="padding: 3px 5px; text-align: center; border-right: 1px solid #e2e8f0;">
            <span style="display: inline-block; padding: 1px 5px; font-size: 7.5px; font-weight: 800; border-radius: 3px; background-color: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder};">
              ${badgeText}
            </span>
          </td>
          <td style="padding: 3px 5px; color: #0f172a; font-weight: ${esRechazo ? '700' : 'normal'}; border-right: 1px solid #e2e8f0;">
            ${obsText}
          </td>
          <td style="padding: 3px 5px; font-family: monospace; font-size: 7.5px; color: #0284c7; text-align: center;">
            ${(ev.codigo_validacion || '—').slice(0, 18)}...
          </td>
        </tr>
      `;
    }).join('');

    historialRechazosHtml = `
      <div style="margin-top: 8px;">
        <div style="font-size: 8.5px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.3px;">
          HISTORIAL CRONOLÓGICO DE FIRMAS, OBSERVACIONES Y RECHAZOS (TRAZABILIDAD FES)
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 8px; border: 1px solid #cbd5e1;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #475569; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid #cbd5e1;">
              <th style="padding: 3px 5px; text-align: left; width: 14%; border-right: 1px solid #cbd5e1;">Fecha y Hora</th>
              <th style="padding: 3px 5px; text-align: left; width: 18%; border-right: 1px solid #cbd5e1;">Firmante</th>
              <th style="padding: 3px 5px; text-align: left; width: 14%; border-right: 1px solid #cbd5e1;">Rol</th>
              <th style="padding: 3px 5px; text-align: center; width: 15%; border-right: 1px solid #cbd5e1;">Evento</th>
              <th style="padding: 3px 5px; text-align: left; width: 27%; border-right: 1px solid #cbd5e1;">Observación / Motivo</th>
              <th style="padding: 3px 5px; text-align: center; width: 12%;">Código FES</th>
            </tr>
          </thead>
          <tbody>
            ${histRows}
          </tbody>
        </table>
      </div>
    `;
  }

  const obs = its?.observaciones || 'Servicio operado y concluido conforme a especificaciones contractuales de la Orden de Trabajo.';

  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>INFORME_TERMINO_SERVICIO_${folio}_COT_${cotizacion}</title>
    <style>
        @page { size: letter portrait; margin: 8mm; }
        * { box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; background: #ffffff; color: #0f172a; margin: 0; padding: 10px; font-size: 10.5px; line-height: 1.35; }
        table { border-collapse: collapse; width: 100%; }
        @media print {
            body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>

    <!-- Header Membretado Oficial con Logo Corporativo San Pablo -->
    <table style="width: 100%; border-bottom: 2.5px solid #1e3a8a; padding-bottom: 8px; margin-bottom: 12px; border-collapse: collapse;">
        <tr>
            <td style="width: 28%; vertical-align: middle; text-align: left;">
                <img src="${LOGO_GSP_BASE64}" style="max-height: 48px; max-width: 180px; object-fit: contain; display: block;" alt="Grúas San Pablo" />
            </td>
            <td style="width: 44%; vertical-align: middle; text-align: center;">
                <h1 style="font-size: 15px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
                    INFORME TÉRMINO DE SERVICIO
                </h1>
                <div style="font-size: 10.5px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin-top: 2px; letter-spacing: 0.5px;">
                    (${regimen})
                </div>
            </td>
            <td style="width: 28%; vertical-align: middle; text-align: right;">
                <div style="display: inline-block; text-align: right;">
                    <div style="background-color: #1e1b4b; border: 1.5px solid #312e81; padding: 2px 7px; border-radius: 4px; font-size: 10.5px; font-weight: 900; color: #ffffff; font-family: monospace; display: inline-block;">
                        FOLIO N° ${folio} <span style="color: #93c5fd; font-weight: 800; font-size: 9px; margin-left: 2px;">(V${version})</span>
                    </div>
                    <div style="background-color: #fef3c7; border: 1.5px solid #f59e0b; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 900; color: #92400e; margin-top: 2px; display: inline-block;">
                        Cotización #${cotizacion}
                    </div>
                    <div style="font-size: 9px; color: #0f172a; font-weight: 700; margin-top: 2px;">Fecha Emisión: <strong>${fEmision}</strong></div>
                </div>
            </td>
        </tr>
    </table>

    <!-- 1. DATOS DEL SERVICIO INTEGRAL -->
    <div style="margin-bottom: 12px;">
        <div style="font-size: 10.5px; font-weight: 900; text-transform: uppercase; background-color: #f1f5f9; color: #0f172a; padding: 5px 8px; border: 1px solid #cbd5e1; border-bottom: none; letter-spacing: 0.3px;">
            1. DATOS DEL SERVICIO INTEGRAL
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9.5px; border: 1px solid #cbd5e1; text-transform: uppercase;">
            <tbody>
                <tr style="border-bottom: 1px solid #cbd5e1;">
                    <td style="width: 25%; font-weight: 800; background-color: #f8fafc; color: #0f172a; padding: 4px 6px; border-right: 1px solid #cbd5e1;">NOMBRE CLIENTE:</td>
                    <td style="width: 25%; padding: 4px 6px; border-right: 1px solid #cbd5e1; font-weight: 800; color: #0f172a;">${cliente}</td>
                    <td style="width: 25%; font-weight: 800; background-color: #f8fafc; color: #0f172a; padding: 4px 6px; border-right: 1px solid #cbd5e1;">RUT CLIENTE:</td>
                    <td style="width: 25%; padding: 4px 6px; font-weight: 800; color: #0f172a;">${rut}</td>
                </tr>
                <tr style="border-bottom: 1px solid #cbd5e1;">
                    <td style="font-weight: 800; background-color: #f8fafc; color: #0f172a; padding: 4px 6px; border-right: 1px solid #cbd5e1;">EMPRESA FACTURACIÓN:</td>
                    <td style="padding: 4px 6px; border-right: 1px solid #cbd5e1; font-weight: 800; color: #047857;">${empresa}</td>
                    <td style="font-weight: 800; background-color: #f8fafc; color: #0f172a; padding: 4px 6px; border-right: 1px solid #cbd5e1;">EJECUTIVO COMERCIAL:</td>
                    <td style="padding: 4px 6px; font-weight: 800; color: #1e293b;">${vendedor}</td>
                </tr>
                <tr style="border-bottom: 1px solid #cbd5e1;">
                    <td style="font-weight: 800; background-color: #f8fafc; color: #0f172a; padding: 4px 6px; border-right: 1px solid #cbd5e1;">FECHAS DEL SERVICIO:</td>
                    <td style="padding: 4px 6px; border-right: 1px solid #cbd5e1; font-weight: 800; color: #0f172a;">${fechas}</td>
                    <td style="font-weight: 800; background-color: #f8fafc; color: #0f172a; padding: 4px 6px; border-right: 1px solid #cbd5e1;">CIUDAD DE LA OBRA:</td>
                    <td style="padding: 4px 6px; font-weight: 800; color: #1e293b;">${ciudad}</td>
                </tr>
                <tr style="border-bottom: 1px solid #cbd5e1;">
                    <td style="font-weight: 800; background-color: #f8fafc; color: #0f172a; padding: 4px 6px; border-right: 1px solid #cbd5e1;">TIPO DE SERVICIO:</td>
                    <td colspan="3" style="padding: 4px 6px; font-weight: 800; color: #0891b2;">${tipoServicio}</td>
                </tr>
                <tr style="border-bottom: 1px solid #cbd5e1; background-color: #fef3c7;">
                    <td colspan="4" style="padding: 0;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
                            <tbody>
                                <tr>
                                    <td style="width: 50%; padding: 4.5px 6px; border-right: 1px solid #cbd5e1; color: #78350f;">
                                        <strong style="font-weight: 800;">VALOR FIJO:</strong> <span style="font-weight: 800; color: #1e3a8a; font-size: 10px;">$${formatCLP(valorFijo)}</span>
                                    </td>
                                    <td style="width: 50%; padding: 4.5px 6px; color: #78350f;">
                                        <strong style="font-weight: 800;">VALOR FLETE / TRASLADO:</strong> <span style="font-weight: 800; color: #3730a3; font-size: 10px;">$${formatCLP(valorFlete)}</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td colspan="4" style="padding: 0; border-top: 1px solid #cbd5e1;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 9.5px; text-transform: uppercase;">
                            <thead>
                                <tr style="background-color: #f8fafc; border-bottom: 1px solid #cbd5e1; font-weight: 800; color: #0f172a;">
                                    <th style="padding: 4px 6px; text-align: left; border-right: 1px solid #cbd5e1; width: 24%;">EQUIPO Y SUBCATEGORÍA</th>
                                    <th style="padding: 4px 6px; text-align: center; border-right: 1px solid #cbd5e1; width: 16%;">HRS MÍNIMAS</th>
                                    <th style="padding: 4px 6px; text-align: right; border-right: 1px solid #cbd5e1; width: 16%;">VALOR HORA</th>
                                    <th style="padding: 4px 6px; text-align: left; border-right: 1px solid #cbd5e1; width: 18%;">OT(S) ASOCIADA(S)</th>
                                    <th style="padding: 4px 6px; text-align: left; width: 26%;">PERSONAL Y CARGO ASIGNADO</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${equipos.map(eq => `
                                    <tr style="border-bottom: 1px solid #e2e8f0;">
                                        <td style="padding: 4px 6px; border-right: 1px solid #cbd5e1;">
                                            <div style="font-weight: 800; color: #0f172a;">${eq.patente || '—'}</div>
                                            <div style="font-size: 8.5px; color: #475569; font-weight: bold;">${eq.subcategoria || ''}</div>
                                            ${eq.glosa_comercial ? `<div style="font-size: 8px; color: #64748b; font-style: italic; margin-top: 1px;">${eq.glosa_comercial}</div>` : ''}
                                        </td>
                                        <td style="padding: 4px 6px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 800; color: #92400e;">
                                            ${eq.horas_minimas || '9 HORAS DIARIAS'}
                                        </td>
                                        <td style="padding: 4px 6px; text-align: right; border-right: 1px solid #cbd5e1; font-weight: 800; color: #047857; font-family: monospace;">
                                            ${eq.valor_hora_display || `$${formatCLP(eq.valor_hora || 0)}`}
                                        </td>
                                        <td style="padding: 4px 6px; border-right: 1px solid #cbd5e1; font-weight: 800; color: #1e3a8a;">
                                            ${eq.ots_asociadas || '—'}
                                        </td>
                                        <td style="padding: 4px 6px; font-weight: 800; color: #0f172a;">
                                            ${eq.personal_tripulacion || '—'}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- 2. CONTROL DE FLOTA Y VALIDACION DE HORAS -->
    <div style="margin-bottom: 10px;">
        <div style="font-size: 10.5px; font-weight: 900; text-transform: uppercase; background-color: #f1f5f9; color: #0f172a; padding: 5px 8px; border: 1px solid #cbd5e1; border-bottom: none; letter-spacing: 0.3px;">
            2. CONTROL DE FLOTA Y VALIDACION DE HORAS
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9px; border: 1px solid #cbd5e1;">
            <thead>
                <tr style="background-color: #f8fafc; font-weight: 700; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; font-size: 8.5px;">
                    <th style="padding: 3.5px 4px; text-align: center; border-right: 1px solid #cbd5e1;">Fecha</th>
                    <th style="padding: 3.5px 4px; text-align: center; border-right: 1px solid #cbd5e1;">N° OT</th>
                    <th style="padding: 3.5px 4px; text-align: center; border-right: 1px solid #cbd5e1;">Tipo Serv.</th>
                    <th style="padding: 3.5px 4px; text-align: center; border-right: 1px solid #cbd5e1;">Patente</th>
                    <th style="padding: 3.5px 4px; text-align: center; border-right: 1px solid #cbd5e1;">Salida</th>
                    <th style="padding: 3.5px 4px; text-align: center; border-right: 1px solid #cbd5e1;">Llegada</th>
                    <th style="padding: 3.5px 4px; text-align: center; border-right: 1px solid #cbd5e1;">Término</th>
                    <th style="padding: 3.5px 4px; text-align: center; border-right: 1px solid #cbd5e1;">Retorno</th>
                    <th style="padding: 3.5px 4px; text-align: center; border-right: 1px solid #cbd5e1;">Colación</th>
                    <th style="padding: 3.5px 4px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 800; color: #1d4ed8;">Hrs Serv.</th>
                    <th style="padding: 3.5px 4px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 800; color: #0284c7;">Hrs Viát.</th>
                    <th style="padding: 3.5px 4px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 800; color: #047857;">Hrs Report</th>
                    <th style="padding: 3.5px 4px; text-align: center;">N° Report</th>
                </tr>
            </thead>
            <tbody>
                ${jornadasRows || '<tr><td colspan="13" style="padding: 8px; text-align: center; color: #64748b;">Sin jornadas registradas</td></tr>'}
                <!-- Subtotal Fila Final -->
                <tr style="background-color: #e0e7ff; border-top: 2px solid #cbd5e1; font-weight: bold; font-size: 9px;">
                    <td colspan="9" style="padding: 4px 6px; text-align: right; font-weight: 900; color: #0f172a; border-right: 1px solid #cbd5e1;">TOTALES JORNADAS:</td>
                    <td style="padding: 4px 4px; text-align: center; font-weight: 800; color: #1d4ed8; border-right: 1px solid #cbd5e1; font-family: monospace;">${formatMinutesToHHMM(totMinServicio)}</td>
                    <td style="padding: 4px 4px; text-align: center; font-weight: 800; color: #0284c7; border-right: 1px solid #cbd5e1; font-family: monospace;">${formatMinutesToHHMM(totMinViaticos)}</td>
                    <td style="padding: 4px 4px; text-align: center; font-family: monospace; font-weight: 900; color: #064e3b; background-color: #a7f3d0; border-right: 1px solid #cbd5e1; font-size: 9.5px;">
                        ${formatMinutesToHHMM(Math.round(totalHorasReportNum * 60))}
                    </td>
                    <td style="padding: 4px 4px; background-color: #e0e7ff;"></td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- 3. PLANILLA DE COSTOS OPERACIONALES A PAGAR (PARA CONTABILIDAD) -->
    <div style="margin-bottom: 12px;">
        <div style="font-size: 10.5px; font-weight: 900; text-transform: uppercase; background-color: #f1f5f9; color: #0f172a; padding: 5px 8px; border: 1px solid #cbd5e1; border-bottom: none; letter-spacing: 0.3px; page-break-after: avoid; break-after: avoid;">
            3. PLANILLA DE COSTOS OPERACIONALES A PAGAR (PARA CONTABILIDAD)
        </div>
        ${bloquesCostosHtml}
    </div>

    <!-- 4. RESULTADO DEL SERVICIO -->
    <div style="margin-bottom: 12px; border: 1px solid #cbd5e1;">
        <div style="font-size: 10.5px; font-weight: 900; text-transform: uppercase; background-color: #f1f5f9; color: #0f172a; padding: 5px 8px; border-bottom: 1px solid #cbd5e1;">
            4. RESULTADO DEL SERVICIO
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
            <tbody>
                <tr>
                    <td style="width: 58%; vertical-align: top; padding: 6px; border-right: 1px solid #cbd5e1; background-color: #fafafa;">
                        <!-- Venta -->
                        <div style="border: 1px solid #a7f3d0; margin-bottom: 6px; background-color: #ffffff;">
                            <div style="background-color: #ecfdf5; padding: 4px 6px; font-weight: 800; color: #065f46; font-size: 9.5px; border-bottom: 1px solid #a7f3d0;">
                                A. RESUMEN DE INGRESOS TOTALES (VENTA)
                            </div>
                            <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
                                <tbody>
                                ${esValorFijo ? `
                                    <tr style="border-bottom: 1px solid #f1f5f9;">
                                        <td style="padding: 3px 5px; font-weight: bold;">1. Servicio Valor Fijo / Suma Alzada</td>
                                        <td style="padding: 3px 5px; text-align: right; font-weight: 800;">$${formatCLP(valorFijo)} (${getPct(valorFijo)}%)</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f1f5f9;">
                                        <td style="padding: 3px 5px; font-weight: bold;">2. Ingresos por Horas Trabajadas</td>
                                        <td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">$0 (INCLUIDO EN VALOR FIJO)</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f1f5f9;">
                                        <td style="padding: 3px 5px; font-weight: bold;">3. Ingreso por Fletes / Traslados</td>
                                        <td style="padding: 3px 5px; text-align: right; font-weight: 800;">$${formatCLP(valorFlete)} (${getPct(valorFlete)}%)</td>
                                    </tr>
                                ` : `
                                    <tr style="border-bottom: 1px solid #f1f5f9;">
                                        <td style="padding: 3px 5px; font-weight: bold;">1. Ingresos Horas Trabajadas</td>
                                        <td style="padding: 3px 5px; text-align: right; font-weight: 800;">$${formatCLP(Math.max(0, totalVenta - valorFijo - valorFlete))} (${getPct(totalVenta - valorFijo - valorFlete)}%)</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f1f5f9;">
                                        <td style="padding: 3px 5px; font-weight: bold;">2. Ingreso por Servicio Fijo</td>
                                        <td style="padding: 3px 5px; text-align: right; font-weight: 800;">$${formatCLP(valorFijo)} (${getPct(valorFijo)}%)</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f1f5f9;">
                                        <td style="padding: 3px 5px; font-weight: bold;">3. Ingreso por Fletes / Traslados</td>
                                        <td style="padding: 3px 5px; text-align: right; font-weight: 800;">$${formatCLP(valorFlete)} (${getPct(valorFlete)}%)</td>
                                    </tr>
                                `}
                                    <tr style="background-color: #d1fae5; font-weight: bold;">
                                        <td style="padding: 4px 5px; color: #064e3b;">TOTAL INGRESOS FACTURABLES:</td>
                                        <td style="padding: 4px 5px; text-align: right; font-weight: 900; color: #064e3b; font-size: 10.5px;">$${formatCLP(totalVenta)} (100%)</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Costos -->
                        <div style="border: 1px solid #cbd5e1; margin-bottom: 6px; background-color: #ffffff;">
                            <div style="background-color: #f8fafc; padding: 4px 6px; font-weight: 800; color: #0f172a; font-size: 9.5px; border-bottom: 1px solid #cbd5e1;">
                                B. RESUMEN DE COSTOS OPERACIONALES (EGRESOS)
                            </div>
                            <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
                                <thead>
                                    <tr style="background-color: #f1f5f9; color: #0f172a; font-size: 9px; font-weight: 800; text-transform: uppercase;">
                                        <th style="padding: 3px 5px; text-align: left;">Concepto</th>
                                        <th style="padding: 3px 5px; text-align: right;">Monto ($)</th>
                                        <th style="padding: 3px 5px; text-align: right;">% s/ Venta</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${costosResumenHtml}
                                    <tr style="background-color: #fef3c7; font-weight: bold;">
                                        <td style="padding: 4px 5px; color: #92400e;">TOTAL COSTOS OPERACIONALES:</td>
                                        <td style="padding: 4px 5px; text-align: right; font-weight: 900; color: #92400e; font-size: 10.5px;">$${formatCLP(totalCostos)}</td>
                                        <td style="padding: 4px 5px; text-align: right; font-weight: 900; color: #92400e;">${getPct(totalCostos)}%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Banner Resultado -->
                        <div style="padding: 6px 8px; border-radius: 4px; background-color: ${utilidad >= 0 ? '#ecfdf5' : '#fff1f2'}; border: 1px solid ${utilidad >= 0 ? '#a7f3d0' : '#fecdd3'}; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong style="font-size: 10px; font-weight: 800; color: ${utilidad >= 0 ? '#065f46' : '#9f1239'}; display: block;">RESULTADO DEL SERVICIO</strong>
                                <span style="font-size: 9px; font-weight: 700; color: #1e293b;">Margen Operacional Neto</span>
                            </div>
                            <div style="text-align: right;">
                                <strong style="font-size: 13px; font-weight: 900; color: ${utilidad >= 0 ? '#047857' : '#be123c'}; display: block;">$${formatCLP(utilidad)}</strong>
                                <span style="font-size: 10px; font-weight: 800; color: ${utilidad >= 0 ? '#065f46' : '#9f1239'};">Margen: ${margen}%</span>
                            </div>
                        </div>
                    </td>
                    <td style="width: 42%; vertical-align: top; padding: 6px;">
                        <div style="font-size: 9.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 3px;">OBSERVACIÓN DEL SERVICIO:</div>
                        <div style="font-size: 9.5px; color: #0f172a; font-weight: 600; min-height: 140px; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 7px; border-radius: 4px; white-space: pre-wrap; word-break: break-word; line-height: 1.45;">${obs}</div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- 5. SELLOS OFICIALES DE FIRMA ELECTRÓNICA SIMPLE (FES) Y TRAZABILIDAD -->
    <div style="margin-top: 10px; page-break-inside: avoid;">
        <div style="font-size: 9.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">
            5. SELLOS OFICIALES DE FIRMA ELECTRÓNICA SIMPLE (FES) Y TRAZABILIDAD
        </div>
        <table style="width: 100%; border-collapse: separate; border-spacing: 5px 0; font-size: 9px; margin-left: -5px; margin-right: -5px;">
            <tbody>
                <tr>
                    <!-- Columna 1: Elaboró (Analista / Operaciones) -->
                    <td style="width: 33.33%; vertical-align: top; border: ${paso1Aprobado ? '1.5px solid #10b981' : '1px dashed #cbd5e1'}; background-color: ${paso1Aprobado ? '#f0fdf4' : '#f8fafc'}; border-radius: 4px; padding: 6px;">
                        <div style="font-weight: 800; color: ${paso1Aprobado ? '#047857' : '#64748b'}; text-transform: uppercase; font-size: 8px; border-bottom: 1px solid ${paso1Aprobado ? '#a7f3d0' : '#e2e8f0'}; padding-bottom: 3px; margin-bottom: 4px; display: flex; justify-content: space-between;">
                            <span>1. ELABORACIÓN</span>
                            <span>${paso1Aprobado ? '✓ FES' : '⏳ PENDIENTE'}</span>
                        </div>
                        ${paso1Aprobado ? `
                            <div style="font-size: 9px; font-weight: 800; color: #0f172a;">${f1.nombre_usuario || 'Yiara Mendoza'}</div>
                            <div style="font-size: 8px; color: #475569;">${f1.rol_nom || 'Analista PMO / Operaciones'}</div>
                            <div style="font-size: 7.5px; color: #0369a1; font-family: monospace; font-weight: bold; margin-top: 2px;">${f1.codigo_validacion || 'FES-OK'}</div>
                            <div style="font-size: 7.5px; color: #64748b; margin-top: 1px;">${formatDateTimeCL(f1.fecha_firma || f1.fecha_creacion)}</div>
                        ` : `
                            <div style="font-size: 8.5px; color: #94a3b8; font-style: italic; padding: 8px 0; text-align: center;">Operaciones<br/>(Pendiente de elaboración / firma)</div>
                        `}
                    </td>

                    <!-- Columna 2: Verificó (Administrador de Operaciones) -->
                    <td style="width: 33.33%; vertical-align: top; border: ${paso2Aprobado ? '1.5px solid #10b981' : '1px dashed #cbd5e1'}; background-color: ${paso2Aprobado ? '#f0fdf4' : '#f8fafc'}; border-radius: 4px; padding: 6px;">
                        <div style="font-weight: 800; color: ${paso2Aprobado ? '#047857' : '#64748b'}; text-transform: uppercase; font-size: 8px; border-bottom: 1px solid ${paso2Aprobado ? '#a7f3d0' : '#e2e8f0'}; padding-bottom: 3px; margin-bottom: 4px; display: flex; justify-content: space-between;">
                            <span>2. VERIFICACIÓN (ADMINISTRADOR)</span>
                            <span>${paso2Aprobado ? '✓ FES' : '⏳ PENDIENTE'}</span>
                        </div>
                        ${paso2Aprobado ? `
                            <div style="font-size: 9px; font-weight: 800; color: #0f172a;">${f2.nombre_usuario || 'Jefatura Operaciones'}</div>
                            <div style="font-size: 8px; color: #475569;">${f2.rol_nom || 'Jefatura de Operaciones'}</div>
                            <div style="font-size: 7.5px; color: #0369a1; font-family: monospace; font-weight: bold; margin-top: 2px;">${f2.codigo_validacion || 'FES-OK'}</div>
                            <div style="font-size: 7.5px; color: #64748b; margin-top: 1px;">${formatDateTimeCL(f2.fecha_firma || f2.fecha_creacion)}</div>
                        ` : `
                            <div style="font-size: 8.5px; color: #94a3b8; font-style: italic; padding: 8px 0; text-align: center;">Administración<br/>(Pendiente de verificación)</div>
                        `}
                    </td>

                    <!-- Columna 3: Aprobó (Contabilidad) -->
                    <td style="width: 33.33%; vertical-align: top; border: ${paso3Aprobado ? '1.5px solid #10b981' : '1px dashed #cbd5e1'}; background-color: ${paso3Aprobado ? '#f0fdf4' : '#f8fafc'}; border-radius: 4px; padding: 6px;">
                        <div style="font-weight: 800; color: ${paso3Aprobado ? '#047857' : '#64748b'}; text-transform: uppercase; font-size: 8px; border-bottom: 1px solid ${paso3Aprobado ? '#a7f3d0' : '#e2e8f0'}; padding-bottom: 3px; margin-bottom: 4px; display: flex; justify-content: space-between;">
                            <span>3. APROBACIÓN (CONTABILIDAD)</span>
                            <span>${paso3Aprobado ? '✓ FES' : '⏳ PENDIENTE'}</span>
                        </div>
                        ${paso3Aprobado ? `
                            <div style="font-size: 9px; font-weight: 800; color: #0f172a;">${f3.nombre_usuario || 'Maritza'}</div>
                            <div style="font-size: 8px; color: #475569;">${f3.rol_nom || 'Contabilidad y Finanzas'}</div>
                            <div style="font-size: 7.5px; color: #0369a1; font-family: monospace; font-weight: bold; margin-top: 2px;">${f3.codigo_validacion || 'FES-OK'}</div>
                            <div style="font-size: 7.5px; color: #64748b; margin-top: 1px;">${formatDateTimeCL(f3.fecha_firma || f3.fecha_creacion)}</div>
                        ` : `
                            <div style="font-size: 8.5px; color: #94a3b8; font-style: italic; padding: 8px 0; text-align: center;">Contabilidad<br/>(Pendiente de aprobación)</div>
                        `}
                    </td>
                </tr>
            </tbody>
        </table>
        ${historialRechazosHtml}
    </div>

    <!-- Pie institucional con timbre de validación -->
    <div style="text-align: center; font-size: 8.5px; color: #94a3b8; font-family: monospace; border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
        <span>${empresa} • Sistema Integral de Operaciones & CRM</span>
        <span>Verificable en: ${validacionUrl || 'https://servidor.leanglobal.cl/validador-doc'}</span>
    </div>

</body>
</html>
  `;
}

/**
 * Compila y genera el buffer del PDF oficial de ITS con wkhtmltopdf
 */
async function generarPdfITS(data) {
  const htmlContent = buildItsHtml(data);
  const uuid = uuidv4();
  const tmpDir = os.tmpdir();
  const tempHtmlPath = path.join(tmpDir, `its_${uuid}.html`);
  const tempPdfPath = path.join(tmpDir, `its_${uuid}.pdf`);

  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');

  try {
    await new Promise((resolve, reject) => {
      const isWin = process.platform === 'win32';
      const cmd = isWin
        ? `wkhtmltopdf --enable-local-file-access --load-error-handling ignore --load-media-error-handling ignore --page-size Letter --orientation Portrait --margin-top 8mm --margin-bottom 8mm --margin-left 8mm --margin-right 8mm "${tempHtmlPath}" "${tempPdfPath}"`
        : `xvfb-run -a --server-args="-screen 0 794x1123x24" wkhtmltopdf --enable-local-file-access --load-error-handling ignore --load-media-error-handling ignore --page-size Letter --orientation Portrait --margin-top 8mm --margin-bottom 8mm --margin-left 8mm --margin-right 8mm "${tempHtmlPath}" "${tempPdfPath}"`;

      exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
        if (error && !fs.existsSync(tempPdfPath)) {
          console.error('[ITS wkhtmltopdf] Error:', error.message, stderr);
          return reject(new Error('Fallo al compilar ITS con wkhtmltopdf: ' + error.message));
        }
        resolve();
      });
    });

    return fs.readFileSync(tempPdfPath);
  } finally {
    try { if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath); } catch (_) {}
    try { if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath); } catch (_) {}
  }
}

module.exports = {
  generarPdfITS,
  buildItsHtml
};
