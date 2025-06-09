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
const getAllActors = async (req, res) => {
  const response = new Response();
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, foto_url, 
       LEFT(biografia, 100) AS biografia_resumen 
       FROM actores ORDER BY nombre ASC`
    );
    
    return res.status(200).json(response.success(200, "Actores obtenidos exitosamente", rows));
  } catch (error) {
    console.error('Error en getAllActors:', error);
    return res.status(500).json(response.failure(500, "Error al obtener actores"));
  }
};

/**
 * Obtiene un actor por ID
 */
const getActorById = async (req, res) => {
  const response = new Response();
  const id = parseInt(req.params.id);

  if (isNaN(id) || id <= 0) {
    return res.status(400).json(response.failure(400, "ID debe ser un número entero positivo"));
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, biografia, foto_url 
       FROM actores WHERE id = $1`, 
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json(response.failure(404, "Actor no encontrado"));
    }

    return res.status(200).json(response.success(200, "Actor obtenido exitosamente", rows[0]));
  } catch (error) {
    console.error('Error en getActorById:', error);
    return res.status(500).json(response.failure(500, "Error al obtener el actor"));
  }
};

/**
 * Crea un nuevo actor
 */
const createActor = async (req, res) => {
  const response = new Response();
  const { nombre, biografia, foto_url } = req.body;

  // Validaciones mejoradas
  if (!validateName(nombre)) {
    return res.status(400).json(response.failure(400, "Nombre inválido. Solo letras, espacios y guiones, máximo 100 caracteres"));
  }

  if (!validateBiography(biografia)) {
    return res.status(400).json(response.failure(400, "Biografía inválida. Máximo 2000 caracteres"));
  }

  if (!validatePhotoUrl(foto_url)) {
    return res.status(400).json(response.failure(400, "URL de foto inválida. Debe ser una URL válida (http/https) y máximo 255 caracteres"));
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Verificar nombre duplicado
    const duplicateCheck = await client.query(
      'SELECT id FROM actores WHERE nombre = $1',
      [nombre]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json(response.failure(409, "Ya existe un actor con ese nombre"));
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
    
    return res.status(201).json(response.success(201, "Actor creado exitosamente", actorCreado));
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en createActor:', error);
    return res.status(500).json(response.failure(500, "Error al crear el actor"));
  } finally {
    client.release();
  }
};

/**
 * Actualiza un actor existente
 */
const updateActor = async (req, res) => {
  const response = new Response();
  const id = parseInt(req.params.id);
  const { nombre, biografia, foto_url } = req.body;

  if (isNaN(id) || id <= 0) {
    return res.status(400).json(response.failure(400, "ID debe ser un número entero positivo"));
  }

  // Validaciones
  if (nombre && !validateName(nombre)) {
    return res.status(400).json(response.failure(400, "Nombre inválido"));
  }

  if (biografia && !validateBiography(biografia)) {
    return res.status(400).json(response.failure(400, "Biografía inválida"));
  }

  if (foto_url && !validatePhotoUrl(foto_url)) {
    return res.status(400).json(response.failure(400, "URL de foto inválida"));
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar existencia del actor
    const actorCheck = await client.query(
      'SELECT id FROM actores WHERE id = $1',
      [id]
    );

    if (actorCheck.rows.length === 0) {
      return res.status(404).json(response.failure(404, "Actor no encontrado"));
    }

    // Verificar nombre duplicado
    if (nombre) {
      const duplicateCheck = await client.query(
        'SELECT id FROM actores WHERE nombre = $1 AND id != $2',
        [nombre, id]
      );

      if (duplicateCheck.rows.length > 0) {
        return res.status(409).json(response.failure(409, "Ya existe otro actor con ese nombre"));
      }
    }

    // Actualizar actor
    const { rows } = await client.query(
      `UPDATE actores 
       SET nombre = COALESCE($1, nombre),
           biografia = COALESCE($2, biografia),
           foto_url = COALESCE($3, foto_url)
       WHERE id = $4
       RETURNING id, nombre, biografia, foto_url`,  // Incluir biografia en el RETURNING
      [nombre || null, biografia || null, foto_url || null, id]
    );

    await client.query('COMMIT');
    
    const actorActualizado = {
      id: rows[0].id,
      nombre: rows[0].nombre,
      biografia: rows[0].biografia || null,
      foto_url: rows[0].foto_url || null
    };
    
    return res.status(200).json(response.success(200, "Actor actualizado exitosamente", actorActualizado));
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en updateActor:', error);
    return res.status(500).json(response.failure(500, "Error al actualizar el actor"));
  } finally {
    client.release();
  }
};

/**
 * Elimina un actor
 */
const deleteActor = async (req, res) => {
  const response = new Response();
  const id = parseInt(req.params.id);

  if (isNaN(id) || id <= 0) {
    return res.status(400).json(response.failure(400, "ID debe ser un número entero positivo"));
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar existencia del actor
    const actorCheck = await client.query(
      'SELECT id FROM actores WHERE id = $1',
      [id]
    );

    if (actorCheck.rows.length === 0) {
      return res.status(404).json(response.failure(404, "Actor no encontrado"));
    }

    // Eliminar actor
    const { rows } = await client.query(
      'DELETE FROM actores WHERE id = $1 RETURNING id, nombre',
      [id]
    );

    await client.query('COMMIT');
    
    return res.status(200).json(response.success(200, "Actor eliminado exitosamente", rows[0]));
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en deleteActor:', error);
    return res.status(500).json(response.failure(500, "Error al eliminar el actor"));
  } finally {
    client.release();
  }
};

// Para testing - limpia la tabla de actores
const clearActorsForTesting = async () => {
  if (process.env.NODE_ENV !== 'test') return;
  
  try {
    await pool.query("DELETE FROM actores WHERE nombre LIKE 'Actor%'");
  } catch (error) {
    console.error('Error al limpiar actores para testing:', error);
    throw error;
  }
};

module.exports = {
  getAll: getAllActors,
  getById: getActorById,
  create: createActor,
  update: updateActor,
  delete: deleteActor,
  pool,
  clearActorsForTesting,
  _test: {
    validateName,
    validateBiography,
    validatePhotoUrl
  }
};