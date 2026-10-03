const estadoPagoModel = require('../models/estadoPagoModel');
const edpPdfService = require('../services/edpPdfService');
const db = require('../config/postgresPool');
const notificacionService = require('../services/notificacionService');

exports.registrarPingDesplazamiento = async (req, res) => {
  try {
    const data = await estadoPagoModel.registrarPingDesplazamiento(req.body);
    res.status(201).json({ message: "Ping de desplazamiento registrado", data });
  } catch (error) {
    console.error("[DESPLAZAMIENTO] Error al registrar ping:", error);
    res.status(500).json({ message: "Error al registrar ping de desplazamiento", error: error.message });
  }
};

exports.crearReporteDiario = async (req, res) => {
  try {
    const data = await estadoPagoModel.crearReporteDiario(req.body);
    res.status(201).json({ message: "Reporte diario registrado exitosamente", data });
  } catch (error) {
    console.error("[REPORTE_DIARIO] Error al crear reporte diario:", error);
    res.status(500).json({ message: "Error al crear reporte diario", error: error.message });
  }
};

exports.getReportesDiariosPorProyecto = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await estadoPagoModel.getReportesDiariosPorProyecto(id);
    res.status(200).json(data);
  } catch (error) {
    console.error("[REPORTE_DIARIO] Error obteniendo reportes:", error);
    res.status(500).json({ message: "Error al obtener reportes diarios", error: error.message });
  }
};

exports.crearEstadoPago = async (req, res) => {
  try {
    const data = await estadoPagoModel.crearEstadoPago(req.body);
    res.status(201).json({ success: true, message: "Estado de Pago generado exitosamente", data });
  } catch (error) {
    console.error("[EDP] Error al crear estado de pago:", error);
    res.status(500).json({ success: false, message: "Error al generar estado de pago", error: error.message });
  }
};

exports.getEstadosPagoPorProyecto = async (req, res) => {
  try {
    const { id_proyecto } = req.params;
    const idProy = id_proyecto || req.params.id;

    // 1. Obtener EDPs ya emitidos
    const edps = await estadoPagoModel.getEstadosPagoPorProyecto(idProy);

    // 2. Obtener reportes validados no asociados a ningún EDP aún (disponibles para liquidar)
    const repSql = `
      SELECT r.*, 
             COALESCE(r.hora_inicio, to_char(r.fecha_inicio_servicio AT TIME ZONE 'America/Santiago', 'HH24:MI'), '08:00') AS hora_inicio,
             COALESCE(r.hora_termino, to_char(r.fecha_termino_servicio AT TIME ZONE 'America/Santiago', 'HH24:MI'), '18:00') AS hora_termino,
             COALESCE(r.hora_inicio_colacion, '13:00') AS hora_inicio_colacion,
             COALESCE(r.hora_termino_colacion, '14:00') AS hora_termino_colacion,
             e.patente, e.modelo, e.marca,
             COALESCE(u_op.name_frst || ' ' || u_op.apellido_pat, 'Operador') AS operador_nombre,
             COALESCE(u_rig.name_frst || ' ' || u_rig.apellido_pat, 'Rigger') AS rigger_nombre
      FROM tedp_reporte_avance r
      LEFT JOIN tequ_equipo e ON r.id_equipo = e.id_equipo
      LEFT JOIN tsec_users u_op ON r.id_user_operador = u_op.id_user
      LEFT JOIN tsec_users u_rig ON r.id_user_rigger = u_rig.id_user
      WHERE r.id_proyecto = $1
      ORDER BY r.fecha_reporte ASC, r.dia_correlativo ASC;
    `;
    const repRes = await db.query(repSql, [idProy]);
    const todosReportes = repRes.rows;

    const reportesDisponibles = todosReportes.filter(r => !r.id_edp);
    const reportesLiquidados = todosReportes.filter(r => !!r.id_edp);

    res.status(200).json({
      success: true,
      data: {
        estados_pago: edps,
        reportes_disponibles: reportesDisponibles,
        reportes_liquidados: reportesLiquidados,
        total_reportes: todosReportes.length
      }
    });
  } catch (error) {
    console.error("[EDP] Error obteniendo estados de pago:", error);
    res.status(500).json({ success: false, message: "Error al obtener estados de pago", error: error.message });
  }
};

// Generación y descarga del PDF Oficial del EDP (Soporta ID de EDP o ID de Proyecto)
exports.generarPdfEdp = async (req, res) => {
  try {
    const paramId = req.params.id_edp || req.params.id_proyecto || req.params.id;

    let edp = null;
    let idProyecto = null;
    let reports = [];
    let detalles_adicionales = [];

    // 1. Intentar buscar por ID de EDP en la tabla tedp_estado_pago
    const edpRes = await db.query(`
      SELECT e.*, p.codi_proyecto, p.json_field AS proy_json
      FROM tedp_estado_pago e
      JOIN tpry_proyecto p ON e.id_proyecto = p.id_proyecto
      WHERE e.id_edp = $1;
    `, [paramId]);

    if (edpRes.rows.length > 0) {
      edp = edpRes.rows[0];
      idProyecto = edp.id_proyecto;

      // Obtener detalles adicionales si existen
      const detRes = await db.query(`
        SELECT * FROM tedp_estado_pago_detalle
        WHERE id_edp = $1
        ORDER BY id_edp_detalle ASC;
      `, [edp.id_edp]);
      detalles_adicionales = detRes.rows;
    } else {
      // 2. Si no es un id_edp existente, tratar paramId como id_proyecto
      idProyecto = paramId;
    }

    // 3. Obtener datos completos del Proyecto y Cliente
    const proyRes = await db.query(`
      SELECT p.*, 
             COALESCE(c.razon_social, c.name_empresa) AS cliente_nombre,
             c.rut_empresa AS cliente_rut
      FROM tpry_proyecto p
      LEFT JOIN tpar_empresas c ON p.id_empresa_cliente = c.id_empresa
      WHERE p.id_proyecto = $1;
    `, [idProyecto]);

    if (proyRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Proyecto no encontrado para generar EDP" });
    }
    const proyecto = proyRes.rows[0];

    // 4. Obtener Reports Diarios del proyecto
    const repRes = await db.query(`
      SELECT r.*,
             COALESCE(r.hora_inicio, to_char(r.fecha_inicio_servicio AT TIME ZONE 'America/Santiago', 'HH24:MI'), '08:00') AS hora_inicio,
             COALESCE(r.hora_termino, to_char(r.fecha_termino_servicio AT TIME ZONE 'America/Santiago', 'HH24:MI'), '18:00') AS hora_termino,
             COALESCE(r.hora_inicio_colacion, '13:00') AS hora_inicio_colacion,
             COALESCE(r.hora_termino_colacion, '14:00') AS hora_termino_colacion,
             e.patente, e.modelo, e.marca,
             COALESCE(u_op.name_frst || ' ' || u_op.apellido_pat, 'Operador') AS operador_nombre,
             COALESCE(u_rig.name_frst || ' ' || u_rig.apellido_pat, 'Rigger') AS rigger_nombre
      FROM tedp_reporte_avance r
      LEFT JOIN tequ_equipo e ON r.id_equipo = e.id_equipo
      LEFT JOIN tsec_users u_op ON r.id_user_operador = u_op.id_user
      LEFT JOIN tsec_users u_rig ON r.id_user_rigger = u_rig.id_user
      WHERE (r.id_edp = $1 AND $1 IS NOT NULL) OR (r.id_proyecto = $2)
      ORDER BY r.fecha_reporte ASC, r.dia_correlativo ASC;
    `, [edp?.id_edp || null, idProyecto]);
    reports = repRes.rows;

    // 5. Si no había un registro en tedp_estado_pago, calcular montos en vivo de la cotización y reports
    if (!edp) {
      const snapLines = proyecto.json_field?.snapshot_comercial?.lines || proyecto.json_field?.lines || [];
      
      let totalNeto = 0;
      let totalHorasFact = 0;
      let totalST = 0;

      reports.forEach(r => {
        totalHorasFact += Number(r.horas_facturables || 0);
        totalST += Number(r.horas_sobretiempo || 0);
      });

      // Sumar líneas cotizadas
      snapLines.forEach(l => {
        const valUnit = Number(l.valorUnitario || l.precio_unitario || 0);
        const cant = Number(l.cantidad || 1);
        const sub = Number(l.subtotal_calculado || l.subtotal || (valUnit * cant));
        totalNeto += sub;
      });

      // Si no hay líneas cotizadas, usar valor estimado de los reports
      if (totalNeto === 0 && reports.length > 0) {
        totalNeto = totalHorasFact * 90000; // Tarifa base referencial
      }

      // Si hay sobretiempo, calcular adicional si no estaba en líneas
      const tarifaSobretiempo = 90000;
      const montoSobretiempo = totalST * tarifaSobretiempo;
      if (montoSobretiempo > 0 && !snapLines.some(l => (l.tipo || '').toLowerCase().includes('sobretiempo'))) {
        totalNeto += montoSobretiempo;
      }

      const totalIva = Math.round(totalNeto * 0.19);
      const totalBruto = totalNeto + totalIva;

      const fInicio = reports[0]?.fecha_reporte || proyecto.json_field?.datos_generales?.fecha_inicio || new Date().toISOString().split('T')[0];
      const fFin = reports[reports.length - 1]?.fecha_reporte || proyecto.json_field?.datos_generales?.fecha_termino || new Date().toISOString().split('T')[0];

      edp = {
        id_edp: 1,
        numero_edp: 'EDP-01',
        fecha_emision: new Date(),
        fecha_corte_inicio: fInicio,
        fecha_corte_fin: fFin,
        monto_neto: totalNeto,
        monto_iva: totalIva,
        monto_total: totalBruto,
        estado_edp: 'BORRADOR'
      };

      // Mapear líneas adicionales para el PDF
      detalles_adicionales = snapLines.map(l => ({
        concepto: l.descripcion || l.subcategoria || l.tipo || 'Servicio de Izaje',
        unidad_cobro: l.unidad || 'GL',
        cantidad: Number(l.cantidad || 1),
        precio_unitario: Number(l.valorUnitario || l.precio_unitario || 0),
        monto_subtotal: Number(l.subtotal_calculado || l.subtotal || 0)
      }));
    }

    // 6. Compilar datos para el PDF
    const edpData = {
      edp,
      proyecto: {
        id_proyecto: proyecto.id_proyecto,
        codi_proyecto: proyecto.codi_proyecto,
        cliente_nombre: proyecto.cliente_nombre || proyecto.json_field?.datos_generales?.cliente_nombre || 'Cliente Mandante',
        cliente_rut: proyecto.cliente_rut || proyecto.json_field?.datos_generales?.cliente_rut || 'N/A',
        obra_nombre: proyecto.nombre || proyecto.json_field?.datos_generales?.obra_nombre || 'Faena Principal',
        obra_direccion: proyecto.json_field?.datos_generales?.obra_direccion || 'En Faena',
        obra_comuna: proyecto.json_field?.datos_generales?.obra_comuna || '',
        contacto_nombre: proyecto.json_field?.datos_generales?.contacto_nombre || 'Administración de Obra'
      },
      reports,
      detalles_adicionales
    };

    // 7. Generar buffer PDF con Puppeteer
    const pdfBuffer = await edpPdfService.generarPdfEdpBuffer(edpData);

    // 8. Transmitir archivo PDF
    const filename = `EDP_${edp.numero_edp || '01'}_${proyecto.codi_proyecto || 'GSP'}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);

  } catch (error) {
    console.error("[EDP_PDF] Error generando PDF de estado de pago:", error);
    res.status(500).json({ success: false, message: "Error al generar PDF del Estado de Pago", error: error.message });
  }
};

// Actualizar estado del EDP (Aprobado HES, Facturado, etc.)
exports.actualizarEstadoEdp = async (req, res) => {
  try {
    const { id_edp } = req.params;
    const { estado_edp, hes_oc_numero, factura_numero, fecha_facturacion, observaciones } = req.body;

    const sql = `
      UPDATE tedp_estado_pago
      SET estado_edp = COALESCE($1, estado_edp),
          hes_oc_numero = COALESCE($2, hes_oc_numero),
          factura_numero = COALESCE($3, factura_numero),
          fecha_facturacion = COALESCE($4, fecha_facturacion),
          observaciones = COALESCE($5, observaciones)
      WHERE id_edp = $6
      RETURNING *;
    `;
    const r = await db.query(sql, [estado_edp, hes_oc_numero, factura_numero, fecha_facturacion, observaciones, id_edp]);

    if (r.rows.length === 0) {
      return res.status(404).json({ success: false, message: "EDP no encontrado" });
    }

    const edpActualizado = r.rows[0];

    // Si se declara facturado, verificar si transiciona proyecto a Estado 7
    if (estado_edp === 'FACTURADO') {
      await db.query(`
        UPDATE tpry_proyecto
        SET id_proyecto_estado = 7,
            json_field = jsonb_set(
              COALESCE(json_field, '{}'::jsonb),
              '{liquidacion_v1}',
              $1::jsonb,
              true
            )
        WHERE id_proyecto = $2;
      `, [JSON.stringify({
        factura_numero,
        hes_oc_numero,
        fecha_facturacion: fecha_facturacion || new Date().toISOString().split('T')[0],
        monto_facturado: edpActualizado.monto_total,
        estado_cierre: 'FACTURADO_CONCLUIDO'
      }), edpActualizado.id_proyecto]);
    }

    res.status(200).json({
      success: true,
      message: "Estado de Pago actualizado exitosamente",
      data: edpActualizado
    });
  } catch (error) {
    console.error("[EDP] Error actualizando estado de EDP:", error);
    res.status(500).json({ success: false, message: "Error al actualizar estado de pago", error: error.message });
  }
};

exports.adjuntarFacturaErp = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await estadoPagoModel.adjuntarFacturaErp(id, req.body);
    res.status(200).json({ message: "Factura ERP anexada exitosamente", data });
  } catch (error) {
    console.error("[EDP] Error anexando factura ERP:", error);
    res.status(500).json({ message: "Error al anexar factura ERP", error: error.message });
  }
};

exports.imputarCostoServicio = async (req, res) => {
  try {
    const data = await estadoPagoModel.imputarCostoServicio(req.body);
    res.status(201).json({ message: "Costo operacional registrado exitosamente", data });
  } catch (error) {
    console.error("[EDP] Error al imputar costo operacional:", error);
    res.status(500).json({ message: "Error al imputar costo operacional", error: error.message });
  }
};

exports.getVisor360Proyecto = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await estadoPagoModel.getVisor360Proyecto(id);
    res.status(200).json(data);
  } catch (error) {
    console.error("[EDP] Error obteniendo Visor 360:", error);
    res.status(500).json({ message: "Error al obtener Visor 360 de proyecto", error: error.message });
  }
};

// 8. Guardar Ajustes de Tarifas y Descuentos Exclusivo de Tesorería (Pamela) (Spec 57 / REQ-028)
exports.guardarAjustesTesoreria = async (req, res) => {
  try {
    const { id_proyecto, id_user, lineas_ajustadas, descuento_global, motivo_ajuste } = req.body;
    if (!id_proyecto || !id_user) {
      return res.status(400).json({ success: false, message: 'id_proyecto e id_user son requeridos' });
    }

    // Validar rol de Tesorería (Pamela / GSP_CONTA) o Administrador (Sergio Gajardo / Admin)
    const uRes = await db.query(`
      SELECT u.id_user, u.name_frst, u.apellido_pat, u.email, ur.id_rol, r.name_rol
      FROM sch_leangsp.tsec_users u
      LEFT JOIN sch_leangsp.tsec_user_roles ur ON u.id_user = ur.id_user
      LEFT JOIN sch_leangsp.tsec_roles r ON ur.id_rol = r.id_rol
      WHERE u.id_user = $1;
    `, [id_user]);

    if (uRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const usuario = uRes.rows[0];
    const nombreCompleto = `${usuario.name_frst || ''} ${usuario.apellido_pat || ''}`.toLowerCase();
    const email = (usuario.email || '').toLowerCase();

    // Evaluar si alguno de sus roles es Admin o Contabilidad/Tesorería
    const tieneRolAdmin = uRes.rows.some(r => Number(r.id_rol) === 1 || (r.name_rol || '').toUpperCase().includes('ADMIN'));
    const tieneRolConta = uRes.rows.some(r => Number(r.id_rol) === 33 || (r.name_rol || '').toUpperCase().includes('CONTA') || (r.name_rol || '').toUpperCase().includes('TESOR'));
    const esEmailAdmin = email.includes('sgajardo') || email.includes('admin');
    const esPamela = nombreCompleto.includes('pamela') || email.includes('pamela');

    const esHabilitado = tieneRolAdmin || tieneRolConta || esEmailAdmin || esPamela;

    if (!esHabilitado) {
      return res.status(403).json({
        success: false,
        message: 'Acceso Denegado: Solo Pamela (Gerente de Tesorería) o Administradores del Sistema pueden modificar tarifas y aplicar ajustes en el EDP.'
      });
    }

    const ajusteRegistro = {
      id_user_ajuste: usuario.id_user,
      nombre_ajuste: `${usuario.name_frst || ''} ${usuario.apellido_pat || ''}`.trim(),
      rol_ajuste: tieneRolAdmin || esEmailAdmin ? 'Administrador del Sistema' : 'Gerencia de Tesorería',
      fecha_ajuste: new Date().toISOString(),
      motivo_ajuste: motivo_ajuste || 'Ajuste operacional de Tesorería/Administración',
      descuento_global: Number(descuento_global) || 0,
      lineas_ajustadas: lineas_ajustadas || []
    };

    const updSql = `
      UPDATE sch_leangsp.tpry_proyecto
      SET json_field = jsonb_set(
        COALESCE(json_field, '{}'::jsonb),
        '{edp_ajustes_v1}',
        $1::jsonb,
        true
      )
      WHERE id_proyecto = $2
      RETURNING id_proyecto, codi_proyecto, json_field;
    `;
    await db.query(updSql, [JSON.stringify(ajusteRegistro), id_proyecto]);

    res.status(200).json({
      success: true,
      message: `Ajustes guardados exitosamente por ${ajusteRegistro.nombre_ajuste} (${ajusteRegistro.rol_ajuste})`,
      data: ajusteRegistro
    });
  } catch (error) {
    console.error('[EDP_TESORERIA] Error guardando ajustes:', error);
    res.status(500).json({ success: false, message: 'Error interno guardando ajustes de tesorería', error: error.message });
  }
};

// 8.1. Requerimiento de Cambio / RFC de EDP (Spec 59 / REQ-037)
exports.solicitarModificacionEDP = async (req, res) => {
  try {
    const { id_proyecto, id_user, tipo_modificacion, descripcion, monto_estimado } = req.body;
    if (!id_proyecto || !id_user || !descripcion) {
      return res.status(400).json({ success: false, message: 'id_proyecto, id_user y descripcion son obligatorios' });
    }

    // 1. Obtener datos del proyecto
    const pRes = await db.query(`
      SELECT p.id_proyecto, p.codi_proyecto, p.nombre_proyecto, p.json_field,
             COALESCE(clt.razon_social, clt.name_empresa, 'Cliente Mandante') AS cliente_nombre
      FROM sch_leangsp.tpry_proyecto p
      LEFT JOIN sch_leangsp.tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
      WHERE p.id_proyecto = $1;
    `, [id_proyecto]);

    if (pRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    }
    const proyecto = pRes.rows[0];

    // 2. Obtener datos del solicitante
    const uRes = await db.query(`
      SELECT u.id_user, u.name_frst, u.apellido_pat, u.email, r.name_rol
      FROM sch_leangsp.tsec_users u
      LEFT JOIN sch_leangsp.tsec_user_roles ur ON u.id_user = ur.id_user
      LEFT JOIN sch_leangsp.tsec_roles r ON ur.id_rol = r.id_rol
      WHERE u.id_user = $1
      LIMIT 1;
    `, [id_user]);

    const solicitante = uRes.rows[0] || { name_frst: 'Usuario', email: '', name_rol: 'Operaciones' };
    const nombreSolicitante = `${solicitante.name_frst || ''} ${solicitante.apellido_pat || ''}`.trim() || 'Colaborador';
    const rolSolicitante = solicitante.name_rol || 'Analista PMO / Operaciones';

    const nuevaSolicitud = {
      id_solicitud: 'RFC-' + Date.now(),
      id_user_solicitante: Number(id_user),
      nombre_solicitante: nombreSolicitante,
      email_solicitante: solicitante.email,
      rol_solicitante: rolSolicitante,
      fecha_solicitud: new Date().toISOString(),
      tipo_modificacion: tipo_modificacion || 'Ajuste de Tarifa / Valor',
      descripcion: descripcion.trim(),
      monto_estimado: monto_estimado ? Number(monto_estimado) : null,
      estado: 'PENDIENTE'
    };

    // 3. Persistir en json_field del proyecto
    const jsonActual = proyecto.json_field || {};
    const listaSolicitudes = Array.isArray(jsonActual.edp_solicitudes_ajuste) ? jsonActual.edp_solicitudes_ajuste : [];
    listaSolicitudes.unshift(nuevaSolicitud);
    jsonActual.edp_solicitudes_ajuste = listaSolicitudes;

    await db.query(`
      UPDATE sch_leangsp.tpry_proyecto
      SET json_field = $1
      WHERE id_proyecto = $2;
    `, [JSON.stringify(jsonActual), id_proyecto]);

    // 4. Preparar notificación omnicanal con Deep Link (leanglobal_notification_standard)
    const codi = proyecto.codi_proyecto || `OT-${id_proyecto}`;
    const cliente = proyecto.cliente_nombre;

    // Obtener destinatarios autorizados para modificar EDP (Admin y Tesorería)
    let destinatarios = [];
    try {
      const adminTesoRes = await db.query(`
        SELECT DISTINCT u.id_user, u.email, u.movil as telefono, 
               TRIM(u.name_frst || ' ' || COALESCE(u.apellido_pat, '')) as nombre
        FROM sch_leangsp.tsec_users u
        LEFT JOIN sch_leangsp.tsec_user_roles ur ON u.id_user = ur.id_user
        WHERE (ur.id_rol IN (1, 6) OR u.email IN ('sgajardoc@gmail.com', 'mseguel@arriendosanpablo.cl'))
          AND COALESCE(u.activo, true) = true
          AND u.email IS NOT NULL;
      `);
      destinatarios = adminTesoRes.rows;
    } catch (dbErr) {
      console.warn('[RFC-NOTIF] Error consultando usuarios destino, usando fallback:', dbErr.message);
    }

    if (!destinatarios || destinatarios.length === 0) {
      destinatarios = [
        { nombre: 'Sergio Gajardo', email: 'sgajardoc@gmail.com', telefono: '56936483259' },
        { nombre: 'Maritza Seguel', email: 'mseguel@arriendosanpablo.cl', telefono: '56976959126' }
      ];
    }

    // Intentar despachar notificaciones sin bloquear la respuesta si algún canal externo tarda
    for (const dest of destinatarios) {
      try {
        await notificacionService.despacharNotificacion({
          evento: 'EDP_SOLICITUD_MODIFICACION',
          canales: ['EMAIL', 'WHATSAPP'],
          destinatario: {
            nombre: dest.nombre,
            email: dest.email,
            telefono: dest.telefono
          },
          deepLink: {
            tipoApp: 'WEB',
            ruta: 'torre',
            params: {
              id_proyecto: id_proyecto,
              subtab: 'pendientes_edp',
              accion: 'caratula'
            }
          },
          emailData: {
            asunto: `[Solicitud Modificación EDP] ${codi} - ${cliente} (${nombreSolicitante})`,
            titulo: `Solicitud de Modificación en EDP`,
            subtitulo: `El usuario ${nombreSolicitante} (${rolSolicitante}) ha solicitado una modificación en el Estado de Pago de la orden ${codi}.`,
            contenido: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
                <div style="margin-bottom: 12px; font-size: 14px; line-height: 1.5;">
                  <strong style="color: #38bdf8; font-weight: 700; display: inline-block; min-width: 170px;">Orden de Trabajo:</strong>
                  <span style="color: #ffffff; font-weight: 600; font-family: monospace;">${codi}</span>
                </div>
                <div style="margin-bottom: 12px; font-size: 14px; line-height: 1.5;">
                  <strong style="color: #38bdf8; font-weight: 700; display: inline-block; min-width: 170px;">Cliente Mandante:</strong>
                  <span style="color: #ffffff; font-weight: 600;">${cliente}</span>
                </div>
                <div style="margin-bottom: 12px; font-size: 14px; line-height: 1.5;">
                  <strong style="color: #38bdf8; font-weight: 700; display: inline-block; min-width: 170px;">Solicitante:</strong>
                  <span style="color: #ffffff; font-weight: 600;">${nombreSolicitante} <span style="color: #94a3b8; font-weight: normal;">(${rolSolicitante})</span></span>
                </div>
                <div style="margin-bottom: 12px; font-size: 14px; line-height: 1.5;">
                  <strong style="color: #38bdf8; font-weight: 700; display: inline-block; min-width: 170px;">Tipo de Modificación:</strong>
                  <span style="color: #fbbf24; font-weight: 700; background: rgba(251, 191, 36, 0.15); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(251, 191, 36, 0.3);">${nuevaSolicitud.tipo_modificacion}</span>
                </div>
                <div style="margin-bottom: 12px; font-size: 14px; line-height: 1.5;">
                  <strong style="color: #38bdf8; font-weight: 700; display: inline-block; min-width: 170px;">Detalle / Justificación:</strong>
                  <div style="color: #f1f5f9; background: rgba(255, 255, 255, 0.05); padding: 8px 12px; border-radius: 6px; margin-top: 6px; border-left: 3px solid #38bdf8; font-size: 13.5px; line-height: 1.4;">${nuevaSolicitud.descripcion}</div>
                </div>
                ${nuevaSolicitud.monto_estimado ? `
                <div style="margin-bottom: 12px; font-size: 14px; line-height: 1.5;">
                  <strong style="color: #38bdf8; font-weight: 700; display: inline-block; min-width: 170px;">Monto Estimado:</strong>
                  <span style="color: #34d399; font-weight: 700; font-family: monospace; font-size: 15px;">$${Number(nuevaSolicitud.monto_estimado).toLocaleString('es-CL')}</span>
                </div>
                ` : ''}
                <p style="margin-top: 20px; color: #94a3b8; font-size: 13px; line-height: 1.5; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 15px;">
                  Haz clic en el botón inferior para abrir directamente la Carátula de EDP y gestionar los cambios requeridos.
                </p>
              </div>
            `,
            botonTexto: 'ABRIR CARÁTULA Y AJUSTAR EDP'
          },
          wspData: {
            mensaje: `🔔 *Grúas San Pablo — Solicitud de Modificación de EDP*\n\n` +
                     `📌 *OT:* ${codi} — ${cliente}\n` +
                     `👤 *Solicitante:* ${nombreSolicitante} (${rolSolicitante})\n` +
                     `🏷️ *Tipo:* ${nuevaSolicitud.tipo_modificacion}\n` +
                     `📝 *Detalle:* ${nuevaSolicitud.descripcion}\n` +
                     (nuevaSolicitud.monto_estimado ? `💰 *Monto Estimado:* $${Number(nuevaSolicitud.monto_estimado).toLocaleString('es-CL')}\n\n` : `\n`) +
                     `📲 *Gestionar en Torre de Control:*`
          }
        });
      } catch (eNotif) {
        console.warn(`[EDP_RFC] Error notificando a ${dest.email}:`, eNotif.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Solicitud de modificación enviada exitosamente a Tesorería y Administración',
      solicitud: nuevaSolicitud,
      solicitudes: listaSolicitudes
    });
  } catch (error) {
    console.error('[EDP_RFC] Error al solicitar modificación:', error);
    res.status(500).json({ success: false, message: 'Error interno al procesar solicitud de modificación', error: error.message });
  }
};

// 8.2. Resolver / Aplicar / Descartar Solicitud de Modificación (Spec 59 / REQ-037)
exports.resolverSolicitudModificacionEDP = async (req, res) => {
  try {
    const { id_proyecto, id_solicitud, id_user, accion, comentario_resolucion } = req.body;
    if (!id_proyecto || !id_solicitud || !id_user || !accion) {
      return res.status(400).json({ success: false, message: 'id_proyecto, id_solicitud, id_user y accion son requeridos' });
    }

    const uRes = await db.query(`
      SELECT u.id_user, u.name_frst, u.apellido_pat, u.email, ur.id_rol, r.name_rol
      FROM sch_leangsp.tsec_users u
      LEFT JOIN sch_leangsp.tsec_user_roles ur ON u.id_user = ur.id_user
      LEFT JOIN sch_leangsp.tsec_roles r ON ur.id_rol = r.id_rol
      WHERE u.id_user = $1;
    `, [id_user]);

    if (uRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const usuario = uRes.rows[0];
    const email = (usuario.email || '').toLowerCase();
    const nombreCompleto = `${usuario.name_frst || ''} ${usuario.apellido_pat || ''}`.toLowerCase();
    const tieneRolAdmin = uRes.rows.some(r => Number(r.id_rol) === 1 || (r.name_rol || '').toUpperCase().includes('ADMIN'));
    const tieneRolConta = uRes.rows.some(r => Number(r.id_rol) === 33 || (r.name_rol || '').toUpperCase().includes('CONTA') || (r.name_rol || '').toUpperCase().includes('TESOR'));
    const esEmailAdmin = email.includes('sgajardo') || email.includes('admin');
    const esPamela = nombreCompleto.includes('pamela') || email.includes('pamela');

    if (!(tieneRolAdmin || tieneRolConta || esEmailAdmin || esPamela)) {
      return res.status(403).json({ success: false, message: 'Solo Tesorería o Administración pueden resolver solicitudes de modificación' });
    }

    const pRes = await db.query(`SELECT json_field FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = $1`, [id_proyecto]);
    if (pRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    }

    const jsonField = pRes.rows[0].json_field || {};
    const solicitudes = Array.isArray(jsonField.edp_solicitudes_ajuste) ? jsonField.edp_solicitudes_ajuste : [];
    const idx = solicitudes.findIndex(s => s.id_solicitud === id_solicitud);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Solicitud no encontrada en el proyecto' });
    }

    solicitudes[idx].estado = accion.toUpperCase(); // 'APLICADA' | 'DESCARTADA'
    solicitudes[idx].resuelto_por = `${usuario.name_frst || ''} ${usuario.apellido_pat || ''}`.trim();
    solicitudes[idx].fecha_resolucion = new Date().toISOString();
    solicitudes[idx].comentario_resolucion = comentario_resolucion || '';

    jsonField.edp_solicitudes_ajuste = solicitudes;

    await db.query(`UPDATE sch_leangsp.tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2`, [JSON.stringify(jsonField), id_proyecto]);

    res.status(200).json({
      success: true,
      message: `Solicitud marcada como ${accion.toUpperCase()}`,
      solicitudes
    });
  } catch (error) {
    console.error('[EDP_RFC] Error al resolver solicitud:', error);
    res.status(500).json({ success: false, message: 'Error interno al resolver solicitud', error: error.message });
  }
};

// 9. Firma FES y Despacho Condicional del Comercial (Spec 57 / REQ-028)
exports.firmarComercialEdp = async (req, res) => {
  try {
    const {
      id_proyecto,
      id_user,
      pass_fes,
      es_pago_anticipado,
      observaciones
    } = req.body;

    if (!id_proyecto || !id_user || !pass_fes) {
      return res.status(400).json({ success: false, message: 'id_proyecto, id_user y pass_fes son requeridos' });
    }

    // 1. Validar usuario y PIN FES
    const uRes = await db.query(`
      SELECT id_user, name_frst, apellido_pat, email, rut, pass_hash_fes
      FROM sch_leangsp.tsec_users
      WHERE id_user = $1;
    `, [id_user]);

    if (uRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario comercial no encontrado' });
    }

    const usuario = uRes.rows[0];
    if (!usuario.pass_hash_fes) {
      return res.status(400).json({ success: false, message: 'El usuario comercial no tiene PIN FES enrolado' });
    }

    if (pass_fes !== usuario.pass_hash_fes) {
      return res.status(401).json({ success: false, message: 'PIN de firma FES incorrecto' });
    }

    // 2. Obtener datos de la OT y Mandante
    const proyRes = await db.query(`
      SELECT p.*,
             COALESCE(c.razon_social, c.name_empresa, p.json_field->'crm_v1'->>'cliente_nombre', 'Cliente Mandante') AS cliente_nombre,
             COALESCE(c.rut_empresa, p.json_field->'crm_v1'->>'cliente_rut', '') AS cliente_rut,
             COALESCE(p.json_field->'crm_v1'->>'contacto_email', p.json_field->>'cliente_email', '') AS cliente_email
      FROM sch_leangsp.tpry_proyecto p
      LEFT JOIN sch_leangsp.tpar_empresas c ON p.id_empresa_cliente = c.id_empresa
      WHERE p.id_proyecto = $1;
    `, [id_proyecto]);

    if (proyRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    }
    const proyecto = proyRes.rows[0];

    // 3. Generar código criptográfico FES
    const timestamp = Date.now().toString(36).toUpperCase();
    const codigoFes = `FES-EDP-${id_proyecto}-${usuario.id_user}-${timestamp}`;

    const firmaComercial = {
      id_user: usuario.id_user,
      nombre_firmante: `${usuario.name_frst || ''} ${usuario.apellido_pat || ''}`.trim(),
      rut_firmante: usuario.rut || '',
      email_firmante: usuario.email || '',
      codigo_fes: codigoFes,
      fecha_firma: new Date().toISOString(),
      observaciones: observaciones || 'Aprobado y emitido por Comercial',
      es_pago_anticipado: !!es_pago_anticipado,
      estado_despacho: es_pago_anticipado ? 'INTERNO_PAGO_PREVIO' : 'DESPACHADO_CLIENTE'
    };

    // 4. Guardar firma en tpry_proyecto.json_field.edp_firma_comercial
    await db.query(`
      UPDATE sch_leangsp.tpry_proyecto
      SET json_field = jsonb_set(
        COALESCE(json_field, '{}'::jsonb),
        '{edp_firma_comercial}',
        $1::jsonb,
        true
      )
      WHERE id_proyecto = $2;
    `, [JSON.stringify(firmaComercial), id_proyecto]);

    // 5. Bifurcación Condicional de Notificaciones
    const baseUrl = process.env.APP_BASE_URL || 'https://servidor.leanglobal.cl';
    const edpPdfUrl = `${baseUrl}/lg-gsp-dev/api/operaciones/edp/proyecto/${id_proyecto}/pdf`;

    const ccInstitucionales = [
      'omar.ghiselini@arriendosanpablo.cl',
      'mseguel@arriendosanpablo.cl',
      'logistica@arriendosanpablo.cl',
      'j.poncenavarrete@gmail.com'
    ];

    if (es_pago_anticipado) {
      // Mandante ya pagó: NO enviar cobro al cliente, sólo notificar internamente
      try {
        for (const ccEmail of ccInstitucionales) {
          notificacionService.despacharEmailSmtp({
            para: ccEmail,
            asunto: `[GSP] 📄 EDP Interno Emitido: ${proyecto.codi_proyecto} - ${proyecto.cliente_nombre} (Pago Previo)`,
            titulo: `Estado de Pago Interno: ${proyecto.codi_proyecto}`,
            subtitulo: `Servicio con Pago Previo / Contado — Visado por Comercial (${firmaComercial.nombre_firmante})`,
            contenido: `<p>El Ejecutivo Comercial <strong>${firmaComercial.nombre_firmante}</strong> ha firmado el Estado de Pago para el proyecto <strong>${proyecto.codi_proyecto}</strong>.</p>
            <div style="background:#064e3b15; border:1px solid #05966940; border-radius:8px; padding:12px; margin:12px 0; color:#a7f3d0;">
              🏦 <strong>Condición Contado / Pago Previo:</strong> El cliente ya efectuó el pago. Este EDP es para respaldo administrativo interno y Facturación DTE. No se emite cobro al mandante.
            </div>
            <ul>
              <li><strong>Mandante:</strong> ${proyecto.cliente_nombre}</li>
              <li><strong>Código FES:</strong> ${codigoFes}</li>
              <li><strong>Fecha Firma:</strong> ${new Date().toLocaleDateString('es-CL')}</li>
            </ul>`,
            botonTexto: 'VER DOSSIER EDP',
            botonUrl: edpPdfUrl
          }).catch(e => console.warn('[EDP Mail Interno]', e.message));
        }
      } catch (errM) {
        console.warn('[EDP] Error notificando EDP interno:', errM.message);
      }
    } else {
      // Condición Crédito: Se envía formalmente al Cliente Mandante con copia a GG, Contabilidad y Operaciones
      const emailCliente = proyecto.cliente_email;
      if (emailCliente) {
        try {
          notificacionService.despacharEmailSmtp({
            para: emailCliente,
            cc: ccInstitucionales.join(', '),
            asunto: `[Grúas San Pablo] Estado de Pago Oficial — Servicio ${proyecto.codi_proyecto}`,
            titulo: `Estado de Pago Oficial: ${proyecto.codi_proyecto}`,
            subtitulo: `Emitido y firmado por Comercial (${firmaComercial.nombre_firmante})`,
            contenido: `<p>Estimado Cliente Mandante (<strong>${proyecto.cliente_nombre}</strong>),</p>
            <p>Junto con saludar, adjuntamos la Carátula Oficial y Dossier de Estado de Pago correspondiente a los servicios de izaje prestados para la obra/faena <strong>${proyecto.nombre_proyecto || 'Faena en Terreno'}</strong>.</p>
            <div style="background:#1e293b; border:1px solid #475569; border-radius:8px; padding:12px; margin:12px 0; color:#e2e8f0;">
              📄 <strong>Firma Electrónica Simple (FES):</strong> Este documento ha sido certificado digitalmente por el Comercial bajo el código <code>${codigoFes}</code> respaldado con georreferenciación y firmas de terreno.
            </div>
            <p>Agradecemos tramitar la correspondiente Orden de Compra (OC / HES) o visto bueno para la emisión de la Factura DTE.</p>`,
            botonTexto: 'DESCARGAR DOSSIER EDP OFICIAL',
            botonUrl: edpPdfUrl
          }).catch(e => console.warn('[EDP Mail Cliente]', e.message));
        } catch (errC) {
          console.warn('[EDP] Error despachando correo al mandante:', errC.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: es_pago_anticipado 
        ? 'EDP visado exitosamente como expediente interno (Pago Previo).' 
        : 'EDP firmado y despachado exitosamente al cliente con copia institucional.',
      codigo_fes: codigoFes,
      firma: firmaComercial
    });
  } catch (error) {
    console.error('[EDP_FIRMA_COMERCIAL] Error:', error);
    res.status(500).json({ success: false, message: 'Error al firmar y despachar EDP', error: error.message });
  }
};

// 11. Guardar Soporte Documental (OC y Factura) con Adjuntos (Spec 60 / REQ-038)
exports.guardarSoporteDocumentalEDP = async (req, res) => {
  try {
    const { id_proyecto, id_user, oc, factura, declarar_facturado } = req.body;
    if (!id_proyecto) {
      return res.status(400).json({ success: false, message: 'id_proyecto es requerido' });
    }

    const pRes = await db.query('SELECT id_proyecto, json_field, id_proyecto_estado FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = $1', [id_proyecto]);
    if (pRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    }

    const proyecto = pRes.rows[0];
    const jsonField = proyecto.json_field || {};
    let nuevoEstado = proyecto.id_proyecto_estado;

    // 1. Procesar OC
    if (oc && (oc.numero_oc || oc.asumido_sin_oc)) {
      const ocRegistro = {
        id: oc.id || 'oc-' + Date.now(),
        numero_oc: oc.asumido_sin_oc ? 'S/OC - ASUME EDP' : (oc.numero_oc || '').trim(),
        fecha_emision: oc.fecha_emision || new Date().toISOString().split('T')[0],
        monto_neto: Number(oc.monto_neto) || 0,
        archivo: oc.archivo || null,
        observaciones: oc.observaciones || (oc.asumido_sin_oc ? 'Cliente sin OC formal. Se asume monto íntegro del EDP' : ''),
        asumido_sin_oc: Boolean(oc.asumido_sin_oc),
        registrado_por: id_user || null,
        fecha_registro: new Date().toISOString()
      };

      const ordenesCompra = Array.isArray(jsonField.ordenes_compra) ? jsonField.ordenes_compra : [];
      const idx = ordenesCompra.findIndex(o => o.numero_oc === ocRegistro.numero_oc || o.id === ocRegistro.id);
      if (idx >= 0) {
        ordenesCompra[idx] = { ...ordenesCompra[idx], ...ocRegistro };
      } else {
        ordenesCompra.unshift(ocRegistro);
      }
      jsonField.ordenes_compra = ordenesCompra;
      jsonField.oc_v1 = ocRegistro;
    }

    // 2. Procesar Factura
    if (factura && factura.factura_numero) {
      const liquidacionData = {
        hes_oc_numero: (oc && oc.numero_oc) ? oc.numero_oc : (jsonField.oc_v1?.numero_oc || 'S/OC - ASUME EDP'),
        factura_numero: factura.factura_numero.trim(),
        fecha_facturacion: factura.fecha_facturacion || new Date().toISOString().split('T')[0],
        monto_facturado_neto: Number(factura.monto_neto) || 0,
        monto_facturado_bruto: Number(factura.monto_bruto) || 0,
        observaciones_facturacion: factura.observaciones || '',
        archivo_factura: factura.archivo || null,
        archivo_oc: (oc && oc.archivo) ? oc.archivo : (jsonField.oc_v1?.archivo || null),
        id_user_cierre: id_user || null,
        fecha_cierre: new Date().toISOString(),
        estado_financiero: 'FACTURADO_CONFORME'
      };

      jsonField.liquidacion_v1 = liquidacionData;
      jsonField.liquidacion_guardada = liquidacionData;

      if (declarar_facturado) {
        nuevoEstado = 7; // Facturado / Cerrado
      }
    }

    // Persistir en BD
    await db.query(`
      UPDATE sch_leangsp.tpry_proyecto
      SET id_proyecto_estado = $1,
          json_field = $2
      WHERE id_proyecto = $3;
    `, [nuevoEstado, JSON.stringify(jsonField), id_proyecto]);

    res.status(200).json({
      success: true,
      message: declarar_facturado ? 'OT declarada Facturada y Concluida exitosamente' : 'Soporte documental guardado exitosamente',
      data: {
        id_proyecto,
        id_proyecto_estado: nuevoEstado,
        oc: jsonField.oc_v1,
        liquidacion: jsonField.liquidacion_v1
      }
    });
  } catch (error) {
    console.error('[EDP_SOPORTE_DOC] Error al guardar soporte documental:', error);
    res.status(500).json({ success: false, message: 'Error interno al guardar soporte documental', error: error.message });
  }
};
