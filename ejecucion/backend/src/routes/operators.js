import { Router } from 'express';

const router = Router();

// Mock data inicial de operadores
const mockOperators = [
  {
    id: 'op-uuid-456',
    name: 'Carlos Chofer',
    licenseNumber: 'A4-998877',
    isAvailable: true,
    currentCrane: {
      id: 'crn-uuid-789',
      plateNumber: 'XX-YY-11',
      type: 'CAMA'
    }
  },
  {
    id: 'op-uuid-777',
    name: 'Pedro Operador',
    licenseNumber: 'A5-123456',
    isAvailable: false,
    currentCrane: null
  }
];

// GET /api/operators
router.get('/', (req, res, next) => {
  try {
    const { isAvailable } = req.query;
    let operators = [...mockOperators];
    
    if (isAvailable !== undefined) {
      const isAvailableBool = isAvailable === 'true';
      operators = operators.filter(op => op.isAvailable === isAvailableBool);
    }
    
    res.status(200).json(operators);
  } catch (error) {
    next(error);
  }
});

// PUT /api/operators/:id/assign-crane
router.put('/:id/assign-crane', (req, res, next) => {
  try {
    const { id } = req.params;
    const { craneId } = req.body;

    if (!craneId) {
      return res.status(400).json({ error: 'craneId es obligatorio' });
    }

    const operator = mockOperators.find(op => op.id === id);
    if (!operator) {
      return res.status(404).json({ error: 'Operador no encontrado' });
    }

    // Actualizar asociación mockeada
    operator.currentCrane = {
      id: craneId,
      plateNumber: 'XX-YY-99', // Simulado
      type: 'PLUMA' // Simulado
    };

    res.status(200).json({
      message: 'Grúa asignada exitosamente al operador',
      operator
    });
  } catch (error) {
    next(error);
  }
});

export default router;
