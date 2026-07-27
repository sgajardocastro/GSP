const fs = require('fs');

function build() {
    console.log('Reading maqueta_gsp_v2.html...');
    let html = fs.readFileSync('maqueta_gsp_v2.html', 'utf8');

    // 1. Highcharts CDN injection
    html = html.replace('</head>', `
<script src="https://cdnjs.cloudflare.com/ajax/libs/highcharts/11.4.3/highcharts.js"></script>
</head>`);

    // 2. Branch Selector in the header
    const brandStr = `<span class="badge badge-amber" style="margin-left:8px;">Consola Control Operativo & Devengado</span>`;
    const selectorHtml = `
<span class="badge badge-amber" style="margin-left:8px;">Consola Control Operativo & Devengado</span>
<select id="branch-select" onchange="window.updateCharts()" style="margin-left:12px; background:rgba(15,22,41,0.8); border:1px solid rgba(255,255,255,0.1); color:white; font-size:10px; padding:4px 8px; border-radius:4px; font-weight:700; outline:none; cursor:pointer;">
    <option value="todas">Todas las Sucursales</option>
    <option value="temuco">Temuco (Matriz)</option>
    <option value="la">Los Ángeles</option>
    <option value="valdivia">Valdivia</option>
</select>
`;
    html = html.replace(brandStr, selectorHtml);

    // 3. Replace Flujo Financiero Panel with Highcharts Histogram (left column)
    const flowStartToken = '<!-- Devengado Flow Visualization -->';
    const flowEndToken = '<!-- Alertas -->';
    const flowStartIndex = html.indexOf(flowStartToken);
    const flowEndIndex = html.indexOf(flowEndToken);

    if (flowStartIndex !== -1 && flowEndIndex !== -1) {
        const toReplace = html.substring(flowStartIndex, flowEndIndex);
        const histogramPanel = `<!-- Devengado Histogram -->
              <div class="panel" style="flex:1.4; display:flex; flex-direction:column;">
                <div class="panel-header">
                  <div>
                    <div class="panel-title"><svg><use href="#i-chart"/></svg> Histograma Financiero 6 Meses</div>
                    <div class="panel-subtitle">Comparativa: Devengado, Orden Compra, Estado Pago y Facturado</div>
                  </div>
                  <span class="badge badge-green">En Vivo</span>
                </div>
                <div class="panel-body" style="padding:0; position:relative; min-height:220px; flex:1;">
                   <div id="hc-container" style="position:absolute; inset:0; padding:10px;"></div>
                </div>
              </div>
              
              `;
        html = html.replace(toReplace, histogramPanel);
        console.log('Successfully replaced Flujo panel with Histograma Highcharts.');
    } else {
        console.error('CRITICAL: Could not find Flujo Financiero tokens in HTML.');
    }

    // 4. Inject Acreditación KPIs in the right column (between Balanza and Motor HSEC)
    const motorHsecToken = '<!-- Motor HSEC -->';
    const kpiRowHtml = `
              <!-- KPIs Acreditacion -->
              <div style="display:flex; gap:14px; flex-shrink:0;">
                <div class="panel" style="flex:1; padding:12px; background:rgba(16,185,129,0.05); border-color:rgba(16,185,129,0.2); cursor:pointer; transition:all 0.2s;" onclick="switchView('acreditacion', document.querySelector('[data-view=acreditacion]'))" onmouseover="this.style.borderColor='rgba(16,185,129,0.4)';" onmouseout="this.style.borderColor='rgba(16,185,129,0.2)';">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <span style="font-size:9px; font-weight:800; color:var(--green-400); text-transform:uppercase; display:flex; align-items:center; gap:4px;"><svg style="width:12px;height:12px;"><use href="#i-users"/></svg> Acreditación Personal</span>
                        <span class="badge badge-green">AL DÍA</span>
                    </div>
                    <div style="font-size:20px; font-weight:900; color:#fff; line-height:1;">92%</div>
                    <div style="display:flex; justify-content:space-between; font-size:9px; color:var(--text-muted); margin-top:6px;">
                        <span>Vigentes: 45</span><span style="color:var(--red-400); font-weight:700;">Bloqueados: 4</span>
                    </div>
                </div>
                <div class="panel" style="flex:1; padding:12px; background:rgba(245,166,35,0.05); border-color:rgba(245,166,35,0.2); cursor:pointer; transition:all 0.2s;" onclick="switchView('mantencion', document.querySelector('[data-view=mantencion]'))" onmouseover="this.style.borderColor='rgba(245,166,35,0.4)';" onmouseout="this.style.borderColor='rgba(245,166,35,0.2)';">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <span style="font-size:9px; font-weight:800; color:var(--amber-500); text-transform:uppercase; display:flex; align-items:center; gap:4px;"><svg style="width:12px;height:12px;"><use href="#i-truck"/></svg> Acreditación Equipos</span>
                        <span class="badge badge-amber">DOCS OK</span>
                    </div>
                    <div style="font-size:20px; font-weight:900; color:#fff; line-height:1;">85%</div>
                    <div style="display:flex; justify-content:space-between; font-size:9px; color:var(--text-muted); margin-top:6px;">
                        <span>Operativos: 62</span><span style="color:var(--red-400); font-weight:700;">Vencidos: 11</span>
                    </div>
                </div>
              </div>

              `;
    html = html.replace(motorHsecToken, kpiRowHtml + '\n              ' + motorHsecToken);
    console.log('Successfully injected Acreditación KPIs in right column.');

    // 5. Update Navigation and Cruce headers
    html = html.replace(
        '<div class="sidebar-item-title">Doble Conciliación</div>\n            <div class="sidebar-item-sub">Cruce Parte vs Contrato</div>',
        '<div class="sidebar-item-title">Estados de Pago (EDP)</div>\n            <div class="sidebar-item-sub">Facturación y Dossier PDF</div>'
    );
    html = html.replace(
        '<h2 style="font-size:20px;font-weight:900;color:#fff;">Cruce de Devengado y Facturación</h2>',
        '<h2 style="font-size:20px;font-weight:900;color:#fff;">Estados de Pago y Avance</h2>'
    );
    html = html.replace(
        `cruce: 'Doble Conciliación · Cruce Devengado vs Facturado',`,
        `cruce: 'Estados de Pago (EDP)',`
    );

    // 6. Make all Kanban cards clickable and inject operator/crane photos
    html = html.replace(/<div class="kanban-card">/g, '<div class="kanban-card" onclick="openModal()">');
    // Ensure ones that already had onclick="openModal()" don't double click
    html = html.replace(/<div class="kanban-card" onclick="openModal\(\)" onclick="openModal\(\)">/g, '<div class="kanban-card" onclick="openModal()">');
    html = html.replace(/<div class="kanban-card" onclick="openModal\(\)">/g, '<div class="kanban-card" onclick="openModal()">');

    // Inject unique photos in representative Kanban Cards
    // Card #SRV-2026-048 (Arauco S.A.)
    const card48Start = `<div class="kanban-card" onclick="openModal()">\n                  <div class="kanban-card-top"><span class="kanban-card-id">#SRV-2026-048</span>`;
    const card48WithPhoto = `<div class="kanban-card" onclick="openModal()">
                  <div style="width:100%; height:75px; border-radius:6px; overflow:hidden; margin-bottom:8px; border:1px solid rgba(255,255,255,0.08);">
                    <img src="https://images.unsplash.com/photo-1504307651254-35680f356f27?w=400&q=80" style="width:100%; height:100%; object-fit:cover; opacity:0.85;" />
                  </div>
                  <div class="kanban-card-top"><span class="kanban-card-id">#SRV-2026-048</span>`;
    html = html.replace(card48Start, card48WithPhoto);

    // Card #SRV-2026-041 (CMPC Celulosa - En Maniobra)
    const card41Start = `<div class="kanban-card" onclick="openModal()">\n                  <div class="kanban-card-top"><span class="kanban-card-id">#SRV-2026-041</span>`;
    const card41WithPhoto = `<div class="kanban-card" onclick="openModal()">
                  <div style="width:100%; height:75px; border-radius:6px; overflow:hidden; margin-bottom:8px; border:1px solid rgba(255,255,255,0.08);">
                    <img src="https://images.unsplash.com/photo-1541888081691-38148386348c?w=400&q=80" style="width:100%; height:100%; object-fit:cover; opacity:0.85;" />
                  </div>
                  <div class="kanban-card-top"><span class="kanban-card-id">#SRV-2026-041</span>`;
    html = html.replace(card41Start, card41WithPhoto);

    // Card #SRV-2026-043 (Arauco Forestal - En Maniobra)
    const card43Start = `<div class="kanban-card" onclick="openModal()">\n                  <div class="kanban-card-top"><span class="kanban-card-id">#SRV-2026-043</span>`;
    const card43WithPhoto = `<div class="kanban-card" onclick="openModal()">
                  <div style="width:100%; height:75px; border-radius:6px; overflow:hidden; margin-bottom:8px; border:1px solid rgba(255,255,255,0.08);">
                    <img src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&q=80" style="width:100%; height:100%; object-fit:cover; opacity:0.85;" />
                  </div>
                  <div class="kanban-card-top"><span class="kanban-card-id">#SRV-2026-043</span>`;
    html = html.replace(card43Start, card43WithPhoto);

    // Card #SRV-2026-038 (Cementos Biobío - Completado)
    const card38Start = `<div class="kanban-card" onclick="openModal()">\n                  <div class="kanban-card-top"><span class="kanban-card-id">#SRV-2026-038</span>`;
    const card38WithPhoto = `<div class="kanban-card" onclick="openModal()">
                  <div style="width:100%; height:75px; border-radius:6px; overflow:hidden; margin-bottom:8px; border:1px solid rgba(255,255,255,0.08);">
                    <img src="https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=400&q=80" style="width:100%; height:100%; object-fit:cover; opacity:0.85;" />
                  </div>
                  <div class="kanban-card-top"><span class="kanban-card-id">#SRV-2026-038</span>`;
    html = html.replace(card38Start, card38WithPhoto);



    // 7. Update Doble Conciliación action buttons to open Dossier PDF
    html = html.replace(
        /<button class="btn btn-primary btn-sm">Aprobar EDP<\/button>/g,
        `<button class="btn btn-primary btn-sm" onclick="openPdfModal('#SRV-041')" style="background:var(--green-500); box-shadow:0 0 12px var(--green-glow);"><svg style="width:12px;height:12px;"><use href="#i-clipboard"/></svg> Generar Dossier PDF</button>`
    );

    // 8. Rebuild the Flota table to have consolidado Status Docs and click to open Ficha 360 (Redundant, tables are already built in maqueta_gsp_v2)
    /*
    const headerFlotaToken = `<th>Certificado Anual</th>\n                    <th style="text-align:right;">Estado</th>`;
    const newHeaderFlota = `<th>Status Docs</th>\n                    <th style="text-align:right;">Acción</th>`;
    html = html.replace(headerFlotaToken, newHeaderFlota);

    // Rows replacement
    // GZBC-71
    html = html.replace(
        `<td><span class="badge badge-green">2027-03 · Bureau Veritas</span></td>\n                    <td style="text-align:right;"><span class="badge badge-green">Operativa</span></td>`,
        `<td><div class="flex items-center gap-2"><span style="width:6px;height:6px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span><span style="font-size:10px;color:var(--green-400);font-weight:700;">Todo Vigente</span></div></td>\n                    <td style="text-align:right;"><button class="btn btn-primary btn-sm" onclick="openFichaEquipo('GZBC-71')">Ver Ficha 360</button></td>`
    );
    // GZBC-61
    html = html.replace(
        `<td><span class="badge badge-green">2027-01 · Bureau Veritas</span></td>\n                    <td style="text-align:right;"><span class="badge badge-amber">Próx. Mantención</span></td>`,
        `<td><div class="flex items-center gap-2"><span style="width:6px;height:6px;border-radius:50%;background:#f5a623;box-shadow:0 0 8px #f5a623;"></span><span style="font-size:10px;color:var(--amber-500);font-weight:700;">RT Próxima</span></div></td>\n                    <td style="text-align:right;"><button class="btn btn-primary btn-sm" onclick="openFichaEquipo('GZBC-61')">Ver Ficha 360</button></td>`
    );
    // GZBC-58
    html = html.replace(
        `<td><span class="badge badge-green">2026-12 · LSQA</span></td>\n                    <td style="text-align:right;"><span class="badge badge-blue">En Faena</span></td>`,
        `<td><div class="flex items-center gap-2"><span style="width:6px;height:6px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span><span style="font-size:10px;color:var(--green-400);font-weight:700;">Todo Vigente</span></div></td>\n                    <td style="text-align:right;"><button class="btn btn-primary btn-sm" onclick="openFichaEquipo('GZBC-58')">Ver Ficha 360</button></td>`
    );
    // GZBC-55
    html = html.replace(
        `<td><span class="badge badge-green">2026-11 · Bureau Veritas</span></td>\n                    <td style="text-align:right;"><span class="badge badge-green">Operativa</span></td>`,
        `<td><div class="flex items-center gap-2"><span style="width:6px;height:6px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span><span style="font-size:10px;color:var(--green-400);font-weight:700;">Todo Vigente</span></div></td>\n                    <td style="text-align:right;"><button class="btn btn-primary btn-sm" onclick="openFichaEquipo('GZBC-55')">Ver Ficha 360</button></td>`
    );
    // GZBC-43
    html = html.replace(
        `<td><span class="badge badge-red">2026-06-01 · VENCIDO ⚠</span></td>\n                    <td style="text-align:right;"><span class="badge badge-red">Bloqueada</span></td>`,
        `<td><div class="flex items-center gap-2"><span style="width:6px;height:6px;border-radius:50%;background:#ef4444;box-shadow:0 0 8px #ef4444;"></span><span style="font-size:10px;color:var(--red-400);font-weight:700;">Docs Vencidos ⚠</span></div></td>\n                    <td style="text-align:right;"><button class="btn btn-primary btn-sm" onclick="openFichaEquipo('GZBC-43')">Ver Ficha 360</button></td>`
    );
    // GZBC-40
    html = html.replace(
        `<td><span class="badge badge-green">2027-02 · Bureau Veritas</span></td>\n                    <td style="text-align:right;"><span class="badge badge-green">Operativa</span></td>`,
        `<td><div class="flex items-center gap-2"><span style="width:6px;height:6px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span><span style="font-size:10px;color:var(--green-400);font-weight:700;">Todo Vigente</span></div></td>\n                    <td style="text-align:right;"><button class="btn btn-primary btn-sm" onclick="openFichaEquipo('GZBC-40')">Ver Ficha 360</button></td>`
    );
    // GZBC-37
    html = html.replace(
        `<td><span class="badge badge-green">2026-09 · LSQA</span></td>\n                    <td style="text-align:right;"><span class="badge badge-green">Operativa</span></td>`,
        `<td><div class="flex items-center gap-2"><span style="width:6px;height:6px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span><span style="font-size:10px;color:var(--green-400);font-weight:700;">Todo Vigente</span></div></td>\n                    <td style="text-align:right;"><button class="btn btn-primary btn-sm" onclick="openFichaEquipo('GZBC-37')">Ver Ficha 360</button></td>`
    );
    // GZBC-32
    html = html.replace(
        `<td><span class="badge badge-green">2026-10 · Bureau Veritas</span></td>\n                    <td style="text-align:right;"><span class="badge badge-blue">En Faena</span></td>`,
        `<td><div class="flex items-center gap-2"><span style="width:6px;height:6px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span><span style="font-size:10px;color:var(--green-400);font-weight:700;">Todo Vigente</span></div></td>\n                    <td style="text-align:right;"><button class="btn btn-primary btn-sm" onclick="openFichaEquipo('GZBC-32')">Ver Ficha 360</button></td>`
    );
    // GZBC-28
    html = html.replace(
        `<td><span class="badge badge-green">2027-04 · LSQA</span></td>\n                    <td style="text-align:right;"><span class="badge badge-blue">En Faena</span></td>`,
        `<td><div class="flex items-center gap-2"><span style="width:6px;height:6px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span><span style="font-size:10px;color:var(--green-400);font-weight:700;">Todo Vigente</span></div></td>\n                    <td style="text-align:right;"><button class="btn btn-primary btn-sm" onclick="openFichaEquipo('GZBC-28')">Ver Ficha 360</button></td>`
    );
    // GZBC-22
    html = html.replace(
        `<td><span class="badge badge-green">2026-08 · Bureau Veritas</span></td>\n                    <td style="text-align:right;"><span class="badge badge-red">Mantención</span></td>`,
        `<td><div class="flex items-center gap-2"><span style="width:6px;height:6px;border-radius:50%;background:#ef4444;box-shadow:0 0 8px #ef4444;"></span><span style="font-size:10px;color:var(--red-400);font-weight:700;">En Taller</span></div></td>\n                    <td style="text-align:right;"><button class="btn btn-primary btn-sm" onclick="openFichaEquipo('GZBC-22')">Ver Ficha 360</button></td>`
    );
    */


    // 9. Inject Modals HTML right before <!-- ═══════ MODAL: EXPEDIENTE 360° ═══════ -->
    const modalExpedienteToken = '<!-- ═══════ MODAL: EXPEDIENTE 360° ═══════ -->';
    const modalsHtml = `
<!-- ═══════ MODAL: FICHA EQUIPO 360 (Estilo Transmac) ═══════ -->
<div class="modal-overlay" id="modal-ficha-equipo">
  <div class="modal-content" style="width:90%; max-width:1150px; height:85vh; background:#070b16; border:1px solid rgba(16,185,129,0.25); border-radius:20px; overflow:hidden; display:flex; flex-direction:column; position:relative; box-shadow:0 0 50px rgba(0,0,0,0.8);">
    
    <!-- Decorative background glow -->
    <div style="position:absolute; top:-20%; left:-10%; width:45%; height:45%; background:rgba(16,185,129,0.08); border-radius:50%; filter:blur(100px); pointer-events:none; z-index:1;"></div>
    <div style="position:absolute; bottom:-10%; right:-10%; width:45%; height:40%; background:rgba(59,130,246,0.08); border-radius:50%; filter:blur(100px); pointer-events:none; z-index:1;"></div>

    <!-- Modal Header -->
    <div style="padding:18px 28px; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center; background:rgba(15,22,41,0.6); backdrop-filter:blur(8px); z-index:2; flex-shrink:0;">
      <div style="display:flex; align-items:center; gap:16px;">
        <div style="width:42px; height:42px; border-radius:10px; background:linear-gradient(135deg, rgba(16,185,129,0.15), rgba(39,39,42,0.3)); border:1px solid rgba(16,185,129,0.2); display:flex; align-items:center; justify-content:center;">
          <svg style="width:22px; height:22px; color:#34d399;"><use href="#i-crane"/></svg>
        </div>
        <div>
          <div style="display:flex; align-items:center; gap:10px;">
            <h1 id="fe-plate" style="font-size:18px; font-weight:900; color:#fff; margin:0; letter-spacing:0.05em;">GZBC-58</h1>
            <span class="badge badge-green" style="background:#10b981; color:#000; font-weight:800; font-size:9px;">OPERATIVO</span>
          </div>
          <p id="fe-title" style="font-size:10px; color:var(--text-secondary); margin:4px 0 0; text-transform:uppercase; letter-spacing:0.08em; font-weight:700;">LIEBHERR LTM 1220 (220 TONELADAS)</p>
        </div>
      </div>
      
      <div style="display:flex; align-items:center; gap:14px;">
        <button class="btn btn-primary btn-sm" onclick="openFichaPublicaQR()" style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); color:#34d399; display:flex; align-items:center; gap:6px;">
          <svg style="width:12px;height:12px;fill:currentColor;"><use href="#i-smartphone"/></svg> QR Ficha Pública
        </button>
        <button onclick="closeFichaEquipo()" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#94a3b8; cursor:pointer; transition:all 0.2s;" onmouseover="this.style.color='white'; this.style.background='rgba(239,68,68,0.2)';" onmouseout="this.style.color='#94a3b8'; this.style.background='rgba(255,255,255,0.05)';">
          <svg style="width:14px;height:14px;"><use href="#i-x"/></svg>
        </button>
      </div>
    </div>

    <!-- Modal Body -->
    <div style="flex:1; display:flex; overflow:hidden; z-index:2;">
      
      <!-- Left Sidebar: Technical Specifications -->
      <aside style="width:280px; border-right:1px solid rgba(255,255,255,0.06); background:rgba(5,8,16,0.35); padding:24px; display:flex; flex-direction:column; gap:20px; overflow-y:auto; flex-shrink:0;">
        <div style="border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:12px;">
          <h2 style="font-size:10px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:0.1em; margin:0 0 8px;">Especificaciones Técnicas</h2>
          <div id="fe-specs-list" style="display:flex; flex-direction:column; gap:8px;">
             <!-- populated dynamically -->
          </div>
        </div>

        <div style="background:rgba(15,22,41,0.4); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:14px; text-align:center;">
          <div style="font-size:9px; font-weight:800; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px; letter-spacing:0.05em;">Código QR Ficha Pública</div>
          <!-- SVG QR Code representing: https://servidor.leanglobal.cl/equipo/ -->
          <div style="width:110px; height:110px; background:white; border-radius:8px; margin:0 auto 10px; display:flex; align-items:center; justify-content:center; padding:6px; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
             <!-- QR simulation SVG -->
             <svg width="100%" height="100%" viewBox="0 0 29 29" style="shape-rendering:crispEdges;">
               <path fill="#ffffff" d="M0,0h29v29h-29z"/>
               <path fill="#000000" d="M0,0h7v7h-7z M22,0h7v7h-7z M0,22h7v7h-7z M2,2h3v3h-3z M24,2h3v3h-3z M2,24h3v3h-3z M10,0h1v3h-1z M12,1h2v1h-2z M15,0h1v1h-1z M18,0h3v1h-3z M10,4h4v1h-4z M17,3h1v2h-1z M19,4h2v2h-2z M12,6h3v1h-3z M24,8h1v2h-1z M27,8h1v1h-1z M9,9h1v1h-1z M13,9h2v1h-2z M17,9h3v1h-3z M0,10h2v1h-2z M4,11h3v1h-3z M10,12h2v1h-2z M15,11h1v3h-1z M18,12h1v1h-1z M20,11h2v1h-2z M24,11h3v1h-3z M12,14h2v1h-2z M16,14h2v1h-2z M21,14h1v1h-1z M25,14h2v2h-2z M0,16h1v1h-1z M3,16h2v1h-2z M8,16h1v3h-1z M11,16h1v1h-1z M14,17h1v1h-1z M18,16h3v1h-3z M22,17h2v1h-2z M27,16h2v1h-2z M0,19h3v1h-3z M5,18h1v2h-1z M10,19h1v1h-1z M13,19h2v2h-2z M17,19h1v1h-1z M20,19h2v1h-2z M25,19h1v1h-1z M1,21h2v1h-2z M5,21h1v1h-1z M9,21h1v1h-1z M11,21h2v1h-2z M23,21h1v1h-1z M27,21h1v2h-1z M10,24h1v1h-1z M12,23h2v1h-2z M16,24h1v2h-1z M18,23h2v2h-2z M21,24h1v1h-1z M24,24h2v1h-2z M27,24h1v2h-1z"/>
             </svg>
          </div>
          <span style="font-size:8px; color:#94a3b8; display:block; line-height:1.3; font-weight:500;">Escanee desde el móvil para acceder a la carpeta digital del equipo sin iniciar sesión.</span>
        </div>
      </aside>

      <!-- Right Panel: Tabbed Document View -->
      <main style="flex:1; padding:28px; display:flex; flex-direction:column; overflow:hidden;">
        
        <!-- Tabs headers -->
        <div style="display:flex; border-bottom:1px solid rgba(255,255,255,0.06); gap:24px; flex-shrink:0; margin-bottom:20px;">
          <button id="tab-fe-docs" onclick="switchFeTab('docs')" style="background:transparent; border:none; border-bottom:2px solid #10b981; color:#10b981; padding-bottom:12px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; cursor:pointer;">Centro 360 (Carpeta Digital)</button>
          <button id="tab-fe-insps" onclick="switchFeTab('insps')" style="background:transparent; border:none; border-bottom:2px solid transparent; color:#94a3b8; padding-bottom:12px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; cursor:pointer;">Historial Inspecciones</button>
          <button id="tab-fe-maint" onclick="switchFeTab('maint')" style="background:transparent; border:none; border-bottom:2px solid transparent; color:#94a3b8; padding-bottom:12px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; cursor:pointer;">Bitácora de OTs</button>
        </div>

        <!-- Tab Content View Container -->
        <div style="flex:1; overflow-y:auto; display:flex; flex-direction:column;">
          
          <!-- Tab 1: Centro 360 (Carpeta Digital) -->
          <div id="pane-fe-docs" style="display:flex; flex-direction:column; gap:20px;">
            <!-- Documentos Legales -->
            <div>
               <h3 style="font-size:10px; font-weight:800; color:#f5a623; text-transform:uppercase; letter-spacing:0.1em; margin:0 0 10px; display:flex; align-items:center; gap:6px;">
                 <svg style="width:12px; height:12px;"><use href="#i-file-check"/></svg> Documentación Obligatoria Legal (Mantenimiento Base)
               </h3>
               <div id="fe-legal-list" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                  <!-- dynamically populated -->
               </div>
            </div>
            
            <!-- Documentos Generales -->
            <div>
               <h3 style="font-size:10px; font-weight:800; color:#3b82f6; text-transform:uppercase; letter-spacing:0.1em; margin:10px 0 10px; display:flex; align-items:center; gap:6px;">
                 <svg style="width:12px; height:12px;"><use href="#i-file-check"/></svg> Certificaciones de Operatividad y Pluma (General)
               </h3>
               <div id="fe-general-list" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                  <!-- dynamically populated -->
               </div>
            </div>
          </div>

          <!-- Tab 2: Historial Inspecciones -->
          <div id="pane-fe-insps" style="display:none; flex-direction:column; gap:10px;">
             <!-- dynamically populated -->
          </div>

          <!-- Tab 3: Bitácora de OTs -->
          <div id="pane-fe-maint" style="display:none; flex-direction:column; gap:10px;">
             <!-- dynamically populated -->
          </div>

        </div>
      </main>
    </div>
  </div>
</div>

<!-- ═══════ MODAL: ASIGNACIÓN MÚLTIPLE RECURSOS ═══════ -->
<div class="modal-overlay" id="modal-asignacion">
  <div class="modal-content" style="width:600px; background:#0c1122; border:1px solid rgba(59,130,246,0.3); border-radius:16px;">
    <div class="modal-header" style="border-bottom:1px solid rgba(255,255,255,0.06); padding:16px 24px;">
      <div>
        <div style="font-size:15px;font-weight:900;color:#fff;display:flex;align-items:center;gap:8px;">
          <svg style="width:16px;height:16px;color:var(--blue-400);"><use href="#i-users"/></svg> Asignación de Recursos Múltiples
        </div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:3px;">Agrega tripulación completa y equipos a un servicio Kanban.</div>
      </div>
      <div class="modal-close" onclick="closeAsignacionModal()" style="cursor:pointer;"><svg style="width:14px;height:14px;"><use href="#i-x"/></svg></div>
    </div>
    <div class="modal-body" style="padding:20px; display:flex; flex-direction:column; gap:16px;">
        
        <div>
            <div style="font-size:10px; font-weight:800; color:var(--text-secondary); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.05em;">Servicio Seleccionado</div>
            <div id="modal-asignacion-service-display" class="mono" style="font-size:11px; font-weight:700; color:var(--amber-500); background:var(--bg-deep); border:1px solid var(--border-light); padding:8px 12px; border-radius:6px;">
                #SRV-2026-041 - CMPC Celulosa - Planta Laja · Turbina Vapor
            </div>
        </div>

        <div>
            <div style="font-size:10px; font-weight:800; color:var(--text-secondary); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.05em;">Asignar Flota Pesada (Múltiple)</div>
            <div style="background:var(--bg-deep); border:1px solid var(--border-light); border-radius:8px; padding:12px; display:flex; flex-direction:column; gap:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); padding:6px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.03);">
                    <div>
                        <div style="font-size:11px; font-weight:700; color:white;">Liebherr LTM 1220 (GZBC-58)</div>
                        <div style="font-size:9px; color:var(--text-dim);">Grúa Principal - 220T</div>
                    </div>
                    <span class="badge badge-green" style="font-size:8px;">Asignada</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); padding:6px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.03);">
                    <div>
                        <div style="font-size:11px; font-weight:700; color:white;">Cama Baja Randon (CB-44)</div>
                        <div style="font-size:9px; color:var(--text-dim);">Transporte Contrapesos y Accesorios</div>
                    </div>
                    <button class="btn btn-danger btn-sm" style="font-size:8px; padding:2px 6px;">Quitar</button>
                </div>
                <button class="btn btn-primary btn-sm" style="background:transparent; border:1px dashed rgba(59,130,246,0.5); color:var(--blue-400); width:100%; font-size:10px;">+ Vincular Otro Equipo a la Maniobra</button>
            </div>
        </div>

        <div>
            <div style="font-size:10px; font-weight:800; color:var(--text-secondary); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.05em;">Asignar Tripulación Humana (Múltiples Roles)</div>
            <div style="background:var(--bg-deep); border:1px solid var(--border-light); border-radius:8px; padding:12px; display:flex; flex-direction:column; gap:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); padding:6px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.03);">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="badge badge-amber" style="width:65px; text-align:center; font-size:8px; padding:2px 0;">Operador</span>
                        <div>
                            <div style="font-size:11px; font-weight:700; color:white;">Juan Pérez Alarcón</div>
                            <div style="font-size:9px; color:var(--green-400); font-weight:600;">Acreditación Vigente (CMPC)</div>
                        </div>
                    </div>
                    <span class="badge badge-green" style="font-size:8px;">Vigente</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); padding:6px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.03);">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="badge badge-blue" style="width:65px; text-align:center; font-size:8px; padding:2px 0;">Rigger Jefe</span>
                        <div>
                            <div style="font-size:11px; font-weight:700; color:white;">Roberto Soto Garrido</div>
                            <div style="font-size:9px; color:var(--green-400); font-weight:600;">Acreditación Vigente (CMPC)</div>
                        </div>
                    </div>
                    <button class="btn btn-danger btn-sm" style="font-size:8px; padding:2px 6px;">Quitar</button>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); padding:6px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.03);">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="badge badge-blue" style="width:65px; text-align:center; font-size:8px; padding:2px 0;">Rigger</span>
                        <div>
                            <div style="font-size:11px; font-weight:700; color:white;">Carlos Muñoz Sepúlveda</div>
                            <div style="font-size:9px; color:var(--red-400); font-weight:600;">⚠ Inducción Vencida</div>
                        </div>
                    </div>
                    <button class="btn btn-danger btn-sm" style="font-size:8px; padding:2px 6px;">Quitar</button>
                </div>
                <button class="btn btn-primary btn-sm" style="background:transparent; border:1px dashed rgba(59,130,246,0.5); color:var(--blue-400); width:100%; font-size:10px;">+ Agregar Personal Adicional (Operadores / Riggers)</button>
            </div>
        </div>

        <button class="btn btn-primary" onclick="saveAsignacion()" style="background:var(--green-500); width:100%; font-weight:700; font-size:11px; padding:10px; margin-top:6px; box-shadow:0 0 12px var(--green-glow);">Confirmar Asignaciones de Tripulación</button>

    </div>
  </div>
</div>

<!-- ═══════ MODAL: VISOR DE DOCUMENTOS PDF SIMULADO ═══════ -->
<div class="modal-overlay" id="modal-pdf">
  <div class="modal-content" style="width: 800px; max-height: 90vh; background: #e2e8f0; border-radius: 12px; display:flex; flex-direction:column; overflow:hidden; border:1px solid rgba(255,255,255,0.15);">
    
    <!-- PDF Viewer Top Toolbar -->
    <div style="background: #1e293b; padding: 12px 20px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #334155; flex-shrink:0;">
       <div style="display:flex; gap:16px; align-items:center;">
           <span style="color:#f1f5f9; font-size:12px; font-weight:700; font-family:\'Inter\', sans-serif;" id="pdf-title">Dossier_FES_SRV_041.pdf</span>
           <span style="background:rgba(255,255,255,0.1); padding:2px 8px; border-radius:4px; color:#cbd5e1; font-size:10px; font-weight:600;">1 / 2 páginas</span>
       </div>
       <div style="display:flex; gap:12px; align-items:center;">
           <button class="btn btn-primary btn-sm" style="background:#10b981; border:none; box-shadow:none; font-weight:700; font-size:10px; display:flex; align-items:center; gap:4px;" onclick="alert(\'Descargando archivo PDF firmado...\')">
             <svg style="width:12px;height:12px;fill:currentColor;"><use href="#i-download"/></svg> Descargar PDF
           </button>
           <button onclick="closePdfModal()" style="background:transparent; border:none; color:#94a3b8; cursor:pointer; display:flex; align-items:center;" onmouseover="this.style.color=\'white\'" onmouseout="this.style.color=\'#94a3b8\'">
             <svg style="width:18px;height:18px;"><use href="#i-x"/></svg>
           </button>
       </div>
    </div>

    <!-- PDF Document White Sheet Area -->
    <div style="flex:1; overflow-y:auto; padding:24px; display:flex; flex-direction:column; align-items:center;">
       
       <div id="pdf-document-sheet" style="background:white; width: 100%; max-width: 680px; padding:45px 50px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); border-radius:4px; font-family: \'Inter\', sans-serif; color:#1e293b; min-height:850px; display:flex; flex-direction:column; justify-content:space-between; position:relative;">
          
          <!-- Watermark -->
          <div style="position:absolute; top:40%; left:25%; transform:rotate(-35deg); font-size:60px; font-weight:900; color:rgba(16,185,129,0.06); letter-spacing:0.1em; pointer-events:none; text-transform:uppercase;">GSP VALIDADO</div>

          <div>
            <!-- Header -->
            <div style="display:flex; justify-content:space-between; border-bottom: 2px solid #e2e8f0; padding-bottom:18px; margin-bottom:24px;">
               <div>
                  <div style="font-size:20px; font-weight:900; color:#e69500; letter-spacing:0.05em;">GRÚAS SAN PABLO</div>
                  <div style="font-size:9px; color:#64748b; margin-top:2px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em;">Izajes Pesados y Transporte Especializado</div>
               </div>
               <div style="text-align:right;">
                  <div id="pdf-doc-type" style="font-size:13px; font-weight:800; color:#0f172a; text-transform:uppercase;">Dossier Estado de Pago</div>
                  <div id="pdf-doc-folio" style="font-size:11px; color:#475569; font-family:monospace; margin-top:4px; font-weight:700;">Folio: #EDP-2026-401</div>
                  <div id="pdf-doc-date" style="font-size:9px; color:#64748b; margin-top:2px;">Fecha Emisión: 21 Junio 2026</div>
               </div>
            </div>

            <!-- PDF Contents Dynamically populated -->
            <div id="pdf-content-body">
               <!-- populates depending on clicked document -->
            </div>
          </div>

          <!-- Bottom Signature Box -->
          <div style="border-top:1px solid #cbd5e1; padding-top:18px; margin-top:30px; display:flex; justify-content:space-between; align-items:center;">
             <div style="max-width:65%;">
                <div style="font-size:10px; font-weight:800; color:#10b981; margin-bottom:4px; display:flex; align-items:center; gap:4px;">
                   <svg style="width:14px;height:14px;fill:currentColor;"><use href="#i-check-circle"/></svg> FIRMA ELECTRÓNICA SIMPLE (FES) VERIFICADA
                </div>
                <div style="font-size:8px; color:#64748b; line-height:1.4;">Documento amparado por Ley 19.799 de firma digital. La verificación de la validez y su trazabilidad de horómetros son registradas mediante hash criptográfico único.</div>
             </div>
             <div style="text-align:center;">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/4b/Firma_digital_simulada.png" style="height:32px; opacity:0.75; mix-blend-mode:multiply; filter:grayscale(100%);" alt="Firma"/>
                <div id="pdf-signer-name" style="font-size:9px; font-weight:800; color:#1e293b; margin-top:4px;">Carlos Muñoz Sepúlveda</div>
                <div id="pdf-signer-role" style="font-size:7px; color:#64748b; font-weight:600; text-transform:uppercase;">Supervisor Mandante</div>
                <div id="pdf-doc-hash" style="font-size:8px; color:#94a3b8; font-family:monospace; margin-top:2px;">HASH: 7F8B9C2A1E4D</div>
             </div>
          </div>

       </div>
    </div>
  </div>
</div>
`;

    html = html.replace(modalExpedienteToken, modalsHtml + '\n' + modalExpedienteToken);
    const jsLogic = fs.readFileSync('maqueta_control.js', 'utf8');
    console.log('Successfully injected FichaEquipo, Asignacion, and PDF Modals.');


    const mobileChecklistToken = '// ── Mobile Checklist ──';
    html = html.replace(mobileChecklistToken, () => jsLogic + '\n' + mobileChecklistToken);
    console.log('Successfully injected Javascript controllers for Highcharts, dynamic Ficha 360, resource assignment, and PDF viewer.');

    // Save final output
    console.log('Writing output to maqueta_gsp_final.html...');
    fs.writeFileSync('maqueta_gsp_final.html', html);
    console.log('Build final completed successfully.');
}

build();
