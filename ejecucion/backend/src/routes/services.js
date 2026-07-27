import { Router } from 'express';

const router = Router();

// Mock store de servicios en memoria
const mockServices = [];

// POST /api/services
router.post('/', (req, res, next) => {
  try {
    const {
      customerName,
      customerPhone,
      vehiclePlate,
      vehicleModel,
      originAddress,
      originLat,
      originLng,
      destAddress,
      destLat,
      destLng,
      craneTypeRequired
    } = req.body;

    if (!customerName || !customerPhone || !vehiclePlate) {
      return res.status(400).json({ error: 'Nombre, teléfono y patente del vehículo son obligatorios' });
    }

    // Lógica básica de cálculo tentativo (motor de precios spec)
    const basePrice = 50000; // Ej: CLP base
    const pricePerKm = 1200; // CLP por Km
    const distanceKm = 15; // Simulación de distancia
    const extraCharges = craneTypeRequired === 'PESADO' ? 30000 : 0;
    const totalPrice = basePrice + (pricePerKm * distanceKm) + extraCharges;

    const newService = {
      id: `srv-uuid-${Math.floor(Math.random() * 100000)}`,
      customerName,
      customerPhone,
      vehiclePlate,
      vehicleModel,
      originAddress,
      originLat,
      originLng,
      destAddress,
      destLat,
      destLng,
      status: 'SOLICITADO',
      operatorId: null,
      craneId: null,
      basePrice,
      pricePerKm,
      extraCharges,
      totalPrice,
      requestedAt: new Date().toISOString(),
      assignedAt: null,
      startedRouteAt: null,
      arrivedSiteAt: null,
      completedAt: null,
      cancelledAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      logs: []
    };

    mockServices.push(newService);

    res.status(201).json({
      message: 'Solicitud de servicio creada con éxito',
      service: newService
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/services/:id/status
router.patch('/:id/status', (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, operatorId, note } = req.body;

    const service = mockServices.find(s => s.id === id);
    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    const previousStatus = service.status;

    // Regla de validación de transiciones de estado básicas
    const validTransitions = {
      'SOLICITADO': ['ASIGNADO', 'CANCELADO'],
      'ASIGNADO': ['EN_RUTA', 'CANCELADO'],
      'EN_RUTA': ['EN_SITIO', 'CANCELADO'],
      'EN_SITIO': ['EN_TRASLADO', 'CANCELADO'],
      'EN_TRASLADO': ['COMPLETADO', 'CANCELADO'],
      'COMPLETADO': [],
      'CANCELADO': []
    };

    if (!validTransitions[previousStatus].includes(status)) {
      return res.status(400).json({
        error: `Transición de estado inválida de ${previousStatus} a ${status}`
      });
    }

    // Actualizar campos
    service.status = status;
    service.updatedAt = new Date().toISOString();

    if (operatorId) {
      service.operatorId = operatorId;
    }

    // Registrar en el log histórico (ServiceLog)
    const logEntry = {
      id: `log-uuid-${Math.floor(Math.random() * 100000)}`,
      serviceRequestId: id,
      fromStatus: previousStatus,
      toStatus: status,
      timestamp: new Date().toISOString(),
      note: note || `Estado actualizado a ${status}`
    };
    service.logs.push(logEntry);

    // Fechas de hitos
    if (status === 'ASIGNADO') service.assignedAt = new Date().toISOString();
    if (status === 'EN_RUTA') service.startedRouteAt = new Date().toISOString();
    if (status === 'EN_SITIO') service.arrivedSiteAt = new Date().toISOString();
    if (status === 'COMPLETADO') service.completedAt = new Date().toISOString();
    if (status === 'CANCELADO') service.cancelledAt = new Date().toISOString();

    res.status(200).json({
      message: 'Estado del servicio actualizado',
      service
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/services (adicional para visualización de pruebas)
router.get('/', (req, res, next) => {
  try {
    res.status(200).json(mockServices);
  } catch (error) {
    next(error);
  }
});

export default router;
