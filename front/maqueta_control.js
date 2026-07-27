
// ── GSP Highcharts Histogram Controller ──
window.hcChart = null;
window.updateCharts = function() {
    if (typeof Highcharts === 'undefined') {
        setTimeout(window.updateCharts, 100);
        return;
    }
    
    const branchSelect = document.getElementById('branch-select');
    const branch = branchSelect ? branchSelect.value : 'todas';
    
    // Scale data depending on branch selection
    const multipliers = {
        todas: 1.0,
        temuco: 0.60,
        la: 0.25,
        valdivia: 0.15
    };
    const mult = multipliers[branch] || 1.0;
    
    const categories = ['Ene 2026', 'Feb 2026', 'Mar 2026', 'Abr 2026', 'May 2026', 'Jun 2026'];
    
    const dataDevengado = [110, 125, 140, 160, 185, 186.45].map(x => Math.round(x * 1000000 * mult));
    const dataOC        = [100, 110, 120, 150, 170, 143.65].map(x => Math.round(x * 1000000 * mult));
    const dataEDP       = [90,  100, 115, 140, 150, 108.15].map(x => Math.round(x * 1000000 * mult));
    const dataFacturado = [85,  95,  110, 130, 140, 76.40].map(x => Math.round(x * 1000000 * mult));
    
    if (window.hcChart) {
        window.hcChart.destroy();
    }
    
    const container = document.getElementById('hc-container');
    if (container) {
        window.hcChart = Highcharts.chart('hc-container', {
            chart: {
                type: 'column',
                backgroundColor: 'transparent',
                style: {
                    fontFamily: "'Inter', sans-serif"
                }
            },
            title: { text: null },
            xAxis: {
                categories: categories,
                labels: {
                    style: {
                        color: '#64748b',
                        fontSize: '9px',
                        fontWeight: '700'
                    }
                },
                axisLine: { stroke: 'rgba(255,255,255,0.05)' }
            },
            yAxis: {
                title: { text: null },
                gridLineColor: 'rgba(255,255,255,0.05)',
                labels: {
                    formatter: function() {
                        return '$' + (this.value / 1000000) + 'M';
                    },
                    style: {
                        color: '#64748b',
                        fontSize: '9px'
                    }
                }
            },
            tooltip: {
                shared: true,
                backgroundColor: '#0c1122',
                borderColor: 'rgba(255,255,255,0.1)',
                style: { color: '#fff', fontSize: '11px' },
                valuePrefix: '$'
            },
            legend: {
                itemStyle: { color: '#94a3b8', fontSize: '9px', fontWeight: '700' },
                itemHoverStyle: { color: '#fff' },
                align: 'center',
                verticalAlign: 'bottom',
                borderWidth: 0
            },
            plotOptions: {
                column: {
                    borderRadius: 3,
                    borderWidth: 0,
                    shadow: false
                }
            },
            series: [
                { name: 'Devengado Terreno', data: dataDevengado, color: '#f5a623' },
                { name: 'Orden Compra (OC)', data: dataOC, color: '#60a5fa' },
                { name: 'Aprobado (EDP)', data: dataEDP, color: '#8b5cf6' },
                { name: 'Facturado SII', data: dataFacturado, color: '#10b981' }
            ],
            credits: { enabled: false }
        });
    }
};

// Hook Highcharts and KPIs into switchView navigation
const originalSwitchView = window.switchView;
window.switchView = function(viewId, navEl) {
    originalSwitchView(viewId, navEl);
    if (viewId === 'dashboard') {
        setTimeout(window.updateCharts, 50);
    } else if (viewId === 'cruce' || viewId === 'mantencion' || viewId === 'acreditacion') {
        setTimeout(() => window.updateTableKPIs(viewId), 50);
    }
};

// Initial chart rendering
setTimeout(window.updateCharts, 300);

// --- Modals Logic ---
window.openAsignacionModal = function() {
    document.getElementById('modal-asignacion').classList.add('open');
};
window.closeAsignacionModal = function() {
    document.getElementById('modal-asignacion').classList.remove('open');
};
window.openAsignacionModalFromService = function() {
    const activeServiceId = document.getElementById('m360-title-id').textContent.trim();
    const s = window.servicesData[activeServiceId] || {};
    const displayEl = document.getElementById('modal-asignacion-service-display');
    if (displayEl) {
        displayEl.textContent = s.id + ' - ' + s.client + ' - ' + s.faena;
    }
    document.getElementById('modal-asignacion').classList.add('open');
};
window.saveAsignacion = function() {
    const activeServiceId = document.getElementById('m360-title-id').textContent.trim();
    alert('Asignación de recursos para el servicio ' + activeServiceId + ' actualizada con éxito. Acreditaciones validadas.');
    window.closeAsignacionModal();
};

// Ficha de Equipo 360 Logic
const fleetData = {
  'GZBC-71': {
    plate: 'GZBC-71',
    brand: 'Liebherr',
    model: 'LTM 1400',
    capacity: '400 Toneladas',
    specs: [
      { label: 'Año', value: '2022' },
      { label: 'Potencia', value: '450 kW' },
      { label: 'Tracción', value: '12x8' },
      { label: 'Capacidad Pluma', value: '82 M' },
      { label: 'Tara', value: '72 Ton' },
      { label: 'Altura', value: '4.00 M' },
      { label: 'Ancho', value: '3.00 M' },
      { label: 'Horómetro Motor', value: '8.240 Hrs' },
      { label: 'Horómetro Izaje', value: '4.120 Hrs' }
    ],
    legalDocs: [
      { name: 'Revisión Técnica', expiry: '15/03/2027', status: 'Vigente', file: 'Revision_Tecnica_GZBC71.pdf' },
      { name: 'SOAP', expiry: '31/03/2027', status: 'Vigente', file: 'SOAP_GZBC71.pdf' },
      { name: 'Permiso de Circulación', expiry: '31/05/2027', status: 'Vigente', file: 'Permiso_Circulacion_GZBC71.pdf' }
    ],
    generalDocs: [
      { name: 'Certificación de Izaje Bureau Veritas', expiry: '10/03/2027', status: 'Vigente', file: 'Certificado_Izaje_BV_GZBC71.pdf' },
      { name: 'Prueba de Carga Estructural', expiry: '12/03/2027', status: 'Vigente', file: 'Prueba_Carga_GZBC71.pdf' }
    ],
    inspections: [
      { date: '18 Jun 2026', type: 'Checklist Pre-Uso', inspector: 'Luis Contreras', status: 'Aprobado' },
      { date: '01 Jun 2026', type: 'Inspección Mensual Sistemas', inspector: 'Taller Central', status: 'Aprobado' }
    ],
    maintenance: [
      { date: '10 May 2026', type: 'Preventiva 7.500 Hrs', desc: 'Cambio de aceite motor, lubricación de pluma y pasadores.', status: 'Completado' }
    ]
  },
  'GZBC-61': {
    plate: 'GZBC-61',
    brand: 'Liebherr',
    model: 'LTM 1250',
    capacity: '250 Toneladas',
    specs: [
      { label: 'Año', value: '2020' },
      { label: 'Potencia', value: '380 kW' },
      { label: 'Tracción', value: '10x8' },
      { label: 'Capacidad Pluma', value: '72 M' },
      { label: 'Tara', value: '60 Ton' },
      { label: 'Altura', value: '3.95 M' },
      { label: 'Ancho', value: '3.00 M' },
      { label: 'Horómetro Motor', value: '4.955 Hrs' },
      { label: 'Horómetro Izaje', value: '2.410 Hrs' }
    ],
    legalDocs: [
      { name: 'Revisión Técnica', expiry: '10/07/2026', status: 'Por Vencer', file: 'Revision_Tecnica_GZBC61.pdf' },
      { name: 'SOAP', expiry: '31/03/2027', status: 'Vigente', file: 'SOAP_GZBC61.pdf' },
      { name: 'Permiso de Circulación', expiry: '31/05/2027', status: 'Vigente', file: 'Permiso_Circulacion_GZBC61.pdf' }
    ],
    generalDocs: [
      { name: 'Certificación de Izaje Bureau Veritas', expiry: '15/01/2027', status: 'Vigente', file: 'Certificado_Izaje_BV_GZBC61.pdf' }
    ],
    inspections: [
      { date: '20 Jun 2026', type: 'Checklist Pre-Uso', inspector: 'Luis Contreras', status: 'Aprobado' },
      { date: '18 Jun 2026', type: 'Checklist Pre-Uso', inspector: 'Luis Contreras', status: 'Aprobado' }
    ],
    maintenance: [
      { date: '12 Jun 2026', type: 'Alineación e Inspección de Neumáticos', desc: 'Ajuste de dirección eje delantero.', status: 'Completado' }
    ]
  },
  'GZBC-58': {
    plate: 'GZBC-58',
    brand: 'Liebherr',
    model: 'LTM 1220',
    capacity: '220 Toneladas',
    specs: [
      { label: 'Año', value: '2021' },
      { label: 'Potencia', value: '360 kW' },
      { label: 'Tracción', value: '10x8' },
      { label: 'Capacidad Pluma', value: '60 M' },
      { label: 'Tara', value: '60 Ton' },
      { label: 'Altura', value: '3.90 M' },
      { label: 'Ancho', value: '3.00 M' },
      { label: 'Horómetro Motor', value: '6.870 Hrs' },
      { label: 'Horómetro Izaje', value: '3.210 Hrs' }
    ],
    legalDocs: [
      { name: 'Revisión Técnica', expiry: '15/08/2026', status: 'Vigente', file: 'Revision_Tecnica_GZBC58.pdf' },
      { name: 'SOAP', expiry: '31/03/2027', status: 'Vigente', file: 'SOAP_GZBC58.pdf' },
      { name: 'Permiso de Circulación', expiry: '31/05/2027', status: 'Vigente', file: 'Permiso_Circulacion_GZBC58.pdf' }
    ],
    generalDocs: [
      { name: 'Certificación de Izaje LSQA', expiry: '12/12/2026', status: 'Vigente', file: 'Certificado_Izaje_LSQA_GZBC58.pdf' }
    ],
    inspections: [
      { date: '12 Jun 2026', type: 'Checklist Pre-Uso', inspector: 'Juan Pérez Alarcón', status: 'Aprobado' },
      { date: '02 Jun 2026', type: 'Checklist Pre-Uso', inspector: 'Juan Pérez Alarcón', status: 'Aprobado' }
    ],
    maintenance: [
      { date: '18 May 2026', type: 'Preventiva 5.000 Hrs', desc: 'Cambio de aceites y filtros de motor, inspección de corona.', status: 'Completado' },
      { date: '01 Jun 2026', type: 'Correctiva Hidráulica', desc: 'Reemplazo de sello en cilindro de levante.', status: 'Completado' }
    ]
  },
  'GZBC-43': {
    plate: 'GZBC-43',
    brand: 'Liebherr',
    model: 'LTM 1100',
    capacity: '100 Toneladas',
    specs: [
      { label: 'Año', value: '2018' },
      { label: 'Potencia', value: '300 kW' },
      { label: 'Tracción', value: '8x8' },
      { label: 'Capacidad Pluma', value: '52 M' },
      { label: 'Tara', value: '48 Ton' },
      { label: 'Altura', value: '3.80 M' },
      { label: 'Ancho', value: '2.75 M' },
      { label: 'Horómetro Motor', value: '12.340 Hrs' },
      { label: 'Horómetro Izaje', value: '6.120 Hrs' }
    ],
    legalDocs: [
      { name: 'Revisión Técnica', expiry: '01/06/2026', status: 'Vencido', file: 'Revision_Tecnica_GZBC43.pdf' },
      { name: 'SOAP', expiry: '31/03/2027', status: 'Vigente', file: 'SOAP_GZBC43.pdf' },
      { name: 'Permiso de Circulación', expiry: '31/05/2027', status: 'Vigente', file: 'Permiso_Circulacion_GZBC43.pdf' }
    ],
    generalDocs: [
      { name: 'Certificación de Izaje Bureau Veritas', expiry: '01/06/2026', status: 'Vencido', file: 'Certificado_Izaje_BV_GZBC43.pdf' }
    ],
    inspections: [
      { date: '01 Jun 2026', type: 'Checklist Pre-Uso', inspector: 'Carlos Muñoz', status: 'Rechazado' },
      { date: '25 May 2026', type: 'Checklist Pre-Uso', inspector: 'Carlos Muñoz', status: 'Aprobado' }
    ],
    maintenance: [
      { date: '02 Jun 2026', type: 'Ingreso a Taller por Vencimiento', desc: 'Preparación de equipo para certificación Bureau Veritas.', status: 'En Proceso' }
    ]
  }
};

window.openFichaEquipo = function(plate) {
    const data = fleetData[plate] || fleetData['GZBC-58']; // Fallback
    
    document.getElementById('fe-plate').innerText = data.plate;
    document.getElementById('fe-title').innerText = data.brand + ' ' + data.model + ' (' + data.capacity + ')';
    
    // Specs
    let specsHtml = '';
    data.specs.forEach(s => {
        specsHtml += '<div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.04); padding-bottom:5px; margin-top:2px;">' +
          '<span style="font-size:9px; font-weight:700; color:#52525b; text-transform:uppercase;">' + s.label + '</span>' +
          '<span style="font-size:11px; font-weight:700; color:#fff; font-family:\'JetBrains Mono\',monospace;">' + s.value + '</span>' +
        '</div>';
    });
    document.getElementById('fe-specs-list').innerHTML = specsHtml;
    
    // Legal Docs
    let legalHtml = '';
    data.legalDocs.forEach(d => {
        const badgeClass = d.status === 'Vigente' ? 'badge-green' : (d.status === 'Por Vencer' ? 'badge-amber' : 'badge-red');
        legalHtml += '<div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:10px; padding:12px; display:flex; align-items:center; justify-content:space-between; transition:all 0.2s; cursor:pointer;" onmouseover="this.style.background=\'rgba(255,255,255,0.04)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.02)\'">' +
          '<div style="display:flex; align-items:center; gap:10px; flex:1;">' +
            '<svg style="width:16px; height:16px; color:#e69500; fill:none; stroke:currentColor; stroke-width:2;"><use href="#i-file-check"/></svg>' +
            '<div>' +
              '<div style="font-size:11px; font-weight:700; color:#fff;">' + d.name + '</div>' +
              '<div style="font-size:9px; color:#64748b; margin-top:2px;">Vence: ' + d.expiry + '</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex; align-items:center; gap:8px;">' +
            '<span class="badge ' + badgeClass + '" style="font-size:8px;">' + d.status + '</span>' +
            '<button onclick="openPdfModal(\'' + d.file + '\')" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); width:26px; height:26px; border-radius:6px; display:flex; align-items:center; justify-content:center; color:#94a3b8; cursor:pointer; font-size:10px;" onmouseover="this.style.color=\'white\'; this.style.background=\'var(--blue-500)\';" onmouseout="this.style.color=\'#94a3b8\'; this.style.background=\'rgba(255,255,255,0.05)\';"><svg style="width:12px;height:12px;"><use href="#i-clipboard"/></svg></button>' +
          '</div>' +
        '</div>';
    });
    document.getElementById('fe-legal-list').innerHTML = legalHtml;

    // General Docs
    let generalHtml = '';
    data.generalDocs.forEach(d => {
        const badgeClass = d.status === 'Vigente' ? 'badge-blue' : 'badge-red';
        generalHtml += '<div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:10px; padding:12px; display:flex; align-items:center; justify-content:space-between; transition:all 0.2s; cursor:pointer;" onmouseover="this.style.background=\'rgba(255,255,255,0.04)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.02)\'">' +
          '<div style="display:flex; align-items:center; gap:10px; flex:1;">' +
            '<svg style="width:16px; height:16px; color:#3b82f6; fill:none; stroke:currentColor; stroke-width:2;"><use href="#i-file-check"/></svg>' +
            '<div>' +
              '<div style="font-size:11px; font-weight:700; color:#fff;">' + d.name + '</div>' +
              '<div style="font-size:9px; color:#64748b; margin-top:2px;">Vence: ' + d.expiry + '</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex; align-items:center; gap:8px;">' +
            '<span class="badge ' + badgeClass + '" style="font-size:8px;">' + d.status + '</span>' +
            '<button onclick="openPdfModal(\'' + d.file + '\')" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); width:26px; height:26px; border-radius:6px; display:flex; align-items:center; justify-content:center; color:#94a3b8; cursor:pointer; font-size:10px;" onmouseover="this.style.color=\'white\'; this.style.background=\'var(--blue-500)\';" onmouseout="this.style.color=\'#94a3b8\'; this.style.background=\'rgba(255,255,255,0.05)\';"><svg style="width:12px;height:12px;"><use href="#i-clipboard"/></svg></button>' +
          '</div>' +
        '</div>';
    });
    document.getElementById('fe-general-list').innerHTML = generalHtml;

    // Inspecciones Tab population
    let inspsHtml = '';
    data.inspections.forEach(i => {
        const badgeClass = i.status === 'Aprobado' ? 'badge-green' : 'badge-red';
        inspsHtml += '<div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:10px; padding:12px 18px; display:flex; align-items:center; justify-content:space-between; margin-bottom: 8px;">' +
          '<div style="display:flex; align-items:center; gap:16px;">' +
            '<div style="text-align:center; min-width:60px;">' +
              '<div style="font-size:9px; color:#64748b; font-weight:700; text-transform:uppercase;">' + i.date.split(' ')[1] + ' ' + i.date.split(' ')[2] + '</div>' +
              '<div style="font-size:16px; font-weight:900; color:#fff; line-height:1;">' + i.date.split(' ')[0] + '</div>' +
            '</div>' +
            '<div>' +
              '<div style="font-size:12px; font-weight:700; color:#fff;">' + i.type + '</div>' +
              '<div style="font-size:9px; color:var(--text-secondary); margin-top:2px;">Inspector: ' + i.inspector + '</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex; align-items:center; gap:12px;">' +
            '<span class="badge ' + badgeClass + '">' + i.status + '</span>' +
            '<button class="btn btn-ghost btn-sm" onclick="openPdfModal(\'Checklist_Inspection_' + plate + '.pdf\')" style="font-size:9px;">Ver Formulario PDF</button>' +
          '</div>' +
        '</div>';
    });
    document.getElementById('pane-fe-insps').innerHTML = inspsHtml;

    // Maintenance Tab population
    let maintHtml = '';
    data.maintenance.forEach(m => {
        const badgeClass = m.status === 'Completado' ? 'badge-green' : 'badge-amber';
        maintHtml += '<div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:10px; padding:14px; display:flex; flex-direction:column; gap:6px; margin-bottom: 8px;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center;">' +
            '<div style="font-size:12px; font-weight:700; color:#fff;">' + m.type + '</div>' +
            '<span class="badge ' + badgeClass + '">' + m.status + '</span>' +
          '</div>' +
          '<div style="font-size:10px; color:#94a3b8; line-height:1.4;">' + m.desc + '</div>' +
          '<div style="font-size:9px; color:var(--text-dim); margin-top:2px;">Fecha Ejecución: ' + m.date + ' · Taller Interno GSP</div>' +
        '</div>';
    });
    document.getElementById('pane-fe-maint').innerHTML = maintHtml;

    switchFeTab('docs');
    document.getElementById('modal-ficha-equipo').classList.add('open');
};

window.closeFichaEquipo = function() {
    document.getElementById('modal-ficha-equipo').classList.remove('open');
};

window.switchFeTab = function(tabId) {
    // Buttons
    ['docs', 'insps', 'maint'].forEach(t => {
        const btn = document.getElementById('tab-fe-' + t);
        if (btn) {
            btn.style.borderBottomColor = t === tabId ? '#10b981' : 'transparent';
            btn.style.color = t === tabId ? '#10b981' : '#94a3b8';
        }
        
        // Panes
        const pane = document.getElementById('pane-fe-' + t);
        if (pane) {
            pane.style.display = t === tabId ? 'flex' : 'none';
        }
    });
};

window.openFichaPublicaQR = function() {
    alert("Código QR generado para Ficha Pública. Escanee con un dispositivo móvil para abrir.");
};

// --- PDF Modal Viewer Logic ---
const pdfTemplates = {
    // Dossier EDP
    '#SRV-041': {
        title: 'Dossier_FES_SRV_041.pdf',
        type: 'Dossier Estado de Pago',
        folio: '#EDP-2026-401',
        date: '21 Junio 2026',
        signer: 'Carlos Muñoz Sepúlveda',
        role: 'Supervisor Laja CMPC',
        hash: 'FES-7F8B9C2A1E4D',
        content: '<div style="margin-bottom:20px;">' +
             '<h3 style="font-size:11px; font-weight:800; text-transform:uppercase; color:#334155; border-bottom:2px solid #cbd5e1; padding-bottom:4px; margin-bottom:12px; letter-spacing:0.05em;">1. Datos del Servicio</h3>' +
             '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; font-size:10px; line-height:1.6; color:#334155;">' +
                '<div><strong>Cliente:</strong> CMPC Celulosa S.A.</div>' +
                '<div><strong>RUT Cliente:</strong> 76.543.210-K</div>' +
                '<div><strong>Faena:</strong> Planta Laja - Turbina de Vapor</div>' +
                '<div><strong>Orden de Compra:</strong> OC-4530</div>' +
                '<div><strong>Equipo Principal:</strong> Liebherr LTM 1220 (GZBC-58)</div>' +
                '<div><strong>Operador Principal:</strong> Juan Pérez Alarcón</div>' +
             '</div>' +
          '</div>' +
          '<div style="margin-bottom:20px;">' +
             '<h3 style="font-size:11px; font-weight:800; text-transform:uppercase; color:#334155; border-bottom:2px solid #cbd5e1; padding-bottom:4px; margin-bottom:12px; letter-spacing:0.05em;">2. Consolidado de Horas Devengadas</h3>' +
             '<table style="width:100%; border-collapse: collapse; font-size:9px; color:#334155;">' +
                '<thead>' +
                   '<tr style="background:#f1f5f9; text-align:left; font-weight:800; border:1px solid #cbd5e1;">' +
                      '<th style="padding:6px; border:1px solid #cbd5e1;">Ítem / Fecha</th>' +
                      '<th style="padding:6px; border:1px solid #cbd5e1;">Horómetro Inic.</th>' +
                      '<th style="padding:6px; border:1px solid #cbd5e1;">Horómetro Fin.</th>' +
                      '<th style="padding:6px; border:1px solid #cbd5e1;">Horas Netas</th>' +
                      '<th style="padding:6px; border:1px solid #cbd5e1;">Tarifa Horaria</th>' +
                      '<th style="padding:6px; border:1px solid #cbd5e1; text-align:right;">Subtotal</th>' +
                   '</tr>' +
                '</thead>' +
                '<tbody>' +
                   '<tr style="border-bottom:1px solid #e2e8f0;">' +
                      '<td style="padding:6px; border:1px solid #cbd5e1; font-weight:600;">02-Jun-2026</td>' +
                      '<td style="padding:6px; border:1px solid #cbd5e1; font-family:monospace;">6864.0 Hrs</td>' +
                      '<td style="padding:6px; border:1px solid #cbd5e1; font-family:monospace;">6870.5 Hrs</td>' +
                      '<td style="padding:6px; border:1px solid #cbd5e1; font-weight:700;">6.5 Hrs</td>' +
                      '<td style="padding:6px; border:1px solid #cbd5e1;">$200.000 / Hr</td>' +
                      '<td style="padding:6px; border:1px solid #cbd5e1; text-align:right; font-weight:700;">$1.300.000</td>' +
                   '</tr>' +
                   '<tr style="border-bottom:1px solid #e2e8f0;">' +
                      '<td style="padding:6px; border:1px solid #cbd5e1; font-weight:600;">03-Jun-2026</td>' +
                      '<td style="padding:6px; border:1px solid #cbd5e1; font-family:monospace;">6870.5 Hrs</td>' +
                      '<td style="padding:6px; border:1px solid #cbd5e1; font-family:monospace;">6880.5 Hrs</td>' +
                      '<td style="padding:6px; border:1px solid #cbd5e1; font-weight:700;">10.0 Hrs</td>' +
                      '<td style="padding:6px; border:1px solid #cbd5e1;">$200.000 / Hr</td>' +
                      '<td style="padding:6px; border:1px solid #cbd5e1; text-align:right; font-weight:700;">$2.000.000</td>' +
                   '</tr>' +
                   '<tr style="border-bottom:1px solid #cbd5e1;">' +
                      '<td style="padding:6px; border:1px solid #cbd5e1; color:#64748b; font-style:italic;" colspan="6">... (15 reportes diarios FES consolidados en terreno y validados) ...</td>' +
                   '</tr>' +
                   '<tr style="font-weight:800; background:#f8fafc; font-size:10px;">' +
                      '<td style="padding:8px; border:1px solid #cbd5e1; text-align:right; color:#0f172a;" colspan="3">TOTAL HORAS DEVENGADAS</td>' +
                      '<td style="padding:8px; border:1px solid #cbd5e1; color:#0f172a; font-family:monospace;">174.0 Horas</td>' +
                      '<td style="padding:8px; border:1px solid #cbd5e1;"></td>' +
                      '<td style="padding:8px; border:1px solid #cbd5e1; text-align:right; font-size:11px; color:#e69500;">$34.800.000 CLP</td>' +
                   '</tr>' +
                '</tbody>' +
             '</table>' +
          '</div>' +
          '<div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:12px; margin-top:10px;">' +
             '<div style="font-size:9px; font-weight:800; color:#475569; text-transform:uppercase; margin-bottom:4px;">Evidencia Adjunta al Dossier:</div>' +
             '<div style="font-size:8px; color:#64748b; line-height:1.4;">' +
               '- 1x AST firmado digitalmente el 02-Jun-2026 por el operador y rigger.<br>' +
               '- 24x Registro de fotos del izaje de piezas del reactor.<br>' +
               '- Certificación de gancho y cable de acero Liebherr LTM 1220 vigente.' +
             '</div>' +
          '</div>'
    },
    // Revision Tecnica
    'Revision_Tecnica_GZBC58.pdf': {
        title: 'Certificado_Revision_Tecnica_GZBC58.pdf',
        type: 'Ministerio de Transportes - Chile',
        folio: '#RT-998822A',
        date: '15 Agosto 2025',
        signer: 'Andrés Lillo M.',
        role: 'Director Técnico PRT Temuco',
        hash: 'PRT-992211AA8B',
        content: '<div style="text-align:center; margin-bottom:20px;">' +
            '<div style="font-size:13px; font-weight:800; color:#0f172a; text-transform:uppercase; letter-spacing:0.05em;">Certificado de Revisión Técnica y de Emisión de Contaminantes</div>' +
            '<div style="font-size:9px; color:#64748b; margin-top:2px;">Decreto Supremo N° 156 de 1990</div>' +
          '</div>' +
          '<div style="margin-bottom:20px;">' +
             '<h3 style="font-size:10px; font-weight:800; text-transform:uppercase; color:#334155; border-bottom:1px solid #cbd5e1; padding-bottom:4px; margin-bottom:10px;">1. Identificación del Vehículo</h3>' +
             '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; font-size:9px; line-height:1.5; color:#334155;">' +
                '<div><strong>Patente:</strong> GZBC-58</div>' +
                '<div><strong>N° Chasis / Vin:</strong> 492A00918LTM1220</div>' +
                '<div><strong>Marca:</strong> LIEBHERR</div>' +
                '<div><strong>Modelo:</strong> LTM 1220</div>' +
                '<div><strong>Año Fabricación:</strong> 2021</div>' +
                '<div><strong>Tipo de Vehículo:</strong> Grúa Autopropulsada Pesada</div>' +
             '</div>' +
          '</div>' +
          '<div style="margin-bottom:20px;">' +
             '<h3 style="font-size:10px; font-weight:800; text-transform:uppercase; color:#334155; border-bottom:1px solid #cbd5e1; padding-bottom:4px; margin-bottom:10px;">2. Resultado de las Inspecciones</h3>' +
             '<table style="width:100%; border-collapse: collapse; font-size:9px; color:#334155;">' +
                '<thead>' +
                   '<tr style="background:#f1f5f9; text-align:left; font-weight:800; border:1px solid #cbd5e1;">' +
                      '<th style="padding:5px; border:1px solid #cbd5e1;">Sistema Inspeccionado</th>' +
                      '<th style="padding:5px; border:1px solid #cbd5e1;">Medición</th>' +
                      '<th style="padding:5px; border:1px solid #cbd5e1;">Norma Min.</th>' +
                      '<th style="padding:5px; border:1px solid #cbd5e1; text-align:center;">Estado</th>' +
                   '</tr>' +
                '</thead>' +
                '<tbody>' +
                   '<tr>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1; font-weight:600;">Eficacia de Frenado</td>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1;">65.4%</td>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1;">> 50.0%</td>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1; text-align:center; color:#10b981; font-weight:700;">APROBADO</td>' +
                   '</tr>' +
                   '<tr>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1; font-weight:600;">Emisión de Gases (Opacidad)</td>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1;">0.12 m-1</td>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1;">< 1.50 m-1</td>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1; text-align:center; color:#10b981; font-weight:700;">APROBADO</td>' +
                   '</tr>' +
                   '<tr>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1; font-weight:600;">Alineación de Ejes</td>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1;">2.4 m/km</td>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1;">< 5.0 m/km</td>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1; text-align:center; color:#10b981; font-weight:700;">APROBADO</td>' +
                   '</tr>' +
                   '<tr>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1; font-weight:600;">Holguras y Dirección</td>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1;">Sin defectos</td>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1;">Inspección visual</td>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1; text-align:center; color:#10b981; font-weight:700;">APROBADO</td>' +
                   '</tr>' +
                '</tbody>' +
             '</table>' +
          '</div>' +
          '<div style="border:1px solid #10b981; background:rgba(16,185,129,0.03); border-radius:6px; padding:10px; font-size:9px; text-align:center; color:#10b981; font-weight:700;">' +
             'ESTADO GLOBAL DE LA REVISIÓN TÉCNICA: APROBADA - VIGENTE HASTA EL 15 DE AGOSTO DE 2026' +
          '</div>'
    },
    // Bureau Veritas Certification GZBC-58
    'Certificado_Izaje_LSQA_GZBC58.pdf': {
        title: 'Cert_Calidad_Izaje_LSQA_GZBC58.pdf',
        type: 'LSQA Certification Services',
        folio: '#CERT-LSQA-2026-992',
        date: '12 Diciembre 2025',
        signer: 'Markus Heinze',
        role: 'Auditor Principal LSQA Chile',
        hash: 'LSQA-8F9D0C1B2A3E',
        content: '<div style="text-align:center; margin-bottom:20px;">' +
            '<div style="font-size:14px; font-weight:900; color:#3b82f6; text-transform:uppercase; letter-spacing:0.05em;">CERTIFICADO DE CONFORMIDAD DE EQUIPOS DE IZAJE</div>' +
            '<div style="font-size:9px; color:#64748b; margin-top:2px;">Norma ASME B30.5 / OSHA 1926.1400</div>' +
          '</div>' +
          '<div style="margin-bottom:20px;">' +
             '<h3 style="font-size:10px; font-weight:800; text-transform:uppercase; color:#334155; border-bottom:1px solid #cbd5e1; padding-bottom:4px; margin-bottom:10px;">1. Detalles del Activo Auditado</h3>' +
             '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; font-size:9px; line-height:1.5; color:#334155;">' +
                '<div><strong>Equipo:</strong> Liebherr LTM 1220</div>' +
                '<div><strong>Patente / Reg. Interno:</strong> GZBC-58 / GZBC-58</div>' +
                '<div><strong>Capacidad Máxima:</strong> 220 Toneladas Métricas</div>' +
                '<div><strong>Longitud Máxima Pluma:</strong> 60 Metros Telescópica</div>' +
                '<div><strong>Propietario:</strong> Grúas San Pablo Ltda.</div>' +
             '</div>' +
          '</div>' +
          '<div style="margin-bottom:20px;">' +
             '<h3 style="font-size:10px; font-weight:800; text-transform:uppercase; color:#334155; border-bottom:1px solid #cbd5e1; padding-bottom:4px; margin-bottom:10px;">2. Ensayos No Destructivos (END) y Pruebas Carga</h3>' +
             '<table style="width:100%; border-collapse: collapse; font-size:9px; color:#334155;">' +
                '<thead>' +
                   '<tr style="background:#f1f5f9; text-align:left; font-weight:800; border:1px solid #cbd5e1;">' +
                      '<th style="padding:5px; border:1px solid #cbd5e1;">Ítem Ensayo</th>' +
                      '<th style="padding:5px; border:1px solid #cbd5e1;">Metodología</th>' +
                      '<th style="padding:5px; border:1px solid #cbd5e1; text-align:center;">Resultado</th>' +
                   '</tr>' +
                '</thead>' +
                '<tbody>' +
                   '<tr>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1; font-weight:600;">Partículas Magnéticas en Gancho y Grilletes</td>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1;">ASTM E709 - Fisuras Superficiales</td>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1; text-align:center; color:#10b981; font-weight:700;">SIN DEFECTOS</td>' +
                   '</tr>' +
                   '<tr>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1; font-weight:600;">Ultrasonido en Soldaduras de Estructura Giratoria</td>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1;">ASTM E164 - Integridad Estructural</td>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1; text-align:center; color:#10b981; font-weight:700;">CONFORME</td>' +
                   '</tr>' +
                   '<tr>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1; font-weight:600;">Prueba de Carga Dinámica (110% Capacidad)</td>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1;">ASME B30.5 - Prueba de Izaje Real</td>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1; text-align:center; color:#10b981; font-weight:700;">SATISFACTORIO</td>' +
                   '</tr>' +
                   '<tr>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1; font-weight:600;">Indicador de Momento de Carga (LMI)</td>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1;">Calibración de celdas de carga y sensores de ángulo</td>' +
                      '<td style="padding:5px; border:1px solid #cbd5e1; text-align:center; color:#10b981; font-weight:700;">CALIBRADO</td>' +
                   '</tr>' +
                '</tbody>' +
             '</table>' +
          '</div>' +
          '<div style="border:1px solid #3b82f6; background:rgba(59,130,246,0.03); border-radius:6px; padding:10px; font-size:9px; text-align:center; color:#3b82f6; font-weight:700;">' +
             'LA GRÚAS SE ENCUENTRA APTA PARA FAENAS MINERAS E INDUSTRIALES HASTA EL 12 DE DICIEMBRE DE 2026' +
          '</div>'
    }
};

window.openPdfModal = function(fileKey) {
    let data = pdfTemplates[fileKey];
    
    // Auto-generate template dynamically based on fileKey patterns
    if (!data) {
        let serviceNum = null;
        const match = fileKey.match(/SRV(?:-2026)?-?(\d+)/i);
        if (match) {
            serviceNum = match[1];
        }
        
        let service = null;
        if (serviceNum) {
            const fullKey = Object.keys(window.servicesData).find(key => key.endsWith(serviceNum));
            if (fullKey) {
                service = window.servicesData[fullKey];
            }
        }
        
        if (service) {
            if (fileKey.includes('Plan_Rigging_')) {
                data = generateRiggingPlanData(service, serviceNum);
            } else if (fileKey.includes('AST_Digital_')) {
                data = generateAstData(service, serviceNum);
            } else if (fileKey.includes('Reporte_Horometros_')) {
                data = generateHorometrosData(service, serviceNum);
            } else {
                data = generateDossierData(service, serviceNum);
            }
        }
    }
    
    // Auto-generate template fallback if not matching any service
    if (!data) {
        let isDocEdp = fileKey.startsWith('#');
        data = {
            title: fileKey,
            type: isDocEdp ? 'Dossier Estado de Pago' : 'Documento General GSP',
            folio: '#FL-' + Math.floor(100000 + Math.random() * 900000),
            date: '21 Junio 2026',
            signer: 'Andrés Molina Bravo',
            role: 'Encargado de Calidad y SST',
            hash: 'FES-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
            content: '<div style="margin-bottom:20px;">' +
                 '<h3 style="font-size:11px; font-weight:800; text-transform:uppercase; color:#334155; border-bottom:2px solid #cbd5e1; padding-bottom:4px; margin-bottom:12px; letter-spacing:0.05em;">Detalle del Documento</h3>' +
                 '<div style="font-size:10px; line-height:1.6; color:#334155;">' +
                   'Este es un visor interactivo que simula el documento oficial: <strong>' + fileKey + '</strong>.<br>' +
                   'El archivo contiene las firmas, timbres del mandante y validación digital requerida.<br><br>' +
                   '<strong>Estado:</strong> Vigente y validado contra el sistema de gestión digital de Grúas San Pablo.' +
                 '</div>' +
              '</div>'
        };
    }
    
    document.getElementById('pdf-title').textContent = data.title;
    document.getElementById('pdf-doc-type').textContent = data.type;
    document.getElementById('pdf-doc-folio').textContent = 'Folio: ' + data.folio;
    document.getElementById('pdf-doc-date').textContent = 'Fecha Emisión: ' + data.date;
    document.getElementById('pdf-signer-name').textContent = data.signer;
    document.getElementById('pdf-signer-role').textContent = data.role;
    document.getElementById('pdf-doc-hash').textContent = 'HASH: ' + data.hash;
    document.getElementById('pdf-content-body').innerHTML = data.content;
    
    document.getElementById('modal-pdf').classList.add('open');
};

window.closePdfModal = function() {
    document.getElementById('modal-pdf').classList.remove('open');
};

// Hook background clicks
document.getElementById('modal-ficha-equipo').addEventListener('click', function(e) {
  if (e.target === this) window.closeFichaEquipo();
});
document.getElementById('modal-pdf').addEventListener('click', function(e) {
  if (e.target === this) window.closePdfModal();
});
document.getElementById('modal-asignacion').addEventListener('click', function(e) {
  if (e.target === this) window.closeAsignacionModal();
});

// ESC Key closes modals
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
      window.closeFichaEquipo();
      window.closePdfModal();
      window.closeAsignacionModal();
  }
});

// ── GSP Real-time Filtering & Search Logic ──
window.applyTableFilters = function(viewId) {
    let tableId, searchInputId, dateFromId, dateToId, resetBtnId;
    if (viewId === 'cruce') {
        tableId = 'edp-table';
        searchInputId = 'edp-search';
        dateFromId = 'edp-date-from';
        dateToId = 'edp-date-to';
        resetBtnId = 'edp-reset';
    } else if (viewId === 'mantencion') {
        tableId = 'fleet-table';
        searchInputId = 'fleet-search';
        dateFromId = 'fleet-date-from';
        dateToId = 'fleet-date-to';
        resetBtnId = 'fleet-reset';
    } else if (viewId === 'acreditacion') {
        tableId = 'acred-table';
        searchInputId = 'acred-search';
        dateFromId = 'acred-date-from';
        dateToId = 'acred-date-to';
        resetBtnId = 'acred-reset';
    }

    const table = document.getElementById(tableId);
    if (!table) return;

    const query = document.getElementById(searchInputId).value.toLowerCase().trim();
    const dateFrom = document.getElementById(dateFromId).value;
    const dateTo = document.getElementById(dateToId).value;
    const resetBtn = document.getElementById(resetBtnId);

    // Show/hide reset button
    if (query || dateFrom || dateTo) {
        if (resetBtn) resetBtn.style.display = 'inline-block';
    } else {
        if (resetBtn) resetBtn.style.display = 'none';
    }

    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        let matchesSearch = true;
        let matchesDates = true;

        // Search text matching
        if (query) {
            const text = row.textContent.toLowerCase();
            matchesSearch = text.includes(query);
        }

        // Date range matching
        const rowDate = row.getAttribute('data-date');
        if (rowDate) {
            if (dateFrom && rowDate < dateFrom) {
                matchesDates = false;
            }
            if (dateTo && rowDate > dateTo) {
                matchesDates = false;
            }
        }

        if (matchesSearch && matchesDates) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });

    window.updateTableKPIs(viewId);
};

window.resetFilters = function(viewId) {
    let searchInputId, dateFromId, dateToId;
    if (viewId === 'cruce') {
        searchInputId = 'edp-search';
        dateFromId = 'edp-date-from';
        dateToId = 'edp-date-to';
    } else if (viewId === 'mantencion') {
        searchInputId = 'fleet-search';
        dateFromId = 'fleet-date-from';
        dateToId = 'fleet-date-to';
    } else if (viewId === 'acreditacion') {
        searchInputId = 'acred-search';
        dateFromId = 'acred-date-from';
        dateToId = 'acred-date-to';
    }

    document.getElementById(searchInputId).value = '';
    document.getElementById(dateFromId).value = '';
    document.getElementById(dateToId).value = '';

    window.applyTableFilters(viewId);
};

window.updateTableKPIs = function(viewId) {
    if (viewId === 'cruce') {
        const rows = document.querySelectorAll('#edp-table tbody tr');
        let total = 0;
        let totalMonto = 0;
        let aprobados = 0;
        let pendientes = 0;

        rows.forEach(row => {
            if (row.style.display !== 'none') {
                total++;
                // Parse Devengado Terreno value (7th column, index 6)
                const cellMonto = row.cells[6];
                if (cellMonto) {
                    const cleanVal = cellMonto.textContent.replace(/[^0-9]/g, '');
                    totalMonto += parseInt(cleanVal) || 0;
                }
                // Parse statuses
                const text = row.textContent.toLowerCase();
                if (text.includes('aprobado') || text.includes('oc-')) {
                    aprobados++;
                } else {
                    pendientes++;
                }
            }
        });

        document.getElementById('edp-kpi-total').innerText = total;
        document.getElementById('edp-kpi-monto').innerText = '$' + totalMonto.toLocaleString('es-CL');
        document.getElementById('edp-kpi-aprobados').innerText = aprobados;
        document.getElementById('edp-kpi-pendientes').innerText = pendientes;

    } else if (viewId === 'mantencion') {
        const rows = document.querySelectorAll('#fleet-table tbody tr');
        let total = 0;
        let operativos = 0;
        let taller = 0;
        let alertas = 0;

        rows.forEach(row => {
            if (row.style.display !== 'none') {
                total++;
                const text = row.textContent.toLowerCase();
                if (text.includes('en taller') || text.includes('en mantención')) {
                    taller++;
                } else if (text.includes('vencido') || text.includes('vencidos') || text.includes('RT Próxima') || text.includes('rt próxima')) {
                    alertas++;
                } else {
                    operativos++;
                }
            }
        });

        document.getElementById('fleet-kpi-total').innerText = total;
        document.getElementById('fleet-kpi-operativos').innerText = operativos;
        document.getElementById('fleet-kpi-taller').innerText = taller;
        document.getElementById('fleet-kpi-alertas').innerText = alertas;

    } else if (viewId === 'acreditacion') {
        const rows = document.querySelectorAll('#acred-table tbody tr');
        let total = 0;
        let habilitados = 0;
        let bloqueados = 0;

        rows.forEach(row => {
            if (row.style.display !== 'none') {
                total++;
                const text = row.textContent.toLowerCase();
                if (text.includes('habilitado')) {
                    habilitados++;
                } else if (text.includes('bloqueado')) {
                    bloqueados++;
                }
            }
        });

        const tasa = total > 0 ? Math.round((habilitados / total) * 100) : 0;

        document.getElementById('acred-kpi-total').innerText = total;
        document.getElementById('acred-kpi-habilitados').innerText = habilitados;
        document.getElementById('acred-kpi-bloqueados').innerText = bloqueados;
        document.getElementById('acred-kpi-tasa').innerText = tasa + '%';
    }
};

// ── Export to Excel Function ──
window.exportTableToExcel = function(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) return;

    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    for (let i = 0; i < rows.length; i++) {
        // Skip hidden rows (filtered out)
        if (rows[i].style.display === 'none') continue;
        
        let row = [];
        const cols = rows[i].querySelectorAll('td, th');
        
        for (let j = 0; j < cols.length; j++) {
            // Skip the action columns if exporting data
            if (cols[j].textContent.trim() === 'Acción' || (cols[j].querySelector('button') && cols[j].textContent.includes('Ver Ficha'))) {
                continue;
            }
            // Clean up text, remove extra whitespace/newlines, escape quotes
            let data = cols[j].textContent.trim().replace(/\s+/g, ' ');
            data = data.replace(/"/g, '""');
            // If it has a semicolon, wrap in quotes
            if (data.indexOf(';') > -1 || data.indexOf('"') > -1) {
                data = '"' + data + '"';
            }
            row.push(data);
        }
        if (row.length > 0) {
            csv.push(row.join(';')); // Semicolon is better for Spanish Excel
        }
    }
    
    // Add BOM for UTF-8 compatibility with Excel in Spanish locales
    const csvContent = '\uFEFF' + csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Initialize KPIs
setTimeout(() => {
    window.updateTableKPIs('cruce');
    window.updateTableKPIs('mantencion');
    window.updateTableKPIs('acreditacion');
}, 500);

// ── switchDossierTab Function ──
window.switchDossierTab = function(tabId) {
  // Hide all sections
  document.querySelectorAll('.modal-tab-section').forEach(sect => {
    sect.classList.remove('active');
  });
  // Show target section
  const target = document.getElementById('m360-sect-' + tabId);
  if (target) {
    target.classList.add('active');
  }
  // Update active tab buttons
  document.querySelectorAll('.modal-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.getElementById('m360-tab-btn-' + tabId);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Dynamic GPS update in Geoloc tab to simulate live telematics
  if (tabId === 'geoloc') {
    const lat = (-37.2654 - Math.random() * 0.05).toFixed(4);
    const lon = (-72.6987 - Math.random() * 0.05).toFixed(4);
    const gpsEl = document.getElementById('m360-gps-coords');
    if (gpsEl) {
      const activeServiceId = document.getElementById('m360-title-id').textContent;
      const s = window.servicesData[activeServiceId] || {};
      gpsEl.innerHTML = `Lat: ${lat}, Lon: ${lon} &middot; Faena: ${s.faena || 'Terreno GSP'} &middot; Velocidad: 0 km/h (Detenido)`;
    }
  }
};

