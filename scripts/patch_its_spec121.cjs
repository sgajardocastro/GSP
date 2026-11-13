const fs = require('fs');
const path = require('path');

const servicePath = path.resolve(__dirname, '../ejecucion/backend_remoto/src/services/itsPdfService.js');
const controllerPath = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/itsController.js');

console.log('=== APLICANDO SPEC-121 EN itsPdfService.js e itsController.js ===');

// 1. Modificar itsPdfService.js
let serviceCode = fs.readFileSync(servicePath, 'utf8');

// Agregar helpers de cálculo de minutos si no existen
if (!serviceCode.includes('function diffMinutes(')) {
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
  serviceCode = serviceCode.replace('function formatCLP(', helperCode + '\nfunction formatCLP(');
}

// Reemplazar la sección de procesamiento de jornadas y costos en buildItsHtml
const oldJornadasRegex = /\/\/ Jornadas de terreno con columnas de ancho controlado[\s\S]*?\/\/ Resumen de costos con supresión de partidas en \$0[\s\S]*?let costosResumenHtml = '';[\s\S]*?if \(totComb > 0\) costosResumenHtml \+= `[^`]*`;/;

const newJornadasAndCostosCode = `// Jornadas de terreno con columnas de ancho controlado (SPEC-121)
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
  }).join('');

  // Costos operacionales directos: SUPRESIÓN ESTRICTA DE FILAS Y CATEGORÍAS CON MONTO $0 EN EL DETALLE
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
  const operadorRows = filterCostRows(costos?.costo_hora_operador);

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

  if (alimRows.length > 0 || totAlim > 0) {
    const listAlim = alimRows.length > 0 ? alimRows : (jornadas || []).filter(j => Math.round(Number(j.horas_viaticos || 0)) >= 8).map(j => ({
      fecha: j.fecha,
      personal: j.operador || 'Operador Faena',
      concepto: 'Viático Alimentación Jornada Terreno',
      monto_total: Math.min(18000, 7000 + (Math.round(Number(j.horas_viaticos || 0)) - 8) * 1000)
    }));

    bloquesCostosHtml += \`
      <div style="border: 1px solid #cbd5e1; margin-bottom: 5px; page-break-inside: avoid; break-inside: avoid;">
        <div style="background-color: #f1f5f9; padding: 4px 8px; font-size: 9.5px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
          <span>⬢ VIATICO ALIMENTACION PERSONAL</span>
          <span style="font-weight: 800; font-size: 9.5px; color: #0f172a;">Total: $\${formatCLP(totAlim)}</span>
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
            \${listAlim.map(r => \`
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 3px 4px; text-align: center; font-weight: bold; color: #0f172a; background-color: #f8fafc; border-right: 1px solid #e2e8f0;">\${formatDateCL(r.fecha)}</td>
                <td style="padding: 3px 6px; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">\${r.personal || r.nombre_personal || r.nombre || '—'}</td>
                <td style="padding: 3px 4px; font-weight: bold; color: #1e293b; border-right: 1px solid #e2e8f0;">\${r.concepto || 'Alimentación Operador'}</td>
                <td style="padding: 3px 4px; text-align: right; font-weight: 800; font-size: 10px; color: #0f172a;">$\${formatCLP(r.monto_total || r.monto || 0)}</td>
              </tr>
            \`).join('')}
          </tbody>
        </table>
      </div>
    \`;
  }`;

serviceCode = serviceCode.replace(oldJornadasRegex, newJornadasAndCostosCode);

// Modificar la generación del cuadro de 10 puntos en el Resumen Ejecutivo de Costos
const oldCostosResumenRegex = /\/\/ Resumen de costos con supresión de partidas en \$0[\s\S]*?if \(totComb > 0\) costosResumenHtml \+= `[^`]*`;/;
const new10PuntosCode = `// Cuadro Resumen de Costos Operacionales: OBLIGATORIO DESPLEGAR LOS 10 PUNTOS DEL 1 AL 10 (INCLUSO CON $0)
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

// Si todavía queda el bloque viejo de if (totComb > 0), reemplazarlo
if (serviceCode.includes('if (totComb > 0) costosResumenHtml')) {
  serviceCode = serviceCode.replace(oldCostosResumenRegex, new10PuntosCode);
} else {
  // Reemplazar después de getPct
  serviceCode = serviceCode.replace(
    'const getPct = (val) => totalVenta > 0 ? ((Number(val || 0) / totalVenta) * 100).toFixed(1) : \'0.0\';',
    'const getPct = (val) => totalVenta > 0 ? ((Number(val || 0) / totalVenta) * 100).toFixed(1) : \'0.0\';\n\n  ' + new10PuntosCode
  );
}

// Actualizar tabla de Sección 2 (Control de Flota) en el HTML
const oldSec2TableRegex = /<!-- 2\. CONTROL DE FLOTA Y VALIDACION DE HORAS -->[\s\S]*?<!-- 3\. PLANILLA DE COSTOS OPERACIONALES A PAGAR/;
const newSec2TableHtml = `<!-- 2. CONTROL DE FLOTA Y VALIDACION DE HORAS (CON COLUMNAS HRS SERVICIO, HRS VIATICOS Y VIATICO $) -->
    <div style="margin-bottom: 10px;">
        <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; background-color: #f1f5f9; color: #0f172a; padding: 5px 8px; border: 1px solid #cbd5e1; border-bottom: none; letter-spacing: 0.3px; display: flex; justify-content: space-between; align-items: center;">
            <span>2. CONTROL DE FLOTA Y CONCILIACION DE JORNADAS DE TERRENO</span>
            <span style="font-size: 9px; font-weight: 800; color: #1e3a8a;">\${esUrbano ? '🏢 RÉGIMEN URBANO (Salida → Término)' : '🌲 RÉGIMEN RURAL (Llegada → Término)'}</span>
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
        </table>
    </div>

    <!-- 3. PLANILLA DE COSTOS OPERACIONALES A PAGAR`;

serviceCode = serviceCode.replace(oldSec2TableRegex, newSec2TableHtml);

// Actualizar Sección 5 (Firmas y Agregar Historial de Ciclo y Rechazos)
const oldSec5Regex = /<!-- 5\. SELLOS OFICIALES DE FIRMA ELECTRÓNICA SIMPLE \(FES\) Y TRAZABILIDAD -->[\s\S]*?<\/body>/;
const newSec5Html = `<!-- 5. SELLOS OFICIALES DE FIRMA ELECTRÓNICA SIMPLE (FES) Y TRAZABILIDAD -->
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
    </div>

    <!-- Pie institucional con timbre de validación -->
    <div style="text-align: center; font-size: 8.5px; color: #94a3b8; font-family: monospace; border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
        <span>\${empresa} • Sistema Integral de Operaciones & CRM</span>
        <span>Verificable en: \${validacionUrl || 'https://servidor.leanglobal.cl/validador-doc'}</span>
    </div>

</body>`;

serviceCode = serviceCode.replace(oldSec5Regex, newSec5Html);

fs.writeFileSync(servicePath, serviceCode, 'utf8');
console.log('itsPdfService.js actualizado con éxito.');

// 2. Modificar itsController.js para cargar historialRechazos en getPreviewPdf
let controllerCode = fs.readFileSync(controllerPath, 'utf8');
const oldPreviewFirmasTarget = `        sigRes.rows.forEach(r => {
          if (r.flow_tmpl_step_orden === 1) firmas.paso1 = r;
          else if (r.flow_tmpl_step_orden === 2) firmas.paso2 = r;
          else if (r.flow_tmpl_step_orden === 3) firmas.paso3 = r;
        });
      }`;

const newPreviewFirmasCode = `        sigRes.rows.forEach(r => {
          if (r.flow_tmpl_step_orden === 1) firmas.paso1 = r;
          else if (r.flow_tmpl_step_orden === 2) firmas.paso2 = r;
          else if (r.flow_tmpl_step_orden === 3) firmas.paso3 = r;
        });
      }

      // Cargar historial de rechazos / devoluciones si existe en tits_transicion_historial
      try {
        const histRes = await pool.query(
          \`SELECT historial_observaciones FROM tits_transicion_historial WHERE id_proyecto = $1 ORDER BY id_transicion DESC LIMIT 1\`,
          [id_proyecto]
        );
        if (histRes.rows.length > 0 && Array.isArray(histRes.rows[0].historial_observaciones)) {
          firmas.historialRechazos = histRes.rows[0].historial_observaciones;
        }
      } catch (e) {}`;

if (controllerCode.includes(oldPreviewFirmasTarget) && !controllerCode.includes('firmas.historialRechazos =')) {
  controllerCode = controllerCode.replace(oldPreviewFirmasTarget, newPreviewFirmasCode);
  fs.writeFileSync(controllerPath, controllerCode, 'utf8');
  console.log('itsController.js actualizado con historialRechazos con éxito.');
} else {
  console.log('itsController.js ya contiene historialRechazos o no coincide el target.');
}
