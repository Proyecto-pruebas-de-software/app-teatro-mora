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
const validateMensaje = (mensaje) => {
    return mensaje && mensaje.length >= 5 && mensaje.length <= 500;
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

// CRUD MensajesForo
const getMensajesForo = async (evento_id = null, parent_id = null) => {
    try {
        let query;
        let params = [];

        if (parent_id !== null) {
            // Fetch replies for a specific parent message
            query = `
                SELECT m.id, m.mensaje, m.creado_en,
                       u.id as usuario_id, u.nombre as usuario_nombre,
                       e.id as evento_id, e.nombre as evento_nombre,
                       m.parent_mensaje_id
                FROM mensajes_foro m
                JOIN usuarios u ON m.usuario_id = u.id
                LEFT JOIN eventos e ON m.evento_id = e.id
                WHERE m.parent_mensaje_id = $1
                ORDER BY m.creado_en ASC
            `;
            params.push(parent_id);
        } else if (evento_id !== null) {
            // Fetch top-level messages for a specific event
            query = `
                WITH RECURSIVE ThreadMessages AS (
                    -- Anchor member: Select top-level messages for the event
                    SELECT
                        id,
                        mensaje,
                        creado_en,
                        usuario_id,
                        evento_id,
                        parent_mensaje_id,
                        id AS top_level_id -- This identifies the root of each thread
                    FROM
                        mensajes_foro
                    WHERE
                        evento_id = $1 AND parent_mensaje_id IS NULL

                    UNION ALL

                    -- Recursive member: Select replies
                    SELECT
                        m.id,
                        m.mensaje,
                        m.creado_en,
                        m.usuario_id,
                        m.evento_id,
                        m.parent_mensaje_id,
                        tm.top_level_id
                    FROM
                        mensajes_foro m
                    JOIN
                        ThreadMessages tm ON m.parent_mensaje_id = tm.id
                )
                SELECT
                    m.id,
                    m.mensaje,
                    m.creado_en,
                    u.id AS usuario_id,
                    u.nombre AS usuario_nombre,
                    e.id AS evento_id,
                    e.nombre AS evento_nombre,
                    m.parent_mensaje_id,
                    (SELECT COUNT(*) FROM ThreadMessages tm_replies WHERE tm_replies.top_level_id = m.id AND tm_replies.id != m.id) AS replies_count,
                    (SELECT MAX(creado_en) FROM ThreadMessages tm_all WHERE tm_all.top_level_id = m.id) AS last_post_date
                FROM
                    mensajes_foro m
                JOIN
                    usuarios u ON m.usuario_id = u.id
                LEFT JOIN
                    eventos e ON m.evento_id = e.id
                WHERE
                    m.evento_id = $1 AND m.parent_mensaje_id IS NULL
                ORDER BY
                    last_post_date DESC;
            `;
            params.push(evento_id);
        } else {
            // Fetch general forum messages (top 20 top-level messages)
            query = `
                SELECT m.id, m.mensaje, m.creado_en,
                       u.id as usuario_id, u.nombre as usuario_nombre,
                       e.id as evento_id, e.nombre as evento_nombre,
                       m.parent_mensaje_id,
                       (SELECT COUNT(*) FROM mensajes_foro WHERE parent_mensaje_id = m.id) AS replies_count,
                       m.creado_en AS last_post_date
                FROM mensajes_foro m
                JOIN usuarios u ON m.usuario_id = u.id
                LEFT JOIN eventos e ON m.evento_id = e.id
                WHERE m.parent_mensaje_id IS NULL
                ORDER BY m.creado_en DESC
                LIMIT 20
            `;
        }

        const results = await pool.query(query, params);
        return results.rows;
    } catch (error) {
        console.error('Error en getMensajesForo:', error);
        throw error;
    }
};

const getMensajeForoById = async (id) => {
    try {
        const query = `
            SELECT m.id, m.mensaje, m.creado_en,
                   u.id as usuario_id, u.nombre as usuario_nombre,
                   e.id as evento_id, e.nombre as evento_nombre
            FROM mensajes_foro m
            JOIN usuarios u ON m.usuario_id = u.id
            LEFT JOIN eventos e ON m.evento_id = e.id
            WHERE m.id = $1
        `;
        const results = await pool.query(query, [id]);

        if (results.rows.length === 0) {
            return null; // Not found
        }

        return results.rows[0];
    } catch (error) {
        console.error('Error en getMensajeForoById:', error);
        throw error;
    }
};

const createMensajeForo = async ({ usuario_id, evento_id, mensaje, parent_mensaje_id }) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const query = `
            INSERT INTO mensajes_foro 
                (usuario_id, evento_id, mensaje, parent_mensaje_id) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id, usuario_id, evento_id, mensaje, parent_mensaje_id, creado_en
        `;
        const results = await client.query(query, [
            usuario_id, 
            evento_id, 
            mensaje, 
            parent_mensaje_id || null
        ]);

        await client.query('COMMIT');
        
        return results.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en createMensajeForo:', error);
        throw error;
    } finally {
        client.release();
    }
};

const updateMensajeForo = async (id, { mensaje }) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const mensajeExistente = await pool.query(
            'SELECT id FROM mensajes_foro WHERE id = $1',
            [id]
        );

        if (mensajeExistente.rows.length === 0) {
            throw new Error("Mensaje de foro no encontrado");
        }

        const query = `
            UPDATE mensajes_foro 
            SET mensaje = $1
            WHERE id = $2
            RETURNING id, mensaje, creado_en
        `;
        const results = await client.query(query, [
            mensaje,
            id
        ]);

        await client.query('COMMIT');
        
        return results.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en updateMensajeForo:', error);
        throw error;
    } finally {
        client.release();
    }
};

const deleteMensajeForo = async (id) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const mensajeExistente = await pool.query(
            'SELECT id FROM mensajes_foro WHERE id = $1',
            [id]
        );

        if (mensajeExistente.rows.length === 0) {
            throw new Error("Mensaje de foro no encontrado");
        }

        const { rowCount } = await client.query(
            'DELETE FROM mensajes_foro WHERE id = $1',
            [id]
        );

        await client.query('COMMIT');

        return rowCount > 0;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en deleteMensajeForo:', error);
        throw error;
    } finally {
        client.release();
    }
};

const reportarMensaje = async (messageId, usuario_id, motivo) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Optional: Check if message exists
        const messageExists = await pool.query('SELECT id FROM mensajes_foro WHERE id = $1', [messageId]);
        if (messageExists.rows.length === 0) {
            throw new Error("Mensaje a reportar no encontrado");
        }

        // Optional: Check if user exists
        const userExists = await pool.query('SELECT id FROM usuarios WHERE id = $1', [usuario_id]);
        if (userExists.rows.length === 0) {
            throw new Error("Usuario que reporta no encontrado");
        }

        const query = `
            INSERT INTO reportes_mensajes (mensaje_id, usuario_id, motivo) 
            VALUES ($1, $2, $3) RETURNING id, mensaje_id, usuario_id, motivo, fecha
        `;
        const results = await client.query(query, [messageId, usuario_id, motivo]);

        await client.query('COMMIT');

        return results.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en reportarMensaje:', error);
        throw error;
    } finally {
        client.release();
    }
};

const checkMessageOwnership = async (messageId, userId, userRole) => {
    try {
        if (userRole === 'admin') return true;

        const result = await pool.query(
            'SELECT usuario_id FROM mensajes_foro WHERE id = $1',
            [messageId]
        );

        if (result.rows.length === 0) return false;

        return result.rows[0].usuario_id === userId;
    } catch (error) {
        console.error('Error al verificar propiedad del mensaje:', error);
        throw error;
    }
};

const clearMensajesForoForTesting = async () => {
    if (process.env.NODE_ENV !== 'test') return;

    try {
        await pool.query("DELETE FROM mensajes_foro WHERE mensaje LIKE '%test%'");
    } catch (error) {
        console.error('Error al limpiar mensajes de foro para testing:', error);
        throw error;
    }
};

module.exports = {
    getMensajesForo,
    getMensajeForoById,
    createMensajeForo,
    updateMensajeForo,
    deleteMensajeForo,
    reportarMensaje,
    validateMensaje,
    validateForeignKeys,
    checkMessageOwnership,
    clearMensajesForoForTesting,
    pool
};