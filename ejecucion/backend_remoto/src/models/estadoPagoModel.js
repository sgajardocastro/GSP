const db = require('../config/dbConfig');

const estadoPagoModel = {
  // 1. Desplazamiento & Telemetria GPS (tequ_log_desplazamiento)
  async registrarPingDesplazamiento({ id_proyecto, id_equipo, patente, tipo_trayecto, latitud, longitud, velocidad_kmh, evento, km_inicial, km_final }) {
    // Buscar si ya existe un trayecto en_ruta activo para este proyecto/equipo
    const checkSql = `
      SELECT id_log_desplazamiento, pings_ruta 
      FROM sch_leangsp.tequ_log_desplazamiento 
      WHERE id_proyecto = $1 AND estado_trayecto = 'EN_RUTA' 
      ORDER BY id_log_desplazamiento DESC LIMIT 1;
    `;
    const checkRes = await db.query(checkSql, [id_proyecto]);

    const pingObj = {
      lat: Number(latitud),
      lng: Number(longitud),
      kmh: Number(velocidad_kmh || 0),
      evento: evento || 'PING_RUTA',
      ts: new Date().toISOString()
    };

    if (checkRes.rows.length > 0 && evento !== 'INICIO_DESPLAZAMIENTO') {
      // Actualizar trayecto existente agregando el ping al arreglo JSONB
      const idLog = checkRes.rows[0].id_log_desplazamiento;
      let updateSql = `
        UPDATE sch_leangsp.tequ_log_desplazamiento
        SET pings_ruta = pings_ruta || $1::jsonb
      `;
      const params = [JSON.stringify([pingObj])];

      if (evento === 'LLEGADA_FAENA') {
        updateSql += `, fecha_llegada_faena = CURRENT_TIMESTAMP, latitud_llegada_faena = $2, longitud_llegada_faena = $3`;
        params.push(latitud, longitud);
      } else if (evento === 'SALIDA_FAENA') {
        updateSql += `, fecha_salida_faena = CURRENT_TIMESTAMP, latitud_salida_faena = $2, longitud_salida_faena = $3`;
        params.push(latitud, longitud);
      } else if (evento === 'LLEGADA_PATIO') {
        updateSql += `, fecha_llegada_patio = CURRENT_TIMESTAMP, latitud_llegada_patio = $2, longitud_llegada_patio = $3, km_final = $4, estado_trayecto = 'LLEGADO'`;
        params.push(latitud, longitud, km_final || null);
      }

      updateSql += ` WHERE id_log_desplazamiento = $${params.length + 1} RETURNING *;`;
      params.push(idLog);

      const res = await db.query(updateSql, params);
      return res.rows[0];
    } else {
      // Crear nuevo registro de trayecto
      const insertSql = `
        INSERT INTO sch_leangsp.tequ_log_desplazamiento (
          id_proyecto, id_equipo, patente, tipo_trayecto, 
          fecha_salida_patio, latitud_salida_patio, longitud_salida_patio,
          km_inicial, estado_trayecto, pings_ruta
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6, $7, 'EN_RUTA', $8::jsonb)
        RETURNING *;
      `;
      const res = await db.query(insertSql, [
        id_proyecto, id_equipo || null, patente || null, tipo_trayecto || 'IDA',
        latitud, longitud, km_inicial || null, JSON.stringify([pingObj])
      ]);
      return res.rows[0];
    }
  },

  // 2. Crear Reporte Diario en Terreno (tedp_reporte_avance)
  async crearReporteDiario(data) {
    const {
      id_proyecto, id_log_desplazamiento, id_user_operador, fecha_reporte,
      unidad_cobro, incluye_flete_independiente,
      fecha_inicio_servicio, fecha_termino_servicio,
      latitud_inicio_servicio, longitud_inicio_servicio,
      latitud_termino_servicio, longitud_termino_servicio,
      horas_operadas, horas_standby, horas_colacion, monto_devengado_dia,
      observacion_trabajo, cliente_nombre, cliente_rut, cliente_cargo, cliente_firma_canvas_base64
    } = data;

    const sql = `
      INSERT INTO sch_leangsp.tedp_reporte_avance (
        id_proyecto, id_log_desplazamiento, id_user_operador, fecha_reporte,
        unidad_cobro, incluye_flete_independiente,
        fecha_inicio_servicio, fecha_termino_servicio,
        latitud_inicio_servicio, longitud_inicio_servicio,
        latitud_termino_servicio, longitud_termino_servicio,
        horas_operadas, horas_standby, horas_colacion, monto_devengado_dia,
        observacion_trabajo, cliente_nombre, cliente_rut, cliente_cargo, cliente_firma_canvas_base64,
        estado_reporte
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, 'PENDIENTE_EDP'
      ) RETURNING *;
    `;

    const res = await db.query(sql, [
      id_proyecto, id_log_desplazamiento || null, id_user_operador, fecha_reporte || new Date().toISOString().split('T')[0],
      unidad_cobro || 'HRS_DIA', incluye_flete_independiente !== undefined ? incluye_flete_independiente : true,
      fecha_inicio_servicio || null, fecha_termino_servicio || null,
      latitud_inicio_servicio || null, longitud_inicio_servicio || null,
      latitud_termino_servicio || null, longitud_termino_servicio || null,
      horas_operadas || 0, horas_standby || 0, horas_colacion || 0, monto_devengado_dia || 0,
      observacion_trabajo || null, cliente_nombre || null, cliente_rut || null, cliente_cargo || null, cliente_firma_canvas_base64 || null
    ]);

    return res.rows[0];
  },

  // 3. Obtener Reportes Diarios de un Proyecto
  async getReportesDiariosPorProyecto(id_proyecto) {
    const sql = `
      SELECT r.*, u.name_frst || ' ' || u.apellido_pat AS nombre_operador
      FROM sch_leangsp.tedp_reporte_avance r
      LEFT JOIN sch_leangsp.tsec_users u ON r.id_user_operador = u.id_user
      WHERE r.id_proyecto = $1
      ORDER BY r.fecha_reporte DESC, r.id_reporte_avance DESC;
    `;
    const res = await db.query(sql, [id_proyecto]);
    return res.rows;
  },

  // 4. Crear Estado de Pago (EDP) agrupadador
  async crearEstadoPago({ id_proyecto, numero_edp, fecha_corte_inicio, fecha_corte_fin, reportes_ids, items_adicionales }) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Obtener la suma del devengado de los reportes seleccionados
      let montoNetoReportes = 0;
      if (reportes_ids && reportes_ids.length > 0) {
        const sumRes = await client.query(`
          SELECT COALESCE(SUM(monto_devengado_dia), 0) AS total 
          FROM sch_leangsp.tedp_reporte_avance 
          WHERE id_reporte_avance = ANY($1::bigint[]);
        `, [reportes_ids]);
        montoNetoReportes = Number(sumRes.rows[0].total || 0);
      }

      // Sumar ítems adicionales si existen
      let montoAdicionales = 0;
      if (items_adicionales && Array.isArray(items_adicionales)) {
        montoAdicionales = items_adicionales.reduce((acc, it) => acc + Number(it.monto_subtotal || 0), 0);
      }

      const montoNetoTotal = montoNetoReportes + montoAdicionales;
      const montoIva = Math.round(montoNetoTotal * 0.19);
      const montoTotalBruto = montoNetoTotal + montoIva;

      // Insertar EDP
      const edpSql = `
        INSERT INTO sch_leangsp.tedp_estado_pago (
          id_proyecto, numero_edp, fecha_corte_inicio, fecha_corte_fin,
          monto_neto, monto_iva, monto_total, estado_edp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'BORRADOR')
        RETURNING *;
      `;
      const edpRes = await client.query(edpSql, [
        id_proyecto, numero_edp, fecha_corte_inicio, fecha_corte_fin,
        montoNetoTotal, montoIva, montoTotalBruto
      ]);
      const nuevoEdp = edpRes.rows[0];

      // Vincular id_edp en los reportes liquidados
      if (reportes_ids && reportes_ids.length > 0) {
        await client.query(`
          UPDATE sch_leangsp.tedp_reporte_avance 
          SET id_edp = $1, estado_reporte = 'AGRUPADO_EDP' 
          WHERE id_reporte_avance = ANY($2::bigint[]);
        `, [nuevoEdp.id_edp, reportes_ids]);
      }

      // Insertar detalle de ítems adicionales si corresponden
      if (items_adicionales && items_adicionales.length > 0) {
        for (const item of items_adicionales) {
          await client.query(`
            INSERT INTO sch_leangsp.tedp_estado_pago_detalle (
              id_edp, concepto, unidad_cobro, cantidad, precio_unitario, monto_subtotal
            ) VALUES ($1, $2, $3, $4, $5, $6);
          `, [nuevoEdp.id_edp, item.concepto, item.unidad_cobro || 'FIJO', item.cantidad || 1, item.precio_unitario || 0, item.monto_subtotal || 0]);
        }
      }

      await client.query('COMMIT');
      return nuevoEdp;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // 5. Obtener Estados de Pago de un Proyecto
  async getEstadosPagoPorProyecto(id_proyecto) {
    const sql = `
      SELECT e.*, 
        COUNT(r.id_reporte_avance) AS total_reportes_agrupados
      FROM sch_leangsp.tedp_estado_pago e
      LEFT JOIN sch_leangsp.tedp_reporte_avance r ON e.id_edp = r.id_edp
      WHERE e.id_proyecto = $1
      GROUP BY e.id_edp
      ORDER BY e.id_edp DESC;
    `;
    const res = await db.query(sql, [id_proyecto]);
    return res.rows;
  },

  // 6. Adjuntar Factura ERP del Cliente
  async adjuntarFacturaErp(id_edp, { folio_factura_erp, fecha_facturacion_erp, archivo_factura_pdf_path, archivo_factura_xml_path }) {
    const sql = `
      UPDATE sch_leangsp.tedp_estado_pago
      SET folio_factura_erp = $1,
          fecha_facturacion_erp = $2,
          archivo_factura_pdf_path = $3,
          archivo_factura_xml_path = $4,
          estado_edp = 'FACTURADO'
      WHERE id_edp = $5
      RETURNING *;
    `;
    const res = await db.query(sql, [folio_factura_erp, fecha_facturacion_erp || new Date().toISOString().split('T')[0], archivo_factura_pdf_path || null, archivo_factura_xml_path || null, id_edp]);
    return res.rows[0];
  },

  // 7. Imputar Costo Operacional Real (Combustible, Viáticos, etc.)
  async imputarCostoServicio({ id_proyecto, id_edp, categoria_costo, monto_costo, litros_combustible, kilometraje_odometro, numero_comprobante, archivo_comprobante_path, observacion }) {
    const sql = `
      INSERT INTO sch_leangsp.tedp_costos_servicio (
        id_proyecto, id_edp, categoria_costo, monto_costo,
        litros_combustible, kilometraje_odometro, numero_comprobante,
        archivo_comprobante_path, observacion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const res = await db.query(sql, [
      id_proyecto, id_edp || null, categoria_costo, monto_costo,
      litros_combustible || null, kilometraje_odometro || null,
      numero_comprobante || null, archivo_comprobante_path || null, observacion || null
    ]);
    return res.rows[0];
  },

  // 8. Visor 360° Margen Operacional
  async getVisor360Proyecto(id_proyecto) {
    const devRes = await db.query(`
      SELECT COALESCE(SUM(monto_devengado_dia), 0) AS devengado_total
      FROM sch_leangsp.tedp_reporte_avance
      WHERE id_proyecto = $1;
    `, [id_proyecto]);

    const costRes = await db.query(`
      SELECT categoria_costo, COALESCE(SUM(monto_costo), 0) AS total_categoria, COALESCE(SUM(litros_combustible), 0) AS total_litros
      FROM sch_leangsp.tedp_costos_servicio
      WHERE id_proyecto = $1
      GROUP BY categoria_costo;
    `, [id_proyecto]);

    const devengadoTotal = Number(devRes.rows[0]?.devengado_total || 0);
    const costosArray = costRes.rows;
    const costoTotal = costosArray.reduce((acc, c) => acc + Number(c.total_categoria || 0), 0);
    const margenMonto = devengadoTotal - costoTotal;
    const margenPorcentaje = devengadoTotal > 0 ? Math.round((margenMonto / devengadoTotal) * 100) : 0;

    return {
      id_proyecto,
      devengado_total: devengadoTotal,
      costo_total: costoTotal,
      margen_monto: margenMonto,
      margen_porcentaje: margenPorcentaje,
      desglose_costos: costosArray
    };
  }
};

module.exports = estadoPagoModel;
