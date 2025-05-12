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
const validateAsiento = (asiento) => {
    return /^[A-Za-z]\d{1,3}$/.test(asiento) && asiento.length <= 10;
};

const validateEstadoUso = (fue_usado) => {
    return typeof fue_usado === 'boolean';
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

const checkAsientoDisponible = async (evento_id, asiento, boletoId = null) => {
    try {
        let query = 'SELECT id FROM boletos WHERE evento_id = $1 AND asiento = $2';
        const params = [evento_id, asiento];
        
        if (boletoId) {
            query += ' AND id != $3';
            params.push(boletoId);
        }
        
        const result = await pool.query(query, params);
        return result.rows.length === 0;
    } catch (error) {
        console.error('Error verificando asiento:', error);
        return false;
    }
};

// CRUD Boletos
const getBoletos = async (req, res) => {
    const response = new Response();
    try {
        const query = `
            SELECT b.id, b.asiento, b.fue_usado, b.turno_numero, b.fecha_compra,
                   u.id as usuario_id, u.nombre as usuario_nombre,
                   e.id as evento_id, e.nombre as evento_nombre
            FROM boletos b
            JOIN usuarios u ON b.usuario_id = u.id
            JOIN eventos e ON b.evento_id = e.id
            ORDER BY b.fecha_compra DESC
        `;
        const results = await pool.query(query);
        
        return res.status(200).json(response.success(200, "Boletos obtenidos exitosamente", results.rows));
    } catch (error) {
        console.error('Error en getBoletos:', error);
        return res.status(500).json(response.failure(500, "Error al obtener boletos"));
    }
};

const getBoletoById = async (req, res) => {
    const response = new Response();
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json(response.failure(400, "ID debe ser un número válido"));
    }

    try {
        const query = `
            SELECT b.id, b.asiento, b.fue_usado, b.turno_numero, b.fecha_compra,
                   u.id as usuario_id, u.nombre as usuario_nombre,
                   e.id as evento_id, e.nombre as evento_nombre
            FROM boletos b
            JOIN usuarios u ON b.usuario_id = u.id
            JOIN eventos e ON b.evento_id = e.id
            WHERE b.id = $1
        `;
        const results = await pool.query(query, [id]);

        if (results.rows.length === 0) {
            return res.status(404).json(response.failure(404, "Boleto no encontrado"));
        }

        return res.status(200).json(response.success(200, "Boleto obtenido exitosamente", results.rows[0]));
    } catch (error) {
        console.error('Error en getBoletoById:', error);
        return res.status(500).json(response.failure(500, "Error al obtener el boleto"));
    }
};

const createBoleto = async (req, res) => {
    const response = new Response();
    const { usuario_id, evento_id, asiento, turno_numero, fue_usado = false } = req.body;

    // Validaciones básicas
    if (!usuario_id || !evento_id || !asiento) {
        return res.status(400).json(response.failure(400, "Faltan campos requeridos: usuario_id, evento_id o asiento"));
    }

    if (!validateAsiento(asiento)) {
        return res.status(400).json(response.failure(400, "Formato de asiento inválido (ejemplo válido: A12)"));
    }

    if (!validateEstadoUso(fue_usado)) {
        return res.status(400).json(response.failure(400, "Estado de uso inválido (debe ser true o false)"));
    }

    if (turno_numero && !Number.isInteger(turno_numero)) {
        return res.status(400).json(response.failure(400, "Número de turno debe ser un entero"));
    }

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Validar relaciones
        const fkValidas = await validateForeignKeys(usuario_id, evento_id);
        if (!fkValidas) {
            return res.status(404).json(response.failure(404, "Usuario o evento no existen"));
        }

        // Validar asiento disponible
        const asientoDisponible = await checkAsientoDisponible(evento_id, asiento);
        if (!asientoDisponible) {
            return res.status(409).json(response.failure(409, "El asiento ya está ocupado para este evento"));
        }

        // Crear boleto
        const query = `
            INSERT INTO boletos 
                (usuario_id, evento_id, asiento, turno_numero, fue_usado) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING id, usuario_id, evento_id, asiento, turno_numero, fue_usado, fecha_compra
        `;
        const results = await client.query(query, [
            usuario_id, 
            evento_id, 
            asiento, 
            turno_numero || null, 
            fue_usado
        ]);

        await client.query('COMMIT');
        
        return res.status(201).json(response.success(201, "Boleto creado exitosamente", results.rows[0]));
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en createBoleto:', error);
        return res.status(500).json(response.failure(500, "Error al crear el boleto"));
    } finally {
        client.release();
    }
};

const updateBoleto = async (req, res) => {
    const response = new Response();
    const id = parseInt(req.params.id);
    const { usuario_id, evento_id, asiento, turno_numero, fue_usado } = req.body;

    if (isNaN(id)) {
        return res.status(400).json(response.failure(400, "ID debe ser un número válido"));
    }

    // Validaciones
    if (asiento && !validateAsiento(asiento)) {
        return res.status(400).json(response.failure(400, "Formato de asiento inválido"));
    }

    if (fue_usado !== undefined && !validateEstadoUso(fue_usado)) {
        return res.status(400).json(response.failure(400, "Estado de uso inválido"));
    }

    if (turno_numero && !Number.isInteger(turno_numero)) {
        return res.status(400).json(response.failure(400, "Número de turno inválido"));
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Verificar existencia del boleto
        const boletoExistente = await client.query(
            'SELECT * FROM boletos WHERE id = $1',
            [id]
        );

        if (boletoExistente.rows.length === 0) {
            return res.status(404).json(response.failure(404, "Boleto no encontrado"));
        }

        // Validar relaciones si se actualizan
        if (usuario_id || evento_id) {
            const fkValidas = await validateForeignKeys(
                usuario_id || boletoExistente.rows[0].usuario_id,
                evento_id || boletoExistente.rows[0].evento_id
            );
            if (!fkValidas) {
                return res.status(404).json(response.failure(404, "Usuario o evento no existen"));
            }
        }

        // Validar asiento si se actualiza
        if (asiento) {
            const mismoEvento = evento_id || boletoExistente.rows[0].evento_id;
            const asientoDisponible = await checkAsientoDisponible(mismoEvento, asiento, id);
            
            if (!asientoDisponible) {
                return res.status(409).json(response.failure(409, "El asiento ya está ocupado para este evento"));
            }
        }

        // Actualizar
        const query = `
            UPDATE boletos SET
                usuario_id = COALESCE($1, usuario_id),
                evento_id = COALESCE($2, evento_id),
                asiento = COALESCE($3, asiento),
                turno_numero = COALESCE($4, turno_numero),
                fue_usado = COALESCE($5, fue_usado)
            WHERE id = $6
            RETURNING id, usuario_id, evento_id, asiento, turno_numero, fue_usado, fecha_compra
        `;

        const results = await client.query(query, [
            usuario_id || null,
            evento_id || null,
            asiento || null,
            turno_numero || null,
            fue_usado !== undefined ? fue_usado : null,
            id
        ]);

        await client.query('COMMIT');
        
        return res.status(200).json(response.success(200, "Boleto actualizado exitosamente", results.rows[0]));
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en updateBoleto:', error);
        return res.status(500).json(response.failure(500, "Error al actualizar el boleto"));
    } finally {
        client.release();
    }
};

const deleteBoleto = async (req, res) => {
    const response = new Response();
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json(response.failure(400, "ID debe ser un número válido"));
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Verificar existencia
        const boletoExistente = await client.query(
            'SELECT id FROM boletos WHERE id = $1',
            [id]
        );

        if (boletoExistente.rows.length === 0) {
            return res.status(404).json(response.failure(404, "Boleto no encontrado"));
        }

        // Eliminar
        const results = await client.query(
            'DELETE FROM boletos WHERE id = $1 RETURNING id, asiento',
            [id]
        );

        await client.query('COMMIT');
        
        return res.status(200).json(response.success(200, "Boleto eliminado exitosamente", results.rows[0]));
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en deleteBoleto:', error);
        return res.status(500).json(response.failure(500, "Error al eliminar el boleto"));
    } finally {
        client.release();
    }
};

// Para testing - limpia la tabla de boletos
const clearBoletosForTesting = async () => {
    if (process.env.NODE_ENV !== 'test') return;
    
    try {
        await pool.query("DELETE FROM boletos WHERE asiento LIKE 'A1%'");
    } catch (error) {
        console.error('Error al limpiar boletos para testing:', error);
        throw error;
    }
};

module.exports = {
    getAll: getBoletos,
    getById: getBoletoById,
    create: createBoleto,
    update: updateBoleto,
    delete: deleteBoleto,
    pool,
    clearBoletosForTesting,
    _test: {
        validateAsiento,
        validateEstadoUso,
        validateForeignKeys,
        checkAsientoDisponible
    }
};