import dotenv from 'dotenv';
import app from './app.js';

// Cargar variables de entorno
dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 GSP Backend API ejecutándose en puerto ${PORT}`);
  console.log(`🏥 Health check disponible en http://localhost:${PORT}/api/health`);
  console.log(`=================================================`);
});
