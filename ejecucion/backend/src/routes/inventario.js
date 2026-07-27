import { Router } from 'express';

const router = Router();

// --- 1. Bodegas ---
router.get('/bodegas', async (req, res, next) => {
  try {
    // Ejemplo de respuesta según contrato OpenAPI
    res.json([
      { id: 1, id_empresa: 9, id_sucursal: 1, nombre: 'Bodega Principal Santiago', estado: 'ACTIVO' },
      { id: 2, id_empresa: 9, id_sucursal: 2, nombre: 'Bodega Faena Antofagasta', estado: 'ACTIVO' }
    ]);
  } catch (err) {
    next(err);
  }
});

router.post('/bodegas', async (req, res, next) => {
  try {
    const { id_empresa, id_sucursal, nombre } = req.body;
    if (!nombre || !id_empresa || !id_sucursal) {
      return res.status(400).json({ error_code: 'CAMPOS_INVALIDOS', message: 'Faltan campos obligatorios' });
    }
    res.status(201).json({ id: Date.now(), id_empresa, id_sucursal, nombre, estado: 'ACTIVO' });
  } catch (err) {
    next(err);
  }
});

router.put('/bodegas/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, estado } = req.body;
    res.json({ id: Number(id), id_empresa: 9, id_sucursal: 1, nombre, estado: estado || 'ACTIVO' });
  } catch (err) {
    next(err);
  }
});

// --- 2. Productos ---
router.get('/productos', async (req, res, next) => {
  try {
    res.json({
      total: 2,
      page: 1,
      limit: 20,
      data: [
        { id: 101, codigo_fabricante: 'FL-400S', nombre: 'Filtro de Aceite Motorcraft', prefijo_sku: 'FILT', marca: 'Motorcraft', tipo: 'Filtros', nivel_minimo: 5 },
        { id: 102, codigo_fabricante: 'BRK-882', nombre: 'Pastillas de Freno Delanteras', prefijo_sku: 'PAST', marca: 'Brembo', tipo: 'Frenos', nivel_minimo: 2 }
      ]
    });
  } catch (err) {
    next(err);
  }
});

router.post('/productos', async (req, res, next) => {
  try {
    const { codigo_fabricante, nombre, prefijo_sku, marca, tipo, nivel_minimo } = req.body;
    if (!codigo_fabricante || !nombre) {
      return res.status(400).json({ error_code: 'CAMPOS_INVALIDOS', message: 'Código de fabricante y nombre son requeridos' });
    }
    if (prefijo_sku && prefijo_sku.length !== 4) {
      return res.status(400).json({ error_code: 'SKU_INVALIDO', message: 'El prefijo SKU debe ser exactamente de 4 caracteres' });
    }
    res.status(201).json({
      id: Date.now(),
      codigo_fabricante,
      nombre,
      prefijo_sku: (prefijo_sku || 'GENR').toUpperCase(),
      marca: marca || 'Genérico',
      tipo: tipo || 'General',
      nivel_minimo: nivel_minimo || 0
    });
  } catch (err) {
    next(err);
  }
});

router.get('/productos/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    res.json({ id: Number(id), codigo_fabricante: 'FL-400S', nombre: 'Filtro de Aceite Motorcraft', prefijo_sku: 'FILT', marca: 'Motorcraft', tipo: 'Filtros', nivel_minimo: 5 });
  } catch (err) {
    next(err);
  }
});

// --- 3. Existencias (Ingreso con validación de reglas duras) ---
router.get('/existencias', async (req, res, next) => {
  try {
    res.json([
      { id: 501, id_producto: 101, id_bodega: 1, sku: 'FILT-000501', codigo_barras: 'BAR-501-889', cantidad_disponible: 10, costo: 4500, oc: 'OC-99382', estado: 'DISPONIBLE' }
    ]);
  } catch (err) {
    next(err);
  }
});

router.post('/existencias/ingresar', async (req, res, next) => {
  try {
    const { id_producto, id_bodega, cantidad, costo, oc, numero_factura, ubicacion_fisica } = req.body;

    // Regla dura 1: Costo > 0
    if (!costo || Number(costo) <= 0) {
      return res.status(422).json({
        error_code: 'COSTO_CERO_NO_PERMITIDO',
        message: 'El costo de adquisición debe ser mayor a 0.'
      });
    }

    // Regla dura 2: OC Obligatoria
    if (!oc || String(oc).trim() === '') {
      return res.status(422).json({
        error_code: 'OC_REQUERIDA',
        message: 'El número de Orden de Compra (OC) es obligatorio para ingresar material.'
      });
    }

    const idGenerado = Date.now();
    res.status(201).json({
      id: idGenerado,
      id_producto,
      id_bodega,
      sku: `SKU-${idGenerado}`,
      codigo_barras: `BAR-${idGenerado}`,
      cantidad_disponible: cantidad || 1,
      costo,
      oc,
      numero_factura: numero_factura || null,
      ubicacion_fisica: ubicacion_fisica || 'General',
      estado: 'DISPONIBLE',
      mensaje: 'Material ingresado exitosamente a bodega'
    });
  } catch (err) {
    next(err);
  }
});

router.get('/existencias/barcode/:codigo', async (req, res, next) => {
  try {
    const { codigo } = req.params;
    res.json({
      id: 501,
      id_producto: 101,
      id_bodega: 1,
      sku: 'FILT-000501',
      codigo_barras: codigo,
      cantidad_disponible: 1,
      costo: 4500,
      oc: 'OC-99382',
      estado: 'DISPONIBLE'
    });
  } catch (err) {
    next(err);
  }
});

router.post('/existencias/baja', async (req, res, next) => {
  try {
    const { id_existencia, motivo } = req.body;
    if (!id_existencia || !motivo) {
      return res.status(400).json({ error_code: 'CAMPOS_INVALIDOS', message: 'ID de existencia y motivo son obligatorios' });
    }
    res.json({ status: 'OK', message: 'Existencia dada de baja correctamente', id_existencia, motivo });
  } catch (err) {
    next(err);
  }
});

// --- 4. Traspasos ---
router.post('/traspasos', async (req, res, next) => {
  try {
    const { id_bodega_origen, id_bodega_destino, codigos_barras } = req.body;
    res.status(201).json({
      id: Date.now(),
      id_bodega_origen,
      id_bodega_destino,
      items_traspasados: codigos_barras ? codigos_barras.length : 0,
      estado: 'EN_TRANSITO',
      fecha_creacion: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

router.post('/traspasos/:id/recibir', async (req, res, next) => {
  try {
    const { id } = req.params;
    res.json({ status: 'OK', id_traspaso: Number(id), estado: 'RECIBIDO', fecha_recepcion: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

// --- 5. Despacho a OT ---
router.post('/despacho', async (req, res, next) => {
  try {
    const { folio_ot, codigos_barras } = req.body;
    if (!folio_ot || !codigos_barras || !codigos_barras.length) {
      return res.status(400).json({ error_code: 'CAMPOS_INVALIDOS', message: 'Folio de OT y lista de códigos de barra son requeridos' });
    }

    res.json({
      status: 'DESPACHADO',
      folio_ot,
      items_despachados: codigos_barras.length,
      fecha_despacho: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

// --- 6. Alertas de Stock ---
router.get('/alertas/stock', async (req, res, next) => {
  try {
    res.json([
      { id: 101, codigo_fabricante: 'FL-400S', nombre: 'Filtro de Aceite Motorcraft', stock_actual: 1, nivel_minimo: 5, alerta: 'STOCK_CRITICO' }
    ]);
  } catch (err) {
    next(err);
  }
});

export default router;
