import { Router } from 'express';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    // Mock login para verificar flujo inicial
    if (email === 'despacho@cruassanpablo.cl' && password === 'secure_password') {
      return res.status(200).json({
        token: 'mock-jwt-token-gsp-123456',
        user: {
          id: 'usr-uuid-123',
          name: 'Juan Pérez',
          email: 'despacho@cruassanpablo.cl',
          role: 'DISPATCHER'
        }
      });
    }

    return res.status(401).json({ error: 'Credenciales inválidas' });
  } catch (error) {
    next(error);
  }
});

export default router;
