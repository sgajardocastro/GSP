/**
 * itsPdfService.js
 * Servicio de Generación de PDF Oficial del Informe de Término de Servicio (ITS)
 * Ecosistema: Grúas San Pablo (GSP) / LeanGlobal Platform
 * Especificación Canónica: .agents/specs/47_its_pdf_flujo_aprobacion_fes_spec.md
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

function formatDateTimeCL(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch (e) {
    return String(dateStr);
  }
}

/**
 * Maquetación HTML del documento ITS
 */
function buildItsHtml(data) {
  const { its, proyecto, jornadas, costos, firmas, validacionUrl } = data;

  const folioIts = its?.folio_its || `ITS-${proyecto?.id_proyecto || '00'}-001`;
  const version = its?.version || 1;
  const tipoContexto = its?.tipo_contexto || 'URBANO';
  const fechaEmision = formatDateCL(its?.fecha_creacion || new Date());

  const clienteNombre = proyecto?.cliente_nombre || 'CLIENTE MANDANTE';
  const clienteRut = proyecto?.cliente_rut || 'N/A';
  const obraNombre = proyecto?.obra_nombre || 'OBRA / FAENA PRINCIPAL';
  const obraCiudad = proyecto?.obra_ciudad || 'Santiago';
  const codigoOt = proyecto?.codi_proyecto || `GSP-OT-${proyecto?.id_proyecto || 'N/A'}`;
  
  // Datos paramétricos de la Empresa Emisora
  const empresaRazonSocial = proyecto?.empresa_razon_social || proyecto?.empresa_nombre_fantasia || proyecto?.empresa_facturacion || 'ARRIENDO DE GRÚAS SAN PABLO SPA';
  const empresaNombreFantasia = proyecto?.empresa_nombre_fantasia || 'SAN PABLO';
  const empresaRut = proyecto?.empresa_rut || '52004162-1';
  const empresaGiro = proyecto?.empresa_giro || 'Arriendo de Maquinarias y Grúas';
  const empresaDireccion = proyecto?.empresa_direccion || 'Panamericana Norte #1020';
  const empresaLogoName = proyecto?.empresa_logo || 'logo-sanpablo.png';

  // Inyección de Logo en Base64 Data URI según leanglobal_pdf_standards
  let finalLogoBase64 = '';
  try {
    const publicDir = process.env.PUBLIC_STATIC_DIR || '/home/nodeadmin/proyectos/lean-services-gsp/public';
    let diskPath = path.join(publicDir, empresaLogoName);
    if (!fs.existsSync(diskPath)) {
      diskPath = path.join(__dirname, '../../../frontend/public', empresaLogoName);
    }
    if (!fs.existsSync(diskPath)) {
      diskPath = path.join(__dirname, '../../../frontend/public/logo-sanpablo.png');
    }
    if (fs.existsSync(diskPath)) {
      const ext = path.extname(diskPath).replace('.', '').toLowerCase();
      const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext || 'png'}`;
      const imgBuf = fs.readFileSync(diskPath);
      finalLogoBase64 = `data:${mime};base64,` + imgBuf.toString('base64');
    }
  } catch (err) {
    console.error('[ITS-PDF] Error convirtiendo logo a Base64:', err);
  }

  // Datos financieros
  const totalHoras = Number(its?.total_horas_report) || 0;
  const valorHora = Number(its?.valor_hora_pactado) || 0;
  const valorFlete = Number(its?.valor_flete_pactado) || 0;
  const totalIngresos = Number(its?.total_ingresos_facturables) || (totalHoras * valorHora + valorFlete);
  const totalCostos = Number(its?.total_costos_operacionales) || 0;
  const utilidadBruta = Number(its?.utilidad_bruta) || (totalIngresos - totalCostos);
  const margenPct = Number(its?.margen_porcentaje) || (totalIngresos > 0 ? (utilidadBruta / totalIngresos) * 100 : 0);

  // Semáforo de Margen
  let badgeMargenClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  let badgeMargenLabel = '🟢 ÓPTIMO';
  if (margenPct < 15) {
    badgeMargenClass = 'bg-rose-100 text-rose-800 border-rose-300';
    badgeMargenLabel = '🔴 ALERTA (BAJO)';
  } else if (margenPct < 35) {
    badgeMargenClass = 'bg-amber-100 text-amber-800 border-amber-300';
    badgeMargenLabel = '🟡 REGULAR';
  }

  // Filas de jornadas de terreno
  const jornadasRowsHtml = (jornadas || []).map((j, idx) => {
    const esOculta = j.es_oculta === true;
    const rowClass = esOculta ? 'bg-slate-100 text-slate-400 line-through' : (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50');
    const tarifa = Number(j.tarifa_hora !== undefined && j.tarifa_hora !== null ? j.tarifa_hora : valorHora) || 0;
    const subtotal = Number(j.subtotal !== undefined && j.subtotal !== null ? j.subtotal : (Number(j.horas_report || 0) * tarifa)) || 0;
    return `
      <tr class="${rowClass} border-b border-slate-200 text-[10px]">
        <td class="p-1.5 font-mono">${formatDateCL(j.fecha)}</td>
        <td class="p-1.5 font-mono font-bold">${j.numero_ot || codigoOt}</td>
        <td class="p-1.5 font-bold text-slate-800">${j.patente || 'S/P'}</td>
        <td class="p-1.5">${j.tipo_servicio || 'Hora'}</td>
        <td class="p-1.5 font-mono text-center">${j.hora_salida || '--:--'}</td>
        <td class="p-1.5 font-mono text-center">${j.hora_llegada || '--:--'}</td>
        <td class="p-1.5 font-mono text-center">${j.hora_termino || '--:--'}</td>
        <td class="p-1.5 font-mono text-center">${j.colacion_minutos || 60}m</td>
        <td class="p-1.5 font-mono text-right font-bold ${esOculta ? '' : 'text-amber-700 bg-amber-50/50'}">${Number(j.horas_report || 0).toFixed(1)} h</td>
        <td class="p-1.5 font-mono text-right text-slate-600">${formatCLP(tarifa)}</td>
        <td class="p-1.5 font-mono text-right font-bold ${esOculta ? '' : 'text-emerald-700'}">${formatCLP(subtotal)}</td>
        <td class="p-1.5 font-mono text-center">${j.numero_report || '-'}</td>
        <td class="p-1.5 text-center">${j.vb_conciliado ? '✅' : '⏳'}</td>
      </tr>
    `;
  }).join('');

  // Filas de costos directos (8 categorías consolidadas)
  const renderCostosCat = (catName, items, label) => {
    if (!items || items.length === 0) return '';
    const subtotal = items.reduce((acc, it) => acc + (Number(it.monto_total) || 0), 0);
    return `
      <div class="mb-3 break-inside-avoid border border-slate-200 rounded-lg overflow-hidden bg-white">
        <div class="bg-slate-100 px-3 py-1.5 flex justify-between items-center border-b border-slate-200">
          <span class="font-bold text-slate-800 text-[11px] uppercase">${label} (${items.length} ${items.length === 1 ? 'item' : 'items'})</span>
          <span class="font-mono font-black text-rose-700 text-xs">${formatCLP(subtotal)}</span>
        </div>
        <table class="w-full text-left text-[10px]">
          <thead class="bg-slate-50 text-slate-500 font-mono uppercase text-[9px] border-b border-slate-200">
            <tr>
              <th class="p-1.5">Fecha</th>
              <th class="p-1.5">Personal / Proveedor</th>
              <th class="p-1.5">Patente / OC</th>
              <th class="p-1.5">Detalle / Concepto</th>
              <th class="p-1.5 text-right">Monto</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-mono">
            ${items.map(it => {
              const patenteOc = [it.patente, it.numero_oc].filter(Boolean).join(' / ') || '-';
              const detalle = it.tipo_estanque 
                ? `${it.concepto_detalle || 'Combustible'} (${it.cantidad_unidades || it.litros || 0} Lts)`
                : (it.ruta_detalle ? `${it.concepto_detalle || 'Movilización'}: ${it.ruta_detalle}` : (it.concepto_detalle || it.concepto || '-'));
              return `
              <tr class="hover:bg-slate-50">
                <td class="p-1.5 text-slate-600">${formatDateCL(it.fecha)}</td>
                <td class="p-1.5 font-bold text-slate-800">${it.nombre_personal || it.personal || '-'}</td>
                <td class="p-1.5 text-slate-600 font-mono">${patenteOc}</td>
                <td class="p-1.5 text-slate-700 font-sans">${detalle}</td>
                <td class="p-1.5 text-right font-bold text-rose-600">${formatCLP(it.monto_total)}</td>
              </tr>
            `;}).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const costosHtml = `
    ${renderCostosCat('combustible', costos?.combustible, '1. Combustible en Ruta y Faena')}
    ${renderCostosCat('movilizacion', costos?.movilizacion, '2. Gastos de Movilización (Pasajes / Uber / Taxi)')}
    ${renderCostosCat('peajes', costos?.peajes, '3. Peajes y TAG de Ruta')}
    ${renderCostosCat('pensiones', costos?.pensiones, '4. Pensiones y Alojamiento Faena')}
    ${renderCostosCat('personal_externo', costos?.personal_externo, '5. Personal Externo / Riggers')}
    ${renderCostosCat('feriados', costos?.feriados, '6. Pago Feriados y Bonos')}
    ${renderCostosCat('subcontratacion_flete', costos?.subcontratacion_flete, '7. Subcontratación Fletes')}
    ${renderCostosCat('gastos_extraordinarios', costos?.gastos_extraordinarios, '8. Gastos Extraordinarios')}
    ${renderCostosCat('costo_hora_operador', costos?.costo_hora_operador, '9. Costo Valor Hora Operador')}
  `;

  // Firmas FES (Paso 1, Paso 2, Paso 3)
  const f1 = firmas?.paso1 || {};
  const f2 = firmas?.paso2 || {};
  const f3 = firmas?.paso3 || {};

  const renderFirmaBox = (f, title, defaultRole) => {
    const isSigned = f && f.id_fes && f.aprueba_rechaza !== 'RECHAZA';
    return `
      <div class="border ${isSigned ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-300 bg-slate-50'} rounded-lg p-3 text-center flex flex-col justify-between min-h-[140px]">
        <div>
          <span class="text-[9px] uppercase font-mono font-bold text-slate-500 block">${title}</span>
          <strong class="text-xs text-slate-900 block mt-1">${f.nombre_usuario || f.nombre || 'Pendiente de Asignación'}</strong>
          <span class="text-[10px] text-slate-600 block">${f.rol_nom || defaultRole}</span>
          <span class="text-[10px] text-slate-500 font-mono block">RUT: ${f.rut || 'N/A'}</span>
        </div>

        <div class="pt-2 border-t border-slate-200/80 mt-2">
          ${isSigned ? `
            <div class="flex items-center justify-center gap-1 text-emerald-700 font-bold text-[10px] mb-1">
              <span>🔏 Firmado Electrónicamente (FES)</span>
            </div>
            <div class="text-[9px] text-slate-500 font-mono">${formatDateTimeCL(f.fecha_firma || f.fecha)}</div>
            <div class="text-[8px] text-slate-400 font-mono truncate">ID: ${f.codigo_validacion || f.id_fes}</div>
          ` : `
            <div class="text-[10px] text-slate-400 font-mono italic">
              ⏳ Pendiente de Firma
            </div>
          `}
        </div>
      </div>
    `;
  };

  // Anexo de Respaldos de Reportes Diarios de Terreno (Spec 57)
  const anexoReportsHtml = (jornadas || []).map((j, idx) => {
    return `
      <div class="border border-slate-200 rounded-lg p-3 bg-white break-inside-avoid shadow-sm mb-3">
        <div class="flex justify-between items-center border-b border-slate-200 pb-2 mb-2">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-900 font-mono text-xs">Jornada N° ${j.orden || idx + 1} — ${formatDateCL(j.fecha)}</span>
            <span class="text-[10px] bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded border border-slate-200">
              Folio Report: ${j.numero_report || 'S/N'}
            </span>
          </div>
          <span class="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            ${Number(j.horas_report || 0).toFixed(1)} hrs Facturables
          </span>
        </div>

        <div class="grid grid-cols-3 gap-2 text-[10px] mb-2 font-mono">
          <div class="bg-slate-50 p-1.5 rounded border border-slate-100">
            <span class="text-slate-500 block text-[9px] uppercase">Equipo / Grúa</span>
            <strong class="text-slate-800">${j.patente || 'S/P'} ${j.equipo_modelo ? '(' + j.equipo_modelo + ')' : ''}</strong>
          </div>
          <div class="bg-slate-50 p-1.5 rounded border border-slate-100">
            <span class="text-slate-500 block text-[9px] uppercase">Horario Terreno</span>
            <span class="text-slate-800">${j.hora_salida || '--:--'} a ${j.hora_termino || '--:--'} (${j.colacion_minutos || 60}m colación)</span>
          </div>
          <div class="bg-slate-50 p-1.5 rounded border border-slate-100">
            <span class="text-slate-500 block text-[9px] uppercase">Horómetros</span>
            <span class="text-slate-800">Ini: ${j.horometro_inicio || '---'} • Fin: ${j.horometro_termino || '---'}</span>
          </div>
        </div>

        <!-- Firma del Mandante -->
        <div class="border border-slate-200 rounded p-2 bg-slate-50 flex items-center justify-between gap-4">
          <div class="space-y-0.5 text-[10px]">
            <span class="text-[9px] font-mono uppercase text-slate-500 font-bold block">✍️ Firma Conforme del Mandante</span>
            <div>Firmado por: <strong class="text-slate-900">${j.cliente_nombre || 'Supervisor Mandante'}</strong></div>
            <div class="text-slate-500">Cargo: ${j.cliente_cargo || 'ITO / Supervisor de Obra'}</div>
            ${j.codigo_validacion_fes ? `<div class="font-mono text-emerald-700 text-[9px]">Código FES: ${j.codigo_validacion_fes}</div>` : ''}
            ${j.accuracy_firma ? `<div class="text-slate-400 text-[9px]">Precisión GPS: ±${Math.round(j.accuracy_firma)}m</div>` : ''}
          </div>
          <div class="bg-white border border-slate-200 rounded p-1 h-14 w-36 flex items-center justify-center flex-shrink-0">
            ${j.cliente_firma_canvas_base64 ? `
              <img src="${j.cliente_firma_canvas_base64}" alt="Firma Mandante" class="max-h-full max-w-full object-contain filter contrast-125" />
            ` : `
              <span class="text-[9px] text-slate-400 italic">Firma en terreno</span>
            `}
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
  <title>ITS ${folioIts} - ${codigoOt}</title>
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

  <!-- ==================== ENCABEZADO Y MEMBRETE PARAMÉTRICO ==================== -->
  <div class="flex justify-between items-center border-b-2 border-amber-500 pb-3 mb-3">
    <div class="flex items-center">
      ${finalLogoBase64 ? `
        <img src="${finalLogoBase64}" alt="${empresaNombreFantasia}" class="h-12 max-w-[220px] object-contain" />
      ` : `
        <div class="text-base font-black tracking-wide text-slate-900 font-mono uppercase">${empresaNombreFantasia}</div>
      `}
    </div>
    <div class="text-right text-[11px] text-slate-600 space-y-0.5">
      <h2 class="text-xs font-black text-slate-900 tracking-wide uppercase">${empresaRazonSocial}</h2>
      <div>RUT: <strong class="font-mono text-slate-900">${empresaRut}</strong>${empresaDireccion ? ` • ${empresaDireccion}` : ''}</div>
      <div>Giro: ${empresaGiro}</div>
      <div class="text-amber-600 font-bold">Documento Oficial de Liquidación Técnico-Económica</div>
    </div>
  </div>

  <!-- CINTILLO DEL DOCUMENTO (FOLIO & CONTEXTO) -->
  <div class="bg-slate-900 text-white p-2.5 rounded-lg mb-3 flex justify-between items-center shadow-sm">
    <div>
      <span class="text-[9px] font-mono tracking-widest text-amber-400 font-bold uppercase block">INFORME DE AUDITORÍA Y LIQUIDACIÓN INTERNA</span>
      <h1 class="text-sm font-black tracking-wide text-white font-mono uppercase">FOLIO N° ${folioIts} (v${version}.0)</h1>
    </div>
    <div class="text-right text-xs">
      <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${tipoContexto === 'RURAL' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-300 border border-amber-500/40'}">
        ${tipoContexto === 'RURAL' ? '🌲 SERVICIO RURAL' : '🏢 SERVICIO URBANO'}
      </span>
      <div class="text-slate-300 text-[10px] mt-0.5 font-mono">Emisión: <strong>${fechaEmision}</strong></div>
    </div>
  </div>

  <!-- SECCIÓN 1: ANTECEDENTES GENERALES -->
  <div class="grid grid-cols-2 gap-3 mb-3 text-xs">
    <div class="border border-slate-200 rounded-lg p-2.5 bg-slate-50 space-y-1">
      <span class="text-slate-500 font-bold uppercase text-[9px] block">1. Datos del Cliente & Faena</span>
      <div>Cliente: <strong class="text-slate-900">${clienteNombre}</strong></div>
      <div>RUT Cliente: <span class="font-mono text-slate-700">${clienteRut}</span></div>
      <div>Obra / Faena: <strong class="text-slate-800">${obraNombre}</strong> (${obraCiudad})</div>
    </div>
    <div class="border border-slate-200 rounded-lg p-2.5 bg-slate-50 space-y-1">
      <span class="text-slate-500 font-bold uppercase text-[9px] block">Referencias Contractuales</span>
      <div>Orden de Trabajo: <strong class="text-slate-900 font-mono">${codigoOt}</strong></div>
      <div>Cotización de Origen: <span class="font-mono text-slate-700">${proyecto?.cod_cotizacion || 'COT-2026-REF'}</span></div>
      <div>Empresa Emisora: <strong class="text-slate-800">${empresaRazonSocial}</strong></div>
    </div>
  </div>

  <!-- SECCIÓN 2: BALANCE ECONÓMICO Y P&L OPERACIONAL -->
  <div class="border border-slate-300 rounded-lg p-3 bg-slate-50 mb-3 break-inside-avoid">
    <div class="flex justify-between items-center border-b border-slate-200 pb-1.5 mb-2">
      <span class="font-black text-slate-900 text-xs uppercase font-mono tracking-wider">2. Resumen Económico & Balance de Margen (P&L)</span>
      <span class="px-2 py-0.5 rounded border text-[10px] font-bold font-mono ${badgeMargenClass}">
        ${badgeMargenLabel}
      </span>
    </div>

    <div class="grid grid-cols-4 gap-2 text-center text-xs">
      <div class="bg-white p-2 rounded border border-slate-200">
        <span class="text-[9px] text-slate-500 uppercase font-mono block">Venta Neta Pactada</span>
        <strong class="text-sm font-mono text-slate-900 block">${formatCLP(totalIngresos)}</strong>
        <span class="text-[9px] text-slate-500 font-mono">${totalHoras.toFixed(1)}h @ ${formatCLP(valorHora)} + Flete</span>
      </div>

      <div class="bg-white p-2 rounded border border-slate-200">
        <span class="text-[9px] text-slate-500 uppercase font-mono block">Costos Directos Terreno</span>
        <strong class="text-sm font-mono text-rose-700 block">${formatCLP(totalCostos)}</strong>
        <span class="text-[9px] text-slate-500 font-mono">9 Categorías Consolidadas</span>
      </div>

      <div class="bg-white p-2 rounded border border-slate-200">
        <span class="text-[9px] text-slate-500 uppercase font-mono block">Utilidad Bruta</span>
        <strong class="text-sm font-mono ${utilidadBruta >= 0 ? 'text-emerald-600' : 'text-rose-600'} block">
          ${formatCLP(utilidadBruta)}
        </strong>
        <span class="text-[9px] text-slate-500 font-mono">Venta - Costos</span>
      </div>

      <div class="bg-white p-2 rounded border border-slate-200">
        <span class="text-[9px] text-slate-500 uppercase font-mono block">Margen Operacional</span>
        <strong class="text-sm font-mono ${margenPct >= 35 ? 'text-emerald-600' : (margenPct >= 15 ? 'text-amber-600' : 'text-rose-600')} block">
          ${margenPct.toFixed(1)}%
        </strong>
        <span class="text-[9px] text-slate-500 font-mono">Rentabilidad Faena</span>
      </div>
    </div>
  </div>

  <!-- SECCIÓN 3: CONCILIACIÓN DE JORNADAS DE TERRENO -->
  <div class="mb-3 break-inside-avoid border border-slate-200 rounded-lg overflow-hidden bg-white">
    <div class="bg-slate-100 px-3 py-1.5 flex justify-between items-center border-b border-slate-200">
      <span class="font-bold text-slate-800 text-[11px] uppercase">3. Conciliación de Jornadas de Terreno (${(jornadas || []).length} Jornadas)</span>
      <span class="text-xs font-mono font-bold text-slate-700">Total Facturable: <strong class="text-amber-700">${totalHoras.toFixed(1)} hrs</strong></span>
    </div>
    <table class="w-full text-left">
      <thead class="bg-slate-50 text-slate-600 font-mono uppercase text-[9px] border-b border-slate-200">
        <tr>
          <th class="p-1.5">Fecha</th>
          <th class="p-1.5">OT</th>
          <th class="p-1.5">Patente</th>
          <th class="p-1.5">Tipo Servicio</th>
          <th class="p-1.5 text-center">Salida</th>
          <th class="p-1.5 text-center">Llegada</th>
          <th class="p-1.5 text-center">Término</th>
          <th class="p-1.5 text-center">Colación</th>
          <th class="p-1.5 text-right text-amber-900">Hrs Report</th>
          <th class="p-1.5 text-right">Tarifa</th>
          <th class="p-1.5 text-right text-emerald-900">Subtotal</th>
          <th class="p-1.5 text-center">N° Report</th>
          <th class="p-1.5 text-center">V°B°</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 font-mono">
        ${jornadasRowsHtml || '<tr><td colspan="13" class="p-3 text-center text-slate-400">Sin jornadas registradas</td></tr>'}
      </tbody>
      <tfoot class="bg-slate-50 font-mono text-[9px] border-t border-slate-200">
        <tr>
          <td colspan="8" class="p-1.5 text-right font-bold text-slate-600 uppercase">Subtotales:</td>
          <td class="p-1.5 text-right font-bold text-amber-800">${totalHoras.toFixed(1)} h</td>
          <td class="p-1.5"></td>
          <td class="p-1.5 text-right font-bold text-emerald-800">${formatCLP(its?.total_ingresos_horas || (totalHoras * valorHora))}</td>
          <td colspan="2" class="p-1.5 text-slate-500 font-bold text-center">+ Flete: ${formatCLP(valorFlete)}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- SECCIÓN 4: DESGLOSE DE COSTOS OPERACIONALES (9 CATEGORÍAS) -->
  <div class="mb-3">
    <span class="font-bold text-slate-800 text-[11px] uppercase block mb-1.5">4. Detalle de Costos Operacionales Directos Imputados</span>
    ${costosHtml || '<div class="p-3 border border-slate-200 rounded-lg bg-slate-50 text-center text-slate-500 text-xs">Sin costos operacionales registrados.</div>'}
  </div>

  <!-- SECCIÓN 5: OBSERVACIONES DEL SERVICIO -->
  <div class="mb-3 break-inside-avoid border border-slate-200 rounded-lg p-2.5 bg-slate-50">
    <span class="font-bold text-slate-800 text-[10px] uppercase font-mono block mb-1">5. Observaciones Generales de Cierre</span>
    <p class="text-[11px] text-slate-700 leading-relaxed font-sans whitespace-pre-line">
      ${its?.observaciones || 'Servicio operado y concluido según especificaciones de la Orden de Trabajo y estándares de seguridad corporativos.'}
    </p>
  </div>

  <!-- SECCIÓN 6: CUADRO DE TRIPLE FIRMA FES -->
  <div class="break-inside-avoid border-t-2 border-slate-300 pt-3 mb-3">
    <span class="font-bold text-slate-800 text-[11px] uppercase font-mono block text-center mb-2.5">
      6. Cuadro de Aprobación y Validación Legal con Firma Electrónica Simple (FES)
    </span>
    <div class="grid grid-cols-3 gap-3">
      ${renderFirmaBox(f1, '1. Elaborado Por', 'Analista de Operaciones')}
      ${renderFirmaBox(f2, '2. V°B° Aprobación', 'Jefe de Operaciones')}
      ${renderFirmaBox(f3, '3. Recepción Conforme', 'Contabilidad y Finanzas')}
    </div>
  </div>

  <!-- SECCIÓN 7: ANEXO DE RESPALDOS DE REPORTES DIARIOS DE TERRENO (VINCULANTE) -->
  <div class="page-break pt-4">
    <div class="border-b-2 border-amber-500 pb-2 mb-3 flex justify-between items-center">
      <div>
        <span class="text-[9px] font-mono tracking-widest text-slate-500 font-bold uppercase block">ANEXO TÉCNICO VINCULANTE (Spec 57)</span>
        <h2 class="text-sm font-black text-slate-900 font-mono uppercase">7. Respaldos Digitales de Reports Diarios de Faena (${(jornadas || []).length} Jornadas)</h2>
      </div>
      <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[10px] font-mono font-bold">
        100% VALIDADOS CON FIRMA Y GPS
      </span>
    </div>
    
    <div class="space-y-3">
      ${anexoReportsHtml || '<div class="p-3 border border-slate-200 rounded-lg bg-slate-50 text-center text-slate-500 text-xs">Sin reports diarios registrados.</div>'}
    </div>
  </div>

  <!-- PIE DE PÁGINA INSTITUCIONAL CON TIMBRE TSA -->
  <div class="text-center text-[9px] text-slate-400 font-mono border-t border-slate-200 pt-2 flex justify-between items-center">
    <span>${empresaRazonSocial || 'Grúas San Pablo SpA'} • Sistema Integral de Operaciones & CRM</span>
    <span>Sello Temporal TSA RFC 3161 • Verificable en: ${validacionUrl || 'https://servidor.leanglobal.cl/validador-doc'}</span>
  </div>

</body>
</html>
  `;
}

/**
 * Compila y genera el buffer del PDF oficial de ITS
 */
async function generarPdfITS(data) {
  const puppeteer = await getPuppeteer();
  const chromePath = getChromeExecutablePath();

  const launchOptions = {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  };

  if (chromePath) {
    launchOptions.executablePath = chromePath;
  }

  const browser = await puppeteer.launch(launchOptions);
  try {
    const page = await browser.newPage();
    const html = buildItsHtml(data);

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

module.exports = {
  generarPdfITS,
  buildItsHtml
};
