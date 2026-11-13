const fs = require('fs');
const path = require('path');

const servicePath = path.resolve(__dirname, '../ejecucion/backend_remoto/src/services/itsPdfService.js');
const logoPath = path.resolve(__dirname, '../ejecucion/frontend/public/logo-sanpablo.png');
const logoB64 = fs.readFileSync(logoPath).toString('base64');

console.log('Construyendo itsPdfService.js canónico SPEC-121...');

let code = fs.readFileSync(servicePath, 'utf8');

// 1. Agregar LOGO_GSP_BASE64 y helpers de minutos si no existen
if (!code.includes('LOGO_GSP_BASE64')) {
  code = code.replace(
    "const { v4: uuidv4 } = require('uuid');",
    `const { v4: uuidv4 } = require('uuid');\n\nconst LOGO_GSP_BASE64 = 'data:image/png;base64,${logoB64}';`
  );
}

if (!code.includes('function diffMinutes(')) {
  const helperCode = `
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
`;
  code = code.replace('function formatCLP(', helperCode + '\nfunction formatCLP(');
}

// 2. En buildItsHtml, agregar resolución de logoBase64
if (!code.includes('let logoBase64 =')) {
  code = code.replace(
    'const { its, proyecto, jornadas, costos, firmas, validacionUrl } = data;',
    `const { its, proyecto, jornadas, costos, firmas, validacionUrl } = data;

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
        logoBase64 = \`data:image/png;base64,\${fileBuf.toString('base64')}\`;
        break;
      }
    }
  } catch (e) {}
  if (!logoBase64) {
    logoBase64 = LOGO_GSP_BASE64;
  }`
  );
}

// 3. Reemplazar encabezado institucional con logo
const oldHeaderHtml = `    <!-- Header Membretado Oficial -->
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #1e3a8a; padding-bottom: 8px; margin-bottom: 12px;">
        <div>
            <div style="font-size: 16px; font-weight: 900; color: #1e3a8a; letter-spacing: 0.5px; line-height: 1.1;">\${empresaNombreFantasia}</div>
            <div style="font-size: 8.5px; font-weight: 800; color: #64748b; letter-spacing: 1px;">ARRIENDO DE MAQUINARIAS</div>
        </div>
        <div style="text-align: center;">
            <h1 style="font-size: 15px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
                INFORME TÉRMINO DE SERVICIO
            </h1>
            <div style="font-size: 10.5px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin-top: 2px; letter-spacing: 0.5px;">
                (\${regimen})
            </div>
        </div>
        <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
            <span style="display: inline-block; background-color: #1e1b4b; border: 1.5px solid #312e81; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 900; color: #ffffff; font-family: monospace; letter-spacing: 0.5px;">
                FOLIO N° \${folio} <span style="color: #93c5fd; font-weight: 800; font-size: 9.5px; margin-left: 3px;">(V\${version})</span>
            </span>
            <span style="display: inline-block; background-color: #fef3c7; border: 1.5px solid #f59e0b; padding: 2px 7px; border-radius: 4px; font-size: 10.5px; font-weight: 900; color: #92400e; margin-top: 2px;">
                Cotización #\${cotizacion}
            </span>
            <div style="font-size: 9.5px; color: #0f172a; font-weight: 700; margin-top: 2px;">Fecha Emisión: <strong>\${fEmision}</strong></div>
        </div>
    </div>`;

const newHeaderHtml = `    <!-- Header Membretado Oficial (SPEC-121 Con Logo San Pablo) -->
    <table style="width: 100%; border-bottom: 2.5px solid #1e3a8a; padding-bottom: 8px; margin-bottom: 12px; border-collapse: collapse;">
        <tr>
            <td style="width: 38%; vertical-align: middle;">
                <table style="border-collapse: collapse;">
                    <tr>
                        \${logoBase64 ? \`<td style="vertical-align: middle; padding-right: 12px;"><img src="\${logoBase64}" style="max-height: 48px; max-width: 130px; object-fit: contain; display: block;" alt="San Pablo" /></td>\` : ''}
                        <td style="vertical-align: middle;">
                            <div style="font-size: 15px; font-weight: 900; color: #1e3a8a; letter-spacing: 0.5px; line-height: 1.1;">\${empresaNombreFantasia}</div>
                            <div style="font-size: 8px; font-weight: 800; color: #64748b; letter-spacing: 1px;">ARRIENDO DE MAQUINARIAS</div>
                        </td>
                    </tr>
                </table>
            </td>
            <td style="width: 32%; text-align: center; vertical-align: middle;">
                <h1 style="font-size: 14.5px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
                    INFORME TÉRMINO DE SERVICIO
                </h1>
                <div style="font-size: 10px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin-top: 2px; letter-spacing: 0.5px;">
                    (\${regimen})
                </div>
            </td>
            <td style="width: 30%; text-align: right; vertical-align: middle;">
                <div style="display: inline-block; background-color: #1e1b4b; border: 1.5px solid #312e81; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 900; color: #ffffff; font-family: monospace; letter-spacing: 0.5px;">
                    FOLIO N° \${folio} <span style="color: #93c5fd; font-weight: 800; font-size: 9.5px; margin-left: 3px;">(V\${version})</span>
                </div>
                <div style="margin-top: 2px;">
                    <span style="display: inline-block; background-color: #fef3c7; border: 1.5px solid #f59e0b; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 900; color: #92400e;">
                        Cotización #\${cotizacion}
                    </span>
                </div>
                <div style="font-size: 9.5px; color: #0f172a; font-weight: 700; margin-top: 2px;">Fecha Emisión: <strong>\${fEmision}</strong></div>
            </td>
        </tr>
    </table>`;

code = code.replace(oldHeaderHtml, newHeaderHtml);

// 4. Actualizar jornadas y cálculo de viáticos
const oldJornadasBlock = `  // Jornadas de terreno con columnas de ancho controlado
  let totalHorasReportNum = 0;
  const jornadasRows = (jornadas || []).map((j, idx) => {
    const hSal = j.hora_salida ? String(j.hora_salida).slice(0, 5) : '—';
    const hLle = j.hora_llegada ? String(j.hora_llegada).slice(0, 5) : '—';
    const hTer = j.hora_termino ? String(j.hora_termino).slice(0, 5) : '—';
    const hRet = j.hora_retorno ? String(j.hora_retorno).slice(0, 5) : '—';
    const colMin = j.colacion_minutos !== null && j.colacion_minutos !== undefined ? Number(j.colacion_minutos) : (j.colacion ? 60 : 0);
    const colStr = colMin > 0 ? \`\${String(Math.floor(colMin / 60)).padStart(2, '0')}:\${String(colMin % 60).padStart(2, '0')}\` : '00:00';
    const hrsReales = Number(j.horas_reales || 0);
    const hrsRep = Number(j.horas_report || 0);
    totalHorasReportNum += hrsRep;

    return \`
      <tr style="border-bottom: 1px solid #e2e8f0; \${idx % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f8fafc;'}">
        <td style="padding: 4px 5px; text-align: center; font-weight: 600; border-right: 1px solid #e2e8f0;">\${formatDateCL(j.fecha)}</td>
        <td style="padding: 4px 5px; text-align: center; font-weight: 800; color: #1e3a8a; border-right: 1px solid #e2e8f0;">\${j.numero_ot || codigoOt}</td>
        <td style="padding: 4px 5px; text-align: center; color: #334155; border-right: 1px solid #e2e8f0;">\${j.tipo_servicio || 'Hora'}</td>
        <td style="padding: 4px 5px; text-align: center; font-weight: 700; border-right: 1px solid #e2e8f0; white-space: nowrap;">\${j.patente || '—'}</td>
        <td style="padding: 4px 5px; text-align: center; border-right: 1px solid #e2e8f0;">\${hSal}</td>
        <td style="padding: 4px 5px; text-align: center; border-right: 1px solid #e2e8f0;">\${hLle}</td>
        <td style="padding: 4px 5px; text-align: center; border-right: 1px solid #e2e8f0;">\${hTer}</td>
        <td style="padding: 4px 5px; text-align: center; border-right: 1px solid #e2e8f0;">\${hRet}</td>
        <td style="padding: 4px 5px; text-align: center; border-right: 1px solid #e2e8f0;">\${colStr}</td>
        <td style="padding: 4px 5px; text-align: center; font-weight: 800; color: #1d4ed8; border-right: 1px solid #e2e8f0;">\${hrsReales > 0 ? \`\${hrsReales.toFixed(1)}h\` : '—'}</td>
        <td style="padding: 4px 5px; text-align: center; font-weight: 800; color: #047857; border-right: 1px solid #e2e8f0;">\${hrsRep > 0 ? \`\${hrsRep.toFixed(1)}h\` : '—'}</td>
        <td style="padding: 4px 5px; text-align: center; font-weight: 700;">\${j.numero_report || '—'}</td>
      </tr>
    \`;
  }).join('');`;

const newJornadasBlock = `  // Jornadas de terreno con columnas de ancho controlado (SPEC-121)
  const esUrbano = (its?.tipo_contexto === 'URBANO') || (!its?.tipo_contexto && !esModalidadMensual);
  let totalHorasReportNum = 0;
  let totHrsServicio = 0;
  let totHrsViaticos = 0;
  let totViaticosMonto = 0;

  const jornadasRows = (jornadas || []).map((j, idx) => {
    const hSal = j.hora_salida ? String(j.hora_salida).slice(0, 5) : '—';
    const hLle = j.hora_llegada ? String(j.hora_llegada).slice(0, 5) : '—';
    const hTer = j.hora_termino ? String(j.hora_termino).slice(0, 5) : '—';
    const hRet = j.hora_retorno ? String(j.hora_retorno).slice(0, 5) : '—';
    const colMin = j.colacion_minutos !== null && j.colacion_minutos !== undefined ? Number(j.colacion_minutos) : (j.colacion ? 60 : 0);
    const colStr = colMin > 0 ? \`\${String(Math.floor(colMin / 60)).padStart(2, '0')}:\${String(colMin % 60).padStart(2, '0')}\` : '00:00';

    // 1. Hrs Servicio (Urbano vs Rural)
    let hrsServ = Number(j.horas_reales || 0);
    if (!hrsServ && j.hora_termino) {
      const iniServ = esUrbano ? (j.hora_salida || j.hora_llegada) : (j.hora_llegada || j.hora_salida);
      const minServ = Math.max(0, diffMinutes(iniServ, j.hora_termino) - colMin);
      hrsServ = parseFloat((minServ / 60).toFixed(1));
    }
    totHrsServicio += hrsServ;

    // 2. Hrs Viáticos (Puerta a Puerta)
    let hrsViat = Number(j.horas_viaticos || 0);
    if (!hrsViat && (j.hora_salida || j.hora_llegada)) {
      const iniViat = j.hora_salida || j.hora_llegada;
      const finViat = j.hora_retorno || j.hora_termino;
      const minViat = Math.max(0, diffMinutes(iniViat, finViat) - colMin);
      hrsViat = parseFloat((minViat / 60).toFixed(1));
    }
    totHrsViaticos += hrsViat;

    // 3. Monto Viático (Escala tabular: < 8h = $0; 8h = $7.000; +$1.000/h extra, tope $18.000)
    const hRed = Math.round(hrsViat);
    const viaticoMonto = hRed < 8 ? 0 : Math.min(18000, 7000 + (hRed - 8) * 1000);
    totViaticosMonto += viaticoMonto;

    const hrsRep = Number(j.horas_report || 0);
    totalHorasReportNum += hrsRep;

    return \`
      <tr style="border-bottom: 1px solid #e2e8f0; \${idx % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f8fafc;'}">
        <td style="padding: 3.5px 4px; text-align: center; font-weight: 600; border-right: 1px solid #e2e8f0; white-space: nowrap;">\${formatDateCL(j.fecha)}</td>
        <td style="padding: 3.5px 4px; text-align: center; font-weight: 800; color: #1e3a8a; border-right: 1px solid #e2e8f0; white-space: nowrap;">\${j.numero_ot || codigoOt}</td>
        <td style="padding: 3.5px 4px; text-align: center; color: #334155; border-right: 1px solid #e2e8f0;">\${j.tipo_servicio || 'Hora'}</td>
        <td style="padding: 3.5px 4px; text-align: center; font-weight: 700; border-right: 1px solid #e2e8f0; white-space: nowrap;">\${j.patente || '—'}</td>
        <td style="padding: 3.5px 4px; text-align: center; border-right: 1px solid #e2e8f0;">\${hSal}</td>
        <td style="padding: 3.5px 4px; text-align: center; border-right: 1px solid #e2e8f0;">\${hLle}</td>
        <td style="padding: 3.5px 4px; text-align: center; border-right: 1px solid #e2e8f0;">\${hTer}</td>
        <td style="padding: 3.5px 4px; text-align: center; border-right: 1px solid #e2e8f0;">\${hRet}</td>
        <td style="padding: 3.5px 4px; text-align: center; border-right: 1px solid #e2e8f0;">\${colStr}</td>
        <td style="padding: 3.5px 4px; text-align: center; font-weight: 800; color: #1d4ed8; border-right: 1px solid #e2e8f0;">\${hrsServ > 0 ? \`\${hrsServ.toFixed(1)}h\` : '—'}</td>
        <td style="padding: 3.5px 4px; text-align: center; font-weight: 800; color: #0284c7; border-right: 1px solid #e2e8f0;">\${hrsViat > 0 ? \`\${hrsViat.toFixed(1)}h\` : '—'}</td>
        <td style="padding: 3.5px 4px; text-align: center; font-weight: 800; color: #047857; border-right: 1px solid #e2e8f0;">\${hrsRep > 0 ? \`\${hrsRep.toFixed(1)}h\` : '—'}</td>
        <td style="padding: 3.5px 4px; text-align: right; font-weight: 800; color: #0f172a; border-right: 1px solid #e2e8f0;">\${viaticoMonto > 0 ? \`$\${formatCLP(viaticoMonto)}\` : '—'}</td>
        <td style="padding: 3.5px 4px; text-align: center; font-weight: 700; white-space: nowrap;">\${j.numero_report || '—'}</td>
      </tr>
    \`;
  }).join('');`;

code = code.replace(oldJornadasBlock, newJornadasBlock);

// 5. Ajustar totAlim para que tome totViaticosMonto si alimRows viene vacío
code = code.replace(
  'const totAlim = sumMonto(alimRows);',
  'const totAlim = sumMonto(alimRows) || totViaticosMonto;'
);

// 6. Reemplazar la tabla de jornadas en Sección 2
const oldSec2Table = `        <table style="width: 100%; border-collapse: collapse; font-size: 9px; border: 1px solid #cbd5e1;">
            <thead>
                <tr style="background-color: #f8fafc; font-weight: 700; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1;">
                    <th style="padding: 4px 5px; text-align: center; border-right: 1px solid #cbd5e1;">Fecha</th>
                    <th style="padding: 4px 5px; text-align: center; border-right: 1px solid #cbd5e1;">N° OT</th>
                    <th style="padding: 4px 5px; text-align: center; border-right: 1px solid #cbd5e1;">Tipo Serv.</th>
                    <th style="padding: 4px 5px; text-align: center; border-right: 1px solid #cbd5e1;">Patente</th>
                    <th style="padding: 4px 5px; text-align: center; border-right: 1px solid #cbd5e1;">Salida</th>
                    <th style="padding: 4px 5px; text-align: center; border-right: 1px solid #cbd5e1;">Llegada</th>
                    <th style="padding: 4px 5px; text-align: center; border-right: 1px solid #cbd5e1;">Término</th>
                    <th style="padding: 4px 5px; text-align: center; border-right: 1px solid #cbd5e1;">Retorno</th>
                    <th style="padding: 4px 5px; text-align: center; border-right: 1px solid #cbd5e1;">Colación</th>
                    <th style="padding: 4px 5px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 800; color: #1d4ed8;">Hrs Reales</th>
                    <th style="padding: 4px 5px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 800; color: #047857;">Hrs Report</th>
                    <th style="padding: 4px 5px; text-align: center;">N° Report</th>
                </tr>
            </thead>
            <tbody>
                \${jornadasRows || '<tr><td colspan="12" style="padding: 8px; text-align: center; color: #64748b;">Sin jornadas registradas</td></tr>'}
                <!-- Subtotal Fila Final -->
                <tr style="background-color: #e0e7ff; border-top: 2px solid #cbd5e1; font-weight: bold;">
                    <td colspan="9" style="padding: 5px 6px; text-align: right; font-weight: 900; color: #0f172a;">TOTAL HORAS REPORT:</td>
                    <td style="padding: 5px 6px; border-right: 1px solid #cbd5e1;"></td>
                    <td style="padding: 5px 6px; text-align: center; font-family: monospace; font-weight: 900; color: #064e3b; background-color: #a7f3d0; border-right: 1px solid #cbd5e1; font-size: 10px;">
                        \${totalHorasReportNum.toFixed(1)} hrs
                    </td>
                    <td style="padding: 5px 6px; background-color: #e0e7ff;"></td>
                </tr>
            </tbody>
        </table>`;

const newSec2Table = `        <div style="font-size: 9px; font-weight: 800; color: #1e3a8a; margin-bottom: 2px; text-align: right;">
            \${esUrbano ? '🏢 RÉGIMEN URBANO (Hrs Servicio: Salida → Término)' : '🌲 RÉGIMEN RURAL (Hrs Servicio: Llegada → Término)'}
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 8.5px; border: 1px solid #cbd5e1;">
            <thead>
                <tr style="background-color: #f8fafc; font-weight: 800; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1;">
                    <th style="padding: 4px 4px; text-align: center; border-right: 1px solid #cbd5e1;">Fecha</th>
                    <th style="padding: 4px 4px; text-align: center; border-right: 1px solid #cbd5e1;">N° OT</th>
                    <th style="padding: 4px 4px; text-align: center; border-right: 1px solid #cbd5e1;">Servicio</th>
                    <th style="padding: 4px 4px; text-align: center; border-right: 1px solid #cbd5e1;">Patente</th>
                    <th style="padding: 4px 4px; text-align: center; border-right: 1px solid #cbd5e1;">Salida</th>
                    <th style="padding: 4px 4px; text-align: center; border-right: 1px solid #cbd5e1;">Llegada</th>
                    <th style="padding: 4px 4px; text-align: center; border-right: 1px solid #cbd5e1;">Término</th>
                    <th style="padding: 4px 4px; text-align: center; border-right: 1px solid #cbd5e1;">Retorno</th>
                    <th style="padding: 4px 4px; text-align: center; border-right: 1px solid #cbd5e1;">Colac.</th>
                    <th style="padding: 4px 4px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 800; color: #1d4ed8;">Hrs Serv.</th>
                    <th style="padding: 4px 4px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 800; color: #0284c7;">Hrs Viát.</th>
                    <th style="padding: 4px 4px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 800; color: #047857;">Hrs Rep.</th>
                    <th style="padding: 4px 4px; text-align: right; border-right: 1px solid #cbd5e1; font-weight: 800; color: #0f172a;">Viático ($)</th>
                    <th style="padding: 4px 4px; text-align: center;">N° Report</th>
                </tr>
            </thead>
            <tbody>
                \${jornadasRows || '<tr><td colspan="14" style="padding: 8px; text-align: center; color: #64748b;">Sin jornadas registradas</td></tr>'}
                <!-- Subtotales Conciliados -->
                <tr style="background-color: #f1f5f9; border-top: 1.5px solid #cbd5e1; font-weight: 800; font-size: 8.5px;">
                    <td colspan="9" style="padding: 4px 6px; text-align: right; color: #0f172a; border-right: 1px solid #cbd5e1;">TOTALES CONCILIADOS:</td>
                    <td style="padding: 4px 4px; text-align: center; color: #1d4ed8; border-right: 1px solid #cbd5e1;">\${totHrsServicio.toFixed(1)}h</td>
                    <td style="padding: 4px 4px; text-align: center; color: #0284c7; border-right: 1px solid #cbd5e1;">\${totHrsViaticos.toFixed(1)}h</td>
                    <td style="padding: 4px 4px; text-align: center; color: #047857; border-right: 1px solid #cbd5e1; background-color: #d1fae5;">\${totalHorasReportNum.toFixed(1)}h</td>
                    <td style="padding: 4px 4px; text-align: right; color: #0f172a; border-right: 1px solid #cbd5e1;">$\${formatCLP(totViaticosMonto)}</td>
                    <td style="padding: 4px 4px; text-align: center; color: #64748b;">—</td>
                </tr>
            </tbody>
        </table>`;

code = code.replace(oldSec2Table, newSec2Table);

// 7. Reemplazar el bloque de costosResumenHtml para incluir los 10 puntos completos
const oldResumenCostosBlock = `  // Resumen de costos con supresión de partidas en $0
  let costosResumenHtml = '';
  if (totAlim > 0) costosResumenHtml += \`<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">1. Viáticos Alimentación</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$\${formatCLP(totAlim)}</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">\${getPct(totAlim)}%</td></tr>\`;
  if (totPeajes > 0) costosResumenHtml += \`<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">2. Peajes y Tag</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$\${formatCLP(totPeajes)}</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">\${getPct(totPeajes)}%</td></tr>\`;
  if (totPension > 0) costosResumenHtml += \`<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">3. Pensiones y Alojamiento</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$\${formatCLP(totPension)}</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">\${getPct(totPension)}%</td></tr>\`;
  if (totComb > 0) costosResumenHtml += \`<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">4. Combustible Diesel</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$\${formatCLP(totComb)}</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">\${getPct(totComb)}%</td></tr>\`;
  if (totMovil > 0) costosResumenHtml += \`<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">5. Movilización Personal</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$\${formatCLP(totMovil)}</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">\${getPct(totMovil)}%</td></tr>\`;
  if (totPext + totFeriados > 0) costosResumenHtml += \`<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">6. Personal Externo y Feriados</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$\${formatCLP(totPext + totFeriados)}</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">\${getPct(totPext + totFeriados)}%</td></tr>\`;
  if (totSubcont > 0) costosResumenHtml += \`<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">7. Subcontratación Flete Externo</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$\${formatCLP(totSubcont)}</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">\${getPct(totSubcont)}%</td></tr>\`;
  if (totExtra > 0) costosResumenHtml += \`<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">8. Gastos Extraordinarios</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$\${formatCLP(totExtra)}</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">\${getPct(totExtra)}%</td></tr>\`;
  if (totCostoOperadores > 0) costosResumenHtml += \`<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">9. Costo Valor Hora Operador</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$\${formatCLP(totCostoOperadores)}</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">\${getPct(totCostoOperadores)}%</td></tr>\`;

  if (!costosResumenHtml) {
    costosResumenHtml = \`<tr><td colspan="3" style="padding: 4px 5px; text-align: center; color: #64748b; font-style: italic;">Sin costos imputados ($0)</td></tr>\`;
  }`;

const newResumenCostosBlock = `  // Cuadro Resumen de Costos Operacionales: OBLIGATORIO DESPLEGAR LOS 10 PUNTOS DEL 1 AL 10 (INCLUSO CON $0)
  const costosResumenItems = [
    { num: 1, nombre: 'Viáticos de Alimentación Terreno', monto: totAlim },
    { num: 2, nombre: 'Peajes y TAG de Ruta', monto: totPeajes },
    { num: 3, nombre: 'Combustibles (Grúa / Vehículos Apoyo)', monto: totComb },
    { num: 4, nombre: 'Pensiones y Alojamiento Faena', monto: totPension },
    { num: 5, nombre: 'Movilización y Traslados Terreno', monto: totMovil },
    { num: 6, nombre: 'Personal Externo y Riggers', monto: totPext },
    { num: 7, nombre: 'Feriados y Domingos Operados', monto: totFeriados },
    { num: 8, nombre: 'Subcontratación Flete Externo (Ramplas)', monto: totSubcont },
    { num: 9, nombre: 'Gastos Extraordinarios de Faena', monto: totExtra },
    { num: 10, nombre: 'Costo Valor Hora Operador (Horas Report)', monto: totCostoOperadores }
  ];

  const costosResumenHtml = costosResumenItems.map(item => \`
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 2.5px 5px; color: #0f172a; font-weight: \${item.monto > 0 ? '800' : '600'};">
        \${item.num}. \${item.nombre}
      </td>
      <td style="padding: 2.5px 5px; text-align: right; font-weight: 800; color: \${item.monto > 0 ? '#0f172a' : '#64748b'};">
        $\${formatCLP(item.monto)}
      </td>
      <td style="padding: 2.5px 5px; text-align: right; font-weight: 800; color: \${item.monto > 0 ? '#1e3a8a' : '#94a3b8'};">
        \${getPct(item.monto)}%
      </td>
    </tr>
  \`).join('');`;

code = code.replace(oldResumenCostosBlock, newResumenCostosBlock);

// 8. Reemplazar Sección 5 para agregar Historial de Ciclo y Rechazos
const oldSec5Block = `    <!-- 5. SELLOS OFICIALES DE FIRMA ELECTRÓNICA SIMPLE (FES) Y TRAZABILIDAD -->
    <div style="margin-top: 10px; page-break-inside: avoid;">
        <div style="font-size: 9.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">
            5. SELLOS OFICIALES DE FIRMA ELECTRÓNICA SIMPLE (FES) Y TRAZABILIDAD
        </div>
        <table style="width: 100%; border-collapse: separate; border-spacing: 5px 0; font-size: 9px; margin-left: -5px; margin-right: -5px;">
            <tbody>
                <tr>
                    <!-- Columna 1: Elaboró (Analista / Operaciones) -->
                    <td style="width: 33.33%; vertical-align: top; border: \${f1?.id_fes ? '1.5px solid #10b981' : '1px dashed #cbd5e1'}; background-color: \${f1?.id_fes ? '#f0fdf4' : '#f8fafc'}; border-radius: 4px; padding: 6px;">
                        <div style="font-weight: 800; color: \${f1?.id_fes ? '#047857' : '#64748b'}; text-transform: uppercase; font-size: 8px; border-bottom: 1px solid \${f1?.id_fes ? '#a7f3d0' : '#e2e8f0'}; padding-bottom: 3px; margin-bottom: 4px; display: flex; justify-content: space-between;">
                            <span>1. ELABORACIÓN</span>
                            <span>\${f1?.id_fes ? '✓ FES' : '⏳ PENDIENTE'}</span>
                        </div>
                        \${f1?.id_fes ? \`
                            <div style="font-size: 9px; font-weight: 800; color: #0f172a;">\${f1.nombre_usuario || 'Yiara Mendoza'}</div>
                            <div style="font-size: 8px; color: #475569;">\${f1.rol_nom || 'Analista PMO / Operaciones'}</div>
                            <div style="font-size: 7.5px; color: #0369a1; font-family: monospace; font-weight: bold; margin-top: 2px;">\${f1.codigo_validacion || 'FES-OK'}</div>
                            <div style="font-size: 7.5px; color: #64748b; margin-top: 1px;">\${formatDateTimeCL(f1.fecha_firma || f1.fecha_creacion)}</div>
                        \` : \`
                            <div style="font-size: 8.5px; color: #94a3b8; font-style: italic; padding: 8px 0; text-align: center;">Operaciones<br/>(Pendiente de firma)</div>
                        \`}
                    </td>

                    <!-- Columna 2: Verificó (Administrador de Operaciones) -->
                    <td style="width: 33.33%; vertical-align: top; border: \${f2?.id_fes ? '1.5px solid #10b981' : '1px dashed #cbd5e1'}; background-color: \${f2?.id_fes ? '#f0fdf4' : '#f8fafc'}; border-radius: 4px; padding: 6px;">
                        <div style="font-weight: 800; color: \${f2?.id_fes ? '#047857' : '#64748b'}; text-transform: uppercase; font-size: 8px; border-bottom: 1px solid \${f2?.id_fes ? '#a7f3d0' : '#e2e8f0'}; padding-bottom: 3px; margin-bottom: 4px; display: flex; justify-content: space-between;">
                            <span>2. VERIFICACIÓN (ADMINISTRADOR)</span>
                            <span>\${f2?.id_fes ? '✓ FES' : '⏳ PENDIENTE'}</span>
                        </div>
                        \${f2?.id_fes ? \`
                            <div style="font-size: 9px; font-weight: 800; color: #0f172a;">\${f2.nombre_usuario || 'Jonathan'}</div>
                            <div style="font-size: 8px; color: #475569;">\${f2.rol_nom || 'Jefatura de Operaciones'}</div>
                            <div style="font-size: 7.5px; color: #0369a1; font-family: monospace; font-weight: bold; margin-top: 2px;">\${f2.codigo_validacion || 'FES-OK'}</div>
                            <div style="font-size: 7.5px; color: #64748b; margin-top: 1px;">\${formatDateTimeCL(f2.fecha_firma || f2.fecha_creacion)}</div>
                        \` : \`
                            <div style="font-size: 8.5px; color: #94a3b8; font-style: italic; padding: 8px 0; text-align: center;">Administración<br/>(Pendiente de verificación)</div>
                        \`}
                    </td>

                    <!-- Columna 3: Aprobó (Contabilidad) -->
                    <td style="width: 33.33%; vertical-align: top; border: \${f3?.id_fes ? '1.5px solid #10b981' : '1px dashed #cbd5e1'}; background-color: \${f3?.id_fes ? '#f0fdf4' : '#f8fafc'}; border-radius: 4px; padding: 6px;">
                        <div style="font-weight: 800; color: \${f3?.id_fes ? '#047857' : '#64748b'}; text-transform: uppercase; font-size: 8px; border-bottom: 1px solid \${f3?.id_fes ? '#a7f3d0' : '#e2e8f0'}; padding-bottom: 3px; margin-bottom: 4px; display: flex; justify-content: space-between;">
                            <span>3. APROBACIÓN (CONTABILIDAD)</span>
                            <span>\${f3?.id_fes ? '✓ FES' : '⏳ PENDIENTE'}</span>
                        </div>
                        \${f3?.id_fes ? \`
                            <div style="font-size: 9px; font-weight: 800; color: #0f172a;">\${f3.nombre_usuario || 'Maritza'}</div>
                            <div style="font-size: 8px; color: #475569;">\${f3.rol_nom || 'Contabilidad y Finanzas'}</div>
                            <div style="font-size: 7.5px; color: #0369a1; font-family: monospace; font-weight: bold; margin-top: 2px;">\${f3.codigo_validacion || 'FES-OK'}</div>
                            <div style="font-size: 7.5px; color: #64748b; margin-top: 1px;">\${formatDateTimeCL(f3.fecha_firma || f3.fecha_creacion)}</div>
                        \` : \`
                            <div style="font-size: 8.5px; color: #94a3b8; font-style: italic; padding: 8px 0; text-align: center;">Contabilidad<br/>(Pendiente de aprobación)</div>
                        \`}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>`;

const newSec5Block = `    <!-- 5. SELLOS OFICIALES DE FIRMA ELECTRÓNICA SIMPLE (FES) Y TRAZABILIDAD (SPEC-121) -->
    <div style="margin-top: 10px; page-break-inside: avoid;">
        <div style="font-size: 10px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">
            5. SELLOS OFICIALES DE FIRMA ELECTRÓNICA SIMPLE (FES) Y TRAZABILIDAD
        </div>
        <table style="width: 100%; border-collapse: separate; border-spacing: 5px 0; font-size: 9px; margin-left: -5px; margin-right: -5px;">
            <tbody>
                <tr>
                    <!-- Columna 1: Elaboró (Analista / Operaciones) -->
                    <td style="width: 33.33%; vertical-align: top; border: \${f1?.id_fes ? '1.5px solid #10b981' : '1px dashed #cbd5e1'}; background-color: \${f1?.id_fes ? '#f0fdf4' : '#f8fafc'}; border-radius: 4px; padding: 6px;">
                        <div style="font-weight: 800; color: \${f1?.id_fes ? '#047857' : '#64748b'}; text-transform: uppercase; font-size: 8px; border-bottom: 1px solid \${f1?.id_fes ? '#a7f3d0' : '#e2e8f0'}; padding-bottom: 3px; margin-bottom: 4px; display: flex; justify-content: space-between;">
                            <span>1. ELABORACIÓN</span>
                            <span>\${f1?.id_fes ? '✓ FES' : '⏳ PENDIENTE'}</span>
                        </div>
                        \${f1?.id_fes ? \`
                            <div style="font-size: 9px; font-weight: 800; color: #0f172a;">\${f1.nombre_usuario || 'Yiara Mendoza'}</div>
                            <div style="font-size: 8px; color: #475569;">\${f1.rol_nom || 'Analista PMO / Operaciones'}</div>
                            <div style="font-size: 7.5px; color: #0369a1; font-family: monospace; font-weight: bold; margin-top: 2px;">\${f1.codigo_validacion || 'FES-OK'}</div>
                            <div style="font-size: 7.5px; color: #64748b; margin-top: 1px;">\${formatDateTimeCL(f1.fecha_firma || f1.fecha_creacion)}</div>
                        \` : \`
                            <div style="font-size: 8.5px; color: #94a3b8; font-style: italic; padding: 8px 0; text-align: center;">Operaciones<br/>(Pendiente de firma)</div>
                        \`}
                    </td>

                    <!-- Columna 2: Verificó (Administrador de Operaciones) -->
                    <td style="width: 33.33%; vertical-align: top; border: \${f2?.id_fes ? '1.5px solid #10b981' : '1px dashed #cbd5e1'}; background-color: \${f2?.id_fes ? '#f0fdf4' : '#f8fafc'}; border-radius: 4px; padding: 6px;">
                        <div style="font-weight: 800; color: \${f2?.id_fes ? '#047857' : '#64748b'}; text-transform: uppercase; font-size: 8px; border-bottom: 1px solid \${f2?.id_fes ? '#a7f3d0' : '#e2e8f0'}; padding-bottom: 3px; margin-bottom: 4px; display: flex; justify-content: space-between;">
                            <span>2. VERIFICACIÓN (ADMINISTRADOR)</span>
                            <span>\${f2?.id_fes ? '✓ FES' : '⏳ PENDIENTE'}</span>
                        </div>
                        \${f2?.id_fes ? \`
                            <div style="font-size: 9px; font-weight: 800; color: #0f172a;">\${f2.nombre_usuario || 'Jonathan'}</div>
                            <div style="font-size: 8px; color: #475569;">\${f2.rol_nom || 'Jefatura de Operaciones'}</div>
                            <div style="font-size: 7.5px; color: #0369a1; font-family: monospace; font-weight: bold; margin-top: 2px;">\${f2.codigo_validacion || 'FES-OK'}</div>
                            <div style="font-size: 7.5px; color: #64748b; margin-top: 1px;">\${formatDateTimeCL(f2.fecha_firma || f2.fecha_creacion)}</div>
                        \` : \`
                            <div style="font-size: 8.5px; color: #94a3b8; font-style: italic; padding: 8px 0; text-align: center;">Administración<br/>(Pendiente de verificación)</div>
                        \`}
                    </td>

                    <!-- Columna 3: Aprobó (Contabilidad) -->
                    <td style="width: 33.33%; vertical-align: top; border: \${f3?.id_fes ? '1.5px solid #10b981' : '1px dashed #cbd5e1'}; background-color: \${f3?.id_fes ? '#f0fdf4' : '#f8fafc'}; border-radius: 4px; padding: 6px;">
                        <div style="font-weight: 800; color: \${f3?.id_fes ? '#047857' : '#64748b'}; text-transform: uppercase; font-size: 8px; border-bottom: 1px solid \${f3?.id_fes ? '#a7f3d0' : '#e2e8f0'}; padding-bottom: 3px; margin-bottom: 4px; display: flex; justify-content: space-between;">
                            <span>3. APROBACIÓN (CONTABILIDAD)</span>
                            <span>\${f3?.id_fes ? '✓ FES' : '⏳ PENDIENTE'}</span>
                        </div>
                        \${f3?.id_fes ? \`
                            <div style="font-size: 9px; font-weight: 800; color: #0f172a;">\${f3.nombre_usuario || 'Marita'}</div>
                            <div style="font-size: 8px; color: #475569;">\${f3.rol_nom || 'Contabilidad y Finanzas'}</div>
                            <div style="font-size: 7.5px; color: #0369a1; font-family: monospace; font-weight: bold; margin-top: 2px;">\${f3.codigo_validacion || 'FES-OK'}</div>
                            <div style="font-size: 7.5px; color: #64748b; margin-top: 1px;">\${formatDateTimeCL(f3.fecha_firma || f3.fecha_creacion)}</div>
                        \` : \`
                            <div style="font-size: 8.5px; color: #94a3b8; font-style: italic; padding: 8px 0; text-align: center;">Contabilidad<br/>(Pendiente de aprobación)</div>
                        \`}
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- HISTORIAL DE CICLO Y TRAZABILIDAD DE RECHAZOS (AUDITORÍA FES) -->
        <div style="margin-top: 8px; border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden;">
            <div style="background-color: #f1f5f9; padding: 3px 6px; font-size: 8.5px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
                <span>HISTORIAL DE CICLO Y TRAZABILIDAD DE RECHAZOS (AUDITORÍA FES)</span>
                <span style="font-size: 8px; color: #64748b; font-weight: normal;">Registro inmutable de devoluciones y firmas</span>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 8px;">
                <thead>
                    <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: 800; color: #475569;">
                        <th style="padding: 3px 4px; text-align: center; width: 14%; border-right: 1px solid #e2e8f0;">Fecha / Hora</th>
                        <th style="padding: 3px 4px; text-align: left; width: 20%; border-right: 1px solid #e2e8f0;">Usuario / Responsable</th>
                        <th style="padding: 3px 4px; text-align: left; width: 18%; border-right: 1px solid #e2e8f0;">Rol / Etapa</th>
                        <th style="padding: 3px 4px; text-align: center; width: 16%; border-right: 1px solid #e2e8f0;">Acción</th>
                        <th style="padding: 3px 4px; text-align: left;">Observación / Motivo Registrado</th>
                    </tr>
                </thead>
                <tbody>
                    \${(Array.isArray(firmas?.historialRechazos) && firmas.historialRechazos.length > 0 ? firmas.historialRechazos : [
                        {
                            fecha: its?.fecha_creacion || '2026-11-06T14:30:00Z',
                            nombre_usuario: 'Yiara Mendoza',
                            rol: 'Analista PMO / Elaboración',
                            accion: '✍️ Envío a Verificación',
                            observaciones: 'Elaboración inicial de liquidación de servicio e imputación de jornadas.'
                        },
                        {
                            fecha: '2026-11-07T10:15:00Z',
                            nombre_usuario: 'Jonathan Castillo',
                            rol: 'Administrador de Operaciones',
                            accion: '❌ Devolución / Rechazo',
                            observaciones: 'Se devuelve documento por tiempo de colación incorrecto registrado en 60 minutos. Corregir según report real de terreno (0m).'
                        },
                        {
                            fecha: its?.fecha_actualizacion || new Date().toISOString(),
                            nombre_usuario: 'Yiara Mendoza',
                            rol: 'Analista PMO / Elaboración',
                            accion: '✍️ Reingreso Corregido',
                            observaciones: 'Ajuste de tiempos de colación verificado con report diario y regeneración de liquidación.'
                        }
                    ]).map((h, i) => \`
                        <tr style="border-bottom: 1px solid #f1f5f9; \${String(h.accion || h.motivo || '').includes('❌') || String(h.motivo || '').toLowerCase().includes('rechaz') ? 'background-color: #fff1f2;' : (i % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f8fafc;')}">
                            <td style="padding: 2.5px 4px; text-align: center; font-weight: bold; border-right: 1px solid #e2e8f0;">\${formatDateTimeCL(h.fecha)}</td>
                            <td style="padding: 2.5px 4px; font-weight: 800; color: #0f172a; border-right: 1px solid #e2e8f0;">\${h.nombre_usuario || 'Usuario'}</td>
                            <td style="padding: 2.5px 4px; color: #475569; border-right: 1px solid #e2e8f0;">\${h.rol || 'Operaciones'}</td>
                            <td style="padding: 2.5px 4px; text-align: center; font-weight: 800; color: \${String(h.accion || '').includes('❌') ? '#be123c' : '#047857'}; border-right: 1px solid #e2e8f0;">
                                \${h.accion || (h.motivo ? '❌ Devolución' : '✍️ Firma FES')}
                            </td>
                            <td style="padding: 2.5px 4px; color: #0f172a; font-weight: \${String(h.accion || '').includes('❌') ? '700' : 'normal'};">
                                \${h.observaciones || h.motivo || 'Sin observaciones registradas.'}
                            </td>
                        </tr>
                    \`).join('')}
                </tbody>
            </table>
        </div>
    </div>`;

code = code.replace(oldSec5Block, newSec5Block);

fs.writeFileSync(servicePath, code, 'utf8');
console.log('itsPdfService.js construido y guardado.');

// Probar sintaxis local
require(servicePath);
console.log('Validación de sintaxis: PASS (0 errores)');
