const express = require('express');
const router = express.Router();
const Response = require('../models/response');
const { verifyToken } = require('../middleware/auth');
const eventosQueries = require('../queries/queries_eventos');

// Rutas públicas
// Obtener todos los eventos
router.get('/', async (req, res, next) => {
    const response = new Response();
    try {
        const events = await eventosQueries.getEventos();
        return res.status(200).json(response.success(200, "Eventos obtenidos exitosamente", events));
    } catch (error) {
        console.error('Error en ruta GET /api/eventos:', error);
        next(error); // Pasar el error al manejador centralizado
    }
});

// Obtener evento por ID
router.get('/:id', async (req, res, next) => {
    const response = new Response();
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        const error = new Error("ID debe ser un número válido");
        error.statusCode = 400;
        return next(error);
    }

    try {
        const event = await eventosQueries.getEventoById(id);
        if (!event) {
            const error = new Error("Evento no encontrado");
            error.statusCode = 404;
            return next(error);
        }
        console.log('Objeto de evento antes de enviar al frontend:', event);
        return res.status(200).json(response.success(200, "Evento obtenido exitosamente", event));
    } catch (error) {
        console.error('Error en ruta GET /api/eventos/:id:', error);
        next(error); // Pasar el error al manejador centralizado
    }
});

// Rutas protegidas (requieren autenticación)
// Crear nuevo evento
router.post('/', verifyToken, async (req, res, next) => {
    const response = new Response();
    const { nombre, descripcion, fecha, hora, precio, aforo, imagen_url, venta_inicio } = req.body;
    const creada_por = req.user.id; // Obtener el ID de usuario del token autenticado

    // Validaciones
    if (!nombre || !fecha || !hora || precio === undefined || aforo === undefined || !venta_inicio) {
        const error = new Error("Faltan campos requeridos: nombre, fecha, hora, precio, aforo o venta_inicio");
        error.statusCode = 400;
        return next(error);
    }
    if (!eventosQueries.validateNombre(nombre)) {
        const error = new Error("Nombre inválido (máx 100 caracteres, solo caracteres permitidos)");
        error.statusCode = 400;
        return next(error);
    }
    if (!eventosQueries.validateDescripcion(descripcion)) {
        const error = new Error("Descripción demasiado larga (máx 2000 caracteres)");
        error.statusCode = 400;
        return next(error);
    }
    if (!eventosQueries.validateFecha(fecha)) {
        const error = new Error("Fecha inválida (formato YYYY-MM-DD)");
        error.statusCode = 400;
        return next(error);
    }
    if (!eventosQueries.validateHora(hora)) {
        const error = new Error("Hora inválida (formato HH:MM)");
        error.statusCode = 400;
        return next(error);
    }
    if (!eventosQueries.validatePrecio(precio)) {
        const error = new Error("Precio inválido (debe ser un número positivo)");
        error.statusCode = 400;
        return next(error);
    }
    if (!eventosQueries.validateAforo(aforo)) {
        const error = new Error("Aforo inválido (debe ser un número entero positivo)");
        error.statusCode = 400;
        return next(error);
    }
    if (!eventosQueries.validateVentaInicio(venta_inicio)) {
        const error = new Error("Fecha de inicio de venta inválida");
        error.statusCode = 400;
        return next(error);
    }

    try {
        const eventDataToCreate = { nombre, descripcion, fecha, hora, precio, aforo, imagen_url, venta_inicio, creada_por };
        console.log('Datos enviados para crearEvento:', eventDataToCreate);
        const newEvent = await eventosQueries.createEvento(eventDataToCreate);
        return res.status(201).json(response.success(201, "Evento creado exitosamente", newEvent));
    } catch (error) {
        console.error('Error en ruta POST /api/eventos:', error);
        next(error); // Pasar el error al manejador centralizado
    }
});

// Actualizar evento existente
router.put('/:id', verifyToken, async (req, res, next) => {
    const response = new Response();
    const id = parseInt(req.params.id);
    const { nombre, descripcion, fecha, hora, precio, aforo, imagen_url, venta_inicio } = req.body;

    if (isNaN(id)) {
        const error = new Error("ID debe ser un número válido");
        error.statusCode = 400;
        return next(error);
    }

    // Validaciones de los campos enviados
    if (nombre && !eventosQueries.validateNombre(nombre)) {
        const error = new Error("Nombre inválido");
        error.statusCode = 400;
        return next(error);
    }
    if (descripcion && !eventosQueries.validateDescripcion(descripcion)) {
        const error = new Error("Descripción demasiado larga");
        error.statusCode = 400;
        return next(error);
    }
    if (fecha && !eventosQueries.validateFecha(fecha)) {
        const error = new Error("Fecha inválida (formato YYYY-MM-DD)");
        error.statusCode = 400;
        return next(error);
    }
    if (hora && !eventosQueries.validateHora(hora)) {
        const error = new Error("Hora inválida (formato HH:MM)");
        error.statusCode = 400;
        return next(error);
    }
    if (precio !== undefined && !eventosQueries.validatePrecio(precio)) {
        const error = new Error("Precio inválido (debe ser un número positivo)");
        error.statusCode = 400;
        return next(error);
    }
    if (aforo !== undefined && !eventosQueries.validateAforo(aforo)) {
        const error = new Error("Aforo inválido (debe ser un número entero positivo)");
        error.statusCode = 400;
        return next(error);
    }
    if (venta_inicio && !eventosQueries.validateVentaInicio(venta_inicio)) {
        const error = new Error("Fecha de inicio de venta inválida");
        error.statusCode = 400;
        return next(error);
    }

    try {
        const updatedEvent = await eventosQueries.updateEvento(id, { nombre, descripcion, fecha, hora, precio, aforo, imagen_url, venta_inicio });
        return res.status(200).json(response.success(200, "Evento actualizado exitosamente", updatedEvent));
    } catch (error) {
        console.error('Error en ruta PUT /api/eventos/:id:', error);
        next(error); // Pasar el error al manejador centralizado
    }
});

// Eliminar evento
router.delete('/:id', verifyToken, async (req, res, next) => {
    const response = new Response();
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        const error = new Error("ID debe ser un número válido");
        error.statusCode = 400;
        return next(error);
    }

    try {
        await eventosQueries.deleteEvento(id);
        return res.status(200).json(response.success(200, "Evento eliminado exitosamente"));
    } catch (error) {
        console.error('Error en ruta DELETE /api/eventos/:id:', error);
        next(error); // Pasar el error al manejador centralizado
    }
});

module.exports = router; 