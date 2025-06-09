const express = require('express');
const router = express.Router();
const actoresQueries = require('../queries/queries_actores');
const { verifyToken } = require('../middleware/auth');
const Response = require('../models/response');

// Get all actors
router.get('/', actoresQueries.getAll);

// Get single actor
router.get('/:id', actoresQueries.getById);

// Create new actor (Admin only)
router.post('/', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json(new Response().failure(403, 'No autorizado. Solo los administradores pueden crear actores.'));
    }
    actoresQueries.create(req, res);
});

// Update actor (Admin only)
router.put('/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json(new Response().failure(403, 'No autorizado. Solo los administradores pueden actualizar actores.'));
    }
    actoresQueries.update(req, res);
});

// Delete actor (Admin only)
router.delete('/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json(new Response().failure(403, 'No autorizado. Solo los administradores pueden eliminar actores.'));
    }
    actoresQueries.delete(req, res);
});

module.exports = router; 