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

// Helper functions para validaciones mejoradas
const validateName = (name) => {
  if (!name || typeof name !== 'string') return false;
  return name.length <= 100 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\.]+$/.test(name);
};

const validateBiography = (bio) => {
  if (bio === null || bio === undefined || bio === '') return true;
  return typeof bio === 'string' && bio.length <= 2000;
};

const validatePhotoUrl = (url) => {
  if (!url || url === null || url === '') return true;
  return typeof url === 'string' && 
         url.length <= 255 && 
         /^(http|https):\/\/[^ "]+$/.test(url);
};

/**
 * Obtiene todos los actores con resumen de biografía
 */
const getAllActors = async () => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, foto_url, 
       LEFT(biografia, 100) AS biografia_resumen 
       FROM actores ORDER BY nombre ASC`
    );
    
    return rows;
  } catch (error) {
    console.error('Error en getAllActors:', error);
    throw error;
  }
};

/**
 * Obtiene un actor por ID
 */
const getActorById = async (id) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, biografia, foto_url 
       FROM actores WHERE id = $1`, 
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  } catch (error) {
    console.error('Error en getActorById:', error);
    throw error;
  }
};

/**
 * Crea un nuevo actor
 */
const createActor = async ({ nombre, biografia, foto_url }) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Verificar nombre duplicado
    const duplicateCheck = await pool.query(
      'SELECT id FROM actores WHERE nombre = $1',
      [nombre]
    );

    if (duplicateCheck.rows.length > 0) {
      throw new Error("Ya existe un actor con ese nombre");
    }

    // Insertar nuevo actor
    const { rows } = await client.query(
      `INSERT INTO actores (nombre, biografia, foto_url) 
       VALUES ($1, $2, $3) 
       RETURNING id, nombre, biografia, foto_url`,  // Incluir todos los campos
      [nombre, biografia || null, foto_url || null]
    );

    await client.query('COMMIT');
    
    const actorCreado = {
      id: rows[0].id,
      nombre: rows[0].nombre,
      biografia: rows[0].biografia || null,
      foto_url: rows[0].foto_url || null
    };
    
    return actorCreado;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en createActor:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Actualiza un actor existente
 */
const updateActor = async (id, { nombre, biografia, foto_url }) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar existencia del actor
    const actorCheck = await pool.query(
      'SELECT id FROM actores WHERE id = $1',
      [id]
    );

    if (actorCheck.rows.length === 0) {
      throw new Error("Actor no encontrado");
    }

    // Verificar nombre duplicado
    if (nombre) {
      const duplicateCheck = await pool.query(
        'SELECT id FROM actores WHERE nombre = $1 AND id != $2',
        [nombre, id]
      );

      if (duplicateCheck.rows.length > 0) {
        throw new Error("Ya existe otro actor con ese nombre");
      }
    }

    // Actualizar actor
    const { rows } = await client.query(
      `UPDATE actores 
       SET nombre = COALESCE($1, nombre),
           biografia = COALESCE($2, biografia),
           foto_url = COALESCE($3, foto_url)
       WHERE id = $4
       RETURNING id, nombre, biografia, foto_url`, 
      [nombre || null, biografia || null, foto_url || null, id]
    );

    await client.query('COMMIT');
    
    return rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en updateActor:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Elimina un actor
 */
const deleteActor = async (id) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar existencia
    const actorCheck = await pool.query(
      'SELECT id FROM actores WHERE id = $1',
      [id]
    );

    if (actorCheck.rows.length === 0) {
      throw new Error("Actor no encontrado");
    }

    // Eliminar
    const { rowCount } = await client.query(
      'DELETE FROM actores WHERE id = $1',
      [id]
    );

    await client.query('COMMIT');

    return rowCount > 0; // Return true if deleted, false otherwise
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en deleteActor:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Para testing - limpia la tabla de actores
const clearActorsForTesting = async () => {
  if (process.env.NODE_ENV !== 'test') return;
  
  try {
    await pool.query("DELETE FROM actores WHERE nombre LIKE '%test%'");
  } catch (error) {
    console.error('Error al limpiar actores para testing:', error);
    throw error;
  }
};

module.exports = {
  getAllActors,
  getActorById,
  createActor,
  updateActor,
  deleteActor,
  clearActorsForTesting,
  validateName,        // Export validation functions
  validateBiography,
  validatePhotoUrl,
  pool
};