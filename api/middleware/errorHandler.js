const Response = require('../models/response');

// Middleware centralizado para el manejo de errores
const errorHandler = (err, req, res, next) => {
    console.error('Error capturado por el manejador de errores central:', err);

    const response = new Response();

    // Por defecto, se establece un error 500 (Error Interno del Servidor)
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Error Interno del Servidor';

    // Manejar tipos de errores o mensajes específicos
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 400;
        message = 'Formato de ID inválido';
    } else if (err.code === '23505') { // Código de error de clave duplicada de PostgreSQL
        statusCode = 409;
        message = 'Entrada duplicada. Este registro ya existe.';
    } else if (err.message.includes("not found")) {
        statusCode = 404;
        message = err.message;
    } else if (err.message.includes("invalid") || err.message.includes("missing")) {
        statusCode = 400;
        message = err.message;
    } else if (err.message.includes("No autorizado") || err.message.includes("Forbidden")) {
        statusCode = 403;
        message = err.message;
    } else if (err.message.includes("Credenciales inválidas")) {
        statusCode = 401;
        message = err.message;
    }

    // Solo enviar detalles de error en entornos de desarrollo/prueba
    const errorResponse = process.env.NODE_ENV === 'production'
        ? response.failure(statusCode, message)
        : response.failure(statusCode, message, err.stack); // Incluir stack para depuración

    res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler; 