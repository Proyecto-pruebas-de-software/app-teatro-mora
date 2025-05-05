const Pool = require("pg").Pool;
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'teatro_mora_virtual',
    password: 'admin',
    port: 5432
});
const ResponseClass = require("../models/response") 


const getBoletos = (req, res) => {
    const responseReturn = new ResponseClass();
    pool.query('SELECT * FROM boletos ORDER BY fecha_compra DESC', (error, results) => {
        if (error) throw error;
        responseReturn.status = true;
        responseReturn.code = 200;
        responseReturn.message = "Success";
        responseReturn.data = results.rows;
        res.status(200).json(responseReturn);
    });
};

const getBoletoById = (req, res) => {
    const id = parseInt(req.params.id);
    const responseReturn = new ResponseClass();
    pool.query('SELECT * FROM boletos WHERE id = $1', [id], (error, results) => {
        if (error) throw error;
        responseReturn.status = true;
        responseReturn.code = 200;
        responseReturn.message = "Success";
        responseReturn.data = results.rows[0];
        res.status(200).json(responseReturn);
    });
};

const createBoleto = (req, res) => {
    const { usuario_id, evento_id, asiento, turno_numero, fue_usado } = req.body;
    const responseReturn = new ResponseClass();
    pool.query(
        'INSERT INTO boletos (usuario_id, evento_id, asiento, turno_numero, fue_usado) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [usuario_id, evento_id, asiento, turno_numero, fue_usado],
        (error, results) => {
            if (error) throw error;
            responseReturn.status = true;
            responseReturn.code = 201;
            responseReturn.message = "Boleto creado";
            responseReturn.data = results.rows[0];
            res.status(201).json(responseReturn);
        }
    );
};

const updateBoleto = (req, res) => {
    const id = parseInt(req.params.id);
    const { usuario_id, evento_id, asiento, turno_numero, fue_usado } = req.body;
    const responseReturn = new ResponseClass();
    pool.query(
        'UPDATE boletos SET usuario_id = $1, evento_id = $2, asiento = $3, turno_numero = $4, fue_usado = $5 WHERE id = $6 RETURNING *',
        [usuario_id, evento_id, asiento, turno_numero, fue_usado, id],
        (error, results) => {
            if (error) throw error;
            responseReturn.status = true;
            responseReturn.code = 200;
            responseReturn.message = "Boleto actualizado";
            responseReturn.data = results.rows[0];
            res.status(200).json(responseReturn);
        }
    );
};

const deleteBoleto = (req, res) => {
    const id = parseInt(req.params.id);
    const responseReturn = new ResponseClass();
    pool.query('DELETE FROM boletos WHERE id = $1 RETURNING *', [id], (error, results) => {
        if (error) throw error;
        responseReturn.status = true;
        responseReturn.code = 200;
        responseReturn.message = "Boleto eliminado";
        responseReturn.data = results.rows[0];
        res.status(200).json(responseReturn);
    });
};

module.exports = {
    getBoletos,
    getBoletoById,
    createBoleto,
    updateBoleto,
    deleteBoleto
};
