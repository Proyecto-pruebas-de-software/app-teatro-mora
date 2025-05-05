const Pool = require("pg").Pool;
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'teatro_mora_virtual',
    password: 'admin',
    port: 5432
});
const ResponseClass = require("../models/response") 



const getActores = (req, res) => {
    const responseReturn = new ResponseClass();
    pool.query('SELECT * FROM actores ORDER BY id ASC', (error, results) => {
        if (error) throw error;
        responseReturn.status = true;
        responseReturn.code = 200;
        responseReturn.message = "Success";
        responseReturn.data = results.rows;
        res.status(200).json(responseReturn);
    });
};

const getActorById = (req, res) => {
    const id = parseInt(req.params.id);
    const responseReturn = new ResponseClass();
    pool.query('SELECT * FROM actores WHERE id = $1', [id], (error, results) => {
        if (error) throw error;
        responseReturn.status = true;
        responseReturn.code = 200;
        responseReturn.message = "Success";
        responseReturn.data = results.rows[0];
        res.status(200).json(responseReturn);
    });
};

const createActor = (req, res) => {
    const { nombre, biografia, foto_url } = req.body;
    const responseReturn = new ResponseClass();
    pool.query(
        'INSERT INTO actores (nombre, biografia, foto_url) VALUES ($1, $2, $3) RETURNING *',
        [nombre, biografia, foto_url],
        (error, results) => {
            if (error) throw error;
            responseReturn.status = true;
            responseReturn.code = 201;
            responseReturn.message = "Actor creado";
            responseReturn.data = results.rows[0];
            res.status(201).json(responseReturn);
        }
    );
};

const updateActor = (req, res) => {
    const id = parseInt(req.params.id);
    const { nombre, biografia, foto_url } = req.body;
    const responseReturn = new ResponseClass();
    pool.query(
        'UPDATE actores SET nombre = $1, biografia = $2, foto_url = $3 WHERE id = $4 RETURNING *',
        [nombre, biografia, foto_url, id],
        (error, results) => {
            if (error) throw error;
            responseReturn.status = true;
            responseReturn.code = 200;
            responseReturn.message = "Actor actualizado";
            responseReturn.data = results.rows[0];
            res.status(200).json(responseReturn);
        }
    );
};

const deleteActor = (req, res) => {
    const id = parseInt(req.params.id);
    const responseReturn = new ResponseClass();
    pool.query('DELETE FROM actores WHERE id = $1 RETURNING *', [id], (error, results) => {
        if (error) throw error;
        responseReturn.status = true;
        responseReturn.code = 200;
        responseReturn.message = "Actor eliminado";
        responseReturn.data = results.rows[0];
        res.status(200).json(responseReturn);
    });
};

module.exports = {
    getActores,
    getActorById,
    createActor,
    updateActor,
    deleteActor
};
