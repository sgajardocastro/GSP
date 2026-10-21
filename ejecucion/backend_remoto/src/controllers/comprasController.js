const fs = require('fs');
const path = require('path');
const comprasModel = require('../models/comprasModel');
const MessageModel = require('../models/messageModel');

const messageModel = new MessageModel();

function formatCLP(val) {
  const num = Math.round(Number(val || 0));
  return '$' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatDateCL(dateVal) {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function cargarLogoBase64(logoFileName) {
  if (!logoFileName) return '';
  const candidates = [
    path.join(process.cwd(), 'public', logoFileName),
    path.join('/home/nodeadmin/proyectos/lean-services-gsp/public', logoFileName)
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const buf = fs.readFileSync(p);
        return `data:image/png;base64,${buf.toString('base64')}`;
      }
    } catch (_) {}
  }
  return '';
}

const comprasController = {
  async getResumen(req, res) {
    try {
      const data = await comprasModel.getResumen(req.query || {});
      return res.status(200).json({
        success: true,
        ...data
      });
    } catch (err) {
      console.error('[ComprasController.getResumen] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener resumen de compras y OCs',
        error: err.message
      });
    }
  },

  async getSolicitudes(req, res) {
    try {
      const solicitudes = await comprasModel.getSolicitudes(req.query || {});
      return res.status(200).json({
        success: true,
        solicitudes
      });
    } catch (err) {
      console.error('[ComprasController.getSolicitudes] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error al listar solicitudes de pedido',
        error: err.message
      });
    }
  },

  async crearSolicitud(req, res) {
    try {
      const { titulo_necesidad } = req.body || {};
      if (!titulo_necesidad || !String(titulo_necesidad).trim()) {
        return res.status(400).json({
          success: false,
          message: 'El título o descripción de la necesidad es obligatorio'
        });
      }
      const solicitud = await comprasModel.crearSolicitud(req.body, req.user || {});
      return res.status(201).json({
        success: true,
        message: `Solicitud de Pedido ${solicitud.folio_solicitud} creada exitosamente`,
        solicitud
      });
    } catch (err) {
      console.error('[ComprasController.crearSolicitud] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error al crear solicitud de pedido',
        error: err.message
      });
    }
  },

  async getOrdenes(req, res) {
    try {
      const ordenes = await comprasModel.getOrdenes(req.query || {});
      return res.status(200).json({
        success: true,
        ordenes
      });
    } catch (err) {
      console.error('[ComprasController.getOrdenes] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error al listar órdenes de compra',
        error: err.message
      });
    }
  },

  async getOrdenById(req, res) {
    try {
      const { id_oc } = req.params;
      const orden = await comprasModel.getOrdenById(id_oc);
      if (!orden) {
        return res.status(404).json({
          success: false,
          message: 'Orden de Compra no encontrada'
        });
      }
      return res.status(200).json({
        success: true,
        orden
      });
    } catch (err) {
      console.error('[ComprasController.getOrdenById] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error al consultar orden de compra',
        error: err.message
      });
    }
  },

  async crearOrden(req, res) {
    try {
      const { razon_social_proveedor, rut_proveedor } = req.body || {};
      if (!razon_social_proveedor || !rut_proveedor) {
        return res.status(400).json({
          success: false,
          message: 'RUT y Razón Social del proveedor son obligatorios para emitir la Orden de Compra'
        });
      }
      const orden = await comprasModel.crearOrden(req.body, req.user || {});
      return res.status(201).json({
        success: true,
        message: `Orden de Compra ${orden.folio_oc} emitida exitosamente`,
        orden
      });
    } catch (err) {
      console.error('[ComprasController.crearOrden] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error al emitir Orden de Compra',
        error: err.message
      });
    }
  },

  async enviarVbOmar(req, res) {
    try {
      const { id_oc } = req.params;
      const resultado = await comprasModel.enviarVbOmar(id_oc, req.user || {});
      const { orden, token, url_aprobacion_movil, url_absoluta_aprobacion } = resultado;

      // Despacho de correo B2B con Magic Link si se provee email o al correo de gerencia configurado
      const destinatarioEmail = (req.body && req.body.email_gerencia) || process.env.OMAR_APPROVAL_EMAIL || null;
      let emailEnviado = false;

      if (destinatarioEmail && messageModel.transporter) {
        try {
          const empInfo = orden.empresa_info || {};
          const empNombre = empInfo.nombre_corto || 'Grúas San Pablo';
          const htmlEmail = messageModel.obtenerPlantillaHTML({
            titulo: `Visación Orden de Compra ${orden.folio_oc}`,
            subtitulo: `Eduardo ha emitido una Orden de Compra por ${empNombre} que requiere su autorización móvil de 1 toque.`,
            contenido: `
              <p><strong>Folio OC:</strong> ${orden.folio_oc}</p>
              <p><strong>Razón Social Emisora:</strong> ${empInfo.razon_social || empNombre}</p>
              <p><strong>Proveedor:</strong> ${orden.razon_social_proveedor} (${orden.rut_proveedor})</p>
              <p><strong>Condición de Pago:</strong> ${orden.condicion_pago}</p>
              <p><strong>Imputación / Rubro:</strong> ${orden.codi_proyecto || (orden.numero_ot_mantenimiento ? 'OT Mant. ' + orden.numero_ot_mantenimiento : 'General')} · ${orden.rubro_its || 'GASTO_EXTRA'}</p>
              <p><strong>Monto Neto:</strong> ${formatCLP(orden.monto_neto)} + IVA = <strong>${formatCLP(orden.monto_total)}</strong></p>
            `,
            botonTexto: 'Abrir Aprobador Móvil (1 Toque)',
            botonUrl: url_absoluta_aprobacion
          });

          await messageModel.transporter.sendMail({
            from: '"GSP Platform" <notificaciones.gsp@leanglobal.cl>',
            to: destinatarioEmail,
            subject: `[V°B° Gerencia] Orden de Compra ${orden.folio_oc} - ${orden.razon_social_proveedor} (${formatCLP(orden.monto_total)})`,
            html: htmlEmail
          });
          emailEnviado = true;
        } catch (mailErr) {
          console.warn('[ComprasController.enviarVbOmar] Advertencia envío correo:', mailErr.message);
        }
      }

      return res.status(200).json({
        success: true,
        message: `Orden de Compra ${orden.folio_oc} enviada a firma móvil de Gerencia (Omar)`,
        orden,
        token_uuid: token.token_uuid,
        url_aprobacion_movil,
        url_absoluta_aprobacion,
        email_enviado: emailEnviado
      });
    } catch (err) {
      console.error('[ComprasController.enviarVbOmar] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error al enviar Orden de Compra a visación de Gerencia',
        error: err.message
      });
    }
  },

  async sincronizarItsLaudus(req, res) {
    try {
      const { id_oc } = req.params;
      const resultado = await comprasModel.sincronizarItsLaudus(id_oc, req.body || {}, req.user || {});
      return res.status(200).json({
        success: true,
        message: `Orden de Compra ${resultado.orden.folio_oc} sincronizada con Laudus ERP e ITS`,
        ...resultado
      });
    } catch (err) {
      console.error('[ComprasController.sincronizarItsLaudus] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error al sincronizar OC con ITS / Laudus',
        error: err.message
      });
    }
  },

  async getHtmlPrint(req, res) {
    try {
      const { id_oc } = req.params;
      const oc = await comprasModel.getOrdenById(id_oc);
      if (!oc) {
        return res.status(404).send('<h3>Orden de Compra no encontrada</h3>');
      }

      const emp = oc.empresa_info || comprasModel.EMPRESAS_GRUPO[9];
      const logoDataUri = cargarLogoBase64(emp.logo);

      const estaAutorizada = ['AUTORIZADA', 'AUTORIZADA_CON_OBS', 'ENVIADA_PROVEEDOR', 'RECEPCIONADA_BODEGA', 'FACTURADA_LAUDUS'].includes(oc.estado_oc);
      const estaRechazada = oc.estado_oc === 'RECHAZADA';
      const estaPendiente = oc.estado_oc === 'PENDIENTE_VB_OMAR';

      const colorCorporativo = Number(oc.id_empresa) === 11
        ? '#059669'
        : (Number(oc.id_empresa) === 7 ? '#1d4ed8' : (Number(oc.id_empresa) === 8 ? '#dc2626' : '#d97706'));

      const filasHtml = (oc.lineas || []).map((l, idx) => `
        <tr>
          <td style="text-align:center; font-weight:700;">${l.numero_item || idx + 1}</td>
          <td style="font-family:monospace;">${l.sku_codigo || '-'}</td>
          <td>${l.descripcion || '-'}</td>
          <td style="text-align:center;">${l.unidad_medida || 'UN'}</td>
          <td style="text-align:right;">${Number(l.cantidad || 1).toLocaleString('es-CL')}</td>
          <td style="text-align:right;">${formatCLP(l.precio_unitario)}</td>
          <td style="text-align:right;">${Number(l.descuento_pct || 0)}%</td>
          <td style="text-align:right; font-weight:700;">${formatCLP(l.subtotal_neto)}</td>
        </tr>
      `).join('');

      const bloqueTimbreFes = estaAutorizada
        ? `
          <div class="fes-stamp fes-approved">
            <div class="fes-badge">TIMBRE DIGITAL FES · GERENCIA GENERAL AUTORIZADA</div>
            <div class="fes-signer">LUIS OMAR GHISELLINI JARA</div>
            <div class="fes-role">Gerente General · ${emp.nombre_corto} (RUT ${emp.rut})</div>
            <div class="fes-meta">
              Estado: <strong>${oc.estado_oc === 'AUTORIZADA_CON_OBS' ? 'AUTORIZADA CON OBSERVACIÓN' : 'AUTORIZADA SIN OBSERVACIONES'}</strong><br/>
              Fecha Autorización Móvil: <strong>${formatDateCL(oc.fecha_autorizacion_gerencia || oc.fecha_resolucion_token || oc.updated_at)}</strong><br/>
              Token / Sello Criptográfico: <code>${oc.firma_hash_fes || oc.token_uuid || 'FES-OMAR-VERIFIED'}</code>
            </div>
            ${oc.observacion_gerencia || oc.observacion_omar ? `<div class="fes-obs"><strong>Instrucción Gerencia:</strong> ${oc.observacion_gerencia || oc.observacion_omar}</div>` : ''}
          </div>
        `
        : estaRechazada
          ? `
            <div class="fes-stamp fes-rejected">
              <div class="fes-badge" style="background:#dc2626;">ORDEN DE COMPRA RECHAZADA POR GERENCIA</div>
              <div class="fes-signer">LUIS OMAR GHISELLINI JARA</div>
              <div class="fes-meta">Fecha Resolución: ${formatDateCL(oc.fecha_autorizacion_gerencia || oc.updated_at)}</div>
              ${oc.observacion_gerencia || oc.observacion_omar ? `<div class="fes-obs"><strong>Motivo Rechazo:</strong> ${oc.observacion_gerencia || oc.observacion_omar}</div>` : ''}
            </div>
          `
          : estaPendiente
            ? `
              <div class="fes-stamp fes-pending">
                <div class="fes-badge" style="background:#d97706;">PENDIENTE DE VISACIÓN MÓVIL DE GERENCIA (OMAR)</div>
                <div class="fes-signer">En espera de firma digital de Luis Omar Ghisellini Jara</div>
                <div class="fes-meta">Token activo: <code>${oc.token_uuid || 'PENDIENTE'}</code> · No válida para facturación hasta su autorización.</div>
              </div>
            `
            : `
              <div class="fes-stamp fes-pending">
                <div class="fes-badge" style="background:#475569;">DOCUMENTO EN BORRADOR PRELIMINAR</div>
                <div class="fes-signer">Pendiente de envío a firma móvil de Gerencia</div>
              </div>
            `;

      const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Orden de Compra ${oc.folio_oc} - ${emp.nombre_corto}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #f1f5f9;
      margin: 0;
      padding: 24px;
      font-size: 12px;
    }
    .page-a4 {
      max-width: 210mm;
      margin: 0 auto;
      background: #ffffff;
      padding: 28px 32px;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.12);
      border-top: 6px solid ${colorCorporativo};
    }
    .top-bar-actions {
      max-width: 210mm;
      margin: 0 auto 14px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      color: #fff;
      padding: 10px 18px;
      border-radius: 8px;
    }
    .btn-print {
      background: ${colorCorporativo};
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
      font-size: 12px;
    }
    .header-grid {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 18px;
      margin-bottom: 18px;
    }
    .emisor-info h1 {
      font-size: 15px;
      margin: 6px 0 3px 0;
      color: #0f172a;
      text-transform: uppercase;
    }
    .emisor-info p {
      margin: 2px 0;
      color: #475569;
      font-size: 11px;
    }
    .rut-box {
      border: 2.5px solid ${colorCorporativo};
      padding: 12px 18px;
      text-align: center;
      min-width: 225px;
      border-radius: 6px;
    }
    .rut-box .rut-line {
      font-weight: 800;
      font-size: 13px;
      color: ${colorCorporativo};
    }
    .rut-box .doc-type {
      font-weight: 900;
      font-size: 14px;
      margin: 6px 0;
      color: #0f172a;
      letter-spacing: 0.5px;
    }
    .rut-box .folio-line {
      font-weight: 900;
      font-size: 16px;
      color: ${colorCorporativo};
      font-family: monospace;
    }
    .section-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 18px;
    }
    .info-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 14px;
      background: #f8fafc;
    }
    .info-card h3 {
      margin: 0 0 8px 0;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: ${colorCorporativo};
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
      font-size: 11px;
    }
    .info-row span.lbl {
      color: #64748b;
      font-weight: 600;
    }
    .info-row span.val {
      color: #0f172a;
      font-weight: 700;
      text-align: right;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
    }
    table.items-table th {
      background: #0f172a;
      color: #ffffff;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
      padding: 8px 10px;
      text-align: left;
    }
    table.items-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11px;
    }
    .bottom-grid {
      display: grid;
      grid-template-columns: 1.3fr 0.7fr;
      gap: 18px;
      align-items: start;
    }
    .totals-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 7px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
    }
    .totals-row.grand-total {
      background: #0f172a;
      color: #ffffff;
      font-weight: 900;
      font-size: 14px;
      border-bottom: none;
    }
    .fes-stamp {
      margin-top: 14px;
      padding: 12px 16px;
      border-radius: 8px;
      border: 2px dashed #10b981;
      background: #ecfdf5;
    }
    .fes-stamp.fes-rejected {
      border-color: #dc2626;
      background: #fef2f2;
    }
    .fes-stamp.fes-pending {
      border-color: #d97706;
      background: #fffbeb;
    }
    .fes-badge {
      display: inline-block;
      background: #059669;
      color: #fff;
      font-size: 10px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .fes-signer {
      font-size: 13px;
      font-weight: 900;
      color: #0f172a;
    }
    .fes-role {
      font-size: 11px;
      color: #334155;
      margin-bottom: 4px;
    }
    .fes-meta {
      font-size: 10px;
      color: #475569;
      line-height: 1.45;
    }
    .fes-obs {
      margin-top: 6px;
      padding: 6px 8px;
      background: rgba(255,255,255,0.8);
      border-left: 3px solid #f59e0b;
      font-size: 11px;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .page-a4 { box-shadow: none; padding: 0; max-width: 100%; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="top-bar-actions no-print">
    <div>
      <strong>Vista Oficial A4 · Orden de Compra ${oc.folio_oc}</strong>
      <span style="margin-left:10px; opacity:0.8;">(${emp.nombre_corto})</span>
    </div>
    <button class="btn-print" onclick="window.print()">Imprimir / Guardar PDF</button>
  </div>

  <div class="page-a4">
    <div class="header-grid">
      <div class="emisor-info">
        ${logoDataUri ? `<img src="${logoDataUri}" alt="${emp.nombre_corto}" style="max-height:58px; max-width:210px; object-fit:contain;" />` : `<div style="font-size:20px; font-weight:900; color:${colorCorporativo};">${emp.nombre_corto}</div>`}
        <h1>${emp.razon_social}</h1>
        <p><strong>Giro:</strong> ${emp.giro}</p>
        <p><strong>Dirección:</strong> ${emp.direccion} · <strong>Fono:</strong> ${emp.telefono}</p>
        <p><strong>Emitida por:</strong> ${oc.nombre_emite || 'Eduardo (Adquisiciones)'} · <strong>Fecha Emisión:</strong> ${formatDateCL(oc.created_at)}</p>
      </div>
      <div class="rut-box">
        <div class="rut-line">R.U.T.: ${emp.rut}</div>
        <div class="doc-type">ORDEN DE COMPRA</div>
        <div class="folio-line">N° ${oc.folio_oc}</div>
      </div>
    </div>

    <div class="section-grid">
      <div class="info-card">
        <h3>1. Datos del Proveedor</h3>
        <div class="info-row"><span class="lbl">Razón Social:</span><span class="val">${oc.razon_social_proveedor}</span></div>
        <div class="info-row"><span class="lbl">RUT Proveedor:</span><span class="val">${oc.rut_proveedor}</span></div>
        <div class="info-row"><span class="lbl">Contacto:</span><span class="val">${oc.contacto_proveedor || '-'}</span></div>
        <div class="info-row"><span class="lbl">Email / Teléfono:</span><span class="val">${[oc.email_proveedor, oc.telefono_proveedor].filter(Boolean).join(' · ') || '-'}</span></div>
        <div class="info-row"><span class="lbl">Condición de Pago:</span><span class="val">${oc.condicion_pago} (${oc.moneda || 'CLP'})</span></div>
      </div>

      <div class="info-card">
        <h3>2. Imputación Operativa / Contable</h3>
        <div class="info-row"><span class="lbl">Ticket Solicitud Origen:</span><span class="val">${oc.folio_solicitud || 'Emisión Directa'}</span></div>
        <div class="info-row"><span class="lbl">OT / Proyecto Vinculado:</span><span class="val">${oc.codi_proyecto ? `${oc.codi_proyecto} - ${oc.nombre_proyecto || ''}` : (oc.numero_ot_mantenimiento ? `OT Mant. ${oc.numero_ot_mantenimiento}` : 'Stock General / Administración')}</span></div>
        <div class="info-row"><span class="lbl">Rubro Costo ITS:</span><span class="val">${oc.rubro_its || 'GASTO_EXTRA'}</span></div>
        <div class="info-row"><span class="lbl">Folio OC Laudus ERP:</span><span class="val">${oc.folio_laudus_oc || 'Pendiente Sincronización'}</span></div>
        <div class="info-row"><span class="lbl">Factura Compra DTE:</span><span class="val">${oc.folio_dte_factura_compra || 'Pendiente Recepción DTE'}</span></div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width:45px; text-align:center;">Ítem</th>
          <th style="width:95px;">SKU / Código</th>
          <th>Descripción del Servicio / Repuesto / Insumo</th>
          <th style="width:60px; text-align:center;">Unidad</th>
          <th style="width:75px; text-align:right;">Cantidad</th>
          <th style="width:105px; text-align:right;">P. Unitario</th>
          <th style="width:65px; text-align:right;">Desc.</th>
          <th style="width:115px; text-align:right;">Subtotal Neto</th>
        </tr>
      </thead>
      <tbody>
        ${filasHtml}
      </tbody>
    </table>

    <div class="bottom-grid">
      <div>
        <div class="info-card">
          <h3>Glosa General e Instrucciones de Facturación</h3>
          <p style="margin:0 0 6px 0; font-size:11px; color:#1e293b;">
            ${oc.glosa_general || 'Sin observaciones adicionales.'}
          </p>
          <p style="margin:0; font-size:10px; color:#64748b;">
            IMPORTANTE: Indicar obligatoriamente el N° de Orden de Compra <strong>${oc.folio_oc}</strong> en la Referencia (Código 801) de la Factura Electrónica DTE emitida a <strong>${emp.razon_social} (RUT ${emp.rut})</strong>.
          </p>
        </div>
        ${bloqueTimbreFes}
      </div>

      <div class="totals-box">
        <div class="totals-row">
          <span>Monto Neto:</span>
          <strong>${formatCLP(oc.monto_neto)}</strong>
        </div>
        <div class="totals-row">
          <span>Monto Exento:</span>
          <strong>${formatCLP(oc.monto_exento)}</strong>
        </div>
        <div class="totals-row">
          <span>I.V.A. (19%):</span>
          <strong>${formatCLP(oc.monto_iva)}</strong>
        </div>
        <div class="totals-row grand-total">
          <span>TOTAL (${oc.moneda || 'CLP'}):</span>
          <span>${formatCLP(oc.monto_total)}</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

      if (req.query.format === 'json') {
        return res.status(200).json({
          success: true,
          html,
          orden: oc
        });
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    } catch (err) {
      console.error('[ComprasController.getHtmlPrint] Error:', err);
      return res.status(500).send(`<h3>Error generando impresión de Orden de Compra: ${err.message}</h3>`);
    }
  }
};

module.exports = comprasController;
