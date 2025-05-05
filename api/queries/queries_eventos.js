const Pool = require("pg").Pool;
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'teatro_mora_virtual',
    password: 'admin',
    port: 5432
});
const ResponseClass = require("../models/response") 


const getEventos = (req, res) => {
    const responseReturn = new ResponseClass();
    pool.query('SELECT * FROM eventos ORDER BY fecha ASC', (error, results) => {
        if (error) throw error;
        responseReturn.status = true;
        responseReturn.code = 200;
        responseReturn.message = "Success";
        responseReturn.data = results.rows;
        res.status(200).json(responseReturn);
    });
};

const getEventoById = (req, res) => {
    const id = parseInt(req.params.id);
    const responseReturn = new ResponseClass();
    pool.query('SELECT * FROM eventos WHERE id = $1', [id], (error, results) => {
        if (error) throw error;
        responseReturn.status = true;
        responseReturn.code = 200;
        responseReturn.message = "Success";
        responseReturn.data = results.rows[0];
        res.status(200).json(responseReturn);
    });
};

const createEvento = (req, res) => {
    const { nombre, descripcion, fecha, creada_por } = req.body;
    const responseReturn = new ResponseClass();
    pool.query(
        'INSERT INTO eventos (nombre, descripcion, fecha, creada_por) VALUES ($1, $2, $3, $4) RETURNING *',
        [nombre, descripcion, fecha, creada_por],
        (error, results) => {
            if (error) throw error;
            responseReturn.status = true;
            responseReturn.code = 201;
            responseReturn.message = "Evento creado";
            responseReturn.data = results.rows[0];
            res.status(201).json(responseReturn);
        }
    );
};

const updateEvento = (req, res) => {
    const id = parseInt(req.params.id);
    const { nombre, descripcion, fecha, creada_por } = req.body;
    const responseReturn = new ResponseClass();
    pool.query(
        'UPDATE eventos SET nombre = $1, descripcion = $2, fecha = $3, creada_por = $4 WHERE id = $5 RETURNING *',
        [nombre, descripcion, fecha, creada_por, id],
        (error, results) => {
            if (error) throw error;
            responseReturn.status = true;
            responseReturn.code = 200;
            responseReturn.message = "Evento actualizado";
            responseReturn.data = results.rows[0];
            res.status(200).json(responseReturn);
        }
    );
};

const deleteEvento = (req, res) => {
    const id = parseInt(req.params.id);
    const responseReturn = new ResponseClass();
    pool.query('DELETE FROM eventos WHERE id = $1 RETURNING *', [id], (error, results) => {
        if (error) throw error;
        responseReturn.status = true;
        responseReturn.code = 200;
        responseReturn.message = "Evento eliminado";
        responseReturn.data = results.rows[0];
        res.status(200).json(responseReturn);
    });
};

module.exports = {
    getEventos,
    getEventoById,
    createEvento,
    updateEvento,
    deleteEvento
};
