/**
 * edpPdfService.js
 * Servicio de Generación de Dossier PDF Oficial de Estado de Pago (EDP)
 * Motor Canónico: wkhtmltopdf (xvfb-run wkhtmltopdf) — 0% Puppeteer
 * Ecosistema: Grúas San Pablo (GSP) / LeanGlobal Platform
 * Especificación: .agents/specs/40_dossier_pdf_estado_de_pago_spec.md
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');

function formatCLP(val) {
  const num = Math.round(Number(val) || 0);
  const sign = num < 0 ? '-' : '';
  return sign + '$ ' + Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatDateCL(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    if (typeof dateStr === 'string') {
      const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return `${match[3]}/${match[2]}/${match[1]}`;
      }
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch (e) {
    return String(dateStr);
  }
}

function formatTimeCL(timeStr, timestamp, fallback = '--:--') {
  if (timeStr && /^\d{2}:\d{2}/.test(String(timeStr).trim())) {
    return String(timeStr).trim().substring(0, 5);
  }
  if (timestamp) {
    try {
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('es-CL', {
          timeZone: 'America/Santiago',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
    } catch (e) {}
  }
  return fallback;
}

function resolveLogoBase64(logoName = 'logo-sanpablo.png') {
  try {
    const candidates = [
      path.join(process.cwd(), 'public', logoName),
      path.join('/home/nodeadmin/proyectos/lean-services-gsp-prod/public', logoName),
      path.join('/home/nodeadmin/proyectos/lean-services-gsp/public', logoName),
      path.join(__dirname, '../../../frontend/public', logoName),
      path.join(__dirname, '../../../frontend/public/logo-sanpablo.png')
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const ext = path.extname(p).replace('.', '').toLowerCase();
        const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext || 'png'}`;
        const buf = fs.readFileSync(p);
        return `data:${mime};base64,${buf.toString('base64')}`;
      }
    }
  } catch (err) {
    console.error('[EDP-PDF] Error cargando logo Base64:', err.message);
  }
  return '';
}

function checkHorasBajoMinimo(reports) {
  return (reports || []).some(r => {
    const op = Number(r.horas_operadas || 0);
    const min = Number(r.horas_minimas || 9);
    return op > 0 && op < min;
  });
}

function buildEdpHtml(data) {
  const { edp, proyecto, cliente, reports, detalles_adicionales, descuento_tesoreria, firma_comercial, edp_flujo_v1, ordenes_compra, oc_mandante, factura_dte } = data;
  const f1Analista = edp_flujo_v1?.firma_1_analista || null;
  const f2Contabilidad = edp_flujo_v1?.firma_2_contabilidad || null;
  const f3Comercial = edp_flujo_v1?.firma_3_comercial || firma_comercial || null;

  const sortedReports = [...(reports || [])].sort((a, b) => new Date(a.fecha_reporte || 0) - new Date(b.fecha_reporte || 0));
  const primerFecha = sortedReports[0]?.fecha_reporte;
  const ultimaFecha = sortedReports[sortedReports.length - 1]?.fecha_reporte;

  const numeroEdp = edp?.numero_edp || 'EDP-01';
  const fechaEmision = formatDateCL(edp?.fecha_emision || new Date());
  const periodoInicio = formatDateCL(edp?.fecha_corte_inicio || primerFecha || proyecto?.fecha_inicio || new Date());
  const periodoFin = formatDateCL(edp?.fecha_corte_fin || ultimaFecha || primerFecha || proyecto?.fecha_termino || new Date());

  const clienteNombre = proyecto?.cliente_nombre || cliente?.razon_social || 'CLIENTE MANDANTE';
  const clienteRut = proyecto?.cliente_rut || cliente?.rut || 'S/R';
  const obraNombre = proyecto?.obra_nombre || 'FAENA PRINCIPAL';
  const obraDireccion = proyecto?.obra_direccion || proyecto?.obra_comuna || 'En Faena';
  const codigoOt = proyecto?.codi_proyecto || `GSP-OT-${proyecto?.id_proyecto || 'N/A'}`;
  const folioIts = proyecto?.folio_its || edp?.folio_its || null;

  const empresaRazonSocial = proyecto?.empresa_razon_social || 'ARRIENDO DE GRÚAS SAN PABLO SPA';
  const empresaRut = proyecto?.empresa_rut || '76.849.230-1';
  const empresaGiro = proyecto?.empresa_giro || 'Arriendo de Maquinaria y Grúas para la Minería y Construcción';
  const empresaDireccion = proyecto?.empresa_direccion || 'Temuco, Chile • Fono: +56 9 9842 1094';
  const finalLogoBase64 = resolveLogoBase64(proyecto?.empresa_logo || 'logo-sanpablo.png');

  // Totales financieros
  const montoSubtotalBase = Number(edp?.monto_subtotal_base ?? edp?.monto_neto) || 0;
  const montoDescuento = Number(descuento_tesoreria?.monto || edp?.descuento_tesoreria || 0);
  const montoNeto = Number(edp?.monto_neto) || Math.max(0, montoSubtotalBase - montoDescuento);
  const montoIva = Number(edp?.monto_iva) || Math.round(montoNeto * 0.19);
  const montoTotal = Number(edp?.monto_total) || (montoNeto + montoIva);

  // Cálculos de horas desde los reports incluidos
  let totalHorasEfectivas = 0;
  let totalHorasFacturables = 0;
  let totalSobretiempo = 0;

  const rowsJornadasHtml = (reports || []).map((rep, idx) => {
    const efectivas = Number(rep.horas_operadas || 0);
    const facturables = Number(rep.horas_facturables || 0);
    const st = Number(rep.horas_sobretiempo || 0);

    totalHorasEfectivas += efectivas;
    totalHorasFacturables += facturables;
    totalSobretiempo += st;

    const aj = rep.ajustes_analista?.valores_ajustados || rep.ajustes_analista?.valores_originales || {};
    const horaIni = formatTimeCL(rep.hora_inicio || aj.hora_inicio, rep.fecha_inicio_servicio, '08:00');
    const horaFin = formatTimeCL(rep.hora_termino || aj.hora_termino, rep.fecha_termino_servicio, '18:00');

    const equipoDesc = rep.patente ? `${rep.patente} (${rep.modelo || 'Grúa'})` : (rep.equipo_patente ? `${rep.equipo_patente} (${rep.equipo_modelo || 'Grúa'})` : (rep.equipo_nombre || 'Grúa Principal'));
    const operador = rep.operador_nombre || 'Operador Asignado';
    const rigger = rep.rigger_nombre && rep.rigger_nombre !== 'Rigger' ? ` / ${rep.rigger_nombre}` : '';
    const receptor = rep.cliente_nombre ? `${rep.cliente_nombre} (${rep.cliente_cargo || 'ITO'})` : 'Supervisor Mandante';

    return `
      <tr class="${idx % 2 === 0 ? 'row-even' : 'row-odd'}">
        <td class="text-center font-bold">Día ${rep.dia_correlativo || (idx + 1)}</td>
        <td class="text-center font-mono">${formatDateCL(rep.fecha_reporte)}</td>
        <td class="font-bold">${equipoDesc}</td>
        <td>${operador}${rigger}</td>
        <td class="text-center font-mono">${horaIni} - ${horaFin}</td>
        <td class="text-center font-mono font-bold">${facturables.toFixed(1)} hrs</td>
        <td class="text-center font-mono font-bold text-amber">${st > 0 ? `+${st.toFixed(1)} hrs` : '-'}</td>
        <td class="font-mono">${rep.horometro_inicio || '0'} &rarr; ${rep.horometro_termino || '0'}</td>
        <td>${receptor}</td>
      </tr>
    `;
  }).join('');

  if (totalHorasFacturables === 0 && Number(edp?.horas_facturables_totales) > 0) {
    totalHorasFacturables = Number(edp.horas_facturables_totales);
  }

  // Líneas de cobro en la tabla financiera
  const detallesLista = Array.isArray(detalles_adicionales) && detalles_adicionales.length > 0
    ? detalles_adicionales
    : [
        {
          concepto: 'Arriendo Operativo de Grúa y Maquinaria en Faena',
          subtitulo: 'Según reports diarios e Informe de Término de Servicio (ITS) conciliado',
          unidad_cobro: 'Horas / GL',
          cantidad: totalHorasFacturables > 0 ? totalHorasFacturables.toFixed(1) : '1',
          precio_unitario: null,
          monto_subtotal: montoSubtotalBase > 0 ? montoSubtotalBase : montoNeto
        }
      ];

  const rowsFinancieroHtml = detallesLista.map((it) => `
    <tr>
      <td>
        <div class="font-bold text-dark">${it.concepto || 'Servicio de Izaje'}</div>
        ${it.subtitulo ? `<div class="text-muted" style="font-size: 8.5px;">${it.subtitulo}</div>` : ''}
      </td>
      <td class="text-center font-mono">${it.unidad_cobro || 'GL'}</td>
      <td class="text-center font-mono font-bold">${it.cantidad ?? 1}</td>
      <td class="text-right font-mono">${it.precio_unitario ? formatCLP(it.precio_unitario) : '-'}</td>
      <td class="text-right font-mono font-bold text-dark">${formatCLP(it.monto_subtotal)}</td>
    </tr>
  `).join('');

  const rowDescuentoHtml = montoDescuento > 0 ? `
    <tr style="background: #fffbeb;">
      <td colspan="4" class="text-right font-bold" style="color: #b45309;">
        DESCUENTO COMERCIAL / AJUSTE AUTORIZADO TESORERÍA (${descuento_tesoreria?.motivo || 'Ajuste aplicado'}):
      </td>
      <td class="text-right font-mono font-bold" style="color: #b45309;">
        - ${formatCLP(montoDescuento)}
      </td>
    </tr>
  ` : '';

  // Generar fichas de anexos con firmas manuscritas
  const anexosReportsHtml = (reports || []).map((rep, idx) => {
    const firmaCanvas = rep.cliente_firma_canvas_base64;
    const tieneFirma = firmaCanvas && (firmaCanvas.startsWith('data:image') || firmaCanvas.startsWith('http'));

    const aj = rep.ajustes_analista?.valores_ajustados || rep.ajustes_analista?.valores_originales || {};
    const horaIni = formatTimeCL(rep.hora_inicio || aj.hora_inicio, rep.fecha_inicio_servicio, '08:00');
    const horaFin = formatTimeCL(rep.hora_termino || aj.hora_termino, rep.fecha_termino_servicio, '18:00');

    const hColVal = rep.horas_colacion !== undefined && rep.horas_colacion !== null
      ? Number(rep.horas_colacion)
      : (aj.horas_colacion !== undefined ? Number(aj.horas_colacion) : 1.0);

    const colacionTexto = hColVal > 0
      ? (hColVal >= 1.0 ? `${hColVal.toFixed(1)} hrs` : `${Math.round(hColVal * 60)} min`)
      : 'Sin colación (0 hrs)';

    const pat = rep.patente || rep.equipo_patente || 'S/P';
    const mod = rep.modelo || rep.equipo_modelo || 'Grúa';

    return `
      <div class="report-card break-inside-avoid">
        <table class="w-full" style="border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px;">
          <tr>
            <td>
              <span class="badge-amber">DÍA ${rep.dia_correlativo || (idx + 1)}</span>
              <strong style="font-size: 11px; margin-left: 6px; color: #0f172a;">Report Diario de Izaje — ${formatDateCL(rep.fecha_reporte)}</strong>
            </td>
            <td class="text-right">
              <span class="badge-green">VALIDADO CONFORME</span>
            </td>
          </tr>
        </table>

        <table class="grid-table" style="margin-bottom: 6px;">
          <tr>
            <td style="width: 34%;">
              <div class="lbl-mini">Equipo Asignado</div>
              <div class="font-bold text-dark">${pat} — ${mod}</div>
            </td>
            <td style="width: 33%;">
              <div class="lbl-mini">Horario Faena &amp; Colación</div>
              <div class="font-mono text-dark">Faena: <strong>${horaIni} a ${horaFin}</strong> (${colacionTexto})</div>
            </td>
            <td style="width: 33%;">
              <div class="lbl-mini">Horas Facturables / ST</div>
              <div class="font-mono font-bold text-dark">${Number(rep.horas_facturables || 0).toFixed(1)} hrs ${Number(rep.horas_sobretiempo || 0) > 0 ? `<span class="text-amber">(+${Number(rep.horas_sobretiempo).toFixed(1)} ST)</span>` : ''}</div>
            </td>
          </tr>
        </table>

        ${rep.observacion_trabajo ? `
          <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 5px 8px; border-radius: 4px; margin-bottom: 6px; font-size: 9.5px; color: #334155;">
            <strong>Observaciones de Terreno:</strong> ${rep.observacion_trabajo}
          </div>
        ` : ''}

        <table class="w-full" style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px;">
          <tr>
            <td style="vertical-align: middle;">
              <div class="lbl-mini">Recepción Conforme Mandante en Faena</div>
              <div class="font-bold text-dark" style="font-size: 11px;">${rep.cliente_nombre || 'Supervisor Cliente'}</div>
              <div class="text-muted" style="font-size: 9.5px;">RUT: <span class="font-mono">${rep.cliente_rut || 'N/A'}</span> • Cargo: ${rep.cliente_cargo || 'ITO / Supervisor'}</div>
              ${rep.latitud_inicio_servicio ? `<div class="font-mono text-muted" style="font-size: 8.5px;">GPS: ${Number(rep.latitud_inicio_servicio).toFixed(5)}, ${Number(rep.longitud_inicio_servicio).toFixed(5)}</div>` : ''}
            </td>
            <td style="width: 190px; text-align: center; vertical-align: middle;">
              <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; height: 56px; width: 180px; display: inline-block; text-align: center; padding: 2px;">
                ${tieneFirma
                  ? `<img src="${firmaCanvas}" alt="Firma Mandante" style="max-height: 50px; max-width: 170px; object-fit: contain;" />`
                  : `<div style="line-height: 50px; color: #94a3b8; font-style: italic; font-size: 9px;">Firma Digital Registrada</div>`
                }
              </div>
              <div style="font-size: 8px; color: #64748b; text-transform: uppercase; font-weight: bold; margin-top: 2px;">Firma Recepción Terreno</div>
            </td>
          </tr>
        </table>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Estado de Pago ${numeroEdp} - ${codigoOt}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 12mm 12mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      font-size: 10.5px;
      line-height: 1.35;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    table {
      border-collapse: collapse;
    }
    .w-full {
      width: 100%;
    }
    .text-left { text-align: left; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 900; }
    .font-mono { font-family: 'Courier New', Courier, monospace; }
    .text-dark { color: #0f172a; }
    .text-muted { color: #64748b; }
    .text-amber { color: #b45309; }
    .text-emerald { color: #047857; }
    .page-break { page-break-before: always; }
    .break-inside-avoid { page-break-inside: avoid; }

    .header-bar {
      width: 100%;
      border-bottom: 2px solid #f59e0b;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .title-banner {
      background: #0f172a;
      color: #ffffff;
      padding: 10px 14px;
      border-radius: 6px;
      margin-bottom: 10px;
    }
    .info-box {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      border-radius: 6px;
      padding: 8px 10px;
      vertical-align: top;
    }
    .section-tag {
      font-size: 8.5px;
      font-weight: 800;
      color: #d97706;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-family: 'Courier New', Courier, monospace;
      margin-bottom: 3px;
      display: block;
    }
    .kpi-card {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      border-radius: 6px;
      padding: 7px 10px;
      text-align: center;
    }
    .kpi-card-amber {
      border: 1px solid #fcd34d;
      background: #fffbeb;
      border-radius: 6px;
      padding: 7px 10px;
      text-align: center;
    }
    .fin-table {
      width: 100%;
      border: 1px solid #cbd5e1;
      margin-bottom: 12px;
    }
    .fin-table th {
      background: #f1f5f9;
      color: #334155;
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 6px 8px;
      border-bottom: 1px solid #cbd5e1;
    }
    .fin-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 10px;
    }
    .fin-table tfoot td {
      background: #f8fafc;
      padding: 5px 8px;
      font-size: 10px;
    }
    .fin-total-row td {
      background: #fef3c7 !important;
      border-top: 2px solid #f59e0b !important;
      font-size: 11.5px !important;
      font-weight: 900 !important;
      color: #78350f !important;
    }
    .jornadas-table {
      width: 100%;
      border: 1px solid #cbd5e1;
    }
    .jornadas-table th {
      background: #0f172a;
      color: #ffffff;
      font-size: 9px;
      padding: 6px 5px;
      text-transform: uppercase;
    }
    .jornadas-table td {
      padding: 5px 5px;
      border-bottom: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      font-size: 9.5px;
    }
    .row-even { background: #ffffff; }
    .row-odd { background: #f8fafc; }
    .report-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 10px;
      background: #ffffff;
    }
    .grid-table {
      width: 100%;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .grid-table td {
      padding: 5px 8px;
      border-right: 1px solid #e2e8f0;
      vertical-align: top;
    }
    .lbl-mini {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 2px;
    }
    .badge-amber {
      background: #f59e0b;
      color: #0f172a;
      font-weight: 900;
      font-size: 9px;
      padding: 2px 6px;
      border-radius: 3px;
    }
    .badge-green {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #6ee7b7;
      font-weight: 800;
      font-size: 8.5px;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', Courier, monospace;
    }
  </style>
</head>
<body>

  <!-- ==================== PÁGINA 1: CARÁTULA EJECUTIVA ==================== -->
  <table class="header-bar">
    <tr>
      <td style="width: 45%; vertical-align: middle;">
        ${finalLogoBase64
          ? `<img src="${finalLogoBase64}" alt="Logo" style="max-height: 52px; max-width: 210px; object-fit: contain;" />`
          : `<div style="background: #0f172a; color: #ffffff; padding: 8px 14px; border-radius: 6px; display: inline-block; font-weight: 900; font-size: 14px; letter-spacing: 1px;">GRÚAS SAN PABLO</div>`
        }
      </td>
      <td style="width: 55%; text-align: right; vertical-align: middle; font-size: 9.5px; color: #475569;">
        <div style="font-size: 11.5px; font-weight: 900; color: #0f172a; text-transform: uppercase;">${empresaRazonSocial}</div>
        <div>RUT: <strong class="font-mono text-dark">${empresaRut}</strong></div>
        <div>Giro: ${empresaGiro}</div>
        <div>${empresaDireccion}</div>
      </td>
    </tr>
  </table>

  <table class="title-banner w-full">
    <tr>
      <td style="vertical-align: middle;">
        <div class="font-mono" style="font-size: 8.5px; color: #fbbf24; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">DOCUMENTO DE COBRO CONTRACTUAL Y CONCILIACIÓN</div>
        <div class="font-mono" style="font-size: 15px; font-weight: 900; color: #ffffff;">ESTADO DE PAGO ${numeroEdp}</div>
      </td>
      <td style="text-align: right; vertical-align: middle; font-size: 10px;">
        <div class="font-mono font-bold" style="color: #fcd34d; font-size: 12px;">OT: ${codigoOt}</div>
        ${folioIts ? `<div class="font-mono" style="color: #6ee7b7; font-size: 9.5px;">Respaldo ITS: ${folioIts}</div>` : ''}
        <div style="color: #cbd5e1; font-size: 9.5px;">Fecha Emisión: <strong>${fechaEmision}</strong></div>
      </td>
    </tr>
  </table>

  <!-- Identificación Cliente y Faena -->
  <table class="w-full" style="margin-bottom: 10px;">
    <tr>
      <td class="info-box" style="width: 49%;">
        <span class="section-tag">1. DATOS DEL CLIENTE MANDANTE</span>
        <div class="font-black text-dark" style="font-size: 12px; margin-bottom: 2px;">${clienteNombre}</div>
        <div>RUT: <strong class="font-mono">${clienteRut}</strong></div>
        <div>Contacto: ${proyecto?.contacto_nombre || 'Administración de Obra'}</div>
        ${oc_mandante?.numero_oc ? `<div style="margin-top: 3px;">OC / HES Mandante: <strong class="font-mono text-emerald">${oc_mandante.numero_oc}</strong></div>` : ''}
      </td>
      <td style="width: 2%;"></td>
      <td class="info-box" style="width: 49%;">
        <span class="section-tag">2. DATOS DE FAENA Y PERÍODO</span>
        <div class="font-black text-dark" style="font-size: 12px; margin-bottom: 2px;">${obraNombre}</div>
        <div>Ubicación: ${obraDireccion}</div>
        <div>Período Cobro: <strong class="font-mono text-amber">${periodoInicio} al ${periodoFin}</strong></div>
        <div>Ejecutivo Comercial: <strong class="text-dark">${proyecto?.vendedor_nombre || 'Ejecutivo Comercial'}</strong></div>
        ${factura_dte?.factura_numero ? `<div style="margin-top: 3px;">Factura DTE Emitida: <strong class="font-mono text-emerald">N° ${factura_dte.factura_numero}</strong></div>` : ''}
      </td>
    </tr>
  </table>

  <!-- Resumen Operativo de Jornadas -->
  <table class="w-full" style="margin-bottom: 10px;">
    <tr>
      <td class="kpi-card" style="width: 32%;">
        <div class="lbl-mini">Jornadas Respaldadas</div>
        <div class="font-black font-mono text-dark" style="font-size: 15px;">${Math.max((reports || []).length, Number(edp?.dias_totales || 0))} DÍAS</div>
      </td>
      <td style="width: 2%;"></td>
      <td class="kpi-card" style="width: 32%;">
        <div class="lbl-mini">Horas Facturables</div>
        <div class="font-black font-mono text-dark" style="font-size: 15px;">${totalHorasFacturables.toFixed(1)} HRS</div>
      </td>
      <td style="width: 2%;"></td>
      <td class="kpi-card-amber" style="width: 32%;">
        <div class="lbl-mini" style="color: #b45309;">Sobretiempo Extra</div>
        <div class="font-black font-mono text-amber" style="font-size: 15px;">+${totalSobretiempo.toFixed(1)} HRS</div>
      </td>
    </tr>
  </table>

  <!-- Cuadro Resumen Financiero -->
  <div style="background: #1e293b; color: #ffffff; padding: 6px 10px; border-radius: 6px 6px 0 0; font-size: 9.5px; font-weight: 800; text-transform: uppercase;">
    <table class="w-full">
      <tr>
        <td style="color: #ffffff;">3. LIQUIDACIÓN FINANCIERA DEL ESTADO DE PAGO</td>
        <td class="text-right font-mono" style="color: #fbbf24;">VALORES EN MONEDA NACIONAL (CLP)</td>
      </tr>
    </table>
  </div>
  <table class="fin-table">
    <thead>
      <tr>
        <th class="text-left">Concepto / Servicio</th>
        <th class="text-center">Unidad</th>
        <th class="text-center">Cantidad</th>
        <th class="text-right">Tarifa Unitaria</th>
        <th class="text-right">Subtotal Neto</th>
      </tr>
    </thead>
    <tbody>
      ${rowsFinancieroHtml}
      ${rowDescuentoHtml}
    </tbody>
    <tfoot class="font-mono">
      <tr>
        <td colspan="4" class="text-right font-bold">SUBTOTAL NETO A FACTURAR:</td>
        <td class="text-right font-bold text-dark">${formatCLP(montoNeto)}</td>
      </tr>
      <tr>
        <td colspan="4" class="text-right font-bold">I.V.A. (19%):</td>
        <td class="text-right font-bold text-dark">${formatCLP(montoIva)}</td>
      </tr>
      <tr class="fin-total-row">
        <td colspan="4" class="text-right">TOTAL GENERAL A FACTURAR (BRUTO):</td>
        <td class="text-right">${formatCLP(montoTotal)}</td>
      </tr>
    </tfoot>
  </table>

  <!-- Cuadro de Firmas de Aprobación (Circuito 2 Hitos FES Internos) -->
  <div class="info-box break-inside-avoid" style="margin-top: 8px;">
    <span class="section-tag" style="color: #475569;">4. CERTIFICACIÓN Y EMISIÓN DE ESTADO DE PAGO (CIRCUITO FES INTERNO)</span>
    <table class="w-full" style="margin-top: 6px;">
      <tr>
        <td style="width: 50%; text-align: center; vertical-align: bottom; padding: 6px 12px; border-right: 1px dashed #cbd5e1;">
          <div style="min-height: 44px; border-bottom: 1px solid #94a3b8; padding-bottom: 3px; margin-bottom: 3px;">
            ${f1Analista?.codigo_fes ? `
              <div class="font-mono font-bold text-emerald" style="font-size: 8.5px;">✓ EMISIÓN FES (CONTROL GESTIÓN)</div>
              <div style="font-size: 8.5px; color: #0f172a;"><strong>${f1Analista.nombre_firmante}</strong></div>
              <div class="font-mono text-muted" style="font-size: 7.5px;">${f1Analista.codigo_fes}</div>
              <div class="font-mono text-muted" style="font-size: 7.5px;">${formatDateCL(f1Analista.fecha_firma)}</div>
            ` : `
              <div class="font-mono text-muted" style="line-height: 38px; font-size: 8.5px;">V°B° Control de Gestión</div>
            `}
          </div>
          <div class="font-bold text-dark" style="font-size: 9px;">1. Control de Gestión</div>
          <div class="text-muted" style="font-size: 7.5px;">Conciliación de Reports y Emisión FES</div>
        </td>
        <td style="width: 50%; text-align: center; vertical-align: bottom; padding: 6px 12px;">
          <div style="min-height: 44px; border-bottom: 1px solid #94a3b8; padding-bottom: 3px; margin-bottom: 3px;">
            ${f3Comercial?.codigo_fes ? `
              <div class="font-mono font-bold text-emerald" style="font-size: 8.5px;">✓ DESPACHO COMERCIAL FES</div>
              <div style="font-size: 8.5px; color: #0f172a;"><strong>${f3Comercial.nombre_firmante}</strong></div>
              <div class="font-mono text-muted" style="font-size: 7.5px;">${f3Comercial.codigo_fes}</div>
              <div class="font-mono text-muted" style="font-size: 7.5px;">${formatDateCL(f3Comercial.fecha_firma)}</div>
            ` : `
              <div class="font-mono text-muted" style="line-height: 38px; font-size: 8.5px;">V°B° Comercial GSP</div>
            `}
          </div>
          <div class="font-bold text-dark" style="font-size: 9px;">2. Despacho Comercial</div>
          <div class="text-muted" style="font-size: 7.5px;">V°B° y Envío Oficial a Mandante</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- ==================== PÁGINA 2: CONCILIACIÓN CRONOLÓGICA ==================== -->
  <div class="page-break" style="padding-top: 4px;">
    <table class="w-full" style="border-bottom: 2px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 10px;">
      <tr>
        <td>
          <div class="font-mono font-black text-dark" style="font-size: 12px; text-transform: uppercase;">ANEXO 1: DETALLE CRONOLÓGICO DE JORNADAS OPERADAS</div>
          <div class="text-muted" style="font-size: 9.5px;">Conciliación día por día de horas efectivas, sobretiempos y recepción en terreno</div>
        </td>
        <td class="text-right">
          <span class="font-mono font-bold text-amber" style="background: #fffbeb; border: 1px solid #fcd34d; padding: 3px 8px; border-radius: 4px; font-size: 9.5px;">
            ${numeroEdp} — ${codigoOt}
          </span>
        </td>
      </tr>
    </table>

    ${checkHorasBajoMinimo(reports) ? `
    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #f59e0b; padding: 12px 14px; border-radius: 4px; margin-top: 10px;">
      <div class="font-mono font-bold text-dark" style="font-size: 11px; margin-bottom: 4px;">CONCILIACIÓN DE JORNADAS CONFORME A HORAS MÍNIMAS CONTRACTUALES</div>
      <div style="font-size: 9.5px; color: #475569; line-height: 1.4;">
        Las jornadas operadas en terreno han sido liquidadas conforme a la cláusula de <strong>horas mínimas diarias pactadas</strong> en la cotización comercial y orden de servicio (${Math.max((reports || []).length, Number(edp?.dias_totales || 0))} jornadas respaldadas a piso mínimo). Conforme a las directrices de confidencialidad comercial de Grúas San Pablo SpA, el detalle horario interno y horómetros queda archivado en resguardo de la orden de trabajo.
      </div>
    </div>
    ` : `
    <table class="jornadas-table">
      <thead>
        <tr>
          <th class="text-center">Día</th>
          <th class="text-center">Fecha</th>
          <th class="text-left">Equipo / Grúa</th>
          <th class="text-left">Tripulación</th>
          <th class="text-center">Horario</th>
          <th class="text-center">Hrs Fact.</th>
          <th class="text-center">ST</th>
          <th class="text-left">Horómetros</th>
          <th class="text-left">Receptor Cliente</th>
        </tr>
      </thead>
      <tbody>
        ${rowsJornadasHtml || `<tr><td colspan="9" class="text-center text-muted" style="padding: 16px;">Jornadas consolidadas en Informe de Término de Servicio (${folioIts || codigoOt}).</td></tr>`}
      </tbody>
    </table>
    `}
  </div>

  ${(!checkHorasBajoMinimo(reports) && reports && reports.length > 0) ? `
  <!-- ==================== PÁGINA 3+: ANEXO RESPALDOS FIRMADOS ==================== -->
  <div class="page-break" style="padding-top: 4px;">
    <table class="w-full" style="border-bottom: 2px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 10px;">
      <tr>
        <td>
          <div class="font-mono font-black text-dark" style="font-size: 12px; text-transform: uppercase;">ANEXO 2: COMPROBANTES DE REPORTS DIARIOS Y FIRMAS DIGITALES</div>
          <div class="text-muted" style="font-size: 9.5px;">Evidencia documental inmutable con firmas manuscritas y coordenadas GPS capturadas en terreno</div>
        </td>
        <td class="text-right">
          <span class="font-mono font-bold text-amber" style="background: #fffbeb; border: 1px solid #fcd34d; padding: 3px 8px; border-radius: 4px; font-size: 9.5px;">
            ${numeroEdp} — ${codigoOt}
          </span>
        </td>
      </tr>
    </table>

    <div>
      ${anexosReportsHtml}
    </div>
  </div>
  ` : ''}

</body>
</html>`;
}

/**
 * Compila HTML a Buffer PDF usando el estándar canónico wkhtmltopdf (xvfb-run wkhtmltopdf)
 */
async function compileHtmlWithWkhtmltopdf(htmlContent) {
  const uuid = uuidv4();
  const tmpDir = os.tmpdir();
  const tempHtmlPath = path.join(tmpDir, `edp_${uuid}.html`);
  const tempPdfPath = path.join(tmpDir, `edp_${uuid}.pdf`);

  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');

  try {
    await new Promise((resolve, reject) => {
      const isWin = process.platform === 'win32';
      const cmd = isWin
        ? `wkhtmltopdf --enable-local-file-access --load-error-handling ignore --load-media-error-handling ignore --page-size A4 --orientation Portrait --margin-top 10mm --margin-bottom 10mm --margin-left 10mm --margin-right 10mm "${tempHtmlPath}" "${tempPdfPath}"`
        : `xvfb-run -a --server-args="-screen 0 794x1123x24" wkhtmltopdf --enable-local-file-access --load-error-handling ignore --load-media-error-handling ignore --page-size A4 --orientation Portrait --margin-top 10mm --margin-bottom 10mm --margin-left 10mm --margin-right 10mm "${tempHtmlPath}" "${tempPdfPath}"`;

      exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
        if (error && !fs.existsSync(tempPdfPath)) {
          console.error('[EDP wkhtmltopdf] Error:', error.message, stderr);
          return reject(new Error('Fallo al compilar EDP con wkhtmltopdf: ' + error.message));
        }
        resolve();
      });
    });

    const pdfBuffer = fs.readFileSync(tempPdfPath);
    return pdfBuffer;
  } finally {
    try { if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath); } catch (_) {}
    try { if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath); } catch (_) {}
  }
}

/**
 * Genera el buffer binario del PDF oficial del Estado de Pago mediante wkhtmltopdf
 */
async function generarPdfEdpBuffer(edpData) {
  const htmlContent = buildEdpHtml(edpData);
  return await compileHtmlWithWkhtmltopdf(htmlContent);
}

module.exports = {
  generarPdfEdpBuffer,
  buildEdpHtml
};
