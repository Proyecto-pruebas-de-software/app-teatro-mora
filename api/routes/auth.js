const express = require('express');
const router = express.Router();
const Response = require('../models/response');
const { verifyToken } = require('../middleware/auth');
const usuariosQueries = require('../queries/queries_usuarios');
const jwt = require('jsonwebtoken');

// Registrar nuevo usuario
router.post('/register', async (req, res, next) => {
    const response = new Response();
    const { nombre, email, password } = req.body;

    // Validación de entrada (already handled in queries, but can also be here for earlier feedback)
    if (!nombre || !email || !password) {
        const error = new Error('Todos los campos son requeridos');
        error.statusCode = 400;
        return next(error);
    }
    if (!usuariosQueries.validateName(nombre)) {
        const error = new Error("Nombre inválido (solo letras y espacios, máx 100 caracteres)");
        error.statusCode = 400;
        return next(error);
    }
    if (!usuariosQueries.validateEmail(email)) {
        const error = new Error("Email inválido o demasiado largo (máx 100 caracteres)");
        error.statusCode = 400;
        return next(error);
    }
    if (!usuariosQueries.validatePassword(password)) {
        const error = new Error("La contraseña debe tener 8+ caracteres, 1 mayúscula, 1 número y 1 carácter especial");
        error.statusCode = 400;
        return next(error);
    }

    try {
        const newUser = await usuariosQueries.createUsuario({ nombre, email, password, rol: 'cliente' });

        // Generar JWT para el usuario recién registrado
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role }, 
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.status(200).json(response.success(200, "Registro y inicio de sesión exitoso", { token, user: newUser }));

    } catch (error) {
        console.error('Error en la ruta de registro (auth.js):', error);
        next(error);
    }
});

// Iniciar sesión de usuario
router.post('/login', async (req, res, next) => {
    const response = new Response();
    const { email, password } = req.body;

    if (!email || !password) {
        const error = new Error('Email y contraseña son requeridos');
        error.statusCode = 400;
        return next(error);
    }

    try {
        const user = await usuariosQueries.login(email, password);

        if (!user) {
            const error = new Error("Credenciales inválidas");
            error.statusCode = 401; // Unauthorized
            return next(error);
        }

        // Generar JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.status(200).json(response.success(200, "Inicio de sesión exitoso", { token, user }));

    } catch (error) {
        console.error('Error en la ruta de inicio de sesión (auth.js):', error);
        next(error);
    }
});

// Obtener usuario actual
router.get('/me', verifyToken, async (req, res, next) => {
    const response = new Response();
    try {
        const user = await usuariosQueries.getUsuarioById(req.user.id);
        if (!user) {
            const error = new Error("Usuario no encontrado.");
            error.statusCode = 404;
            return next(error);
        }
        return res.status(200).json(response.success(200, "Datos de usuario obtenidos exitosamente", user));
    } catch (error) {
        console.error('Error en la ruta /me (auth.js):', error);
        next(error);
    }
});

// Cerrar sesión (opcional - el lado del cliente puede manejar la eliminación del token)
router.post('/logout', (req, res) => {
    const response = new Response();
    return res.status(200).json(response.success(200, 'Sesión cerrada exitosamente'));
});

module.exports = router; 