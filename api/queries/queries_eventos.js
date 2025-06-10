const { Pool } = require('pg');
const Response = require("../models/response");

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
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
        return !isNaN(fechaObj.getTime());
    } catch {
        return false;
    }
};

const validateHora = (hora) => {
    // Basic regex for HH:MM format, assuming 24-hour format
    // Doesn't validate if time is in the future relative to date, that's done at route level
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(hora);
};

const validatePrecio = (precio) => {
    return typeof precio === 'number' && precio >= 0;
};

const validateAforo = (aforo) => {
    return Number.isInteger(aforo) && aforo > 0;
};

const validateVentaInicio = (venta_inicio) => {
    try {
        const fechaObj = new Date(venta_inicio);
        return !isNaN(fechaObj.getTime());
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
        throw error;
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
        throw error;
    }
};

// CRUD Eventos
const getEventos = async () => {
    try {
        const query = `
            SELECT 
                e.id, 
                e.nombre, 
                e.descripcion, 
                e.fecha,
                e.hora,
                e.precio,
                e.aforo,
                e.imagen_url, 
                e.venta_inicio,
                e.creada_por, 
                u.nombre as creador_nombre
            FROM eventos e
            LEFT JOIN usuarios u ON e.creada_por = u.id
            ORDER BY e.fecha ASC
        `;
        const results = await pool.query(query);
        
        return results.rows;
    } catch (error) {
        console.error('Error en getEventos:', error);
        throw error;
    }
};

const getEventoById = async (id) => {
    try {
        const query = `
            SELECT 
                e.id, 
                e.nombre, 
                e.descripcion, 
                e.fecha,
                e.hora,
                e.precio,
                e.aforo,
                e.imagen_url, 
                e.venta_inicio,
                e.creada_por, 
                u.nombre as creador_nombre
            FROM eventos e
            LEFT JOIN usuarios u ON e.creada_por = u.id
            WHERE e.id = $1
        `;
        const results = await pool.query(query, [id]);

        if (results.rows.length === 0) {
            return null; // Evento no encontrado
        }

        return results.rows[0];
    } catch (error) {
        console.error('Error en getEventoById:', error);
        throw error;
    }
};

const createEvento = async ({ nombre, descripcion, fecha, hora, precio, aforo, imagen_url, venta_inicio, creada_por }) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Validar creador si se especifica
        if (creada_por && !(await validateCreador(creada_por))) {
            throw new Error("Usuario creador no existe");
        }

        // Verificar nombre único para la fecha y hora combinadas
        // The unique check should ideally be on name, date, and time for better uniqueness
        const eventoUnico = await checkEventoUnico(nombre, fecha);
        if (!eventoUnico) {
            throw new Error("Ya existe un evento con ese nombre en la misma fecha");
        }

        // Crear evento
        const query = `
            INSERT INTO eventos 
                (nombre, descripcion, fecha, hora, precio, aforo, imagen_url, venta_inicio, creada_por) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING id, nombre, descripcion, fecha, hora, precio, aforo, imagen_url, venta_inicio, creada_por
        `;
        const results = await client.query(query, [
            nombre, 
            descripcion || null, 
            fecha, 
            hora,
            precio,
            aforo,
            imagen_url || null,
            venta_inicio,
            creada_por || null
        ]);

        await client.query('COMMIT');
        
        return results.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en createEvento:', error);
        throw error;
    } finally {
        client.release();
    }
};

const updateEvento = async (id, { nombre, descripcion, fecha, hora, precio, aforo, creada_por, imagen_url, venta_inicio }) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Verificar existencia del evento
        const eventoExistente = await pool.query(
            'SELECT * FROM eventos WHERE id = $1',
            [id]
        );

        if (eventoExistente.rows.length === 0) {
            throw new Error("Evento no encontrado");
        }

        // Validar creador si se actualiza
        if (creada_por && !(await validateCreador(creada_por))) {
            throw new Error("Usuario creador no existe");
        }

        // Verificar nombre único si se actualiza (considerando fecha y hora si se proveen)
        if (nombre || fecha || hora) {
            const nombreActual = nombre || eventoExistente.rows[0].nombre;
            const fechaActual = fecha || eventoExistente.rows[0].fecha;
            const horaActual = hora || eventoExistente.rows[0].hora; // Use existing hour if not provided

            const eventoUnico = await checkEventoUnico(nombreActual, fechaActual, id);
            if (!eventoUnico) {
                throw new Error("Ya existe otro evento con ese nombre en la misma fecha y hora");
            }
        }

        // Actualizar
        const query = `
            UPDATE eventos 
            SET nombre = COALESCE($1, nombre),
                descripcion = COALESCE($2, descripcion),
                fecha = COALESCE($3, fecha),
                hora = COALESCE($4, hora),
                precio = COALESCE($5, precio),
                aforo = COALESCE($6, aforo),
                creada_por = COALESCE($7, creada_por),
                imagen_url = COALESCE($8, imagen_url),
                venta_inicio = COALESCE($9, venta_inicio)
            WHERE id = $10
            RETURNING id, nombre, descripcion, fecha, hora, precio, aforo, imagen_url, venta_inicio, creada_por
        `;
        const results = await client.query(query, [
            nombre || null,
            descripcion || null,
            fecha || null,
            hora || null,
            precio !== undefined ? precio : null,
            aforo !== undefined ? aforo : null,
            creada_por || null,
            imagen_url || null,
            venta_inicio || null,
            id
        ]);

        await client.query('COMMIT');
        
        return results.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en updateEvento:', error);
        throw error;
    } finally {
        client.release();
    }
};

const deleteEvento = async (id) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Verificar existencia del evento
        const eventoExistente = await pool.query(
            'SELECT id FROM eventos WHERE id = $1',
            [id]
        );

        if (eventoExistente.rows.length === 0) {
            throw new Error("Evento no encontrado");
        }

        // Verificar si tiene boletos asociados
        const boletosAsociados = await pool.query(
            'SELECT id FROM boletos WHERE evento_id = $1 LIMIT 1',
            [id]
        );

        if (boletosAsociados.rows.length > 0) {
            throw new Error("No se puede eliminar, el evento tiene boletos asociados");
        }

        // Eliminar
        const { rowCount } = await client.query(
            'DELETE FROM eventos WHERE id = $1',
            [id]
        );

        await client.query('COMMIT');
        
        return rowCount > 0; // Return true if deleted, false otherwise
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en deleteEvento:', error);
        throw error;
    } finally {
        client.release();
    }
};

const clearEventosForTesting = async () => {
    if (process.env.NODE_ENV !== 'test') return;
    
    try {
        await pool.query("DELETE FROM eventos WHERE nombre LIKE '%test%'");
    } catch (error) {
        console.error('Error al limpiar eventos para testing:', error);
        throw error;
    }
};

module.exports = {
    getEventos,
    getEventoById,
    createEvento,
    updateEvento,
    deleteEvento,
        validateNombre,
        validateDescripcion,
        validateFecha,
    validateHora,
    validatePrecio,
    validateAforo,
    validateVentaInicio,
        validateCreador,
    checkEventoUnico,
    pool,
    clearEventosForTesting
};