const estadoPagoModel = require('../models/estadoPagoModel');

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
    res.status(201).json({ message: "Estado de Pago generado exitosamente", data });
  } catch (error) {
    console.error("[EDP] Error al crear estado de pago:", error);
    res.status(500).json({ message: "Error al generar estado de pago", error: error.message });
  }
};

exports.getEstadosPagoPorProyecto = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await estadoPagoModel.getEstadosPagoPorProyecto(id);
    res.status(200).json(data);
  } catch (error) {
    console.error("[EDP] Error obteniendo estados de pago:", error);
    res.status(500).json({ message: "Error al obtener estados de pago", error: error.message });
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
    console.error("[COSTOS] Error al imputar costo:", error);
    res.status(500).json({ message: "Error al registrar costo operacional", error: error.message });
  }
};

exports.getVisor360Proyecto = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await estadoPagoModel.getVisor360Proyecto(id);
    res.status(200).json(data);
  } catch (error) {
    console.error("[VISOR_360] Error obteniendo margen 360:", error);
    res.status(500).json({ message: "Error al obtener visor 360", error: error.message });
  }
};
