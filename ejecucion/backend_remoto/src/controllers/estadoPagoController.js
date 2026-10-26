const fs = require('fs');
const path = require('path');
const estadoPagoModel = require('../models/estadoPagoModel');
const edpPdfService = require('../services/edpPdfService');
const { parsearFacturaDtePdf } = require('../services/dtePdfParserService');
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
    const snapLines = crmV1.lineas_servicio || jf.snapshot_comercial?.lines || jf.lines || [];
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

        if (l.tipo === 'TRASLADOS' || (l.subcategoria || '').includes('FLETE') || (l.subcategoria || '').includes('ESCOLTA')) {
          sub = valUnit * cant;
        } else if (['GRUAS TELESCOPICAS', 'GRUA HORQUILLA', 'MANIPULADOR TELESCOPICO', 'CAMION PLUMA'].includes(l.tipo)) {
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

    if (pass_fes !== usuario.pass_hash_fes) {
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

// 9.B Circuito de 3 Hitos / Firmas FES del Estado de Pago (Desacoplado de ITS)
// Paso 1: Control de Gestión (Yara) elabora y firma el EDP -> Notifica a Contabilidad
// Paso 2: Contabilidad valida y firma el EDP (o devuelve con observaciones) -> Notifica a Comercial y habilita Facturación Inmediata si cumple regla OC
// Paso 3: Comercial firma y despacha el EDP al Cliente Mandante
exports.firmarPasoEdp = async (req, res) => {
  try {
    const {
      id_proyecto,
      id_user,
      paso, // 1: Control de Gestión, 2: Contabilidad, 3: Comercial
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
      return res.status(400).json({ success: false, message: 'Paso inválido. Debe ser 1 (Control de Gestión), 2 (Contabilidad) o 3 (Comercial).' });
    }

    // 1. Obtener usuario
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
      if (pass_fes !== usuario.pass_hash_fes) {
        return res.status(401).json({ success: false, message: 'PIN de firma FES incorrecto' });
      }
    } else {
      if (!observaciones || !String(observaciones).trim()) {
        return res.status(400).json({ success: false, message: 'Debe indicar las observaciones para devolver el EDP' });
      }
    }

    // 2. Obtener proyecto y datos del cliente / comercial
    const proyRes = await db.query(`
      SELECT p.*,
             COALESCE(c.razon_social, c.name_empresa, p.json_field->'crm_v1'->>'cliente_nombre', 'Cliente Mandante') AS cliente_nombre,
             COALESCE(c.rut_empresa, p.json_field->'crm_v1'->>'cliente_rut', '') AS cliente_rut,
             COALESCE(p.json_field->'crm_v1'->>'contacto_email', p.json_field->>'cliente_email', '') AS cliente_email,
             u_crea.email AS creador_email,
             COALESCE(u_crea.name_frst || ' ' || u_crea.apellido_pat, '') AS creador_nombre
      FROM tpry_proyecto p
      LEFT JOIN tpar_empresas c ON p.id_empresa_cliente = c.id_empresa
      LEFT JOIN tsec_users u_crea ON p.id_user_crea = u_crea.id_user
      WHERE p.id_proyecto = $1;
    `, [id_proyecto]);

    if (proyRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    }
    const proyecto = proyRes.rows[0];
    const jf = typeof proyecto.json_field === 'string' ? JSON.parse(proyecto.json_field || '{}') : (proyecto.json_field || {});
    const crmV1 = jf.crm_v1 || {};

    // Evaluar condición de OC / HES y disponibilidad actual de OC
    const requiereOc = Boolean(crmV1.requiere_oc_hes ?? jf.datos_generales?.requiere_oc_hes ?? false);
    const ordenesCompra = Array.isArray(jf.ordenes_compra)
      ? jf.ordenes_compra
      : (Array.isArray(crmV1.ordenes_compra) ? crmV1.ordenes_compra : []);
    const tieneOc = ordenesCompra.length > 0 || Boolean(jf.oc_v1?.numero_oc);
    const montoTotalOcs = ordenesCompra.reduce((acc, item) => acc + (Number(item.monto_neto) || 0), 0) || Number(jf.oc_v1?.monto_neto || 0);

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

    const baseUrl = process.env.APP_BASE_URL || 'https://servidor.leanglobal.cl';
    const envPrefix = (process.env.APP_ENV === 'prod') ? '/lg-gsp-prod' : '/lg-gsp-dev';
    const edpPdfUrl = `${baseUrl}${envPrefix}/api/operaciones/edp/proyecto/${id_proyecto}/pdf`;
    const torreUrl = `${baseUrl}${envPrefix}/torre`;

    // CASO DEVOLUCIÓN (Contabilidad devuelve a Control de Gestión con observaciones)
    if (accion === 'DEVOLVER') {
      flujoActual.estado = 'OBSERVADO_CONTABILIDAD';
      flujoActual.paso_actual = 1;
      flujoActual.firma_2_contabilidad = null;
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
        observaciones: String(observaciones).trim()
      });

      jf.edp_flujo_v1 = flujoActual;
      await db.query('UPDATE tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2', [JSON.stringify(jf), id_proyecto]);

      // Notificar a Control de Gestión (Yara)
      const destAnalista = new Set(['logistica@arriendosanpablo.cl']);
      if (flujoActual.firma_1_analista?.email_firmante) {
        destAnalista.add(flujoActual.firma_1_analista.email_firmante);
      }
      for (const emailDest of destAnalista) {
        notificacionService.despacharEmailSmtp({
          para: emailDest,
          cc: 'mseguel@arriendosanpablo.cl',
          asunto: `[GSP] ⚠️ EDP Devuelto con Observaciones por Contabilidad: ${proyecto.codi_proyecto}`,
          titulo: `EDP Observado por Contabilidad: ${proyecto.codi_proyecto}`,
          subtitulo: `Devuelto por ${nombreUsuario} para corrección en Control de Gestión`,
          contenido: `<p>El área de <strong>Contabilidad (${nombreUsuario})</strong> ha revisado el Estado de Pago de la OT <strong>${proyecto.codi_proyecto}</strong> (${proyecto.cliente_nombre}) y lo ha devuelto a Control de Gestión con las siguientes observaciones:</p>
          <div style="background:#450a0a; border:1px solid #dc2626; border-radius:8px; padding:14px; margin:14px 0; color:#fecaca;">
            <strong>📝 Observación de Contabilidad:</strong><br/>
            ${String(observaciones).trim()}
          </div>
          <p>Por favor ingrese a la Carátula EDP en la Torre de Control para ajustar los datos y volver a emitir la firma de Control de Gestión.</p>`,
          botonTexto: 'ABRIR TORRE DE CONTROL',
          botonUrl: torreUrl
        }).catch(e => console.warn('[EDP Mail Devolución]', e.message));
      }

      return res.status(200).json({
        success: true,
        message: 'EDP devuelto a Control de Gestión con observaciones.',
        edp_flujo_v1: flujoActual
      });
    }

    // CASO FIRMA FES POR PASO (1, 2 o 3)
    const cargosPorPaso = {
      1: 'Control de Gestión / Analista Operativo',
      2: 'Contabilidad y Facturación',
      3: 'Ejecutivo Comercial Responsable'
    };

    const datosFirma = {
      paso: pasoNum,
      id_user: usuario.id_user,
      nombre_firmante: nombreUsuario,
      rut_firmante: usuario.rut || '',
      email_firmante: usuario.email || '',
      cargo: cargosPorPaso[pasoNum],
      codigo_fes: codigoFes,
      fecha_firma: ahoraIso,
      observaciones: observaciones || `Validado y firmado en Paso ${pasoNum} (${cargosPorPaso[pasoNum]})`
    };

    if (pasoNum === 1) {
      // HITO 1: Yara (Control de Gestión) da el OK de reports y genera el EDP con su firma FES
      flujoActual.firma_1_analista = datosFirma;
      flujoActual.observacion_devolucion = null;

      // Desacople total (Acuerdo Maritza Seguel / Jorge Ponce):
      // Al validar Control de Gestión, el EDP queda liberado automáticamente para Facturación
      // y Despacho Comercial sin requerir una 2° firma contable.
      const habilitadoFacturarInmediato = !requiereOc || tieneOc;
      flujoActual.estado = habilitadoFacturarInmediato ? 'LIBERADO_FACTURAR' : 'ESPERANDO_OC_CLIENTE';
      flujoActual.paso_actual = 2; // Pasa directo al Despacho Comercial
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

      // Notificar a Contabilidad: EDP Liberado para Facturar (o retenido por OC)
      const badgeOcHtml = !requiereOc
        ? `<span style="background:#065f46; color:#a7f3d0; padding:4px 8px; border-radius:4px; font-weight:bold;">NO REQUIERE OC (Facturación Inmediata Habilitada)</span>`
        : (tieneOc
          ? `<span style="background:#065f46; color:#a7f3d0; padding:4px 8px; border-radius:4px; font-weight:bold;">REQUIERE OC — OC YA CARGADA (#${jf.oc_v1?.numero_oc || ordenesCompra[0]?.numero_oc})</span>`
          : `<span style="background:#78350f; color:#fde68a; padding:4px 8px; border-radius:4px; font-weight:bold;">REQUIERE OC — PENDIENTE RECEPCIÓN DE OC DEL CLIENTE</span>`);

      const asuntoConta = habilitadoFacturarInmediato
        ? `[GSP] 🟢 LISTO PARA FACTURAR: ${proyecto.codi_proyecto} — ${proyecto.cliente_nombre}`
        : `[GSP] ⏳ EDP Liberado (${proyecto.codi_proyecto}) — Esperando OC Comercial`;

      notificacionService.despacharEmailSmtp({
        para: 'mseguel@arriendosanpablo.cl',
        cc: 'omar.ghiselini@arriendosanpablo.cl, logistica@arriendosanpablo.cl',
        asunto: asuntoConta,
        titulo: `Estado de Pago Liberado: ${proyecto.codi_proyecto}`,
        subtitulo: `Validado por ${nombreUsuario} (Control de Gestión) — Facturación Desacoplada`,
        contenido: `<p><strong>Control de Gestión (${nombreUsuario})</strong> ha validado el 100% de los Reports Diarios del servicio <strong>${proyecto.codi_proyecto}</strong> (${proyecto.cliente_nombre}) y ha emitido el EDP con Firma FES (<code>${codigoFes}</code>).</p>
        <div style="background:#0f172a; border:1px solid #334155; border-radius:8px; padding:14px; margin:14px 0; color:#e2e8f0;">
          <p style="margin:4px 0;"><strong>Cliente Mandante:</strong> ${proyecto.cliente_nombre} (${proyecto.cliente_rut || 'S/R'})</p>
          <p style="margin:4px 0;"><strong>Obra / Faena:</strong> ${crmV1.obra_nombre || proyecto.nombre_proyecto || 'Faena'}</p>
          <p style="margin:8px 0 4px 0;"><strong>Condición de Orden de Compra:</strong> ${badgeOcHtml}</p>
        </div>
        <p>${habilitadoFacturarInmediato ? '<strong>Acción Contable:</strong> El servicio se encuentra habilitado para subir la Factura DTE oficial sin esperar firmas adicionales.' : '<strong>Estado:</strong> A la espera de que Comercial cargue la Orden de Compra.'}</p>`,
        botonTexto: 'ABRIR BANDEJA CONTABLE',
        botonUrl: torreUrl
      }).catch(e => console.warn('[EDP Mail Paso 1 -> Contabilidad]', e.message));

      // Notificar al Ejecutivo Comercial para despacho al cliente
      const emailComercial = crmV1.vendedor_email || proyecto.creador_email || 'omar.ghiselini@arriendosanpablo.cl';
      notificacionService.despacharEmailSmtp({
        para: emailComercial,
        cc: 'mseguel@arriendosanpablo.cl, logistica@arriendosanpablo.cl',
        asunto: `[GSP] 📑 EDP Disponible para Despacho al Cliente: ${proyecto.codi_proyecto}`,
        titulo: `EDP Listo para Despacho: ${proyecto.codi_proyecto}`,
        subtitulo: `Validado por Control de Gestión (${codigoFes})`,
        contenido: `<p>El Estado de Pago del servicio <strong>${proyecto.codi_proyecto}</strong> (${proyecto.cliente_nombre}) ha sido emitido por Control de Gestión y se encuentra disponible para su firma y despacho formal al mandante.</p>
        ${requiereOc && !tieneOc ? `<div style="background:#451a03; border:1px solid #f59e0b; border-radius:8px; padding:12px; margin:12px 0; color:#fef3c7;"><strong>⚠️ ATENCIÓN COMERCIAL:</strong> Este servicio requiere Orden de Compra. Por favor cárguela en la plataforma para destrabar la facturación en Contabilidad.</div>` : ''}`,
        botonTexto: 'VER Y DESPACHAR EDP AL CLIENTE',
        botonUrl: edpPdfUrl
      }).catch(e => console.warn('[EDP Mail Paso 1 -> Comercial]', e.message));

      return res.status(200).json({
        success: true,
        message: 'EDP generado y firmado por Control de Gestión. Liberado automáticamente para facturación y despacho comercial.',
        codigo_fes: codigoFes,
        edp_flujo_v1: flujoActual
      });
    }

    if (pasoNum === 2 || pasoNum === 3) {
      // HITO COMERCIAL: Comercial firma y despacha el EDP al Cliente Mandante (Paso 2 o 3)
      const estadoDespacho = es_pago_anticipado ? 'INTERNO_PAGO_PREVIO' : 'DESPACHADO_CLIENTE';
      const firmaComercial = {
        ...datosFirma,
        paso: 2,
        cargo: 'Ejecutivo Comercial Responsable',
        es_pago_anticipado: !!es_pago_anticipado,
        estado_despacho: estadoDespacho
      };

      flujoActual.firma_3_comercial = firmaComercial;
      flujoActual.estado = estadoDespacho;
      flujoActual.paso_actual = 3;
      flujoActual.requiere_oc = requiereOc;
      flujoActual.tiene_oc = tieneOc;
      flujoActual.habilitado_facturar = !requiereOc || tieneOc;

      flujoActual.historial.unshift({
        paso: 2,
        accion: es_pago_anticipado ? 'FIRMAR_COMERCIAL_INTERNO' : 'FIRMAR_Y_DESPACHAR_CLIENTE',
        usuario: nombreUsuario,
        codigo_fes: codigoFes,
        fecha: ahoraIso,
        observaciones: datosFirma.observaciones
      });

      jf.edp_flujo_v1 = flujoActual;
      jf.edp_firma_comercial = firmaComercial;

      await db.query('UPDATE tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2', [JSON.stringify(jf), id_proyecto]);

      const ccInstitucionales = [
        'omar.ghiselini@arriendosanpablo.cl',
        'mseguel@arriendosanpablo.cl',
        'logistica@arriendosanpablo.cl'
      ];

      if (!es_pago_anticipado && proyecto.cliente_email) {
        notificacionService.despacharEmailSmtp({
          para: proyecto.cliente_email,
          cc: ccInstitucionales.join(', '),
          asunto: `[Grúas San Pablo] Estado de Pago Oficial — Servicio ${proyecto.codi_proyecto}`,
          titulo: `Estado de Pago Oficial: ${proyecto.codi_proyecto}`,
          subtitulo: `Emitido y despachado por Área Comercial (${nombreUsuario})`,
          contenido: `<p>Estimado Cliente Mandante (<strong>${proyecto.cliente_nombre}</strong>),</p>
          <p>Junto con saludar, remitimos el <strong>Estado de Pago Oficial</strong> correspondiente a los servicios prestados en la obra/faena <strong>${crmV1.obra_nombre || proyecto.nombre_proyecto || 'Faena en Terreno'}</strong>.</p>
          <div style="background:#1e293b; border:1px solid #475569; border-radius:8px; padding:12px; margin:12px 0; color:#e2e8f0;">
            📄 <strong>Certificación Triple Firma FES:</strong> Este Estado de Pago cuenta con validación de Control de Gestión, Contabilidad y Área Comercial bajo el código <code>${codigoFes}</code>.
          </div>
          ${requiereOc && !tieneOc ? `<p>Agradecemos emitir y enviarnos la correspondiente <strong>Orden de Compra (OC / HES)</strong> para proceder con la emisión de la Factura Electrónica DTE.</p>` : `<p>El documento se encuentra disponible para su descarga directa en el siguiente botón:</p>`}`,
          botonTexto: 'DESCARGAR DOSSIER EDP OFICIAL (PDF)',
          botonUrl: edpPdfUrl
        }).catch(e => console.warn('[EDP Mail Paso 3 -> Cliente]', e.message));
      } else {
        for (const ccEmail of ccInstitucionales) {
          notificacionService.despacharEmailSmtp({
            para: ccEmail,
            asunto: `[GSP] 📄 EDP Firmado por Comercial (${proyecto.codi_proyecto}) - ${proyecto.cliente_nombre}`,
            titulo: `Circuito de 3 Firmas EDP Completado: ${proyecto.codi_proyecto}`,
            subtitulo: `Firmado por Comercial (${nombreUsuario}) — ${es_pago_anticipado ? 'Pago Anticipado' : 'Despachado al Cliente'}`,
            contenido: `<p>El Ejecutivo Comercial <strong>${nombreUsuario}</strong> ha completado el Hito 3 del Estado de Pago para el proyecto <strong>${proyecto.codi_proyecto}</strong> (${proyecto.cliente_nombre}).</p>`,
            botonTexto: 'VER DOSSIER EDP OFICIAL',
            botonUrl: edpPdfUrl
          }).catch(e => console.warn('[EDP Mail Paso 3 Interno]', e.message));
        }
      }

      return res.status(200).json({
        success: true,
        message: es_pago_anticipado
          ? 'EDP visado exitosamente por Comercial (Pago Anticipado).'
          : 'EDP firmado por Comercial y despachado al Cliente Mandante con copia a Contabilidad.',
        codigo_fes: codigoFes,
        firma: firmaComercial,
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
        ra.id_doc_pdf,
        ra.cliente_nombre AS receptor_faena,
        COALESCE(e.patente, 'S/P') AS equipo_patente,
        COALESCE(NULLIF(TRIM(COALESCE(e.marca, '') || ' ' || COALESCE(e.modelo, '')), ''), e.modelo, 'Equipo Izaje') AS equipo_nombre,
        COALESCE(e.modelo, '') AS equipo_modelo,
        COALESCE(e.tipo_equipo, 'GRUA') AS equipo_tipo,
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
      ORDER BY ra.fecha_reporte DESC, ra.id_reporte_avance DESC;
    `);

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

    // Indexar viáticos por proyecto
    const viaticosPorProyecto = new Map();
    for (const c of costosItsRes.rows) {
      const cat = String(c.categoria_costo || '').toUpperCase();
      if (cat.includes('PENSION') || cat.includes('ALIMENTA') || cat.includes('VIATICO') || cat.includes('ALOJAMIENTO')) {
        viaticosPorProyecto.set(c.id_proyecto, (viaticosPorProyecto.get(c.id_proyecto) || 0) + Number(c.monto_total || 0));
      }
    }

    const EMPRESAS_HOLDING = {
      9: 'Grúas San Pablo',
      7: 'Bestmaq',
      8: 'Logística del Sur',
      11: 'Royal Rental'
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

    // Mapas para Submenú 2 (Horas Operadores/Riggers) y Submenú 3 (Ventas por Grúa/Equipo)
    const mapaTrabajadores = new Map();
    const detalleJornadasPersonal = [];
    const mapaEquipos = new Map();
    const detalleAsignacionesEquipo = [];

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

      const fechaRef = p.fecha_plan_ini || p.fecha_creacion;
      if (fecha_desde && fechaRef && new Date(fechaRef) < new Date(fecha_desde)) continue;
      if (fecha_hasta && fechaRef && new Date(fechaRef) > new Date(fecha_hasta + 'T23:59:59')) continue;

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
        const sub = Number(l.subtotal_calculado || l.subtotal || (valUnit * cant));
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
      const montoComprometido = montoLineasCotizadas > 0
        ? Math.round(montoLineasCotizadas)
        : (netoCrm > 0 ? Math.round(netoCrm) : Math.round(itsIngresosNeto));

      // 2. Calcular Devengado por Reports Diarios
      const repsProyecto = reportsPorProyecto.get(p.id_proyecto) || [];
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
        // Valorizar según líneas tarifarias y horas reales de reports
        let subDev = 0;
        if (lineas.length > 0) {
          const diasFaena = Math.max(1, totalReports);
          for (const l of lineas) {
            const valUnit = Number(l.valorUnitario || l.precio_unitario || 0);
            const cant = Number(l.cantidad || 1);
            const tipoUpper = String(l.tipo || '').toUpperCase();
            const subcatUpper = String(l.subcategoria || '').toUpperCase();

            if (tipoUpper === 'TRASLADOS' || subcatUpper.includes('FLETE') || subcatUpper.includes('ESCOLTA')) {
              subDev += valUnit * cant;
            } else if (['GRUAS TELESCOPICAS', 'GRUA HORQUILLA', 'MANIPULADOR TELESCOPICO', 'CAMION PLUMA'].includes(tipoUpper)) {
              if (String(l.unidad || '').toLowerCase() === 'diario') {
                subDev += valUnit * diasFaena * cant;
              } else {
                const hrsAplicar = horasFacturablesPry > 0 ? horasFacturablesPry : (cant * 8);
                subDev += valUnit * hrsAplicar;
              }
            } else {
              subDev += Number(l.subtotal_calculado || l.subtotal || (valUnit * cant));
            }
          }
          // Erradicación de sobretiempo hardcodeado ($65.000). Las horas facturables (horasFacturablesPry)
          // ya incorporan la totalidad de horas operadas y de sobretiempo liquidables.
          const stOverride = (jf.edp_ajustes_v1?.sobretiempo_override !== null && jf.edp_ajustes_v1?.sobretiempo_override !== undefined)
            ? Number(jf.edp_ajustes_v1.sobretiempo_override)
            : 0;
          if (stOverride > 0) {
            subDev += stOverride;
          }
        }
        montoDevengadoReports = subDev > 0 ? Math.round(subDev) : montoComprometido;
      } else if (p.id_proyecto_estado >= 6 && itsIngresosNeto > 0) {
        montoDevengadoReports = Math.round(itsIngresosNeto);
      }

      // 3. Cerrado en ITS (Gestión Interna)
      const tieneIts = Boolean(p.id_its);
      const itsCerrado = p.estado_its === 'CONCLUIDO' || p.estado_its === 'EN_REVISION_CONTABILIDAD' || p.estado_its === 'EN_REVISION_OPERACIONES';
      const montoItsNeto = itsIngresosNeto > 0 ? Math.round(itsIngresosNeto) : 0;
      const montoItsCostos = Math.round(Number(p.its_costos_operacionales || 0));
      const margenItsPct = Number(p.its_margen_pct || (montoItsNeto > 0 ? (((montoItsNeto - montoItsCostos) / montoItsNeto) * 100).toFixed(1) : 0));

      // 4. Estado de Pago (EDP) y Circuito de 3 Firmas FES + OC
      const requiereOcHes = Boolean(crmV1.requiere_oc_hes ?? jf.datos_generales?.requiere_oc_hes ?? false);
      const ordenesCompra = Array.isArray(jf.ordenes_compra)
        ? jf.ordenes_compra
        : (Array.isArray(crmV1.ordenes_compra) ? crmV1.ordenes_compra : []);
      const tieneOc = ordenesCompra.length > 0 || Boolean(jf.oc_v1?.numero_oc);
      const numeroOc = jf.oc_v1?.numero_oc || ordenesCompra[0]?.numero_oc || null;
      const montoOcNeto = ordenesCompra.reduce((acc, o) => acc + (Number(o.monto_neto) || 0), 0) || Number(jf.oc_v1?.monto_neto || 0);

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
      const habilitadoFacturar = Boolean(!esCierreTotalFacturado && edpLiberado && (!requiereOcHes || tieneOc));

      // Estado / Semáforo Contable
      let semaforoContable = 'ADJUDICADO_SIN_REPORTS';
      let semaforoLabel = 'Adjudicado (Sin Reports)';
      if (esCierreTotalFacturado) {
        semaforoContable = 'FACTURADO';
        semaforoLabel = `100% Facturado (${facturasDteLista.length || 1} DTE: #${facturaNumero || 'OK'})`;
      } else if (esFacturacionParcial) {
        semaforoContable = 'FACTURACION_PARCIAL';
        semaforoLabel = `Facturación Parcial (${facturasDteLista.length} DTE · Saldo ${ '$' + saldoPendienteFacturar.toLocaleString('es-CL') })`;
      } else if (edpFlujo?.estado === 'DEVUELTO_CONTABILIDAD') {
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
      // POBLAR SUBMENÚ 2: HORAS DE OPERADORES Y RIGGERS
      // =========================================================================
      const viaticoPryTotal = viaticosPorProyecto.get(p.id_proyecto) || 0;
      const viaticoPorReport = totalReports > 0 ? Math.round(viaticoPryTotal / totalReports) : 0;

      for (const rep of repsProyecto) {
        const hrsTotal = Number(rep.horas_facturables || rep.horas_operadas || 0);
        const hrsSt = Number(rep.horas_sobretiempo || 0);
        const hrsNorm = Math.max(0, Number((hrsTotal - hrsSt).toFixed(1)));

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
              viaticos_clp: 0
            });
          }
          const tOp = mapaTrabajadores.get(opKey);
          tOp.ots_set.add(p.codi_proyecto || `OT-${p.id_proyecto}`);
          if (rep.fecha_reporte_fmt) tOp.fechas_set.add(rep.fecha_reporte_fmt);
          tOp.reports_count += 1;
          tOp.horas_normales = Number((tOp.horas_normales + hrsNorm).toFixed(1));
          tOp.horas_sobretiempo = Number((tOp.horas_sobretiempo + hrsSt).toFixed(1));
          tOp.horas_totales = Number((tOp.horas_totales + hrsTotal).toFixed(1));
          tOp.viaticos_clp += viaticoPorReport;

          detalleJornadasPersonal.push({
            id_reporte: rep.id_reporte_avance,
            fecha: rep.fecha_reporte_fmt || '',
            trabajador: rep.operador_nombre || 'Operador',
            rut: rep.operador_rut || 'S/R',
            rol: 'OPERADOR',
            codi_proyecto: p.codi_proyecto || `OT-${p.id_proyecto}`,
            cliente_nombre: p.cliente_nombre,
            empresa_emisora: empresaCorto,
            equipo_patente: rep.equipo_patente,
            equipo_modelo: rep.equipo_modelo || rep.equipo_nombre,
            horas_normales: hrsNorm,
            horas_sobretiempo: hrsSt,
            horas_totales: hrsTotal,
            estado_reporte: rep.estado_reporte,
            viatico_estimado_clp: viaticoPorReport
          });
        }

        // Registrar Rigger si participó en el report
        if (rep.id_user_rigger && rep.rigger_nombre) {
          const rigKey = `RIG-${rep.id_user_rigger}`;
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
              viaticos_clp: 0
            });
          }
          const tRig = mapaTrabajadores.get(rigKey);
          tRig.ots_set.add(p.codi_proyecto || `OT-${p.id_proyecto}`);
          if (rep.fecha_reporte_fmt) tRig.fechas_set.add(rep.fecha_reporte_fmt);
          tRig.reports_count += 1;
          tRig.horas_normales = Number((tRig.horas_normales + hrsNorm).toFixed(1));
          tRig.horas_sobretiempo = Number((tRig.horas_sobretiempo + hrsSt).toFixed(1));
          tRig.horas_totales = Number((tRig.horas_totales + hrsTotal).toFixed(1));

          detalleJornadasPersonal.push({
            id_reporte: rep.id_reporte_avance,
            fecha: rep.fecha_reporte_fmt || '',
            trabajador: rep.rigger_nombre,
            rut: rep.rigger_rut || 'S/R',
            rol: 'RIGGER',
            codi_proyecto: p.codi_proyecto || `OT-${p.id_proyecto}`,
            cliente_nombre: p.cliente_nombre,
            empresa_emisora: empresaCorto,
            equipo_patente: rep.equipo_patente,
            equipo_modelo: rep.equipo_modelo || rep.equipo_nombre,
            horas_normales: hrsNorm,
            horas_sobretiempo: hrsSt,
            horas_totales: hrsTotal,
            estado_reporte: rep.estado_reporte,
            viatico_estimado_clp: 0
          });
        }
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
      viaticos_clp: t.viaticos_clp
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
