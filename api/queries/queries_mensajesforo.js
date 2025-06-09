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
        return false;
    }
};

// CRUD MensajesForo
const getMensajesForo = async (req, res) => {
    const response = new Response();
    try {
        const query = `
            SELECT m.id, m.mensaje, m.creado_en,
                   u.id as usuario_id, u.nombre as usuario_nombre,
                   e.id as evento_id, e.nombre as evento_nombre
            FROM mensajes_foro m
            JOIN usuarios u ON m.usuario_id = u.id
            JOIN eventos e ON m.evento_id = e.id
            ORDER BY m.creado_en DESC
        `;
        const results = await pool.query(query);
        
        return res.status(200).json(response.success(200, "Mensajes obtenidos exitosamente", results.rows));
    } catch (error) {
        console.error('Error en getMensajesForo:', error);
        return res.status(500).json(response.failure(500, "Error al obtener mensajes"));
    }
};

const getMensajeForoById = async (req, res) => {
    const response = new Response();
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json(response.failure(400, "ID debe ser un número válido"));
    }

    try {
        const query = `
            SELECT m.id, m.mensaje, m.creado_en,
                   u.id as usuario_id, u.nombre as usuario_nombre,
                   e.id as evento_id, e.nombre as evento_nombre
            FROM mensajes_foro m
            JOIN usuarios u ON m.usuario_id = u.id
            JOIN eventos e ON m.evento_id = e.id
            WHERE m.id = $1
        `;
        const results = await pool.query(query, [id]);

        if (results.rows.length === 0) {
            return res.status(404).json(response.failure(404, "Mensaje no encontrado"));
        }

        return res.status(200).json(response.success(200, "Mensaje obtenido exitosamente", results.rows[0]));
    } catch (error) {
        console.error('Error en getMensajeForoById:', error);
        return res.status(500).json(response.failure(500, "Error al obtener el mensaje"));
    }
};

const createMensajeForo = async (req, res) => {
    const response = new Response();
    const { usuario_id, evento_id, mensaje } = req.body;

    // Validaciones básicas
    if (!usuario_id || !evento_id || !mensaje) {
        return res.status(400).json(response.failure(400, "Faltan campos requeridos: usuario_id, evento_id o mensaje"));
    }

    if (!validateMensaje(mensaje)) {
        return res.status(400).json(response.failure(400, "El mensaje debe tener entre 5 y 500 caracteres"));
    }

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Validar relaciones
        const fkValidas = await validateForeignKeys(usuario_id, evento_id);
        if (!fkValidas) {
            return res.status(404).json(response.failure(404, "Usuario o evento no existen"));
        }

        // Crear mensaje
        const query = `
            INSERT INTO mensajes_foro 
                (usuario_id, evento_id, mensaje) 
            VALUES ($1, $2, $3) 
            RETURNING id, usuario_id, evento_id, mensaje, creado_en
        `;
        const results = await client.query(query, [
            usuario_id, 
            evento_id, 
            mensaje
        ]);

        await client.query('COMMIT');
        
        return res.status(201).json(response.success(201, "Mensaje creado exitosamente", results.rows[0]));
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en createMensajeForo:', error);
        return res.status(500).json(response.failure(500, "Error al crear el mensaje"));
    } finally {
        client.release();
    }
};

const updateMensajeForo = async (req, res) => {
    const response = new Response();
    const id = parseInt(req.params.id);
    const { mensaje } = req.body;

    if (isNaN(id)) {
        return res.status(400).json(response.failure(400, "ID debe ser un número válido"));
    }

    // Validaciones
    if (!validateMensaje(mensaje)) {
        return res.status(400).json(response.failure(400, "El mensaje debe tener entre 5 y 500 caracteres"));
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Verificar existencia del mensaje
        const mensajeExistente = await client.query(
            'SELECT id FROM mensajes_foro WHERE id = $1',
            [id]
        );

        if (mensajeExistente.rows.length === 0) {
            return res.status(404).json(response.failure(404, "Mensaje no encontrado"));
        }

        // Actualizar (solo el mensaje, no se permiten cambios de usuario/evento)
        const results = await client.query(
            'UPDATE mensajes_foro SET mensaje = $1 WHERE id = $2 RETURNING id, usuario_id, evento_id, mensaje, creado_en',
            [mensaje, id]
        );

        await client.query('COMMIT');
        
        return res.status(200).json(response.success(200, "Mensaje actualizado exitosamente", results.rows[0]));
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en updateMensajeForo:', error);
        return res.status(500).json(response.failure(500, "Error al actualizar el mensaje"));
    } finally {
        client.release();
    }
};

const deleteMensajeForo = async (req, res) => {
    const response = new Response();
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json(response.failure(400, "ID debe ser un número válido"));
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Verificar existencia
        const mensajeExistente = await client.query(
            'SELECT id FROM mensajes_foro WHERE id = $1',
            [id]
        );

        if (mensajeExistente.rows.length === 0) {
            return res.status(404).json(response.failure(404, "Mensaje no encontrado"));
        }

        // Eliminar
        const results = await client.query(
            'DELETE FROM mensajes_foro WHERE id = $1 RETURNING id, usuario_id',
            [id]
        );

        await client.query('COMMIT');
        
        return res.status(200).json(response.success(200, "Mensaje eliminado exitosamente", results.rows[0]));
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en deleteMensajeForo:', error);
        return res.status(500).json(response.failure(500, "Error al eliminar el mensaje"));
    } finally {
        client.release();
    }
};

// Para testing - limpia la tabla de mensajes_foro
const clearMensajesForoForTesting = async () => {
    if (process.env.NODE_ENV !== 'test') return;
    
    try {
        await pool.query("DELETE FROM mensajes_foro WHERE mensaje LIKE '%prueba%'");
    } catch (error) {
        console.error('Error al limpiar mensajes_foro para testing:', error);
        throw error;
    }
};

module.exports = {
    getAll: getMensajesForo,
    getById: getMensajeForoById,
    create: createMensajeForo,
    update: updateMensajeForo,
    delete: deleteMensajeForo,
    pool,
    clearMensajesForoForTesting,
    _test: {
        validateMensaje,
        validateForeignKeys
    }
};