const jwt = require('jsonwebtoken');
const Response = require('../models/response');

// Middleware para verificar el token de autenticación
const verifyToken = (req, res, next) => {
    // Obtener el encabezado de autorización
    const authHeader = req.headers['authorization'];
    // Extraer el token del encabezado (formato: Bearer TOKEN)
    const token = authHeader && authHeader.split(' ')[1];

    // Si no hay token, devolver un error 401
    if (!token) {
        return res.status(401).json(new Response().failure(401, 'Token no encontrado'));
    }

    try {
        // Verificar el token usando la clave secreta JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Adjuntar la información del usuario decodificada al objeto de solicitud
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };
        // Continuar con la siguiente función middleware o ruta
        next();
    } catch (error) {
        // Si el token es inválido o ha expirado, devolver un error 403
        return res.status(403).json(new Response().failure(403, 'Token inválido o expirado'));
    }
};

module.exports = { verifyToken }; 