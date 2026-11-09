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

/**
 * Maquetación HTML del documento ITS oficial
 */
function buildItsHtml(data) {
  const { its, proyecto, jornadas, costos, firmas, validacionUrl } = data;

  const folio = its?.folio_its || `ITS-${proyecto?.id_proyecto || '00'}`;
  const version = its?.version || 1;
  const fEmision = formatDateCL(its?.fecha_creacion || new Date());

  const jfProy = proyecto?.json_field ? (typeof proyecto.json_field === 'string' ? JSON.parse(proyecto.json_field) : proyecto.json_field) : {};
  const crmV1 = jfProy?.crm_v1 || {};
  const lineasCrm = crmV1.lineas_operativas_vigentes || crmV1.lineas_servicio || [];
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
  const regimen = its?.tipo_contexto === 'RURAL' ? 'RÉGIMEN RURAL' : (esModalidadMensual ? 'MODALIDAD MENSUAL' : 'RÉGIMEN URBANO');
  const tipoServicio = proyecto?.tipo_servicio || (esModalidadMensual ? 'Arriendo Mensual de Grúa' : 'Servicio por Hora / Jornada');

  const fIni = formatDateCL(its?.fecha_inicio || proyecto?.fecha_inicio || (jornadas && jornadas[0]?.fecha));
  const fFin = formatDateCL(its?.fecha_termino || proyecto?.fecha_termino || (jornadas && jornadas[jornadas.length - 1]?.fecha));
  const fechas = `${fIni} AL ${fFin}`;

  const valorFijo = Number(its?.valor_fijo || crmV1?.valor_fijo || 0);
  const valorFlete = Number(its?.valor_flete_pactado || crmV1?.valor_flete || crmV1?.flete || 0);
  const valorHora = Number(its?.valor_hora_pactado || 0);

  // Mapeo canónico de equipos y horas mínimas
  const equipos = lineasCrm.length > 0 ? lineasCrm.map(l => {
    let hrsMin = l.horas_minimas || l.pisoMinimo || l.cantidad_horas || '';
    if (!hrsMin) {
      const u = String(l.unidad || '').toLowerCase();
      if (u.includes('mes')) hrsMin = `${l.cantidad_horas || 180} HORAS MES`;
      else if (u.includes('dia') || u.includes('diario') || u.includes('jornada')) hrsMin = '9 HORAS DIARIAS';
      else if (u.includes('hora')) hrsMin = `${l.cantidad || 9} HORAS MÍNIMAS`;
      else hrsMin = '9 HORAS DIARIAS';
    } else if (typeof hrsMin === 'number') {
      hrsMin = `${hrsMin} HORAS`;
    }
    const tripArr = Array.isArray(jfProy?.ejecucion_v1?.tripulacion_asignada) ? jfProy.ejecucion_v1.tripulacion_asignada : [];
    const personalFromTrip = tripArr.map(t => {
      const nom = t.nombre_trabajador || t.nombre_completo || t.nombre || t.name_frst || t.personal || t.usuario || '';
      const cargo = t.cargo || t.rol || t.tipo || '';
      if (nom && cargo) return `${nom} (${cargo})`;
      if (nom) return nom;
      return cargo;
    }).filter(Boolean).join(', ');

    const personal = l.operador || l.personal || l.personal_tripulacion || personalFromTrip || 'Personal GSP Asignado';

    return {
      patente: l.patente || l.equipo || l.descripcion || '—',
      subcategoria: l.subcategoria || l.tipo || l.categoria || '',
      horas_minimas: String(hrsMin).toUpperCase(),
      valor_hora: Number(l.valorUnitario || l.precio_unitario || l.tarifa || valorHora || 0),
      ots_asociadas: codigoOt,
      personal_tripulacion: personal
    };
  }) : (jornadas || []).reduce((acc, j) => {
    if (!acc.some(e => e.patente === j.patente)) {
      acc.push({
        patente: j.patente || 'S/P',
        subcategoria: j.tipo_servicio || 'Grúa Telescópica',
        horas_minimas: '9 HORAS DIARIAS',
        valor_hora: valorHora,
        ots_asociadas: j.numero_ot || codigoOt,
        personal_tripulacion: 'Personal GSP Asignado'
      });
    }
    return acc;
  }, []);

  // Jornadas de terreno con columnas de ancho controlado
  let totalHorasReportNum = 0;
  const jornadasRows = (jornadas || []).map((j, idx) => {
    const hSal = j.hora_salida ? String(j.hora_salida).slice(0, 5) : '—';
    const hLle = j.hora_llegada ? String(j.hora_llegada).slice(0, 5) : '—';
    const hTer = j.hora_termino ? String(j.hora_termino).slice(0, 5) : '—';
    const hRet = j.hora_retorno ? String(j.hora_retorno).slice(0, 5) : '—';
    const colMin = j.colacion_minutos !== null && j.colacion_minutos !== undefined ? Number(j.colacion_minutos) : (j.colacion ? 60 : 0);
    const colStr = colMin > 0 ? `${String(Math.floor(colMin / 60)).padStart(2, '0')}:${String(colMin % 60).padStart(2, '0')}` : '00:00';
    const hrsReales = Number(j.horas_reales || 0);
    const hrsRep = Number(j.horas_report || 0);
    totalHorasReportNum += hrsRep;

    return `
      <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f8fafc;'}">
        <td style="padding: 4px 5px; text-align: center; font-weight: 600; border-right: 1px solid #e2e8f0;">${formatDateCL(j.fecha)}</td>
        <td style="padding: 4px 5px; text-align: center; font-weight: 800; color: #1e3a8a; border-right: 1px solid #e2e8f0;">${j.numero_ot || codigoOt}</td>
        <td style="padding: 4px 5px; text-align: center; color: #334155; border-right: 1px solid #e2e8f0;">${j.tipo_servicio || 'Hora'}</td>
        <td style="padding: 4px 5px; text-align: center; font-weight: 700; border-right: 1px solid #e2e8f0; white-space: nowrap;">${j.patente || '—'}</td>
        <td style="padding: 4px 5px; text-align: center; border-right: 1px solid #e2e8f0;">${hSal}</td>
        <td style="padding: 4px 5px; text-align: center; border-right: 1px solid #e2e8f0;">${hLle}</td>
        <td style="padding: 4px 5px; text-align: center; border-right: 1px solid #e2e8f0;">${hTer}</td>
        <td style="padding: 4px 5px; text-align: center; border-right: 1px solid #e2e8f0;">${hRet}</td>
        <td style="padding: 4px 5px; text-align: center; border-right: 1px solid #e2e8f0;">${colStr}</td>
        <td style="padding: 4px 5px; text-align: center; font-weight: 800; color: #1d4ed8; border-right: 1px solid #e2e8f0;">${hrsReales > 0 ? `${hrsReales.toFixed(1)}h` : '—'}</td>
        <td style="padding: 4px 5px; text-align: center; font-weight: 800; color: #047857; border-right: 1px solid #e2e8f0;">${hrsRep > 0 ? `${hrsRep.toFixed(1)}h` : '—'}</td>
        <td style="padding: 4px 5px; text-align: center; font-weight: 700;">${j.numero_report || '—'}</td>
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
  const operadorRows = filterCostRows(costos?.costo_hora_operador);

  const sumMonto = (arr) => arr.reduce((acc, r) => acc + (Number(r.monto_total !== undefined ? r.monto_total : r.monto) || 0), 0);

  const totAlim = sumMonto(alimRows);
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
                <td style="padding: 3px 4px; font-weight: bold; color: #1e293b; border-right: 1px solid #e2e8f0;">${r.concepto || 'Alimentación Operador'}</td>
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
                <td style="padding: 3px 4px; border-right: 1px solid #e2e8f0;">${r.detalle || r.concepto || 'Peaje de ruta'}</td>
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
                <td style="padding: 2px 4px; border-right: 1px solid #e2e8f0;">${r.detalle || r.concepto || 'Pensión / Hospedaje'}</td>
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
                <td style="padding: 3px 4px; border-right: 1px solid #e2e8f0;">${r.detalle || (r.litros ? `${r.litros} Lts Diesel` : 'Carga Combustible')}</td>
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
            ${movilRows.map(r => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 3px 4px; text-align: center; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">${formatDateCL(r.fecha)}</td>
                <td style="padding: 3px 4px; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">${r.personal || r.nombre_personal || '—'}</td>
                <td style="padding: 3px 4px; font-weight: bold; color: #1e293b; border-right: 1px solid #e2e8f0;">${r.detalle || r.concepto || '—'}</td>
                <td style="padding: 3px 4px; text-align: right; font-weight: 800; font-size: 10px; color: #0f172a;">$${formatCLP(r.monto_total || r.monto || 0)}</td>
              </tr>
            `).join('')}
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
                <td style="padding: 3px 4px; font-weight: bold; color: #1e293b; border-right: 1px solid #e2e8f0;">${r.detalle || r.concepto || 'Apoyo Rigger / Personal'}</td>
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
                <td style="padding: 3px 4px; font-weight: bold; color: #1e293b; border-right: 1px solid #e2e8f0;">${r.detalle || r.descripcion || '—'}</td>
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
                <td style="padding: 3px 4px; font-weight: bold; color: #1e293b; border-right: 1px solid #e2e8f0;">${r.detalle || r.concepto || '—'}</td>
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
            ${operadorRows.map(r => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 3px 4px; border-right: 1px solid #e2e8f0;">
                  <div style="font-weight: 800; color: #0f172a; font-size: 10px;">${r.patente || '—'}</div>
                  <div style="font-size: 8.5px; color: #475569; font-weight: bold;">${r.subcategoria || ''}</div>
                </td>
                <td style="padding: 3px 4px; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">${r.categoria || '—'}</td>
                <td style="padding: 3px 4px; text-align: right; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">$${formatCLP(r.valor_hora || 0)}</td>
                <td style="padding: 3px 4px; text-align: right; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">${Number(r.horas_report || 0).toFixed(1)} hrs</td>
                <td style="padding: 3px 4px; text-align: right; font-weight: 800; font-size: 10px; color: #0f172a;">$${formatCLP(r.monto_total || r.monto || 0)}</td>
              </tr>
            `).join('')}
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
  const totalVenta = Number(its?.total_ingresos_facturables) || (totalHoras * valorHora + valorFijo + valorFlete);
  const totalCostos = Number(its?.total_costos_operacionales) || (totAlim + totPeajes + totPension + totMovil + totPext + totFeriados + totSubcont + totExtra + totComb + totCostoOperadores);
  const utilidad = Number(its?.utilidad_bruta) || (totalVenta - totalCostos);
  const margen = totalVenta > 0 ? Number(((utilidad / totalVenta) * 100).toFixed(1)) : 0;
  const getPct = (val) => totalVenta > 0 ? ((Number(val || 0) / totalVenta) * 100).toFixed(1) : '0.0';

  // Resumen de costos con supresión de partidas en $0
  let costosResumenHtml = '';
  if (totAlim > 0) costosResumenHtml += `<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">1. Viáticos Alimentación</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$${formatCLP(totAlim)}</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">${getPct(totAlim)}%</td></tr>`;
  if (totPeajes > 0) costosResumenHtml += `<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">2. Peajes y Tag</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$${formatCLP(totPeajes)}</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">${getPct(totPeajes)}%</td></tr>`;
  if (totPension > 0) costosResumenHtml += `<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">3. Pensiones y Alojamiento</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$${formatCLP(totPension)}</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">${getPct(totPension)}%</td></tr>`;
  if (totComb > 0) costosResumenHtml += `<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">4. Combustible Diesel</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$${formatCLP(totComb)}</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">${getPct(totComb)}%</td></tr>`;
  if (totMovil > 0) costosResumenHtml += `<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">5. Movilización Personal</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$${formatCLP(totMovil)}</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">${getPct(totMovil)}%</td></tr>`;
  if (totPext + totFeriados > 0) costosResumenHtml += `<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">6. Personal Externo y Feriados</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$${formatCLP(totPext + totFeriados)}</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">${getPct(totPext + totFeriados)}%</td></tr>`;
  if (totSubcont > 0) costosResumenHtml += `<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">7. Subcontratación Flete Externo</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$${formatCLP(totSubcont)}</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">${getPct(totSubcont)}%</td></tr>`;
  if (totExtra > 0) costosResumenHtml += `<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">8. Gastos Extraordinarios</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$${formatCLP(totExtra)}</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">${getPct(totExtra)}%</td></tr>`;
  if (totCostoOperadores > 0) costosResumenHtml += `<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">9. Costo Valor Hora Operador</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$${formatCLP(totCostoOperadores)}</td><td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">${getPct(totCostoOperadores)}%</td></tr>`;

  if (!costosResumenHtml) {
    costosResumenHtml = `<tr><td colspan="3" style="padding: 4px 5px; text-align: center; color: #64748b; font-style: italic;">Sin costos imputados ($0)</td></tr>`;
  }

  // Firmas FES (Paso 1, Paso 2, Paso 3)
  const f1 = firmas?.paso1 || {};
  const f2 = firmas?.paso2 || {};
  const f3 = firmas?.paso3 || {};

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

    <!-- Header Membretado Oficial -->
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #1e3a8a; padding-bottom: 8px; margin-bottom: 12px;">
        <div>
            <div style="font-size: 16px; font-weight: 900; color: #1e3a8a; letter-spacing: 0.5px; line-height: 1.1;">${empresaNombreFantasia}</div>
            <div style="font-size: 8.5px; font-weight: 800; color: #64748b; letter-spacing: 1px;">ARRIENDO DE MAQUINARIAS</div>
        </div>
        <div style="text-align: center;">
            <h1 style="font-size: 15px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
                INFORME TÉRMINO DE SERVICIO
            </h1>
            <div style="font-size: 10.5px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin-top: 2px; letter-spacing: 0.5px;">
                (${regimen})
            </div>
        </div>
        <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
            <span style="display: inline-block; background-color: #1e1b4b; border: 1.5px solid #312e81; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 900; color: #ffffff; font-family: monospace; letter-spacing: 0.5px;">
                FOLIO N° ${folio} <span style="color: #93c5fd; font-weight: 800; font-size: 9.5px; margin-left: 3px;">(V${version})</span>
            </span>
            <span style="display: inline-block; background-color: #fef3c7; border: 1.5px solid #f59e0b; padding: 2px 7px; border-radius: 4px; font-size: 10.5px; font-weight: 900; color: #92400e; margin-top: 2px;">
                Cotización #${cotizacion}
            </span>
            <div style="font-size: 9.5px; color: #0f172a; font-weight: 700; margin-top: 2px;">Fecha Emisión: <strong>${fEmision}</strong></div>
        </div>
    </div>

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
                                        </td>
                                        <td style="padding: 4px 6px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 800; color: #92400e;">
                                            ${eq.horas_minimas || '9 HORAS DIARIAS'}
                                        </td>
                                        <td style="padding: 4px 6px; text-align: right; border-right: 1px solid #cbd5e1; font-weight: 800; color: #047857; font-family: monospace;">
                                            $${formatCLP(eq.valor_hora || 0)}
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
                ${jornadasRows || '<tr><td colspan="12" style="padding: 8px; text-align: center; color: #64748b;">Sin jornadas registradas</td></tr>'}
                <!-- Subtotal Fila Final -->
                <tr style="background-color: #e0e7ff; border-top: 2px solid #cbd5e1; font-weight: bold;">
                    <td colspan="9" style="padding: 5px 6px; text-align: right; font-weight: 900; color: #0f172a;">TOTAL HORAS REPORT:</td>
                    <td style="padding: 5px 6px; border-right: 1px solid #cbd5e1;"></td>
                    <td style="padding: 5px 6px; text-align: center; font-family: monospace; font-weight: 900; color: #064e3b; background-color: #a7f3d0; border-right: 1px solid #cbd5e1; font-size: 10px;">
                        ${totalHorasReportNum.toFixed(1)} hrs
                    </td>
                    <td style="padding: 5px 6px; background-color: #e0e7ff;"></td>
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
                    <td style="width: 33.33%; vertical-align: top; border: ${f1?.id_fes ? '1.5px solid #10b981' : '1px dashed #cbd5e1'}; background-color: ${f1?.id_fes ? '#f0fdf4' : '#f8fafc'}; border-radius: 4px; padding: 6px;">
                        <div style="font-weight: 800; color: ${f1?.id_fes ? '#047857' : '#64748b'}; text-transform: uppercase; font-size: 8px; border-bottom: 1px solid ${f1?.id_fes ? '#a7f3d0' : '#e2e8f0'}; padding-bottom: 3px; margin-bottom: 4px; display: flex; justify-content: space-between;">
                            <span>1. ELABORACIÓN</span>
                            <span>${f1?.id_fes ? '✓ FES' : '⏳ PENDIENTE'}</span>
                        </div>
                        ${f1?.id_fes ? `
                            <div style="font-size: 9px; font-weight: 800; color: #0f172a;">${f1.nombre_usuario || 'Yiara Mendoza'}</div>
                            <div style="font-size: 8px; color: #475569;">${f1.rol_nom || 'Analista PMO / Operaciones'}</div>
                            <div style="font-size: 7.5px; color: #0369a1; font-family: monospace; font-weight: bold; margin-top: 2px;">${f1.codigo_validacion || 'FES-OK'}</div>
                            <div style="font-size: 7.5px; color: #64748b; margin-top: 1px;">${formatDateTimeCL(f1.fecha_firma || f1.fecha_creacion)}</div>
                        ` : `
                            <div style="font-size: 8.5px; color: #94a3b8; font-style: italic; padding: 8px 0; text-align: center;">Operaciones<br/>(Pendiente de firma)</div>
                        `}
                    </td>

                    <!-- Columna 2: Verificó (Administrador de Operaciones) -->
                    <td style="width: 33.33%; vertical-align: top; border: ${f2?.id_fes ? '1.5px solid #10b981' : '1px dashed #cbd5e1'}; background-color: ${f2?.id_fes ? '#f0fdf4' : '#f8fafc'}; border-radius: 4px; padding: 6px;">
                        <div style="font-weight: 800; color: ${f2?.id_fes ? '#047857' : '#64748b'}; text-transform: uppercase; font-size: 8px; border-bottom: 1px solid ${f2?.id_fes ? '#a7f3d0' : '#e2e8f0'}; padding-bottom: 3px; margin-bottom: 4px; display: flex; justify-content: space-between;">
                            <span>2. VERIFICACIÓN (ADMINISTRADOR)</span>
                            <span>${f2?.id_fes ? '✓ FES' : '⏳ PENDIENTE'}</span>
                        </div>
                        ${f2?.id_fes ? `
                            <div style="font-size: 9px; font-weight: 800; color: #0f172a;">${f2.nombre_usuario || 'Jonathan'}</div>
                            <div style="font-size: 8px; color: #475569;">${f2.rol_nom || 'Jefatura de Operaciones'}</div>
                            <div style="font-size: 7.5px; color: #0369a1; font-family: monospace; font-weight: bold; margin-top: 2px;">${f2.codigo_validacion || 'FES-OK'}</div>
                            <div style="font-size: 7.5px; color: #64748b; margin-top: 1px;">${formatDateTimeCL(f2.fecha_firma || f2.fecha_creacion)}</div>
                        ` : `
                            <div style="font-size: 8.5px; color: #94a3b8; font-style: italic; padding: 8px 0; text-align: center;">Administración<br/>(Pendiente de verificación)</div>
                        `}
                    </td>

                    <!-- Columna 3: Aprobó (Contabilidad) -->
                    <td style="width: 33.33%; vertical-align: top; border: ${f3?.id_fes ? '1.5px solid #10b981' : '1px dashed #cbd5e1'}; background-color: ${f3?.id_fes ? '#f0fdf4' : '#f8fafc'}; border-radius: 4px; padding: 6px;">
                        <div style="font-weight: 800; color: ${f3?.id_fes ? '#047857' : '#64748b'}; text-transform: uppercase; font-size: 8px; border-bottom: 1px solid ${f3?.id_fes ? '#a7f3d0' : '#e2e8f0'}; padding-bottom: 3px; margin-bottom: 4px; display: flex; justify-content: space-between;">
                            <span>3. APROBACIÓN (CONTABILIDAD)</span>
                            <span>${f3?.id_fes ? '✓ FES' : '⏳ PENDIENTE'}</span>
                        </div>
                        ${f3?.id_fes ? `
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
