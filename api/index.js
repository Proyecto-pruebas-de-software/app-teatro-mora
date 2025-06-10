const express = require("express");
const bodyParser = require("body-parser");
const helmet = require("helmet"); 
const rateLimit = require("express-rate-limit");
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configuración básica para testing
const isTestEnvironment = process.env.NODE_ENV === 'test';

// Configuración de rate limiting (deshabilitado para testing)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnvironment ? 0 : 100 // Desactiva límite en tests
});

// Middlewares
app.use(cors());
app.use(bodyParser.json({ limit: '10kb' }));
  app.use(helmet());
  app.use(limiter);

// Health Check simplificado
app.get("/", (req, res) => {
  res.json({
    status: "active",
    message: "API del Teatro Mora",
    version: "1.0.0"
  });
});

// Cargar rutas
const authRoutes = require('./routes/auth');
const eventosRoutes = require('./routes/eventos');
const usuariosRoutes = require('./routes/usuarios');
const actoresRoutes = require('./routes/actores');
const colaRoutes = require('./routes/cola_virtual');
const mensajesRoutes = require('./routes/mensajes');
const boletosRoutes = require('./routes/boletos');

// Configurar rutas
app.use('/api/auth', authRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/mensajes', mensajesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/actores', actoresRoutes);
app.use('/api/cola_virtual', colaRoutes);
app.use('/api/boletos', boletosRoutes);

// 404 handler (must be after all other routes and before the central error handler)
app.use((req, res) => {
  res.status(404).json({
    status: false,
    message: 'Route not found'
  });
});

// Importar y usar el manejador de errores centralizado
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Iniciar servidor solo si no es testing
if (!isTestEnvironment) {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Manejo adecuado de cierre
  process.on('SIGTERM', () => {
    server.close(() => {
      console.log('Server closed');
    });
  });
}

// Para testing, agregamos un método para cerrar conexiones
if (isTestEnvironment) {
  app.close = async () => {
    // Cierra conexiones a la base de datos si es necesario
    // Each individual query module now exports its pool, so we could explicitly end them if necessary for testing.
    // Example: if (actoresRoutes.pool) await actoresRoutes.pool.end();
    // However, it's generally handled by the process exiting.
  };
}

module.exports = app;