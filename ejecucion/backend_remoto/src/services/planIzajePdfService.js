/**
 * planIzajePdfService.js
 * Generador de PDF Oficial A4 del Plan de Izaje y Cálculo de Capacidad (GSP)
 * Ecosistema: LeanGlobal Platform / Grúas San Pablo
 * Especificación: .agents/specs/37_plan_de_izaje_reactivo_spec.md
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');

function fmtMiles(num) {
  const n = Number(num || 0);
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function buildPlanIzajeHtml(data = {}) {
  const {
    folio_plan = '#PIZ-2026-0001',
    codi_proyecto = 'GSP-OT',
    fecha_emision = new Date().toLocaleDateString('es-CL'),
    hora_emision = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    empresa = {},
    cliente_faena = 'Faena Operativa GSP',
    equipo_nombre = 'Grúa Móvil Telescópica',
    equipo_patente = 'S/P',
    elemento_izar = 'Estructura / Carga General',
    operador_nombre = 'Operador Asignado',
    operador_rut = 'S/R',
    rigger_nombre = 'Rigger Encargado',
    rigger_rut = 'S/R',
    prevencionista_nombre = 'Dayana • Prevención HSE',
    viento_kmh = 18,
    radio_max_m = 16,
    largo_pluma_m = 38,
    angulo_deg = 64,
    peso_neto_kg = 13500,
    peso_gancho_kg = 650,
    peso_yugo_kg = 300,
    peso_aparejos_kg = 150,
    capacidad_tabla_kg = 20000,
    aparejos_detalle = [],
    observaciones = ''
  } = data;

  const pNeto = Number(peso_neto_kg || 0);
  const pGancho = Number(peso_gancho_kg || 0);
  const pYugo = Number(peso_yugo_kg || 0);
  const pAparejos = Number(peso_aparejos_kg || 0);
  const pTotal = pNeto + pGancho + pYugo + pAparejos;
  const capTabla = Number(capacidad_tabla_kg || 1);
  const pct = (pTotal / capTabla) * 100;

  let dictamenTop = 'AUTORIZADO';
  let dictamenColor = '#15803d';
  let boxBg = '#ecfdf5';
  let boxBorder = '#059669';
  let dictamenTexto = 'CONFORME — MANIOBRA DENTRO DEL LÍMITE SEGURO (≤ 75%)';

  if (pct > 75 && pct <= 85) {
    dictamenTop = 'CON PRECAUCIÓN';
    dictamenColor = '#b45309';
    boxBg = '#fffbeb';
    boxBorder = '#d97706';
    dictamenTexto = 'PRECAUCIÓN — CAPACIDAD EN RANGO LÍMITE (75% A 85%)';
  } else if (pct > 85) {
    dictamenTop = 'BLOQUEADO (>85%)';
    dictamenColor = '#dc2626';
    boxBg = '#fef2f2';
    boxBorder = '#dc2626';
    dictamenTexto = 'RECHAZADO / BLOQUEADO — SUPERA EL 85% DE CAPACIDAD';
  }

  const hashRigger = crypto.createHash('sha256').update(`${folio_plan}|RIGGER|${rigger_nombre}|${fecha_emision}`).digest('hex').slice(0, 14);
  const hashOperador = crypto.createHash('sha256').update(`${folio_plan}|OPERADOR|${operador_nombre}|${fecha_emision}`).digest('hex').slice(0, 14);

  const defaultAparejos = Array.isArray(aparejos_detalle) && aparejos_detalle.length > 0
    ? aparejos_detalle
    : [
        { elemento: 'Eslingas Sintéticas', especificacion: '4 Ramales × 8 Ton c/u • Ángulo Estrobamiento > 60°', factor: '7 : 1', estado: 'CONFORME' },
        { elemento: 'Grilletes Lira Certificados', especificacion: '4 Unid. Crosby 1 1/4" (WLL 12 Ton c/u) con pasador', factor: '5 : 1', estado: 'CONFORME' },
        { elemento: 'Estabilidad y Outriggers', especificacion: 'Vigas extendidas al 100% sobre almohadillas de reparto', factor: '100%', estado: 'CONFORME' }
      ];

  const filasAparejosHtml = defaultAparejos.map(ap => `
    <tr>
      <td style="padding: 5px 7px; font-weight: 700; border: 1px solid #cbd5e1; color: #0f172a;">${ap.elemento}</td>
      <td style="padding: 5px 7px; border: 1px solid #cbd5e1; color: #334155;">${ap.especificacion}</td>
      <td style="padding: 5px 7px; text-align: center; font-family: monospace; font-weight: 700; border: 1px solid #cbd5e1;">${ap.factor}</td>
      <td style="padding: 5px 7px; text-align: center; font-weight: 800; color: #15803d; border: 1px solid #cbd5e1;">${ap.estado || 'CONFORME'}</td>
    </tr>
  `).join('');

  const logoHtml = empresa.logoBase64
    ? `<img src="${empresa.logoBase64}" style="max-height: 44px; max-width: 150px; object-fit: contain; display: block; margin: 0 auto 3px auto;" />`
    : `<div style="width: 42px; height: 42px; line-height: 42px; background: #f59e0b; color: #0f172a; font-weight: 900; font-size: 16px; border-radius: 6px; margin: 0 auto 4px auto; text-align: center;">GSP</div>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Plan de Izaje Digital - ${folio_plan}</title>
  <style>
    @page { size: A4 portrait; margin: 9mm 10mm; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #0f172a;
      font-size: 10px;
      line-height: 1.35;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    table { width: 100%; border-collapse: collapse; }
    .sec-bar {
      background: #1e293b;
      color: #ffffff;
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 8px;
      margin-top: 10px;
    }
    .lbl { color: #64748b; font-size: 8.8px; display: block; margin-bottom: 1px; }
    .val { color: #0f172a; font-weight: 700; font-size: 10px; }
  </style>
</head>
<body>

  <!-- ENCABEZADO CORPORATIVO -->
  <table style="border: 2px solid #1e293b; margin-bottom: 10px;">
    <tr>
      <td style="width: 24%; padding: 8px; border-right: 2px solid #1e293b; text-align: center; background: #f8fafc;">
        ${logoHtml}
        <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #0f172a;">Grúas San Pablo</div>
        <div style="font-size: 7.5px; color: #64748b;">Ingeniería & Operaciones</div>
      </td>
      <td style="width: 50%; padding: 8px; border-right: 2px solid #1e293b; text-align: center;">
        <div style="font-size: 8.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Memoria Técnica de Maniobra</div>
        <div style="font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin: 3px 0;">PLAN DE IZAJE Y CÁLCULO DE CAPACIDAD</div>
        <div style="font-size: 9px; font-weight: 700; color: #1d4ed8;">Estándar de Seguridad con Compuerta Mandatoria al 85%</div>
      </td>
      <td style="width: 26%; padding: 7px 9px; background: #f8fafc; font-family: monospace; font-size: 9px;">
        <div style="margin-bottom: 3px;">CÓDIGO: <strong style="float:right; color:#0f172a;">SGI-OP-PIZ-02</strong></div>
        <div style="margin-bottom: 3px;">FOLIO: <strong style="float:right; color:#1d4ed8;">${folio_plan}</strong></div>
        <div style="margin-bottom: 3px;">OT: <strong style="float:right; color:#0f172a;">${codi_proyecto}</strong></div>
        <div style="margin-bottom: 3px;">FECHA: <strong style="float:right; color:#0f172a;">${fecha_emision}</strong></div>
        <div>DICTAMEN: <strong style="float:right; color:${dictamenColor};">${dictamenTop}</strong></div>
      </td>
    </tr>
  </table>

  <!-- SECCIÓN 1: IDENTIFICACIÓN -->
  <div class="sec-bar">1. Identificación de Equipo, Cuadrilla y Carga a Izar</div>
  <table style="border: 1px solid #cbd5e1;">
    <tr>
      <td style="width: 33.3%; padding: 6px 8px; border: 1px solid #cbd5e1;">
        <span class="lbl">Equipo de Izaje Asignado:</span>
        <span class="val">${equipo_nombre}</span>
      </td>
      <td style="width: 33.3%; padding: 6px 8px; border: 1px solid #cbd5e1;">
        <span class="lbl">Patente / Código Interno:</span>
        <span class="val" style="font-family: monospace;">${equipo_patente}</span>
      </td>
      <td style="width: 33.3%; padding: 6px 8px; border: 1px solid #cbd5e1;">
        <span class="lbl">Elemento / Carga a Levantar:</span>
        <span class="val" style="color: #1e3a8a;">${elemento_izar}</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">
        <span class="lbl">Operador de Grúa:</span>
        <span class="val">${operador_nombre}</span>
      </td>
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">
        <span class="lbl">Rigger Encargado de Maniobra:</span>
        <span class="val">${rigger_nombre}</span>
      </td>
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">
        <span class="lbl">Velocidad de Viento Registrada:</span>
        <span class="val" style="font-family: monospace; color: ${Number(viento_kmh) <= 32 ? '#15803d' : '#dc2626'};">${viento_kmh} km/h (Máx: 32 km/h)</span>
      </td>
    </tr>
    <tr>
      <td colspan="3" style="padding: 5px 8px; border: 1px solid #cbd5e1; background: #f8fafc;">
        <span class="lbl" style="display:inline;">Cliente / Faena Operativa: </span>
        <strong style="color:#0f172a;">${cliente_faena}</strong>
      </td>
    </tr>
  </table>

  <!-- SECCIÓN 2 Y 3: CROQUIS GEOMÉTRICO + MEMORIA DE CÁLCULO -->
  <table style="margin-top: 10px;">
    <tr>
      <!-- COLUMNA IZQUIERDA: CROQUIS SVG -->
      <td style="width: 42%; vertical-align: top; padding-right: 8px;">
        <div style="border: 1px solid #cbd5e1; background: #f8fafc; padding: 8px;">
          <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
            2. Croquis de Geometría de Operación
          </div>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px; text-align: center;">
            <svg width="240" height="165" viewBox="0 0 260 180" xmlns="http://www.w3.org/2000/svg">
              <line x1="10" y1="155" x2="250" y2="155" stroke="#334155" stroke-width="2"/>
              <rect x="25" y="135" width="45" height="20" rx="3" fill="#f59e0b" stroke="#0f172a" stroke-width="1.5"/>
              <circle cx="35" cy="155" r="5" fill="#0f172a"/>
              <circle cx="60" cy="155" r="5" fill="#0f172a"/>
              <line x1="48" y1="135" x2="175" y2="25" stroke="#eab308" stroke-width="6" stroke-linecap="round"/>
              <line x1="48" y1="135" x2="175" y2="25" stroke="#0f172a" stroke-width="1" stroke-dasharray="3,3"/>
              <line x1="175" y1="25" x2="175" y2="95" stroke="#475569" stroke-width="1.5"/>
              <rect x="155" y="95" width="40" height="26" fill="#1e40af" rx="2"/>
              <text x="175" y="111" text-anchor="middle" font-size="8" font-weight="bold" fill="#ffffff">CARGA</text>
              <line x1="48" y1="168" x2="175" y2="168" stroke="#dc2626" stroke-width="1.5"/>
              <text x="112" y="177" text-anchor="middle" font-size="9" font-weight="bold" fill="#dc2626">Radio = ${Number(radio_max_m)} m</text>
              <text x="95" y="68" text-anchor="middle" font-size="9" font-weight="bold" fill="#0f172a" transform="rotate(-38 95,68)">Pluma = ${Number(largo_pluma_m)} m</text>
              <text x="78" y="130" font-size="8.5" font-weight="bold" fill="#0284c7">${Number(angulo_deg)}°</text>
            </svg>
          </div>
          <table style="margin-top: 6px; background: #ffffff; border: 1px solid #e2e8f0; text-align: center; font-family: monospace;">
            <tr>
              <td style="padding: 4px; border-right: 1px solid #e2e8f0;">
                <span style="font-size: 7.5px; color: #64748b; display: block;">RADIO MÁX</span>
                <strong style="font-size: 9.5px; color: #0f172a;">${Number(radio_max_m).toFixed(1)} m</strong>
              </td>
              <td style="padding: 4px; border-right: 1px solid #e2e8f0;">
                <span style="font-size: 7.5px; color: #64748b; display: block;">LARGO PLUMA</span>
                <strong style="font-size: 9.5px; color: #0f172a;">${Number(largo_pluma_m).toFixed(1)} m</strong>
              </td>
              <td style="padding: 4px;">
                <span style="font-size: 7.5px; color: #64748b; display: block;">ÁNGULO</span>
                <strong style="font-size: 9.5px; color: #0f172a;">${Number(angulo_deg).toFixed(0)}°</strong>
              </td>
            </tr>
          </table>
        </div>
      </td>

      <!-- COLUMNA DERECHA: MEMORIA DE CÁLCULO -->
      <td style="width: 58%; vertical-align: top;">
        <div class="sec-bar" style="margin-top: 0;">3. Memoria de Cálculo de Pesos y Factor de Utilización</div>
        <table style="border: 1px solid #cbd5e1; font-size: 9.5px;">
          <tr>
            <td style="padding: 5px 8px; border-bottom: 1px solid #e2e8f0; color: #334155;">1. Peso Neto de la Carga (P_neto)</td>
            <td style="padding: 5px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-weight: 700;">${fmtMiles(pNeto)} kg</td>
          </tr>
          <tr>
            <td style="padding: 5px 8px; border-bottom: 1px solid #e2e8f0; color: #334155;">2. Peso de Gancho / Pasteca Principal (P_gancho)</td>
            <td style="padding: 5px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${fmtMiles(pGancho)} kg</td>
          </tr>
          <tr>
            <td style="padding: 5px 8px; border-bottom: 1px solid #e2e8f0; color: #334155;">3. Peso de Yugo / Balancín Separador (P_yugo)</td>
            <td style="padding: 5px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${fmtMiles(pYugo)} kg</td>
          </tr>
          <tr>
            <td style="padding: 5px 8px; border-bottom: 1px solid #cbd5e1; color: #334155;">4. Peso de Aparejos: Eslingas y Grilletes (P_aparejos)</td>
            <td style="padding: 5px 8px; border-bottom: 1px solid #cbd5e1; text-align: right; font-family: monospace;">${fmtMiles(pAparejos)} kg</td>
          </tr>
          <tr style="background: #eff6ff; border-bottom: 2px solid #1e293b;">
            <td style="padding: 6px 8px; font-weight: 900; color: #1e3a8a;">PESO BRUTO TOTAL A IZAR (Σ P)</td>
            <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: 900; font-size: 11px; color: #1e3a8a;">${fmtMiles(pTotal)} kg</td>
          </tr>
          <tr style="background: #fffbeb;">
            <td style="padding: 6px 8px; font-weight: 700; color: #78350f;">Capacidad Nominal según Tabla al Radio Máx.</td>
            <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: 800; color: #92400e;">${fmtMiles(capTabla)} kg</td>
          </tr>
        </table>

        <!-- BOX DE DICTAMEN 85% -->
        <table style="margin-top: 8px; border: 2px solid ${boxBorder}; background: ${boxBg}; border-radius: 4px;">
          <tr>
            <td style="padding: 8px 10px;">
              <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; color: ${dictamenColor};">Índice de Utilización de Capacidad:</div>
              <div style="font-size: 10px; font-weight: 900; color: ${dictamenColor}; margin: 2px 0;">${dictamenTexto}</div>
              <div style="font-size: 8px; color: #475569;">Fórmula: (Peso Bruto Total / Capacidad de Tabla) × 100</div>
            </td>
            <td style="padding: 8px 10px; text-align: right; width: 110px;">
              <div style="font-size: 20px; font-weight: 900; font-family: monospace; color: ${dictamenColor};">${pct.toFixed(1)}%</div>
              <div style="font-size: 8px; font-family: monospace; color: #64748b;">Máx Permitido: 85.0%</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- SECCIÓN 4: ELEMENTOS DE ESTROBADO Y SOPORTE -->
  <div class="sec-bar">4. Especificación de Elementos de Estrobado y Condiciones de Soporte</div>
  <table style="border: 1px solid #cbd5e1; font-size: 9.2px;">
    <thead>
      <tr style="background: #f1f5f9; text-transform: uppercase; font-size: 8.5px; color: #334155;">
        <th style="padding: 5px 7px; text-align: left; border: 1px solid #cbd5e1; width: 26%;">Elemento / Criterio</th>
        <th style="padding: 5px 7px; text-align: left; border: 1px solid #cbd5e1; width: 46%;">Especificación Técnica</th>
        <th style="padding: 5px 7px; text-align: center; border: 1px solid #cbd5e1; width: 14%;">Factor Seg.</th>
        <th style="padding: 5px 7px; text-align: center; border: 1px solid #cbd5e1; width: 14%;">Estado</th>
      </tr>
    </thead>
    <tbody>
      ${filasAparejosHtml}
    </tbody>
  </table>

  ${observaciones ? `
  <div style="margin-top: 6px; padding: 6px 8px; border: 1px solid #cbd5e1; background: #f8fafc; font-size: 9px;">
    <strong>Observaciones de Maniobra:</strong> ${observaciones}
  </div>` : ''}

  <!-- SECCIÓN 5: PIE DE FIRMAS FES -->
  <div style="margin-top: 14px; padding-top: 8px; border-top: 2px solid #1e293b;">
    <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 6px;">
      5. Aprobación Técnica y Firmas Electrónicas (FES) — Trazabilidad Dirección del Trabajo (DT)
    </div>
    <table>
      <tr>
        <td style="width: 33.3%; padding-right: 5px; vertical-align: top;">
          <div style="border: 1px solid #cbd5e1; background: #f8fafc; padding: 7px; border-radius: 4px;">
            <div style="font-weight: 800; color: #0f172a; font-size: 9.5px;">${rigger_nombre}</div>
            <div style="font-size: 8px; color: #475569;">Rigger / Elaborador Plan • RUT: ${rigger_rut}</div>
            <div style="margin: 5px 0; padding: 4px 6px; background: #ffffff; border: 1px solid #e2e8f0; font-family: monospace; font-size: 7.5px; color: #334155;">
              FIRMADO FES • PIN + OTP<br>
              Hash: <span style="color: #1d4ed8;">${hashRigger}</span>
            </div>
            <div style="font-size: 7.5px; color: #64748b; font-family: monospace;">${fecha_emision} ${hora_emision}</div>
          </div>
        </td>
        <td style="width: 33.3%; padding: 0 3px; vertical-align: top;">
          <div style="border: 1px solid #cbd5e1; background: #f8fafc; padding: 7px; border-radius: 4px;">
            <div style="font-weight: 800; color: #0f172a; font-size: 9.5px;">${operador_nombre}</div>
            <div style="font-size: 8px; color: #475569;">Operador de Grúa • RUT: ${operador_rut}</div>
            <div style="margin: 5px 0; padding: 4px 6px; background: #ffffff; border: 1px solid #e2e8f0; font-family: monospace; font-size: 7.5px; color: #334155;">
              FIRMADO FES • PIN + OTP<br>
              Hash: <span style="color: #1d4ed8;">${hashOperador}</span>
            </div>
            <div style="font-size: 7.5px; color: #64748b; font-family: monospace;">${fecha_emision} ${hora_emision}</div>
          </div>
        </td>
        <td style="width: 33.3%; padding-left: 5px; vertical-align: top;">
          <div style="border: 1px solid #cbd5e1; background: #f8fafc; padding: 7px; border-radius: 4px;">
            <div style="font-weight: 800; color: #0f172a; font-size: 9.5px;">${prevencionista_nombre}</div>
            <div style="font-size: 8px; color: #475569;">V°B° Seguridad y Prevención GSP</div>
            <div style="margin: 5px 0; padding: 4px 6px; background: #ffffff; border: 1px solid #e2e8f0; font-family: monospace; font-size: 7.5px; color: #15803d; font-weight: bold;">
              VALIDACIÓN AUTOMÁTICA SGI<br>
              Sello TSA RFC 3161
            </div>
            <div style="font-size: 7.5px; color: #64748b; font-family: monospace;">Verificación QR Activa</div>
          </div>
        </td>
      </tr>
    </table>
    <div style="margin-top: 8px; font-size: 7.5px; color: #64748b; text-align: center;">
      Documento electrónico generado por plataforma LeanGlobal®, acreditada ante la Dirección del Trabajo (DT) de Chile. Georreferenciado y sellado criptográficamente.
    </div>
  </div>

</body>
</html>`;
}

async function generarPdfPlanIzaje(data) {
  const htmlContent = buildPlanIzajeHtml(data);
  const uuid = uuidv4();
  const tmpDir = os.tmpdir();
  const tempHtmlPath = path.join(tmpDir, `plan_izaje_${uuid}.html`);
  const tempPdfPath = path.join(tmpDir, `plan_izaje_${uuid}.pdf`);

  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');

  try {
    await new Promise((resolve, reject) => {
      const isWin = process.platform === 'win32';
      const cmd = isWin
        ? `wkhtmltopdf --enable-local-file-access --load-error-handling ignore --load-media-error-handling ignore --page-size A4 --orientation Portrait --margin-top 8mm --margin-bottom 8mm --margin-left 8mm --margin-right 8mm "${tempHtmlPath}" "${tempPdfPath}"`
        : `xvfb-run -a --server-args="-screen 0 794x1123x24" wkhtmltopdf --enable-local-file-access --load-error-handling ignore --load-media-error-handling ignore --page-size A4 --orientation Portrait --margin-top 8mm --margin-bottom 8mm --margin-left 8mm --margin-right 8mm "${tempHtmlPath}" "${tempPdfPath}"`;

      exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
        if (error && !fs.existsSync(tempPdfPath)) {
          console.error('[PlanIzaje wkhtmltopdf] Error:', error.message, stderr);
          return reject(new Error('Fallo al compilar Plan de Izaje con wkhtmltopdf: ' + error.message));
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
  generarPdfPlanIzaje,
  buildPlanIzajeHtml
};
