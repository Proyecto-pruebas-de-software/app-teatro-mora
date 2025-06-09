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
const routes = {
  auth: require('./routes/auth'),
  eventos: require('./routes/eventos'),
  usuarios: require('./queries/queries_usuarios'),
  actores: require('./queries/queries_actores'),
  cola: require('./queries/queries_colavirtual'),
  mensajes: require('./routes/mensajes'),
  boletos: require('./queries/queries_boletos')
};

// Configurar rutas
app.use('/api/auth', routes.auth);
app.use('/api/eventos', routes.eventos);
app.use('/api/usuarios', routes.usuarios);
app.use('/api/actores', routes.actores);
app.use('/api/cola', routes.cola);
app.use('/api/mensajes', routes.mensajes);
app.use('/api/boletos', routes.boletos);

const setupRoutes = (app, prefix, router) => {
  if (!router || prefix === 'auth') return;
  
  // Verificación de métodos antes de asignar rutas
  if (router.getAll) app.get(`/api/${prefix}`, router.getAll);
  if (router.getById) app.get(`/api/${prefix}/:id`, router.getById);
  if (router.create) app.post(`/api/${prefix}`, router.create);
  if (router.update) app.put(`/api/${prefix}/:id`, router.update);
  if (router.delete) app.delete(`/api/${prefix}/:id`, router.delete);
  
  // Para debugging - verifica que las rutas se registren
  if (isTestEnvironment) {
    console.log(`Rutas registradas para /api/${prefix}:`);
    if (router.getAll) console.log(`  GET /api/${prefix}`);
    if (router.getById) console.log(`  GET /api/${prefix}/:id`);
    if (router.create) console.log(`  POST /api/${prefix}`);
    if (router.update) console.log(`  PUT /api/${prefix}/:id`);
    if (router.delete) console.log(`  DELETE /api/${prefix}/:id`);
  }
};

// Asignación segura de rutas
Object.entries(routes).forEach(([name, router]) => {
  if (router) setupRoutes(app, name, router);
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
  res.status(500).json({
    status: false,
    message: 'Something went wrong!',
    error: isTestEnvironment ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: false,
    message: 'Route not found'
  });
});

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
    if (routes.actores && routes.actores.pool) {
      await routes.actores.pool.end();
    }
    // Agrega cierre para otros pools si existen
  };
}

module.exports = app;