const Pool = require("pg").Pool;
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'teatro_mora_virtual',
    password: 'admin',
    port: 5432
});
const ResponseClass = require("../models/response") 


const getColaVirtual = (req, res) => {
    const responseReturn = new ResponseClass();
    pool.query('SELECT * FROM cola_virtual ORDER BY turno_numero ASC', (error, results) => {
        if (error) throw error;
        responseReturn.status = true;
        responseReturn.code = 200;
        responseReturn.message = "Success";
        responseReturn.data = results.rows;
        res.status(200).json(responseReturn);
    });
};

const getColaVirtualById = (req, res) => {
    const id = parseInt(req.params.id);
    const responseReturn = new ResponseClass();
    pool.query('SELECT * FROM cola_virtual WHERE id = $1', [id], (error, results) => {
        if (error) throw error;
        responseReturn.status = true;
        responseReturn.code = 200;
        responseReturn.message = "Success";
        responseReturn.data = results.rows[0];
        res.status(200).json(responseReturn);
    });
};

const createColaVirtual = (req, res) => {
    const { usuario_id, evento_id, turno_numero, en_turno } = req.body;
    const responseReturn = new ResponseClass();
    pool.query(
        'INSERT INTO cola_virtual (usuario_id, evento_id, turno_numero, en_turno) VALUES ($1, $2, $3, $4) RETURNING *',
        [usuario_id, evento_id, turno_numero, en_turno],
        (error, results) => {
            if (error) throw error;
            responseReturn.status = true;
            responseReturn.code = 201;
            responseReturn.message = "Turno en cola creado";
            responseReturn.data = results.rows[0];
            res.status(201).json(responseReturn);
        }
    );
};

const updateColaVirtual = (req, res) => {
    const id = parseInt(req.params.id);
    const { usuario_id, evento_id, turno_numero, en_turno } = req.body;
    const responseReturn = new ResponseClass();
    pool.query(
        'UPDATE cola_virtual SET usuario_id = $1, evento_id = $2, turno_numero = $3, en_turno = $4 WHERE id = $5 RETURNING *',
        [usuario_id, evento_id, turno_numero, en_turno, id],
        (error, results) => {
            if (error) throw error;
            responseReturn.status = true;
            responseReturn.code = 200;
            responseReturn.message = "Turno actualizado";
            responseReturn.data = results.rows[0];
            res.status(200).json(responseReturn);
        }
    );
};

const deleteColaVirtual = (req, res) => {
    const id = parseInt(req.params.id);
    const responseReturn = new ResponseClass();
    pool.query('DELETE FROM cola_virtual WHERE id = $1 RETURNING *', [id], (error, results) => {
        if (error) throw error;
        responseReturn.status = true;
        responseReturn.code = 200;
        responseReturn.message = "Turno eliminado";
        responseReturn.data = results.rows[0];
        res.status(200).json(responseReturn);
    });
};

module.exports = {
    getColaVirtual,
    getColaVirtualById,
    createColaVirtual,
    updateColaVirtual,
    deleteColaVirtual
};