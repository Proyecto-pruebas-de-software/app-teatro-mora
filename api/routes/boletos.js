const express = require('express');
const router = express.Router();
const Response = require('../models/response');
const { verifyToken } = require('../middleware/auth');
const boletosQueries = require('../queries/queries_boletos');
const colaQueries = require('../queries/queries_colavirtual');

// Rutas públicas
// Obtener todos los boletos
router.get('/', async (req, res, next) => {
    const response = new Response();
    try {
        const tickets = await boletosQueries.getBoletos();
        return res.status(200).json(response.success(200, "Boletos obtenidos exitosamente", tickets));
    } catch (error) {
        console.error('Error en ruta GET /api/boletos:', error);
        next(error);
    }
});

// Obtener boleto por ID
router.get('/:id', async (req, res, next) => {
    const response = new Response();
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        const error = new Error("ID debe ser un número válido");
        error.statusCode = 400;
        return next(error);
    }

    try {
        const ticket = await boletosQueries.getBoletoById(id);
        if (!ticket) {
            const error = new Error("Boleto no encontrado");
            error.statusCode = 404;
            return next(error);
        }
        return res.status(200).json(response.success(200, "Boleto obtenido exitosamente", ticket));
    } catch (error) {
        console.error('Error en ruta GET /api/boletos/:id:', error);
        next(error);
    }
});

// Rutas protegidas (requieren autenticación)
// Crear nuevo boleto
router.post('/', verifyToken, async (req, res, next) => {
    const response = new Response();
    const { usuario_id, evento_id, asiento, turno_numero, fue_usado } = req.body;

    // Validaciones básicas
    if (!usuario_id || !evento_id || !asiento) {
        const error = new Error("Faltan campos requeridos: usuario_id, evento_id o asiento");
        error.statusCode = 400;
        return next(error);
    }
    if (!boletosQueries.validateAsiento(asiento)) {
        const error = new Error("Asiento inválido (formato: Letra seguida de 1-3 dígitos, max 10 caracteres)");
        error.statusCode = 400;
        return next(error);
    }
    if (typeof fue_usado !== 'undefined' && !boletosQueries.validateEstadoUso(fue_usado)) {
        const error = new Error("El estado de uso debe ser un booleano");
        error.statusCode = 400;
        return next(error);
    }

    try {
        // Validar claves foráneas
        const fkValidas = await boletosQueries.validateForeignKeys(usuario_id, evento_id);
        if (!fkValidas) {
            const error = new Error("Usuario o evento no existen");
            error.statusCode = 404;
            return next(error);
        }

        // Verificar si el asiento está disponible para el evento
        const asientoDisponible = await boletosQueries.checkAsientoDisponible(evento_id, asiento);
        if (!asientoDisponible) {
            const error = new Error("El asiento ya está ocupado para este evento");
            error.statusCode = 409;
            return next(error);
        }

        const newTicket = await boletosQueries.createBoleto({ usuario_id, evento_id, asiento, turno_numero, fue_usado });
        return res.status(201).json(response.success(201, "Boleto creado exitosamente", newTicket));
    } catch (error) {
        console.error('Error en ruta POST /api/boletos:', error);
        next(error);
    }
});

// Nueva ruta: Comprar múltiples boletos para un evento
router.post('/comprar', verifyToken, async (req, res, next) => {
    const response = new Response();
    const { eventoId, cantidad } = req.body;
    const usuario_id = req.user.id; // Obtener el ID de usuario del token autenticado

    // Validaciones
    if (!eventoId || !cantidad) {
        const error = new Error("Faltan campos requeridos: eventoId y cantidad");
        error.statusCode = 400;
        return next(error);
    }
    const parsedEventoId = parseInt(eventoId);
    const parsedCantidad = parseInt(cantidad);

    if (isNaN(parsedEventoId) || parsedEventoId <= 0) {
        const error = new Error("ID de evento inválido");
        error.statusCode = 400;
        return next(error);
    }
    if (isNaN(parsedCantidad) || parsedCantidad <= 0 || parsedCantidad > 4) {
        const error = new Error("Cantidad de boletos inválida (debe ser entre 1 y 4)");
        error.statusCode = 400;
        return next(error);
    }

    try {
        // 1. Verificar el estado de la cola del usuario
        const queueStatus = await colaQueries.getQueueStatusForUser(usuario_id, parsedEventoId);

        if (!queueStatus || queueStatus.status !== 'in_turn') {
            const error = new Error("No es tu turno para comprar boletos o no estás en la cola.");
            error.statusCode = 403; // Prohibido
            return next(error);
        }

        const turno_numero = queueStatus.turno_numero;

        const result = await boletosQueries.purchaseTickets({
            usuario_id: usuario_id,
            evento_id: parsedEventoId,
            cantidad: parsedCantidad,
            turno_numero: turno_numero // Pasar turno_numero a la función de compra
        });

        return res.status(200).json(response.success(200, result.message, { compraId: result.compraId }));
    } catch (error) {
        console.error('Error en ruta POST /api/boletos/comprar:', error);
        // Los errores personalizados de queries_boletos.js tendrán sus mensajes
        if (error.message.includes("disponibles")) {
            error.statusCode = 400; // Bad request para boletos insuficientes
        } else if (error.message.includes("Evento no encontrado")) {
            error.statusCode = 404; // No encontrado si el evento no existe
        }
        next(error);
    }
});

// Actualizar boleto existente
router.put('/:id', verifyToken, async (req, res, next) => {
    const response = new Response();
    const id = parseInt(req.params.id);
    const { usuario_id, evento_id, asiento, turno_numero, fue_usado } = req.body;

    if (isNaN(id)) {
        const error = new Error("ID debe ser un número válido");
        error.statusCode = 400;
        return next(error);
    }

    // Validaciones para los campos que se están actualizando
    if (asiento && !boletosQueries.validateAsiento(asiento)) {
        const error = new Error("Asiento inválido (formato: Letra seguida de 1-3 dígitos, max 10 caracteres)");
        error.statusCode = 400;
        return next(error);
    }
    if (typeof fue_usado !== 'undefined' && !boletosQueries.validateEstadoUso(fue_usado)) {
        const error = new Error("El estado de uso debe ser un booleano");
        error.statusCode = 400;
        return next(error);
    }

    try {
        // Si se proporcionan usuario_id o evento_id, validar claves foráneas
        if (usuario_id || evento_id) {
            const currentTicket = await boletosQueries.getBoletoById(id);
            if (!currentTicket) {
                const error = new Error("Boleto no encontrado para actualizar");
                error.statusCode = 404;
                return next(error);
            }
            const resolvedUsuarioId = usuario_id || currentTicket.usuario_id;
            const resolvedEventoId = evento_id || currentTicket.evento_id;
            const fkValidas = await boletosQueries.validateForeignKeys(resolvedUsuarioId, resolvedEventoId);
            if (!fkValidas) {
                const error = new Error("Usuario o evento no existen para la actualización");
                error.statusCode = 404;
                return next(error);
            }
        }

        // Verificar si el asiento está disponible si se está actualizando
        if (asiento) {
            const asientoDisponible = await boletosQueries.checkAsientoDisponible(evento_id, asiento, id);
            if (!asientoDisponible) {
                const error = new Error("El asiento ya está ocupado para este evento");
                error.statusCode = 409;
                return next(error);
            }
        }

        const updatedTicket = await boletosQueries.updateBoleto(id, { usuario_id, evento_id, asiento, turno_numero, fue_usado });
        return res.status(200).json(response.success(200, "Boleto actualizado exitosamente", updatedTicket));
    } catch (error) {
        console.error('Error en ruta PUT /api/boletos/:id:', error);
        next(error);
    }
});

// Eliminar boleto
router.delete('/:id', verifyToken, async (req, res, next) => {
    const response = new Response();
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        const error = new Error("ID debe ser un número válido");
        error.statusCode = 400;
        return next(error);
    }

    try {
        await boletosQueries.deleteBoleto(id);
        return res.status(200).json(response.success(200, "Boleto eliminado exitosamente"));
    } catch (error) {
        console.error('Error en ruta DELETE /api/boletos/:id:', error);
        next(error);
    }
});

module.exports = router; 