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
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email) && email.length <= 100;
};

const validatePassword = (password) => {
    const re = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,100}$/;
    return re.test(password);
};

const validateName = (name) => {
    return name && name.length <= 100 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name);
};

const checkEmailUnico = async (email, userId = null) => {
    try {
        let query = 'SELECT id FROM usuarios WHERE email = $1';
        const params = [email];
        
        if (userId) {
            query += ' AND id != $2';
            params.push(userId);
        }
        
        const result = await pool.query(query, params);
        return result.rows.length === 0;
    } catch (error) {
        console.error('Error verificando email único:', error);
        return false;
    }
};

// CRUD Usuarios
const getUsuarios = async (req, res) => {
    const response = new Response();
    try {
        const results = await pool.query(
            'SELECT id, nombre, email, rol FROM usuarios ORDER BY id ASC'
        );
        
        return res.status(200).json(response.success(200, "Usuarios obtenidos exitosamente", results.rows));
    } catch (error) {
        console.error('Error en getUsuarios:', error);
        return res.status(500).json(response.failure(500, "Error al obtener usuarios"));
    }
};

const getUsuarioById = async (req, res) => {
    const response = new Response();
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json(response.failure(400, "ID debe ser un número válido"));
    }

    try {
        const results = await pool.query(
            'SELECT id, nombre, email, rol FROM usuarios WHERE id = $1', 
            [id]
        );

        if (results.rows.length === 0) {
            return res.status(404).json(response.failure(404, "Usuario no encontrado"));
        }

        return res.status(200).json(response.success(200, "Usuario obtenido exitosamente", results.rows[0]));
    } catch (error) {
        console.error('Error en getUsuarioById:', error);
        return res.status(500).json(response.failure(500, "Error al obtener el usuario"));
    }
};

const createUsuario = async (req, res) => {
    const response = new Response();
    const { nombre, email, password, rol = 'cliente' } = req.body;

    // Validaciones básicas
    if (!nombre || !email || !password) {
        return res.status(400).json(response.failure(400, "Faltan campos requeridos: nombre, email o password"));
    }

    if (!validateName(nombre)) {
        return res.status(400).json(response.failure(400, "Nombre inválido (solo letras y espacios, máx 100 caracteres)"));
    }

    if (!validateEmail(email)) {
        return res.status(400).json(response.failure(400, "Email inválido o demasiado largo (máx 100 caracteres)"));
    }

    if (!validatePassword(password)) {
        return res.status(400).json(response.failure(400, "La contraseña debe tener 8+ caracteres, 1 mayúscula, 1 número y 1 carácter especial"));
    }

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Verificar email único
        const emailUnico = await checkEmailUnico(email);
        if (!emailUnico) {
            return res.status(409).json(response.failure(409, "El email ya está registrado"));
        }

        // Crear usuario
        const query = `
            INSERT INTO usuarios 
                (nombre, email, password, rol) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id, nombre, email, rol
        `;
        const results = await client.query(query, [
            nombre, 
            email, 
            password,
            rol
        ]);

        await client.query('COMMIT');
        
        return res.status(201).json(response.success(201, "Usuario creado exitosamente", results.rows[0]));
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en createUsuario:', error);
        return res.status(500).json(response.failure(500, "Error al crear el usuario"));
    } finally {
        client.release();
    }
};

const updateUsuario = async (req, res) => {
    const response = new Response();
    const id = parseInt(req.params.id);
    const { nombre, email, rol } = req.body;

    if (isNaN(id)) {
        return res.status(400).json(response.failure(400, "ID debe ser un número válido"));
    }

    // Validaciones
    if (nombre && !validateName(nombre)) {
        return res.status(400).json(response.failure(400, "Nombre inválido"));
    }

    if (email && !validateEmail(email)) {
        return res.status(400).json(response.failure(400, "Email inválido"));
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Verificar existencia del usuario
        const usuarioExistente = await client.query(
            'SELECT * FROM usuarios WHERE id = $1',
            [id]
        );

        if (usuarioExistente.rows.length === 0) {
            return res.status(404).json(response.failure(404, "Usuario no encontrado"));
        }

        // Verificar email único si se actualiza
        if (email) {
            const emailUnico = await checkEmailUnico(email, id);
            if (!emailUnico) {
                return res.status(409).json(response.failure(409, "El email ya está registrado por otro usuario"));
            }
        }

        // Actualizar
        const query = `
            UPDATE usuarios SET
                nombre = COALESCE($1, nombre),
                email = COALESCE($2, email),
                rol = COALESCE($3, rol)
            WHERE id = $4
            RETURNING id, nombre, email, rol
        `;

        const results = await client.query(query, [
            nombre || null,
            email || null,
            rol || null,
            id
        ]);

        await client.query('COMMIT');
        
        return res.status(200).json(response.success(200, "Usuario actualizado exitosamente", results.rows[0]));
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en updateUsuario:', error);
        return res.status(500).json(response.failure(500, "Error al actualizar el usuario"));
    } finally {
        client.release();
    }
};

const deleteUsuario = async (req, res) => {
    const response = new Response();
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json(response.failure(400, "ID debe ser un número válido"));
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Verificar existencia
        const usuarioExistente = await client.query(
            'SELECT id FROM usuarios WHERE id = $1',
            [id]
        );

        if (usuarioExistente.rows.length === 0) {
            return res.status(404).json(response.failure(404, "Usuario no encontrado"));
        }

        // Verificar si tiene boletos asociados
        const boletosAsociados = await client.query(
            'SELECT id FROM boletos WHERE usuario_id = $1 LIMIT 1',
            [id]
        );

        if (boletosAsociados.rows.length > 0) {
            return res.status(403).json(response.failure(403, "No se puede eliminar, el usuario tiene boletos asociados"));
        }

        // Eliminar
        const results = await client.query(
            'DELETE FROM usuarios WHERE id = $1 RETURNING id, nombre, email',
            [id]
        );

        await client.query('COMMIT');
        
        return res.status(200).json(response.success(200, "Usuario eliminado exitosamente", results.rows[0]));
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en deleteUsuario:', error);
        return res.status(500).json(response.failure(500, "Error al eliminar el usuario"));
    } finally {
        client.release();
    }
};

// Para testing - limpia la tabla de usuarios
const clearUsuariosForTesting = async () => {
    if (process.env.NODE_ENV !== 'test') return;
    
    try {
        await pool.query("DELETE FROM usuarios WHERE email LIKE '%@test.com'");
    } catch (error) {
        console.error('Error al limpiar usuarios para testing:', error);
        throw error;
    }
};

module.exports = {
    getAll: getUsuarios,
    getById: getUsuarioById,
    create: createUsuario,
    update: updateUsuario,
    delete: deleteUsuario,
    pool,
    clearUsuariosForTesting,
    _test: {
        validateEmail,
        validatePassword,
        validateName,
        checkEmailUnico
    }
};