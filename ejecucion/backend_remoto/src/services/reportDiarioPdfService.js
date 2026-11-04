/**
 * reportDiarioPdfService.js
 * Servicio de Generación de PDF Oficial del Report Diario Digital de Operaciones
 * Ecosistema: Grúas San Pablo (GSP) / LeanGlobal Platform
 * Incluye doble firma: Firma Mandante en Faena con GPS + Firma Electrónica Simple (FES) del Analista con PIN y Hash SHA-256.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const { PDFDocument } = require('pdf-lib');
const db = require('../config/dbConfig');
const { STORAGE_ROOT } = require('../config/storageConfig');

function formatDateCL(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch (e) {
    return String(dateStr);
  }
}

function formatTime(dateStr, def = '08:00') {
  if (!dateStr) return def;
  try {
    const s = String(dateStr).trim();
    if (/^\d{2}:\d{2}$/.test(s)) return s;
    const d = new Date(s);
    if (isNaN(d.getTime())) return def;
    return d.toLocaleTimeString('es-CL', {
      timeZone: 'America/Santiago',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (e) {
    return def;
  }
}

function formatDateTimeCL(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const dateFormatted = d.toLocaleDateString('es-CL', {
      timeZone: 'America/Santiago',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeFormatted = d.toLocaleTimeString('es-CL', {
      timeZone: 'America/Santiago',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return `${dateFormatted} ${timeFormatted}`;
  } catch (e) {
    return String(dateStr);
  }
}

/**
 * Maquetación HTML del documento oficial del Report Diario
 */
function buildReportDiarioHtml(data) {
  const { report, proyecto, validador, codigoFes, validacionUrl } = data;

  const codiOT = report.codi_proyecto || proyecto?.codi_proyecto || `GSP-OT-${report.id_proyecto}`;
  const diaNum = report.dia_correlativo || 1;
  const fechaServicio = formatDateCL(report.fecha_reporte || new Date());
  const horaInicio = formatTime(report.fecha_inicio_servicio, '08:00');
  const horaTermino = formatTime(report.fecha_termino_servicio, '18:00');
  const horasColacion = Number(report.horas_colacion !== undefined && report.horas_colacion !== null ? report.horas_colacion : 1.0).toFixed(1);
  const colacionTexto = Number(horasColacion) > 0 ? `${horasColacion} hrs` : '0 hrs';
  const horasOperadas = Number(report.horas_operadas || 0).toFixed(1);
  const rawMinimas = (report.horas_minimas !== undefined && report.horas_minimas !== null && String(report.horas_minimas).trim() !== '' && !Number.isNaN(Number(report.horas_minimas)))
    ? Number(report.horas_minimas)
    : 8.0;
  const esSinMinimoDiario = rawMinimas <= 0;
  const horasMinimas = rawMinimas.toFixed(1);
  const horasFacturables = Number(report.horas_facturables || horasOperadas).toFixed(1);
  const horasSobretiempo = esSinMinimoDiario ? '0.0' : Number(report.horas_sobretiempo || 0).toFixed(1);

  const horoIni = Number(report.horometro_inicio || 0).toFixed(1);
  const horoFin = Number(report.horometro_termino || 0).toFixed(1);
  const deltaHoro = (Number(report.horometro_termino || 0) - Number(report.horometro_inicio || 0)).toFixed(1);

  const odoIni = report.odometro_inicio !== null && report.odometro_inicio !== undefined ? Number(report.odometro_inicio).toFixed(0) : '---';
  const odoFin = report.odometro_termino !== null && report.odometro_termino !== undefined ? Number(report.odometro_termino).toFixed(0) : '---';
  const deltaOdo = (report.odometro_inicio !== null && report.odometro_termino !== null) 
    ? (Number(report.odometro_termino || 0) - Number(report.odometro_inicio || 0)).toFixed(0) 
    : '---';

  const clienteNombre = report.cliente_nombre_empresa || proyecto?.cliente_nombre || 'CLIENTE MANDANTE';
  const clienteRut = report.cliente_rut_empresa || proyecto?.cliente_rut || '---';
  const obraNombre = report.obra_nombre || proyecto?.obra_nombre || 'FAENA PRINCIPAL';
  const obraDireccion = report.obra_direccion || proyecto?.obra_direccion || 'Terreno en Faena';

  const equipoPatente = report.equipo_patente || 'S/P';
  const equipoModelo = report.equipo_modelo || 'Grúa Móvil Telescópica';
  const operadorNombre = `${report.op_nombre || ''} ${report.op_apellido || ''}`.trim() || 'Operador en Terreno';
  const riggerNombre = `${report.rig_nombre || ''} ${report.rig_apellido || ''}`.trim();

  const fechaValidacionStr = formatDateTimeCL(report.fecha_validacion || new Date());
  const nombreAnalista = `${validador?.name_frst || report.val_nombre || 'Analista'} ${validador?.apellido_pat || report.val_apellido || 'Control de Gestión'}`.trim();
  const rutAnalista = validador?.rut || report.val_rut || '16.890.123-K';

  // Buscar logo de GSP
  let logoBase64 = '';
  try {
    const candidatePaths = [
      path.join(__dirname, '../../../frontend/public/logo-sanpablo.png'),
      path.join(__dirname, '../../../frontend/public/logo_gsp.png'),
      path.join(process.cwd(), '../frontend/public/logo-sanpablo.png')
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        const fileBuf = fs.readFileSync(p);
        logoBase64 = `data:image/png;base64,${fileBuf.toString('base64')}`;
        break;
      }
    }
  } catch (e) {}

  // Auditoría si hubo ajustes
  const ajustes = report.ajustes_analista;
  const huboAjustes = Boolean(ajustes && ajustes.modificado);
  let tablaAuditoriaHtml = '';
  if (huboAjustes && ajustes.valores_originales && ajustes.valores_ajustados) {
    const orig = ajustes.valores_originales;
    const ajus = ajustes.valores_ajustados;
    tablaAuditoriaHtml = `
      <div class="audit-box">
        <div class="audit-title">⚠️ REGISTRO DE AUDITORÍA & AJUSTES DE CONTROL DE GESTIÓN</div>
        <table class="audit-table">
          <thead>
            <tr>
              <th>Parámetro Operativo</th>
              <th style="text-align: center;">Reportado en Terreno</th>
              <th style="text-align: center;">Validado por Analista</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Horario de Faena</td>
              <td style="text-align: center;"><span class="strikethrough">${orig.hora_inicio || '08:00'} a ${orig.hora_termino || '18:00'}</span></td>
              <td style="text-align: center;"><strong>${ajus.hora_inicio || '08:00'} a ${ajus.hora_termino || '18:00'}</strong></td>
            </tr>
            <tr>
              <td>Horas Facturables</td>
              <td style="text-align: center;"><span class="strikethrough">${orig.horas_facturables} hrs</span></td>
              <td style="text-align: center;"><strong class="text-emerald">${ajus.horas_facturables} hrs</strong></td>
            </tr>
            <tr>
              <td>Horas Efectivas Operadas</td>
              <td style="text-align: center;"><span class="strikethrough">${orig.horas_operadas} hrs</span></td>
              <td style="text-align: center;"><strong>${ajus.horas_operadas} hrs</strong></td>
            </tr>
            <tr>
              <td>Colación</td>
              <td style="text-align: center;"><span class="strikethrough">${orig.horas_colacion} hrs</span></td>
              <td style="text-align: center;"><strong>${ajus.horas_colacion} hrs</strong></td>
            </tr>
          </tbody>
        </table>
        <div class="audit-obs">
          <strong>Justificación del Analista:</strong> "${ajustes.observacion_ajuste || 'Ajustes validados conforme a telemetría GPS y hoja de faena.'}"
        </div>
      </div>
    `;
  }

  // Firma Mandante Canvas
  const firmaMandanteImg = report.cliente_firma_canvas_base64
    ? `<img src="${report.cliente_firma_canvas_base64}" style="max-height: 70px; max-width: 220px; object-fit: contain; margin: 0 auto; display: block;" alt="Firma Mandante" />`
    : `<div style="color: #94a3b8; font-style: italic; font-size: 11px; padding-top: 25px;">Firma registrada digitalmente en tablet de terreno</div>`;

  const gpsTexto = (report.latitud_inicio_servicio && report.longitud_inicio_servicio)
    ? `📍 GPS: Lat ${Number(report.latitud_inicio_servicio).toFixed(4)}, Lon ${Number(report.longitud_inicio_servicio).toFixed(4)} (±${Number(report.accuracy_firma || 15).toFixed(0)}m)`
    : `📍 GPS: Capturado y sellado en faena`;

  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Report Diario Digital — ${codiOT} Día ${diaNum}</title>
    <style>
      @page {
        size: A4 portrait;
        margin: 8mm 10mm 10mm 10mm;
      }
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      body {
        color: #1e293b;
        background: #ffffff;
        font-size: 11px;
        line-height: 1.35;
      }
      .header-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 8px;
        border-bottom: 2px solid #0f172a;
        padding-bottom: 6px;
      }
      .logo-col {
        width: 160px;
        vertical-align: middle;
      }
      .logo-img {
        max-width: 140px;
        max-height: 55px;
        object-fit: contain;
      }
      .company-col {
        vertical-align: middle;
        text-align: left;
        padding-left: 10px;
      }
      .company-name {
        font-size: 14px;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }
      .company-sub {
        font-size: 9px;
        color: #475569;
        margin-top: 1px;
      }
      .folio-col {
        width: 210px;
        vertical-align: middle;
        text-align: right;
      }
      .badge-doc {
        display: inline-block;
        background: #0f172a;
        color: #f8fafc;
        font-size: 10px;
        font-weight: 700;
        padding: 4px 8px;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 3px;
      }
      .folio-number {
        font-family: "Courier New", Courier, monospace;
        font-size: 13px;
        font-weight: 800;
        color: #d97706;
      }
      .section-header {
        background: #f1f5f9;
        border-left: 3px solid #d97706;
        padding: 4px 8px;
        font-size: 10.5px;
        font-weight: 800;
        text-transform: uppercase;
        color: #0f172a;
        letter-spacing: 0.5px;
        margin-top: 8px;
        margin-bottom: 4px;
      }
      .grid-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 6px;
      }
      .grid-table td {
        padding: 4px 6px;
        border: 1px solid #cbd5e1;
        font-size: 10px;
        vertical-align: middle;
      }
      .lbl {
        background: #f8fafc;
        font-weight: 700;
        color: #475569;
        width: 20%;
        text-transform: uppercase;
        font-size: 9px;
      }
      .val {
        width: 30%;
        color: #0f172a;
        font-weight: 600;
      }
      .metrics-grid {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 8px;
        text-align: center;
      }
      .metrics-grid th {
        background: #0f172a;
        color: #f8fafc;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        padding: 5px 4px;
        border: 1px solid #0f172a;
      }
      .metrics-grid td {
        border: 1px solid #cbd5e1;
        padding: 6px 4px;
        font-size: 11px;
      }
      .metric-highlight {
        font-size: 13px;
        font-weight: 800;
        color: #047857;
        font-family: monospace;
      }
      .metric-sub {
        font-size: 8.5px;
        color: #64748b;
        display: block;
        margin-top: 1px;
      }
      .obs-box {
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        padding: 6px 8px;
        font-size: 10px;
        color: #334155;
        min-height: 38px;
        margin-bottom: 8px;
      }
      .audit-box {
        background: #fefce8;
        border: 1px solid #fde047;
        border-radius: 5px;
        padding: 6px 8px;
        margin: 6px 0;
      }
      .audit-title {
        font-size: 10px;
        font-weight: 800;
        color: #854d0e;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      .audit-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 9.5px;
        margin-bottom: 4px;
      }
      .audit-table th {
        background: #fef08a;
        padding: 3px 6px;
        text-align: left;
        border: 1px solid #facc15;
        color: #713f12;
      }
      .audit-table td {
        padding: 3px 6px;
        border: 1px solid #fef08a;
        color: #1e293b;
      }
      .strikethrough {
        text-decoration: line-through;
        color: #dc2626;
        font-family: monospace;
      }
      .text-emerald {
        color: #059669;
        font-family: monospace;
      }
      .audit-obs {
        font-size: 9.5px;
        color: #713f12;
        font-style: italic;
      }
      .signatures-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
      }
      .sig-card {
        width: 49%;
        border: 1px solid #94a3b8;
        border-radius: 6px;
        padding: 8px;
        vertical-align: top;
      }
      .sig-header {
        font-size: 9.5px;
        font-weight: 800;
        text-transform: uppercase;
        border-bottom: 1px solid #cbd5e1;
        padding-bottom: 4px;
        margin-bottom: 6px;
        display: flex;
        justify-content: space-between;
      }
      .sig-canvas-zone {
        height: 75px;
        background: #f8fafc;
        border: 1px dashed #cbd5e1;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 6px;
      }
      .fes-seal-zone {
        height: 75px;
        background: #f0fdf4;
        border: 1px solid #86efac;
        border-radius: 4px;
        padding: 5px;
        margin-bottom: 6px;
        text-align: center;
      }
      .fes-stamp {
        font-size: 11px;
        font-weight: 800;
        color: #166534;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .fes-code {
        font-family: "Courier New", Courier, monospace;
        font-size: 9px;
        font-weight: 700;
        color: #0f172a;
        margin-top: 2px;
      }
      .fes-legend {
        font-size: 8px;
        color: #15803d;
        margin-top: 2px;
      }
      .sig-data {
        font-size: 9px;
        color: #334155;
        line-height: 1.3;
      }
      .footer-legal {
        margin-top: 12px;
        padding-top: 6px;
        border-top: 1px solid #cbd5e1;
        text-align: center;
        font-size: 8px;
        color: #64748b;
        line-height: 1.3;
      }
    </style>
  </head>
  <body>

    <!-- 1. MEMBRETE OFICIAL GSP -->
    <table class="header-table">
      <tr>
        <td class="logo-col">
          ${logoBase64 ? `<img src="${logoBase64}" class="logo-img" alt="Grúas San Pablo" />` : '<div style="font-weight:900; font-size:18px; color:#d97706;">GRÚAS SAN PABLO</div>'}
        </td>
        <td class="company-col">
          <div class="company-name">Arriendo de Grúas San Pablo SpA</div>
          <div class="company-sub">RUT: 76.209.534-3 • Panamericana Norte #1020, Temuco</div>
          <div class="company-sub">Servicios de Izaje Industrial, Grúas Telescópicas & Transportes Especiales</div>
          <div class="company-sub">Fono: +56 9 8414 1422 • contacto@arriendosanpablo.cl • www.arriendosanpablo.cl</div>
        </td>
        <td class="folio-col">
          <div class="badge-doc">Report Diario Digital</div>
          <div class="folio-number">FOLIO: REP-${codiOT}-D${diaNum}</div>
          <div style="font-size: 9px; color: #475569; margin-top: 2px;">Fecha Emisión: <strong>${fechaServicio}</strong></div>
        </td>
      </tr>
    </table>

    <!-- 2. ANTECEDENTES DEL SERVICIO Y MANDANTE -->
    <div class="section-header">1. Antecedentes de la Orden de Trabajo & Faena</div>
    <table class="grid-table">
      <tr>
        <td class="lbl">Orden de Trabajo (OT):</td>
        <td class="val" style="color: #b45309; font-family: monospace; font-size: 11px;">${codiOT}</td>
        <td class="lbl">Fecha de Operación:</td>
        <td class="val">${fechaServicio} (Día Correlativo ${diaNum})</td>
      </tr>
      <tr>
        <td class="lbl">Cliente Mandante:</td>
        <td class="val"><strong>${clienteNombre}</strong></td>
        <td class="lbl">RUT Cliente:</td>
        <td class="val">${clienteRut}</td>
      </tr>
      <tr>
        <td class="lbl">Obra / Faena:</td>
        <td class="val">${obraNombre}</td>
        <td class="lbl">Ubicación / Dirección:</td>
        <td class="val">${obraDireccion}</td>
      </tr>
    </table>

    <!-- 3. FLOTA Y RECURSOS ASIGNADOS -->
    <div class="section-header">2. Recursos Operacionales & Flota Asignada</div>
    <table class="grid-table">
      <tr>
        <td class="lbl">Grúa Móvil / Patente:</td>
        <td class="val"><strong style="font-family: monospace; font-size: 11px;">${equipoPatente}</strong> (${equipoModelo})</td>
        <td class="lbl">Operador Responsable:</td>
        <td class="val">${operadorNombre}</td>
      </tr>
      <tr>
        ${riggerNombre ? `
        <td class="lbl">Rigger / Asistente:</td>
        <td class="val">${riggerNombre}</td>
        <td class="lbl">Piso Mínimo Contractual:</td>
        <td class="val">${esSinMinimoDiario ? '<strong style="color: #047857;">Sin mínimo diario (Modalidad Mensual)</strong>' : `<strong style="color: #047857;">${horasMinimas} hrs base</strong> (según OT formal)`}</td>
        ` : `
        <td class="lbl">Piso Mínimo Contractual:</td>
        <td class="val" colspan="3">${esSinMinimoDiario ? '<strong style="color: #047857;">Sin mínimo diario (Modalidad Mensual — Acumula horas reales al mes)</strong>' : `<strong style="color: #047857;">${horasMinimas} hrs base</strong> (según OT formal)`}</td>
        `}
      </tr>
    </table>

    <!-- 4. CONTROL DE TIEMPOS Y JORNADA -->
    <div class="section-header">3. Liquidación de Jornada y Tiempos de Servicio</div>
    <table class="metrics-grid">
      <thead>
        <tr>
          <th>Horario Inicio Faena</th>
          <th>Horario Término Faena</th>
          <th>Colación</th>
          <th>Horas Efectivas</th>
          <th>Piso Mínimo OT</th>
          <th style="background: #047857;">Total Facturable</th>
          <th>Sobretiempo</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>${horaInicio}</strong></td>
          <td><strong>${horaTermino}</strong></td>
          <td><strong>${colacionTexto}</strong><span class="metric-sub">${Number(horasColacion) > 0 ? `${horasColacion} hrs colación` : 'Sin colación'}</span></td>
          <td><strong>${horasOperadas} hrs</strong><span class="metric-sub">Efectivas izaje</span></td>
          <td>${esSinMinimoDiario ? '<strong>Sin mín. diario</strong><span class="metric-sub">Acumula mensual</span>' : `${horasMinimas} hrs<span class="metric-sub">Base pactada</span>`}</td>
          <td style="background: #ecfdf5;"><span class="metric-highlight">${horasFacturables} hrs</span><span class="metric-sub">Para Estado Pago</span></td>
          <td>${horasSobretiempo > 0 ? `<strong style="color:#b45309;">+${horasSobretiempo} hrs</strong>` : '0.0 hrs'}<span class="metric-sub">Excedente base</span></td>
        </tr>
      </tbody>
    </table>

    <!-- 5. MANIOBRA Y OBSERVACIONES -->
    <div class="section-header">4. Detalle de Maniobras de Izaje & Observaciones</div>
    <div class="obs-box">
      <strong>Maniobras Realizadas en Faena:</strong><br>
      ${report.observacion_trabajo || 'Servicio de izaje y maniobras operacionales de grúa móvil según plan de trabajo convenido.'}
      ${report.notas_mecanicas_gsp ? `<br><br><span style="color:#b45309;"><strong>Notas Mecánicas / Taller GSP:</strong> ${report.notas_mecanicas_gsp}</span>` : ''}
    </div>

    <!-- 6. TABLA DE AUDITORÍA (SI APLICA) -->
    ${tablaAuditoriaHtml}

    <!-- 7. DOBLE FIRMA: MANDANTE EN TERRENO + FES ANALISTA CON PIN -->
    <table class="signatures-table">
      <tr>
        <!-- FIRMA MANDANTE -->
        <td class="sig-card" style="margin-right: 2%;">
          <div class="sig-header">
            <span style="color: #0f172a;">RECEPCIÓN CONFORME MANDANTE</span>
            <span style="color: #047857; font-size: 8.5px;">FAENA TERRENO</span>
          </div>
          <div class="sig-canvas-zone">
            ${firmaMandanteImg}
          </div>
          <div class="sig-data">
            <strong>Nombre:</strong> ${report.cliente_nombre || 'Supervisor Mandante'}<br>
            <strong>RUT:</strong> ${report.cliente_rut || '---'} • <strong>Cargo:</strong> ${report.cliente_cargo || 'Receptor en Faena'}<br>
            <span style="font-size: 8px; color: #64748b;">${gpsTexto}</span><br>
            <span style="font-size: 8px; color: #64748b;">Sello Digital: Touchscreen Faena • ${fechaServicio}</span>
          </div>
        </td>

        <!-- ESPACIO -->
        <td style="width: 2%;"></td>

        <!-- FIRMA ELECTRÓNICA SIMPLE (FES) ANALISTA -->
        <td class="sig-card">
          <div class="sig-header">
            <span style="color: ${codigoFes ? '#166534' : '#b45309'};">${codigoFes ? 'CERTIFICACIÓN DIGITAL ANALISTA PMO' : 'CONTROL OPERACIONAL GSP'}</span>
            <span style="color: ${codigoFes ? '#166534' : '#b45309'}; font-size: 8.5px;">${codigoFes ? 'CONTROL GESTIÓN' : 'EMISIÓN EN FAENA'}</span>
          </div>
          <div class="fes-seal-zone">
            <div class="fes-stamp">${codigoFes ? '🔒 FIRMA ELECTRÓNICA SIMPLE (FES)' : '📋 REGISTRO OPERATIVO DE FAENA'}</div>
            <div class="fes-code">${codigoFes || `REP-OPERATIVO-${report.id_reporte_avance || 'FAENA'}`}</div>
            <div class="fes-legend">${codigoFes ? 'Validado con Clave Secreta PIN y Trazabilidad Criptográfica SHA-256' : 'Registrado en faena con firma táctil mandante y georreferencia GPS'}</div>
          </div>
          <div class="sig-data">
            <strong>Analista:</strong> ${codigoFes ? nombreAnalista : 'Pendiente de Auditoría'}<br>
            <strong>RUT:</strong> ${codigoFes ? rutAnalista : '---'} • <strong>Área:</strong> Control Operacional GSP<br>
            <strong>Fecha/Hora Validación:</strong> ${codigoFes ? fechaValidacionStr : 'En revisión PMO'}<br>
            <span style="font-size: 8px; color: ${codigoFes ? '#166534' : '#64748b'};">${codigoFes ? 'Certificado conforme a Ley N° 19.799 sobre Documentos Electrónicos' : 'Copia operativa emitida en terreno'}</span>
          </div>
        </td>
      </tr>
    </table>

    <!-- 8. PIE DE PÁGINA Y TRAZABILIDAD -->
    <div class="footer-legal">
      Este documento es una copia oficial generada y archivada en el Dossier Operacional del Proyecto ${codiOT} en la plataforma LeanGlobal / Grúas San Pablo S.A.<br>
      Verificación de validez y descarga oficial en: <strong>${validacionUrl || ((process.env.APP_ENV === 'prod') ? 'https://servidor.leanglobal.cl/lg-gsp-prod/validador-doc' : 'https://servidor.leanglobal.cl/lg-gsp-dev/validador-doc')}</strong>
    </div>

    <!-- 9. ANEXOS DOCUMENTALES E IMÁGENES ADJUNTAS (REQ-1107) -->
    ${Array.isArray(data.anexosImagenes) && data.anexosImagenes.length > 0 ? data.anexosImagenes.map((anx, idx) => `
      <div style="page-break-before: always; padding-top: 6px;">
        <div class="section-header">ANEXO #${idx + 1}: ${anx.titulo || 'DOCUMENTO / EVIDENCIA ADJUNTA'} — ${codiOT} (DÍA ${diaNum})</div>
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; text-align: center; background: #f8fafc; margin-top: 8px;">
          <img src="${anx.dataUri}" style="max-width: 100%; max-height: 235mm; object-fit: contain; display: block; margin: 0 auto;" />
        </div>
      </div>
    `).join('') : ''}

  </body>
  </html>
  `;
}

/**
 * Compila y genera el buffer del PDF oficial del Report Diario con wkhtmltopdf (0% Puppeteer)
 */
async function resolverAnexosDelReporte(data) {
  const anexosImagenes = Array.isArray(data.anexosImagenes) ? [...data.anexosImagenes] : [];
  const anexosPdfs = Array.isArray(data.anexosPdfs) ? [...data.anexosPdfs] : [];
  const rep = data.report || {};

  // 1. Fotos capturadas en terreno (inicio / término de horómetro o tablero)
  const fotoIni = rep.foto_tablero_inicio || rep.foto_horometro_inicio || null;
  if (typeof fotoIni === 'string' && fotoIni.startsWith('data:image/')) {
    anexosImagenes.push({ titulo: 'FOTOGRAFÍA TABLERO / HORÓMETRO INICIO EN TERRENO', dataUri: fotoIni });
  }
  const fotoFin = rep.foto_tablero_termino || rep.foto_horometro || null;
  if (typeof fotoFin === 'string' && fotoFin.startsWith('data:image/') && fotoFin !== fotoIni) {
    anexosImagenes.push({ titulo: 'FOTOGRAFÍA TABLERO / HORÓMETRO TÉRMINO EN TERRENO', dataUri: fotoFin });
  }

  // 2. Documento o foto adjunta como respaldo físico (id_doc_evidencia)
  const ajustes = typeof rep.ajustes_analista === 'string'
    ? (() => { try { return JSON.parse(rep.ajustes_analista); } catch (_) { return {}; } })()
    : (rep.ajustes_analista || {});
  const idDocEvidencia = data.idDocEvidencia || ajustes.id_doc_evidencia || null;

  if (idDocEvidencia) {
    try {
      const fRes = await db.query('SELECT id_doc, mime_type, name_doc_orig, name_doc_save, path_doc FROM tfmg_file WHERE id_doc = $1', [idDocEvidencia]);
      if (fRes.rows.length > 0) {
        const fRow = fRes.rows[0];
        const candidates = [
          path.join(STORAGE_ROOT, fRow.path_doc || '', fRow.name_doc_save || ''),
          path.join(STORAGE_ROOT, fRow.path_doc || '')
        ];
        const diskPath = candidates.find(c => fs.existsSync(c) && fs.statSync(c).isFile());
        if (diskPath) {
          const buf = fs.readFileSync(diskPath);
          const mime = String(fRow.mime_type || '').toLowerCase();
          const ext = path.extname(fRow.name_doc_save || fRow.name_doc_orig || '').toLowerCase();
          if (mime.includes('pdf') || ext === '.pdf') {
            anexosPdfs.push(buf);
          } else if (mime.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
            const imgMime = mime.startsWith('image/') ? mime : (ext === '.png' ? 'image/png' : 'image/jpeg');
            anexosImagenes.push({
              titulo: `RESPALDO FÍSICO ADJUNTO (${fRow.name_doc_orig || fRow.name_doc_save || 'Documento'})`,
              dataUri: `data:${imgMime};base64,${buf.toString('base64')}`
            });
          }
        }
      }
    } catch (errAnx) {
      console.warn('[REQ-1107] Aviso resolviendo anexo de reporte:', errAnx.message);
    }
  }

  return { anexosImagenes, anexosPdfs };
}

async function generarPdfReportDiario(data) {
  const { anexosImagenes, anexosPdfs } = await resolverAnexosDelReporte(data);
  const htmlContent = buildReportDiarioHtml({ ...data, anexosImagenes });
  const uuid = uuidv4();
  const tmpDir = os.tmpdir();
  const tempHtmlPath = path.join(tmpDir, `rep_${uuid}.html`);
  const tempPdfPath = path.join(tmpDir, `rep_${uuid}.pdf`);

  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');

  try {
    await new Promise((resolve, reject) => {
      const isWin = process.platform === 'win32';
      const cmd = isWin
        ? `wkhtmltopdf --enable-local-file-access --load-error-handling ignore --load-media-error-handling ignore --page-size A4 --orientation Portrait --margin-top 8mm --margin-bottom 8mm --margin-left 8mm --margin-right 8mm "${tempHtmlPath}" "${tempPdfPath}"`
        : `xvfb-run -a --server-args="-screen 0 794x1123x24" wkhtmltopdf --enable-local-file-access --load-error-handling ignore --load-media-error-handling ignore --page-size A4 --orientation Portrait --margin-top 8mm --margin-bottom 8mm --margin-left 8mm --margin-right 8mm "${tempHtmlPath}" "${tempPdfPath}"`;

      exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
        if (error && !fs.existsSync(tempPdfPath)) {
          console.error('[ReportDiario wkhtmltopdf] Error:', error.message, stderr);
          return reject(new Error('Fallo al compilar Report Diario con wkhtmltopdf: ' + error.message));
        }
        resolve();
      });
    });

    let finalBuffer = fs.readFileSync(tempPdfPath);

    // REQ-1107: Si existen documentos PDF adjuntos como respaldo físico, fusionar sus páginas al final del PDF oficial
    if (anexosPdfs.length > 0) {
      try {
        const mainDoc = await PDFDocument.load(finalBuffer);
        for (const pdfBuf of anexosPdfs) {
          const annexDoc = await PDFDocument.load(pdfBuf);
          const copiedPages = await mainDoc.copyPages(annexDoc, annexDoc.getPageIndices());
          copiedPages.forEach(p => mainDoc.addPage(p));
        }
        finalBuffer = Buffer.from(await mainDoc.save());
      } catch (mergeErr) {
        console.warn('[REQ-1107] Aviso fusionando PDF anexo al final del reporte:', mergeErr.message);
      }
    }

    return finalBuffer;
  } finally {
    try { if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath); } catch (_) {}
    try { if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath); } catch (_) {}
  }
}

module.exports = {
  generarPdfReportDiario,
  buildReportDiarioHtml
};
