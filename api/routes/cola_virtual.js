const express = require('express');
const router = express.Router();
const Response = require('../models/response');
const colaQueries = require('../queries/queries_colavirtual'); // Importar las consultas refactorizadas
const { verifyToken } = require('../middleware/auth'); // Asumiendo que la autorización podría ser necesaria aquí

// Rutas públicas
// Obtener todos los registros de cola virtual
router.get('/', async (req, res, next) => {
    const response = new Response();
    try {
        const queueRecords = await colaQueries.getColaVirtual(); // Llamar a la función de consulta refactorizada
        return res.status(200).json(response.success(200, "Registros de cola obtenidos exitosamente", queueRecords));
    } catch (error) {
        console.error('Error en ruta GET /api/cola_virtual:', error);
        next(error);
    }
});

// Obtener registro de cola virtual por ID
router.get('/:id', async (req, res, next) => {
    const response = new Response();
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        const error = new Error("ID debe ser un número válido");
        error.statusCode = 400;
        return next(error);
    }

    try {
        const record = await colaQueries.getColaVirtualById(id);
        if (!record) {
            const error = new Error("Registro de cola no encontrado");
            error.statusCode = 404;
            return next(error);
        }
        return res.status(200).json(response.success(200, "Registro de cola obtenido exitosamente", record));
    } catch (error) {
        console.error('Error en ruta GET /api/cola_virtual/:id:', error);
        next(error);
    }
});

// Rutas protegidas (requieren autenticación)
// Crear un nuevo registro de cola virtual
router.post('/', verifyToken, async (req, res, next) => {
    const response = new Response();
    const { usuario_id, evento_id, turno_numero, en_turno = false } = req.body;

    // Validaciones
    if (!usuario_id || !evento_id || !turno_numero) {
        const error = new Error("Faltan campos requeridos: usuario_id, evento_id o turno_numero");
        error.statusCode = 400;
        return next(error);
    }
    if (!colaQueries.validateTurno(turno_numero)) {
        const error = new Error("Número de turno inválido (debe ser entero positivo)");
        error.statusCode = 400;
        return next(error);
    }
    if (typeof en_turno !== 'undefined' && !colaQueries.validateEstadoTurno(en_turno)) {
        const error = new Error("Estado de turno inválido (debe ser true o false)");
        error.statusCode = 400;
        return next(error);
    }

    try {
        // Validación de claves foráneas
        const fkValidas = await colaQueries.validateForeignKeys(usuario_id, evento_id);
        if (!fkValidas) {
            const error = new Error("Usuario o evento no existen");
            error.statusCode = 404;
            return next(error);
        }
        // Verificar turno disponible
        const turnoDisponible = await colaQueries.checkTurnoDisponible(evento_id, turno_numero);
        if (!turnoDisponible) {
            const error = new Error("El número de turno ya está en uso para este evento");
            error.statusCode = 409;
            return next(error);
        }

        const newRecord = await colaQueries.createColaVirtual({ usuario_id, evento_id, turno_numero, en_turno });
        return res.status(201).json(response.success(201, "Registro de cola creado exitosamente", newRecord));
    } catch (error) {
        console.error('Error en ruta POST /api/cola_virtual:', error);
        next(error);
    }
});

// Nueva ruta: Unirse a la cola virtual
router.post('/join', verifyToken, async (req, res, next) => {
    const response = new Response();
    const { evento_id } = req.body;
    const usuario_id = req.user.id; // ID de usuario del token autenticado

    if (!evento_id) {
        const error = new Error("ID del evento es requerido para unirse a la cola");
        error.statusCode = 400;
        return next(error);
    }

    try {
        // Validar clave foránea solo para evento_id (user_id es del token)
        const fkValida = await colaQueries.validateForeignKeys(usuario_id, evento_id);
        if (!fkValida) {
            const error = new Error("Evento no existe");
            error.statusCode = 404;
            return next(error);
        }

        const queueEntry = await colaQueries.joinQueue(usuario_id, evento_id);
        return res.status(200).json(response.success(200, "Unido a la cola exitosamente", queueEntry));
    } catch (error) {
        console.error('Error en ruta POST /api/cola_virtual/join:', error);
        next(error);
    }
});

// Nueva ruta: Obtener el estado de la cola del usuario para un evento específico
router.get('/status/:evento_id', verifyToken, async (req, res, next) => {
    const response = new Response();
    const evento_id = parseInt(req.params.evento_id);
    const usuario_id = req.user.id; // ID de usuario del token autenticado

    if (isNaN(evento_id)) {
        const error = new Error("ID de evento debe ser un número válido");
        error.statusCode = 400;
        return next(error);
    }

    try {
        const status = await colaQueries.getQueueStatusForUser(usuario_id, evento_id);
        return res.status(200).json(response.success(200, "Estado de cola obtenido exitosamente", status));
    } catch (error) {
        console.error('Error en ruta GET /api/cola_virtual/status/:evento_id:', error);
        next(error);
    }
});

// Nueva ruta: Obtener la longitud actual de la cola para un evento específico
router.get('/length/:evento_id', async (req, res, next) => {
    const response = new Response();
    const evento_id = parseInt(req.params.evento_id);

    if (isNaN(evento_id) || evento_id <= 0) {
        const error = new Error("ID de evento inválido");
        error.statusCode = 400;
        return next(error);
    }

    try {
        const queueLength = await colaQueries.getQueueLength(evento_id);
        return res.status(200).json(response.success(200, "Longitud de cola obtenida exitosamente", queueLength));
    } catch (error) {
        console.error('Error en ruta GET /api/cola_virtual/length/:evento_id:', error);
        next(error);
    }
});

// Actualizar un registro de cola virtual existente
router.put('/:id', verifyToken, async (req, res, next) => {
    const response = new Response();
    const id = parseInt(req.params.id);
    const { usuario_id, evento_id, turno_numero, en_turno } = req.body;

    if (isNaN(id)) {
        const error = new Error("ID debe ser un número válido");
        error.statusCode = 400;
        return next(error);
    }

    // Validaciones
    if (turno_numero && !colaQueries.validateTurno(turno_numero)) {
        const error = new Error("Número de turno inválido");
        error.statusCode = 400;
        return next(error);
    }
    if (en_turno !== undefined && !colaQueries.validateEstadoTurno(en_turno)) {
        const error = new Error("Estado de turno inválido");
        error.statusCode = 400;
        return next(error);
    }

    try {
        // Si se actualizan usuario_id o evento_id, validar claves foráneas
        if (usuario_id || evento_id) {
            const currentRecord = await colaQueries.getColaVirtualById(id);
            if (!currentRecord) {
                const error = new Error("Registro de cola no encontrado para actualizar");
                error.statusCode = 404;
                return next(error);
            }
            const resolvedUsuarioId = usuario_id || currentRecord.usuario_id;
            const resolvedEventoId = evento_id || currentRecord.evento_id;
            const fkValidas = await colaQueries.validateForeignKeys(resolvedUsuarioId, resolvedEventoId);
            if (!fkValidas) {
                const error = new Error("Usuario o evento no existen para la actualización");
                error.statusCode = 404;
                return next(error);
            }
        }
        // Verificar turno disponible si se actualiza turno_numero o evento_id
        if (turno_numero || evento_id) {
            const turnoDisponible = await colaQueries.checkTurnoDisponible(evento_id, turno_numero, id);
            if (!turnoDisponible) {
                const error = new Error("El número de turno ya está en uso para este evento");
                error.statusCode = 409;
                return next(error);
            }
        }

        const updatedRecord = await colaQueries.updateColaVirtual(id, { usuario_id, evento_id, turno_numero, en_turno });
        return res.status(200).json(response.success(200, "Registro de cola actualizado exitosamente", updatedRecord));
    } catch (error) {
        console.error('Error en ruta PUT /api/cola_virtual/:id:', error);
        next(error);
    }
});

// Eliminar un registro de cola virtual
router.delete('/:id', verifyToken, async (req, res, next) => {
    const response = new Response();
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        const error = new Error("ID debe ser un número válido");
        error.statusCode = 400;
        return next(error);
    }

    try {
        await colaQueries.deleteColaVirtual(id);
        return res.status(200).json(response.success(200, "Registro de cola eliminado exitosamente"));
    } catch (error) {
        console.error('Error en ruta DELETE /api/cola_virtual/:id:', error);
        next(error);
    }
});

module.exports = router; 