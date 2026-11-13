const pool = require('../config/postgresPool');

const EMPRESAS_GRUPO = {
  9: {
    id_empresa: 9,
    prefijo_oc: 'GSP',
    nombre_corto: 'Grúas San Pablo',
    razon_social: 'LUIS OMAR GHISELLINI JARA E.I.R.L. (GRÚAS SAN PABLO)',
    rut: '52.004.162-1',
    giro: 'Arriendo de Maquinarias, Grúas e Izaje Industrial',
    direccion: 'Panamericana Norte #1020, Temuco / Santiago',
    telefono: '+56 9 9842 1094',
    logo: 'logo-sanpablo.png'
  },
  11: {
    id_empresa: 11,
    prefijo_oc: 'RYL',
    nombre_corto: 'Royal Rental',
    razon_social: 'ARRIENDO ROYAL RENTAL LIMITADA',
    rut: '78.254.535-3',
    giro: 'Arriendo de Equipos, Plataformas y Maquinaria Industrial',
    direccion: 'Panamericana Sur Km 672, Temuco',
    telefono: '+56 45 221 0000',
    logo: 'logo-royalrental.png'
  },
  7: {
    id_empresa: 7,
    prefijo_oc: 'BMQ',
    nombre_corto: 'Bestmaq',
    razon_social: 'SOCIEDAD BESTMAQ LIMITADA',
    rut: '76.209.534-3',
    giro: 'Comercialización y Arriendo de Maquinaria y Equipos',
    direccion: 'Ruta 5 Sur, Región de La Araucanía',
    telefono: '+56 45 221 0000',
    logo: 'logo-bestmaq.png'
  },
  8: {
    id_empresa: 8,
    prefijo_oc: 'LDS',
    nombre_corto: 'Logística del Sur',
    razon_social: 'LOGÍSTICA DEL SUR LTDA.',
    rut: '76.218.576-8',
    giro: 'Transporte de Carga por Carretera y Logística Especializada',
    direccion: 'Ruta 5 Sur, Región de La Araucanía',
    telefono: '+56 45 221 0000',
    logo: 'logo-logisticadelsur.png'
  }
};

const RUBROS_ITS_VALIDOS = [
  'FLETE_EXTERNO',
  'PERSONAL_EXTERNO',
  'PENSION_ALOJAMIENTO',
  'VIATICO_ALIMENTACION',
  'MOVILIZACION',
  'PEAJE_TAG',
  'GASTO_EXTRA',
  'REPUESTOS_TALLER',
  'INSUMOS_BODEGA'
];

const PRIORIDADES_VALIDAS = ['BAJA', 'NORMAL', 'ALTA', 'URGENTE_PARADA'];
const ORIGENES_VALIDOS = ['OPERACIONES_OT', 'TALLER_BODEGA', 'ADMINISTRACION'];

class ComprasModel {
  constructor() {
    this.pool = pool;
    this.EMPRESAS_GRUPO = EMPRESAS_GRUPO;
    this._schemaReady = false;
  }

  async ensureLaudusColumns() {
    if (this._schemaReady) return;
    try {
      await this.pool.query(`
        ALTER TABLE tcmp_solicitud_pedido
          ADD COLUMN IF NOT EXISTS codigo_cuenta_laudus VARCHAR(40),
          ADD COLUMN IF NOT EXISTS nombre_cuenta_laudus VARCHAR(150),
          ADD COLUMN IF NOT EXISTS centro_costo_laudus VARCHAR(120);
        ALTER TABLE tcmp_orden_compra
          ADD COLUMN IF NOT EXISTS codigo_cuenta_laudus VARCHAR(40),
          ADD COLUMN IF NOT EXISTS nombre_cuenta_laudus VARCHAR(150),
          ADD COLUMN IF NOT EXISTS centro_costo_laudus VARCHAR(120);
      `);
      this._schemaReady = true;
    } catch (_) {}
  }

  getYearMonthTag(date = new Date()) {
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${yy}${mm}`;
  }

  async generarFolioSolicitud(client = this.pool) {
    const yymm = this.getYearMonthTag();
    const prefix = `SP-${yymm}-`;
    const { rows } = await client.query(
      `SELECT folio_solicitud FROM tcmp_solicitud_pedido WHERE folio_solicitud LIKE $1 ORDER BY id_solicitud DESC LIMIT 1`,
      [`${prefix}%`]
    );
    let correlativo = 1;
    if (rows.length > 0 && rows[0].folio_solicitud) {
      const parts = rows[0].folio_solicitud.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) correlativo = lastNum + 1;
    }
    return `${prefix}${String(correlativo).padStart(4, '0')}`;
  }

  async generarFolioOC(idEmpresa = 9, client = this.pool) {
    const emp = EMPRESAS_GRUPO[Number(idEmpresa)] || EMPRESAS_GRUPO[9];
    const yymm = this.getYearMonthTag();
    const prefix = `OC-${emp.prefijo_oc}-${yymm}-`;
    const { rows } = await client.query(
      `SELECT folio_oc FROM tcmp_orden_compra WHERE folio_oc LIKE $1 ORDER BY id_oc DESC LIMIT 1`,
      [`${prefix}%`]
    );
    let correlativo = 1;
    if (rows.length > 0 && rows[0].folio_oc) {
      const parts = rows[0].folio_oc.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) correlativo = lastNum + 1;
    }
    return `${prefix}${String(correlativo).padStart(4, '0')}`;
  }

  // Sincroniza estados de OCs cuyos tokens hayan sido resueltos en /aprobacion-gerencia/:token
  async sincronizarEstadosTokensOC() {
    try {
      await this.pool.query(`
        UPDATE tcmp_orden_compra oc
        SET
          estado_oc = CASE
            WHEN tk.estado_token = 'APROBADO' THEN 'AUTORIZADA'
            WHEN tk.estado_token = 'APROBADO_CON_OBS' THEN 'AUTORIZADA_CON_OBS'
            WHEN tk.estado_token = 'RECHAZADO' THEN 'RECHAZADA'
            ELSE oc.estado_oc
          END,
          observacion_gerencia = COALESCE(tk.observacion_omar, oc.observacion_gerencia),
          fecha_autorizacion_gerencia = COALESCE(tk.fecha_resolucion, oc.fecha_autorizacion_gerencia),
          updated_at = NOW()
        FROM tapr_gerencia_token tk
        WHERE oc.id_token_vigente = tk.id_token
          AND oc.estado_oc = 'PENDIENTE_VB_OMAR'
          AND tk.estado_token IN ('APROBADO', 'APROBADO_CON_OBS', 'RECHAZADO');
      `);
    } catch (err) {
      console.warn('[ComprasModel] Advertencia sincronizando tokens OC:', err.message);
    }
  }

  async getResumen(filtros = {}) {
    await this.sincronizarEstadosTokensOC();

    const idEmpresaFiltro = filtros.id_empresa && Number(filtros.id_empresa) > 0 ? Number(filtros.id_empresa) : null;

    // 1. KPIs Solicitudes
    const solParams = [];
    let solWhere = '';
    if (idEmpresaFiltro) {
      solParams.push(idEmpresaFiltro);
      solWhere = `WHERE id_empresa = $1`;
    }
    const solKpiRes = await this.pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE estado IN ('PENDIENTE_COMPRAS', 'EN_COTIZACION'))::int AS solicitudes_pendientes,
        COUNT(*) FILTER (WHERE estado = 'CONVERTIDA_OC')::int AS solicitudes_convertidas,
        COUNT(*)::int AS total_solicitudes
      FROM tcmp_solicitud_pedido
      ${solWhere};
    `, solParams);

    // 2. KPIs OCs generales y por razón social
    const ocParams = [];
    let ocWhere = '';
    if (idEmpresaFiltro) {
      ocParams.push(idEmpresaFiltro);
      ocWhere = `WHERE id_empresa = $1`;
    }
    const ocKpiRes = await this.pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE estado_oc = 'PENDIENTE_VB_OMAR')::int AS ocs_por_visar_omar,
        COUNT(*) FILTER (WHERE estado_oc IN ('AUTORIZADA', 'AUTORIZADA_CON_OBS', 'ENVIADA_PROVEEDOR', 'RECEPCIONADA_BODEGA', 'FACTURADA_LAUDUS'))::int AS ocs_autorizadas,
        COUNT(*) FILTER (WHERE estado_oc = 'BORRADOR')::int AS ocs_borrador,
        COUNT(*) FILTER (WHERE estado_oc = 'RECHAZADA')::int AS ocs_rechazadas,
        COUNT(*) FILTER (WHERE imputado_en_its = true)::int AS ocs_imputadas_its,
        COALESCE(SUM(monto_neto) FILTER (WHERE estado_oc NOT IN ('RECHAZADA', 'ANULADA')), 0)::numeric AS monto_neto_comprometido,
        COALESCE(SUM(monto_total) FILTER (WHERE estado_oc NOT IN ('RECHAZADA', 'ANULADA')), 0)::numeric AS monto_total_comprometido
      FROM tcmp_orden_compra
      ${ocWhere};
    `, ocParams);

    const porEmpresaRes = await this.pool.query(`
      SELECT
        id_empresa,
        COUNT(*)::int AS total_ocs,
        COUNT(*) FILTER (WHERE estado_oc IN ('AUTORIZADA', 'AUTORIZADA_CON_OBS', 'ENVIADA_PROVEEDOR', 'RECEPCIONADA_BODEGA', 'FACTURADA_LAUDUS'))::int AS autorizadas,
        COUNT(*) FILTER (WHERE estado_oc = 'PENDIENTE_VB_OMAR')::int AS pendientes_omar,
        COALESCE(SUM(monto_neto) FILTER (WHERE estado_oc NOT IN ('RECHAZADA', 'ANULADA')), 0)::numeric AS monto_neto,
        COALESCE(SUM(monto_total) FILTER (WHERE estado_oc NOT IN ('RECHAZADA', 'ANULADA')), 0)::numeric AS monto_total
      FROM tcmp_orden_compra
      GROUP BY id_empresa;
    `);

    const mapaEmpresas = {};
    Object.values(EMPRESAS_GRUPO).forEach(emp => {
      mapaEmpresas[emp.id_empresa] = {
        ...emp,
        total_ocs: 0,
        autorizadas: 0,
        pendientes_omar: 0,
        monto_neto: 0,
        monto_total: 0
      };
    });

    porEmpresaRes.rows.forEach(r => {
      const idEmp = Number(r.id_empresa);
      if (mapaEmpresas[idEmp]) {
        mapaEmpresas[idEmp].total_ocs = r.total_ocs;
        mapaEmpresas[idEmp].autorizadas = r.autorizadas;
        mapaEmpresas[idEmp].pendientes_omar = r.pendientes_omar;
        mapaEmpresas[idEmp].monto_neto = Number(r.monto_neto || 0);
        mapaEmpresas[idEmp].monto_total = Number(r.monto_total || 0);
      }
    });

    // 3. Listado de Proyectos / OTs Operativas Activas para selector
    const proyRes = await this.pool.query(`
      SELECT
        p.id_proyecto,
        p.codi_proyecto,
        p.nombre_proyecto,
        p.id_empresa,
        p.id_proyecto_estado,
        COALESCE(clt.razon_social, clt.name_empresa, p.json_field->'crm_v1'->>'cliente_nombre', 'Movimiento Interno / GSP') AS cliente_nombre,
        COALESCE((p.json_field->'crm_v1'->>'es_requerimiento_interno')::boolean, false) AS es_requerimiento_interno
      FROM tpry_proyecto p
      LEFT JOIN tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
      WHERE p.id_proyecto_estado IN (1, 2, 3, 4, 5)
      ORDER BY p.id_proyecto DESC
      LIMIT 60;
    `);

    // 4. Listado de OTs de Mantenimiento (Taller) para selector
    const otMantRes = await this.pool.query(`
      SELECT
        ot.id_ot,
        ot.numero_ot,
        ot.id_empresa,
        ot.id_equipo,
        ot.tipo_mantenimiento,
        ot.estado,
        ot.descripcion_falla,
        COALESCE(eq.patente, eq.codigo_interno, 'S/P') AS patente,
        COALESCE(eq.modelo, '') AS equipo_modelo
      FROM tmnt_ot ot
      LEFT JOIN tequ_equipo eq ON ot.id_equipo = eq.id_equipo
      ORDER BY ot.id_ot DESC
      LIMIT 50;
    `);

    // 5. Equipos para selector
    const eqRes = await this.pool.query(`
      SELECT
        id_equipo,
        id_empresa,
        patente,
        COALESCE(codigo_interno, patente) AS codigo_interno,
        marca,
        modelo
      FROM tequ_equipo
      ORDER BY id_equipo ASC
      LIMIT 100;
    `);

    const solKpi = solKpiRes.rows[0] || {};
    const ocKpi = ocKpiRes.rows[0] || {};

    return {
      kpis: {
        solicitudes_pendientes: solKpi.solicitudes_pendientes || 0,
        solicitudes_convertidas: solKpi.solicitudes_convertidas || 0,
        total_solicitudes: solKpi.total_solicitudes || 0,
        ocs_por_visar_omar: ocKpi.ocs_por_visar_omar || 0,
        ocs_autorizadas: ocKpi.ocs_autorizadas || 0,
        ocs_borrador: ocKpi.ocs_borrador || 0,
        ocs_rechazadas: ocKpi.ocs_rechazadas || 0,
        ocs_imputadas_its: ocKpi.ocs_imputadas_its || 0,
        monto_neto_comprometido: Number(ocKpi.monto_neto_comprometido || 0),
        monto_total_comprometido: Number(ocKpi.monto_total_comprometido || 0)
      },
      ocs_por_razon_social: Object.values(mapaEmpresas),
      selectores: {
        empresas_grupo: Object.values(EMPRESAS_GRUPO),
        proyectos_activos: proyRes.rows,
        ots_mantenimiento: otMantRes.rows,
        equipos: eqRes.rows
      }
    };
  }

  async getSolicitudes(filtros = {}) {
    const params = [];
    const where = [];

    if (filtros.id_empresa && Number(filtros.id_empresa) > 0) {
      params.push(Number(filtros.id_empresa));
      where.push(`s.id_empresa = $${params.length}`);
    }
    if (filtros.origen_solicitud) {
      params.push(filtros.origen_solicitud);
      where.push(`s.origen_solicitud = $${params.length}`);
    }
    if (filtros.estado) {
      params.push(filtros.estado);
      where.push(`s.estado = $${params.length}`);
    }
    if (filtros.search) {
      params.push(`%${filtros.search.trim()}%`);
      where.push(`(s.folio_solicitud ILIKE $${params.length} OR s.titulo_necesidad ILIKE $${params.length} OR COALESCE(s.proveedor_sugerido, '') ILIKE $${params.length})`);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const query = `
      SELECT
        s.*,
        p.codi_proyecto,
        p.nombre_proyecto,
        COALESCE(clt.razon_social, clt.name_empresa, p.json_field->'crm_v1'->>'cliente_nombre', '') AS cliente_nombre,
        ot.numero_ot AS numero_ot_mantenimiento,
        ot.descripcion_falla AS descripcion_ot_mantenimiento,
        COALESCE(eq.patente, eq.codigo_interno, '') AS equipo_patente,
        COALESCE(eq.modelo, '') AS equipo_modelo,
        oc_ref.id_oc AS id_oc_generada,
        oc_ref.folio_oc AS folio_oc_generada,
        oc_ref.estado_oc AS estado_oc_generada
      FROM tcmp_solicitud_pedido s
      LEFT JOIN tpry_proyecto p ON s.id_proyecto = p.id_proyecto
      LEFT JOIN tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
      LEFT JOIN tmnt_ot ot ON s.id_ot_mantenimiento = ot.id_ot
      LEFT JOIN tequ_equipo eq ON COALESCE(s.id_equipo, ot.id_equipo) = eq.id_equipo
      LEFT JOIN LATERAL (
        SELECT id_oc, folio_oc, estado_oc
        FROM tcmp_orden_compra oc
        WHERE oc.id_solicitud = s.id_solicitud
        ORDER BY oc.id_oc DESC
        LIMIT 1
      ) oc_ref ON true
      ${whereSql}
      ORDER BY
        CASE WHEN s.estado = 'PENDIENTE_COMPRAS' THEN 0 WHEN s.estado = 'EN_COTIZACION' THEN 1 ELSE 2 END ASC,
        s.id_solicitud DESC;
    `;

    const { rows } = await this.pool.query(query, params);
    return rows.map(r => ({
      ...r,
      empresa_info: EMPRESAS_GRUPO[Number(r.id_empresa)] || EMPRESAS_GRUPO[9]
    }));
  }

  async crearSolicitud(data, user = {}) {
    await this.ensureLaudusColumns();
    const idEmpresa = Number(data.id_empresa || user.id_empresa || 9);
    const origen = ORIGENES_VALIDOS.includes(data.origen_solicitud) ? data.origen_solicitud : 'OPERACIONES_OT';
    const defaultRubro = origen === 'TALLER_BODEGA' ? 'REPUESTOS_TALLER' : 'FLETE_EXTERNO';
    const rubroIts = RUBROS_ITS_VALIDOS.includes(data.rubro_its) ? data.rubro_its : defaultRubro;
    const prioridad = PRIORIDADES_VALIDAS.includes(data.prioridad) ? data.prioridad : 'NORMAL';

    const items = Array.isArray(data.items_json)
      ? data.items_json
      : (Array.isArray(data.items) ? data.items : []);

    let montoEstimado = parseFloat(data.monto_estimado_neto || 0);
    if ((!montoEstimado || montoEstimado <= 0) && items.length > 0) {
      montoEstimado = items.reduce((acc, it) => {
        const cant = parseFloat(it.cantidad || 1);
        const precio = parseFloat(it.precio_estimado || it.precio_unitario || 0);
        return acc + (cant * precio);
      }, 0);
    }

    const folio = await this.generarFolioSolicitud();
    const idUsuario = Number(data.id_usuario_solicita || user.id_user || 55);
    const nombreSolicita = data.nombre_solicita || user.nombre || 'Operaciones / Taller GSP';

    const query = `
      INSERT INTO tcmp_solicitud_pedido (
        folio_solicitud,
        id_empresa,
        origen_solicitud,
        id_proyecto,
        id_ot_mantenimiento,
        id_equipo,
        rubro_its,
        titulo_necesidad,
        justificacion,
        proveedor_sugerido,
        monto_estimado_neto,
        prioridad,
        items_json,
        estado,
        id_usuario_solicita,
        nombre_solicita,
        observacion_compras,
        codigo_cuenta_laudus,
        nombre_cuenta_laudus,
        centro_costo_laudus
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, 'PENDIENTE_COMPRAS', $14, $15, $16, $17, $18, $19
      )
      RETURNING *;
    `;

    const params = [
      folio,
      idEmpresa,
      origen,
      data.id_proyecto ? Number(data.id_proyecto) : null,
      data.id_ot_mantenimiento ? Number(data.id_ot_mantenimiento) : null,
      data.id_equipo ? Number(data.id_equipo) : null,
      rubroIts,
      (data.titulo_necesidad || 'Solicitud de Pedido Operativo').trim(),
      data.justificacion || null,
      data.proveedor_sugerido || null,
      Math.round(montoEstimado || 0),
      prioridad,
      JSON.stringify(items),
      idUsuario,
      nombreSolicita,
      data.observacion_compras || null,
      data.codigo_cuenta_laudus || null,
      data.nombre_cuenta_laudus || null,
      data.centro_costo_laudus || null
    ];

    const { rows } = await this.pool.query(query, params);
    return rows[0];
  }

  async getOrdenes(filtros = {}) {
    await this.sincronizarEstadosTokensOC();

    const params = [];
    const where = [];

    if (filtros.id_empresa && Number(filtros.id_empresa) > 0) {
      params.push(Number(filtros.id_empresa));
      where.push(`oc.id_empresa = $${params.length}`);
    }
    if (filtros.estado_oc) {
      params.push(filtros.estado_oc);
      where.push(`oc.estado_oc = $${params.length}`);
    }
    if (filtros.id_proyecto) {
      params.push(Number(filtros.id_proyecto));
      where.push(`oc.id_proyecto = $${params.length}`);
    }
    if (filtros.search) {
      params.push(`%${filtros.search.trim()}%`);
      where.push(`(oc.folio_oc ILIKE $${params.length} OR oc.razon_social_proveedor ILIKE $${params.length} OR oc.rut_proveedor ILIKE $${params.length} OR COALESCE(oc.folio_laudus_oc, '') ILIKE $${params.length})`);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const query = `
      SELECT
        oc.*,
        p.codi_proyecto,
        p.nombre_proyecto,
        COALESCE(clt.razon_social, clt.name_empresa, p.json_field->'crm_v1'->>'cliente_nombre', '') AS cliente_nombre,
        ot.numero_ot AS numero_ot_mantenimiento,
        ot.descripcion_falla AS descripcion_ot_mantenimiento,
        sp.folio_solicitud,
        sp.origen_solicitud,
        sp.titulo_necesidad AS solicitud_titulo,
        tk.token_uuid,
        tk.estado_token,
        tk.observacion_omar,
        tk.fecha_resolucion AS fecha_resolucion_token,
        tk.nombre_aprueba,
        tk.firma_hash_fes,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id_oc_linea', l.id_oc_linea,
                'numero_item', l.numero_item,
                'id_producto', l.id_producto,
                'sku_codigo', l.sku_codigo,
                'descripcion', l.descripcion,
                'unidad_medida', l.unidad_medida,
                'cantidad', l.cantidad,
                'precio_unitario', l.precio_unitario,
                'descuento_pct', l.descuento_pct,
                'subtotal_neto', l.subtotal_neto
              ) ORDER BY l.numero_item ASC, l.id_oc_linea ASC
            )
            FROM tcmp_orden_compra_linea l
            WHERE l.id_oc = oc.id_oc
          ),
          '[]'::json
        ) AS lineas
      FROM tcmp_orden_compra oc
      LEFT JOIN tpry_proyecto p ON oc.id_proyecto = p.id_proyecto
      LEFT JOIN tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
      LEFT JOIN tmnt_ot ot ON oc.id_ot_mantenimiento = ot.id_ot
      LEFT JOIN tcmp_solicitud_pedido sp ON oc.id_solicitud = sp.id_solicitud
      LEFT JOIN tapr_gerencia_token tk ON oc.id_token_vigente = tk.id_token
      ${whereSql}
      ORDER BY oc.id_oc DESC;
    `;

    const isProd = process.env.APP_ENV === 'prod' || process.env.NODE_ENV === 'production' || process.env.DB_SCHEMA === 'sch_leangsp_prod';
    const prefixPath = isProd ? '/lg-gsp-prod' : '/lg-gsp-dev';
    const { rows } = await this.pool.query(query, params);
    return rows.map(r => ({
      ...r,
      empresa_info: EMPRESAS_GRUPO[Number(r.id_empresa)] || EMPRESAS_GRUPO[9],
      magic_link_omar: r.token_uuid ? `${prefixPath}/aprobacion-gerencia/${r.token_uuid}` : null
    }));
  }

  async getOrdenById(idOc) {
    await this.sincronizarEstadosTokensOC();
    const isProd = process.env.APP_ENV === 'prod' || process.env.NODE_ENV === 'production' || process.env.DB_SCHEMA === 'sch_leangsp_prod';
    const prefixPath = isProd ? '/lg-gsp-prod' : '/lg-gsp-dev';
    const { rows } = await this.pool.query(`
      SELECT
        oc.*,
        p.codi_proyecto,
        p.nombre_proyecto,
        COALESCE(clt.razon_social, clt.name_empresa, p.json_field->'crm_v1'->>'cliente_nombre', '') AS cliente_nombre,
        ot.numero_ot AS numero_ot_mantenimiento,
        ot.descripcion_falla AS descripcion_ot_mantenimiento,
        sp.folio_solicitud,
        sp.origen_solicitud,
        sp.titulo_necesidad AS solicitud_titulo,
        tk.token_uuid,
        tk.estado_token,
        tk.observacion_omar,
        tk.fecha_resolucion AS fecha_resolucion_token,
        tk.nombre_aprueba,
        tk.firma_hash_fes,
        tk.ip_resolucion
      FROM tcmp_orden_compra oc
      LEFT JOIN tpry_proyecto p ON oc.id_proyecto = p.id_proyecto
      LEFT JOIN tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
      LEFT JOIN tmnt_ot ot ON oc.id_ot_mantenimiento = ot.id_ot
      LEFT JOIN tcmp_solicitud_pedido sp ON oc.id_solicitud = sp.id_solicitud
      LEFT JOIN tapr_gerencia_token tk ON oc.id_token_vigente = tk.id_token
      WHERE oc.id_oc = $1;
    `, [idOc]);

    if (rows.length === 0) return null;

    const oc = rows[0];
    const lineasRes = await this.pool.query(`
      SELECT *
      FROM tcmp_orden_compra_linea
      WHERE id_oc = $1
      ORDER BY numero_item ASC, id_oc_linea ASC;
    `, [idOc]);

    return {
      ...oc,
      empresa_info: EMPRESAS_GRUPO[Number(oc.id_empresa)] || EMPRESAS_GRUPO[9],
      lineas: lineasRes.rows,
      magic_link_omar: oc.token_uuid ? `${prefixPath}/aprobacion-gerencia/${oc.token_uuid}` : null
    };
  }

  async crearOrden(data, user = {}) {
    await this.ensureLaudusColumns();
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const idEmpresa = Number(data.id_empresa || user.id_empresa || 9);
      const folioOc = await this.generarFolioOC(idEmpresa, client);

      const lineasInput = Array.isArray(data.lineas) && data.lineas.length > 0
        ? data.lineas
        : [
            {
              descripcion: data.glosa_general || 'Servicio / Suministro según requerimiento',
              unidad_medida: 'UN',
              cantidad: 1,
              precio_unitario: parseFloat(data.monto_neto || 0),
              descuento_pct: 0
            }
          ];

      let sumaNeto = 0;
      const lineasLimpias = lineasInput.map((l, idx) => {
        const cantidad = Math.max(0.0001, parseFloat(l.cantidad || 1));
        const precioUnitario = Math.max(0, parseFloat(l.precio_unitario || 0));
        const descuentoPct = Math.min(100, Math.max(0, parseFloat(l.descuento_pct || 0)));
        const subtotal = Math.round(cantidad * precioUnitario * (1 - descuentoPct / 100));
        sumaNeto += subtotal;
        return {
          numero_item: idx + 1,
          id_producto: l.id_producto ? Number(l.id_producto) : null,
          sku_codigo: l.sku_codigo || null,
          descripcion: (l.descripcion || `Ítem ${idx + 1}`).trim(),
          unidad_medida: (l.unidad_medida || 'UN').trim().toUpperCase(),
          cantidad,
          precio_unitario: precioUnitario,
          descuento_pct: descuentoPct,
          subtotal_neto: subtotal
        };
      });

      const montoExento = Math.round(parseFloat(data.monto_exento || 0));
      const esExenta = Boolean(data.es_exenta);
      const montoNeto = esExenta ? 0 : sumaNeto;
      const montoExentoFinal = esExenta ? sumaNeto : montoExento;
      const montoIva = esExenta ? 0 : Math.round(montoNeto * 0.19);
      const montoTotal = montoNeto + montoExentoFinal + montoIva;

      const idUsuarioEmite = Number(data.id_usuario_emite || user.id_user || 55);
      const nombreEmite = data.nombre_emite || user.nombre || 'Eduardo (Adquisiciones GSP)';

      const insOcRes = await client.query(`
        INSERT INTO tcmp_orden_compra (
          folio_oc,
          id_empresa,
          id_solicitud,
          id_proyecto,
          id_ot_mantenimiento,
          rubro_its,
          id_empresa_proveedor,
          rut_proveedor,
          razon_social_proveedor,
          contacto_proveedor,
          email_proveedor,
          telefono_proveedor,
          condicion_pago,
          moneda,
          monto_neto,
          monto_exento,
          monto_iva,
          monto_total,
          glosa_general,
          estado_oc,
          id_usuario_emite,
          nombre_emite,
          codigo_cuenta_laudus,
          nombre_cuenta_laudus,
          centro_costo_laudus
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'BORRADOR', $20, $21, $22, $23, $24
        )
        RETURNING *;
      `, [
        folioOc,
        idEmpresa,
        data.id_solicitud ? Number(data.id_solicitud) : null,
        data.id_proyecto ? Number(data.id_proyecto) : null,
        data.id_ot_mantenimiento ? Number(data.id_ot_mantenimiento) : null,
        data.rubro_its || 'GASTO_EXTRA',
        data.id_empresa_proveedor ? Number(data.id_empresa_proveedor) : null,
        (data.rut_proveedor || '76.000.000-0').trim(),
        (data.razon_social_proveedor || 'Proveedor por Definir').trim(),
        data.contacto_proveedor || null,
        data.email_proveedor || null,
        data.telefono_proveedor || null,
        data.condicion_pago || 'Crédito 30 días',
        data.moneda || 'CLP',
        montoNeto,
        montoExentoFinal,
        montoIva,
        montoTotal,
        data.glosa_general || null,
        idUsuarioEmite,
        nombreEmite,
        data.codigo_cuenta_laudus || null,
        data.nombre_cuenta_laudus || null,
        data.centro_costo_laudus || null
      ]);

      const nuevaOc = insOcRes.rows[0];

      // Insertar líneas (sin subtotal_neto porque es columna GENERATED ALWAYS)
      for (const lin of lineasLimpias) {
        await client.query(`
          INSERT INTO tcmp_orden_compra_linea (
            id_oc,
            numero_item,
            id_producto,
            sku_codigo,
            descripcion,
            unidad_medida,
            cantidad,
            precio_unitario,
            descuento_pct
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
        `, [
          nuevaOc.id_oc,
          lin.numero_item,
          lin.id_producto,
          lin.sku_codigo,
          lin.descripcion,
          lin.unidad_medida,
          lin.cantidad,
          lin.precio_unitario,
          lin.descuento_pct
        ]);
      }

      // Si proviene de una Solicitud de Pedido, marcarla como CONVERTIDA_OC
      if (data.id_solicitud) {
        await client.query(`
          UPDATE tcmp_solicitud_pedido
          SET
            estado = 'CONVERTIDA_OC',
            observacion_compras = COALESCE($2, observacion_compras),
            updated_at = NOW()
          WHERE id_solicitud = $1;
        `, [Number(data.id_solicitud), `Convertida en Orden de Compra ${folioOc}`]);
      }

      await client.query('COMMIT');
      return await this.getOrdenById(nuevaOc.id_oc);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async enviarVbOmar(idOc, user = {}) {
    const oc = await this.getOrdenById(idOc);
    if (!oc) {
      throw new Error('Orden de Compra no encontrada');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Anular tokens pendientes anteriores para la misma OC
      await client.query(`
        UPDATE tapr_gerencia_token
        SET estado_token = 'ANULADO'
        WHERE tipo_entidad = 'ORDEN_COMPRA'
          AND id_entidad_ref = $1
          AND estado_token = 'PENDIENTE';
      `, [oc.id_oc]);

      const empInfo = EMPRESAS_GRUPO[Number(oc.id_empresa)] || EMPRESAS_GRUPO[9];
      const otVinculada = oc.codi_proyecto
        ? `${oc.codi_proyecto} (${oc.nombre_proyecto || 'Proyecto'})`
        : (oc.numero_ot_mantenimiento ? `OT Mant. ${oc.numero_ot_mantenimiento}` : 'Stock General / Administración');

      const resumenVariables = {
        subtipo: 'ORDEN_COMPRA',
        folio_oc: oc.folio_oc,
        folio_solicitud: oc.folio_solicitud || null,
        id_empresa: Number(oc.id_empresa),
        razon_social_emisora: empInfo.nombre_corto,
        razon_social_legal_emisora: empInfo.razon_social,
        rut_emisora: empInfo.rut,
        proveedor_nombre: oc.razon_social_proveedor,
        proveedor_rut: oc.rut_proveedor,
        contacto_proveedor: oc.contacto_proveedor,
        condicion_pago: oc.condicion_pago,
        moneda: oc.moneda || 'CLP',
        ot_vinculada: otVinculada,
        id_proyecto: oc.id_proyecto || null,
        codi_proyecto: oc.codi_proyecto || null,
        id_ot_mantenimiento: oc.id_ot_mantenimiento || null,
        rubro_its: oc.rubro_its || 'GASTO_EXTRA',
        monto_neto: Number(oc.monto_neto || 0),
        monto_iva: Number(oc.monto_iva || 0),
        monto_total: Number(oc.monto_total || 0),
        glosa_general: oc.glosa_general || '',
        emitido_por: oc.nombre_emite || 'Eduardo (Adquisiciones GSP)',
        items: (oc.lineas || []).map(l => ({
          numero_item: l.numero_item,
          sku_codigo: l.sku_codigo,
          descripcion: l.descripcion,
          unidad_medida: l.unidad_medida,
          cantidad: Number(l.cantidad),
          precio_unitario: Number(l.precio_unitario),
          descuento_pct: Number(l.descuento_pct || 0),
          subtotal_neto: Number(l.subtotal_neto || 0)
        }))
      };

      const tokRes = await client.query(`
        INSERT INTO tapr_gerencia_token (
          id_empresa,
          tipo_entidad,
          id_entidad_ref,
          folio_referencia,
          es_monetario,
          monto_neto_ref,
          resumen_variables,
          estado_token,
          id_usuario_solicita,
          nombre_solicita,
          nombre_aprueba
        ) VALUES (
          $1, 'ORDEN_COMPRA', $2, $3, true, $4, $5::jsonb, 'PENDIENTE', $6, $7, 'Luis Omar Ghisellini Jara'
        )
        RETURNING *;
      `, [
        Number(oc.id_empresa),
        Number(oc.id_oc),
        oc.folio_oc,
        Number(oc.monto_neto || 0),
        JSON.stringify(resumenVariables),
        Number(user.id_user || oc.id_usuario_emite || 55),
        user.nombre || oc.nombre_emite || 'Eduardo (Adquisiciones GSP)'
      ]);

      const tokenRow = tokRes.rows[0];

      await client.query(`
        UPDATE tcmp_orden_compra
        SET
          estado_oc = 'PENDIENTE_VB_OMAR',
          id_token_vigente = $2,
          updated_at = NOW()
        WHERE id_oc = $1;
      `, [oc.id_oc, tokenRow.id_token]);

      await client.query('COMMIT');

      const ocActualizada = await this.getOrdenById(oc.id_oc);
      const isProd = process.env.APP_ENV === 'prod' || process.env.NODE_ENV === 'production' || process.env.DB_SCHEMA === 'sch_leangsp_prod';
      const prefixPath = isProd ? '/lg-gsp-prod' : '/lg-gsp-dev';
      const baseHost = (process.env.BASE_URL || (isProd ? 'https://servidor.leanglobal.cl/lg-gsp-prod' : 'https://servidor.leanglobal.cl/lg-gsp-dev')).replace(/\/$/, '');
      return {
        orden: ocActualizada,
        token: tokenRow,
        url_aprobacion_movil: `${prefixPath}/aprobacion-gerencia/${tokenRow.token_uuid}`,
        url_absoluta_aprobacion: `${baseHost}/aprobacion-gerencia/${tokenRow.token_uuid}`
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async sincronizarItsLaudus(idOc, payload = {}, user = {}) {
    await this.ensureLaudusColumns();
    const oc = await this.getOrdenById(idOc);
    if (!oc) {
      throw new Error('Orden de Compra no encontrada');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const folioLaudus = payload.folio_laudus_oc !== undefined ? String(payload.folio_laudus_oc).trim() : oc.folio_laudus_oc;
      const folioDte = payload.folio_dte_factura_compra !== undefined ? String(payload.folio_dte_factura_compra).trim() : oc.folio_dte_factura_compra;
      const imputarIts = payload.imputado_en_its !== undefined ? Boolean(payload.imputado_en_its) : true;
      const codCuenta = payload.codigo_cuenta_laudus !== undefined ? String(payload.codigo_cuenta_laudus).trim() : oc.codigo_cuenta_laudus;
      const nomCuenta = payload.nombre_cuenta_laudus !== undefined ? String(payload.nombre_cuenta_laudus).trim() : oc.nombre_cuenta_laudus;
      const centroCosto = payload.centro_costo_laudus !== undefined ? String(payload.centro_costo_laudus).trim() : oc.centro_costo_laudus;

      let nuevoEstado = oc.estado_oc;
      if (folioDte && ['AUTORIZADA', 'AUTORIZADA_CON_OBS', 'ENVIADA_PROVEEDOR', 'RECEPCIONADA_BODEGA'].includes(oc.estado_oc)) {
        nuevoEstado = 'FACTURADA_LAUDUS';
      }

      await client.query(`
        UPDATE tcmp_orden_compra
        SET
          folio_laudus_oc = $2,
          folio_dte_factura_compra = $3,
          imputado_en_its = $4,
          fecha_sincronizacion_laudus = NOW(),
          estado_oc = $5,
          codigo_cuenta_laudus = $6,
          nombre_cuenta_laudus = $7,
          centro_costo_laudus = $8,
          updated_at = NOW()
        WHERE id_oc = $1;
      `, [
        oc.id_oc,
        folioLaudus || null,
        folioDte || null,
        imputarIts,
        nuevoEstado,
        codCuenta || null,
        nomCuenta || null,
        centroCosto || null
      ]);

      // Si tiene proyecto vinculado e imputarIts = true, sincronizar con tits_costo_operacional si existe cabecera ITS
      let itsCostoSincronizado = false;
      if (imputarIts && oc.id_proyecto) {
        const itsRes = await client.query(`
          SELECT id_its FROM tits_informe_termino
          WHERE id_proyecto = $1
          ORDER BY id_its DESC
          LIMIT 1;
        `, [oc.id_proyecto]);

        if (itsRes.rows.length > 0) {
          const idIts = itsRes.rows[0].id_its;
          const mapRubroToCat = {
            FLETE_EXTERNO: 'SUBCONTRATO_FLETE',
            PERSONAL_EXTERNO: 'PERSONAL_EXTERNO',
            PENSION_ALOJAMIENTO: 'PENSIONES',
            VIATICO_ALIMENTACION: 'ALIMENTACION',
            MOVILIZACION: 'MOVILIZACION',
            PEAJE_TAG: 'PEAJES',
            GASTO_EXTRA: 'GASTOS_EXTRA'
          };
          const dbCat = mapRubroToCat[oc.rubro_its] || 'GASTOS_EXTRA';
          const concepto = `${oc.razon_social_proveedor} - ${oc.glosa_general || 'OC ' + oc.folio_oc}${folioDte ? ' (Fact. DTE ' + folioDte + ')' : ''}${folioLaudus ? ' [Laudus ' + folioLaudus + ']' : ''}`;

          const existCosto = await client.query(`
            SELECT id_costo_item FROM tits_costo_operacional
            WHERE id_its = $1 AND numero_oc = $2
            LIMIT 1;
          `, [idIts, oc.folio_oc]);

          if (existCosto.rows.length > 0) {
            await client.query(`
              UPDATE tits_costo_operacional
              SET
                categoria = $2,
                concepto_detalle = $3,
                precio_unitario = $4,
                monto_total = $4
              WHERE id_costo_item = $1;
            `, [existCosto.rows[0].id_costo_item, dbCat, concepto, Number(oc.monto_neto || 0)]);
          } else {
            await client.query(`
              INSERT INTO tits_costo_operacional (
                id_its,
                categoria,
                fecha,
                numero_oc,
                concepto_detalle,
                tipo_calculo,
                cantidad_unidades,
                precio_unitario,
                monto_total
              ) VALUES ($1, $2, CURRENT_DATE, $3, $4, 'MONTO_DIRECTO', 1, $5, $5);
            `, [idIts, dbCat, oc.folio_oc, concepto, Number(oc.monto_neto || 0)]);
          }
          itsCostoSincronizado = true;
        }
      }

      await client.query('COMMIT');
      const ocActualizada = await this.getOrdenById(oc.id_oc);
      return {
        orden: ocActualizada,
        its_costo_sincronizado: itsCostoSincronizado
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = new ComprasModel();
