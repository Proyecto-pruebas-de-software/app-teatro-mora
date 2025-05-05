const Pool = require("pg").Pool;
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'teatro_mora_virtual',
    password: 'admin',
    port: 5432
});
const ResponseClass = require("../models/response") 


// Queries Usuarios

const getUsuarios = (request, response) => {
    const responseReturn = new ResponseClass();
    pool.query('SELECT * FROM usuarios ORDER BY id ASC', (error, results) => {
      if (error) {
        responseReturn.message = error.message;
        return response.status(500).json(responseReturn);
      }
      responseReturn.status = true;
      responseReturn.code = 200;
      responseReturn.message = 'Success';
      responseReturn.data = results.rows;
      response.status(200).json(responseReturn);
    });
  };
  
  const getUsuarioById = (request, response) => {
    const id = parseInt(request.params.id);
    const responseReturn = new ResponseClass();
    pool.query('SELECT * FROM usuarios WHERE id = $1', [id], (error, results) => {
      if (error) {
        responseReturn.message = error.message;
        return response.status(500).json(responseReturn);
      }
      responseReturn.status = true;
      responseReturn.code = 200;
      responseReturn.message = 'Success';
      responseReturn.data = results.rows[0];
      response.status(200).json(responseReturn);
    });
  };
  
  const createUsuario = (request, response) => {
    const { nombre, email, password_hash } = request.body;
    const responseReturn = new ResponseClass();
    pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [nombre, email, password_hash],
      (error, results) => {
        if (error) {
          responseReturn.message = error.message;
          return response.status(500).json(responseReturn);
        }
        responseReturn.status = true;
        responseReturn.code = 201;
        responseReturn.message = 'Usuario creado';
        responseReturn.data = results.rows[0];
        response.status(201).json(responseReturn);
      }
    );
  };
  
  const updateUsuario = (request, response) => {
    const id = parseInt(request.params.id);
    const { nombre, email } = request.body;
    const responseReturn = new ResponseClass();
    pool.query(
      'UPDATE usuarios SET nombre = $1, email = $2 WHERE id = $3 RETURNING *',
      [nombre, email, id],
      (error, results) => {
        if (error) {
          responseReturn.message = error.message;
          return response.status(500).json(responseReturn);
        }
        responseReturn.status = true;
        responseReturn.code = 200;
        responseReturn.message = 'Usuario actualizado';
        responseReturn.data = results.rows[0];
        response.status(200).json(responseReturn);
      }
    );
  };
  
  const deleteUsuario = (request, response) => {
    const id = parseInt(request.params.id);
    const responseReturn = new ResponseClass();
    pool.query('DELETE FROM usuarios WHERE id = $1 RETURNING *', [id], (error, results) => {
      if (error) {
        responseReturn.message = error.message;
        return response.status(500).json(responseReturn);
      }
      responseReturn.status = true;
      responseReturn.code = 200;
      responseReturn.message = 'Usuario eliminado';
      responseReturn.data = results.rows[0];
      response.status(200).json(responseReturn);
    });
  };


  module.exports = {
    getUsuarios,
    getUsuarioById,
    createUsuario,
    updateUsuario,
    deleteUsuario
  };

  