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
        return false;
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
        return false;
    }
};

// CRUD Cola Virtual
const getColaVirtual = async (req, res) => {
    const response = new Response();
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
        
        return res.status(200).json(response.success(200, "Registros de cola obtenidos exitosamente", results.rows));
    } catch (error) {
        console.error('Error en getColaVirtual:', error);
        return res.status(500).json(response.failure(500, "Error al obtener registros de cola"));
    }
};

const getColaVirtualById = async (req, res) => {
    const response = new Response();
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json(response.failure(400, "ID debe ser un número válido"));
    }

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
            return res.status(404).json(response.failure(404, "Registro de cola no encontrado"));
        }

        return res.status(200).json(response.success(200, "Registro de cola obtenido exitosamente", results.rows[0]));
    } catch (error) {
        console.error('Error en getColaVirtualById:', error);
        return res.status(500).json(response.failure(500, "Error al obtener el registro de cola"));
    }
};

const createColaVirtual = async (req, res) => {
    const response = new Response();
    const { usuario_id, evento_id, turno_numero, en_turno = false } = req.body;

    // Validaciones básicas
    if (!usuario_id || !evento_id || !turno_numero) {
        return res.status(400).json(response.failure(400, "Faltan campos requeridos: usuario_id, evento_id o turno_numero"));
    }

    if (!validateTurno(turno_numero)) {
        return res.status(400).json(response.failure(400, "Número de turno inválido (debe ser entero positivo)"));
    }

    if (!validateEstadoTurno(en_turno)) {
        return res.status(400).json(response.failure(400, "Estado de turno inválido (debe ser true o false)"));
    }

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Validar relaciones
        const fkValidas = await validateForeignKeys(usuario_id, evento_id);
        if (!fkValidas) {
            return res.status(404).json(response.failure(404, "Usuario o evento no existen"));
        }

        // Validar turno disponible
        const turnoDisponible = await checkTurnoDisponible(evento_id, turno_numero);
        if (!turnoDisponible) {
            return res.status(409).json(response.failure(409, "El número de turno ya está en uso para este evento"));
        }

        // Crear registro en cola
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
        
        return res.status(201).json(response.success(201, "Registro de cola creado exitosamente", results.rows[0]));
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en createColaVirtual:', error);
        return res.status(500).json(response.failure(500, "Error al crear el registro de cola"));
    } finally {
        client.release();
    }
};

const updateColaVirtual = async (req, res) => {
    const response = new Response();
    const id = parseInt(req.params.id);
    const { usuario_id, evento_id, turno_numero, en_turno } = req.body;

    if (isNaN(id)) {
        return res.status(400).json(response.failure(400, "ID debe ser un número válido"));
    }

    // Validaciones
    if (turno_numero && !validateTurno(turno_numero)) {
        return res.status(400).json(response.failure(400, "Número de turno inválido"));
    }

    if (en_turno !== undefined && !validateEstadoTurno(en_turno)) {
        return res.status(400).json(response.failure(400, "Estado de turno inválido"));
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Verificar existencia del registro
        const registroExistente = await client.query(
            'SELECT * FROM cola_virtual WHERE id = $1',
            [id]
        );

        if (registroExistente.rows.length === 0) {
            return res.status(404).json(response.failure(404, "Registro de cola no encontrado"));
        }

        // Validar relaciones si se actualizan
        if (usuario_id || evento_id) {
            const fkValidas = await validateForeignKeys(
                usuario_id || registroExistente.rows[0].usuario_id,
                evento_id || registroExistente.rows[0].evento_id
            );
            if (!fkValidas) {
                return res.status(404).json(response.failure(404, "Usuario o evento no existen"));
            }
        }

        // Validar turno si se actualiza
        if (turno_numero) {
            const mismoEvento = evento_id || registroExistente.rows[0].evento_id;
            const turnoDisponible = await checkTurnoDisponible(mismoEvento, turno_numero, id);
            
            if (!turnoDisponible) {
                return res.status(409).json(response.failure(409, "El número de turno ya está en uso para este evento"));
            }
        }

        // Actualizar
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
        
        return res.status(200).json(response.success(200, "Registro de cola actualizado exitosamente", results.rows[0]));
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en updateColaVirtual:', error);
        return res.status(500).json(response.failure(500, "Error al actualizar el registro de cola"));
    } finally {
        client.release();
    }
};

const deleteColaVirtual = async (req, res) => {
    const response = new Response();
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json(response.failure(400, "ID debe ser un número válido"));
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Verificar existencia
        const registroExistente = await client.query(
            'SELECT id FROM cola_virtual WHERE id = $1',
            [id]
        );

        if (registroExistente.rows.length === 0) {
            return res.status(404).json(response.failure(404, "Registro de cola no encontrado"));
        }

        // Eliminar
        const results = await client.query(
            'DELETE FROM cola_virtual WHERE id = $1 RETURNING id, turno_numero',
            [id]
        );

        await client.query('COMMIT');
        
        return res.status(200).json(response.success(200, "Registro de cola eliminado exitosamente", results.rows[0]));
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en deleteColaVirtual:', error);
        return res.status(500).json(response.failure(500, "Error al eliminar el registro de cola"));
    } finally {
        client.release();
    }
};

// Para testing - limpia la tabla de cola_virtual
const clearColaVirtualForTesting = async () => {
    if (process.env.NODE_ENV !== 'test') return;
    
    try {
        await pool.query("DELETE FROM cola_virtual WHERE turno_numero BETWEEN 1 AND 1000");
    } catch (error) {
        console.error('Error al limpiar cola_virtual para testing:', error);
        throw error;
    }
};

module.exports = {
    getAll: getColaVirtual,
    getById: getColaVirtualById,
    create: createColaVirtual,
    update: updateColaVirtual,
    delete: deleteColaVirtual,
    pool,
    clearColaVirtualForTesting,
    _test: {
        validateTurno,
        validateEstadoTurno,
        validateForeignKeys,
        checkTurnoDisponible
    }
};