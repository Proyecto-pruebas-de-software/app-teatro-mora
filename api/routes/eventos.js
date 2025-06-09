const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const eventosQueries = require('../queries/queries_eventos');

// Public routes
router.get('/', eventosQueries.getAll);
router.get('/:id', eventosQueries.getById);

// Protected routes (require authentication)
router.post('/', verifyToken, eventosQueries.create);
router.put('/:id', verifyToken, eventosQueries.update);
router.delete('/:id', verifyToken, eventosQueries.delete);

module.exports = router; 