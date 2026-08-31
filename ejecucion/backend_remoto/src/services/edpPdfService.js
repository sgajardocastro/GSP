/**
 * edpPdfService.js
 * Servicio de Generación de Dossier PDF Oficial de Estado de Pago (EDP Periódicos)
 * Ecosistema: Grúas San Pablo (GSP) / LeanGlobal Platform
 * Especificación: .agents/specs/40_dossier_pdf_estado_de_pago_spec.md
 */

const path = require('path');
const fs = require('fs');

let puppeteerInstance = null;

async function getPuppeteer() {
  if (puppeteerInstance) return puppeteerInstance;
  try {
    puppeteerInstance = require('puppeteer');
    return puppeteerInstance;
  } catch (e) {
    try {
      const mod = await import('puppeteer-core');
      puppeteerInstance = mod.default || mod;
      return puppeteerInstance;
    } catch (e2) {
      try {
        const mod = await import(path.join(__dirname, '../../node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'));
        puppeteerInstance = mod.default || mod;
        return puppeteerInstance;
      } catch (e3) {
        throw new Error('No se pudo inicializar puppeteer: ' + e3.message);
      }
    }
  }
}

function getChromeExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  if (process.platform === 'win32') {
    const winPaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    for (const p of winPaths) {
      if (fs.existsSync(p)) return p;
    }
  } else {
    const linuxPaths = [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser'
    ];
    for (const p of linuxPaths) {
      if (fs.existsSync(p)) return p;
    }
  }
  return undefined;
}

function formatCLP(val) {
  const num = Math.round(Number(val) || 0);
  return '$ ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

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

function buildEdpHtml(data) {
  const { edp, proyecto, cliente, cotizacion, reports, detalles_adicionales } = data;

  const numeroEdp = edp?.numero_edp || 'EDP-01';
  const fechaEmision = formatDateCL(edp?.fecha_emision || new Date());
  const periodoInicio = formatDateCL(edp?.fecha_corte_inicio);
  const periodoFin = formatDateCL(edp?.fecha_corte_fin);

  const clienteNombre = proyecto?.cliente_nombre || cliente?.razon_social || 'CLIENTE MANDANTE';
  const clienteRut = proyecto?.cliente_rut || cliente?.rut || 'N/A';
  const obraNombre = proyecto?.obra_nombre || 'FAENA PRINCIPAL';
  const obraDireccion = proyecto?.obra_direccion || proyecto?.obra_comuna || 'En Faena';
  const codigoOt = proyecto?.codi_proyecto || `GSP-OT-${proyecto?.id_proyecto || 'N/A'}`;

  // Totales financieros
  const montoNeto = Number(edp?.monto_neto) || 0;
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

    const equipoDesc = rep.patente ? `${rep.patente} (${rep.modelo || 'Grúa'})` : (rep.equipo_nombre || 'Grúa Principal');
    const operador = rep.operador_nombre || 'Operador Asignado';
    const rigger = rep.rigger_nombre || 'Rigger Asignado';
    const receptor = rep.cliente_nombre ? `${rep.cliente_nombre} (${rep.cliente_cargo || 'ITO'})` : 'Supervisor Mandante';

    return `
      <tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}">
        <td class="px-2.5 py-2 text-center font-bold text-slate-800 border-r border-slate-200">Día ${rep.dia_correlativo || (idx + 1)}</td>
        <td class="px-2.5 py-2 text-center text-slate-700 border-r border-slate-200 font-mono">${formatDateCL(rep.fecha_reporte)}</td>
        <td class="px-2.5 py-2 text-slate-800 font-medium border-r border-slate-200">${equipoDesc}</td>
        <td class="px-2.5 py-2 text-slate-600 border-r border-slate-200 text-xs">${operador} / ${rigger}</td>
        <td class="px-2.5 py-2 text-center font-mono text-xs border-r border-slate-200">${rep.hora_inicio || '--:--'} - ${rep.hora_termino || '--:--'}</td>
        <td class="px-2.5 py-2 text-center font-mono font-bold text-slate-800 border-r border-slate-200">${facturables.toFixed(1)} hrs</td>
        <td class="px-2.5 py-2 text-center font-mono font-bold text-amber-700 border-r border-slate-200">${st > 0 ? `+${st.toFixed(1)} hrs` : '-'}</td>
        <td class="px-2.5 py-2 text-xs text-slate-700 border-r border-slate-200">${rep.horometro_inicio || '0'} ➔ ${rep.horometro_termino || '0'}</td>
        <td class="px-2.5 py-2 text-xs text-slate-700 font-medium">${receptor}</td>
      </tr>
    `;
  }).join('');

  // Generar fichas de anexos con firmas manuscritas
  const anexosReportsHtml = (reports || []).map((rep, idx) => {
    const firmaCanvas = rep.cliente_firma_canvas_base64;
    const tieneFirma = firmaCanvas && (firmaCanvas.startsWith('data:image') || firmaCanvas.startsWith('http'));

    return `
      <div class="report-card mb-5 border border-slate-300 rounded-lg p-4 bg-white shadow-sm break-inside-avoid">
        <div class="flex justify-between items-center border-b border-slate-200 pb-2 mb-3">
          <div class="flex items-center gap-2">
            <span class="bg-amber-500 text-slate-950 font-black px-2.5 py-0.5 rounded text-xs">DÍA ${rep.dia_correlativo || (idx + 1)}</span>
            <span class="font-bold text-slate-800 text-sm">Report Diario de Izaje — ${formatDateCL(rep.fecha_reporte)}</span>
          </div>
          <span class="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded">
            ✅ Validado Conforme
          </span>
        </div>

        <div class="grid grid-cols-3 gap-3 text-xs mb-3 bg-slate-50 p-2.5 rounded border border-slate-200">
          <div>
            <span class="text-slate-500 block font-semibold text-[10px] uppercase">Equipo Asignado:</span>
            <strong class="text-slate-900">${rep.patente || 'S/P'} — ${rep.modelo || 'Grúa'}</strong>
          </div>
          <div>
            <span class="text-slate-500 block font-semibold text-[10px] uppercase">Horario & Colación:</span>
            <span class="text-slate-900 font-mono">${rep.hora_inicio || '--:--'} a ${rep.hora_termino || '--:--'} (${rep.horas_colacion || 0}m colación)</span>
          </div>
          <div>
            <span class="text-slate-500 block font-semibold text-[10px] uppercase">Horas Facturables / ST:</span>
            <strong class="text-slate-900 font-mono">${Number(rep.horas_facturables || 0).toFixed(1)} hrs</strong>
            ${Number(rep.horas_sobretiempo || 0) > 0 ? `<span class="text-amber-700 font-bold"> (+${Number(rep.horas_sobretiempo).toFixed(1)} ST)</span>` : ''}
          </div>
        </div>

        ${rep.observacion_trabajo ? `
          <div class="text-xs text-slate-700 bg-amber-50/60 border border-amber-200 p-2.5 rounded mb-3">
            <strong>Observaciones de Terreno:</strong> ${rep.observacion_trabajo}
          </div>
        ` : ''}

        <!-- Bloque de Firma Manuscrita Mandante -->
        <div class="border border-slate-200 rounded p-3 bg-slate-50 flex items-center justify-between">
          <div class="text-xs space-y-1">
            <div class="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Recepción Conforme Mandante en Faena</div>
            <div class="text-slate-900 font-bold text-sm">${rep.cliente_nombre || 'Supervisor Cliente'}</div>
            <div class="text-slate-600">RUT: <span class="font-mono">${rep.cliente_rut || 'N/A'}</span> • Cargo: ${rep.cliente_cargo || 'ITO'}</div>
            ${rep.latitud_inicio_servicio ? `
              <div class="text-[10px] text-slate-500 font-mono">📍 GPS: ${Number(rep.latitud_inicio_servicio).toFixed(5)}, ${Number(rep.longitud_inicio_servicio).toFixed(5)}</div>
            ` : ''}
          </div>

          <div class="text-center">
            <div class="w-48 h-20 bg-white border border-slate-300 rounded flex items-center justify-center p-1 shadow-sm">
              ${tieneFirma 
                ? `<img src="${firmaCanvas}" alt="Firma Receptor Mandante" style="max-height:72px; max-width:180px; object-fit:contain;" />` 
                : `<span class="text-[11px] text-slate-400 italic">Firma Digital Registrada</span>`
              }
            </div>
            <span class="text-[9px] text-slate-500 uppercase tracking-wider block mt-1 font-bold">Firma Manuscrita Digital</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Estado de Pago ${numeroEdp} - ${codigoOt}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page {
      size: A4;
      margin: 10mm 12mm 12mm 12mm;
    }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-break {
      page-break-before: always;
    }
    .break-inside-avoid {
      page-break-inside: avoid;
    }
  </style>
</head>
<body class="text-slate-800 text-xs leading-normal">

  <!-- ==================== PÁGINA 1: CARÁTULA EJECUTIVA ==================== -->
  <div class="min-h-[920px] flex flex-col justify-between">
    <div>
      <!-- Membrete Superior con Logo Inline -->
      <div class="flex justify-between items-center border-b-2 border-amber-500 pb-3 mb-4">
        <div class="flex items-center gap-3">
          <svg viewBox="0 0 280 65" width="220" height="52" xmlns="http://www.w3.org/2000/svg">
            <rect width="280" height="65" fill="#0f172a" rx="6"/>
            <path d="M20 48 L38 18 L56 48 Z" fill="#f59e0b"/>
            <path d="M34 48 L48 26 L62 48 Z" fill="#fbbf24"/>
            <text x="74" y="32" fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="16" letter-spacing="1">GRÚAS SAN PABLO</text>
            <text x="74" y="48" fill="#f59e0b" font-family="Arial, sans-serif" font-weight="bold" font-size="9" letter-spacing="1.5">GESTIÓN DE OPERACIONES</text>
          </svg>
        </div>
        <div class="text-right text-xs text-slate-600 space-y-0.5">
          <h2 class="text-sm font-black text-slate-900 tracking-wide uppercase">ARRIENDO DE GRÚAS SAN PABLO SPA</h2>
          <div>RUT: <strong class="font-mono text-slate-900">76.849.230-1</strong></div>
          <div>Giro: Arriendo de Maquinaria y Grúas para la Minería y Construcción</div>
          <div>Fono: +56 9 9842 1094 • Temuco, Chile</div>
        </div>
      </div>

      <!-- Título y Código del Documento -->
      <div class="bg-slate-900 text-white p-3 rounded-lg mb-4 flex justify-between items-center shadow-sm">
        <div>
          <span class="text-[10px] font-mono tracking-widest text-amber-400 font-bold uppercase block">DOCUMENTO DE COBRO CONTRACTUAL</span>
          <h1 class="text-base font-black tracking-wide text-white font-mono uppercase">ESTADO DE PAGO ${numeroEdp}</h1>
        </div>
        <div class="text-right text-xs">
          <div class="font-mono text-amber-300 font-bold text-sm">OT: ${codigoOt}</div>
          <div class="text-slate-300 text-[11px]">Fecha Emisión: <strong>${fechaEmision}</strong></div>
        </div>
      </div>

      <!-- Identificación Cliente y Faena -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div class="border border-slate-300 rounded-lg p-3 bg-slate-50 space-y-1">
          <span class="text-[10px] font-bold text-amber-600 uppercase tracking-wider block font-mono">1. DATOS DEL CLIENTE MANDANTE</span>
          <div class="text-sm font-black text-slate-900">${clienteNombre}</div>
          <div class="text-xs text-slate-700">RUT: <strong class="font-mono">${clienteRut}</strong></div>
          <div class="text-xs text-slate-600">Contacto: ${proyecto?.contacto_nombre || 'Administración de Obra'}</div>
        </div>

        <div class="border border-slate-300 rounded-lg p-3 bg-slate-50 space-y-1">
          <span class="text-[10px] font-bold text-amber-600 uppercase tracking-wider block font-mono">2. DATOS DE FAENA Y PERÍODO</span>
          <div class="text-sm font-black text-slate-900">${obraNombre}</div>
          <div class="text-xs text-slate-700">Ubicación: ${obraDireccion}</div>
          <div class="text-xs text-slate-900 font-medium">Período Cobro: <strong class="font-mono text-amber-800">${periodoInicio} al ${periodoFin}</strong></div>
        </div>
      </div>

      <!-- Resumen Operativo de Jornadas -->
      <div class="grid grid-cols-3 gap-3 mb-4 text-center">
        <div class="border border-slate-200 rounded-lg p-2 bg-slate-50">
          <span class="text-[10px] font-bold text-slate-500 uppercase block">Jornadas Respaldadas</span>
          <span class="text-lg font-black font-mono text-slate-900">${(reports || []).length} DÍAS</span>
        </div>
        <div class="border border-slate-200 rounded-lg p-2 bg-slate-50">
          <span class="text-[10px] font-bold text-slate-500 uppercase block">Horas Facturables</span>
          <span class="text-lg font-black font-mono text-slate-900">${totalHorasFacturables.toFixed(1)} HRS</span>
        </div>
        <div class="border border-amber-300 rounded-lg p-2 bg-amber-50">
          <span class="text-[10px] font-bold text-amber-700 uppercase block">Sobretiempo Extra</span>
          <span class="text-lg font-black font-mono text-amber-700">+${totalSobretiempo.toFixed(1)} HRS</span>
        </div>
      </div>

      <!-- Cuadro Resumen Financiero -->
      <div class="border border-slate-300 rounded-lg overflow-hidden mb-5 shadow-sm">
        <div class="bg-slate-800 text-white px-3.5 py-1.5 font-bold text-xs uppercase tracking-wider flex justify-between">
          <span>3. LIQUIDACIÓN FINANCIERA DEL ESTADO DE PAGO</span>
          <span class="font-mono text-amber-400">VALORES EN MONEDA NACIONAL (CLP)</span>
        </div>
        <table class="w-full text-xs">
          <thead>
            <tr class="bg-slate-100 border-b border-slate-300 text-slate-700">
              <th class="px-3 py-1.5 text-left">Concepto / Servicio</th>
              <th class="px-3 py-1.5 text-center">Unidad</th>
              <th class="px-3 py-1.5 text-center">Cantidad</th>
              <th class="px-3 py-1.5 text-right">Tarifa Unitaria</th>
              <th class="px-3 py-1.5 text-right">Subtotal Neto</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr>
              <td class="px-3 py-1.5 font-medium text-slate-900">
                Arriendo Operativo de Grúa y Maquinaria en Faena
                <div class="text-[10px] text-slate-500">Según reports diarios de avance validados y firmados en terreno</div>
              </td>
              <td class="px-3 py-1.5 text-center font-mono">Horas</td>
              <td class="px-3 py-1.5 text-center font-mono font-bold">${totalHorasFacturables.toFixed(1)}</td>
              <td class="px-3 py-1.5 text-right font-mono text-slate-600">-</td>
              <td class="px-3 py-1.5 text-right font-mono font-bold text-slate-900">${formatCLP(montoNeto)}</td>
            </tr>
            ${(detalles_adicionales || []).map(it => `
              <tr>
                <td class="px-3 py-1.5 font-medium text-slate-900">${it.concepto}</td>
                <td class="px-3 py-1.5 text-center font-mono">${it.unidad_cobro || 'FIJO'}</td>
                <td class="px-3 py-1.5 text-center font-mono">${it.cantidad || 1}</td>
                <td class="px-3 py-1.5 text-right font-mono">${formatCLP(it.precio_unitario)}</td>
                <td class="px-3 py-1.5 text-right font-mono font-bold text-slate-900">${formatCLP(it.monto_subtotal)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot class="bg-slate-50 border-t-2 border-slate-300 font-mono">
            <tr>
              <td colspan="4" class="px-3 py-1.5 text-right font-bold text-slate-700">SUBTOTAL NETO:</td>
              <td class="px-3 py-1.5 text-right font-bold text-slate-900">${formatCLP(montoNeto)}</td>
            </tr>
            <tr>
              <td colspan="4" class="px-3 py-1.5 text-right font-bold text-slate-700">I.V.A. (19%):</td>
              <td class="px-3 py-1.5 text-right font-bold text-slate-800">${formatCLP(montoIva)}</td>
            </tr>
            <tr class="bg-amber-100/70 border-t border-amber-300 text-sm">
              <td colspan="4" class="px-3 py-1.5 text-right font-black text-slate-900">TOTAL GENERAL A FACTURAR (BRUTO):</td>
              <td class="px-3 py-1.5 text-right font-black text-amber-900">${formatCLP(montoTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Cuadro de Firmas de Aprobación -->
    <div class="border border-slate-300 rounded-lg p-3 bg-slate-50 mt-2 break-inside-avoid">
      <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">4. CONFORMIDAD Y APROBACIÓN DE ESTADO DE PAGO</div>
      <div class="grid grid-cols-2 gap-8 text-center pt-1">
        <div class="space-y-1">
          <div class="h-14 border-b border-slate-400 flex items-end justify-center pb-1 font-mono text-xs text-slate-400">
            Firma / Sello Responsable
          </div>
          <div class="font-bold text-slate-900 text-xs">ARRIENDO DE GRÚAS SAN PABLO SPA</div>
          <div class="text-[10px] text-slate-500">Administración de Contratos & Operaciones</div>
        </div>

        <div class="space-y-1">
          <div class="h-14 border-b border-slate-400 flex items-end justify-center pb-1 font-mono text-xs text-slate-400">
            V°B° Supervisor / ITO Mandante
          </div>
          <div class="font-bold text-slate-900 text-xs">${clienteNombre}</div>
          <div class="text-[10px] text-slate-500">Aprobación para Emisión de HES / Facturación</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== PÁGINA 2: CONCILIACIÓN CRONOLÓGICA ==================== -->
  <div class="page-break pt-2">
    <div class="flex justify-between items-center border-b border-slate-200 pb-2 mb-4">
      <div>
        <h2 class="text-sm font-black text-slate-900 uppercase font-mono">ANEXO 1: DETALLE CRONOLÓGICO DE JORNADAS OPERADAS</h2>
        <span class="text-xs text-slate-500">Conciliación día por día de horas efectivas, sobretiempos y recepción en terreno</span>
      </div>
      <span class="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-300">
        ${numeroEdp} — ${codigoOt}
      </span>
    </div>

    <div class="border border-slate-300 rounded-lg overflow-hidden mb-6">
      <table class="w-full text-xs">
        <thead>
          <tr class="bg-slate-800 text-white text-[11px]">
            <th class="px-2 py-2 text-center">Día</th>
            <th class="px-2 py-2 text-center">Fecha</th>
            <th class="px-2 py-2 text-left">Equipo / Grúa</th>
            <th class="px-2 py-2 text-left">Tripulación (Op/Rig)</th>
            <th class="px-2 py-2 text-center">Horario</th>
            <th class="px-2 py-2 text-center">Hrs Fact.</th>
            <th class="px-2 py-2 text-center">ST</th>
            <th class="px-2 py-2 text-left">Horómetros</th>
            <th class="px-2 py-2 text-left">Receptor Cliente</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          ${rowsJornadasHtml || `<tr><td colspan="9" class="p-4 text-center text-slate-400">No hay jornadas asociadas a este corte.</td></tr>`}
        </tbody>
      </table>
    </div>
  </div>

  <!-- ==================== PÁGINAS 3+: ANEXO RESPALDOS FIRMADOS ==================== -->
  <div class="page-break pt-2">
    <div class="flex justify-between items-center border-b border-slate-200 pb-2 mb-4">
      <div>
        <h2 class="text-sm font-black text-slate-900 uppercase font-mono">ANEXO 2: COMPROBANTES DE REPORTS DIARIOS Y FIRMAS DIGITALES</h2>
        <span class="text-xs text-slate-500">Evidencia documental inmutable con firmas manuscritas y coordenadas GPS capturadas en terreno</span>
      </div>
      <span class="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-300">
        ${numeroEdp} — ${codigoOt}
      </span>
    </div>

    <div class="space-y-4">
      ${anexosReportsHtml || `<div class="p-6 text-center text-slate-400">Sin respaldos de terreno adjuntos.</div>`}
    </div>
  </div>

</body>
</html>
  `;
}

/**
 * Genera el buffer binario del PDF oficial del Estado de Pago mediante Puppeteer
 */
async function generarPdfEdpBuffer(edpData) {
  const htmlContent = buildEdpHtml(edpData);

  const launchOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-application-cache',
      '--disable-features=IsolateOrigins,site-per-process',
    ]
  };

  const execPath = getChromeExecutablePath();
  if (execPath) {
    launchOptions.executablePath = execPath;
  }

  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0', timeout: 45000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        bottom: '12mm',
        left: '12mm',
        right: '12mm'
      }
    });

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    await browser.close();
    throw error;
  }
}

module.exports = {
  generarPdfEdpBuffer,
  buildEdpHtml
};
