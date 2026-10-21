const pool = require('../config/postgresPool');

class InventarioModel {
  constructor() {
    this.pool = pool;
  }

  // =========================================================================
  // 1. BODEGAS & UBICACIONES
  // =========================================================================

  async getBodegas(empresaId = 9) {
    const query = `
      SELECT 
        b.id_bodega AS id,
        b.id_empresa,
        b.id_sucursal,
        b.nombre,
        b.tipo_bodega,
        b.consolida_stock,
        b.estado,
        b.created_at,
        COUNT(u.id_ubicacion)::int AS total_ubicaciones
      FROM tinv_bodega b
      LEFT JOIN tinv_ubicacion u ON b.id_bodega = u.id_bodega
      WHERE b.id_empresa = $1
      GROUP BY b.id_bodega
      ORDER BY b.id_bodega ASC;
    `;
    const { rows } = await this.pool.query(query, [empresaId]);
    return rows;
  }

  async getUbicaciones(idBodega = 1) {
    const query = `
      SELECT 
        u.id_ubicacion AS id,
        u.id_bodega,
        u.codigo,
        u.estanteria,
        u.nivel,
        u.posicion,
        u.tipo_zona,
        u.permite_mezcla_sku,
        u.estado,
        COUNT(s.id_stock)::int AS items_almacenados,
        COALESCE(SUM(s.cantidad_fisica), 0)::numeric AS total_unidades_fisicas
      FROM tinv_ubicacion u
      LEFT JOIN tinv_stock s ON u.id_ubicacion = s.id_ubicacion
      WHERE u.id_bodega = $1
      GROUP BY u.id_ubicacion
      ORDER BY u.estanteria ASC NULLS LAST, u.nivel ASC NULLS LAST, u.posicion ASC NULLS LAST, u.codigo ASC;
    `;
    const { rows } = await this.pool.query(query, [idBodega]);
    return rows;
  }

  // =========================================================================
  // 2. CATÁLOGO MAESTRO DE PRODUCTOS (SKU MUDO + CÓDIGO LEGADO)
  // =========================================================================

  async getProductos(empresaId = 9, filtros = {}) {
    let whereClauses = ['p.id_empresa = $1'];
    let params = [empresaId];
    let paramIdx = 2;

    if (filtros.search) {
      whereClauses.push(`(
        p.nombre ILIKE $${paramIdx} OR 
        p.sku ILIKE $${paramIdx} OR 
        p.codigo_legado ILIKE $${paramIdx} OR
        EXISTS (
          SELECT 1 FROM tinv_producto_referencia pr 
          WHERE pr.id_producto = p.id_producto AND pr.codigo_referencia ILIKE $${paramIdx}
        )
      )`);
      params.push(`%${filtros.search}%`);
      paramIdx++;
    }

    if (filtros.familia) {
      whereClauses.push(`p.familia = $${paramIdx}`);
      params.push(filtros.familia);
      paramIdx++;
    }

    if (filtros.impacto) {
      whereClauses.push(`p.impacto_operacional = $${paramIdx}`);
      params.push(filtros.impacto);
      paramIdx++;
    }

    if (filtros.estado) {
      whereClauses.push(`p.estado = $${paramIdx}`);
      params.push(filtros.estado);
      paramIdx++;
    }

    const query = `
      SELECT 
        p.id_producto AS id,
        p.id_empresa,
        p.sku,
        p.codigo_legado,
        p.nombre,
        p.descripcion,
        p.familia,
        p.subfamilia,
        p.unidad_medida_base AS uom,
        p.presentacion_compra,
        p.factor_conversion,
        p.tipo_control,
        p.es_rotable,
        p.impacto_operacional AS impacto,
        p.lead_time,
        p.clase_abc AS abc,
        p.stock_minimo AS min,
        p.stock_maximo AS max,
        p.punto_reorden AS rop,
        p.costo_pmp_vigente AS pmp,
        p.requiere_revalorizacion,
        p.estado,
        COALESCE(SUM(s.cantidad_fisica), 0)::numeric AS stock_fisico,
        COALESCE(SUM(s.cantidad_reservada), 0)::numeric AS stock_reservado,
        (COALESCE(SUM(s.cantidad_fisica), 0) - COALESCE(SUM(s.cantidad_reservada), 0))::numeric AS stock_disponible
      FROM tinv_producto p
      LEFT JOIN tinv_stock s ON p.id_producto = s.id_producto AND s.estado_stock = 'LIBRE'
      WHERE ${whereClauses.join(' AND ')}
      GROUP BY p.id_producto
      ORDER BY p.id_producto ASC;
    `;
    const { rows } = await this.pool.query(query, params);
    return rows;
  }

  async getProductoById(idProducto, empresaId = 9) {
    const queryProd = `
      SELECT 
        p.id_producto AS id,
        p.id_empresa,
        p.sku,
        p.codigo_legado,
        p.nombre,
        p.descripcion,
        p.familia,
        p.subfamilia,
        p.unidad_medida_base AS uom,
        p.presentacion_compra,
        p.factor_conversion,
        p.tipo_control,
        p.es_rotable,
        p.impacto_operacional AS impacto,
        p.lead_time,
        p.clase_abc AS abc,
        p.stock_minimo AS min,
        p.stock_maximo AS max,
        p.punto_reorden AS rop,
        p.costo_pmp_vigente AS pmp,
        p.requiere_revalorizacion,
        p.estado,
        p.created_at
      FROM tinv_producto p
      WHERE p.id_producto = $1 AND p.id_empresa = $2;
    `;
    const { rows: prods } = await this.pool.query(queryProd, [idProducto, empresaId]);
    if (!prods.length) return null;

    const producto = prods[0];

    // Referencias OEM / Alternativas
    const { rows: refs } = await this.pool.query(`
      SELECT tipo_referencia, marca, codigo_referencia 
      FROM tinv_producto_referencia 
      WHERE id_producto = $1 ORDER BY id_referencia ASC;
    `, [idProducto]);
    producto.referencias = refs;

    // Compatibilidad de flota
    const { rows: compat } = await this.pool.query(`
      SELECT modelo_equipo, notas 
      FROM tinv_producto_compatibilidad 
      WHERE id_producto = $1 ORDER BY id_compatibilidad ASC;
    `, [idProducto]);
    producto.compatibilidad = compat;

    // Stock detallado por ubicación
    const { rows: stock } = await this.pool.query(`
      SELECT 
        s.id_stock,
        u.codigo AS ubicacion_codigo,
        u.tipo_zona,
        s.estado_stock,
        s.cantidad_fisica,
        s.cantidad_reservada,
        l.numero_lote,
        l.fecha_vencimiento,
        sr.numero_serie,
        sr.estado_rotable
      FROM tinv_stock s
      JOIN tinv_ubicacion u ON s.id_ubicacion = u.id_ubicacion
      LEFT JOIN tinv_lote l ON s.id_lote = l.id_lote
      LEFT JOIN tinv_serie sr ON s.id_serie = sr.id_serie
      WHERE s.id_producto = $1
      ORDER BY u.codigo ASC;
    `, [idProducto]);
    producto.stock_posiciones = stock;

    return producto;
  }

  async createProducto(empresaId = 9, data = {}) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Obtener siguiente correlativo de SKU mnemotécnico por Familia MRO (Spec 48)
      const familia = data.familia || 'Materiales Varios';
      const FAMILIA_PREFIXES = {
        'Filtros': 'FILT',
        'Aceites y Lubricantes': 'LUBR',
        'Repuestos Taller Mecánico': 'MEC',
        'Repuestos Eléctricos': 'ELEC',
        'Material de Desgaste': 'DESG',
        'Neumaticos': 'NEUM',
        'Herramientas': 'HERR',
        'Insumos Taller de Soldadura': 'SOLD',
        'Insumos Taller de Pinturas': 'PINT',
        'EPP': 'EPP',
        'Materiales Varios': 'VARI',
        'Útiles de Oficina': 'OFIC',
        'Equipos Computacionales': 'COMP',
        'Mobiliario': 'MOBL',
        'Articulos de Aseo': 'ASEO',
        'Repuestos': 'MEC'
      };
      const prefix = FAMILIA_PREFIXES[familia] || 'VARI';
      const { rows: countRes } = await client.query(
        `SELECT COUNT(*) + 1 AS next_correlativo FROM tinv_producto WHERE sku LIKE $1;`,
        [`${prefix}-%`]
      );
      const nextNum = countRes[0].next_correlativo;
      const sku = data.sku || `${prefix}-${String(nextNum).padStart(5, '0')}`;

      // 2. Insertar producto
      const queryInsert = `
        INSERT INTO tinv_producto (
          id_empresa, sku, codigo_legado, nombre, descripcion, familia, subfamilia,
          unidad_medida_base, presentacion_compra, factor_conversion, tipo_control,
          es_rotable, impacto_operacional, lead_time, clase_abc, stock_minimo,
          stock_maximo, punto_reorden, costo_pmp_vigente, estado
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11,
          $12, $13, $14, $15, $16,
          $17, $18, $19, 'ACTIVO'
        ) RETURNING *;
      `;
      const values = [
        empresaId,
        sku,
        data.codigo_legado || null,
        data.nombre,
        data.descripcion || null,
        data.familia || 'Repuestos Taller Mecánico',
        data.subfamilia || null,
        data.unidad_medida_base || 'UN',
        data.presentacion_compra || null,
        Number(data.factor_conversion) || 1.0,
        data.tipo_control || 'NINGUNO',
        Boolean(data.es_rotable),
        data.impacto_operacional || 'NORMAL',
        data.lead_time || 'CORTO',
        data.clase_abc || 'C',
        Number(data.stock_minimo) || 1,
        Number(data.stock_maximo) || 5,
        Number(data.punto_reorden) || 2,
        Number(data.costo_pmp_vigente) || 0
      ];
      const { rows: prodRows } = await client.query(queryInsert, values);
      const nuevoProducto = prodRows[0];

      // 3. Insertar referencias cruzadas si vienen
      if (Array.isArray(data.referencias)) {
        for (const ref of data.referencias) {
          if (ref.codigo_referencia && ref.marca) {
            await client.query(`
              INSERT INTO tinv_producto_referencia (id_producto, tipo_referencia, marca, codigo_referencia)
              VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING;
            `, [nuevoProducto.id_producto, ref.tipo_referencia || 'OEM', ref.marca, ref.codigo_referencia]);
          }
        }
      }

      await client.query('COMMIT');
      return nuevoProducto;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // =========================================================================
  // 3. EXISTENCIAS (QUANTS) & ALERTAS DE REPOSICIÓN
  // =========================================================================

  async getExistencias(empresaId = 9, filtros = {}) {
    let whereClauses = ['s.id_empresa = $1'];
    let params = [empresaId];
    let paramIdx = 2;

    if (filtros.estado_stock && filtros.estado_stock !== 'TODOS') {
      whereClauses.push(`s.estado_stock = $${paramIdx}`);
      params.push(filtros.estado_stock);
      paramIdx++;
    }

    if (filtros.id_bodega) {
      whereClauses.push(`u.id_bodega = $${paramIdx}`);
      params.push(filtros.id_bodega);
      paramIdx++;
    }

    const query = `
      SELECT 
        s.id_stock AS id,
        s.id_producto,
        p.sku,
        p.codigo_legado,
        p.nombre AS producto_nombre,
        p.unidad_medida_base AS uom,
        p.costo_pmp_vigente AS pmp,
        u.id_ubicacion,
        u.codigo AS ubicacion_codigo,
        u.id_bodega,
        u.tipo_zona,
        s.estado_stock,
        s.cantidad_fisica,
        s.cantidad_reservada,
        (s.cantidad_fisica - s.cantidad_reservada)::numeric AS cantidad_disponible,
        l.numero_lote,
        l.fecha_vencimiento,
        sr.numero_serie,
        sr.estado_rotable,
        ROUND(s.cantidad_fisica * p.costo_pmp_vigente, 2) AS valorizacion_total
      FROM tinv_stock s
      JOIN tinv_producto p ON s.id_producto = p.id_producto
      JOIN tinv_ubicacion u ON s.id_ubicacion = u.id_ubicacion
      LEFT JOIN tinv_lote l ON s.id_lote = l.id_lote
      LEFT JOIN tinv_serie sr ON s.id_serie = sr.id_serie
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY p.nombre ASC, u.codigo ASC;
    `;
    const { rows } = await this.pool.query(query, params);
    return rows;
  }

  async getAlertasReposicion(empresaId = 9) {
    const query = `
      SELECT 
        p.id_producto AS id,
        p.sku,
        p.codigo_legado,
        p.nombre,
        p.familia,
        p.unidad_medida_base AS uom,
        p.presentacion_compra,
        p.factor_conversion,
        p.impacto_operacional AS impacto,
        p.lead_time,
        p.stock_minimo AS min,
        p.stock_maximo AS max,
        p.punto_reorden AS rop,
        p.costo_pmp_vigente AS pmp,
        COALESCE(SUM(s.cantidad_fisica), 0)::numeric AS stock_fisico,
        COALESCE(SUM(s.cantidad_reservada), 0)::numeric AS stock_reservado,
        (COALESCE(SUM(s.cantidad_fisica), 0) - COALESCE(SUM(s.cantidad_reservada), 0))::numeric AS stock_neto,
        GREATEST(0, (p.stock_maximo - (COALESCE(SUM(s.cantidad_fisica), 0) - COALESCE(SUM(s.cantidad_reservada), 0))))::numeric AS sugerido_compra
      FROM tinv_producto p
      LEFT JOIN tinv_stock s ON p.id_producto = s.id_producto AND s.estado_stock = 'LIBRE'
      WHERE p.id_empresa = $1 AND p.estado = 'ACTIVO'
      GROUP BY p.id_producto
      HAVING (COALESCE(SUM(s.cantidad_fisica), 0) - COALESCE(SUM(s.cantidad_reservada), 0)) <= p.punto_reorden
      ORDER BY 
        CASE p.impacto_operacional 
          WHEN 'CRITICO' THEN 1 
          WHEN 'IMPORTANTE' THEN 2 
          ELSE 3 
        END ASC,
        (COALESCE(SUM(s.cantidad_fisica), 0) - COALESCE(SUM(s.cantidad_reservada), 0)) ASC;
    `;
    const { rows } = await this.pool.query(query, [empresaId]);
    return rows;
  }

  // =========================================================================
  // 4. RECEPCIÓN DE MATERIALES (CABECERA + LÍNEAS DOCUMENTALES)
  // =========================================================================

  async crearRecepcion(empresaId = 9, userId = 1, data = {}) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: seqRes } = await client.query(`SELECT nextval('seq_tinv_recepcion_folio') AS next_val;`);
      const folio = `REC-2610-${String(seqRes[0].next_val).padStart(4, '0')}`;

      const queryRec = `
        INSERT INTO tinv_recepcion (
          id_empresa, numero_folio, tipo_ingreso, proveedor_o_origen,
          documento_referencia, estado, id_usuario_recepcion
        ) VALUES ($1, $2, $3, $4, $5, 'CONFIRMADA', $6)
        RETURNING *;
      `;
      const { rows: recRows } = await client.query(queryRec, [
        empresaId,
        folio,
        data.tipo_ingreso || 'COMPRA',
        data.proveedor_o_origen || 'Proveedor General',
        data.documento_referencia || 'Guía / OC',
        userId
      ]);
      const recepcion = recRows[0];

      // Procesar líneas
      if (Array.isArray(data.lineas)) {
        for (const lin of data.lineas) {
          const cantidadRecibida = Number(lin.cantidad_recibida) || 1;
          const factorConv = Number(lin.factor_conversion) || 1.0;
          const cantidadBase = cantidadRecibida * factorConv;
          const costoMoneda = Number(lin.costo_unitario_moneda) || 0;
          const costoBase = Math.round(costoMoneda / factorConv);

          // 1. Insertar línea de recepción
          await client.query(`
            INSERT INTO tinv_recepcion_linea (
              id_recepcion, id_producto, cantidad_recibida, unidad_presentacion,
              factor_conversion, costo_unitario_moneda, id_ubicacion_destino, lote_texto, serie_texto
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
          `, [
            recepcion.id_recepcion, lin.id_producto, cantidadRecibida,
            lin.unidad_presentacion || 'UN', factorConv, costoMoneda,
            lin.id_ubicacion_destino || 1, lin.lote_texto || null, lin.serie_texto || null
          ]);

          // 2. Obtener saldo actual del producto para recálculo PMP
          const { rows: pRows } = await client.query(`
            SELECT costo_pmp_vigente, 
              (SELECT COALESCE(SUM(cantidad_fisica), 0) FROM tinv_stock WHERE id_producto = $1) AS stock_total
            FROM tinv_producto WHERE id_producto = $1 FOR UPDATE;
          `, [lin.id_producto]);

          const pmpActual = Number(pRows[0]?.costo_pmp_vigente) || 0;
          const stockActual = Number(pRows[0]?.stock_total) || 0;

          // Cálculo PMP: ((Stock * PMP) + (CantBase * CostoBase)) / (Stock + CantBase)
          let nuevoPmp = costoBase;
          if (stockActual + cantidadBase > 0 && costoBase > 0) {
            nuevoPmp = Math.round(((stockActual * pmpActual) + (cantidadBase * costoBase)) / (stockActual + cantidadBase));
          }

          // Actualizar PMP en producto
          await client.query(`
            UPDATE tinv_producto 
            SET costo_pmp_vigente = $1, estado = 'ACTIVO' 
            WHERE id_producto = $2;
          `, [nuevoPmp, lin.id_producto]);

          // 3. Upsert en tinv_stock (Quant)
          const { rows: stRows } = await client.query(`
            SELECT id_stock, cantidad_fisica FROM tinv_stock
            WHERE id_empresa = $1 AND id_producto = $2 AND id_ubicacion = $3 AND estado_stock = 'LIBRE';
          `, [empresaId, lin.id_producto, lin.id_ubicacion_destino]);

          let stockAnt = 0;
          let stockPost = cantidadBase;

          if (stRows.length) {
            stockAnt = Number(stRows[0].cantidad_fisica);
            stockPost = stockAnt + cantidadBase;
            await client.query(`
              UPDATE tinv_stock 
              SET cantidad_fisica = cantidad_fisica + $1, updated_at = NOW()
              WHERE id_stock = $2;
            `, [cantidadBase, stRows[0].id_stock]);
          } else {
            await client.query(`
              INSERT INTO tinv_stock (id_empresa, id_producto, id_ubicacion, estado_stock, cantidad_fisica, cantidad_reservada)
              VALUES ($1, $2, $3, 'LIBRE', $4, 0);
            `, [empresaId, lin.id_producto, lin.id_ubicacion_destino, cantidadBase]);
          }

          // 4. Asiento en Kardex Inmutable (tinv_movimiento)
          await client.query(`
            INSERT INTO tinv_movimiento (
              id_empresa, tipo_movimiento, documento_tipo, documento_folio,
              id_producto, id_ubicacion, cantidad, costo_unitario_pmp,
              stock_anterior, stock_posterior, id_usuario, observaciones
            ) VALUES (
              $1, 'RECEPCION_COMPRA', 'REC', $2,
              $3, $4, $5, $6,
              $7, $8, $9, $10
            );
          `, [
            empresaId, folio, lin.id_producto, lin.id_ubicacion_destino,
            cantidadBase, nuevoPmp, stockAnt, stockPost, userId,
            `Recepción ${data.tipo_ingreso}: ${data.documento_referencia || ''}`
          ]);
        }
      }

      await client.query('COMMIT');
      return recepcion;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // =========================================================================
  // 5. DESPACHO A OT Y DEVOLUCIONES (PWA TALLER)
  // =========================================================================

  async despacharOt(empresaId = 9, userId = 1, data = {}) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const { id_ot, id_producto, id_ubicacion, cantidad } = data;
      const cantSalida = Number(cantidad) || 1;

      // 1. Verificar stock disponible en la posición
      const { rows: stRows } = await client.query(`
        SELECT id_stock, cantidad_fisica, cantidad_reservada 
        FROM tinv_stock 
        WHERE id_empresa = $1 AND id_producto = $2 AND id_ubicacion = $3 AND estado_stock = 'LIBRE'
        FOR UPDATE;
      `, [empresaId, id_producto, id_ubicacion]);

      if (!stRows.length || Number(stRows[0].cantidad_fisica) < cantSalida) {
        throw new Error('STOCK_INSUFICIENTE: La ubicación seleccionada no cuenta con stock físico suficiente.');
      }

      const stockAnt = Number(stRows[0].cantidad_fisica);
      const stockPost = stockAnt - cantSalida;

      // 2. Rebajar stock
      await client.query(`
        UPDATE tinv_stock 
        SET cantidad_fisica = cantidad_fisica - $1,
            cantidad_reservada = GREATEST(0, cantidad_reservada - $1),
            updated_at = NOW()
        WHERE id_stock = $2;
      `, [cantSalida, stRows[0].id_stock]);

      // 3. Obtener PMP vigente del producto
      const { rows: prodRows } = await client.query(`
        SELECT p.nombre, p.unidad_medida_base, p.costo_pmp_vigente, ot.numero_ot 
        FROM tinv_producto p
        CROSS JOIN tmnt_ot ot
        WHERE p.id_producto = $1 AND ot.id_ot = $2;
      `, [id_producto, id_ot]);

      const prodInfo = prodRows[0];
      const pmpCosto = Number(prodInfo?.costo_pmp_vigente) || 0;
      const folioOt = prodInfo?.numero_ot || `OT-${id_ot}`;

      // 4. Asiento en Kardex Inmutable
      const { rows: movRows } = await client.query(`
        INSERT INTO tinv_movimiento (
          id_empresa, tipo_movimiento, documento_tipo, documento_folio,
          id_producto, id_ubicacion, cantidad, costo_unitario_pmp,
          stock_anterior, stock_posterior, id_usuario, observaciones
        ) VALUES (
          $1, 'SALIDA_OT', 'OT_MNT', $2,
          $3, $4, -$5, $6,
          $7, $8, $9, $10
        ) RETURNING id_movimiento;
      `, [
        empresaId, folioOt, id_producto, id_ubicacion, cantSalida, pmpCosto,
        stockAnt, stockPost, userId, `Despacho PWA taller a ${folioOt}`
      ]);

      const idMov = movRows[0].id_movimiento;

      // 5. Imputar repuesto a la OT de mantenimiento
      await client.query(`
        INSERT INTO tmnt_ot_repuesto (
          id_ot, id_producto, id_movimiento_salida, descripcion_material,
          cantidad, unidad_medida, costo_unitario, es_despacho_wms, estado_despacho
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, true, 'ENTREGADO'
        );
      `, [
        id_ot, id_producto, idMov, prodInfo.nombre,
        cantSalida, prodInfo.unidad_medida_base, pmpCosto
      ]);

      await client.query('COMMIT');
      return { success: true, id_movimiento: idMov, folio_ot: folioOt, costo_imputado: cantSalida * pmpCosto };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async devolverOt(empresaId = 9, userId = 1, data = {}) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const { id_ot_repuesto, id_ubicacion_destino, cantidad_devolver } = data;
      const cantDev = Number(cantidad_devolver) || 1;

      // 1. Obtener datos del repuesto original
      const { rows: repRows } = await client.query(`
        SELECT r.*, ot.numero_ot 
        FROM tmnt_ot_repuesto r
        JOIN tmnt_ot ot ON r.id_ot = ot.id_ot
        WHERE r.id_ot_repuesto = $1 FOR UPDATE;
      `, [id_ot_repuesto]);

      if (!repRows.length) throw new Error('REPUESTO_NO_ENCONTRADO');
      const rep = repRows[0];

      // 2. Incrementar stock en ubicación destino
      const { rows: stRows } = await client.query(`
        SELECT id_stock, cantidad_fisica FROM tinv_stock
        WHERE id_empresa = $1 AND id_producto = $2 AND id_ubicacion = $3 AND estado_stock = 'LIBRE';
      `, [empresaId, rep.id_producto, id_ubicacion_destino]);

      let stockAnt = 0;
      let stockPost = cantDev;

      if (stRows.length) {
        stockAnt = Number(stRows[0].cantidad_fisica);
        stockPost = stockAnt + cantDev;
        await client.query(`
          UPDATE tinv_stock SET cantidad_fisica = cantidad_fisica + $1, updated_at = NOW()
          WHERE id_stock = $2;
        `, [cantDev, stRows[0].id_stock]);
      } else {
        await client.query(`
          INSERT INTO tinv_stock (id_empresa, id_producto, id_ubicacion, estado_stock, cantidad_fisica, cantidad_reservada)
          VALUES ($1, $2, $3, 'LIBRE', $4, 0);
        `, [empresaId, rep.id_producto, id_ubicacion_destino, cantDev]);
      }

      // 3. Registrar movimiento DEVOLUCION_OT al costo original de salida
      await client.query(`
        INSERT INTO tinv_movimiento (
          id_empresa, tipo_movimiento, documento_tipo, documento_folio,
          id_producto, id_ubicacion, cantidad, costo_unitario_pmp,
          stock_anterior, stock_posterior, id_usuario, observaciones
        ) VALUES (
          $1, 'DEVOLUCION_OT', 'OT_MNT', $2,
          $3, $4, $5, $6,
          $7, $8, $9, $10
        );
      `, [
        empresaId, rep.numero_ot, rep.id_producto, id_ubicacion_destino,
        cantDev, rep.costo_unitario, stockAnt, stockPost, userId,
        `Devolución de material sobrante desde ${rep.numero_ot}`
      ]);

      // 4. Rebajar cantidad en tmnt_ot_repuesto
      if (Number(rep.cantidad) <= cantDev) {
        await client.query(`UPDATE tmnt_ot_repuesto SET estado_despacho = 'DEVUELTO' WHERE id_ot_repuesto = $1;`, [id_ot_repuesto]);
      } else {
        await client.query(`UPDATE tmnt_ot_repuesto SET cantidad = cantidad - $1 WHERE id_ot_repuesto = $2;`, [cantDev, id_ot_repuesto]);
      }

      await client.query('COMMIT');
      return { success: true, cantidad_devuelta: cantDev, costo_rebajado: cantDev * Number(rep.costo_unitario) };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // =========================================================================
  // 6. KARDEX INMUTABLE Y AUDITORÍA
  // =========================================================================

  async getKardexMovimientos(empresaId = 9, filtros = {}) {
    let whereClauses = ['m.id_empresa = $1'];
    let params = [empresaId];
    let paramIdx = 2;

    if (filtros.id_producto) {
      whereClauses.push(`m.id_producto = $${paramIdx}`);
      params.push(filtros.id_producto);
      paramIdx++;
    }

    if (filtros.tipo_movimiento) {
      whereClauses.push(`m.tipo_movimiento = $${paramIdx}`);
      params.push(filtros.tipo_movimiento);
      paramIdx++;
    }

    const query = `
      SELECT 
        m.id_movimiento AS id,
        m.fecha_movimiento,
        m.tipo_movimiento,
        m.documento_tipo,
        m.documento_folio,
        p.id_producto,
        p.sku,
        p.codigo_legado,
        p.nombre AS producto_nombre,
        p.unidad_medida_base AS uom,
        u.codigo AS ubicacion_codigo,
        m.cantidad,
        m.costo_unitario_pmp AS costo_unitario,
        (m.cantidad * m.costo_unitario_pmp) AS costo_total,
        m.stock_anterior,
        m.stock_posterior,
        m.id_usuario,
        m.id_movimiento_reversado,
        m.observaciones
      FROM tinv_movimiento m
      JOIN tinv_producto p ON m.id_producto = p.id_producto
      JOIN tinv_ubicacion u ON m.id_ubicacion = u.id_ubicacion
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY m.id_movimiento DESC
      LIMIT 150;
    `;
    const { rows } = await this.pool.query(query, params);
    return rows;
  }

  async reversarMovimiento(idMovimiento, empresaId = 9, supervisorId = 1, motivo = '') {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Obtener movimiento original
      const { rows: movRows } = await client.query(`
        SELECT * FROM tinv_movimiento 
        WHERE id_movimiento = $1 AND id_empresa = $2;
      `, [idMovimiento, empresaId]);

      if (!movRows.length) throw new Error('MOVIMIENTO_NO_ENCONTRADO');
      const orig = movRows[0];

      if (orig.tipo_movimiento === 'REVERSO') throw new Error('NO_SE_PUEDE_REVERSAR_UN_REVERSO');

      // Verificar que no haya sido ya reversado
      const { rows: revCheck } = await client.query(`
        SELECT id_movimiento FROM tinv_movimiento WHERE id_movimiento_reversado = $1;
      `, [idMovimiento]);

      if (revCheck.length) throw new Error('REVERSO_YA_EJECUTADO: Este asiento ya fue anulado previamente.');

      // 2. Reversar saldo en tinv_stock (invertir signo de cantidad)
      const cantInvertida = -Number(orig.cantidad);

      const { rows: stRows } = await client.query(`
        SELECT id_stock, cantidad_fisica FROM tinv_stock
        WHERE id_empresa = $1 AND id_producto = $2 AND id_ubicacion = $3 AND estado_stock = 'LIBRE'
        FOR UPDATE;
      `, [empresaId, orig.id_producto, orig.id_ubicacion]);

      let stockAnt = 0;
      let stockPost = cantInvertida;

      if (stRows.length) {
        stockAnt = Number(stRows[0].cantidad_fisica);
        stockPost = stockAnt + cantInvertida;
        if (stockPost < 0) throw new Error('STOCK_NEGATIVO: El reverso generaría saldo negativo en bodega.');
        await client.query(`
          UPDATE tinv_stock SET cantidad_fisica = $1, updated_at = NOW() WHERE id_stock = $2;
        `, [stockPost, stRows[0].id_stock]);
      } else {
        if (stockPost < 0) throw new Error('STOCK_NEGATIVO');
        await client.query(`
          INSERT INTO tinv_stock (id_empresa, id_producto, id_ubicacion, estado_stock, cantidad_fisica, cantidad_reservada)
          VALUES ($1, $2, $3, 'LIBRE', $4, 0);
        `, [empresaId, orig.id_producto, orig.id_ubicacion, stockPost]);
      }

      // 3. Crear asiento inmutable de REVERSO
      const { rows: newMov } = await client.query(`
        INSERT INTO tinv_movimiento (
          id_empresa, tipo_movimiento, documento_tipo, documento_folio,
          id_producto, id_ubicacion, cantidad, costo_unitario_pmp,
          stock_anterior, stock_posterior, id_usuario, id_movimiento_reversado, observaciones
        ) VALUES (
          $1, 'REVERSO', 'REVERSO', $2,
          $3, $4, $5, $6,
          $7, $8, $9, $10, $11
        ) RETURNING id_movimiento;
      `, [
        empresaId, `REV-${orig.id_movimiento}`, orig.id_producto, orig.id_ubicacion,
        cantInvertida, orig.costo_unitario_pmp, stockAnt, stockPost, supervisorId,
        orig.id_movimiento, `Reverso autorizado: ${motivo || 'Corrección de registro'}`
      ]);

      await client.query('COMMIT');
      return { success: true, id_movimiento_reverso: newMov[0].id_movimiento, reversado_id: orig.id_movimiento };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // =========================================================================
  // 7. PROCESOS DE INVENTARIO FÍSICO Y CONTEOS (INV-2026-001)
  // =========================================================================

  async getConteos(empresaId = 9) {
    const query = `
      SELECT 
        c.id_conteo AS id,
        c.codigo_proceso,
        c.descripcion,
        c.tipo_conteo,
        c.es_ciego,
        c.estado,
        c.fecha_corte,
        COUNT(cl.id_conteo_linea)::int AS total_lineas,
        COUNT(CASE WHEN cl.estado_linea IN ('DIFERENCIA', 'SOBRANTE') THEN 1 END)::int AS total_diferencias,
        COALESCE(SUM(cl.valor_diferencia), 0)::numeric AS valor_neto_diferencias
      FROM tinv_conteo c
      LEFT JOIN tinv_conteo_linea cl ON c.id_conteo = cl.id_conteo
      WHERE c.id_empresa = $1
      GROUP BY c.id_conteo
      ORDER BY c.id_conteo DESC;
    `;
    const { rows } = await this.pool.query(query, [empresaId]);
    return rows;
  }
}

module.exports = new InventarioModel();
