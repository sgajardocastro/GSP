const estadoPagoModel = require('../models/estadoPagoModel');
const edpPdfService = require('../services/edpPdfService');
const db = require('../config/postgresPool');

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
             e.patente, e.modelo, e.marca,
             COALESCE(u_op.name_frst || ' ' || u_op.apellido_pat, 'Operador') AS operador_nombre,
             COALESCE(u_rig.name_frst || ' ' || u_rig.apellido_pat, 'Rigger') AS rigger_nombre
      FROM sch_leangsp.tedp_reporte_avance r
      LEFT JOIN sch_leangsp.tequ_equipo e ON r.id_equipo = e.id_equipo
      LEFT JOIN sch_leangsp.tsec_users u_op ON r.id_user_operador = u_op.id_user
      LEFT JOIN sch_leangsp.tsec_users u_rig ON r.id_user_rigger = u_rig.id_user
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
      FROM sch_leangsp.tedp_estado_pago e
      JOIN sch_leangsp.tpry_proyecto p ON e.id_proyecto = p.id_proyecto
      WHERE e.id_edp = $1;
    `, [paramId]);

    if (edpRes.rows.length > 0) {
      edp = edpRes.rows[0];
      idProyecto = edp.id_proyecto;

      // Obtener detalles adicionales si existen
      const detRes = await db.query(`
        SELECT * FROM sch_leangsp.tedp_estado_pago_detalle
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
      FROM sch_leangsp.tpry_proyecto p
      LEFT JOIN sch_leangsp.tpar_empresas c ON p.id_empresa_cliente = c.id_empresa
      WHERE p.id_proyecto = $1;
    `, [idProyecto]);

    if (proyRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Proyecto no encontrado para generar EDP" });
    }
    const proyecto = proyRes.rows[0];

    // 4. Obtener Reports Diarios del proyecto
    const repRes = await db.query(`
      SELECT r.*,
             e.patente, e.modelo, e.marca,
             COALESCE(u_op.name_frst || ' ' || u_op.apellido_pat, 'Operador') AS operador_nombre,
             COALESCE(u_rig.name_frst || ' ' || u_rig.apellido_pat, 'Rigger') AS rigger_nombre
      FROM sch_leangsp.tedp_reporte_avance r
      LEFT JOIN sch_leangsp.tequ_equipo e ON r.id_equipo = e.id_equipo
      LEFT JOIN sch_leangsp.tsec_users u_op ON r.id_user_operador = u_op.id_user
      LEFT JOIN sch_leangsp.tsec_users u_rig ON r.id_user_rigger = u_rig.id_user
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
      UPDATE sch_leangsp.tedp_estado_pago
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
        UPDATE sch_leangsp.tpry_proyecto
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
