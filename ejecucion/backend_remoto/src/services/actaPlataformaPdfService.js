/**
 * actaPlataformaPdfService.js
 * Generador de PDF Oficial A4 del Acta de Entrega y Recepción de Maquinaria 360° (BSM / Royal Rental / GSP)
 * Ecosistema: LeanGlobal Platform / Grúas San Pablo / Bestmaq
 * Estándar de Producto: leanglobal_pdf_standards / gsp_pdf_and_email_standards
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
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
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

const ITEMS_OFICIALES_19 = [
  'Alarma Traslación',
  'Baterías',
  'Arrancador Motor Aéreo y Tierra',
  'Interruptor de Parada de Emergencia',
  'Llave de Contacto',
  'Perillas de Tablero Control Bastidor',
  'Perillas de Tablero Control Canastillo',
  'Estado de Mangueras Hidráulicas',
  'Estado General de la Pluma',
  'Pintura de Equipo',
  'Pintura de Canastillo',
  'Puerta Canastillo',
  'Estado de Capot',
  'Estado de Neumáticos',
  'Estado de Joystick',
  'Baliza',
  'Tapa de Combustible',
  'Chapa de Contacto',
  'Extintor'
];

function buildActaPlataformaHtml(data) {
  const {
    folio_acta = 'ACT-0001',
    numero_contrato = 'S/N',
    fecha_emision = new Date().toLocaleDateString('es-CL'),
    empresa = {},
    cliente = {},
    equipo = {},
    horometro_in = '',
    combustible_in = '100% (Lleno)',
    horometro_out = '',
    combustible_out = '',
    checklist_entrega = [],
    checklist_retiro = [],
    fotos_entrega = [],
    fotos_retiro = [],
    obs_entrega = '',
    obs_retiro = '',
    receptor_entrega = {},
    receptor_retiro = {},
    chofer_entrega = {},
    chofer_retiro = {},
    es_retiro = false
  } = data;

  // Mapa de ítems
  const mapaEntrega = {};
  (checklist_entrega || []).forEach(it => {
    mapaEntrega[it.nombre || it.item] = it.estado || it.entrega || 'SI';
  });

  const mapaRetiro = {};
  (checklist_retiro || []).forEach(it => {
    mapaRetiro[it.nombre || it.item] = it.estado || it.recepcion || 'SI';
  });

  const filasItemsHtml = ITEMS_OFICIALES_19.map((itemNombre, idx) => {
    const valEnt = mapaEntrega[itemNombre] || '-';
    const valRet = es_retiro ? (mapaRetiro[itemNombre] || '-') : '-';

    const getBadge = (val) => {
      if (val === 'SI') return '<span class="badge-si">✓ SI</span>';
      if (val === 'NO') return '<span class="badge-no">✕ NO</span>';
      if (val === 'NA') return '<span class="badge-na">NA</span>';
      return '<span style="color:#94a3b8;">-</span>';
    };

    return `
      <tr>
        <td style="text-align: center; font-weight: bold; width: 6%; color: #64748b;">${idx + 1}</td>
        <td style="font-weight: 600; width: 54%; color: #0f172a;">${itemNombre}</td>
        <td style="text-align: center; width: 20%;">${getBadge(valEnt)}</td>
        <td style="text-align: center; width: 20%;">${getBadge(valRet)}</td>
      </tr>
    `;
  }).join('');

  // Galería de fotos (soporta todas las fotos base + adicionales)
  const renderFotos = (listaFotos) => {
    if (!listaFotos || listaFotos.length === 0) {
      return '<div style="color: #64748b; font-size: 7.5px; font-style: italic; padding: 6px; text-align: center;">Sin fotografías registradas</div>';
    }
    const cards = listaFotos.map((f, i) => `
      <div style="display: inline-block; width: 31%; vertical-align: top; margin: 1%; text-align: center; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2.5px; box-sizing: border-box;">
        <img src="${f.url_data || f.url_path}" style="width: 100%; height: 60px; object-fit: cover; border-radius: 2px; display: block;" />
        <div style="font-size: 7px; font-weight: bold; color: #1e293b; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${f.label || `Foto ${i + 1}`}</div>
      </div>
    `).join('');
    return `<div style="width: 100%; font-size: 0;">${cards}</div>`;
  };

  const logoHtml = empresa.logoBase64
    ? `<img src="${empresa.logoBase64}" style="max-height: 42px; max-width: 170px; object-fit: contain;" />`
    : `<div style="font-size: 13px; font-weight: 900; color: #0f172a; font-family: monospace;">${empresa.nombre || 'BESTMAQ / ROYAL RENTAL'}</div>`;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Acta de Entrega y Recepción - ${folio_acta}</title>
    <style>
      @page {
        size: A4 portrait;
        margin: 8mm 9mm;
      }
      body {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 7.8px;
        line-height: 1.25;
        color: #0f172a;
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .section-bar {
        background: #0f172a;
        color: #ffffff;
        font-size: 8px;
        font-weight: 800;
        text-transform: uppercase;
        padding: 3px 6px;
        margin-top: 4px;
        margin-bottom: 3px;
        border-radius: 3px;
        letter-spacing: 0.3px;
      }
      .data-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 3px;
      }
      .data-table td {
        border: 1px solid #cbd5e1;
        padding: 2.8px 5px;
        font-size: 7.6px;
      }
      .lbl {
        background: #f8fafc;
        font-weight: bold;
        color: #334155;
      }
      .val {
        color: #0f172a;
      }
      .checklist-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 4px;
      }
      .checklist-table th {
        background: #1e293b;
        color: #ffffff;
        padding: 2.8px 4px;
        font-size: 7.5px;
        text-transform: uppercase;
        border: 1px solid #334155;
      }
      .checklist-table td {
        border: 1px solid #cbd5e1;
        padding: 1.8px 4px;
        font-size: 7.3px;
      }
      .checklist-table tr:nth-child(even) {
        background: #f8fafc;
      }
      .badge-si {
        background: #dcfce7;
        color: #15803d;
        font-weight: bold;
        padding: 1px 4px;
        border-radius: 3px;
        font-size: 6.8px;
        border: 1px solid #86efac;
      }
      .badge-no {
        background: #fee2e2;
        color: #b91c1c;
        font-weight: bold;
        padding: 1px 4px;
        border-radius: 3px;
        font-size: 6.8px;
        border: 1px solid #fca5a5;
      }
      .badge-na {
        background: #f1f5f9;
        color: #64748b;
        font-weight: bold;
        padding: 1px 4px;
        border-radius: 3px;
        font-size: 6.8px;
        border: 1px solid #cbd5e1;
      }
      .signatures-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 4px;
      }
      .sig-card {
        width: 49%;
        border: 1px solid #94a3b8;
        border-radius: 4px;
        padding: 5px;
        vertical-align: top;
        background: #ffffff;
      }
      .sig-title {
        font-size: 7.6px;
        font-weight: 800;
        text-transform: uppercase;
        color: #0f172a;
        border-bottom: 1px solid #cbd5e1;
        padding-bottom: 2.5px;
        margin-bottom: 3px;
      }
      .canvas-box {
        height: 48px;
        background: #f8fafc;
        border: 1px dashed #cbd5e1;
        border-radius: 3px;
        text-align: center;
        margin-bottom: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .footer-legal {
        margin-top: 4px;
        border-top: 1px solid #cbd5e1;
        padding-top: 2px;
        font-size: 6.5px;
        color: #64748b;
        text-align: center;
      }
    </style>
  </head>
  <body>

    <!-- 1. ENCABEZADO Y MEMBRETE PARAMÉTRICO OFICIAL (LEANGLOBAL / GSP) -->
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0d9488; padding-bottom: 6px; margin-bottom: 6px;">
      <div style="display: flex; align-items: center;">
        ${logoHtml}
      </div>
      <div style="text-align: right; font-size: 7.8px; color: #475569; line-height: 1.3;">
        <div style="font-size: 9.5px; font-weight: 900; color: #0f172a; text-transform: uppercase;">${empresa.nombre || 'SOCIEDAD BESTMAQ VENTA DE MAQUINARIA USADA LIMITADA'}</div>
        <div>RUT: <strong style="font-family: monospace; color: #0f172a;">${empresa.rut || '76.209.534-3'}</strong> &nbsp;|&nbsp; Giro: ${empresa.giro || 'Arriendo de Maquinarias y Equipos'}</div>
        <div>Dirección: ${empresa.direccion || 'Camino Labranza KM 9.5, Temuco'} &nbsp;|&nbsp; Fono: +56 9 9443 7725</div>
        <div style="color: #0d9488; font-weight: bold;">Documento Oficial de Control y Trazabilidad Operativa 360°</div>
      </div>
    </div>

    <!-- CINTILLO INSTITUCIONAL OSCURO -->
    <div style="background-color: #0f172a; color: #ffffff; padding: 5px 9px; border-radius: 5px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 7px; font-family: monospace; letter-spacing: 0.8px; color: #2dd4bf; font-weight: bold; text-transform: uppercase;">
          GESTIÓN DE FLOTA Y ARRIENDO DE MAQUINARIA • EVIDENCIA TÉCNICA 360°
        </div>
        <div style="font-size: 10.5px; font-weight: 900; letter-spacing: 0.3px; font-family: monospace; text-transform: uppercase; color: #ffffff;">
          FOLIO N° ${folio_acta} • CONTRATO N° ${numero_contrato || 'S/N'}
        </div>
      </div>
      <div style="text-align: right;">
        <span style="display: inline-block; padding: 2px 7px; border-radius: 3px; font-size: 8px; font-family: monospace; font-weight: bold; ${es_retiro ? 'background-color: #f59e0b; color: #000000;' : 'background-color: #059669; color: #ffffff;'}">
          ${es_retiro ? 'DEVOLUCIÓN Y RETIRO FINAL' : 'ENTREGA CONFORME EN OBRA'}
        </span>
        <div style="font-size: 7px; color: #cbd5e1; margin-top: 1.5px; font-family: monospace;">Emisión: <strong>${fecha_emision}</strong></div>
      </div>
    </div>

    <!-- 2. DATOS DE ARRENDATARIO Y EQUIPO -->
    <div class="section-bar">1. Individualización de Partes y Maquinaria en Arriendo</div>
    <table class="data-table">
      <tr>
        <td class="lbl" style="width: 15%;">Arrendatario / Mandante:</td>
        <td class="val" style="width: 45%;"><strong>${cliente.razon_social || cliente.nombre || 'MANDANTE'}</strong></td>
        <td class="lbl" style="width: 15%;">R.U.T. Cliente:</td>
        <td class="val" style="width: 25%;"><strong style="font-family: monospace;">${cliente.rut || 'SIN RUT'}</strong></td>
      </tr>
      <tr>
        <td class="lbl">Obra / Destino:</td>
        <td class="val">${cliente.obra || cliente.direccion || 'Faena Mandante'}</td>
        <td class="lbl">Contacto en Obra:</td>
        <td class="val">${cliente.contacto || 'Supervisor Faena'}</td>
      </tr>
      <tr>
        <td class="lbl">Equipo / Modelo:</td>
        <td class="val"><strong>${equipo.marca || ''} ${equipo.modelo || ''} (${equipo.tipo_equipo || 'Plataforma'})</strong></td>
        <td class="lbl">Cód. Interno / Patente:</td>
        <td class="val"><strong style="font-family: monospace;">${equipo.patente || equipo.codigo_interno || 'S/P'}</strong></td>
      </tr>
      <tr>
        <td class="lbl">Horómetro Entrega (IN):</td>
        <td class="val"><strong>${horometro_in || 'S/I'} Hrs</strong> &nbsp;|&nbsp; Batería/Diesel: <strong>${combustible_in || '100% (Lleno)'}</strong></td>
        <td class="lbl">Horómetro Retiro (OUT):</td>
        <td class="val"><strong>${horometro_out ? `${horometro_out} Hrs` : 'Pendiente Retiro'}</strong> &nbsp;|&nbsp; Batería/Diesel: <strong>${combustible_out || '-'}</strong></td>
      </tr>
    </table>

    <!-- 3. MATRIZ OFICIAL DE 19 ITEMS -->
    <div class="section-bar">2. Checklist Oficial de Equipamiento y Estado Técnico (19 Ítems)</div>
    <table class="checklist-table">
      <thead>
        <tr>
          <th>N°</th>
          <th style="text-align: left;">Componente / Sistema Evaluado</th>
          <th>Estado en Entrega</th>
          <th>Estado en Devolución</th>
        </tr>
      </thead>
      <tbody>
        ${filasItemsHtml}
      </tbody>
    </table>

    <!-- 4. EVIDENCIA FOTOGRÁFICA 360° -->
    <div class="section-bar">3. Evidencia Fotográfica 360° (Entrega en Obra y Recuperación)</div>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 3px;">
      <tr>
        <td style="width: 50%; vertical-align: top; padding-right: 3px;">
          <div style="font-size: 7.5px; font-weight: bold; color: #047857; margin-bottom: 2px;">A. Fotografías de Entrega Inicial (${fotos_entrega.length} registradas)</div>
          ${renderFotos(fotos_entrega)}
          ${obs_entrega ? `<div style="font-size: 6.8px; color: #334155; margin-top: 2px; font-style: italic;"><strong>Obs. Entrega:</strong> ${obs_entrega}</div>` : ''}
        </td>
        <td style="width: 50%; vertical-align: top; padding-left: 3px;">
          <div style="font-size: 7.5px; font-weight: bold; color: #b45309; margin-bottom: 2px;">B. Fotografías de Devolución / Retiro (${fotos_retiro.length} registradas)</div>
          ${renderFotos(fotos_retiro)}
          ${obs_retiro ? `<div style="font-size: 6.8px; color: #334155; margin-top: 2px; font-style: italic;"><strong>Obs. Retiro:</strong> ${obs_retiro}</div>` : ''}
        </td>
      </tr>
    </table>

    <!-- 5. FIRMAS DE RESPONSABILIDAD Y RECEPCIÓN CONFORME -->
    <div class="section-bar">4. Conformidad y Firmas en Pantalla</div>
    <table class="signatures-table">
      <tr>
        <!-- BLOQUE ENTREGA -->
        <td class="sig-card">
          <div class="sig-title" style="color: #047857;">MOMENTO 1: ENTREGA CONFORME EN OBRA (INICIO ARRIENDO)</div>
          <div class="canvas-box">
            ${receptor_entrega.firma_base64
              ? `<img src="${receptor_entrega.firma_base64}" style="max-height: 44px; max-width: 90%; object-contain;" />`
              : `<span style="font-size: 7.2px; color: #94a3b8;">Firma no registrada</span>`
            }
          </div>
          <div style="font-size: 7.2px; line-height: 1.25;">
            <strong>Recibido por (Cliente):</strong> ${receptor_entrega.nombre || '........................'}<br>
            <strong>RUT Receptor:</strong> ${receptor_entrega.rut || '........................'} &nbsp;|&nbsp; <strong>Cargo:</strong> ${receptor_entrega.cargo || 'Supervisor Obra'}<br>
            <strong>Entregado por (Chofer):</strong> ${chofer_entrega.nombre || 'Chofer Asignado'} (RUT: ${chofer_entrega.rut || 'S/R'})<br>
            <span style="font-size: 6.6px; color: #047857; font-weight: bold;">✓ La firma del receptor certifica la recepción operativa y activa el arriendo en obra.</span>
          </div>
        </td>

        <!-- BLOQUE RETIRO -->
        <td class="sig-card">
          <div class="sig-title" style="color: #b45309;">MOMENTO 2: DEVOLUCIÓN Y RECUPERACIÓN (TÉRMINO ARRIENDO)</div>
          <div class="canvas-box">
            ${receptor_retiro.firma_base64
              ? `<img src="${receptor_retiro.firma_base64}" style="max-height: 44px; max-width: 90%; object-contain;" />`
              : `<span style="font-size: 7.2px; color: #94a3b8;">Pendiente de Devolución / Retiro</span>`
            }
          </div>
          <div style="font-size: 7.2px; line-height: 1.25;">
            <strong>Entregado por (Cliente):</strong> ${receptor_retiro.nombre || 'Pendiente'}<br>
            <strong>RUT Devolución:</strong> ${receptor_retiro.rut || '-'} &nbsp;|&nbsp; <strong>Cargo:</strong> ${receptor_retiro.cargo || '-'}<br>
            <strong>Recibido por (Chofer):</strong> ${chofer_retiro.nombre || 'Chofer Retiro'} (RUT: ${chofer_retiro.rut || 'S/R'})<br>
            <span style="font-size: 6.6px; color: #b45309; font-weight: bold;">✓ Certifica la devolución física del equipo y autoriza el viaje de retorno a base.</span>
          </div>
        </td>
      </tr>
    </table>

    <div class="footer-legal">
      Documento emitido electrónicamente a través de LeanGlobal Platform conforme a la Ley N° 19.799 sobre Firma Electrónica y Documentos Digitales. Válido sin enmiendas ni raspaduras.
    </div>

  </body>
  </html>
  `;
}

/**
 * Compila y genera el buffer del PDF oficial del Acta de Plataforma
 */
async function generarPdfActaPlataforma(data) {
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
    const html = buildActaPlataformaHtml(data);

    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 20000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '8mm',
        right: '8mm',
        bottom: '8mm',
        left: '8mm'
      }
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

module.exports = {
  generarPdfActaPlataforma,
  buildActaPlataformaHtml
};
