const express = require('express');
const router = express.Router();
const Response = require('../models/response');
const { verifyToken } = require('../middleware/auth');
const mensajesForoQueries = require('../queries/queries_mensajesforo');

// Obtener todos los mensajes (foro general o por evento_id o por parent_id)
router.get('/', async (req, res, next) => {
    const response = new Response();
    const { evento_id, parent_id } = req.query;

    try {
        let messages;
        if (parent_id) {
            const parsedParentId = parseInt(parent_id);
            if (isNaN(parsedParentId)) {
                const error = new Error("Parent ID debe ser un número válido");
                error.statusCode = 400;
                return next(error);
            }
            messages = await mensajesForoQueries.getMensajesForo(null, parsedParentId);
        } else if (evento_id) {
            const parsedEventoId = parseInt(evento_id);
            if (isNaN(parsedEventoId)) {
                const error = new Error("ID de evento debe ser un número válido");
                error.statusCode = 400;
                return next(error);
            }
            messages = await mensajesForoQueries.getMensajesForo(parsedEventoId);
        } else {
            messages = await mensajesForoQueries.getMensajesForo();
        }
        return res.status(200).json(response.success(200, "Mensajes obtenidos exitosamente", messages));
    } catch (error) {
        console.error('Error en ruta GET /api/mensajes:', error);
        next(error);
    }
});

// Obtener respuestas para un mensaje específico (como parámetro de ruta)
router.get('/replies/:parent_id', async (req, res, next) => {
    const response = new Response();
    const parent_id = parseInt(req.params.parent_id);

    if (isNaN(parent_id)) {
        const error = new Error("Parent ID debe ser un número válido");
        error.statusCode = 400;
        return next(error);
    }

    try {
        const messages = await mensajesForoQueries.getMensajesForo(null, parent_id);
        return res.status(200).json(response.success(200, "Respuestas obtenidas exitosamente", messages));
    } catch (error) {
        console.error('Error en ruta GET /api/mensajes/replies/:parent_id:', error);
        next(error);
    }
});

// Obtener mensajes para un evento específico (como parámetro de ruta)
router.get('/:evento_id', async (req, res, next) => {
    const response = new Response();
    const evento_id = parseInt(req.params.evento_id);

    if (isNaN(evento_id)) {
        const error = new Error("ID de evento debe ser un número válido");
        error.statusCode = 400;
        return next(error);
    }

    try {
        const messages = await mensajesForoQueries.getMensajesForo(evento_id);
        return res.status(200).json(response.success(200, "Mensajes del evento obtenidos exitosamente", messages));
    } catch (error) {
        console.error('Error en ruta GET /api/mensajes/:evento_id:', error);
        next(error);
    }
});

// Publicar nuevo mensaje
router.post('/', verifyToken, async (req, res, next) => {
    const response = new Response();
    const { evento_id, mensaje, parent_mensaje_id } = req.body;
    const usuario_id = req.user.id;

    if (!mensaje) {
        const error = new Error("El mensaje no puede estar vacío");
        error.statusCode = 400;
        return next(error);
    }
    if (!mensajesForoQueries.validateMensaje(mensaje)) {
        const error = new Error("El mensaje debe tener entre 5 y 500 caracteres");
        error.statusCode = 400;
        return next(error);
    }

    try {
        // Validar claves foráneas a nivel de ruta
        const fkValidas = await mensajesForoQueries.validateForeignKeys(usuario_id, evento_id);
        if (!fkValidas) {
            const error = new Error("Usuario o evento no existen");
            error.statusCode = 404;
            return next(error);
        }

        const newMessage = await mensajesForoQueries.createMensajeForo({ usuario_id, evento_id, mensaje, parent_mensaje_id });
        return res.status(201).json(response.success(201, "Mensaje de foro creado exitosamente", newMessage));
    } catch (error) {
        console.error('Error en ruta POST /api/mensajes:', error);
        next(error);
    }
});

// PUT actualizar mensaje
router.put('/:id', verifyToken, async (req, res, next) => {
    const response = new Response();
    const id = parseInt(req.params.id);
    const { mensaje } = req.body;

    if (isNaN(id)) {
        const error = new Error("ID debe ser un número válido");
        error.statusCode = 400;
        return next(error);
    }

    if (!mensaje) {
        const error = new Error("El mensaje no puede estar vacío");
        error.statusCode = 400;
        return next(error);
    }
    if (!mensajesForoQueries.validateMensaje(mensaje)) {
        const error = new Error("El mensaje debe tener entre 5 y 500 caracteres");
        error.statusCode = 400;
        return next(error);
    }

    try {
        const isOwner = await mensajesForoQueries.checkMessageOwnership(id, req.user.id, req.user.role);
        if (!isOwner) {
            const error = new Error("No autorizado para actualizar este mensaje");
            error.statusCode = 403;
            return next(error);
        }

        const updatedMessage = await mensajesForoQueries.updateMensajeForo(id, { mensaje });
        return res.status(200).json(response.success(200, "Mensaje de foro actualizado exitosamente", updatedMessage));
    } catch (error) {
        console.error('Error en ruta PUT /api/mensajes/:id:', error);
        next(error);
    }
});

// Eliminar mensaje
router.delete('/:id', verifyToken, async (req, res, next) => {
    const response = new Response();
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        const error = new Error("ID debe ser un número válido");
        error.statusCode = 400;
        return next(error);
    }

    try {
        const isOwner = await mensajesForoQueries.checkMessageOwnership(id, req.user.id, req.user.role);
        if (!isOwner) {
            const error = new Error("No autorizado para eliminar este mensaje");
            error.statusCode = 403;
            return next(error);
        }

        await mensajesForoQueries.deleteMensajeForo(id);
        return res.status(200).json(response.success(200, "Mensaje de foro eliminado exitosamente"));
    } catch (error) {
        console.error('Error en ruta DELETE /api/mensajes/:id:', error);
        next(error);
    }
});

// Reportar mensaje
router.post('/reportar/:id', verifyToken, async (req, res, next) => {
    const response = new Response();
    const messageId = parseInt(req.params.id);
    const { motivo } = req.body;
    const usuario_id = req.user.id;

    if (isNaN(messageId)) {
        const error = new Error("ID de mensaje debe ser un número válido");
        error.statusCode = 400;
        return next(error);
    }

    if (!motivo) {
        const error = new Error("El motivo del reporte no puede estar vacío");
        error.statusCode = 400;
        return next(error);
    }

    try {
        await mensajesForoQueries.reportarMensaje(messageId, usuario_id, motivo);
        return res.status(200).json(response.success(200, "Mensaje reportado exitosamente"));
    } catch (error) {
        console.error('Error en ruta POST /api/mensajes/reportar/:id:', error);
        next(error);
    }
});

module.exports = router; 