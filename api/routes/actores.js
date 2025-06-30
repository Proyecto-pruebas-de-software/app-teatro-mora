const express = require('express');
const router = express.Router();
const Response = require('../models/response');
const { verifyToken } = require('../middleware/auth');
const actoresQueries = require('../queries/queries_actores');

// Rutas públicas
// Obtener todos los actores
router.get('/', async (req, res, next) => {
    const response = new Response();
    try {
        const actors = await actoresQueries.getAllActors();
        return res.status(200).json(response.success(200, "Actores obtenidos exitosamente", actors));
    } catch (error) {
        console.error('Error en ruta GET /api/actores:', error);
        next(error);
    }
});

// Obtener actor por ID
router.get('/:id', async (req, res, next) => {
    const response = new Response();
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        const error = new Error("ID debe ser un número válido");
        error.statusCode = 400;
        return next(error);
    }

    try {
        const actor = await actoresQueries.getActorById(id);
        if (!actor) {
            const error = new Error("Actor no encontrado");
            error.statusCode = 404;
            return next(error);
        }
        return res.status(200).json(response.success(200, "Actor obtenido exitosamente", actor));
    } catch (error) {
        console.error('Error en ruta GET /api/actores/:id:', error);
        next(error);
    }
});

// Rutas protegidas (requieren autenticación)
// Crear nuevo actor
router.post('/', verifyToken, async (req, res, next) => {
    const response = new Response();
    const { nombre, biografia, foto_url } = req.body;

    // Validaciones
    if (!nombre) {
        const error = new Error("Faltan campos requeridos: nombre");
        error.statusCode = 400;
        return next(error);
    }
    if (!actoresQueries.validateName(nombre)) {
        const error = new Error("Nombre de actor inválido (máx 100 caracteres, solo letras, espacios, guiones, puntos)");
        error.statusCode = 400;
        return next(error);
    }
    if (!actoresQueries.validateBiography(biografia)) {
        const error = new Error("Biografía demasiado larga (máx 2000 caracteres)");
        error.statusCode = 400;
        return next(error);
    }
    if (!actoresQueries.validatePhotoUrl(foto_url)) {
        const error = new Error("URL de foto inválida (máx 255 caracteres, formato URL)");
        error.statusCode = 400;
        return next(error);
    }

    try {
        const newActor = await actoresQueries.createActor({ nombre, biografia, foto_url });
        return res.status(201).json(response.success(201, "Actor creado exitosamente", newActor));
    } catch (error) {
        console.error('Error en ruta POST /api/actores:', error);
        next(error);
    }
});

// Actualizar actor existente
router.put('/:id', verifyToken, async (req, res, next) => {
    const response = new Response();
    const id = parseInt(req.params.id);
    const { nombre, biografia, foto_url } = req.body;

    if (isNaN(id)) {
        const error = new Error("ID debe ser un número válido");
        error.statusCode = 400;
        return next(error);
    }

    // Validaciones de los campos enviados
    if (nombre && !actoresQueries.validateName(nombre)) {
        const error = new Error("Nombre de actor inválido");
        error.statusCode = 400;
        return next(error);
    }
    if (biografia && !actoresQueries.validateBiography(biografia)) {
        const error = new Error("Biografía demasiado larga");
        error.statusCode = 400;
        return next(error);
    }
    if (foto_url && !actoresQueries.validatePhotoUrl(foto_url)) {
        const error = new Error("URL de foto inválida");
        error.statusCode = 400;
        return next(error);
    }

    try {
        const updatedActor = await actoresQueries.updateActor(id, { nombre, biografia, foto_url });
        return res.status(200).json(response.success(200, "Actor actualizado exitosamente", updatedActor));
    } catch (error) {
        console.error('Error en ruta PUT /api/actores/:id:', error);
        next(error);
    }
});

// Eliminar actor
router.delete('/:id', verifyToken, async (req, res, next) => {
    const response = new Response();
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        const error = new Error("ID debe ser un número válido");
        error.statusCode = 400;
        return next(error);
    }

    try {
        await actoresQueries.deleteActor(id);
        return res.status(200).json(response.success(200, "Actor eliminado exitosamente"));
    } catch (error) {
        console.error('Error en ruta DELETE /api/actores/:id:', error);
        next(error);
    }
});

module.exports = router; 