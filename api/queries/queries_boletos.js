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
        throw error;
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
        throw error;
    }
};

// CRUD Boletos
const getBoletos = async () => {
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
        
        return results.rows;
    } catch (error) {
        console.error('Error en getBoletos:', error);
        throw error;
    }
};

const getBoletoById = async (id) => {
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
            return null; // Return null if not found
        }

        return results.rows[0];
    } catch (error) {
        console.error('Error en getBoletoById:', error);
        throw error;
    }
};

const createBoleto = async ({ usuario_id, evento_id, asiento, turno_numero, fue_usado = false }) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

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
        
        return results.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en createBoleto:', error);
        throw error;
    } finally {
        client.release();
    }
};

const updateBoleto = async (id, { usuario_id, evento_id, asiento, turno_numero, fue_usado }) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const ticketExistente = await pool.query(
            'SELECT * FROM boletos WHERE id = $1',
            [id]
        );

        if (ticketExistente.rows.length === 0) {
            throw new Error("Boleto no encontrado");
        }

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
            turno_numero !== undefined ? turno_numero : null,
            fue_usado !== undefined ? fue_usado : null,
            id
        ]);

        await client.query('COMMIT');
        
        return results.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en updateBoleto:', error);
        throw error;
    } finally {
        client.release();
    }
};

const deleteBoleto = async (id) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const ticketExistente = await pool.query(
            'SELECT id FROM boletos WHERE id = $1',
            [id]
        );

        if (ticketExistente.rows.length === 0) {
            throw new Error("Boleto no encontrado");
        }

        const { rowCount } = await client.query(
            'DELETE FROM boletos WHERE id = $1',
            [id]
        );

        await client.query('COMMIT');

        return rowCount > 0;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en deleteBoleto:', error);
        throw error;
    } finally {
        client.release();
    }
};

const clearBoletosForTesting = async () => {
    if (process.env.NODE_ENV !== 'test') return;

    try {
        await pool.query("DELETE FROM boletos WHERE asiento LIKE '%test%'");
    } catch (error) {
        console.error('Error al limpiar boletos para testing:', error);
        throw error;
    }
};

/**
 * Procesa la compra de múltiples boletos para un evento.
 * Realiza una transacción para asegurar la integridad de los datos.
 */
const purchaseTickets = async ({ usuario_id, evento_id, cantidad }) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Obtener detalles del evento y verificar disponibilidad
        const eventResult = await client.query(
            'SELECT id, nombre, aforo, vendidos, precio FROM eventos WHERE id = $1 FOR UPDATE',
            [evento_id]
        );

        if (eventResult.rows.length === 0) {
            throw new Error('Evento no encontrado.');
        }

        const evento = eventResult.rows[0];
        const boletosDisponibles = evento.aforo - evento.vendidos;

        if (boletosDisponibles < cantidad) {
            throw new Error(`Solo quedan ${boletosDisponibles} boletos disponibles para ${evento.nombre}.`);
        }

        // 2. Actualizar el número de boletos vendidos en la tabla de eventos
        const updatedEventResult = await client.query(
            'UPDATE eventos SET vendidos = vendidos + $1 WHERE id = $2 RETURNING id, vendidos',
            [cantidad, evento_id]
        );

        // 3. Crear registros individuales de boletos
        const purchasedTickets = [];
        for (let i = 0; i < cantidad; i++) {
            const asientoGenerico = `General-${evento.vendidos + i + 1}`;
            const createBoletoQuery = `
                INSERT INTO boletos (usuario_id, evento_id, asiento, turno_numero, fue_usado)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, asiento, fecha_compra
            `;
            const ticketResult = await client.query(createBoletoQuery, [
                usuario_id,
                evento_id,
                asientoGenerico,
                turno_numero || null,
                false // fue_usado = false por defecto
            ]);
            purchasedTickets.push(ticketResult.rows[0]);
        }

        // 4. (Opcional) Actualizar estado de la cola virtual si aplica
        // Si estás integrando con la cola, aquí podrías marcar al usuario como 'atendido' o removerlo de la cola.
        // Por ejemplo: await client.query('UPDATE cola_virtual SET en_turno = false WHERE usuario_id = $1 AND evento_id = $2', [usuario_id, evento_id]);

        // Actualizar estado de la cola virtual: marcar al usuario como no en turno
        await client.query(
            'UPDATE cola_virtual SET en_turno = false WHERE usuario_id = $1 AND evento_id = $2',
            [usuario_id, evento_id]
        );

        await client.query('COMMIT');
        return { success: true, message: `Compra exitosa de ${cantidad} boletos para ${evento.nombre}.`, tickets: purchasedTickets, compraId: purchasedTickets[0]?.id || null };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en purchaseTickets:', error);
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    getBoletos,
    getBoletoById,
    createBoleto,
    updateBoleto,
    deleteBoleto,
    validateAsiento,
    validateEstadoUso,
    validateForeignKeys,
    checkAsientoDisponible,
    clearBoletosForTesting,
    purchaseTickets,
    pool
};