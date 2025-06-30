const { Pool } = require('pg');
// const Response = require("../models/response"); // Remove Response import
const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken'); // Remove jwt import

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
        throw error;
    }
};

// CRUD Usuarios
const getUsuarios = async () => {
    try {
        const results = await pool.query(
            'SELECT id, nombre, email, rol FROM usuarios ORDER BY id ASC'
        );
        
        // Map 'rol' to 'role' for each user
        const usersWithRole = results.rows.map(user => ({ ...user, role: user.rol }));
        return usersWithRole;
    } catch (error) {
        console.error('Error en getUsuarios:', error);
        throw error; // Throw error for route handler to catch
    }
};

const getUsuarioById = async (id) => {
    try {
        const results = await pool.query(
            'SELECT id, nombre, email, rol FROM usuarios WHERE id = $1', 
            [id]
        );

        if (results.rows.length === 0) {
            return null; // Return null if not found
        }

        // Map 'rol' to 'role' for the single user
        const userWithRole = { ...results.rows[0], role: results.rows[0].rol };
        return userWithRole;
    } catch (error) {
        console.error('Error en getUsuarioById:', error);
        throw error; // Throw error for route handler to catch
    }
};

const createUsuario = async ({ nombre, email, password, rol = 'cliente' }) => {
    // Validaciones básicas
    if (!nombre || !email || !password) {
        const error = new Error("Faltan campos requeridos: nombre, email o password");
        error.statusCode = 400;
        throw error;
    }
    if (!validateName(nombre)) {
        const error = new Error("Nombre inválido (solo letras y espacios, máx 100 caracteres)");
        error.statusCode = 400;
        throw error;
    }
    if (!validateEmail(email)) {
        const error = new Error("Email inválido o demasiado largo (máx 100 caracteres)");
        error.statusCode = 400;
        throw error;
    }
    if (!validatePassword(password)) {
        const error = new Error("La contraseña debe tener 8+ caracteres, 1 mayúscula, 1 número y 1 carácter especial");
        error.statusCode = 400;
        throw error;
    }

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Verificar email único
        const emailUnico = await checkEmailUnico(email);
        if (!emailUnico) {
            const error = new Error("El email ya está registrado");
            error.statusCode = 409;
            throw error;
        }

        // Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

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
            hashedPassword,
            rol
        ]);

        await client.query('COMMIT');
        
        // Map rol from DB to role for frontend in createUsuario response
        const createdUser = results.rows[0];
        return { 
            id: createdUser.id, 
            nombre: createdUser.nombre, 
            email: createdUser.email, 
            role: createdUser.rol 
        }; // Return user data
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en createUsuario:', error);
        // Attach a default status code if not already present, for the error handler
        if (!error.statusCode) error.statusCode = 500;
        throw error; // Re-throw error for route handler
    } finally {
        client.release();
    }
};

const updateUsuario = async (id, { nombre, email, rol }) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Verificar existencia del usuario
        const usuarioExistente = await pool.query(
            'SELECT * FROM usuarios WHERE id = $1',
            [id]
        );

        if (usuarioExistente.rows.length === 0) {
            const error = new Error("Usuario no encontrado");
            error.statusCode = 404;
            throw error;
        }

        // Verificar email único si se actualiza
        if (email) {
            const emailUnico = await checkEmailUnico(email, id);
            if (!emailUnico) {
                const error = new Error("El email ya está registrado por otro usuario");
                error.statusCode = 409;
                throw error;
            }
        }

        // Validaciones
        if (nombre && !validateName(nombre)) {
            const error = new Error("Nombre inválido");
            error.statusCode = 400;
            throw error;
        }
        if (email && !validateEmail(email)) {
            const error = new Error("Email inválido");
            error.statusCode = 400;
            throw error;
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
        
        return { ...results.rows[0], role: results.rows[0].rol }; // Return updated user data
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en updateUsuario:', error);
        if (!error.statusCode) error.statusCode = 500;
        throw error; // Re-throw error
    } finally {
        client.release();
    }
};

const deleteUsuario = async (id) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Verificar existencia
        const usuarioExistente = await pool.query(
            'SELECT id FROM usuarios WHERE id = $1',
            [id]
        );

        if (usuarioExistente.rows.length === 0) {
            const error = new Error("Usuario no encontrado");
            error.statusCode = 404;
            throw error;
        }

        // Verificar si tiene boletos asociados
        const boletosAsociados = await pool.query(
            'SELECT id FROM boletos WHERE usuario_id = $1 LIMIT 1',
            [id]
        );

        if (boletosAsociados.rows.length > 0) {
            const error = new Error("No se puede eliminar, el usuario tiene boletos asociados");
            error.statusCode = 403;
            throw error;
        }

        // Eliminar
        const results = await client.query(
            'DELETE FROM usuarios WHERE id = $1 RETURNING id, nombre, email',
            [id]
        );

        await client.query('COMMIT');
        
        return results.rows[0]; // Return deleted user data
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en deleteUsuario:', error);
        if (!error.statusCode) error.statusCode = 500;
        throw error; // Re-throw error
    } finally {
        client.release();
    }
};

const login = async (email, password) => {
    try {
        const results = await pool.query(
            'SELECT id, nombre, email, password, rol FROM usuarios WHERE email = $1',
            [email]
        );

        if (results.rows.length === 0) {
            return null; // User not found
        }

        const user = results.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return null; // Incorrect password
        }

        // Return user object with 'role' mapped from 'rol'
        return { 
            id: user.id, 
            nombre: user.nombre, 
            email: user.email, 
            role: user.rol 
        };

    } catch (error) {
        console.error('Error en login:', error);
        throw error; // Re-throw for route handler to catch
    }
};

// Para testing - limpia la tabla de usuarios
const clearUsuariosForTesting = async () => {
    if (process.env.NODE_ENV !== 'test') return;
    try {
        await pool.query("DELETE FROM usuarios WHERE email LIKE '%test%'");
    } catch (error) {
        console.error('Error al limpiar usuarios para testing:', error);
        throw error;
    }
};

module.exports = {
    getUsuarios,
    getUsuarioById,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    login,
    validateEmail,
    validatePassword,
    validateName,
    checkEmailUnico,
    pool,
    clearUsuariosForTesting
};