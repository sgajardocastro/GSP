const inventarioModel = require('../models/inventarioModel');

class InventarioController {
  _getEmpresaId(req) {
    return req.user?.id_empresa || parseInt(req.query.id_empresa || req.body?.id_empresa || 9, 10);
  }

  _getUserId(req) {
    return req.user?.id_user || 1;
  }

  // =========================================================================
  // 1. BODEGAS & UBICACIONES
  // =========================================================================

  async getBodegas(req, res) {
    try {
      const empresaId = this._getEmpresaId(req);
      const bodegas = await inventarioModel.getBodegas(empresaId);
      return res.status(200).json({ success: true, count: bodegas.length, data: bodegas });
    } catch (err) {
      console.error('Error en InventarioController.getBodegas:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getUbicaciones(req, res) {
    try {
      const idBodega = parseInt(req.query.id_bodega || 1, 10);
      const ubicaciones = await inventarioModel.getUbicaciones(idBodega);
      return res.status(200).json({ success: true, count: ubicaciones.length, data: ubicaciones });
    } catch (err) {
      console.error('Error en InventarioController.getUbicaciones:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // =========================================================================
  // 2. CATÁLOGO DE PRODUCTOS
  // =========================================================================

  async getProductos(req, res) {
    try {
      const empresaId = this._getEmpresaId(req);
      const filtros = {
        search: req.query.search,
        familia: req.query.familia,
        impacto: req.query.impacto,
        estado: req.query.estado
      };
      const productos = await inventarioModel.getProductos(empresaId, filtros);
      return res.status(200).json({ success: true, count: productos.length, data: productos });
    } catch (err) {
      console.error('Error en InventarioController.getProductos:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getProductoById(req, res) {
    try {
      const { id } = req.params;
      const empresaId = this._getEmpresaId(req);
      const producto = await inventarioModel.getProductoById(id, empresaId);
      if (!producto) {
        return res.status(404).json({ success: false, error: 'Producto no encontrado' });
      }
      return res.status(200).json({ success: true, data: producto });
    } catch (err) {
      console.error('Error en InventarioController.getProductoById:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async createProducto(req, res) {
    try {
      const empresaId = this._getEmpresaId(req);
      const data = req.body;
      if (!data.nombre) {
        return res.status(400).json({ success: false, error: 'El nombre del producto es obligatorio.' });
      }
      const nuevoProducto = await inventarioModel.createProducto(empresaId, data);
      return res.status(201).json({ success: true, data: nuevoProducto });
    } catch (err) {
      console.error('Error en InventarioController.createProducto:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // =========================================================================
  // 3. EXISTENCIAS & ALERTAS
  // =========================================================================

  async getExistencias(req, res) {
    try {
      const empresaId = this._getEmpresaId(req);
      const filtros = {
        estado_stock: req.query.estado_stock,
        id_bodega: req.query.id_bodega
      };
      const existencias = await inventarioModel.getExistencias(empresaId, filtros);
      return res.status(200).json({ success: true, count: existencias.length, data: existencias });
    } catch (err) {
      console.error('Error en InventarioController.getExistencias:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getAlertasReposicion(req, res) {
    try {
      const empresaId = this._getEmpresaId(req);
      const alertas = await inventarioModel.getAlertasReposicion(empresaId);
      return res.status(200).json({ success: true, count: alertas.length, data: alertas });
    } catch (err) {
      console.error('Error en InventarioController.getAlertasReposicion:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // =========================================================================
  // 4. RECEPCIÓN DE MATERIALES
  // =========================================================================

  async crearRecepcion(req, res) {
    try {
      const empresaId = this._getEmpresaId(req);
      const userId = this._getUserId(req);
      const data = req.body;

      if (!Array.isArray(data.lineas) || data.lineas.length === 0) {
        if (data.id_producto && (data.cantidad || data.cantidad_recibida)) {
          data.lineas = [{
            id_producto: parseInt(data.id_producto, 10),
            cantidad_recibida: Number(data.cantidad || data.cantidad_recibida),
            costo_unitario_moneda: Number(data.costo || data.costo_unitario_moneda || 0),
            id_ubicacion_destino: parseInt(data.id_ubicacion || data.id_ubicacion_destino || 1, 10),
            lote_texto: data.lote || data.lote_texto || null,
            serie_texto: data.serie || data.serie_texto || null
          }];
          if (!data.documento_referencia && data.oc) {
            data.documento_referencia = data.oc;
          }
        } else {
          return res.status(400).json({ success: false, error: 'Debe incluir al menos una línea de recepción.' });
        }
      }

      const recepcion = await inventarioModel.crearRecepcion(empresaId, userId, data);
      return res.status(201).json({ success: true, data: recepcion });
    } catch (err) {
      console.error('Error en InventarioController.crearRecepcion:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // =========================================================================
  // 5. DESPACHO A OT Y DEVOLUCIONES
  // =========================================================================

  async despacharOt(req, res) {
    try {
      const empresaId = this._getEmpresaId(req);
      const userId = this._getUserId(req);
      const data = req.body;

      // Normalizar datos si vienen de UI simplificada
      if (!data.id_ot && data.folio_ot) {
        data.id_ot = parseInt(String(data.folio_ot).replace(/\D/g, '') || 1, 10);
      }
      if (!data.id_ubicacion) data.id_ubicacion = 1;
      if (!data.cantidad) data.cantidad = 1;

      if (!data.id_ot || !data.id_producto) {
        return res.status(400).json({ 
          success: false, 
          error: 'Parámetros incompletos (requiere id_ot e id_producto).' 
        });
      }

      const result = await inventarioModel.despacharOt(empresaId, userId, data);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      console.error('Error en InventarioController.despacharOt:', err);
      const status = err.message.includes('STOCK_INSUFICIENTE') ? 422 : 500;
      return res.status(status).json({ success: false, error: err.message });
    }
  }

  async devolverOt(req, res) {
    try {
      const empresaId = this._getEmpresaId(req);
      const userId = this._getUserId(req);
      const data = req.body;

      if (!data.id_ot_repuesto || !data.id_ubicacion_destino || !data.cantidad_devolver) {
        return res.status(400).json({ 
          success: false, 
          error: 'Parámetros incompletos (requiere id_ot_repuesto, id_ubicacion_destino, cantidad_devolver).' 
        });
      }

      const result = await inventarioModel.devolverOt(empresaId, userId, data);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      console.error('Error en InventarioController.devolverOt:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // =========================================================================
  // 6. KARDEX INMUTABLE & REVERSOS
  // =========================================================================

  async getKardexMovimientos(req, res) {
    try {
      const empresaId = this._getEmpresaId(req);
      const filtros = {
        id_producto: req.query.id_producto,
        tipo_movimiento: req.query.tipo_movimiento
      };
      const movimientos = await inventarioModel.getKardexMovimientos(empresaId, filtros);
      return res.status(200).json({ success: true, count: movimientos.length, data: movimientos });
    } catch (err) {
      console.error('Error en InventarioController.getKardexMovimientos:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async reversarMovimiento(req, res) {
    try {
      const { id } = req.params;
      const empresaId = this._getEmpresaId(req);
      const supervisorId = this._getUserId(req);
      const { motivo } = req.body;

      const result = await inventarioModel.reversarMovimiento(id, empresaId, supervisorId, motivo);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      console.error('Error en InventarioController.reversarMovimiento:', err);
      const status = err.message.includes('REVERSO_YA_EJECUTADO') || err.message.includes('STOCK_NEGATIVO') ? 422 : 500;
      return res.status(status).json({ success: false, error: err.message });
    }
  }

  // =========================================================================
  // 7. CONTEOS Y PROCESOS DE INVENTARIO
  // =========================================================================

  async getConteos(req, res) {
    try {
      const empresaId = this._getEmpresaId(req);
      const conteos = await inventarioModel.getConteos(empresaId);
      return res.status(200).json({ success: true, count: conteos.length, data: conteos });
    } catch (err) {
      console.error('Error en InventarioController.getConteos:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new InventarioController();
