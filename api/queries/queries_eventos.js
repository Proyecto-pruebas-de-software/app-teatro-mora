const { Pool } = require('pg');
const Response = require("../models/response");

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'teatro_mora_virtual',
    password: 'vicente',
    port: 5432,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

// Helpers de validación
const validateNombre = (nombre) => {
    return nombre && nombre.length <= 100 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\.,:;!?()'"¿¡]+$/.test(nombre);
};

const validateDescripcion = (descripcion) => {
    return !descripcion || descripcion.length <= 2000; // Opcional
};

const validateFecha = (fecha) => {
    try {
        const fechaObj = new Date(fecha);
        return !isNaN(fechaObj.getTime()) && fechaObj >= new Date();
    } catch {
        return false;
    }
};

const validateCreador = async (creador_id) => {
    if (!creador_id) return true; // Opcional
    
    try {
        const result = await pool.query(
            'SELECT id FROM usuarios WHERE id = $1',
            [creador_id]
        );
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error validando creador:', error);
        return false;
    }
};

const checkEventoUnico = async (nombre, fecha, eventoId = null) => {
    try {
        let query = 'SELECT id FROM eventos WHERE nombre = $1 AND fecha = $2';
        const params = [nombre, fecha];
        
        if (eventoId) {
            query += ' AND id != $3';
            params.push(eventoId);
        }
        
        const result = await pool.query(query, params);
        return result.rows.length === 0;
    } catch (error) {
        console.error('Error verificando evento único:', error);
        return false;
    }
};

// CRUD Eventos
const getEventos = async (req, res) => {
    const response = new Response();
    try {
        const query = `
            SELECT e.id, e.nombre, e.descripcion, e.fecha, 
                   e.creada_por, u.nombre as creador_nombre,
                   COUNT(b.id) as boletos_vendidos
            FROM eventos e
            LEFT JOIN usuarios u ON e.creada_por = u.id
            LEFT JOIN boletos b ON e.id = b.evento_id
            GROUP BY e.id, u.nombre
            ORDER BY e.fecha ASC
        `;
        const results = await pool.query(query);
        
        return res.status(200).json(response.success(200, "Eventos obtenidos exitosamente", results.rows));
    } catch (error) {
        console.error('Error en getEventos:', error);
        return res.status(500).json(response.failure(500, "Error al obtener eventos"));
    }
};

const getEventoById = async (req, res) => {
    const response = new Response();
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json(response.failure(400, "ID debe ser un número válido"));
    }

    try {
        const query = `
            SELECT e.id, e.nombre, e.descripcion, e.fecha, 
                   e.creada_por, u.nombre as creador_nombre
            FROM eventos e
            LEFT JOIN usuarios u ON e.creada_por = u.id
            WHERE e.id = $1
        `;
        const results = await pool.query(query, [id]);

        if (results.rows.length === 0) {
            return res.status(404).json(response.failure(404, "Evento no encontrado"));
        }

        return res.status(200).json(response.success(200, "Evento obtenido exitosamente", results.rows[0]));
    } catch (error) {
        console.error('Error en getEventoById:', error);
        return res.status(500).json(response.failure(500, "Error al obtener el evento"));
    }
};

const createEvento = async (req, res) => {
    const response = new Response();
    const { nombre, descripcion, fecha, creada_por } = req.body;

    // Validaciones básicas
    if (!nombre || !fecha) {
        return res.status(400).json(response.failure(400, "Faltan campos requeridos: nombre o fecha"));
    }

    if (!validateNombre(nombre)) {
        return res.status(400).json(response.failure(400, "Nombre inválido (máx 100 caracteres, solo caracteres permitidos)"));
    }

    if (!validateDescripcion(descripcion)) {
        return res.status(400).json(response.failure(400, "Descripción demasiado larga (máx 2000 caracteres)"));
    }

    if (!validateFecha(fecha)) {
        return res.status(400).json(response.failure(400, "Fecha inválida o debe ser futura (formato YYYY-MM-DD)"));
    }

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Validar creador si se especifica
        if (creada_por && !(await validateCreador(creada_por))) {
            return res.status(404).json(response.failure(404, "Usuario creador no existe"));
        }

        // Verificar nombre único para la fecha
        const eventoUnico = await checkEventoUnico(nombre, fecha);
        if (!eventoUnico) {
            return res.status(409).json(response.failure(409, "Ya existe un evento con ese nombre en la misma fecha"));
        }

        // Crear evento
        const query = `
            INSERT INTO eventos 
                (nombre, descripcion, fecha, creada_por) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id, nombre, descripcion, fecha, creada_por
        `;
        const results = await client.query(query, [
            nombre, 
            descripcion || null, 
            fecha, 
            creada_por || null
        ]);

        await client.query('COMMIT');
        
        return res.status(201).json(response.success(201, "Evento creado exitosamente", results.rows[0]));
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en createEvento:', error);
        return res.status(500).json(response.failure(500, "Error al crear el evento"));
    } finally {
        client.release();
    }
};

const updateEvento = async (req, res) => {
    const response = new Response();
    const id = parseInt(req.params.id);
    const { nombre, descripcion, fecha, creada_por } = req.body;

    if (isNaN(id)) {
        return res.status(400).json(response.failure(400, "ID debe ser un número válido"));
    }

    // Validaciones
    if (nombre && !validateNombre(nombre)) {
        return res.status(400).json(response.failure(400, "Nombre inválido"));
    }

    if (descripcion && !validateDescripcion(descripcion)) {
        return res.status(400).json(response.failure(400, "Descripción demasiado larga"));
    }

    if (fecha && !validateFecha(fecha)) {
        return res.status(400).json(response.failure(400, "Fecha inválida o debe ser futura"));
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Verificar existencia del evento
        const eventoExistente = await client.query(
            'SELECT * FROM eventos WHERE id = $1',
            [id]
        );

        if (eventoExistente.rows.length === 0) {
            return res.status(404).json(response.failure(404, "Evento no encontrado"));
        }

        // Validar creador si se actualiza
        if (creada_por && !(await validateCreador(creada_por))) {
            return res.status(404).json(response.failure(404, "Usuario creador no existe"));
        }

        // Verificar nombre único si se actualiza
        if (nombre || fecha) {
            const nombreActual = nombre || eventoExistente.rows[0].nombre;
            const fechaActual = fecha || eventoExistente.rows[0].fecha;

            const eventoUnico = await checkEventoUnico(nombreActual, fechaActual, id);
            if (!eventoUnico) {
                return res.status(409).json(response.failure(409, "Ya existe otro evento con ese nombre en la misma fecha"));
            }
        }

        // Actualizar
        const query = `
            UPDATE eventos SET
                nombre = COALESCE($1, nombre),
                descripcion = COALESCE($2, descripcion),
                fecha = COALESCE($3, fecha),
                creada_por = COALESCE($4, creada_por)
            WHERE id = $5
            RETURNING id, nombre, descripcion, fecha, creada_por
        `;

        const results = await client.query(query, [
            nombre || null,
            descripcion || null,
            fecha || null,
            creada_por || null,
            id
        ]);

        await client.query('COMMIT');
        
        return res.status(200).json(response.success(200, "Evento actualizado exitosamente", results.rows[0]));
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en updateEvento:', error);
        return res.status(500).json(response.failure(500, "Error al actualizar el evento"));
    } finally {
        client.release();
    }
};

const deleteEvento = async (req, res) => {
    const response = new Response();
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json(response.failure(400, "ID debe ser un número válido"));
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Verificar existencia
        const eventoExistente = await client.query(
            'SELECT id FROM eventos WHERE id = $1',
            [id]
        );

        if (eventoExistente.rows.length === 0) {
            return res.status(404).json(response.failure(404, "Evento no encontrado"));
        }

        // Verificar si tiene boletos asociados
        const boletosAsociados = await client.query(
            'SELECT id FROM boletos WHERE evento_id = $1 LIMIT 1',
            [id]
        );

        if (boletosAsociados.rows.length > 0) {
            return res.status(403).json(response.failure(403, "No se puede eliminar, el evento tiene boletos asociados"));
        }

        // Eliminar
        const results = await client.query(
            'DELETE FROM eventos WHERE id = $1 RETURNING id, nombre',
            [id]
        );

        await client.query('COMMIT');
        
        return res.status(200).json(response.success(200, "Evento eliminado exitosamente", results.rows[0]));
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en deleteEvento:', error);
        return res.status(500).json(response.failure(500, "Error al eliminar el evento"));
    } finally {
        client.release();
    }
};

// Para testing - limpia la tabla de eventos
const clearEventosForTesting = async () => {
    if (process.env.NODE_ENV !== 'test') return;
    
    try {
        await pool.query("DELETE FROM eventos WHERE nombre LIKE 'Evento%'");
    } catch (error) {
        console.error('Error al limpiar eventos para testing:', error);
        throw error;
    }
};

module.exports = {
    getAll: getEventos,
    getById: getEventoById,
    create: createEvento,
    update: updateEvento,
    delete: deleteEvento,
    pool,
    clearEventosForTesting,
    _test: {
        validateNombre,
        validateDescripcion,
        validateFecha,
        validateCreador,
        checkEventoUnico
    }
};