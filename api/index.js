const express = require("express");
const bodyParser = require("body-parser");
const helmet = require("helmet"); 
const rateLimit = require("express-rate-limit");

const app = express();
const port = process.env.PORT || 3000;

// Configuración básica para testing
const isTestEnvironment = process.env.NODE_ENV === 'test';


// Configuración de rate limiting (deshabilitado para testing)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnvironment ? 0 : 100 // Desactiva límite en tests
});

// Middlewares (solo los esenciales para testing)
app.use(bodyParser.json({ limit: '10kb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10kb' }));

if (!isTestEnvironment) {
  app.use(helmet());
  app.use(limiter);
}

// Health Check simplificado
app.get("/", (req, res) => {
  res.json({
    status: "active",
    message: "API del Teatro Mora",
    version: "1.0.0"
  });
});

// Cargar rutas (siempre, incluyendo testing)
const routes = {
  usuarios: require('./queries/queries_usuarios'),
  actores: require('./queries/queries_actores'),
  eventos: require('./queries/queries_eventos'),
  cola: require('./queries/queries_colavirtual'),
  mensajes: require('./queries/queries_mensajesforo'),
  boletos: require('./queries/queries_boletos')
};

const setupRoutes = (app, prefix, router) => {
  if (!router) return;
  
  // Verificación de métodos antes de asignar rutas
  if (router.getAll) app.get(`/${prefix}`, router.getAll);
  if (router.getById) app.get(`/${prefix}/:id`, router.getById);
  if (router.create) app.post(`/${prefix}`, router.create);
  if (router.update) app.put(`/${prefix}/:id`, router.update);
  if (router.delete) app.delete(`/${prefix}/:id`, router.delete);
  
  // Para debugging - verifica que las rutas se registren
  if (isTestEnvironment) {
    console.log(`Rutas registradas para /${prefix}:`);
    if (router.getAll) console.log(`  GET /${prefix}`);
    if (router.getById) console.log(`  GET /${prefix}/:id`);
    if (router.create) console.log(`  POST /${prefix}`);
    if (router.update) console.log(`  PUT /${prefix}/:id`);
    if (router.delete) console.log(`  DELETE /${prefix}/:id`);
  }
};

// Asignación segura de rutas
Object.entries(routes).forEach(([name, router]) => {
  if (router) setupRoutes(app, name, router);
});

// Manejador de errores mejorado
app.use((err, req, res, next) => {
  if (!isTestEnvironment) {
    console.error(err.stack);
  }
  res.status(err.status || 500).json({
    status: false,
    code: err.status || 500,
    message: err.message || 'Error interno del servidor',
    error: isTestEnvironment ? undefined : err.stack
  });
});

// Ruta 404 (personalizada para testing)
app.use((req, res) => {
  const message = isTestEnvironment 
    ? `Ruta no encontrada: ${req.method} ${req.originalUrl}`
    : 'Ruta no encontrada';
  
  res.status(404).json({
    status: false,
    code: 404,
    message: message
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
    const closePool = async (mod) => {
      if (mod && mod.pool && typeof mod.pool.end === 'function') {
        try {
          await mod.pool.end();
        } catch (e) {
          console.error(`Error cerrando pool de ${mod}:`, e);
        }
      }
    };

    await Promise.all([
      closePool(routes.actores),
      closePool(routes.boletos),
      closePool(routes.usuarios),
      closePool(routes.eventos),
      closePool(routes.mensajes),
      closePool(routes.cola)
    ]);
  };
}


module.exports = app;
