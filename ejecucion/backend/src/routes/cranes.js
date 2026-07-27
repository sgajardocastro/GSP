import { Router } from 'express';

const router = Router();

const mockCranes = [
  {
    id: 'crn-uuid-789',
    plateNumber: 'XX-YY-11',
    brand: 'Liebherr',
    model: 'LTM 1100',
    capacityTons: 100,
    type: 'CAMA',
    status: 'DISPONIBLE'
  },
  {
    id: 'crn-uuid-002',
    plateNumber: 'GZBC-43',
    brand: 'Liebherr',
    model: 'LTM 1250',
    capacityTons: 250,
    type: 'PLUMA',
    status: 'MANTENIMIENTO'
  }
];

// GET /api/cranes
router.get('/', (req, res, next) => {
  try {
    res.status(200).json(mockCranes);
  } catch (error) {
    next(error);
  }
});

export default router;
