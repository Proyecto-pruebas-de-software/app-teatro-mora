const express = require("express");
const bodyParser = require("body-parser");
const helmet = require("helmet"); 
const rateLimit = require("express-rate-limit");

const app = express();
const port = process.env.PORT || 3000;

const isTestEnvironment = process.env.NODE_ENV === 'test';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnvironment ? 0 : 100
});

// Middlewares
app.use(bodyParser.json({ limit: '10kb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10kb' }));

if (!isTestEnvironment) {
  app.use(helmet());
  app.use(limiter);
}

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "active",
    message: "API del Teatro Mora",
    version: "1.0.0"
  });
});

// Rutas
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
  if (router.getAll) app.get(`/${prefix}`, router.getAll);
  if (router.getById) app.get(`/${prefix}/:id`, router.getById);
  if (router.create) app.post(`/${prefix}`, router.create);
  if (router.update) app.put(`/${prefix}/:id`, router.update);
  if (router.delete) app.delete(`/${prefix}/:id`, router.delete);

  if (isTestEnvironment) {
    console.log(`Rutas registradas para /${prefix}:`);
    if (router.getAll) console.log(`  GET /${prefix}`);
    if (router.getById) console.log(`  GET /${prefix}/:id`);
    if (router.create) console.log(`  POST /${prefix}`);
    if (router.update) console.log(`  PUT /${prefix}/:id`);
    if (router.delete) console.log(`  DELETE /${prefix}/:id`);
  }
};

Object.entries(routes).forEach(([name, router]) => {
  setupRoutes(app, name, router);
});

// Manejo de errores
app.use((err, req, res, next) => {
  if (!isTestEnvironment) console.error(err.stack);
  res.status(err.status || 500).json({
    status: false,
    code: err.status || 500,
    message: err.message || 'Error interno del servidor',
    error: isTestEnvironment ? undefined : err.stack
  });
});

// 404 personalizada
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

// Servidor y manejo de cierre
let server = null;

if (!isTestEnvironment) {
  server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  process.on('SIGTERM', () => {
    server.close(() => {
      console.log('Server closed');
    });
  });
}

// Método de cierre también en testing
app.close = async () => {
  const closePool = async (mod) => {
    if (mod?.pool?.end) {
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

  if (server) {
    await new Promise(resolve => server.close(resolve));
    console.log("Servidor cerrado correctamente.");
  }
};

module.exports = { app, server };
