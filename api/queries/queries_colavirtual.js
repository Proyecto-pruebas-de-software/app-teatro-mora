const { Pool } = require('pg');
// const Response = require("../models/response"); // Remove Response import as it's not needed in pure queries

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
const validateTurno = (turno) => {
    return Number.isInteger(turno) && turno > 0;
};

const validateEstadoTurno = (en_turno) => {
    return typeof en_turno === 'boolean';
};

const validateForeignKeys = async (usuario_id, evento_id) => {
    try {
        const [usuario, evento] = await Promise.all([
            pool.query('SELECT id FROM usuarios WHERE id = $1', [usuario_id]),
            pool.query('SELECT id FROM eventos WHERE id = $1', [evento_id])
        ]);
        return usuario.rows.length > 0 && evento.rows.length > 0;
    } catch (error) {
        console.error('Error validando claves foráneas:', error);
        throw error;
    }
};

const checkTurnoDisponible = async (evento_id, turno_numero, colaId = null) => {
    try {
        let query = 'SELECT id FROM cola_virtual WHERE evento_id = $1 AND turno_numero = $2';
        const params = [evento_id, turno_numero];
        
        if (colaId) {
            query += ' AND id != $3';
            params.push(colaId);
        }
        
        const result = await pool.query(query, params);
        return result.rows.length === 0;
    } catch (error) {
        console.error('Error verificando turno:', error);
        throw error;
    }
};

/**
 * Añade un usuario a la cola virtual para un evento.
 * Si ya está en la cola, devuelve su turno existente.
 */
const joinQueue = async (usuario_id, evento_id) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Verificar si el usuario ya está en la cola para este evento
        const existingQueueEntry = await client.query(
            'SELECT id, turno_numero, en_turno FROM cola_virtual WHERE usuario_id = $1 AND evento_id = $2',
            [usuario_id, evento_id]
        );

        if (existingQueueEntry.rows.length > 0) {
            // Ya está en la cola
            await client.query('COMMIT');
            return existingQueueEntry.rows[0];
        }

        // 2. Determinar el siguiente número de turno disponible
        const maxTurnoResult = await client.query(
            'SELECT MAX(turno_numero) as max_turno FROM cola_virtual WHERE evento_id = $1',
            [evento_id]
        );
        const nextTurno = (maxTurnoResult.rows[0].max_turno || 0) + 1;

        // 3. Insertar nuevo registro en la cola
        const insertQuery = `
            INSERT INTO cola_virtual (usuario_id, evento_id, turno_numero, en_turno)
            VALUES ($1, $2, $3, $4)
            RETURNING id, usuario_id, evento_id, turno_numero, en_turno, fecha_creacion
        `;
        const result = await client.query(insertQuery, [usuario_id, evento_id, nextTurno, false]);

        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en joinQueue:', error);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Obtiene el estado de un usuario en la cola para un evento específico.
 * Retorna 'not_in_queue', 'in_queue_waiting', 'in_turn'.
 */
const getQueueStatusForUser = async (usuario_id, evento_id) => {
    try {
        const result = await pool.query(
            'SELECT turno_numero, en_turno FROM cola_virtual WHERE usuario_id = $1 AND evento_id = $2',
            [usuario_id, evento_id]
        );

        if (result.rows.length === 0) {
            return { status: 'not_in_queue' };
        }

        const { turno_numero, en_turno } = result.rows[0];

        if (en_turno) {
            return { status: 'in_turn', turno_numero };
        } else {
            // Check if there's any active turn before this user's turn
            const activeTurnsBefore = await pool.query(
                'SELECT COUNT(*) FROM cola_virtual WHERE evento_id = $1 AND en_turno = true AND turno_numero < $2',
                [evento_id, turno_numero]
            );

            if (activeTurnsBefore.rows[0].count > 0) {
                // This means someone before them is already in turn, or they are waiting
                return { status: 'in_queue_waiting', turno_numero };
            } else {
                // If no active turns before, they should be the next in line or already in turn (handled above)
                // This condition might need refinement depending on precise queue management,
                // but for now, it means they are waiting.
                return { status: 'in_queue_waiting', turno_numero };
            }
        }
    } catch (error) {
        console.error('Error en getQueueStatusForUser:', error);
        throw error;
    }
};

/**
 * Obtiene el número de turno más bajo que no ha sido atendido (en_turno = false) para un evento.
 */
const getMinTurnoEnCola = async (evento_id) => {
    try {
        const result = await pool.query(
            'SELECT MIN(turno_numero) as min_turno FROM cola_virtual WHERE evento_id = $1 AND en_turno = false',
            [evento_id]
        );
        return result.rows[0].min_turno;
    } catch (error) {
        console.error('Error en getMinTurnoEnCola:', error);
        throw error;
    }
};

/**
 * Establece el estado 'en_turno' a true para un usuario específico en la cola.
 */
const setTurnoEnTurno = async (usuario_id, evento_id, turno_numero) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const updateQuery = `
            UPDATE cola_virtual
            SET en_turno = true
            WHERE usuario_id = $1 AND evento_id = $2 AND turno_numero = $3
            RETURNING id, usuario_id, evento_id, turno_numero, en_turno, fecha_creacion
        `;
        const result = await client.query(updateQuery, [usuario_id, evento_id, turno_numero]);

        if (result.rows.length === 0) {
            throw new Error('Registro de cola no encontrado para actualizar turno.');
        }

        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en setTurnoEnTurno:', error);
        throw error;
    } finally {
        client.release();
    }
};

// CRUD Cola Virtual
const getColaVirtual = async () => {
    try {
        const query = `
            SELECT cv.id, cv.turno_numero, cv.en_turno, cv.fecha_creacion,
                   u.id as usuario_id, u.nombre as usuario_nombre,
                   e.id as evento_id, e.nombre as evento_nombre
            FROM cola_virtual cv
            JOIN usuarios u ON cv.usuario_id = u.id
            JOIN eventos e ON cv.evento_id = e.id
            ORDER BY cv.turno_numero ASC
        `;
        const results = await pool.query(query);
        
        return results.rows;
    } catch (error) {
        console.error('Error en getColaVirtual:', error);
        throw error;
    }
};

const getColaVirtualById = async (id) => {
    try {
        const query = `
            SELECT cv.id, cv.turno_numero, cv.en_turno, cv.fecha_creacion,
                   u.id as usuario_id, u.nombre as usuario_nombre,
                   e.id as evento_id, e.nombre as evento_nombre
            FROM cola_virtual cv
            JOIN usuarios u ON cv.usuario_id = u.id
            JOIN eventos e ON cv.evento_id = e.id
            WHERE cv.id = $1
        `;
        const results = await pool.query(query, [id]);

        if (results.rows.length === 0) {
            return null; // Return null if not found
        }

        return results.rows[0];
    } catch (error) {
        console.error('Error en getColaVirtualById:', error);
        throw error;
    }
};

const createColaVirtual = async ({ usuario_id, evento_id, turno_numero, en_turno = false }) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const query = `
            INSERT INTO cola_virtual 
                (usuario_id, evento_id, turno_numero, en_turno) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id, usuario_id, evento_id, turno_numero, en_turno, fecha_creacion
        `;
        const results = await client.query(query, [
            usuario_id, 
            evento_id, 
            turno_numero, 
            en_turno
        ]);

        await client.query('COMMIT');
        
        return results.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en createColaVirtual:', error);
        throw error;
    } finally {
        client.release();
    }
};

const updateColaVirtual = async (id, { usuario_id, evento_id, turno_numero, en_turno }) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const registroExistente = await pool.query(
            'SELECT * FROM cola_virtual WHERE id = $1',
            [id]
        );

        if (registroExistente.rows.length === 0) {
            throw new Error("Registro de cola no encontrado");
        }

        const query = `
            UPDATE cola_virtual SET
                usuario_id = COALESCE($1, usuario_id),
                evento_id = COALESCE($2, evento_id),
                turno_numero = COALESCE($3, turno_numero),
                en_turno = COALESCE($4, en_turno)
            WHERE id = $5
            RETURNING id, usuario_id, evento_id, turno_numero, en_turno, fecha_creacion
        `;

        const results = await client.query(query, [
            usuario_id || null,
            evento_id || null,
            turno_numero || null,
            en_turno !== undefined ? en_turno : null,
            id
        ]);

        await client.query('COMMIT');
        
        return results.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en updateColaVirtual:', error);
        throw error;
    } finally {
        client.release();
    }
};

const deleteColaVirtual = async (id) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const registroExistente = await pool.query(
            'SELECT id FROM cola_virtual WHERE id = $1',
            [id]
        );

        if (registroExistente.rows.length === 0) {
            throw new Error("Registro de cola no encontrado");
        }

        const { rowCount } = await client.query(
            'DELETE FROM cola_virtual WHERE id = $1',
            [id]
        );

        await client.query('COMMIT');

        return rowCount > 0;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en deleteColaVirtual:', error);
        throw error;
    } finally {
        client.release();
    }
};

const clearColaVirtualForTesting = async () => {
    if (process.env.NODE_ENV !== 'test') return;
    
    try {
        await pool.query("DELETE FROM cola_virtual");
    } catch (error) {
        console.error('Error al limpiar cola virtual para testing:', error);
        throw error;
    }
};

/**
 * Obtiene la longitud actual de la cola virtual para un evento específico.
 */
const getQueueLength = async (evento_id) => {
    try {
        const result = await pool.query(
            'SELECT COUNT(*) FROM cola_virtual WHERE evento_id = $1',
            [evento_id]
        );
        return parseInt(result.rows[0].count, 10);
    } catch (error) {
        console.error('Error en getQueueLength:', error);
        throw error;
    }
};

module.exports = {
    getColaVirtual,
    getColaVirtualById,
    createColaVirtual,
    updateColaVirtual,
    deleteColaVirtual,
    validateTurno,
    validateEstadoTurno,
    validateForeignKeys,
    checkTurnoDisponible,
    joinQueue,
    getQueueStatusForUser,
    getMinTurnoEnCola,
    setTurnoEnTurno,
    clearColaVirtualForTesting,
    getQueueLength,
    pool
};