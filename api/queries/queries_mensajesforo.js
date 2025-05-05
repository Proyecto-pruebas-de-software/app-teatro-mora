const Pool = require("pg").Pool;
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'teatro_mora_virtual',
    password: 'admin',
    port: 5432
});
const ResponseClass = require("../models/response") 



const getMensajesForo = (req, res) => {
    const responseReturn = new ResponseClass();
    pool.query('SELECT * FROM mensajes_foro ORDER BY creado_en DESC', (error, results) => {
        if (error) throw error;
        responseReturn.status = true;
        responseReturn.code = 200;
        responseReturn.message = "Success";
        responseReturn.data = results.rows;
        res.status(200).json(responseReturn);
    });
};

const getMensajeForoById = (req, res) => {
    const id = parseInt(req.params.id);
    const responseReturn = new ResponseClass();
    pool.query('SELECT * FROM mensajes_foro WHERE id = $1', [id], (error, results) => {
        if (error) throw error;
        responseReturn.status = true;
        responseReturn.code = 200;
        responseReturn.message = "Success";
        responseReturn.data = results.rows[0];
        res.status(200).json(responseReturn);
    });
};

const createMensajeForo = (req, res) => {
    const { usuario_id, evento_id, mensaje } = req.body;
    const responseReturn = new ResponseClass();
    pool.query(
        'INSERT INTO mensajes_foro (usuario_id, evento_id, mensaje) VALUES ($1, $2, $3) RETURNING *',
        [usuario_id, evento_id, mensaje],
        (error, results) => {
            if (error) throw error;
            responseReturn.status = true;
            responseReturn.code = 201;
            responseReturn.message = "Mensaje creado";
            responseReturn.data = results.rows[0];
            res.status(201).json(responseReturn);
        }
    );
};

const updateMensajeForo = (req, res) => {
    const id = parseInt(req.params.id);
    const { usuario_id, evento_id, mensaje } = req.body;
    const responseReturn = new ResponseClass();
    pool.query(
        'UPDATE mensajes_foro SET usuario_id = $1, evento_id = $2, mensaje = $3 WHERE id = $4 RETURNING *',
        [usuario_id, evento_id, mensaje, id],
        (error, results) => {
            if (error) throw error;
            responseReturn.status = true;
            responseReturn.code = 200;
            responseReturn.message = "Mensaje actualizado";
            responseReturn.data = results.rows[0];
            res.status(200).json(responseReturn);
        }
    );
};

const deleteMensajeForo = (req, res) => {
    const id = parseInt(req.params.id);
    const responseReturn = new ResponseClass();
    pool.query('DELETE FROM mensajes_foro WHERE id = $1 RETURNING *', [id], (error, results) => {
        if (error) throw error;
        responseReturn.status = true;
        responseReturn.code = 200;
        responseReturn.message = "Mensaje eliminado";
        responseReturn.data = results.rows[0];
        res.status(200).json(responseReturn);
    });
};

module.exports = {
    getMensajesForo,
    getMensajeForoById,
    createMensajeForo,
    updateMensajeForo,
    deleteMensajeForo
};