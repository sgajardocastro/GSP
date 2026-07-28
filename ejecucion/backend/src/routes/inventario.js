import { Router } from 'express';
import pool from '../db.js';

const router = Router();

const verificarScopeEmpresa = (req, res, next) => {
  if (req.body.id_empresa && req.user && req.user.id_empresa !== req.body.id_empresa) {
    return res.status(422).json({
      error_code: 'SCOPE_EMPRESA_NO_AUTORIZADO',
      message: 'No tiene permisos para operar en esta empresa'
    });
  }
  next();
};

// --- 1. Bodegas ---
router.get('/bodegas', async (req, res, next) => {
  try {
    const id_empresa = req.query._id_empresa || req.user?.id_empresa || 9;
    const result = await pool.query(
      'SELECT id_bodega as id, id_empresa, nombre, ubicacion as sucursal_nombre, estado, created_at FROM sch_leangsp.tinv_bodega WHERE id_empresa = $1 ORDER BY id_bodega DESC;',
      [id_empresa]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/bodegas', verificarScopeEmpresa, async (req, res, next) => {
  try {
    const id_empresa = req.body.id_empresa || req.user?.id_empresa || 9;
    const { nombre, sucursal_nombre } = req.body;
    if (!nombre) {
      return res.status(400).json({ error_code: 'CAMPOS_INVALIDOS', message: 'El nombre de la bodega es obligatorio' });
    }

    const result = await pool.query(
      'INSERT INTO sch_leangsp.tinv_bodega (id_empresa, nombre, ubicacion, estado) VALUES ($1, $2, $3, $4) RETURNING id_bodega as id, id_empresa, nombre, ubicacion as sucursal_nombre, estado, created_at;',
      [id_empresa, nombre, sucursal_nombre || 'Santiago Central', 'ACTIVA']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// --- 2. Maestro de Productos (Con Marca, Precio Ref, Fraccionamiento y SKU Completo) ---
router.get('/productos', async (req, res, next) => {
  try {
    const id_empresa = req.query._id_empresa || req.user?.id_empresa || 9;
    const result = await pool.query(
      `SELECT id_producto as id, id_empresa, prefijo_sku, correlativo_sku, sku, nombre, marca, 
              precio_referencia, flag_fraccionable, unidades_contenido, unidad_medida, categoria as tipo, estado, created_at 
       FROM sch_leangsp.tinv_producto WHERE id_empresa = $1 ORDER BY id_producto DESC;`,
      [id_empresa]
    );
    res.json({
      total: result.rowCount,
      data: result.rows
    });
  } catch (err) {
    next(err);
  }
});

router.post('/productos', async (req, res, next) => {
  try {
    const id_empresa = req.body.id_empresa || req.user?.id_empresa || 9;
    const { nombre, prefijo_sku, marca, precio_referencia, flag_fraccionable, unidades_contenido, tipo, unidad_medida } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ error_code: 'CAMPOS_INVALIDOS', message: 'El nombre del producto es requerido' });
    }
    
    const prefijo = (prefijo_sku || 'FILT').toUpperCase().slice(0, 4);
    const correlativo = String(Date.now()).slice(-6);
    const fullSku = `${prefijo}-${correlativo}`;

    const result = await pool.query(
      `INSERT INTO sch_leangsp.tinv_producto 
        (id_empresa, prefijo_sku, correlativo_sku, sku, nombre, marca, precio_referencia, flag_fraccionable, unidades_contenido, unidad_medida, categoria, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ACTIVO')
       RETURNING id_producto as id, id_empresa, prefijo_sku, correlativo_sku, sku, nombre, marca, precio_referencia, flag_fraccionable, unidades_contenido, unidad_medida, categoria as tipo, estado, created_at;`,
      [
        id_empresa, 
        prefijo, 
        correlativo, 
        fullSku, 
        nombre, 
        marca || 'Genérico', 
        precio_referencia || 0, 
        Boolean(flag_fraccionable), 
        unidades_contenido || 1, 
        unidad_medida || 'UNID', 
        tipo || 'Filtros'
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// --- 3. Existencias ---
router.get('/existencias', async (req, res, next) => {
  try {
    const id_empresa = req.query._id_empresa || req.user?.id_empresa || 9;
    const result = await pool.query(
      `SELECT e.id_existencia as id, e.id_bodega, e.id_producto, p.nombre as producto_nombre, p.sku, p.marca,
              e.cantidad as cantidad_disponible, e.costo_adquisicion as costo, e.numero_oc as oc,
              e.estado, e.fecha_ingreso
       FROM sch_leangsp.tinv_existencia e
       JOIN sch_leangsp.tinv_producto p ON e.id_producto = p.id_producto
       WHERE e.id_empresa = $1
       ORDER BY e.id_existencia DESC;`,
      [id_empresa]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/existencias/ingresar', async (req, res, next) => {
  try {
    const id_empresa = req.body.id_empresa || req.user?.id_empresa || 9;
    const { id_producto, id_bodega, cantidad, costo, oc } = req.body;

    if (!costo || Number(costo) <= 0) {
      return res.status(422).json({ error_code: 'COSTO_CERO_NO_PERMITIDO', message: 'El costo debe ser mayor a 0.' });
    }

    if (!oc || String(oc).trim() === '') {
      return res.status(422).json({ error_code: 'OC_REQUERIDA', message: 'El número de Orden de Compra (OC) es obligatorio.' });
    }

    // Insertar Existencia
    const result = await pool.query(
      `INSERT INTO sch_leangsp.tinv_existencia (id_empresa, id_bodega, id_producto, cantidad, costo_adquisicion, numero_oc, estado)
       VALUES ($1, $2, $3, $4, $5, $6, 'DISPONIBLE')
       RETURNING id_existencia as id, id_bodega, id_producto, cantidad as cantidad_disponible, costo_adquisicion as costo, numero_oc as oc, estado;`,
      [id_empresa, id_bodega || 1, id_producto || 1, cantidad || 1, costo, oc]
    );

    // Registrar en Kardex Físico de Movimientos
    await pool.query(
      `INSERT INTO sch_leangsp.tinv_movimiento (id_empresa, id_bodega, id_producto, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, referencia, usuario_registro)
       VALUES ($1, $2, $3, 'INGRESO_OC', $4, 0, $4, $5, 'Usuario Sistema');`,
      [id_empresa, id_bodega || 1, id_producto || 1, cantidad || 1, oc]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// --- 4. Auditoría Kardex Físico (Movimientos) ---
router.get('/movimientos', async (req, res, next) => {
  try {
    const id_empresa = req.query._id_empresa || req.user?.id_empresa || 9;
    const result = await pool.query(
      `SELECT m.id_movimiento as id, m.fecha_movimiento, m.tipo_movimiento, m.cantidad, m.stock_anterior, m.stock_nuevo,
              m.referencia, m.usuario_registro, b.nombre as bodega_nombre, p.nombre as producto_nombre, p.sku
       FROM sch_leangsp.tinv_movimiento m
       JOIN sch_leangsp.tinv_bodega b ON m.id_bodega = b.id_bodega
       JOIN sch_leangsp.tinv_producto p ON m.id_producto = p.id_producto
       WHERE m.id_empresa = $1
       ORDER BY m.id_movimiento DESC;`,
      [id_empresa]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// --- 5. Alertas & Quiebres de Stock ---
router.get('/alertas/quiebres', async (req, res, next) => {
  try {
    const id_empresa = req.query._id_empresa || req.user?.id_empresa || 9;
    const result = await pool.query(
      `SELECT p.id_producto as id, p.sku, p.nombre, p.marca, COALESCE(SUM(e.cantidad), 0) as stock_actual,
              5 as nivel_minimo, 10 as punto_reorden,
              CASE 
                WHEN COALESCE(SUM(e.cantidad), 0) <= 5 THEN 'QUIEBRE_CRITICO'
                WHEN COALESCE(SUM(e.cantidad), 0) <= 10 THEN 'PUNTO_REORDEN'
                ELSE 'NORMAL'
              END as estado_alerta
       FROM sch_leangsp.tinv_producto p
       LEFT JOIN sch_leangsp.tinv_existencia e ON p.id_producto = e.id_producto
       WHERE p.id_empresa = $1
       GROUP BY p.id_producto, p.sku, p.nombre, p.marca;`,
      [id_empresa]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

export default router;
