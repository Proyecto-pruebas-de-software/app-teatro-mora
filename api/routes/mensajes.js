const express = require('express');
const router = express.Router();
const Response = require('../models/response');
const jwt = require('jsonwebtoken');
const mensajesQueries = require('../queries/queries_mensajesforo');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json(new Response().failure(401, 'Token no encontrado'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };
        next();
    } catch (error) {
        return res.status(403).json(new Response().failure(403, 'Token inválido o expirado'));
    }
};

// Get all messages
router.get('/', verifyToken, mensajesQueries.getAll);

// Create new message
router.post('/', verifyToken, (req, res) => {
    // Transform the request body to match the query expectations
    req.body = {
        usuario_id: req.user.id,
        evento_id: req.body.eventoId,
        mensaje: req.body.contenido
    };
    mensajesQueries.create(req, res);
});

// Update message
router.put('/:id', verifyToken, async (req, res) => {
    const message = await mensajesQueries.pool.query('SELECT * FROM mensajes_foro WHERE id = $1', [req.params.id]);
    
    // Check permissions
    if (message.rows.length > 0 && 
        (message.rows[0].usuario_id === req.user.id || req.user.role === 'admin')) {
        // Transform the request body
        req.body = { mensaje: req.body.contenido };
        mensajesQueries.update(req, res);
    } else {
        return res.status(403).json(new Response().failure(403, 'No autorizado para editar este mensaje'));
    }
});

// Delete message
router.delete('/:id', verifyToken, async (req, res) => {
    const message = await mensajesQueries.pool.query('SELECT * FROM mensajes_foro WHERE id = $1', [req.params.id]);
    
    // Check permissions
    if (message.rows.length > 0 && 
        (message.rows[0].usuario_id === req.user.id || req.user.role === 'admin')) {
        mensajesQueries.delete(req, res);
    } else {
        return res.status(403).json(new Response().failure(403, 'No autorizado para eliminar este mensaje'));
    }
});

// Report message
router.post('/:id/reportar', verifyToken, async (req, res) => {
    const response = new Response();
    const { id } = req.params;
    const { motivo } = req.body;

    if (!motivo?.trim()) {
        return res.status(400).json(response.failure(400, 'El motivo es requerido'));
    }

    try {
        const message = await mensajesQueries.pool.query('SELECT * FROM mensajes_foro WHERE id = $1', [id]);
        
        if (message.rows.length === 0) {
            return res.status(404).json(response.failure(404, 'Mensaje no encontrado'));
        }

        // Check if user has already reported this message
        const existingReport = await mensajesQueries.pool.query(
            'SELECT * FROM reportes_mensajes WHERE mensaje_id = $1 AND usuario_id = $2',
            [id, req.user.id]
        );

        if (existingReport.rows.length > 0) {
            return res.status(400).json(response.failure(400, 'Ya has reportado este mensaje'));
        }

        await mensajesQueries.pool.query(
            'INSERT INTO reportes_mensajes (mensaje_id, usuario_id, motivo, fecha) VALUES ($1, $2, $3, $4)',
            [id, req.user.id, motivo, new Date()]
        );

        return res.json(response.success(200, 'Mensaje reportado exitosamente'));
    } catch (error) {
        console.error('Error al reportar mensaje:', error);
        return res.status(500).json(response.failure(500, 'Error al reportar mensaje'));
    }
});

module.exports = router; 