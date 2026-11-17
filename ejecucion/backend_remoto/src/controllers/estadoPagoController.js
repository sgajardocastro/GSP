const fs = require('fs');
const path = require('path');
const estadoPagoModel = require('../models/estadoPagoModel');
const edpPdfService = require('../services/edpPdfService');
const { parsearFacturaDtePdf } = require('../services/dtePdfParserService');
const db = require('../config/postgresPool');
const notificacionService = require('../services/notificacionService');
const { isLineaCobroUnico, calcularSubtotalLinea } = require('../utils/lineaCobroUnico');

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
             to_char(r.fecha_inicio_servicio AT TIME ZONE 'America/Santiago', 'HH24:MI') AS hora_inicio,
             to_char(r.fecha_termino_servicio AT TIME ZONE 'America/Santiago', 'HH24:MI') AS hora_termino,
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

// Generación y descarga del PDF Oficial del EDP (Soporta ID de EDP o ID de Proyecto) — Motor wkhtmltopdf
exports.generarPdfEdp = async (req, res) => {
  try {
    const isByProyecto = Boolean(req.params.id_proyecto);
    const paramId = req.params.id_proyecto || req.params.id_edp || req.params.id;

    let edp = null;
    let idProyecto = null;
    let reports = [];
    let detalles_adicionales = [];

    // 1. Buscar en tedp_estado_pago según corresponda (por id_proyecto o por id_edp)
    try {
      const edpRes = await db.query(
        isByProyecto
          ? `SELECT e.*, p.codi_proyecto, p.json_field AS proy_json
             FROM tedp_estado_pago e
             JOIN tpry_proyecto p ON e.id_proyecto = p.id_proyecto
             WHERE e.id_proyecto = $1
             ORDER BY e.id_edp DESC LIMIT 1;`
          : `SELECT e.*, p.codi_proyecto, p.json_field AS proy_json
             FROM tedp_estado_pago e
             JOIN tpry_proyecto p ON e.id_proyecto = p.id_proyecto
             WHERE e.id_edp = $1;`,
        [paramId]
      );

      if (edpRes.rows.length > 0) {
        edp = edpRes.rows[0];
        idProyecto = edp.id_proyecto;

        const detRes = await db.query(`
          SELECT * FROM tedp_estado_pago_detalle
          WHERE id_edp = $1
          ORDER BY id_edp_detalle ASC;
        `, [edp.id_edp]);
        detalles_adicionales = detRes.rows;
      } else {
        idProyecto = paramId;
      }
    } catch (eEdpTable) {
      idProyecto = paramId;
    }

    // 2. Obtener datos completos del Proyecto, Cliente Mandante y Empresa Emisora
    const proyRes = await db.query(`
      SELECT p.*, 
             COALESCE(c.razon_social, c.name_empresa, p.json_field->'crm_v1'->>'cliente_nombre', p.json_field->'datos_generales'->>'cliente_nombre') AS cliente_nombre,
             COALESCE(c.rut_empresa, p.json_field->'crm_v1'->>'cliente_rut', p.json_field->'datos_generales'->>'cliente_rut') AS cliente_rut,
             COALESCE(em.razon_social, em.name_empresa, 'ARRIENDO DE GRÚAS SAN PABLO SPA') AS empresa_razon_social,
             COALESCE(em.rut_empresa, '76.849.230-1') AS empresa_rut,
             COALESCE(em.giro, 'Arriendo de Maquinarias y Grúas') AS empresa_giro,
             COALESCE(em.direccion, em.direccion_facturacion, 'Panamericana Norte #1020') AS empresa_direccion,
             COALESCE(em.logo_empresa, 'logo-sanpablo.png') AS empresa_logo
      FROM tpry_proyecto p
      LEFT JOIN tpar_empresas c ON p.id_empresa_cliente = c.id_empresa
      LEFT JOIN tpar_empresas em ON p.id_empresa = em.id_empresa
      WHERE p.id_proyecto = $1;
    `, [idProyecto]);

    if (proyRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Proyecto no encontrado para generar EDP" });
    }
    const proyecto = proyRes.rows[0];
    const jf = typeof proyecto.json_field === 'string' ? JSON.parse(proyecto.json_field || '{}') : (proyecto.json_field || {});
    const crmV1 = jf.crm_v1 || {};

    // 3. Obtener ITS oficial del proyecto si existe (fuente conciliada de ingresos y horas)
    let itsRow = null;
    let itsJornadas = [];
    try {
      const itsRes = await db.query(`
        SELECT * FROM tits_informe_termino
        WHERE id_proyecto = $1
        ORDER BY version DESC, id_its DESC LIMIT 1;
      `, [idProyecto]);
      if (itsRes.rows.length > 0) {
        itsRow = itsRes.rows[0];
        const jRes = await db.query(`
          SELECT * FROM tits_jornada_detalle
          WHERE id_its = $1 AND COALESCE(es_oculta, false) = false
          ORDER BY orden ASC, fecha ASC;
        `, [itsRow.id_its]);
        itsJornadas = jRes.rows;
      }
    } catch (_) {}

    // 4. Obtener Reports Diarios del proyecto
    try {
      const repRes = await db.query(`
        SELECT r.*,
               to_char(r.fecha_inicio_servicio AT TIME ZONE 'America/Santiago', 'HH24:MI') AS hora_inicio,
               to_char(r.fecha_termino_servicio AT TIME ZONE 'America/Santiago', 'HH24:MI') AS hora_termino,
               e.patente, e.modelo, e.marca,
               COALESCE(u_op.name_frst || ' ' || u_op.apellido_pat, 'Operador') AS operador_nombre,
               COALESCE(u_rig.name_frst || ' ' || u_rig.apellido_pat, 'Rigger') AS rigger_nombre
        FROM tedp_reporte_avance r
        LEFT JOIN tequ_equipo e ON r.id_equipo = e.id_equipo
        LEFT JOIN tsec_users u_op ON r.id_user_operador = u_op.id_user
        LEFT JOIN tsec_users u_rig ON r.id_user_rigger = u_rig.id_user
        WHERE r.id_proyecto = $1
        ORDER BY r.fecha_reporte ASC, r.dia_correlativo ASC;
      `, [idProyecto]);
      reports = repRes.rows;
    } catch (_) {
      reports = [];
    }

    // Si no hay reports en tedp_reporte_avance pero sí jornadas en ITS, usarlas como respaldo cronológico
    if (reports.length === 0 && itsJornadas.length > 0) {
      reports = itsJornadas.map((j, idx) => ({
        dia_correlativo: j.orden || (idx + 1),
        fecha_reporte: j.fecha,
        patente: j.patente || 'GRÚA',
        modelo: j.tipo_servicio || 'Servicio Izaje',
        operador_nombre: 'Operador Asignado',
        rigger_nombre: '',
        hora_inicio: j.hora_llegada || j.hora_salida || '08:00',
        hora_termino: j.hora_termino || '18:00',
        horas_operadas: Number(j.horas_report || 0),
        horas_facturables: Number(j.horas_report || 0),
        horas_sobretiempo: 0,
        horometro_inicio: j.horometro_inicio || '-',
        horometro_termino: j.horometro_termino || '-',
        cliente_nombre: j.cliente_nombre || 'Recepción en Faena',
        cliente_cargo: j.cliente_cargo || 'Mandante'
      }));
    }

    // 5. Calcular montos conciliados (priorizando ITS aprobado + Ajustes de Tesorería + Líneas Comerciales)
    const snapLines = crmV1.lineas_operativas_vigentes || crmV1.lineas_servicio || jf.snapshot_comercial?.lines || jf.lines || [];
    const ajustesTesoreria = jf.edp_ajustes_v1 || null;
    const descuentoMonto = Number(ajustesTesoreria?.descuento_tesoreria || 0);
    const descuentoMotivo = ajustesTesoreria?.motivo_descuento || '';

    let totalHorasFact = 0;
    let totalST = 0;
    reports.forEach(r => {
      totalHorasFact += Number(r.horas_facturables || 0);
      totalST += Number(r.horas_sobretiempo || 0);
    });
    if (totalHorasFact === 0 && Number(itsRow?.total_horas_report) > 0) {
      totalHorasFact = Number(itsRow.total_horas_report);
    }

    let subtotalBase = 0;
    detalles_adicionales = [];

    if (snapLines.length > 0) {
      const tarifasEditadas = ajustesTesoreria?.tarifas_editadas || {};
      const diasFaena = Math.max(1, reports.length);

      snapLines.forEach((l, idx) => {
        const valUnit = tarifasEditadas[idx] !== undefined
          ? Number(tarifasEditadas[idx])
          : Number(l.valorUnitario || l.precio_unitario || 0);
        const cant = Number(l.cantidad || 1);
        let sub = 0;
        let cantMostrar = cant;
        let unidadMostrar = l.unidad || 'GL';

        const tipoL = String(l.tipo || '').toUpperCase();
        const subcatL = String(l.subcategoria || '').toUpperCase();
        const descL = String(l.descripcion || '').toUpperCase();
        const esLineaTraslado = tipoL === 'TRASLADOS' || tipoL.includes('TRASLADO') || tipoL.includes('FLETE') || subcatL.includes('FLETE') || descL.includes('FLETE');
        const esLineaEquipo = tipoL.includes('GRUA') || tipoL.includes('CAMION') || subcatL.includes('GRUA') || subcatL.includes('CAMION') || subcatL.includes('PLUMA') || ['GRUAS TELESCOPICAS', 'GRUA HORQUILLA', 'MANIPULADOR TELESCOPICO', 'CAMION PLUMA'].includes(l.tipo);

        if (isLineaCobroUnico(l)) {
          // SPEC-128: Cobro único (Valor Fijo / TRASLADOS) -> 1 × valUnit
          sub = valUnit;
          cantMostrar = 1;
          unidadMostrar = l.unidad || (esLineaTraslado ? 'TRASLADO IDA/VUELTA' : 'Valor Fijo');
        } else if (esLineaEquipo) {
          if (l.unidad === 'Diario') {
            sub = valUnit * diasFaena * cant;
            cantMostrar = `${diasFaena} d`;
          } else {
            const hrsAplicar = totalHorasFact > 0 ? totalHorasFact : (cant * 8);
            sub = valUnit * hrsAplicar;
            cantMostrar = `${hrsAplicar.toFixed(1)} hrs`;
            unidadMostrar = 'Horas';
          }
        } else {
          sub = Number(l.subtotal_calculado || l.subtotal || (valUnit * cant));
        }

        subtotalBase += sub;
        detalles_adicionales.push({
          concepto: `${l.tipo || 'Servicio'}${l.subcategoria ? ' — ' + l.subcategoria : ''}`,
          subtitulo: l.descripcion || '',
          unidad_cobro: unidadMostrar,
          cantidad: cantMostrar,
          precio_unitario: valUnit,
          monto_subtotal: Math.round(sub)
        });
      });

      // Erradicación de tarifa quemada ($65.000) y doble cobro. Las horas facturables consolidadas
      // (totalHorasFact) ya incluyen las horas de sobretiempo a la tarifa unitaria pactada.
      // Únicamente se aplica un recargo adicional si existe un override explícito de Tesorería.
      const montoST = (ajustesTesoreria?.sobretiempo_override !== null && ajustesTesoreria?.sobretiempo_override !== undefined)
        ? Number(ajustesTesoreria.sobretiempo_override)
        : 0;

      if (montoST > 0) {
        subtotalBase += montoST;
        detalles_adicionales.push({
          concepto: 'Recargo Horas Sobretiempo / Extensión de Jornada',
          subtitulo: 'Ajuste de sobretiempo autorizado por Tesorería',
          unidad_cobro: 'GL',
          cantidad: 1,
          precio_unitario: Math.round(montoST),
          monto_subtotal: Math.round(montoST)
        });
      }
    } else if (itsRow && Number(itsRow.total_ingresos_facturables) > 0) {
      subtotalBase = Number(itsRow.total_ingresos_facturables);
      const ingHoras = Number(itsRow.total_ingresos_horas || 0);
      const ingFlete = Number(itsRow.total_ingresos_fletes || itsRow.valor_flete_pactado || 0);

      if (ingHoras > 0) {
        detalles_adicionales.push({
          concepto: 'Servicio de Arriendo Operativo de Grúa en Faena',
          subtitulo: `Conciliado según Informe de Término de Servicio ${itsRow.folio_its || ''}`,
          unidad_cobro: 'Horas',
          cantidad: `${totalHorasFact.toFixed(1)} hrs`,
          precio_unitario: Number(itsRow.valor_hora_pactado || 0),
          monto_subtotal: Math.round(ingHoras)
        });
      }
      if (ingFlete > 0) {
        detalles_adicionales.push({
          concepto: 'Servicio de Traslado / Movilización y Desmovilización (Flete)',
          subtitulo: 'Cargo logístico pactado en cotización',
          unidad_cobro: 'GL',
          cantidad: 1,
          precio_unitario: Math.round(ingFlete),
          monto_subtotal: Math.round(ingFlete)
        });
      }
      if (detalles_adicionales.length === 0) {
        detalles_adicionales.push({
          concepto: 'Servicio Integral de Izaje y Maquinaria',
          subtitulo: `Conciliado según ${itsRow.folio_its || 'ITS'}`,
          unidad_cobro: 'GL',
          cantidad: 1,
          precio_unitario: Math.round(subtotalBase),
          monto_subtotal: Math.round(subtotalBase)
        });
      }
    }

    if (subtotalBase === 0 && edp?.monto_neto) {
      subtotalBase = Number(edp.monto_neto);
    }

    const totalNetoFinal = Math.max(0, Math.round(subtotalBase - descuentoMonto));
    const totalIvaFinal = Math.round(totalNetoFinal * 0.19);
    const totalBrutoFinal = totalNetoFinal + totalIvaFinal;

    const fInicio = reports[0]?.fecha_reporte || crmV1.fecha_inicio || jf.datos_generales?.fecha_inicio || proyecto.fecha_plan_ini || new Date().toISOString().split('T')[0];
    const fFin = reports[reports.length - 1]?.fecha_reporte || crmV1.fecha_termino || jf.datos_generales?.fecha_termino || proyecto.fecha_plan_fin || fInicio;

    const edpConsolidado = {
      id_edp: edp?.id_edp || 1,
      numero_edp: edp?.numero_edp || `EDP-${String(proyecto.id_proyecto).padStart(3, '0')}`,
      folio_its: itsRow?.folio_its || null,
      fecha_emision: edp?.fecha_emision || new Date(),
      fecha_corte_inicio: edp?.fecha_corte_inicio || fInicio,
      fecha_corte_fin: edp?.fecha_corte_fin || fFin,
      dias_totales: Math.max(reports.length, 1),
      horas_facturables_totales: totalHorasFact,
      monto_subtotal_base: subtotalBase,
      descuento_tesoreria: descuentoMonto,
      monto_neto: totalNetoFinal,
      monto_iva: totalIvaFinal,
      monto_total: totalBrutoFinal,
      estado_edp: edp?.estado_edp || (itsRow?.estado_its === 'CONCLUIDO' ? 'EMITIDO' : 'BORRADOR')
    };

    const ordenesCompra = crmV1.ordenes_compra || jf.ordenes_compra || [];
    const ocPrincipal = ordenesCompra[0] || (jf.liquidacion_v1?.hes_oc_numero ? { numero_oc: jf.liquidacion_v1.hes_oc_numero } : null);

    // 6. Compilar datos para el PDF con wkhtmltopdf
    const edpData = {
      edp: edpConsolidado,
      proyecto: {
        id_proyecto: proyecto.id_proyecto,
        codi_proyecto: proyecto.codi_proyecto,
        folio_its: itsRow?.folio_its || null,
        cliente_nombre: proyecto.cliente_nombre || 'Cliente Mandante',
        cliente_rut: proyecto.cliente_rut || 'S/R',
        obra_nombre: crmV1.obra_nombre || jf.obra_nombre || proyecto.nombre_proyecto || 'Faena Principal',
        obra_direccion: crmV1.obra_direccion || jf.obra_direccion || crmV1.direccion_faena || 'En Faena',
        obra_comuna: crmV1.obra_comuna || '',
        contacto_nombre: crmV1.contacto_nombre || jf.datos_generales?.contacto_nombre || 'Administración de Obra',
        vendedor_nombre: crmV1.vendedor_nombre || jf.vendedor_nombre || jf.cotizaciones_historicas?.[0]?.evento_envio?.usuario_envio || 'Ejecutivo Comercial',
        vendedor_email: crmV1.vendedor_email || '',
        empresa_razon_social: proyecto.empresa_razon_social,
        empresa_rut: proyecto.empresa_rut,
        empresa_giro: proyecto.empresa_giro,
        empresa_direccion: proyecto.empresa_direccion,
        empresa_logo: proyecto.empresa_logo
      },
      reports,
      detalles_adicionales,
      descuento_tesoreria: descuentoMonto > 0 ? { monto: descuentoMonto, motivo: descuentoMotivo } : null,
      firma_comercial: jf.edp_firma_comercial || jf.edp_flujo_v1?.firma_3_comercial || null,
      edp_flujo_v1: jf.edp_flujo_v1 || null,
      ordenes_compra: ordenesCompra,
      oc_mandante: ocPrincipal,
      factura_dte: jf.liquidacion_v1 || null
    };

    // 7. Generar buffer PDF con wkhtmltopdf (0% Puppeteer)
    const pdfBuffer = await edpPdfService.generarPdfEdpBuffer(edpData);

    // 8. Transmitir archivo PDF
    const filename = `EDP_${edpConsolidado.numero_edp}_${proyecto.codi_proyecto || 'GSP'}.pdf`;
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
      FROM tsec_users u
      LEFT JOIN tsec_user_roles ur ON u.id_user = ur.id_user
      LEFT JOIN tsec_roles r ON ur.id_rol = r.id_rol
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
      UPDATE tpry_proyecto
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
      FROM tpry_proyecto p
      LEFT JOIN tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
      WHERE p.id_proyecto = $1;
    `, [id_proyecto]);

    if (pRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    }
    const proyecto = pRes.rows[0];

    // 2. Obtener datos del solicitante
    const uRes = await db.query(`
      SELECT u.id_user, u.name_frst, u.apellido_pat, u.email, r.name_rol
      FROM tsec_users u
      LEFT JOIN tsec_user_roles ur ON u.id_user = ur.id_user
      LEFT JOIN tsec_roles r ON ur.id_rol = r.id_rol
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
      UPDATE tpry_proyecto
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
        FROM tsec_users u
        LEFT JOIN tsec_user_roles ur ON u.id_user = ur.id_user
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
      FROM tsec_users u
      LEFT JOIN tsec_user_roles ur ON u.id_user = ur.id_user
      LEFT JOIN tsec_roles r ON ur.id_rol = r.id_rol
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

    const pRes = await db.query(`SELECT json_field FROM tpry_proyecto WHERE id_proyecto = $1`, [id_proyecto]);
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

    await db.query(`UPDATE tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2`, [JSON.stringify(jsonField), id_proyecto]);

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
      FROM tsec_users
      WHERE id_user = $1;
    `, [id_user]);

    if (uRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario comercial no encontrado' });
    }

    const usuario = uRes.rows[0];
    if (!usuario.pass_hash_fes) {
      return res.status(400).json({ success: false, message: 'El usuario comercial no tiene PIN FES enrolado' });
    }

    if (String(pass_fes).trim().toLowerCase() !== String(usuario.pass_hash_fes).trim().toLowerCase()) {
      return res.status(401).json({ success: false, message: 'PIN de firma FES incorrecto' });
    }

    // 2. Obtener datos de la OT y Mandante
    const proyRes = await db.query(`
      SELECT p.*,
             COALESCE(c.razon_social, c.name_empresa, p.json_field->'crm_v1'->>'cliente_nombre', 'Cliente Mandante') AS cliente_nombre,
             COALESCE(c.rut_empresa, p.json_field->'crm_v1'->>'cliente_rut', '') AS cliente_rut,
             COALESCE(p.json_field->'crm_v1'->>'contacto_email', p.json_field->>'cliente_email', '') AS cliente_email
      FROM tpry_proyecto p
      LEFT JOIN tpar_empresas c ON p.id_empresa_cliente = c.id_empresa
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
      UPDATE tpry_proyecto
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
    const envPrefix = (process.env.APP_ENV === 'prod') ? '/lg-gsp-prod' : '/lg-gsp-dev';
    const edpPdfUrl = `${baseUrl}${envPrefix}/api/operaciones/edp/proyecto/${id_proyecto}/pdf`;

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

// 9.B Circuito de 2 Hitos / Firmas FES del Estado de Pago (SPEC-127 / REQ-1165 — Comercial fuera del flujo)
// Paso 1: Control de Gestión (Yiara Mendoza) valida 100% de Reports y firma el EDP -> Pasa a Contabilidad y notifica con link PDF + Deep Link Contabilidad
// Paso 2: Contabilidad (Maritza Seguel) emite en Laudus, sube Factura DTE y firma con PIN FES (o devuelve con observaciones a Control de Gestión)
exports.firmarPasoEdp = async (req, res) => {
  try {
    const {
      id_proyecto,
      id_user,
      paso, // 1: Control de Gestión (Yiara), 2: Contabilidad y Facturación (Maritza Seguel)
      accion = 'FIRMAR', // 'FIRMAR' | 'DEVOLVER'
      pass_fes,
      es_pago_anticipado,
      observaciones,
      monto_edp_neto
    } = req.body;

    if (!id_proyecto || !id_user || !paso) {
      return res.status(400).json({ success: false, message: 'id_proyecto, id_user y paso son requeridos' });
    }

    const pasoNum = Number(paso);
    if (![1, 2, 3].includes(pasoNum)) {
      return res.status(400).json({ success: false, message: 'Paso inválido. Debe ser 1 (Control de Gestión) o 2 (Contabilidad y Facturación).' });
    }

    // 1. Obtener usuario firmante / ejecutor
    const uRes = await db.query(`
      SELECT id_user, name_frst, apellido_pat, email, rut, pass_hash_fes
      FROM tsec_users
      WHERE id_user = $1;
    `, [id_user]);

    if (uRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    const usuario = uRes.rows[0];
    const nombreUsuario = `${usuario.name_frst || ''} ${usuario.apellido_pat || ''}`.trim() || usuario.email;

    // Si la acción es FIRMAR, validar PIN FES
    if (accion !== 'DEVOLVER') {
      if (!pass_fes) {
        return res.status(400).json({ success: false, message: 'El PIN FES es obligatorio para firmar el Estado de Pago' });
      }
      if (!usuario.pass_hash_fes) {
        return res.status(400).json({ success: false, message: 'El usuario no tiene PIN FES enrolado' });
      }
      if (String(pass_fes).trim().toLowerCase() !== String(usuario.pass_hash_fes).trim().toLowerCase()) {
        return res.status(401).json({ success: false, message: 'PIN de firma FES incorrecto' });
      }
    } else {
      if (!observaciones || !String(observaciones).trim()) {
        return res.status(400).json({ success: false, message: 'Debe indicar las observaciones para devolver el EDP a Control de Gestión' });
      }
    }

    // 2. Obtener proyecto y datos del cliente / responsable comercial
    const proyRes = await db.query(`
      SELECT p.*,
             COALESCE(c.razon_social, c.name_empresa, p.json_field->'crm_v1'->>'cliente_nombre', 'Cliente Mandante') AS cliente_nombre,
             COALESCE(c.rut_empresa, p.json_field->'crm_v1'->>'cliente_rut', '') AS cliente_rut,
             COALESCE(p.json_field->'crm_v1'->>'contacto_email', p.json_field->>'cliente_email', '') AS cliente_email,
             u_crea.email AS creador_email,
             COALESCE(u_crea.name_frst || ' ' || u_crea.apellido_pat, '') AS creador_nombre,
             u_jefe.email AS jefe_email,
             COALESCE(u_jefe.name_frst || ' ' || u_jefe.apellido_pat, '') AS jefe_nombre
      FROM tpry_proyecto p
      LEFT JOIN tpar_empresas c ON p.id_empresa_cliente = c.id_empresa
      LEFT JOIN tsec_users u_crea ON p.id_usuario_creacion = u_crea.id_user
      LEFT JOIN tsec_users u_jefe ON p.id_usuario_jefe_proyecto = u_jefe.id_user
      WHERE p.id_proyecto = $1;
    `, [id_proyecto]);

    if (proyRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    }
    const proyecto = proyRes.rows[0];
    const jf = typeof proyecto.json_field === 'string' ? JSON.parse(proyecto.json_field || '{}') : (proyecto.json_field || {});
    const crmV1 = jf.crm_v1 || {};

    // 3. Resolver dinámicamente correos institucionales desde tsec_users (SPEC-127: Cero Hardcoding ciego)
    const idComercialRef = Number(crmV1.id_ejecutivo_comercial || proyecto.id_usuario_creacion || proyecto.id_usuario_jefe_proyecto || 0);
    const destDbRes = await db.query(`
      SELECT id_user, name_frst, apellido_pat, email
      FROM tsec_users
      WHERE id_user IN (2, 3, 17, 61, 65, $1)
         OR email ILIKE 'mseguel@%'
         OR email ILIKE 'omar.ghiselini@%'
         OR email ILIKE 'jponce@%'
         OR email ILIKE 'logistica@%'
         OR email ILIKE 'controlflota@%';
    `, [idComercialRef]);

    const findEmailByUser = (targetId, emailPrefix, fallbackEmail) => {
      const byId = destDbRes.rows.find(r => Number(r.id_user) === Number(targetId) && r.email && r.email.includes('@'));
      if (byId) return String(byId.email).trim().toLowerCase();
      if (emailPrefix) {
        const byMail = destDbRes.rows.find(r => String(r.email || '').toLowerCase().startsWith(emailPrefix.toLowerCase()));
        if (byMail) return String(byMail.email).trim().toLowerCase();
      }
      return fallbackEmail;
    };

    const emailMaritza = findEmailByUser(61, 'mseguel@', 'mseguel@arriendosanpablo.cl');
    const emailOmar = findEmailByUser(2, 'omar.ghiselini@', 'omar.ghiselini@arriendosanpablo.cl');
    const emailJonathan = findEmailByUser(17, 'logistica@', 'logistica@arriendosanpablo.cl');
    const emailJorge = findEmailByUser(3, 'jponce@', 'jponce@arriendosanpablo.cl');
    const emailYiara = findEmailByUser(65, 'controlflota@', 'controlflota@arriendosanpablo.cl');

    const rowComercial = idComercialRef > 0 ? destDbRes.rows.find(r => Number(r.id_user) === idComercialRef && r.email) : null;
    const emailComercialResp = String(
      crmV1.vendedor_email ||
      rowComercial?.email ||
      proyecto.creador_email ||
      proyecto.jefe_email ||
      emailOmar
    ).trim().toLowerCase();
    const nombreComercialResp = crmV1.vendedor_nombre ||
      (rowComercial ? `${rowComercial.name_frst || ''} ${rowComercial.apellido_pat || ''}`.trim() : '') ||
      proyecto.creador_nombre?.trim() ||
      'Ejecutivo Comercial';

    // Evaluar condición de OC / HES y disponibilidad actual de OC
    const requiereOc = Boolean(crmV1.requiere_oc_hes ?? jf.datos_generales?.requiere_oc_hes ?? false);
    const ordenesCompra = Array.isArray(jf.ordenes_compra)
      ? jf.ordenes_compra
      : (Array.isArray(crmV1.ordenes_compra) ? crmV1.ordenes_compra : []);
    const tieneOc = ordenesCompra.length > 0 || Boolean(jf.oc_v1?.numero_oc);

    const flujoActual = jf.edp_flujo_v1 || {
      estado: 'BORRADOR',
      paso_actual: 1,
      firma_1_analista: null,
      firma_2_contabilidad: null,
      firma_3_comercial: null,
      observacion_devolucion: null,
      historial: []
    };
    if (!Array.isArray(flujoActual.historial)) flujoActual.historial = [];

    const timestamp = Date.now().toString(36).toUpperCase();
    const codigoFes = `FES-EDP-P${pasoNum}-${id_proyecto}-${usuario.id_user}-${timestamp}`;
    const ahoraIso = new Date().toISOString();

    const { BASE_URL_WEB } = notificacionService.getBaseUrls();
    const edpPdfUrl = `${BASE_URL_WEB}/api/operaciones/edp/proyecto/${id_proyecto}/pdf`;
    const deepLinkContabilidadUrl = notificacionService.construirDeepLink({
      tipoApp: 'WEB',
      ruta: 'torre',
      params: { view: 'contabilidad', id_proyecto, accion: 'caratula' }
    });
    const deepLinkPmoAnalistaUrl = notificacionService.construirDeepLink({
      tipoApp: 'WEB',
      ruta: 'torre',
      params: { view: 'pmo', id_proyecto, accion: 'caratula' }
    });

    // CASO DEVOLUCIÓN (Contabilidad devuelve a Control de Gestión — Yiara Mendoza con observaciones)
    if (accion === 'DEVOLVER') {
      const firmaAnalistaPrevia = flujoActual.firma_1_analista || null;
      flujoActual.estado = 'OBSERVADO_CONTABILIDAD';
      flujoActual.paso_actual = 1;
      flujoActual.firma_1_analista = null;
      flujoActual.firma_2_contabilidad = null;
      flujoActual.habilitado_facturar = false;
      flujoActual.observacion_devolucion = {
        id_user: usuario.id_user,
        nombre_usuario: nombreUsuario,
        email_usuario: usuario.email || '',
        fecha: ahoraIso,
        motivo: String(observaciones).trim()
      };
      flujoActual.historial.unshift({
        paso: pasoNum,
        accion: 'DEVOLVER',
        usuario: nombreUsuario,
        fecha: ahoraIso,
        observaciones: String(observaciones).trim(),
        firma_1_invalidada: firmaAnalistaPrevia?.codigo_fes || null
      });

      jf.edp_flujo_v1 = flujoActual;
      await db.query('UPDATE tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2', [JSON.stringify(jf), id_proyecto]);

      const paraDevolucionSet = new Set([emailYiara]);
      if (firmaAnalistaPrevia?.email_firmante && firmaAnalistaPrevia.email_firmante.includes('@')) {
        paraDevolucionSet.add(String(firmaAnalistaPrevia.email_firmante).trim().toLowerCase());
      }
      const ccDevolucionList = [emailMaritza, emailJonathan, emailJorge]
        .filter(Boolean)
        .filter((em, i, arr) => arr.indexOf(em) === i && !paraDevolucionSet.has(em));

      notificacionService.despacharEmailSmtp({
        para: Array.from(paraDevolucionSet),
        cc: ccDevolucionList,
        asunto: `[GSP] ⚠️ EDP Devuelto con Observaciones por Contabilidad: ${proyecto.codi_proyecto} — ${proyecto.cliente_nombre}`,
        titulo: `EDP Observado por Contabilidad: ${proyecto.codi_proyecto}`,
        subtitulo: `Devuelto por ${nombreUsuario} para corrección y re-firma en Control de Gestión`,
        contenido: `<p>El área de <strong>Contabilidad (${nombreUsuario})</strong> ha revisado el Estado de Pago del servicio <strong>${proyecto.codi_proyecto}</strong> (Cliente: <strong>${proyecto.cliente_nombre}</strong>) y lo ha devuelto a <strong>Control de Gestión (Yiara Mendoza)</strong> con la siguiente observación:</p>
        <div style="background:#450a0a; border:1px solid #dc2626; border-radius:8px; padding:14px; margin:14px 0; color:#fecaca;">
          <strong>📝 Observación de Contabilidad:</strong><br/>
          ${String(observaciones).trim()}
        </div>
        <p>Por favor abra directamente el Estado de Pago desde el botón inferior, ajuste los antecedentes observados y vuelva a emitir la firma FES de Control de Gestión.</p>`,
        botonTexto: 'ABRIR EDP OBSERVADO PARA CORREGIR',
        botonUrl: deepLinkPmoAnalistaUrl
      }).catch(e => console.warn('[EDP Mail Devolución]', e.message));

      return res.status(200).json({
        success: true,
        message: 'EDP devuelto a Control de Gestión (Yiara Mendoza) con observaciones.',
        edp_flujo_v1: flujoActual
      });
    }

    // CASO FIRMA FES POR PASO (1 o 2)
    const cargosPorPaso = {
      1: 'Control de Gestión / Analista Operativo',
      2: 'Contabilidad y Facturación'
    };

    const datosFirma = {
      paso: pasoNum,
      id_user: usuario.id_user,
      nombre_firmante: nombreUsuario,
      rut_firmante: usuario.rut || '',
      email_firmante: usuario.email || '',
      cargo: cargosPorPaso[pasoNum] || 'Certificación FES',
      codigo_fes: codigoFes,
      fecha_firma: ahoraIso,
      observaciones: observaciones || `Validado y firmado en Paso ${pasoNum} (${cargosPorPaso[pasoNum] || 'FES'})`
    };

    if (pasoNum === 1) {
      // HITO 1: Yiara Mendoza (Control de Gestión) firma el EDP -> Queda en etapa CONTABILIDAD (Maritza Seguel)
      flujoActual.firma_1_analista = datosFirma;
      flujoActual.firma_2_contabilidad = null;
      flujoActual.observacion_devolucion = null;

      const habilitadoFacturarInmediato = !requiereOc || tieneOc;
      flujoActual.estado = 'EN_CONTABILIDAD';
      flujoActual.paso_actual = 2; // Siguiente firmante: Contabilidad (Maritza Seguel)
      flujoActual.requiere_oc = requiereOc;
      flujoActual.tiene_oc = tieneOc;
      flujoActual.habilitado_facturar = habilitadoFacturarInmediato;
      flujoActual.estado_facturacion_inmediata = habilitadoFacturarInmediato ? 'HABILITADO_FACTURAR' : 'ESPERANDO_OC_CLIENTE';
      if (monto_edp_neto !== undefined) flujoActual.monto_edp_neto = Number(monto_edp_neto) || 0;

      flujoActual.historial.unshift({
        paso: 1,
        accion: 'FIRMAR_ANALISTA',
        usuario: nombreUsuario,
        codigo_fes: codigoFes,
        fecha: ahoraIso,
        observaciones: datosFirma.observaciones
      });

      jf.edp_flujo_v1 = flujoActual;
      await db.query('UPDATE tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2', [JSON.stringify(jf), id_proyecto]);

      const badgeOcHtml = !requiereOc
        ? `<span style="background:#065f46; color:#a7f3d0; padding:4px 8px; border-radius:4px; font-weight:bold;">NO REQUIERE OC (Facturación Directa Habilitada)</span>`
        : (tieneOc
          ? `<span style="background:#065f46; color:#a7f3d0; padding:4px 8px; border-radius:4px; font-weight:bold;">REQUIERE OC — OC YA CARGADA (#${jf.oc_v1?.numero_oc || ordenesCompra[0]?.numero_oc})</span>`
          : `<span style="background:#78350f; color:#fde68a; padding:4px 8px; border-radius:4px; font-weight:bold;">REQUIERE OC — PENDIENTE RECEPCIÓN DE OC DEL CLIENTE</span>`);

      const montoEdpFmt = Number(flujoActual.monto_edp_neto || 0) > 0
        ? `$${Math.round(Number(flujoActual.monto_edp_neto)).toLocaleString('es-CL')} + IVA`
        : 'Según liquidación en PDF adjunto';

      // Destinatarios oficiales acordados:
      // Para: Contabilidad (Maritza Seguel), Responsable Comercial del negocio, Gerencia (Omar), Coordinador Operaciones (Jonathan), Operaciones (Jorge)
      // CC: Yiara Mendoza (firmante Control de Gestión)
      const paraPaso1 = [emailMaritza, emailComercialResp, emailOmar, emailJonathan, emailJorge]
        .filter(em => em && em.includes('@'))
        .map(em => em.trim().toLowerCase())
        .filter((em, idx, arr) => arr.indexOf(em) === idx);

      const emailFirmantePaso1 = (usuario.email && usuario.email.includes('@'))
        ? String(usuario.email).trim().toLowerCase()
        : emailYiara;
      const ccPaso1 = [emailYiara, emailFirmantePaso1]
        .filter(em => em && em.includes('@'))
        .map(em => em.trim().toLowerCase())
        .filter((em, idx, arr) => arr.indexOf(em) === idx && !paraPaso1.includes(em));

      notificacionService.despacharEmailSmtp({
        para: paraPaso1,
        cc: ccPaso1,
        asunto: `[GSP] 📑 EDP Firmado (${proyecto.codi_proyecto}) — En Contabilidad para Facturación Laudus (${proyecto.cliente_nombre})`,
        titulo: `Estado de Pago Firmado: ${proyecto.codi_proyecto}`,
        subtitulo: `Emitido por ${nombreUsuario} (Control de Gestión) — Etapa Actual: Contabilidad (Maritza Seguel)`,
        contenido: `<p><strong>Control de Gestión (${nombreUsuario})</strong> ha validado los Reports Diarios y ha firmado el <strong>Estado de Pago</strong> del servicio <strong>${proyecto.codi_proyecto}</strong> con código FES <code>${codigoFes}</code>, quedando en etapa de <strong>Contabilidad (Maritza Seguel)</strong>.</p>
        <div style="background:#0f172a; border:1px solid #334155; border-radius:8px; padding:14px; margin:14px 0; color:#e2e8f0;">
          <p style="margin:4px 0;"><strong>Cliente Mandante:</strong> ${proyecto.cliente_nombre} (${proyecto.cliente_rut || 'S/R'})</p>
          <p style="margin:4px 0;"><strong>Obra / Faena:</strong> ${crmV1.obra_nombre || proyecto.nombre_proyecto || 'Faena'}</p>
          <p style="margin:4px 0;"><strong>Responsable Comercial:</strong> ${nombreComercialResp} (${emailComercialResp})</p>
          <p style="margin:4px 0;"><strong>Monto Neto EDP:</strong> <span style="color:#fbbf24; font-weight:bold;">${montoEdpFmt}</span></p>
          ${observaciones ? `<p style="margin:4px 0;"><strong>Nota Control de Gestión:</strong> ${String(observaciones).trim()}</p>` : ''}
          <p style="margin:8px 0 4px 0;"><strong>Condición de Orden de Compra:</strong> ${badgeOcHtml}</p>
        </div>
        <div style="background:#064e3b; border:1px solid #10b981; border-radius:8px; padding:12px 14px; margin:14px 0; color:#ecfdf5; font-size:13px;">
          <strong>🧾 Gestión Contabilidad (Maritza Seguel):</strong> Use el botón azul principal inferior para abrir directamente este EDP en la plataforma, subir el PDF de la factura emitida en <strong>Laudus</strong> y firmar su carga (o devolverlo con observaciones a Control de Gestión si corresponde).
        </div>
        <div style="text-align:center; margin:18px 0 6px 0;">
          <a href="${edpPdfUrl}" target="_blank" style="display:inline-block; background:#1e293b; color:#38bdf8 !important; font-weight:700; font-size:13px; text-decoration:none; padding:12px 24px; border-radius:8px; border:1px solid #38bdf8; text-transform:uppercase; letter-spacing:0.5px;">📄 VER / DESCARGAR PDF DEL ESTADO DE PAGO FIRMADO</a>
        </div>`,
        botonTexto: 'ABRIR EDP EN CONTABILIDAD PARA FACTURAR',
        botonUrl: deepLinkContabilidadUrl
      }).catch(e => console.warn('[EDP Mail Paso 1 -> Contabilidad y Áreas]', e.message));

      return res.status(200).json({
        success: true,
        message: 'EDP firmado por Control de Gestión y derivado a Contabilidad (Maritza Seguel). Notificaciones enviadas con link al PDF y Deep Link de facturación.',
        codigo_fes: codigoFes,
        edp_flujo_v1: flujoActual
      });
    }

    if (pasoNum === 2 || pasoNum === 3) {
      // HITO 2: Contabilidad (Maritza Seguel) certifica con PIN FES que generó en Laudus y subió la Factura DTE al sistema
      const facturasDteActuales = Array.isArray(jf.facturas_dte) ? jf.facturas_dte : [];
      const folioPrincipal = facturasDteActuales.length > 0
        ? facturasDteActuales.map(f => f.folio_dte).join(', ')
        : (jf.liquidacion_v1?.factura_numero || null);

      if (!folioPrincipal) {
        return res.status(400).json({
          success: false,
          message: 'Antes de firmar el Hito 2 de Contabilidad, debe subir y guardar el documento PDF de la Factura emitida en Laudus.'
        });
      }

      const firmaContabilidad = {
        ...datosFirma,
        paso: 2,
        cargo: 'Contabilidad y Facturación',
        factura_numero: folioPrincipal
      };

      flujoActual.firma_2_contabilidad = firmaContabilidad;
      flujoActual.observacion_devolucion = null;
      flujoActual.estado = 'FACTURADO_CONFORME';
      flujoActual.paso_actual = 3;
      flujoActual.requiere_oc = requiereOc;
      flujoActual.tiene_oc = tieneOc;
      flujoActual.habilitado_facturar = true;

      flujoActual.historial.unshift({
        paso: 2,
        accion: 'FIRMAR_CONTABILIDAD_FACTURA',
        usuario: nombreUsuario,
        codigo_fes: codigoFes,
        factura_numero: folioPrincipal,
        fecha: ahoraIso,
        observaciones: datosFirma.observaciones
      });

      jf.edp_flujo_v1 = flujoActual;

      // Consolidar estado de facturación en liquidacion_v1 y estado del proyecto (7 = Facturado) salvo facturación parcial explícita
      let nuevoEstadoProyecto = proyecto.id_proyecto_estado;
      const esParcialExplicita = jf.liquidacion_v1?.estado_financiero === 'FACTURACION_PARCIAL';
      if (!esParcialExplicita) {
        nuevoEstadoProyecto = 7;
        jf.liquidacion_v1 = {
          ...(jf.liquidacion_v1 || {}),
          factura_numero: folioPrincipal,
          estado_financiero: 'FACTURADO_CONFORME',
          firma_fes_contabilidad: codigoFes,
          firmado_por_contabilidad: nombreUsuario,
          fecha_firma_contabilidad: ahoraIso
        };
        jf.liquidacion_guardada = jf.liquidacion_v1;
      }

      await db.query(
        'UPDATE tpry_proyecto SET id_proyecto_estado = $1, json_field = $2 WHERE id_proyecto = $3',
        [nuevoEstadoProyecto, JSON.stringify(jf), id_proyecto]
      );

      return res.status(200).json({
        success: true,
        message: `Carga de Factura Laudus (#${folioPrincipal}) certificada exitosamente con Firma FES por Contabilidad (${nombreUsuario}).`,
        codigo_fes: codigoFes,
        firma: firmaContabilidad,
        edp_flujo_v1: flujoActual
      });
    }
  } catch (error) {
    console.error('[EDP_FIRMAR_PASO] Error:', error);
    res.status(500).json({ success: false, message: 'Error al procesar paso de firma del EDP', error: error.message });
  }
};

// 11.A Reconocimiento Automático de Facturas PDF (Laudus ERP / Portal SII) (Spec 101 / REQ-1070)
exports.parsearFacturaDtePdfEndpoint = async (req, res) => {
  try {
    let pdfBuffer = null;
    let nombreOriginal = req.body?.nombre_archivo || 'factura_dte.pdf';

    if (req.files && (req.files.archivo || req.files.file)) {
      const f = req.files.archivo || req.files.file;
      pdfBuffer = f.data;
      nombreOriginal = f.name || nombreOriginal;
    } else if (req.body && req.body.pdf_base64) {
      const rawB64 = String(req.body.pdf_base64).replace(/^data:application\/pdf;base64,/i, '');
      pdfBuffer = Buffer.from(rawB64, 'base64');
    }

    if (!pdfBuffer || pdfBuffer.length < 50) {
      return res.status(400).json({
        success: false,
        message: 'No se recibió un archivo PDF válido para analizar.'
      });
    }

    const parsed = parsearFacturaDtePdf(pdfBuffer);

    // Guardar copia física del PDF en /uploads/dte_facturas/
    let archivoUrl = null;
    try {
      const uploadDir = path.join(__dirname, '../../uploads/dte_facturas');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const safeFolio = (parsed.folio_dte || Date.now()).toString().replace(/[^a-zA-Z0-9_-]/g, '');
      const safeEmp = (parsed.id_empresa_emisora || 'GSP');
      const fileName = `DTE_${safeEmp}_${safeFolio}_${Date.now()}.pdf`;
      fs.writeFileSync(path.join(uploadDir, fileName), pdfBuffer);
      archivoUrl = `/uploads/dte_facturas/${fileName}`;
    } catch (eStorage) {
      console.warn('[DTE_PDF_STORAGE] No se pudo persistir copia física:', eStorage.message);
    }

    return res.status(200).json({
      success: true,
      data: {
        ...parsed,
        nombre_archivo: nombreOriginal,
        archivo_url: archivoUrl
      }
    });
  } catch (error) {
    console.error('[PARSEAR_DTE_PDF] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al reconocer factura PDF',
      error: error.message
    });
  }
};

// 11.B Guardar Soporte Documental (OC y Múltiples Facturas DTE: Parciales, En Cuotas o Mensuales) (Spec 60 / Spec 101 / REQ-1070)
exports.guardarSoporteDocumentalEDP = async (req, res) => {
  try {
    const id_proyecto = req.params.id_proyecto || req.body.id_proyecto;
    const { id_user, oc, factura, declarar_facturado } = req.body;
    if (!id_proyecto) {
      return res.status(400).json({ success: false, message: 'id_proyecto es requerido' });
    }

    const pRes = await db.query(`
      SELECT p.id_proyecto, p.codi_proyecto, p.nombre_proyecto, p.json_field, p.id_proyecto_estado,
             COALESCE(c.razon_social, c.name_empresa, p.json_field->'crm_v1'->>'cliente_nombre', 'Cliente Mandante') AS cliente_nombre,
             COALESCE(c.rut_empresa, p.json_field->'crm_v1'->>'cliente_rut', '') AS cliente_rut
      FROM tpry_proyecto p
      LEFT JOIN tpar_empresas c ON p.id_empresa_cliente = c.id_empresa
      WHERE p.id_proyecto = $1
    `, [id_proyecto]);
    if (pRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    }

    const proyecto = pRes.rows[0];
    const jsonField = typeof proyecto.json_field === 'string' ? JSON.parse(proyecto.json_field || '{}') : (proyecto.json_field || {});
    let nuevoEstado = proyecto.id_proyecto_estado;

    // Obtener datos del usuario que registra el documento (Comercial / Contabilidad)
    let nombreRegistrador = 'Ejecutivo Comercial / Contabilidad GSP';
    let emailRegistrador = '';
    if (id_user) {
      try {
        const uRes = await db.query('SELECT name_frst, apellido_pat, email FROM tsec_users WHERE id_user = $1', [id_user]);
        if (uRes.rows.length > 0) {
          nombreRegistrador = `${uRes.rows[0].name_frst || ''} ${uRes.rows[0].apellido_pat || ''}`.trim() || uRes.rows[0].email;
          emailRegistrador = uRes.rows[0].email || '';
        }
      } catch (_) {}
    }

    let ocRecienRegistrada = null;

    // 1. Procesar OC (subida por Comercial, Administración o extraída desde el PDF DTE)
    if (oc && (oc.numero_oc || oc.asumido_sin_oc)) {
      const ahoraIso = new Date().toISOString();
      const ocRegistro = {
        id: oc.id || 'oc-' + Date.now(),
        numero_oc: oc.asumido_sin_oc ? 'S/OC - ASUME EDP' : (oc.numero_oc || '').trim(),
        fecha_emision: oc.fecha_emision || ahoraIso.split('T')[0],
        monto_neto: Number(oc.monto_neto) || 0,
        centro_costo: oc.centro_costo || '',
        archivo: oc.archivo || null,
        observaciones: oc.observaciones || (oc.asumido_sin_oc ? 'Cliente sin OC formal. Se asume monto íntegro del EDP' : ''),
        asumido_sin_oc: Boolean(oc.asumido_sin_oc),
        registrado_por: id_user || null,
        registrado_por_nombre: nombreRegistrador,
        registrado_por_email: emailRegistrador,
        fecha_registro: ahoraIso
      };

      const ordenesCompra = Array.isArray(jsonField.ordenes_compra)
        ? jsonField.ordenes_compra
        : (Array.isArray(jsonField.crm_v1?.ordenes_compra) ? [...jsonField.crm_v1.ordenes_compra] : []);

      const idx = ordenesCompra.findIndex(o => o.numero_oc === ocRegistro.numero_oc || o.id === ocRegistro.id);
      if (idx >= 0) {
        ordenesCompra[idx] = { ...ordenesCompra[idx], ...ocRegistro };
      } else {
        ordenesCompra.unshift(ocRegistro);
      }
      jsonField.ordenes_compra = ordenesCompra;
      jsonField.oc_v1 = ocRegistro;
      if (!jsonField.crm_v1) jsonField.crm_v1 = {};
      jsonField.crm_v1.ordenes_compra = ordenesCompra;

      // Actualizar estado de facturación inmediata en edp_flujo_v1 si existe
      const montoTotalOcs = ordenesCompra.reduce((acc, item) => acc + (Number(item.monto_neto) || 0), 0);
      if (!jsonField.edp_flujo_v1) {
        jsonField.edp_flujo_v1 = {
          estado: 'BORRADOR',
          paso_actual: 1,
          tiene_oc: true,
          monto_total_ocs: montoTotalOcs,
          habilitado_facturar: false
        };
      } else {
        jsonField.edp_flujo_v1.tiene_oc = true;
        jsonField.edp_flujo_v1.monto_total_ocs = montoTotalOcs;
        if (jsonField.edp_flujo_v1.firma_2_contabilidad || jsonField.edp_flujo_v1.firma_1_analista) {
          jsonField.edp_flujo_v1.habilitado_facturar = true;
          jsonField.edp_flujo_v1.estado_facturacion_inmediata = 'HABILITADO_FACTURAR';
        }
      }

      ocRecienRegistrada = ocRegistro;
    }

    // 2. Procesar Factura DTE (Soporte Multi-Factura: Cuotas, Parciales o Mensuales)
    if (factura && (factura.factura_numero || factura.folio_dte)) {
      const RUTS_HOLDING_CLEAN = {
        '520041621': { id: 9, nombre: 'Grúas San Pablo' },
        '762095343': { id: 7, nombre: 'Bestmaq' },
        '762185768': { id: 8, nombre: 'Logística del Sur' },
        '782545353': { id: 11, nombre: 'Royal Rental' }
      };

      const limpiarRutKey = r => String(r || '').replace(/[^0-9kK]/g, '').toUpperCase();

      // Validación 1 (R-2 Fail-Closed): Emisor debe pertenecer al Holding GSP
      const rutEmisorLimpio = limpiarRutKey(factura.rut_emisor);
      if (!rutEmisorLimpio || !RUTS_HOLDING_CLEAN[rutEmisorLimpio]) {
        return res.status(400).json({
          success: false,
          message: `Rechazo Contable: El emisor de la factura (${factura.empresa_facturadora || 'Desconocido'}, RUT ${factura.rut_emisor || 'No especificado'}) no pertenece al holding autorizado (Grúas San Pablo, Bestmaq, Logística del Sur, Royal Rental).`
        });
      }

      // Validación 2 (R-1 Fail-Closed): Calce Mandante Receptor Obligatorio
      const rutReceptorLimpio = limpiarRutKey(factura.cliente_receptor_rut);
      const rutClienteOtLimpio = limpiarRutKey(proyecto.cliente_rut);
      if (!rutReceptorLimpio || !rutClienteOtLimpio || rutReceptorLimpio !== rutClienteOtLimpio) {
        return res.status(400).json({
          success: false,
          message: `Rechazo Contable: La factura N° ${factura.folio_dte || factura.factura_numero} está emitida al RUT ${factura.cliente_receptor_rut || 'Desconocido'} (${factura.cliente_receptor_nombre || 'Desconocido'}), pero este servicio corresponde al cliente ${proyecto.cliente_nombre} (RUT ${proyecto.cliente_rut || 'No definido'}). No se permite asociar DTEs incongruentes o de clientes ajenos.`
        });
      }

      const folioLimpio = String(factura.folio_dte || factura.factura_numero || '').replace(/\./g, '').trim();
      const fechaEmi = factura.fecha_emision || factura.fecha_facturacion || new Date().toISOString().split('T')[0];
      const neto = Math.round(Number(factura.monto_neto) || 0);
      const exento = Math.round(Number(factura.monto_exento) || 0);
      const iva = factura.monto_iva !== undefined ? Math.round(Number(factura.monto_iva)) : Math.round(neto * 0.19);
      const total = factura.monto_total !== undefined
        ? Math.round(Number(factura.monto_total))
        : (factura.monto_bruto !== undefined ? Math.round(Number(factura.monto_bruto)) : (neto + exento + iva));

      const modalidad = factura.modalidad_facturacion || (declarar_facturado ? 'CIERRE_TOTAL' : 'PARCIAL_CUOTA');

      // Inicializar o migrar colección facturas_dte
      let facturasDte = Array.isArray(jsonField.facturas_dte) ? [...jsonField.facturas_dte] : [];
      const prevLiq = jsonField.liquidacion_v1 || jsonField.liquidacion_guardada;
      if (facturasDte.length === 0 && prevLiq && prevLiq.factura_numero) {
        const prevNeto = Math.round(Number(prevLiq.monto_facturado_neto) || 0);
        const prevBruto = Math.round(Number(prevLiq.monto_facturado_bruto) || Math.round(prevNeto * 1.19));
        facturasDte.push({
          id_dte: 'dte-hist-' + String(prevLiq.factura_numero).replace(/\W/g, ''),
          folio_dte: String(prevLiq.factura_numero).trim(),
          formato_detectado: 'MANUAL_HISTORICO',
          id_empresa_emisora: proyecto.id_empresa || 9,
          empresa_facturadora: 'Grúas San Pablo',
          rut_emisor: '52.004.162-1',
          fecha_emision: prevLiq.fecha_facturacion || new Date().toISOString().split('T')[0],
          periodo_contable: (prevLiq.fecha_facturacion || new Date().toISOString()).slice(0, 7),
          monto_exento: 0,
          monto_neto: prevNeto,
          monto_iva: Math.max(0, prevBruto - prevNeto),
          monto_total: prevBruto,
          numero_oc_referenciada: prevLiq.hes_oc_numero || null,
          modalidad_facturacion: 'CIERRE_TOTAL',
          archivo_url: prevLiq.archivo_factura?.url || null,
          registrado_por_nombre: prevLiq.nombre_user_cierre || 'Sistema',
          fecha_registro: prevLiq.fecha_cierre || new Date().toISOString()
        });
      }

      const nuevoDte = {
        id_dte: factura.id_dte || `dte-${Date.now()}`,
        folio_dte: folioLimpio,
        formato_detectado: factura.formato_detectado || 'LAUDUS',
        id_empresa_emisora: factura.id_empresa_emisora || null,
        empresa_facturadora: factura.empresa_facturadora || 'Grúas San Pablo',
        rut_emisor: factura.rut_emisor || '52.004.162-1',
        cliente_receptor_nombre: factura.cliente_receptor_nombre || proyecto.cliente_nombre,
        cliente_receptor_rut: factura.cliente_receptor_rut || proyecto.cliente_rut,
        fecha_emision: fechaEmi,
        fecha_vencimiento: factura.fecha_vencimiento || null,
        periodo_contable: fechaEmi.slice(0, 7),
        monto_exento: exento,
        monto_neto: neto,
        monto_iva: iva,
        monto_total: total,
        numero_oc_referenciada: factura.numero_oc_referenciada || factura.numero_oc_principal || (oc && oc.numero_oc) || jsonField.oc_v1?.numero_oc || null,
        reports_referenciados: factura.reports_referenciados || [],
        ots_referenciadas: factura.ots_referenciadas || [],
        modalidad_facturacion: modalidad,
        observaciones: factura.observaciones || '',
        archivo_url: factura.archivo_url || factura.archivo?.url || null,
        nombre_archivo: factura.nombre_archivo || factura.archivo?.nombre || null,
        registrado_por: id_user || null,
        registrado_por_nombre: nombreRegistrador,
        fecha_registro: new Date().toISOString()
      };

      const dupIdx = facturasDte.findIndex(f =>
        String(f.folio_dte) === String(nuevoDte.folio_dte) &&
        String(f.rut_emisor || '') === String(nuevoDte.rut_emisor || '')
      );
      if (dupIdx >= 0) {
        facturasDte[dupIdx] = { ...facturasDte[dupIdx], ...nuevoDte };
      } else {
        facturasDte.push(nuevoDte);
      }

      jsonField.facturas_dte = facturasDte;

      const sumaNetoDtes = facturasDte.reduce((acc, f) => acc + (Number(f.monto_neto) || 0), 0);
      const sumaIvaDtes = facturasDte.reduce((acc, f) => acc + (Number(f.monto_iva) || 0), 0);
      const sumaTotalDtes = facturasDte.reduce((acc, f) => acc + (Number(f.monto_total) || 0), 0);
      const foliosConcatenados = facturasDte.map(f => f.folio_dte).join(', ');

      const esCierreTotal = Boolean(declarar_facturado || modalidad === 'CIERRE_TOTAL');

      const liquidacionData = {
        hes_oc_numero: nuevoDte.numero_oc_referenciada || (jsonField.oc_v1?.numero_oc || 'S/OC - ASUME EDP'),
        factura_numero: foliosConcatenados,
        fecha_facturacion: nuevoDte.fecha_emision,
        monto_facturado_neto: sumaNetoDtes,
        monto_facturado_iva: sumaIvaDtes,
        monto_facturado_bruto: sumaTotalDtes,
        cantidad_facturas: facturasDte.length,
        modalidad_facturacion: modalidad,
        observaciones_facturacion: nuevoDte.observaciones || '',
        archivo_factura: nuevoDte.archivo_url ? { url: nuevoDte.archivo_url, nombre: nuevoDte.nombre_archivo } : null,
        archivo_oc: (oc && oc.archivo) ? oc.archivo : (jsonField.oc_v1?.archivo || null),
        id_user_cierre: id_user || null,
        nombre_user_cierre: nombreRegistrador,
        fecha_cierre: new Date().toISOString(),
        estado_financiero: esCierreTotal ? 'FACTURADO_CONFORME' : 'FACTURACION_PARCIAL'
      };

      jsonField.liquidacion_v1 = liquidacionData;
      jsonField.liquidacion_guardada = liquidacionData;

      if (esCierreTotal) {
        nuevoEstado = 7; // Facturado / Cerrado
      }
    }

    // Persistir en BD
    await db.query(`
      UPDATE tpry_proyecto
      SET id_proyecto_estado = $1,
          json_field = $2
      WHERE id_proyecto = $3;
    `, [nuevoEstado, JSON.stringify(jsonField), id_proyecto]);

    // 3. Si se registró una Orden de Compra, enviar Constancia Formal y Copia del Documento a Contabilidad
    if (ocRecienRegistrada) {
      const baseUrl = process.env.APP_BASE_URL || 'https://servidor.leanglobal.cl';
      const envPrefix = (process.env.APP_ENV === 'prod') ? '/lg-gsp-prod' : '/lg-gsp-dev';
      const edpPdfUrl = `${baseUrl}${envPrefix}/api/operaciones/edp/proyecto/${id_proyecto}/pdf`;
      const edpYaListo = Boolean(jsonField.edp_flujo_v1?.firma_2_contabilidad || jsonField.edp_flujo_v1?.firma_1_analista);
      const fechaHoraFmt = new Date(ocRecienRegistrada.fecha_registro).toLocaleString('es-CL', { timeZone: 'America/Santiago' });

      const ccList = ['omar.ghiselini@arriendosanpablo.cl', 'logistica@arriendosanpablo.cl'];
      if (emailRegistrador && !ccList.includes(emailRegistrador)) ccList.push(emailRegistrador);

      notificacionService.despacharEmailSmtp({
        para: 'mseguel@arriendosanpablo.cl',
        cc: ccList.join(', '),
        asunto: `[GSP] 📎 Constancia de Recepción OC #${ocRecienRegistrada.numero_oc} — ${proyecto.codi_proyecto} (${proyecto.cliente_nombre})`,
        titulo: `Constancia de Recepción de Orden de Compra: ${proyecto.codi_proyecto}`,
        subtitulo: `Registrada por ${nombreRegistrador} el ${fechaHoraFmt}`,
        contenido: `<p>Se deja constancia formal en el sistema de que <strong>${nombreRegistrador}</strong> ha cargado la <strong>Orden de Compra (OC / HES)</strong> del cliente para el servicio <strong>${proyecto.codi_proyecto}</strong>, remitiendo copia a Contabilidad:</p>
        <div style="background:#0f172a; border:1px solid #334155; border-radius:8px; padding:14px; margin:14px 0; color:#e2e8f0;">
          <p style="margin:4px 0;"><strong>Cliente Mandante:</strong> ${proyecto.cliente_nombre} (${proyecto.cliente_rut || 'S/R'})</p>
          <p style="margin:4px 0;"><strong>N° Orden de Compra / HES:</strong> <span style="color:#38bdf8; font-weight:bold;">${ocRecienRegistrada.numero_oc}</span></p>
          <p style="margin:4px 0;"><strong>Fecha Emisión OC:</strong> ${ocRecienRegistrada.fecha_emision}</p>
          <p style="margin:4px 0;"><strong>Monto Neto OC:</strong> $${Number(ocRecienRegistrada.monto_neto || 0).toLocaleString('es-CL')}</p>
          <p style="margin:4px 0;"><strong>Archivo Adjunto:</strong> ${ocRecienRegistrada.archivo?.nombre || 'Respaldo registrado en sistema'}</p>
          <p style="margin:4px 0;"><strong>Registrado por:</strong> ${nombreRegistrador} (${fechaHoraFmt})</p>
          ${ocRecienRegistrada.observaciones ? `<p style="margin:4px 0;"><strong>Observaciones:</strong> ${ocRecienRegistrada.observaciones}</p>` : ''}
        </div>
        ${edpYaListo ? `
        <div style="background:#064e3b; border:1px solid #10b981; border-radius:8px; padding:12px; margin:12px 0; color:#ecfdf5;">
          🟢 <strong>LISTO PARA FACTURAR INMEDIATAMENTE:</strong> El Estado de Pago de este servicio ya cuenta con validación en sistema y ahora dispone de su Orden de Compra respaldada. Contabilidad puede emitir la Factura DTE de inmediato.
        </div>` : `
        <div style="background:#1e293b; border:1px solid #475569; border-radius:8px; padding:12px; margin:12px 0; color:#cbd5e1;">
          ℹ️ La Orden de Compra ya quedó resguardada en el expediente digital de la OT. Apenas Control de Gestión y Contabilidad validen el EDP, el servicio quedará habilitado para facturar de inmediato.
        </div>`}`,
        botonTexto: 'VER CARÁTULA Y DOSSIER EDP',
        botonUrl: edpPdfUrl
      }).catch(e => console.warn('[EDP Mail Constancia OC]', e.message));
    }

    res.status(200).json({
      success: true,
      message: declarar_facturado
        ? 'Factura DTE registrada y proceso declarado 100% Facturado'
        : (factura
          ? `Factura DTE registrada exitosamente (${(jsonField.facturas_dte || []).length} DTEs acumulados en este servicio)`
          : (ocRecienRegistrada
            ? `Orden de Compra #${ocRecienRegistrada.numero_oc} registrada y enviada con constancia a Contabilidad.`
            : 'Soporte documental guardado exitosamente')),
      data: {
        id_proyecto,
        id_proyecto_estado: nuevoEstado,
        oc: jsonField.oc_v1,
        ordenes_compra: jsonField.ordenes_compra || [],
        facturas_dte: jsonField.facturas_dte || [],
        edp_flujo_v1: jsonField.edp_flujo_v1 || null,
        liquidacion: jsonField.liquidacion_v1
      }
    });
  } catch (error) {
    console.error('[EDP_SOPORTE_DOC] Error al guardar soporte documental:', error);
    res.status(500).json({ success: false, message: 'Error interno al guardar soporte documental', error: error.message });
  }
};

// 11.C Eliminar una Factura DTE individual de la colección multi-factura de un proyecto (Spec 101 / REQ-1070)
exports.eliminarFacturaDteEDP = async (req, res) => {
  try {
    const { id_proyecto, id_dte } = req.params;
    const pRes = await db.query('SELECT id_proyecto, id_proyecto_estado, json_field FROM tpry_proyecto WHERE id_proyecto = $1', [id_proyecto]);
    if (pRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    }

    const proyecto = pRes.rows[0];
    const jsonField = typeof proyecto.json_field === 'string' ? JSON.parse(proyecto.json_field || '{}') : (proyecto.json_field || {});
    let facturasDte = Array.isArray(jsonField.facturas_dte) ? [...jsonField.facturas_dte] : [];
    facturasDte = facturasDte.filter(f => String(f.id_dte) !== String(id_dte) && String(f.folio_dte) !== String(id_dte));
    jsonField.facturas_dte = facturasDte;

    let nuevoEstado = proyecto.id_proyecto_estado;
    if (facturasDte.length === 0) {
      delete jsonField.liquidacion_v1;
      delete jsonField.liquidacion_guardada;
      if (nuevoEstado === 7) nuevoEstado = 6;
    } else {
      const sumaNeto = facturasDte.reduce((acc, f) => acc + (Number(f.monto_neto) || 0), 0);
      const sumaIva = facturasDte.reduce((acc, f) => acc + (Number(f.monto_iva) || 0), 0);
      const sumaTotal = facturasDte.reduce((acc, f) => acc + (Number(f.monto_total) || 0), 0);
      jsonField.liquidacion_v1 = {
        ...(jsonField.liquidacion_v1 || {}),
        factura_numero: facturasDte.map(f => f.folio_dte).join(', '),
        monto_facturado_neto: sumaNeto,
        monto_facturado_iva: sumaIva,
        monto_facturado_bruto: sumaTotal,
        cantidad_facturas: facturasDte.length,
        estado_financiero: 'FACTURACION_PARCIAL'
      };
      jsonField.liquidacion_guardada = jsonField.liquidacion_v1;
    }

    await db.query('UPDATE tpry_proyecto SET id_proyecto_estado = $1, json_field = $2 WHERE id_proyecto = $3', [
      nuevoEstado,
      JSON.stringify(jsonField),
      id_proyecto
    ]);

    return res.status(200).json({
      success: true,
      message: 'Factura DTE desvinculada del servicio.',
      data: {
        facturas_dte: facturasDte,
        liquidacion: jsonField.liquidacion_v1 || null
      }
    });
  } catch (error) {
    console.error('[ELIMINAR_DTE_EDP] Error:', error);
    return res.status(500).json({ success: false, message: 'Error al eliminar factura DTE', error: error.message });
  }
};

// 12. Perspectiva Contabilidad: Embudo Financiero E2E, Matriz de Calce por Proceso, Horas Personal y Ventas por Equipo (Spec 100 / REQ-1069)
exports.getPerspectivaContabilidad = async (req, res) => {
  try {
    const { id_empresa, _id_empresa, fecha_desde, fecha_hasta } = req.query;
    const rawEmp = id_empresa !== undefined && id_empresa !== '' ? id_empresa : _id_empresa;
    const empFilter = (rawEmp && rawEmp !== 'TODAS' && Number(rawEmp) > 0) ? Number(rawEmp) : null;

    // 1. Obtener todos los proyectos comerciales adjudicados / en ejecución / cerrados (id_proyecto_estado >= 3)
    const proyRes = await db.query(`
      SELECT
        p.*,
        COALESCE(clt.razon_social, clt.name_empresa, p.json_field->'crm_v1'->>'cliente_nombre', p.json_field->>'cliente_nombre', 'Cliente Comercial') AS cliente_nombre,
        COALESCE(clt.rut_empresa, p.json_field->'crm_v1'->>'cliente_rut', '') AS cliente_rut,
        its.id_its,
        its.folio_its,
        its.estado_its,
        COALESCE(its.total_ingresos_facturables, 0) AS its_ingresos_neto,
        COALESCE(its.total_costos_operacionales, 0) AS its_costos_operacionales,
        COALESCE(its.utilidad_bruta, 0) AS its_utilidad_bruta,
        COALESCE(its.margen_porcentaje, 0) AS its_margen_pct
      FROM tpry_proyecto p
      LEFT JOIN tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
      LEFT JOIN LATERAL (
        SELECT i.*
        FROM tits_informe_termino i
        WHERE i.id_proyecto = p.id_proyecto
        ORDER BY i.id_its DESC
        LIMIT 1
      ) its ON TRUE
      WHERE p.id_proyecto_estado >= 3
      ORDER BY p.id_proyecto DESC;
    `);

    // 2. Obtener todos los reports diarios con operador, rigger y equipo
    const repsRes = await db.query(`
      SELECT
        ra.id_reporte_avance,
        ra.id_proyecto,
        ra.id_equipo,
        ra.id_user_operador,
        ra.id_user_rigger,
        TO_CHAR(ra.fecha_reporte, 'YYYY-MM-DD') AS fecha_reporte_fmt,
        ra.fecha_reporte,
        COALESCE(ra.horas_operadas, 0) AS horas_operadas,
        COALESCE(ra.horas_facturables, 0) AS horas_facturables,
        COALESCE(ra.horas_sobretiempo, 0) AS horas_sobretiempo,
        COALESCE(ra.horas_minimas, 8) AS horas_minimas,
        COALESCE(ra.horas_colacion, 0) AS horas_colacion,
        ra.estado_reporte,
        ra.ajustes_analista,
        ra.id_doc_pdf,
        ra.dia_correlativo AS folio_correlativo,
        ra.horometro_inicio,
        ra.horometro_termino,
        ra.cliente_nombre AS receptor_faena,
        COALESCE(e.patente, 'S/P') AS equipo_patente,
        COALESCE(NULLIF(TRIM(COALESCE(e.marca, '') || ' ' || COALESCE(e.modelo, '')), ''), e.modelo, 'Equipo Izaje') AS equipo_nombre,
        COALESCE(e.modelo, '') AS equipo_modelo,
        COALESCE(e.marca, '') AS equipo_marca,
        COALESCE(e.tipo_equipo, 'GRUA') AS equipo_tipo,
        COALESCE(e.horometro_grua_acumulado, 0) AS equipo_horo_grua,
        COALESCE(e.horometro_chasis_acumulado, 0) AS equipo_horo_chasis,
        COALESCE(e.odometro_acumulado, 0) AS equipo_odometro,
        0 AS equipo_capacidad_ton,
        COALESCE(u_op.name_frst || ' ' || u_op.apellido_pat, u_op.email, 'Operador') AS operador_nombre,
        COALESCE(u_op.rut, '') AS operador_rut,
        COALESCE(u_op.email, '') AS operador_email,
        CASE WHEN ra.id_user_rigger IS NOT NULL THEN COALESCE(u_rig.name_frst || ' ' || u_rig.apellido_pat, u_rig.email, 'Rigger') ELSE NULL END AS rigger_nombre,
        COALESCE(u_rig.rut, '') AS rigger_rut,
        COALESCE(u_rig.email, '') AS rigger_email
      FROM tedp_reporte_avance ra
      LEFT JOIN tequ_equipo e ON ra.id_equipo = e.id_equipo
      LEFT JOIN tsec_users u_op ON ra.id_user_operador = u_op.id_user
      LEFT JOIN tsec_users u_rig ON ra.id_user_rigger = u_rig.id_user
      WHERE ra.estado_reporte != 'JORNADA_EN_CURSO'
        AND NOT (ra.fecha_termino_servicio IS NULL AND COALESCE(ra.horas_operadas, 0) <= 0 AND COALESCE(ra.horas_facturables, 0) <= 0)
      ORDER BY ra.fecha_reporte DESC, ra.id_reporte_avance DESC;
    `);

    // 2.b Catálogo de Tarifas Operador (tpar_tarifa_operador) para liquidación de Horas Operadores
    const tarifasOpRes = await db.query(`
      SELECT * FROM tpar_tarifa_operador WHERE activo = TRUE ORDER BY id_tarifa ASC;
    `).catch(() => ({ rows: [] }));
    const catalogoTarifasOp = tarifasOpRes.rows || [];

    function resolverValorHoraOperadorDesdeLineas(lineas = [], modeloEquipo = '', tipoEquipo = '') {
      const texto = `${lineas.map(l => `${l.tipo || ''} ${l.subcategoria || ''} ${l.descripcion || ''}`).join(' ')} ${modeloEquipo} ${tipoEquipo}`.toUpperCase();
      const tonMatch = texto.match(/(\d{2,3})\s*(?:T|TON)/i);
      const ton = tonMatch ? Number(tonMatch[1]) : 0;
      if (ton >= 300) return 15000;
      if (ton >= 200) return 12000;
      if (ton >= 130) return 10000;
      if (ton >= 100) return 8000;
      if (ton >= 80) return 7000;
      if (ton >= 60) return 6000;
      if (ton >= 25) return 5000;
      if (texto.includes('HORQUILLA')) return 3000;
      if (texto.includes('TRACTO') || texto.includes('CAMA BAJA')) return 7000;
      if (texto.includes('PLUMA') || texto.includes('MANITOU') || texto.includes('MANIPULADOR')) return 5000;
      if (catalogoTarifasOp.length > 0) {
        const found = catalogoTarifasOp.find(t => texto.includes(String(t.nombre_mostrar || '').toUpperCase()));
        if (found) return Number(found.valor_hora_clp) || 5000;
      }
      return 5000;
    }

    // 2.c Obtener Movimientos de Salida de Bodega (tinv_movimiento + tmnt_ot_repuesto) para Reporte Salidas Bodega
    const salidasKardexRes = await db.query(`
      SELECT
        m.id_movimiento,
        TO_CHAR(m.fecha_movimiento, 'YYYY-MM-DD') AS fecha_fmt,
        EXTRACT(MONTH FROM m.fecha_movimiento)::int AS mes_num,
        m.tipo_movimiento,
        m.documento_tipo,
        m.documento_folio,
        m.cantidad,
        COALESCE(m.costo_unitario_pmp, p.costo_pmp_vigente, 0) AS precio_unitario,
        ROUND(COALESCE(m.cantidad, 0) * COALESCE(m.costo_unitario_pmp, p.costo_pmp_vigente, 0)) AS costo_total,
        COALESCE(p.codigo_legado, p.sku, 'S/C') AS codigo,
        COALESCE(p.nombre, 'Insumo / Repuesto') AS producto,
        COALESCE(p.familia, 'GENERAL') AS familia,
        COALESCE(NULLIF(m.usuario_registro, ''), TRIM(CONCAT(u_reg.name_frst, ' ', COALESCE(u_reg.apellido_pat, ''))), u_reg.email, 'Taller / Bodega') AS retira,
        m.observaciones,
        COALESCE(m.id_empresa, 9) AS id_empresa
      FROM tinv_movimiento m
      JOIN tinv_producto p ON m.id_producto = p.id_producto
      LEFT JOIN tsec_users u_reg ON u_reg.id_user = m.id_usuario
      WHERE m.tipo_movimiento IN ('SALIDA_OT', 'CONSUMO', 'AJUSTE_NEGATIVO')
      ORDER BY m.fecha_movimiento DESC, m.id_movimiento DESC;
    `).catch(() => ({ rows: [] }));

    const salidasOtRepRes = await db.query(`
      SELECT
        r.id_ot_repuesto,
        ot.numero_ot,
        TO_CHAR(COALESCE(ot.fecha_creacion, NOW()), 'YYYY-MM-DD') AS fecha_fmt,
        EXTRACT(MONTH FROM COALESCE(ot.fecha_creacion, NOW()))::int AS mes_num,
        COALESCE(p.codigo_legado, p.sku, 'REP-' || r.id_ot_repuesto) AS codigo,
        COALESCE(r.descripcion_material, p.nombre, 'Repuesto OT') AS producto,
        COALESCE(p.familia, 'REPUESTOS') AS familia,
        r.cantidad,
        COALESCE(r.costo_unitario, p.costo_pmp_vigente, 0) AS precio_unitario,
        COALESCE(r.costo_total, ROUND(COALESCE(r.cantidad, 0) * COALESCE(r.costo_unitario, p.costo_pmp_vigente, 0))) AS costo_total,
        COALESCE(eq.patente, ot.numero_ot, 'TALLER') AS centro_costo,
        COALESCE(eq.tipo_equipo, 'MAQUINARIA') AS tipo_equipo,
        COALESCE(TRIM(CONCAT(u_tec.name_frst, ' ', COALESCE(u_tec.apellido_pat, ''))), 'Mecánico Taller') AS retira,
        COALESCE(r.id_empresa, 9) AS id_empresa,
        r.estado
      FROM tmnt_ot_repuesto r
      JOIN tmnt_ot ot ON ot.id_ot = r.id_ot
      LEFT JOIN tequ_equipo eq ON eq.id_equipo = ot.id_equipo
      LEFT JOIN tinv_producto p ON p.id_producto = r.id_producto
      LEFT JOIN tsec_users u_tec ON u_tec.id_user = ot.id_usuario_responsable
      WHERE COALESCE(r.estado, 'ACTIVO') != 'DEVUELTO'
      ORDER BY r.id_ot_repuesto DESC;
    `).catch(() => ({ rows: [] }));

    // 3. Obtener catálogo de equipos asignados a proyectos (tpry_rel_equipo + tequ_equipo)
    const relEqRes = await db.query(`
      SELECT
        re.id_proyecto,
        re.id_equipo,
        COALESCE(e.patente, 'S/P') AS patente,
        COALESCE(NULLIF(TRIM(COALESCE(e.marca, '') || ' ' || COALESCE(e.modelo, '')), ''), e.modelo, 'Equipo') AS nombre_equipo,
        COALESCE(e.modelo, '') AS modelo,
        COALESCE(e.tipo_equipo, 'GRUA') AS tipo_equipo,
        0 AS capacidad_ton
      FROM tpry_rel_equipo re
      INNER JOIN tequ_equipo e ON re.id_equipo = e.id_equipo;
    `).catch(() => ({ rows: [] }));

    // 4. Obtener costos de viáticos / alimentación / pensiones en ITS por proyecto
    const costosItsRes = await db.query(`
      SELECT
        its.id_proyecto,
        ci.categoria_costo,
        ci.descripcion_item,
        COALESCE(ci.monto_total, 0) AS monto_total,
        ci.metadatos_json
      FROM tits_costo_item ci
      INNER JOIN tits_informe_termino its ON ci.id_its = its.id_its;
    `).catch(() => ({ rows: [] }));

    // 5. Obtener OCs de Proveedores (Costos) asociadas a cada OT
    const ocsProvRes = await db.query(`
      SELECT
        oc.id_oc,
        oc.id_proyecto,
        oc.folio_oc,
        COALESCE(oc.proveedor_nombre, 'Proveedor') AS proveedor_nombre,
        COALESCE(oc.proveedor_rut, '') AS proveedor_rut,
        COALESCE(oc.monto_neto, 0) AS monto_neto,
        COALESCE(oc.monto_total, 0) AS monto_total,
        COALESCE(oc.estado_oc, 'EMITIDA') AS estado_oc,
        TO_CHAR(oc.fecha_emision, 'YYYY-MM-DD') AS fecha_emision_fmt
      FROM tcmp_orden_compra oc
      WHERE oc.id_proyecto IS NOT NULL
      ORDER BY oc.id_oc DESC;
    `).catch(() => ({ rows: [] }));

    const ocsProvPorProyecto = new Map();
    for (const oc of ocsProvRes.rows) {
      if (!ocsProvPorProyecto.has(oc.id_proyecto)) {
        ocsProvPorProyecto.set(oc.id_proyecto, []);
      }
      ocsProvPorProyecto.get(oc.id_proyecto).push(oc);
    }

    // Indexar reports por proyecto
    const reportsPorProyecto = new Map();
    for (const r of repsRes.rows) {
      if (!reportsPorProyecto.has(r.id_proyecto)) {
        reportsPorProyecto.set(r.id_proyecto, []);
      }
      reportsPorProyecto.get(r.id_proyecto).push(r);
    }

    // Indexar equipos asignados por proyecto
    const equiposPorProyecto = new Map();
    for (const eq of relEqRes.rows) {
      if (!equiposPorProyecto.has(eq.id_proyecto)) {
        equiposPorProyecto.set(eq.id_proyecto, []);
      }
      equiposPorProyecto.get(eq.id_proyecto).push(eq);
    }

    // Indexar viáticos y combustible por proyecto
    const viaticosPorProyecto = new Map();
    const combustiblePorProyecto = new Map();
    for (const c of costosItsRes.rows) {
      const cat = String(c.categoria_costo || '').toUpperCase();
      if (cat.includes('PENSION') || cat.includes('ALIMENTA') || cat.includes('VIATICO') || cat.includes('ALOJAMIENTO')) {
        viaticosPorProyecto.set(c.id_proyecto, (viaticosPorProyecto.get(c.id_proyecto) || 0) + Number(c.monto_total || 0));
      }
      if (cat.includes('COMBUSTIBLE') || cat.includes('PETROLEO')) {
        if (!combustiblePorProyecto.has(c.id_proyecto)) {
          combustiblePorProyecto.set(c.id_proyecto, []);
        }
        combustiblePorProyecto.get(c.id_proyecto).push(c);
      }
    }

    const EMPRESAS_HOLDING = {
      9: 'Grúas San Pablo',
      7: 'Bestmaq',
      8: 'Logística del Sur',
      11: 'Royal Rental'
    };
    const RUTS_HOLDING = {
      9: '76.143.620-1',
      7: '76.209.534-3',
      8: '76.218.576-8',
      11: '78.254.535-3'
    };

    const procesos = [];
    let kpiComprometidoNeto = 0;
    let kpiComprometidoOts = 0;
    let kpiDevengadoNeto = 0;
    let kpiDevengadoReports = 0;
    let kpiDevengadoHoras = 0;
    let kpiCerradoItsNeto = 0;
    let kpiCerradoItsCostos = 0;
    let kpiCerradoItsCount = 0;
    let kpiEmitidoEdpNeto = 0;
    let kpiEmitidoEdpCount = 0;
    let kpiListosFacturarNeto = 0;
    let kpiListosFacturarCount = 0;
    let kpiFacturadoNeto = 0;
    let kpiFacturadoBruto = 0;
    let kpiFacturadoCount = 0;

    // Mapas para Submenú 2 (Horas Operadores/Riggers), Submenú 3 (Ventas por Grúa/Equipo) y Submenú 4 (Combustible)
    const mapaTrabajadores = new Map();
    const detalleJornadasPersonal = [];
    const mapaEquipos = new Map();
    const detalleAsignacionesEquipo = [];
    const mapaCombustibleVehiculos = new Map();
    const detalleCargasCombustible = [];

    for (const p of proyRes.rows) {
      const jf = typeof p.json_field === 'string' ? JSON.parse(p.json_field || '{}') : (p.json_field || {});
      const crmV1 = jf.crm_v1 || {};
      const codi = String(p.codi_proyecto || '');

      // Excluir movimientos internos
      const esInterno = Boolean(
        crmV1.es_requerimiento_interno ||
        jf.es_interno ||
        codi.startsWith('INT-')
      );
      if (esInterno) continue;

      const empId = Number(p.id_empresa || crmV1.id_empresa_emisora || 9);
      if (empFilter && empFilter !== empId) {
        continue;
      }

      const repsProyecto = reportsPorProyecto.get(p.id_proyecto) || [];
      const fechaRef = p.fecha_plan_ini || p.fecha_creacion;
      const tieneReportsEnRango = repsProyecto.some(r => {
        if (!r.fecha_reporte_fmt) return false;
        if (fecha_desde && r.fecha_reporte_fmt < fecha_desde) return false;
        if (fecha_hasta && r.fecha_reporte_fmt > fecha_hasta) return false;
        return true;
      });
      if (!tieneReportsEnRango) {
        if (fecha_desde && fechaRef && new Date(fechaRef) < new Date(fecha_desde)) continue;
        if (fecha_hasta && fechaRef && new Date(fechaRef) > new Date(fecha_hasta + 'T23:59:59')) continue;
      }

      const empresaCorto = EMPRESAS_HOLDING[empId] || p.empresa_emisora_nombre || 'Grúas San Pablo';
      const vendedorNombre = crmV1.vendedor_nombre || jf.vendedor_nombre || 'Comercial GSP';
      const obraNombre = crmV1.obra_nombre || jf.obra_nombre || p.nombre_proyecto || 'Faena';
      const distanciaKm = Number(crmV1.distancia_km ?? crmV1.snapshot_comercial?.distancia_km ?? 0);

      // 1. Calcular Monto Comprometido (Cotización Ganada / Líneas de Servicio)
      const lineas = crmV1.lineas_servicio || jf.snapshot_comercial?.lines || jf.lines || [];
      let montoLineasCotizadas = 0;
      let montoEquiposCotizado = 0;
      let montoFleteCotizado = 0;
      let montoOtrosCotizado = 0;

      for (const l of lineas) {
        const valUnit = Number(l.valorUnitario || l.precio_unitario || l.tarifa || 0);
        const cant = Number(l.cantidad || 1);
        const hrsOpm = Number(l.cantidad_horas ?? l.pisoMinimo ?? l.horas_minimas ?? 0);
        const dias = Number(l.cantidad_dias ?? 1);
        let sub = Number(l.subtotal_calculado || l.subtotal || 0);
        if (!sub) {
          const unidadStr = String(l.unidad || '').toLowerCase();
          if (hrsOpm > 0 && (unidadStr.includes('hora') || unidadStr.includes('minima') || unidadStr.includes('diari'))) {
            sub = valUnit * hrsOpm * dias * cant;
          } else {
            sub = valUnit * cant;
          }
        }
        montoLineasCotizadas += sub;

        const tipoUpper = String(l.tipo || '').toUpperCase();
        const subcatUpper = String(l.subcategoria || '').toUpperCase();
        if (tipoUpper === 'TRASLADOS' || subcatUpper.includes('FLETE') || subcatUpper.includes('CAMA BAJA')) {
          montoFleteCotizado += sub;
        } else if (['GRUAS TELESCOPICAS', 'GRUA HORQUILLA', 'MANIPULADOR TELESCOPICO', 'CAMION PLUMA', 'ALZAHOMBRES / PLATAFORMAS'].includes(tipoUpper)) {
          montoEquiposCotizado += sub;
        } else {
          montoOtrosCotizado += sub;
        }
      }

      const netoCrm = Number(crmV1.totales?.neto || jf.totales?.neto || 0);
      const itsIngresosNeto = Number(p.its_ingresos_neto || 0);
      const ordenesCompra = Array.isArray(jf.ordenes_compra)
        ? jf.ordenes_compra
        : (Array.isArray(crmV1.ordenes_compra) ? crmV1.ordenes_compra : []);
      const montoOcNeto = ordenesCompra.reduce((acc, o) => acc + (Number(o.monto_neto) || 0), 0) || Number(jf.oc_v1?.monto_neto || 0);

      // Priorizar el valor oficial contractual más fidedigno (OC mandante > Cotización > ITS)
      let montoComprometido = montoLineasCotizadas > 0 ? Math.round(montoLineasCotizadas) : 0;
      if (montoOcNeto > 0 && montoComprometido < montoOcNeto) {
        montoComprometido = Math.round(montoOcNeto);
      }
      if (netoCrm > 0 && montoComprometido < netoCrm) {
        montoComprometido = Math.round(netoCrm);
      }
      if (itsIngresosNeto > 0 && montoComprometido < itsIngresosNeto) {
        montoComprometido = Math.round(itsIngresosNeto);
      }

      // 2. Calcular Devengado por Reports Diarios
      const totalReports = repsProyecto.length;
      const reportsValidados = repsProyecto.filter(r => r.estado_reporte === 'VALIDADO_ANALISTA').length;
      const reportsPendientes = repsProyecto.filter(r => r.estado_reporte !== 'VALIDADO_ANALISTA').length;

      let horasOperadasPry = 0;
      let horasFacturablesPry = 0;
      let horasSobretiempoPry = 0;
      for (const r of repsProyecto) {
        horasOperadasPry += Number(r.horas_operadas || 0);
        horasFacturablesPry += Number(r.horas_facturables || r.horas_operadas || 0);
        horasSobretiempoPry += Number(r.horas_sobretiempo || 0);
      }

      let montoDevengadoReports = 0;
      if (totalReports > 0) {
        if (itsIngresosNeto > 0) {
          montoDevengadoReports = Math.round(itsIngresosNeto);
        } else {
          // Valorizar según líneas tarifarias y horas reales de reports
          let subDev = 0;
          if (lineas.length > 0) {
            const diasFaena = Math.max(1, totalReports);
            const lineasHorariasCount = Math.max(1, lineas.filter(l => {
              const u = String(l.unidad || '').trim().toLowerCase();
              const v = Number(l.valorUnitario || l.precio_unitario || 0);
              return (u.includes('hora') || u.includes('minima')) && v > 0 && v < 350000;
            }).length);
            for (const l of lineas) {
              const valUnit = Number(l.valorUnitario || l.precio_unitario || 0);
              const cant = Number(l.cantidad || 1);
              const hrsOpm = Number(l.cantidad_horas ?? l.pisoMinimo ?? l.horas_minimas ?? 0);
              const dias = Number(l.cantidad_dias ?? 1);
              let sub = Number(l.subtotal_calculado || l.subtotal || 0);
              if (!sub) {
                const unidadStr = String(l.unidad || '').toLowerCase();
                if (hrsOpm > 0 && (unidadStr.includes('hora') || unidadStr.includes('minima') || unidadStr.includes('diari'))) {
                  sub = valUnit * hrsOpm * dias * cant;
                } else {
                  sub = valUnit * cant;
                }
              }

              const tipoUpper = String(l.tipo || '').toUpperCase();
              const subcatUpper = String(l.subcategoria || '').toUpperCase();
              const unidadLower = String(l.unidad || '').trim().toLowerCase();

              if (isLineaCobroUnico(l)) {
                // SPEC-128: Cobro único (Valor Fijo / TRASLADOS) -> 1 × valUnit
                subDev += valUnit;
              } else if (['GRUAS TELESCOPICAS', 'GRUA HORQUILLA', 'MANIPULADOR TELESCOPICO', 'CAMION PLUMA'].includes(tipoUpper)) {
                if (['diario', 'dia', 'día', 'jornada'].includes(unidadLower)) {
                  subDev += valUnit * diasFaena * cant;
                } else if ((unidadLower.includes('hora') || unidadLower.includes('minima')) && valUnit < 350000) {
                  const hrsAplicar = horasFacturablesPry > 0 ? (horasFacturablesPry / lineasHorariasCount) : (hrsOpm > 0 ? hrsOpm : (cant * 8));
                  subDev += valUnit * hrsAplicar;
                } else {
                  subDev += sub;
                }
              } else {
                subDev += sub;
              }
            }
            const stOverride = (jf.edp_ajustes_v1?.sobretiempo_override !== null && jf.edp_ajustes_v1?.sobretiempo_override !== undefined)
              ? Number(jf.edp_ajustes_v1.sobretiempo_override)
              : 0;
            if (stOverride > 0) {
              subDev += stOverride;
            }
          }
          montoDevengadoReports = subDev > 0 ? Math.round(subDev) : montoComprometido;
        }
      } else if (p.id_proyecto_estado >= 6 && itsIngresosNeto > 0) {
        montoDevengadoReports = Math.round(itsIngresosNeto);
      }

      if (montoOcNeto > 0 && totalReports > 0 && montoDevengadoReports < montoOcNeto) {
        montoDevengadoReports = Math.round(montoOcNeto);
      }

      // Invariante contable: el devengado operativo no puede superar el comprometido contractual salvo override explícito de Tesorería
      const tieneOverrideTesoreria = Boolean(jf.edp_ajustes_v1?.lineas_ajustadas?.length || jf.edp_ajustes_v1?.sobretiempo_override);
      if (!tieneOverrideTesoreria && montoComprometido > 0 && montoDevengadoReports > montoComprometido) {
        montoDevengadoReports = montoComprometido;
      }

      // 3. Cerrado en ITS (Gestión Interna)
      const tieneIts = Boolean(p.id_its);
      const itsCerrado = p.estado_its === 'CONCLUIDO' || p.estado_its === 'EN_REVISION_CONTABILIDAD' || p.estado_its === 'EN_REVISION_OPERACIONES';
      const rawItsNeto = itsIngresosNeto > 0 ? Math.round(itsIngresosNeto) : (montoDevengadoReports > 0 ? montoDevengadoReports : 0);
      const montoItsNeto = (!tieneOverrideTesoreria && montoComprometido > 0 && rawItsNeto > montoComprometido)
        ? montoComprometido
        : (rawItsNeto > 0 ? rawItsNeto : montoComprometido);
      const montoItsCostos = Math.round(Number(p.its_costos_operacionales || 0));
      const margenItsPct = Number(p.its_margen_pct || (montoItsNeto > 0 ? (((montoItsNeto - montoItsCostos) / montoItsNeto) * 100).toFixed(1) : 0));

      // 4. Estado de Pago (EDP) y Circuito de 3 Firmas FES + OC
      const requiereOcHes = Boolean(crmV1.requiere_oc_hes ?? jf.datos_generales?.requiere_oc_hes ?? false);
      const tieneOc = ordenesCompra.length > 0 || Boolean(jf.oc_v1?.numero_oc);
      const numeroOc = jf.oc_v1?.numero_oc || ordenesCompra[0]?.numero_oc || null;

      const edpFlujo = jf.edp_flujo_v1 || null;
      const liqV1 = jf.liquidacion_v1 || jf.liquidacion_guardada || null;

      // Construir lista normalizada de facturas DTE (Soporte Multi-Factura: Cuotas, Parciales o Mensuales)
      let facturasDteLista = Array.isArray(jf.facturas_dte) ? [...jf.facturas_dte] : [];
      if (facturasDteLista.length === 0 && liqV1?.factura_numero) {
        const netHist = Math.round(Number(liqV1.monto_facturado_neto || 0));
        const bruHist = Math.round(Number(liqV1.monto_facturado_bruto || Math.round(netHist * 1.19)));
        facturasDteLista.push({
          id_dte: 'dte-hist-' + String(liqV1.factura_numero).replace(/\W/g, ''),
          folio_dte: String(liqV1.factura_numero).trim(),
          formato_detectado: 'LAUDUS',
          id_empresa_emisora: empId,
          empresa_facturadora: empresaCorto,
          rut_emisor: empId === 7 ? '76.209.534-3' : (empId === 8 ? '76.218.576-8' : (empId === 11 ? '78.254.535-3' : '52.004.162-1')),
          fecha_emision: liqV1.fecha_facturacion || (p.fecha_plan_fin ? new Date(p.fecha_plan_fin).toISOString().split('T')[0] : null),
          periodo_contable: (liqV1.fecha_facturacion || '').slice(0, 7) || null,
          monto_exento: 0,
          monto_neto: netHist,
          monto_iva: Math.max(0, bruHist - netHist),
          monto_total: bruHist,
          numero_oc_referenciada: liqV1.hes_oc_numero || numeroOc || null,
          modalidad_facturacion: 'CIERRE_TOTAL',
          archivo_url: liqV1.archivo_factura?.url || null
        });
      }

      const tieneFacturasEmitidas = facturasDteLista.length > 0 || Boolean(p.id_proyecto_estado === 7 || liqV1?.factura_numero);

      const f1Analista = edpFlujo?.firma_1_analista || null;
      const f2Contabilidad = edpFlujo?.firma_2_contabilidad || null;
      const f3Comercial = edpFlujo?.firma_3_comercial || jf.edp_firma_comercial || null;

      // Desacople Contabilidad (Acuerdo Maritza Seguel / Jorge Ponce):
      // Al validar los reports de terreno o emitir el EDP, queda liberado para facturación sin exigir 2° firma contable.
      const edpEmitido = Boolean(f1Analista || f2Contabilidad || f3Comercial || tieneFacturasEmitidas || p.estado_its === 'CONCLUIDO');
      const edpLiberado = Boolean(totalReports > 0 || edpEmitido || tieneFacturasEmitidas || p.estado_its === 'CONCLUIDO');

      // Monto EDP de referencia (con ajustes de tesorería si existen)
      const descuentoTesoreria = Number(jf.edp_ajustes_v1?.descuento_tesoreria || 0);
      const baseEdpCalculado = Math.max(0, (montoDevengadoReports > 0 ? montoDevengadoReports : montoComprometido) - descuentoTesoreria);
      const montoEdpReferencia = Number(edpFlujo?.monto_edp_neto || 0) > 0
        ? Math.round(Number(edpFlujo.monto_edp_neto))
        : Math.round(baseEdpCalculado);
      const montoEdpEmitido = edpEmitido ? montoEdpReferencia : 0;

      // 5. Facturado DTE (Suma acumulada de todas las facturas DTE del servicio)
      const sumaNetoDtes = facturasDteLista.reduce((acc, f) => acc + (Number(f.monto_neto) || 0), 0);
      const sumaIvaDtes = facturasDteLista.reduce((acc, f) => acc + (Number(f.monto_iva) || 0), 0);
      const sumaTotalDtes = facturasDteLista.reduce((acc, f) => acc + (Number(f.monto_total) || 0), 0);

      const montoFacturadoNeto = sumaNetoDtes > 0
        ? Math.round(sumaNetoDtes)
        : (tieneFacturasEmitidas ? Math.round(Number(liqV1?.monto_facturado_neto || montoEdpReferencia || montoComprometido)) : 0);
      const montoFacturadoIva = sumaIvaDtes > 0
        ? Math.round(sumaIvaDtes)
        : Math.round(montoFacturadoNeto * 0.19);
      const montoFacturadoBruto = sumaTotalDtes > 0
        ? Math.round(sumaTotalDtes)
        : (tieneFacturasEmitidas ? Math.round(Number(liqV1?.monto_facturado_bruto || Math.round(montoFacturadoNeto * 1.19))) : 0);

      const facturaNumero = facturasDteLista.length > 0
        ? facturasDteLista.map(f => f.folio_dte).join(', ')
        : (liqV1?.factura_numero || null);
      const fechaFacturacion = facturasDteLista.length > 0
        ? facturasDteLista[facturasDteLista.length - 1].fecha_emision
        : (liqV1?.fecha_facturacion || null);

      // Calce y Saldo Pendiente
      const montoBaseComparacion = montoEdpEmitido > 0 ? montoEdpEmitido : (montoDevengadoReports > 0 ? montoDevengadoReports : montoComprometido);
      const variacionEdpVsCotizado = montoBaseComparacion - montoComprometido;
      const variacionPct = montoComprometido > 0
        ? Number(((variacionEdpVsCotizado / montoComprometido) * 100).toFixed(1))
        : 0;
      const saldoPendienteFacturar = Math.max(0, montoBaseComparacion - montoFacturadoNeto);

      const esCierreTotalFacturado = Boolean(
        tieneFacturasEmitidas &&
        (p.id_proyecto_estado === 7 || liqV1?.estado_financiero === 'FACTURADO_CONFORME' || saldoPendienteFacturar === 0) &&
        liqV1?.estado_financiero !== 'FACTURACION_PARCIAL'
      );
      const esFacturacionParcial = Boolean(tieneFacturasEmitidas && !esCierreTotalFacturado);
      const facturado = tieneFacturasEmitidas;
      const esDevueltoConObs = ['DEVUELTO_CONTABILIDAD', 'OBSERVADO_CONTABILIDAD'].includes(edpFlujo?.estado);
      const habilitadoFacturar = Boolean(!esCierreTotalFacturado && !esDevueltoConObs && edpLiberado && (!requiereOcHes || tieneOc));

      // Estado / Semáforo Contable
      let semaforoContable = 'ADJUDICADO_SIN_REPORTS';
      let semaforoLabel = 'Adjudicado (Sin Reports)';
      if (esCierreTotalFacturado) {
        semaforoContable = 'FACTURADO';
        semaforoLabel = `100% Facturado (${facturasDteLista.length || 1} DTE: #${facturaNumero || 'OK'})`;
      } else if (esFacturacionParcial) {
        semaforoContable = 'FACTURACION_PARCIAL';
        semaforoLabel = `Facturación Parcial (${facturasDteLista.length} DTE · Saldo ${ '$' + saldoPendienteFacturar.toLocaleString('es-CL') })`;
      } else if (esDevueltoConObs) {
        semaforoContable = 'DEVUELTO_OBS';
        semaforoLabel = 'Devuelto con Obs. a Control Gestión';
      } else if (habilitadoFacturar) {
        semaforoContable = 'LISTO_FACTURAR';
        semaforoLabel = 'Listo para Facturar Inmediato';
      } else if (edpLiberado && requiereOcHes && !tieneOc) {
        semaforoContable = 'FALTA_OC';
        semaforoLabel = 'EDP Liberado — Esperando OC Cliente';
      } else if (edpEmitido) {
        semaforoContable = 'EN_CIRCUITO_EDP';
        semaforoLabel = 'En Circuito de Firmas EDP';
      } else if (totalReports > 0) {
        semaforoContable = 'DEVENGANDO_FAENA';
        semaforoLabel = 'Devengando en Terreno (Con Reports)';
      }

      // Acumular KPIs Globales
      kpiComprometidoNeto += montoComprometido;
      kpiComprometidoOts += 1;
      if (totalReports > 0 || montoDevengadoReports > 0) {
        kpiDevengadoNeto += montoDevengadoReports;
        kpiDevengadoReports += totalReports;
        kpiDevengadoHoras += horasFacturablesPry;
      }
      if (tieneIts && montoItsNeto > 0) {
        kpiCerradoItsNeto += montoItsNeto;
        kpiCerradoItsCostos += montoItsCostos;
        kpiCerradoItsCount += 1;
      }
      if (edpEmitido) {
        kpiEmitidoEdpNeto += montoEdpEmitido;
        kpiEmitidoEdpCount += 1;
      }
      if (habilitadoFacturar) {
        kpiListosFacturarNeto += saldoPendienteFacturar > 0 ? saldoPendienteFacturar : montoEdpReferencia;
        kpiListosFacturarCount += 1;
      }
      if (facturado) {
        kpiFacturadoNeto += montoFacturadoNeto;
        kpiFacturadoBruto += montoFacturadoBruto;
        kpiFacturadoCount += Math.max(1, facturasDteLista.length);
      }

      procesos.push({
        id_proyecto: p.id_proyecto,
        codi_proyecto: p.codi_proyecto || `OT-${p.id_proyecto}`,
        nombre_proyecto: p.nombre_proyecto || obraNombre,
        obra_nombre: obraNombre,
        id_proyecto_estado: p.id_proyecto_estado,
        id_empresa: empId,
        empresa_emisora: empresaCorto,
        cliente_nombre: p.cliente_nombre,
        cliente_rut: p.cliente_rut,
        vendedor_nombre: vendedorNombre,
        distancia_km: distanciaKm,
        fecha_inicio: p.fecha_plan_ini ? new Date(p.fecha_plan_ini).toISOString().split('T')[0] : null,
        fecha_termino: p.fecha_plan_fin ? new Date(p.fecha_plan_fin).toISOString().split('T')[0] : null,
        // 1. Comprometido
        monto_comprometido: montoComprometido,
        requiere_oc_hes: requiereOcHes,
        tiene_oc: tieneOc,
        numero_oc: numeroOc,
        monto_oc_neto: montoOcNeto,
        ordenes_compra: ordenesCompra,
        ocs_proveedor: ocsProvPorProyecto.get(p.id_proyecto) || [],
        // 2. Devengado (Reports)
        total_reports: totalReports,
        reports_validados: reportsValidados,
        reports_pendientes: reportsPendientes,
        horas_operadas: Number(horasOperadasPry.toFixed(1)),
        horas_facturables: Number(horasFacturablesPry.toFixed(1)),
        horas_sobretiempo: Number(horasSobretiempoPry.toFixed(1)),
        monto_devengado_reports: montoDevengadoReports,
        reports_lista: repsProyecto.map(r => ({
          id_reporte_avance: r.id_reporte_avance,
          fecha: r.fecha_reporte_fmt,
          operador: r.operador_nombre,
          rigger: r.rigger_nombre,
          equipo_patente: r.equipo_patente,
          equipo_modelo: r.equipo_modelo || r.equipo_nombre,
          horas_operadas: Number(r.horas_operadas || 0),
          horas_facturables: Number(r.horas_facturables || r.horas_operadas || 0),
          horas_sobretiempo: Number(r.horas_sobretiempo || 0),
          estado_reporte: r.estado_reporte
        })),
        // 3. ITS (Gestión Interna)
        id_its: p.id_its || null,
        folio_its: p.folio_its || null,
        estado_its: p.estado_its || 'SIN_ITS',
        monto_its_neto: montoItsNeto,
        monto_its_costos: montoItsCostos,
        margen_its_pct: margenItsPct,
        // 4. EDP (Prefactura Comercial y 3 Firmas FES)
        edp_emitido: edpEmitido,
        edp_estado: edpFlujo?.estado || (esCierreTotalFacturado ? 'FACTURADO_CONFORME' : (edpEmitido ? 'EMITIDO' : 'PENDIENTE')),
        edp_paso_actual: edpFlujo?.paso_actual || 1,
        firma_1_analista: f1Analista,
        firma_2_contabilidad: f2Contabilidad,
        firma_3_comercial: f3Comercial,
        observacion_devolucion: edpFlujo?.observacion_devolucion || null,
        monto_edp_neto: montoEdpEmitido,
        monto_edp_referencia: montoEdpReferencia,
        habilitado_facturar: habilitadoFacturar,
        // 5. Facturado DTE (Multi-Factura) & Calce
        facturado,
        facturacion_parcial: esFacturacionParcial,
        facturas_count: facturasDteLista.length,
        facturas_dte: facturasDteLista,
        factura_numero: facturaNumero,
        fecha_facturacion: fechaFacturacion,
        monto_facturado_neto: montoFacturadoNeto,
        monto_facturado_iva: montoFacturadoIva,
        monto_facturado_bruto: montoFacturadoBruto,
        saldo_pendiente_facturar: saldoPendienteFacturar,
        variacion_edp_vs_cotizado: variacionEdpVsCotizado,
        variacion_pct: variacionPct,
        semaforo_contable: semaforoContable,
        semaforo_label: semaforoLabel
      });

      // =========================================================================
      // POBLAR SUBMENÚ 2: HORAS DE OPERADORES Y RIGGERS (Formato Horas Operadores.xlsx + ITS Validado)
      // =========================================================================
      const viaticoPryTotal = viaticosPorProyecto.get(p.id_proyecto) || 0;
      const viaticoPorReport = totalReports > 0 ? Math.round(viaticoPryTotal / totalReports) : 0;

      // Resolver Valor Hora Servicio Comercial de la OT
      let valorHoraServicioOt = 0;
      for (const l of lineas) {
        const tipoUpper = String(l.tipo || '').toUpperCase();
        if (['GRUAS TELESCOPICAS', 'GRUA HORQUILLA', 'MANIPULADOR TELESCOPICO', 'CAMION PLUMA', 'ALZAHOMBRES / PLATAFORMAS'].includes(tipoUpper)) {
          const valUnit = Number(l.valorUnitario || l.precio_unitario || l.tarifa || 0);
          if (valUnit > 0) {
            if (String(l.unidad || '').toLowerCase() === 'diario') {
              valorHoraServicioOt = Math.round(valUnit / 9);
            } else {
              valorHoraServicioOt = Math.round(valUnit);
            }
            break;
          }
        }
      }
      if (valorHoraServicioOt === 0 && horasFacturablesPry > 0 && montoDevengadoReports > 0) {
        valorHoraServicioOt = Math.round(montoDevengadoReports / horasFacturablesPry);
      }

      const itsValidadoFlag = Boolean(p.estado_its === 'CONCLUIDO' || p.estado_its === 'APROBADO');

      for (const rep of repsProyecto) {
        // SPEC-106: Filtrar por fecha del Report Diario ("Desde - Hasta") independiente del cierre del ITS
        if (fecha_desde && rep.fecha_reporte_fmt && rep.fecha_reporte_fmt < fecha_desde) continue;
        if (fecha_hasta && rep.fecha_reporte_fmt && rep.fecha_reporte_fmt > fecha_hasta) continue;

        const liqRep = rep.ajustes_analista?.liquidacion_personal_dia || null;
        const reportValidadoFlag = Boolean(rep.estado_reporte === 'VALIDADO_ANALISTA' || liqRep?.validado_rrhh);
        const reportValidadoLabel = reportValidadoFlag ? 'SÍ' : 'NO';

        const hrsTotal = liqRep?.horas_totales_pagar !== undefined && liqRep?.horas_totales_pagar !== null
          ? Number(liqRep.horas_totales_pagar)
          : Number(rep.horas_facturables || rep.horas_operadas || 0);
        const hrsMaq = Number(rep.horas_operadas || hrsTotal || 0);
        const hrsSt = Number(rep.horas_sobretiempo || 0);
        const hrsNorm = Math.max(0, Number((hrsTotal - hrsSt).toFixed(1)));
        const valorHoraOpDia = liqRep?.precio_unitario !== undefined && Number(liqRep.precio_unitario) > 0
          ? Number(liqRep.precio_unitario)
          : resolverValorHoraOperadorDesdeLineas(lineas, rep.equipo_modelo || rep.equipo_nombre, rep.equipo_tipo);
        const totalServicioDia = Math.round(hrsTotal * valorHoraServicioOt);
        const totalOperadorDia = liqRep?.monto_total_hora_operador !== undefined && liqRep?.monto_total_hora_operador !== null
          ? Math.round(Number(liqRep.monto_total_hora_operador))
          : Math.round(hrsTotal * valorHoraOpDia);
        const viaticoOpDia = liqRep?.monto_viatico_operador !== undefined && liqRep?.monto_viatico_operador !== null
          ? Math.round(Number(liqRep.monto_viatico_operador))
          : (viaticoPorReport > 0
              ? viaticoPorReport
              : (hrsTotal >= 8 ? Math.min(18000, 7000 + Math.floor(hrsTotal - 8) * 1000) : 0));
        const reportFolio = rep.folio_correlativo ? String(rep.folio_correlativo) : String(rep.id_reporte_avance);

        // Registrar Operador
        if (rep.id_user_operador || rep.operador_nombre) {
          const opKey = `OP-${rep.id_user_operador || rep.operador_nombre}`;
          if (!mapaTrabajadores.has(opKey)) {
            mapaTrabajadores.set(opKey, {
              key: opKey,
              id_user: rep.id_user_operador || null,
              nombre_completo: rep.operador_nombre || 'Operador',
              rut: rep.operador_rut || 'S/R',
              email: rep.operador_email || '',
              rol: 'OPERADOR',
              empresa_holding: empresaCorto,
              ots_set: new Set(),
              fechas_set: new Set(),
              reports_count: 0,
              horas_normales: 0,
              horas_sobretiempo: 0,
              horas_totales: 0,
              horas_maq_totales: 0,
              valor_hora_operador_ref: valorHoraOpDia,
              total_servicio_clp: 0,
              total_operador_clp: 0,
              viaticos_clp: 0,
              reports_validados_count: 0,
              its_validados_count: 0
            });
          }
          const tOp = mapaTrabajadores.get(opKey);
          tOp.ots_set.add(p.codi_proyecto || `OT-${p.id_proyecto}`);
          if (rep.fecha_reporte_fmt) tOp.fechas_set.add(rep.fecha_reporte_fmt);
          tOp.reports_count += 1;
          tOp.horas_normales = Number((tOp.horas_normales + hrsNorm).toFixed(1));
          tOp.horas_sobretiempo = Number((tOp.horas_sobretiempo + hrsSt).toFixed(1));
          tOp.horas_totales = Number((tOp.horas_totales + hrsTotal).toFixed(1));
          tOp.horas_maq_totales = Number((tOp.horas_maq_totales + hrsMaq).toFixed(1));
          if (valorHoraOpDia > 0) tOp.valor_hora_operador_ref = valorHoraOpDia;
          tOp.total_servicio_clp += totalServicioDia;
          tOp.total_operador_clp += totalOperadorDia;
          tOp.viaticos_clp += viaticoOpDia;
          if (reportValidadoFlag) {
            tOp.reports_validados_count += 1;
            tOp.its_validados_count += 1;
          }

          detalleJornadasPersonal.push({
            id_reporte: rep.id_reporte_avance,
            orden: p.codi_proyecto || `OT-${p.id_proyecto}`,
            codi_proyecto: p.codi_proyecto || `OT-${p.id_proyecto}`,
            fecha: rep.fecha_reporte_fmt || '',
            vehiculo: rep.equipo_tipo || 'GRUA',
            patente: rep.equipo_patente || 'S/P',
            equipo_patente: rep.equipo_patente || 'S/P',
            equipo_modelo: rep.equipo_modelo || rep.equipo_nombre,
            valor_hora_operador: valorHoraOpDia,
            cliente_nombre: p.cliente_nombre,
            report_nro: reportFolio,
            valor_hora_servicio: valorHoraServicioOt,
            horas: hrsTotal,
            horas_maq: hrsMaq,
            horas_normales: hrsNorm,
            horas_sobretiempo: hrsSt,
            horas_totales: hrsTotal,
            total_servicio: totalServicioDia,
            total_operador: totalOperadorDia,
            factura_nro: facturaNumero || '',
            report_validado: reportValidadoFlag,
            report_validado_label: reportValidadoLabel,
            its_validado: reportValidadoFlag,
            its_validado_label: reportValidadoLabel,
            estado_its: p.estado_its || 'SIN_ITS',
            trabajador: rep.operador_nombre || 'Operador',
            rut: rep.operador_rut || 'S/R',
            rol: 'OPERADOR',
            empresa_emisora: empresaCorto,
            estado_reporte: rep.estado_reporte,
            viatico_estimado_clp: viaticoOpDia
          });
        }

        // Registrar Rigger si participó en el report
        if (rep.id_user_rigger && rep.rigger_nombre) {
          const rigKey = `RIG-${rep.id_user_rigger}`;
          const hrsRiggerDia = liqRep?.horas_totales_rigger !== undefined && liqRep?.horas_totales_rigger !== null
            ? Number(liqRep.horas_totales_rigger)
            : hrsTotal;
          const viaticoRigDia = liqRep?.monto_viatico_rigger !== undefined && liqRep?.monto_viatico_rigger !== null
            ? Math.round(Number(liqRep.monto_viatico_rigger))
            : (hrsRiggerDia >= 8 ? Math.min(18000, 7000 + Math.floor(hrsRiggerDia - 8) * 1000) : 0);

          if (!mapaTrabajadores.has(rigKey)) {
            mapaTrabajadores.set(rigKey, {
              key: rigKey,
              id_user: rep.id_user_rigger,
              nombre_completo: rep.rigger_nombre,
              rut: rep.rigger_rut || 'S/R',
              email: rep.rigger_email || '',
              rol: 'RIGGER',
              empresa_holding: empresaCorto,
              ots_set: new Set(),
              fechas_set: new Set(),
              reports_count: 0,
              horas_normales: 0,
              horas_sobretiempo: 0,
              horas_totales: 0,
              horas_maq_totales: 0,
              valor_hora_operador_ref: 0,
              total_servicio_clp: 0,
              total_operador_clp: 0,
              viaticos_clp: 0,
              reports_validados_count: 0,
              its_validados_count: 0
            });
          }
          const tRig = mapaTrabajadores.get(rigKey);
          tRig.ots_set.add(p.codi_proyecto || `OT-${p.id_proyecto}`);
          if (rep.fecha_reporte_fmt) tRig.fechas_set.add(rep.fecha_reporte_fmt);
          tRig.reports_count += 1;
          tRig.horas_normales = Number((tRig.horas_normales + hrsNorm).toFixed(1));
          tRig.horas_sobretiempo = Number((tRig.horas_sobretiempo + hrsSt).toFixed(1));
          tRig.horas_totales = Number((tRig.horas_totales + hrsRiggerDia).toFixed(1));
          tRig.horas_maq_totales = Number((tRig.horas_maq_totales + hrsMaq).toFixed(1));
          tRig.total_servicio_clp += totalServicioDia;
          tRig.viaticos_clp += viaticoRigDia;
          if (reportValidadoFlag) {
            tRig.reports_validados_count += 1;
            tRig.its_validados_count += 1;
          }

          detalleJornadasPersonal.push({
            id_reporte: rep.id_reporte_avance,
            orden: p.codi_proyecto || `OT-${p.id_proyecto}`,
            codi_proyecto: p.codi_proyecto || `OT-${p.id_proyecto}`,
            fecha: rep.fecha_reporte_fmt || '',
            vehiculo: rep.equipo_tipo || 'GRUA',
            patente: rep.equipo_patente || 'S/P',
            equipo_patente: rep.equipo_patente || 'S/P',
            equipo_modelo: rep.equipo_modelo || rep.equipo_nombre,
            valor_hora_operador: 0,
            cliente_nombre: p.cliente_nombre,
            report_nro: reportFolio,
            valor_hora_servicio: valorHoraServicioOt,
            horas: hrsRiggerDia,
            horas_maq: hrsMaq,
            horas_normales: hrsNorm,
            horas_sobretiempo: hrsSt,
            horas_totales: hrsRiggerDia,
            total_servicio: totalServicioDia,
            total_operador: 0,
            factura_nro: facturaNumero || '',
            report_validado: reportValidadoFlag,
            report_validado_label: reportValidadoLabel,
            its_validado: reportValidadoFlag,
            its_validado_label: reportValidadoLabel,
            estado_its: p.estado_its || 'SIN_ITS',
            trabajador: rep.rigger_nombre,
            rut: rep.rigger_rut || 'S/R',
            rol: 'RIGGER',
            empresa_emisora: empresaCorto,
            estado_reporte: rep.estado_reporte,
            viatico_estimado_clp: viaticoRigDia
          });
        }
      }

      // =========================================================================
      // POBLAR SUBMENÚ 4: COMBUSTIBLE Y RENDIMIENTO DE FLOTA (Combustible Enero 2026.xlsx)
      // =========================================================================
      const itemsCombPry = combustiblePorProyecto.get(p.id_proyecto) || [];
      const montoCombPryTotal = itemsCombPry.reduce((acc, c) => acc + Number(c.monto_total || 0), 0);
      const montoCombPorReport = totalReports > 0 ? Math.round(montoCombPryTotal / totalReports) : montoCombPryTotal;
      const metaComb0 = itemsCombPry[0]?.metadatos_json
        ? (typeof itemsCombPry[0].metadatos_json === 'string' ? JSON.parse(itemsCombPry[0].metadatos_json || '{}') : itemsCombPry[0].metadatos_json)
        : {};

      for (const rep of repsProyecto) {
        const hrsIni = Number(rep.horometro_inicio || 0);
        const hrsFin = Number(rep.horometro_termino || 0);
        const totalHrsHoro = hrsFin > hrsIni
          ? Number((hrsFin - hrsIni).toFixed(1))
          : Number(rep.horas_operadas || rep.horas_facturables || 0);
        const hrsGIni = Number(rep.equipo_horo_grua || 0);
        const hrsGFin = Number((hrsGIni + totalHrsHoro).toFixed(1));
        const kmIni = Number(rep.equipo_odometro || 0);
        const kmFin = distanciaKm > 0 ? Number((kmIni + distanciaKm).toFixed(1)) : kmIni;
        const totalKm = Number((kmFin - kmIni).toFixed(1));

        const litrosCarga = Number(metaComb0.litros || 0);
        const precioLitro = Number(metaComb0.precio_litro || (litrosCarga > 0 && montoCombPorReport > 0 ? Math.round(montoCombPorReport / litrosCarga) : 0));
        const guiaComb = metaComb0.guia || metaComb0.nro_guia || 'S/G (Sin Captura)';
        const llenadoCon = litrosCarga > 0 ? (metaComb0.llenado_con || 'ESTANQUE / SURTIDOR') : 'SIN REGISTRO EN TERRENO';
        const rendiKm = litrosCarga > 0 && totalKm > 0 ? Number((totalKm / litrosCarga).toFixed(2)) : 0;
        const rendiHrs = litrosCarga > 0 && totalHrsHoro > 0 ? Number((litrosCarga / totalHrsHoro).toFixed(2)) : 0;
        const rendiHrsG = rendiHrs;
        const patComb = rep.equipo_patente || 'S/P';
        const tipoVehComb = rep.equipo_tipo || 'GRUA';
        const combKey = `${tipoVehComb}::${patComb}`;

        if (!mapaCombustibleVehiculos.has(combKey)) {
          mapaCombustibleVehiculos.set(combKey, {
            key: combKey,
            tipo_vehiculo: tipoVehComb,
            patente: patComb,
            modelo: rep.equipo_modelo || rep.equipo_nombre || '',
            marca: rep.equipo_marca || '',
            empresa_holding: empresaCorto,
            cargas_count: 0,
            suma_litros: 0,
            suma_total_clp: 0,
            total_horas: 0,
            total_km: 0
          });
        }
        const mComb = mapaCombustibleVehiculos.get(combKey);
        mComb.cargas_count += 1;
        mComb.suma_litros = Number((mComb.suma_litros + litrosCarga).toFixed(1));
        mComb.suma_total_clp += montoCombPorReport;
        mComb.total_horas = Number((mComb.total_horas + totalHrsHoro).toFixed(1));
        mComb.total_km = Number((mComb.total_km + totalKm).toFixed(1));

        detalleCargasCombustible.push({
          id_reporte: rep.id_reporte_avance,
          codi_proyecto: p.codi_proyecto || `OT-${p.id_proyecto}`,
          fecha: rep.fecha_reporte_fmt || '',
          guia: guiaComb,
          llenado_con: llenadoCon,
          litros: litrosCarga,
          precio: precioLitro,
          hrs_inicial: hrsIni,
          hrs_final: hrsFin,
          total_horas: totalHrsHoro,
          km_inicial: kmIni,
          km_final: kmFin,
          total_km: totalKm,
          hrs_g_inicial: hrsGIni,
          hrs_g_final: hrsGFin,
          total_hrs_g: totalHrsHoro,
          total_clp: montoCombPorReport,
          rendi_km: rendiKm,
          rendi_hrs: rendiHrs,
          rendi_hrs_g: rendiHrsG,
          patente: patComb,
          tipo_vehiculo: tipoVehComb,
          modelo: rep.equipo_modelo || rep.equipo_nombre || '',
          marca: rep.equipo_marca || '',
          anio: '',
          operador: rep.operador_nombre || 'Operador',
          nro_interno: rep.id_equipo ? `EQ-${rep.id_equipo}` : '',
          sucursal: 'CASA MATRIZ',
          // RESOLUCIÓN DE FONDO (REQ-1131 / SPEC-119): Formato horario real en zona horaria America/Santiago sin forzar 18:00
          fecha_ingreso: (() => {
            const tsRaw = rep.fecha_registro || rep.fecha_termino_servicio || rep.fecha_inicio_servicio;
            if (tsRaw) {
              try {
                const d = new Date(tsRaw);
                if (!isNaN(d.getTime())) {
                  const fechaPart = d.toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
                  const horaPart = d.toLocaleTimeString('es-CL', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit', hour12: false });
                  return `${fechaPart} ${horaPart}`;
                }
              } catch (_) {}
            }
            return rep.fecha_reporte_fmt ? `${rep.fecha_reporte_fmt} ${rep.hora_termino || '08:00'}` : '';
          })(),
          rut_empresa: RUTS_HOLDING[empId] || '76.143.620-1',
          empresa_emisora: empresaCorto,
          estado_captura: litrosCarga > 0
            ? 'CAPTURADO'
            : (montoCombPorReport > 0 ? 'MONTO ITS SIN LITROS/GUÍA' : 'SIN CAPTURA DE COMBUSTIBLE')
        });
      }

      // =========================================================================
      // POBLAR SUBMENÚ 3: VENTAS Y RENDIMIENTO POR GRÚA / EQUIPO
      // =========================================================================
      // Identificar equipos del proyecto (desde reports o desde asignación OT)
      const equiposParticipantes = new Map();
      for (const rep of repsProyecto) {
        const eqKey = rep.id_equipo ? `EQ-${rep.id_equipo}` : `PAT-${rep.equipo_patente}`;
        if (!equiposParticipantes.has(eqKey)) {
          equiposParticipantes.set(eqKey, {
            id_equipo: rep.id_equipo,
            patente: rep.equipo_patente || 'S/P',
            nombre_equipo: rep.equipo_nombre || 'Grúa',
            modelo: rep.equipo_modelo || '',
            tipo_equipo: rep.equipo_tipo || 'GRUA',
            capacidad_ton: rep.equipo_capacidad_ton || 0,
            dias_reports: 0,
            horas_operadas: 0,
            horas_facturables: 0
          });
        }
        const ep = equiposParticipantes.get(eqKey);
        ep.dias_reports += 1;
        ep.horas_operadas += Number(rep.horas_operadas || 0);
        ep.horas_facturables += Number(rep.horas_facturables || rep.horas_operadas || 0);
      }

      if (equiposParticipantes.size === 0) {
        const relEqs = equiposPorProyecto.get(p.id_proyecto) || [];
        for (const re of relEqs) {
          const eqKey = `EQ-${re.id_equipo}`;
          equiposParticipantes.set(eqKey, {
            id_equipo: re.id_equipo,
            patente: re.patente,
            nombre_equipo: re.nombre_equipo,
            modelo: re.modelo,
            tipo_equipo: re.tipo_equipo,
            capacidad_ton: re.capacidad_ton,
            dias_reports: 0,
            horas_operadas: 0,
            horas_facturables: 0
          });
        }
      }

      const numEquiposPry = Math.max(1, equiposParticipantes.size);
      for (const [eqKey, eqData] of equiposParticipantes.entries()) {
        // Prorrateo proporcional por horas o por cantidad de equipos en la OT
        const factorPeso = horasFacturablesPry > 0 && eqData.horas_facturables > 0
          ? (eqData.horas_facturables / horasFacturablesPry)
          : (1 / numEquiposPry);

        const ventaCompEq = Math.round(montoComprometido * factorPeso);
        const ventaDevEq = Math.round(montoDevengadoReports * factorPeso);
        const ventaEdpEq = Math.round(montoEdpEmitido * factorPeso);
        const ventaFactEq = Math.round(montoFacturadoNeto * factorPeso);
        const costoItsEq = Math.round(montoItsCostos * factorPeso);

        if (!mapaEquipos.has(eqKey)) {
          mapaEquipos.set(eqKey, {
            key: eqKey,
            id_equipo: eqData.id_equipo,
            patente: eqData.patente,
            nombre_equipo: eqData.nombre_equipo,
            modelo: eqData.modelo,
            tipo_equipo: eqData.tipo_equipo,
            capacidad_ton: eqData.capacidad_ton,
            empresa_holding: empresaCorto,
            ots_set: new Set(),
            dias_operados: 0,
            horas_operadas: 0,
            horas_facturables: 0,
            venta_comprometida_neto: 0,
            venta_devengada_neto: 0,
            venta_edp_neto: 0,
            venta_facturada_neto: 0,
            costos_directos_its: 0
          });
        }

        const mEq = mapaEquipos.get(eqKey);
        mEq.ots_set.add(p.codi_proyecto || `OT-${p.id_proyecto}`);
        mEq.dias_operados += eqData.dias_reports;
        mEq.horas_operadas = Number((mEq.horas_operadas + eqData.horas_operadas).toFixed(1));
        mEq.horas_facturables = Number((mEq.horas_facturables + eqData.horas_facturables).toFixed(1));
        mEq.venta_comprometida_neto += ventaCompEq;
        mEq.venta_devengada_neto += ventaDevEq;
        mEq.venta_edp_neto += ventaEdpEq;
        mEq.venta_facturada_neto += ventaFactEq;
        mEq.costos_directos_its += costoItsEq;

        detalleAsignacionesEquipo.push({
          patente: eqData.patente,
          nombre_equipo: eqData.nombre_equipo,
          modelo: eqData.modelo,
          tipo_equipo: eqData.tipo_equipo,
          codi_proyecto: p.codi_proyecto || `OT-${p.id_proyecto}`,
          cliente_nombre: p.cliente_nombre,
          empresa_emisora: empresaCorto,
          dias_reports: eqData.dias_reports,
          horas_facturables: Number(eqData.horas_facturables.toFixed(1)),
          venta_comprometida_neto: ventaCompEq,
          venta_devengada_neto: ventaDevEq,
          venta_edp_neto: ventaEdpEq,
          venta_facturada_neto: ventaFactEq,
          costos_directos_its: costoItsEq,
          estado_contable: semaforoLabel
        });
      }
    }

    const resumenTrabajadores = Array.from(mapaTrabajadores.values()).map(t => ({
      key: t.key,
      id_user: t.id_user,
      nombre_completo: t.nombre_completo,
      rut: t.rut,
      email: t.email,
      rol: t.rol,
      empresa_holding: t.empresa_holding,
      ots_count: t.ots_set.size,
      ots_lista: Array.from(t.ots_set).join(', '),
      dias_trabajados: t.fechas_set.size,
      reports_count: t.reports_count,
      horas_normales: t.horas_normales,
      horas_sobretiempo: t.horas_sobretiempo,
      horas_totales: t.horas_totales,
      horas_maq_totales: t.horas_maq_totales,
      valor_hora_operador_ref: t.valor_hora_operador_ref,
      total_servicio_clp: t.total_servicio_clp,
      total_operador_clp: t.total_operador_clp,
      viaticos_clp: t.viaticos_clp,
      reports_validados_count: t.reports_validados_count,
      report_validado_label: t.reports_validados_count === t.reports_count && t.reports_count > 0 ? 'SÍ' : (t.reports_validados_count > 0 ? 'PARCIAL' : 'NO'),
      its_validados_count: t.reports_validados_count,
      its_validado_label: t.reports_validados_count === t.reports_count && t.reports_count > 0 ? 'SÍ' : (t.reports_validados_count > 0 ? 'PARCIAL' : 'NO')
    })).sort((a, b) => b.horas_totales - a.horas_totales);

    const resumenEquipos = Array.from(mapaEquipos.values()).map(eq => {
      const ingresoRef = eq.venta_edp_neto > 0
        ? eq.venta_edp_neto
        : (eq.venta_devengada_neto > 0 ? eq.venta_devengada_neto : eq.venta_comprometida_neto);
      const margenClp = ingresoRef - eq.costos_directos_its;
      const margenPct = ingresoRef > 0 ? Number(((margenClp / ingresoRef) * 100).toFixed(1)) : 0;
      return {
        key: eq.key,
        id_equipo: eq.id_equipo,
        patente: eq.patente,
        nombre_equipo: eq.nombre_equipo,
        modelo: eq.modelo,
        tipo_equipo: eq.tipo_equipo,
        capacidad_ton: eq.capacidad_ton,
        empresa_holding: eq.empresa_holding,
        ots_atendidas: eq.ots_set.size,
        ots_lista: Array.from(eq.ots_set).join(', '),
        dias_operados: eq.dias_operados,
        horas_operadas: eq.horas_operadas,
        horas_facturables: eq.horas_facturables,
        venta_comprometida_neto: eq.venta_comprometida_neto,
        venta_devengada_neto: eq.venta_devengada_neto,
        venta_edp_neto: eq.venta_edp_neto,
        venta_facturada_neto: eq.venta_facturada_neto,
        costos_directos_its: eq.costos_directos_its,
        margen_contribucion_clp: margenClp,
        margen_contribucion_pct: margenPct
      };
    }).sort((a, b) => b.venta_comprometida_neto - a.venta_comprometida_neto);

    // =========================================================================
    // CONSOLIDAR SUBMENÚ 4: COMBUSTIBLE Y RENDIMIENTO (Hoja2 + sistema)
    // =========================================================================
    const resumenCombustibleVehiculos = Array.from(mapaCombustibleVehiculos.values())
      .sort((a, b) => a.tipo_vehiculo.localeCompare(b.tipo_vehiculo) || a.patente.localeCompare(b.patente));

    // =========================================================================
    // CONSOLIDAR SUBMENÚ 5: SALIDAS DE BODEGA Y CENTROS DE COSTOS (Hoja2 + Sistema)
    // =========================================================================
    const MESES_ES = {
      '01': 'ENERO', '02': 'FEBRERO', '03': 'MARZO', '04': 'ABRIL',
      '05': 'MAYO', '06': 'JUNIO', '07': 'JULIO', '08': 'AGOSTO',
      '09': 'SEPTIEMBRE', '10': 'OCTUBRE', '11': 'NOVIEMBRE', '12': 'DICIEMBRE'
    };

    const CUENTAS_CONTABLES_CANONICAS = [
      'Activo',
      'Galpon Puerto Montt',
      'Gastos de Oficina',
      'Implementos Seguridad',
      'Mant. Maquinarias',
      'Mant. Vehiculos',
      'Mantencion Edificio',
      'Obra en Construccion',
      'Sin Parametrizar (Pendiente Plan de Cuentas)'
    ];

    const mapaCuentasBodega = new Map();
    for (const cta of CUENTAS_CONTABLES_CANONICAS) {
      mapaCuentasBodega.set(cta, {
        cuenta_contable: cta,
        enero: 0,
        febrero: 0,
        marzo: 0,
        otros_meses: 0,
        total_general: 0,
        movimientos_count: 0
      });
    }

    const detalleSalidasBodega = [];
    const filasRawBodega = [
      ...(salidasKardexRes.rows || []).map(r => ({ ...r, origen: 'KARDEX_BODEGA' })),
      ...(salidasOtRepRes.rows || []).map(r => ({ ...r, origen: 'OT_MANTENCION' }))
    ];

    for (const r of filasRawBodega) {
      const fechaStr = r.fecha_fmt || '';
      const mesNum = fechaStr.slice(5, 7);
      const mesNombre = MESES_ES[mesNum] || 'OTRO';
      const cant = Number(r.cantidad || 0);
      const precioUnit = Math.round(Number(r.precio_unitario || 0));
      const totalFila = Math.round(Number(r.total || (cant * precioUnit) || 0));

      // Inferencia inicial o marcación explícita de falta de parametrización de Centro de Costos / Cuenta Contable
      const catUpper = String(r.categoria || '').toUpperCase();
      let cuentaSugerida = 'Sin Parametrizar (Pendiente Plan de Cuentas)';
      if (catUpper.includes('EPP') || catUpper.includes('SEGURIDAD')) {
        cuentaSugerida = 'Implementos Seguridad';
      } else if (r.origen === 'OT_MANTENCION' || catUpper.includes('REPUESTO') || catUpper.includes('FILTRO') || catUpper.includes('LUBRICANTE') || catUpper.includes('HIDRAULIC')) {
        cuentaSugerida = 'Mant. Maquinarias';
      } else if (catUpper.includes('OFICINA') || catUpper.includes('ASEO')) {
        cuentaSugerida = 'Gastos de Oficina';
      }

      const centroCostoStr = r.equipo_patente && r.equipo_patente !== 'SIN ASIGNAR'
        ? `${r.equipo_patente} (Pendiente C. Costo Contable)`
        : 'SIN CENTRO DE COSTO (Pendiente Parametrizar)';

      if (!mapaCuentasBodega.has(cuentaSugerida)) {
        mapaCuentasBodega.set(cuentaSugerida, {
          cuenta_contable: cuentaSugerida,
          enero: 0,
          febrero: 0,
          marzo: 0,
          otros_meses: 0,
          total_general: 0,
          movimientos_count: 0
        });
      }
      const mCta = mapaCuentasBodega.get(cuentaSugerida);
      if (mesNum === '01') mCta.enero += totalFila;
      else if (mesNum === '02') mCta.febrero += totalFila;
      else if (mesNum === '03') mCta.marzo += totalFila;
      else mCta.otros_meses += totalFila;
      mCta.total_general += totalFila;
      mCta.movimientos_count += 1;

      detalleSalidasBodega.push({
        id_movimiento: r.id_movimiento,
        codigo: r.codigo || 'S/C',
        producto: r.producto || 'Ítem de Bodega',
        fecha: fechaStr,
        mes: mesNombre,
        detalle: r.detalle || 'SALIDA POR CONSUMO',
        nro_dcto: String(r.nro_dcto || r.id_movimiento),
        cantidad: cant,
        precio_unitario: precioUnit,
        total: totalFila,
        centro_costo: centroCostoStr,
        empresa: 'Grúas San Pablo',
        cuenta_contable: cuentaSugerida,
        retira: r.retira || 'SIN REGISTRO RETIRA',
        origen_registro: r.origen,
        estado_parametrizacion: 'PENDIENTE_CATALOGO_CC_Y_CUENTAS'
      });
    }

    const resumenCuentasBodega = Array.from(mapaCuentasBodega.values());

    // =========================================================================
    // CONSOLIDAR SUBMENÚ 6: RH — ANEXOS DE CONTRATO POR CAMBIO DE OBRA (REQ-1094)
    // =========================================================================
    let anexosRhList = [];
    let padronTrabajadoresRh = [];
    try {
      const [anexosData, padronData] = await Promise.all([
        obtenerAnexosContratoRH(db),
        obtenerPadronTrabajadoresRH(db)
      ]);
      anexosRhList = anexosData;
      padronTrabajadoresRh = padronData;
    } catch (errRh) {
      console.warn('[PERSPECTIVA_CONTABILIDAD] Aviso cargando datos RH:', errRh.message);
    }

    const baseExigibleFacturar = Math.max(kpiDevengadoNeto, kpiEmitidoEdpNeto);
    const brechaPorFacturarNeto = Math.max(0, baseExigibleFacturar - kpiFacturadoNeto);

    return res.status(200).json({
      success: true,
      data: {
        kpis: {
          comprometido_neto: kpiComprometidoNeto,
          comprometido_ots: kpiComprometidoOts,
          devengado_neto: kpiDevengadoNeto,
          devengado_reports: kpiDevengadoReports,
          devengado_horas: Number(kpiDevengadoHoras.toFixed(1)),
          cerrado_its_neto: kpiCerradoItsNeto,
          cerrado_its_costos: kpiCerradoItsCostos,
          cerrado_its_count: kpiCerradoItsCount,
          emitido_edp_neto: kpiEmitidoEdpNeto,
          emitido_edp_count: kpiEmitidoEdpCount,
          listos_facturar_neto: kpiListosFacturarNeto,
          listos_facturar_count: kpiListosFacturarCount,
          facturado_neto: kpiFacturadoNeto,
          facturado_bruto: kpiFacturadoBruto,
          facturado_count: kpiFacturadoCount,
          brecha_por_facturar_neto: brechaPorFacturarNeto
        },
        procesos,
        horas_personal: {
          resumen_trabajadores: resumenTrabajadores,
          detalle_jornadas: detalleJornadasPersonal
        },
        ventas_equipos: {
          resumen_equipos: resumenEquipos,
          detalle_asignaciones: detalleAsignacionesEquipo
        },
        combustible_flota: {
          aviso_estructura: 'Estructura homologada con Combustible Enero 2026.xlsx (Hoja2 y sistema). La captura de Guía, Surtidor y Litros en terreno aún no se encuentra activa en la PWA/Web, por lo que se exponen los horómetros/odómetros de reports y los montos de combustible registrados en ITS.',
          resumen_vehiculos: resumenCombustibleVehiculos,
          detalle_cargas: detalleCargasCombustible
        },
        salidas_bodega: {
          aviso_estructura: 'Estructura homologada con Salidas bodega enero - marzo 2026.xlsx (Hoja2 y Sistema). Actualmente la base de datos no dispone del maestro de Centros de Costos ni del clasificador de Cuentas Contables en el Kardex de Bodega (tinv_movimiento), ni existen consumos registrados en el período.',
          resumen_cuentas: resumenCuentasBodega,
          detalle_salidas: detalleSalidasBodega
        },
        rh_anexos: {
          anexos: anexosRhList,
          padron_trabajadores: padronTrabajadoresRh
        }
      }
    });
  } catch (error) {
    console.error('[PERSPECTIVA_CONTABILIDAD] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al consolidar Perspectiva Contabilidad',
      error: error.message
    });
  }
};

// 13. Descargar PDF Oficial de la Cotización Comercial para Perspectiva Contabilidad
exports.descargarPdfCotizacionProyecto = async (req, res) => {
  try {
    const { id_proyecto } = req.params;
    if (!id_proyecto) return res.status(400).send('id_proyecto es requerido');

    const pRes = await db.query('SELECT id_proyecto, codi_proyecto, json_field FROM tpry_proyecto WHERE id_proyecto = $1', [id_proyecto]);
    if (pRes.rows.length === 0) return res.status(404).send('Proyecto no encontrado');

    const proyecto = pRes.rows[0];
    const jf = typeof proyecto.json_field === 'string' ? JSON.parse(proyecto.json_field || '{}') : (proyecto.json_field || {});
    const crm = jf.crm_v1 || {};
    const cotizVig = crm.cotizacion_v1 || crm.cotizacion || (Array.isArray(crm.cotizaciones_historicas) && crm.cotizaciones_historicas.length > 0 ? crm.cotizaciones_historicas[crm.cotizaciones_historicas.length - 1] : null);

    let idDoc = cotizVig?.id_doc || cotizVig?.id_doc_pdf;
    if (!idDoc && cotizVig?.url && cotizVig.url.includes('/api/archivo/ver/')) {
      idDoc = cotizVig.url.split('/api/archivo/ver/').pop();
    }

    const archivoController = require('./archivoController');

    if (idDoc) {
      req.params.id = String(idDoc);
      return await archivoController.verArchivoById(req, res);
    }

    const proyectoModel = require('../models/proyectoModel');
    const pModel = new proyectoModel();
    const result = await pModel.generarCotizacionVersion(id_proyecto, crm.total_neto || 0);
    const nuevoIdDoc = result?.cotizacion?.id_doc;
    if (nuevoIdDoc) {
      req.params.id = String(nuevoIdDoc);
      return await archivoController.verArchivoById(req, res);
    }

    return res.status(404).send('No se encontró archivo de cotización para este proyecto.');
  } catch (err) {
    console.error('[descargarPdfCotizacionProyecto] Error:', err);
    return res.status(500).send('Error interno al obtener PDF de cotización: ' + err.message);
  }
};

// ============================================================================
// 14. SUBMENÚ 6. RH — GENERADOR DE ANEXOS DE CONTRATO DE TRABAJO (CAMBIO DE OBRA)
//     MULTI-EMPRESA Y PERSISTENCIA DUAL (SEGMENTO RH + BIBLIOTECA DE PERSONAS)
//     Especificación: .agents/specs/105_reportes_contabilidad_horas_combustible_y_bodega_spec.md (§3, REQ-1094)
// ============================================================================
const os = require('os');
const { exec } = require('child_process');
const ArchivoModel = require('../models/archivoModel');

const EMPRESAS_HERMANAS_ANEXO = {
  9: {
    id_empresa: 9,
    nombre_corto: 'Grúas San Pablo',
    razon_social: 'LUIS OMAR GHISELLINI JARA EIRL',
    rut: '52.004.162-1',
    domicilio: 'Lugar Botrolhue KM. 9,5 camino Labranza, ciudad de Temuco',
    logo_file: 'logo-sanpablo.png',
    color_acento: '#D97706'
  },
  7: {
    id_empresa: 7,
    nombre_corto: 'Bestmaq',
    razon_social: 'SOCIEDAD COMERCIALIZADORA BESTMAQ LIMITADA',
    rut: '76.209.534-3',
    domicilio: 'Lugar Botrolhue KM. 9,5 camino Labranza, ciudad de Temuco',
    logo_file: 'logo-bestmaq.png',
    color_acento: '#EA580C'
  },
  8: {
    id_empresa: 8,
    nombre_corto: 'Logística del Sur',
    razon_social: 'SOCIEDAD DE TRANSPORTES LOGISTICA DEL SUR LIMITADA',
    rut: '76.218.576-8',
    domicilio: 'Lugar Botrolhue KM. 9,5 camino Labranza, ciudad de Temuco',
    logo_file: 'logo-logistica.png',
    color_acento: '#0284C7'
  },
  11: {
    id_empresa: 11,
    nombre_corto: 'Royal Rental',
    razon_social: 'ARRIENDO ROYAL RENTAL LIMITADA',
    rut: '78.254.535-3',
    domicilio: 'Lugar Botrolhue KM. 9,5 camino Labranza, ciudad de Temuco',
    logo_file: 'logo-royal.png',
    color_acento: '#7C3AED'
  }
};

function resolveLogoBase64Anexo(logoName = 'logo-sanpablo.png') {
  try {
    const candidates = [
      path.join(process.cwd(), 'public', logoName),
      path.join('/home/nodeadmin/proyectos/lean-services-gsp-prod/public', logoName),
      path.join('/home/nodeadmin/proyectos/lean-services-gsp/public', logoName),
      path.join(__dirname, '../../../frontend/public', logoName),
      path.join(__dirname, '../../../frontend/public/logo-sanpablo.png')
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const ext = path.extname(p).replace('.', '').toLowerCase();
        const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext || 'png'}`;
        const buf = fs.readFileSync(p);
        return `data:${mime};base64,${buf.toString('base64')}`;
      }
    }
  } catch (err) {
    console.warn('[ANEXO-RH] Error cargando logo Base64:', err.message);
  }
  return '';
}

function formatDateGuionCL(dateStr) {
  if (!dateStr) return '—';
  const s = String(dateStr).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return s;
}

function escapeHtmlAnexo(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function asegurarTipoCertificadoAnexoObra(dbConn) {
  const nombreCanonic = 'Anexo de Contrato de Trabajo (Cambio de Obra)';
  const resExist = await dbConn.query(
    `SELECT id_tipo_certificado_persona 
     FROM tsec_tipos_certificado_persona 
     WHERE UPPER(nombre_tipo) LIKE '%ANEXO%CAMBIO DE OBRA%' 
     ORDER BY id_tipo_certificado_persona ASC LIMIT 1`
  );
  if (resExist.rows.length > 0) {
    return resExist.rows[0].id_tipo_certificado_persona;
  }
  const insRes = await dbConn.query(
    `INSERT INTO tsec_tipos_certificado_persona (nombre_tipo, obligatorio, es_empresa_dependiente)
     VALUES ($1, false, true)
     RETURNING id_tipo_certificado_persona`,
    [nombreCanonic]
  );
  return insRes.rows[0].id_tipo_certificado_persona;
}

async function obtenerPadronTrabajadoresRH(dbConn) {
  const sql = `
    SELECT 
      u.id_user,
      TRIM(COALESCE(u.name_frst, '') || ' ' || COALESCE(u.name_sec, '') || ' ' || COALESCE(u.apellido_pat, '') || ' ' || COALESCE(u.apellido_mat, '')) AS nombre_completo,
      COALESCE(u.rut, '') AS rut,
      COALESCE(NULLIF(TRIM(u.json_data->>'cargo'), ''), 'OPERADOR DE GRÚA') AS cargo,
      COALESCE(u.email, '') AS email,
      COALESCE(u.id_empresa, 9) AS id_empresa
    FROM tsec_users u
    WHERE COALESCE(u.activo, true) = true
      AND TRIM(COALESCE(u.name_frst, '') || ' ' || COALESCE(u.apellido_pat, '')) <> ''
    ORDER BY u.name_frst ASC, u.apellido_pat ASC;
  `;
  const { rows } = await dbConn.query(sql);
  return rows.map(r => ({
    id_user: r.id_user,
    nombre_completo: String(r.nombre_completo || '').replace(/\s+/g, ' ').trim(),
    rut: r.rut || '',
    cargo: String(r.cargo || 'OPERADOR DE GRÚA').toUpperCase(),
    email: r.email || '',
    id_empresa: Number(r.id_empresa || 9)
  }));
}

async function obtenerAnexosContratoRH(dbConn) {
  const sql = `
    SELECT 
      cp.id_certificado_persona AS id_cert,
      cp.id_user,
      cp.id_tipo_certificado_persona,
      tp.nombre_tipo,
      COALESCE(cp.id_empresa, 9) AS id_empresa_empleadora,
      emp.name_empresa AS empresa_nombre_bd,
      to_char(cp.fecha_emision, 'YYYY-MM-DD') AS fecha_emision,
      to_char(cp.fecha_vencimiento, 'YYYY-MM-DD') AS fecha_hasta,
      cp.id_doc,
      cp.observaciones,
      TRIM(COALESCE(u.name_frst, '') || ' ' || COALESCE(u.name_sec, '') || ' ' || COALESCE(u.apellido_pat, '') || ' ' || COALESCE(u.apellido_mat, '')) AS trabajador_nombre_bd,
      COALESCE(u.rut, '') AS trabajador_rut_bd,
      COALESCE(u.json_data->>'cargo', 'OPERADOR') AS trabajador_cargo_bd,
      f.path_doc,
      f.name_doc_orig,
      to_char(f.fecha_creacion AT TIME ZONE 'America/Santiago', 'YYYY-MM-DD HH24:MI') AS creado_en
    FROM tsec_certificados_persona cp
    JOIN tsec_tipos_certificado_persona tp ON cp.id_tipo_certificado_persona = tp.id_tipo_certificado_persona
    LEFT JOIN tsec_users u ON cp.id_user = u.id_user
    LEFT JOIN tpar_empresas emp ON cp.id_empresa = emp.id_empresa
    LEFT JOIN tfmg_file f ON cp.id_doc = f.id_doc
    WHERE (
      UPPER(tp.nombre_tipo) LIKE '%ANEXO%CAMBIO DE OBRA%'
      OR UPPER(COALESCE(cp.observaciones, '')) LIKE 'ANEXO CAMBIO DE OBRA%'
    )
    ORDER BY cp.id_certificado_persona DESC;
  `;
  const { rows } = await dbConn.query(sql);
  return rows.map(r => {
    const idEmp = Number(r.id_empresa_empleadora || 9);
    const empCat = EMPRESAS_HERMANAS_ANEXO[idEmp] || EMPRESAS_HERMANAS_ANEXO[9];
    let meta = {};
    if (r.path_doc) {
      const metaPath = `${r.path_doc}.meta.json`;
      try {
        if (fs.existsSync(metaPath)) {
          meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        }
      } catch (_) {}
    }

    return {
      id_cert: r.id_cert,
      id_user: r.id_user,
      id_doc: r.id_doc,
      folio_anexo: meta.folio_anexo || `ANX-${String(r.id_cert).padStart(4, '0')}`,
      id_empresa_empleadora: idEmp,
      empresa_empleadora_nombre: meta.empresa_empleadora_nombre || empCat.nombre_corto,
      empresa_empleadora_razon_social: meta.empresa_empleadora_razon_social || empCat.razon_social,
      empresa_empleadora_rut: meta.empresa_empleadora_rut || empCat.rut,
      empresa_empleadora_domicilio: meta.empresa_empleadora_domicilio || empCat.domicilio,
      ciudad_emision: meta.ciudad_emision || 'Temuco',
      fecha_emision: meta.fecha_emision || r.fecha_emision || '',
      fecha_hasta: meta.fecha_hasta || r.fecha_hasta || '',
      trabajador_nombre: meta.trabajador_nombre || String(r.trabajador_nombre_bd || '').replace(/\s+/g, ' ').trim(),
      trabajador_rut: meta.trabajador_rut || r.trabajador_rut_bd || '',
      trabajador_cargo: meta.trabajador_cargo || r.trabajador_cargo_bd || 'OPERADOR',
      id_proyecto: meta.id_proyecto || null,
      codi_proyecto: meta.codi_proyecto || '',
      proyecto_obra: meta.proyecto_obra || '',
      empresa_cliente: meta.empresa_cliente || '',
      rut_cliente: meta.rut_cliente || '',
      ubicacion_obra: meta.ubicacion_obra || '',
      observaciones: r.observaciones || '',
      creado_en: r.creado_en || r.fecha_emision || '',
      url_pdf: r.id_doc ? `/api/archivo/ver/${r.id_doc}` : null
    };
  });
}

function buildAnexoContratoTrabajoHtml(meta) {
  const idEmp = Number(meta.id_empresa_empleadora || 9);
  const empInfo = EMPRESAS_HERMANAS_ANEXO[idEmp] || EMPRESAS_HERMANAS_ANEXO[9];
  const logoSrc = resolveLogoBase64Anexo(empInfo.logo_file);

  const razonSocialEmp = escapeHtmlAnexo(meta.empresa_empleadora_razon_social || empInfo.razon_social);
  const rutEmp = escapeHtmlAnexo(meta.empresa_empleadora_rut || empInfo.rut);
  const domicilioEmp = escapeHtmlAnexo(meta.empresa_empleadora_domicilio || empInfo.domicilio);
  const nombreCortoEmp = escapeHtmlAnexo(meta.empresa_empleadora_nombre || empInfo.nombre_corto);

  const ciudadEmision = escapeHtmlAnexo(meta.ciudad_emision || 'Temuco');
  const fechaEmisionFmt = escapeHtmlAnexo(formatDateGuionCL(meta.fecha_emision));
  const fechaHastaFmt = escapeHtmlAnexo(formatDateGuionCL(meta.fecha_hasta));

  const trabajadorNombre = escapeHtmlAnexo(meta.trabajador_nombre || '');
  const trabajadorRut = escapeHtmlAnexo(meta.trabajador_rut || '');
  const trabajadorCargo = escapeHtmlAnexo(meta.trabajador_cargo || '');

  const proyectoObra = escapeHtmlAnexo(meta.proyecto_obra || '');
  const empresaCliente = escapeHtmlAnexo(meta.empresa_cliente || '');
  const rutCliente = escapeHtmlAnexo(meta.rut_cliente || 'S/R');
  const ubicacionObra = escapeHtmlAnexo(meta.ubicacion_obra || '');
  const folioAnexo = escapeHtmlAnexo(meta.folio_anexo || 'ANX-OFICIAL');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Anexo Contrato de Trabajo - Cambio de Obra</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 16mm 14mm 16mm;
    }
    * {
      box-sizing: border-box;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }
    body {
      margin: 0;
      padding: 0;
      color: #1e293b;
      font-size: 11pt;
      line-height: 1.55;
      background: #ffffff;
    }
    .page-frame {
      border: 1px solid #cbd5e1;
      border-top: 5px solid ${empInfo.color_acento};
      padding: 22px 26px 26px 26px;
      min-height: 960px;
      position: relative;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 12px;
      margin-bottom: 22px;
    }
    .header-table td {
      vertical-align: middle;
      padding-bottom: 12px;
    }
    .logo-img {
      max-height: 54px;
      max-width: 165px;
      object-fit: contain;
    }
    .emp-block {
      font-size: 8.5pt;
      color: #475569;
      line-height: 1.35;
    }
    .emp-block strong {
      color: #0f172a;
      font-size: 9.5pt;
      display: block;
      margin-bottom: 2px;
    }
    .page-meta {
      text-align: right;
      font-size: 8.5pt;
      color: #475569;
      line-height: 1.4;
    }
    .folio-pill {
      display: inline-block;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #0f172a;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 4px;
      font-size: 8.5pt;
      margin-top: 3px;
    }
    .title-box {
      text-align: center;
      margin: 18px 0 24px 0;
      padding: 12px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }
    .title-main {
      font-size: 14pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      margin: 0;
      text-decoration: underline;
    }
    .title-sub {
      font-size: 11.5pt;
      font-weight: 700;
      color: #334155;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin: 4px 0 0 0;
      text-decoration: underline;
    }
    .legal-paragraph {
      text-align: justify;
      margin-bottom: 16px;
      font-size: 10.8pt;
      color: #1e293b;
    }
    .clause-box {
      margin-bottom: 14px;
      padding: 10px 14px;
      background: #ffffff;
      border-left: 3.5px solid ${empInfo.color_acento};
      border-top: 1px solid #f1f5f9;
      border-right: 1px solid #f1f5f9;
      border-bottom: 1px solid #f1f5f9;
      text-align: justify;
      font-size: 10.6pt;
    }
    .clause-title {
      font-weight: 800;
      color: #0f172a;
      text-decoration: underline;
    }
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin: 18px 0 22px 0;
      font-size: 9.2pt;
    }
    .summary-table th {
      background: #f1f5f9;
      color: #334155;
      text-align: left;
      padding: 6px 10px;
      border: 1px solid #cbd5e1;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 8pt;
      width: 24%;
    }
    .summary-table td {
      padding: 6px 10px;
      border: 1px solid #cbd5e1;
      color: #0f172a;
      font-weight: 600;
      width: 26%;
    }
    .signatures-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 85px;
    }
    .signatures-table td {
      width: 50%;
      text-align: center;
      vertical-align: top;
      padding: 0 24px;
    }
    .sig-line {
      border-top: 1.5px solid #0f172a;
      width: 82%;
      margin: 0 auto 8px auto;
    }
    .sig-role {
      font-weight: 800;
      font-size: 10pt;
      color: #0f172a;
      letter-spacing: 0.4px;
    }
    .sig-name {
      font-size: 9pt;
      color: #334155;
      margin-top: 2px;
    }
    .sig-rut {
      font-size: 9.5pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
    }
    .footer-note {
      margin-top: 40px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      font-size: 7.8pt;
      color: #64748b;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="page-frame">
    <table class="header-table">
      <tr>
        <td style="width: 28%;">
          ${logoSrc ? `<img src="${logoSrc}" class="logo-img" alt="Logo Empresa" />` : `<div style="font-weight:900;font-size:14pt;color:#0f172a;">${nombreCortoEmp}</div>`}
        </td>
        <td style="width: 47%;">
          <div class="emp-block">
            <strong>${razonSocialEmp}</strong>
            RUT: ${rutEmp}<br/>
            ${domicilioEmp}
          </div>
        </td>
        <td style="width: 25%;" class="page-meta">
          <div><strong>Página 1 de 1</strong></div>
          <div>Fecha: ${fechaEmisionFmt}</div>
          <div class="folio-pill">${folioAnexo}</div>
        </td>
      </tr>
    </table>

    <div class="title-box">
      <h1 class="title-main">ANEXO CONTRATO DE TRABAJO</h1>
      <h2 class="title-sub">CAMBIO DE OBRA</h2>
    </div>

    <p class="legal-paragraph">
      En <strong>${ciudadEmision}</strong>, a <strong>${fechaEmisionFmt}</strong>, entre:
      <strong>${razonSocialEmp}</strong> Rut, <strong>${rutEmp}</strong> con domicilio comercial en
      ${domicilioEmp} y don: <strong>${trabajadorNombre}</strong> Rut, <strong>${trabajadorRut}</strong>
      para cuyos efectos las partes convienen denominarse, respectivamente,
      <strong>EMPLEADOR Y TRABAJADOR</strong>, acuerdan lo siguiente.
    </p>

    <div class="clause-box">
      <span class="clause-title">PRIMERO:</span>
      En virtud de lo dispuesto por los artículos 11 y 12 del Código del Trabajo, las partes desean modificar el sitio o recinto de trabajo en los siguientes términos:
      <br/><br/>
      Que, a contar de esta fecha, el trabajador se desempeñará como <strong>${trabajadorCargo}</strong>
      en el Proyecto <strong>${proyectoObra}</strong> encargada por la Empresa
      <strong>${empresaCliente}</strong>${rutCliente && rutCliente !== 'S/R' ? ` Rut, <strong>${rutCliente}</strong>` : ''}
      ubicada en <strong>${ubicacionObra}</strong> hasta el <strong>${fechaHastaFmt}</strong>.
    </div>

    <table class="summary-table">
      <tr>
        <th>Trabajador</th>
        <td>${trabajadorNombre}</td>
        <th>RUT Trabajador</th>
        <td>${trabajadorRut}</td>
      </tr>
      <tr>
        <th>Cargo / Función</th>
        <td>${trabajadorCargo}</td>
        <th>Empleador</th>
        <td>${nombreCortoEmp} (${rutEmp})</td>
      </tr>
      <tr>
        <th>Proyecto / Obra</th>
        <td>${proyectoObra}</td>
        <th>Empresa Cliente</th>
        <td>${empresaCliente}${rutCliente && rutCliente !== 'S/R' ? ` (${rutCliente})` : ''}</td>
      </tr>
      <tr>
        <th>Ubicación Obra</th>
        <td>${ubicacionObra}</td>
        <th>Vigencia Destinación</th>
        <td>Desde ${fechaEmisionFmt} hasta ${fechaHastaFmt}</td>
      </tr>
    </table>

    <div class="clause-box">
      <span class="clause-title">SEGUNDO:</span>
      El presente anexo se entiende que forma parte del contrato de trabajo, para todos los efectos legales.
    </div>

    <div class="clause-box">
      <span class="clause-title">TERCERO:</span>
      En todo lo no modificado en el presente anexo, el contrato de trabajo habido entre las partes, se mantiene sin alteración.
    </div>

    <div class="clause-box">
      <span class="clause-title">CUARTO:</span>
      El presente anexo se extiende y se firma en dos (2) ejemplares, declarando el trabajador, haber recibido en este acto un (1) ejemplar de él.
    </div>

    <table class="signatures-table">
      <tr>
        <td>
          <div class="sig-line"></div>
          <div class="sig-role">TRABAJADOR</div>
          <div class="sig-name">${trabajadorNombre}</div>
          <div class="sig-rut">${trabajadorRut}</div>
        </td>
        <td>
          <div class="sig-line"></div>
          <div class="sig-role">EMPRESA</div>
          <div class="sig-name">${razonSocialEmp}</div>
          <div class="sig-rut">${rutEmp}</div>
        </td>
      </tr>
    </table>

    <div class="footer-note">
      Documento oficial generado en Módulo Contabilidad &amp; Recursos Humanos (${nombreCortoEmp}) y archivado en Biblioteca Documental de Personas.
    </div>
  </div>
</body>
</html>`;
}

async function compilarAnexoPdfWkhtmltopdf(htmlContent, outPdfPath) {
  const tmpHtmlPath = path.join(os.tmpdir(), `anexo_rh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.html`);
  fs.writeFileSync(tmpHtmlPath, htmlContent, 'utf8');
  try {
    await new Promise((resolve, reject) => {
      const isWin = process.platform === 'win32';
      const cmd = isWin
        ? `wkhtmltopdf --enable-local-file-access --load-error-handling ignore --load-media-error-handling ignore --page-size A4 --orientation Portrait --margin-top 10mm --margin-bottom 10mm --margin-left 10mm --margin-right 10mm "${tmpHtmlPath}" "${outPdfPath}"`
        : `xvfb-run -a --server-args="-screen 0 794x1123x24" wkhtmltopdf --enable-local-file-access --load-error-handling ignore --load-media-error-handling ignore --page-size A4 --orientation Portrait --margin-top 10mm --margin-bottom 10mm --margin-left 10mm --margin-right 10mm "${tmpHtmlPath}" "${outPdfPath}"`;

      exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
        if (error && !fs.existsSync(outPdfPath)) {
          console.error('[ANEXO-RH wkhtmltopdf] Error:', error.message, stderr);
          return reject(new Error('Fallo al compilar Anexo de Contrato con wkhtmltopdf: ' + error.message));
        }
        resolve();
      });
    });
  } finally {
    try { if (fs.existsSync(tmpHtmlPath)) fs.unlinkSync(tmpHtmlPath); } catch (_) {}
  }
}

exports.listarAnexosContratoRH = async (req, res) => {
  try {
    const [anexos, padron_trabajadores] = await Promise.all([
      obtenerAnexosContratoRH(db),
      obtenerPadronTrabajadoresRH(db)
    ]);
    return res.status(200).json({
      success: true,
      data: {
        anexos,
        padron_trabajadores
      }
    });
  } catch (error) {
    console.error('[ANEXO-RH] Error listando anexos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al listar anexos de contrato RH',
      error: error.message
    });
  }
};

exports.generarAnexoContratoRH = async (req, res) => {
  try {
    const {
      id_empresa_empleadora = 9,
      ciudad_emision = 'Temuco',
      fecha_emision,
      id_user,
      trabajador_nombre,
      trabajador_rut,
      trabajador_cargo,
      id_proyecto,
      codi_proyecto,
      proyecto_obra,
      empresa_cliente,
      rut_cliente,
      ubicacion_obra,
      fecha_hasta
    } = req.body || {};

    if (!trabajador_nombre || !trabajador_rut || !trabajador_cargo || !proyecto_obra || !empresa_cliente || !ubicacion_obra) {
      return res.status(400).json({
        success: false,
        message: 'Todos los datos del trabajador (Nombre, RUT, Cargo) y de la obra destino (Proyecto, Empresa Cliente, Ubicación) son obligatorios.'
      });
    }

    const idEmp = Number(id_empresa_empleadora || 9);
    const empCat = EMPRESAS_HERMANAS_ANEXO[idEmp] || EMPRESAS_HERMANAS_ANEXO[9];
    const fechaEmisionIso = (fecha_emision && /^\d{4}-\d{2}-\d{2}/.test(String(fecha_emision)))
      ? String(fecha_emision).slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    const fechaHastaIso = (fecha_hasta && /^\d{4}-\d{2}-\d{2}/.test(String(fecha_hasta)))
      ? String(fecha_hasta).slice(0, 10)
      : fechaEmisionIso;

    // 1. Resolver o crear trabajador en tsec_users para garantizar vínculo en Biblioteca de Personas
    let targetUserId = id_user ? Number(id_user) : null;
    const cleanRut = String(trabajador_rut || '').replace(/[^0-9kK]/g, '').toUpperCase();

    if (!targetUserId && cleanRut) {
      const existRes = await db.query(
        `SELECT id_user FROM tsec_users WHERE UPPER(REGEXP_REPLACE(COALESCE(rut, ''), '[^0-9kK]', '', 'g')) = $1 LIMIT 1`,
        [cleanRut]
      );
      if (existRes.rows.length > 0) {
        targetUserId = existRes.rows[0].id_user;
      }
    }

    if (!targetUserId) {
      const partes = String(trabajador_nombre).trim().split(/\s+/);
      const nameFrst = (partes[0] || 'TRABAJADOR').slice(0, 50);
      const apellidoPat = (partes.slice(1).join(' ') || 'GSP').slice(0, 50);
      const rutDb = String(trabajador_rut || '').replace(/\./g, '').trim().toUpperCase().slice(0, 10);
      const emailGen = `rh.${cleanRut.toLowerCase() || Date.now()}@arriendosanpablo.cl`;
      const jsonData = {
        cargo: String(trabajador_cargo).trim().toUpperCase(),
        rut_formateado: String(trabajador_rut).trim(),
        origen_registro: 'ANEXO_CONTRATO_RH',
        fecha_registro: new Date().toISOString()
      };
      const insUser = await db.query(
        `INSERT INTO tsec_users (
           name_frst, apellido_pat, rut, email, id_empresa, activo, flag_proc_enrol, codi_user, json_data, fecha_creacion, fecha_actualizacion
         ) VALUES ($1, $2, $3, $4, $5, true, false, $4, $6, NOW(), NOW())
         RETURNING id_user`,
        [nameFrst, apellidoPat, rutDb, emailGen, idEmp, JSON.stringify(jsonData)]
      );
      targetUserId = insUser.rows[0].id_user;
    } else {
      // Actualizar cargo en json_data si estaba vacío
      await db.query(
        `UPDATE tsec_users 
         SET json_data = COALESCE(json_data, '{}'::jsonb) || jsonb_build_object('cargo', $2::text),
             fecha_actualizacion = NOW()
         WHERE id_user = $1`,
        [targetUserId, String(trabajador_cargo).trim().toUpperCase()]
      );
    }

    // 2. Asegurar Tipo de Certificado en tsec_tipos_certificado_persona
    const idTipoCert = await asegurarTipoCertificadoAnexoObra(db);

    // 3. Preparar directorio de almacenamiento en /u05/LeanDocs/anexos_contrato
    const baseDocsDir = fs.existsSync('/u05/LeanDocs')
      ? '/u05/LeanDocs/anexos_contrato'
      : path.join(os.tmpdir(), 'LeanDocs_anexos_contrato');
    if (!fs.existsSync(baseDocsDir)) {
      fs.mkdirSync(baseDocsDir, { recursive: true });
    }

    const stamp = Date.now();
    const safeRut = cleanRut || 'SINRUT';
    const internalFileName = `Anexo_Cambio_Obra_${safeRut}_${stamp}.pdf`;
    const fullPdfPath = path.join(baseDocsDir, internalFileName);
    const displayFileName = `Anexo Cambio de Obra — ${String(proyecto_obra).trim()} (${String(empresa_cliente).trim()}) — Cargo: ${String(trabajador_cargo).trim()}.pdf`;

    const metaPayload = {
      id_empresa_empleadora: idEmp,
      empresa_empleadora_nombre: empCat.nombre_corto,
      empresa_empleadora_razon_social: empCat.razon_social,
      empresa_empleadora_rut: empCat.rut,
      empresa_empleadora_domicilio: empCat.domicilio,
      ciudad_emision: String(ciudad_emision || 'Temuco').trim(),
      fecha_emision: fechaEmisionIso,
      fecha_hasta: fechaHastaIso,
      id_user: targetUserId,
      trabajador_nombre: String(trabajador_nombre).trim().toUpperCase(),
      trabajador_rut: String(trabajador_rut).trim(),
      trabajador_cargo: String(trabajador_cargo).trim().toUpperCase(),
      id_proyecto: id_proyecto || null,
      codi_proyecto: codi_proyecto || '',
      proyecto_obra: String(proyecto_obra).trim().toUpperCase(),
      empresa_cliente: String(empresa_cliente).trim().toUpperCase(),
      rut_cliente: String(rut_cliente || '').trim(),
      ubicacion_obra: String(ubicacion_obra).trim()
    };

    // 4. Generar PDF con wkhtmltopdf
    const htmlContent = buildAnexoContratoTrabajoHtml(metaPayload);
    await compilarAnexoPdfWkhtmltopdf(htmlContent, fullPdfPath);

    // 5. Persistir en tfmg_file
    const archivoModel = new ArchivoModel();
    const fileRow = await archivoModel.insertarTfmgFile(
      'PDF',
      'application/pdf',
      displayFileName,
      internalFileName,
      fullPdfPath,
      req.user?.id_user || targetUserId,
      1
    );
    const idDoc = fileRow?.id_doc;

    // 6. Vincular en tsec_certificados_persona (Biblioteca Documental -> Dimensión Personas)
    const certIns = await db.query(
      `INSERT INTO tsec_certificados_persona (
         id_user, id_tipo_certificado_persona, fecha_emision, fecha_vencimiento, id_doc, observaciones, id_empresa
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id_certificado_persona AS id_cert`,
      [
        targetUserId,
        idTipoCert,
        fechaEmisionIso,
        fechaHastaIso,
        idDoc,
        displayFileName,
        idEmp
      ]
    );
    const idCert = certIns.rows[0].id_cert;
    metaPayload.id_cert = idCert;
    metaPayload.id_doc = idDoc;
    metaPayload.folio_anexo = `ANX-${String(idCert).padStart(4, '0')}`;

    // Re-compilar con el folio definitivo ANX-XXXX y guardar JSON de metadatos junto al PDF
    const htmlFinal = buildAnexoContratoTrabajoHtml(metaPayload);
    await compilarAnexoPdfWkhtmltopdf(htmlFinal, fullPdfPath);
    fs.writeFileSync(`${fullPdfPath}.meta.json`, JSON.stringify(metaPayload, null, 2), 'utf8');

    await db.query('UPDATE tsec_users SET fecha_actualizacion = NOW() WHERE id_user = $1', [targetUserId]);

    const anexosActualizados = await obtenerAnexosContratoRH(db);

    return res.status(201).json({
      success: true,
      message: 'Anexo de Contrato generado y archivado en Biblioteca de Personas y en RH exitosamente.',
      data: {
        anexo: {
          ...metaPayload,
          url_pdf: `/api/archivo/ver/${idDoc}`
        },
        anexos: anexosActualizados
      }
    });
  } catch (error) {
    console.error('[ANEXO-RH] Error generando anexo de contrato:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al generar el Anexo de Contrato de Trabajo',
      error: error.message
    });
  }
};

exports.eliminarAnexoContratoRH = async (req, res) => {
  try {
    const { id_cert } = req.params;
    if (!id_cert) {
      return res.status(400).json({ success: false, message: 'id_cert es requerido' });
    }
    await db.query('DELETE FROM tsec_certificados_persona WHERE id_certificado_persona = $1', [id_cert]);
    const anexos = await obtenerAnexosContratoRH(db);
    return res.status(200).json({
      success: true,
      message: 'Anexo eliminado correctamente',
      data: { anexos }
    });
  } catch (error) {
    console.error('[ANEXO-RH] Error eliminando anexo:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar anexo de contrato',
      error: error.message
    });
  }
};
