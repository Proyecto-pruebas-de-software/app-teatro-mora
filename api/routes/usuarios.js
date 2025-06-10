const express = require('express');
const router = express.Router();
const Response = require('../models/response');
const usuariosQueries = require('../queries/queries_usuarios'); // Importar las consultas refactorizadas
const { verifyToken } = require('../middleware/auth'); // Asumiendo que la autorización podría ser necesaria aquí

// Rutas públicas (aunque la mayoría están protegidas para usuarios)
// Obtener todos los usuarios
router.get('/', verifyToken, async (req, res, next) => {
    const response = new Response();
    try {
        const users = await usuariosQueries.getUsuarios(); // Llamar a la función de consulta refactorizada
        return res.status(200).json(response.success(200, "Usuarios obtenidos exitosamente", users));
    } catch (error) {
        console.error('Error en ruta GET /api/usuarios:', error);
        next(error);
    }
});

// Obtener usuario por ID
router.get('/:id', verifyToken, async (req, res, next) => {
    const response = new Response();
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        const error = new Error("ID debe ser un número válido");
        error.statusCode = 400;
        return next(error);
    }

    try {
        const user = await usuariosQueries.getUsuarioById(id);
        if (!user) {
            const error = new Error("Usuario no encontrado");
            error.statusCode = 404;
            return next(error);
        }
        return res.status(200).json(response.success(200, "Usuario obtenido exitosamente", user));
    } catch (error) {
        console.error('Error en ruta GET /api/usuarios/:id:', error);
        next(error);
    }
});

// Rutas protegidas (requieren autenticación y posible rol de administrador)
// Crear un nuevo usuario (esta ruta es típicamente para que el administrador cree usuarios directamente, no para auto-registro)
router.post('/', verifyToken, async (req, res, next) => {
    const response = new Response();
    const { nombre, email, password, rol } = req.body; // Permitir al administrador establecer el rol

    // Validar entrada
    if (!nombre || !email || !password) {
        const error = new Error("Faltan campos requeridos: nombre, email o password");
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
        const newUser = await usuariosQueries.createUsuario({ nombre, email, password, rol: rol || 'cliente' });
        return res.status(201).json(response.success(201, "Usuario creado exitosamente", newUser));
    } catch (error) {
        console.error('Error en ruta POST /api/usuarios:', error);
        next(error);
    }
});

// Actualizar un usuario existente
router.put('/:id', verifyToken, async (req, res, next) => {
    const response = new Response();
    const id = parseInt(req.params.id);
    const { nombre, email, rol } = req.body;

    if (isNaN(id)) {
        const error = new Error("ID debe ser un número válido");
        error.statusCode = 400;
        return next(error);
    }

    // Validaciones de los campos enviados
    if (nombre && !usuariosQueries.validateName(nombre)) {
        const error = new Error("Nombre inválido");
        error.statusCode = 400;
        return next(error);
    }
    if (email && !usuariosQueries.validateEmail(email)) {
        const error = new Error("Email inválido");
        error.statusCode = 400;
        return next(error);
    }
    // Añadir validación de rol si es necesario

    try {
        const updatedUser = await usuariosQueries.updateUsuario(id, { nombre, email, rol });
        return res.status(200).json(response.success(200, "Usuario actualizado exitosamente", updatedUser));
    } catch (error) {
        console.error('Error en ruta PUT /api/usuarios/:id:', error);
        next(error);
    }
});

// Eliminar un usuario
router.delete('/:id', verifyToken, async (req, res, next) => {
    const response = new Response();
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        const error = new Error("ID debe ser un número válido");
        error.statusCode = 400;
        return next(error);
    }

    try {
        await usuariosQueries.deleteUsuario(id);
        return res.status(200).json(response.success(200, "Usuario eliminado exitosamente"));
    } catch (error) {
        console.error('Error en ruta DELETE /api/usuarios/:id:', error);
        next(error);
    }
});

module.exports = router; 