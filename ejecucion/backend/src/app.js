import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

// Importar rutas (se crearán a continuación)
import authRoutes from './routes/auth.js';
import operatorRoutes from './routes/operators.js';
import craneRoutes from './routes/cranes.js';
import serviceRoutes from './routes/services.js';
import inventarioRoutes from './routes/inventario.js';
import mantenimientoRoutes from './routes/mantenimiento.js';

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Ruta de diagnóstico (Health Check)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'GSP Backend API'
  });
});

// Middleware de inyección de Tenant Multiempresa simulado (simula JWT decodificado)
// En producción, esto provendría de un middleware tipo express-jwt
app.use((req, res, next) => {
  if (!req.user) {
    req.user = { id_empresa: 9 }; // Mock id_empresa
  }
  next();
});

// Registrar endpoints según especificaciones
app.use('/api/auth', authRoutes);
app.use('/api/operators', operatorRoutes);
app.use('/api/cranes', craneRoutes);
app.use('/api/services', serviceRoutes);

// Nuevos Módulos: Inventario (WMS-Lite) y Mantenimiento (OTs)
app.use('/api/inventario', inventarioRoutes);
app.use('/lg-gsp/api/inventario', inventarioRoutes);

app.use('/api/mantenimiento', mantenimientoRoutes);
app.use('/lg-gsp/api/mantenimiento', mantenimientoRoutes);


// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

export default app;
