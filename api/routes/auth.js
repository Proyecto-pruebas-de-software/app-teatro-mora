const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const Response = require('../models/response');

// Database connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Validation helpers
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email) && email.length <= 100;
};

const validatePassword = (password) => {
    return password.length >= 8;
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json(new Response().failure(401, 'Access token not found'));
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
        return res.status(403).json(new Response().failure(403, 'Invalid or expired token'));
    }
};

// Register new user
router.post('/register', async (req, res) => {
    const response = new Response();
    const { nombre, email, password } = req.body;

    // Validate input
    if (!nombre || !email || !password) {
        return res.status(400).json(response.failure(400, 'All fields are required'));
    }

    if (!validateEmail(email)) {
        return res.status(400).json(response.failure(400, 'Invalid email format'));
    }

    if (!validatePassword(password)) {
        return res.status(400).json(response.failure(400, 'Password must be at least 8 characters long'));
    }

    try {
        // Check if email already exists
        const emailCheck = await pool.query(
            'SELECT id FROM usuarios WHERE email = $1',
            [email]
        );

        if (emailCheck.rows.length > 0) {
            return res.status(409).json(response.failure(409, 'Email already registered'));
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const result = await pool.query(
            'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol',
            [nombre, email, hashedPassword, 'user']
        );

        const user = result.rows[0];
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.rol },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.status(201).json(response.success(201, 'User registered successfully', {
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                role: user.rol
            }
        }));
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json(response.failure(500, 'Error registering user'));
    }
});

// Login user
router.post('/login', async (req, res) => {
    const response = new Response();
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json(response.failure(400, 'Email and password are required'));
    }

    try {
        // Find user by email
        const result = await pool.query(
            'SELECT * FROM usuarios WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json(response.failure(401, 'Invalid credentials'));
        }

        const user = result.rows[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json(response.failure(401, 'Invalid credentials'));
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.rol },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.status(200).json(response.success(200, 'Login successful', {
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                role: user.rol
            }
        }));
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json(response.failure(500, 'Error during login'));
    }
});

// Get current user
router.get('/me', verifyToken, async (req, res) => {
    const response = new Response();
    try {
        const result = await pool.query(
            'SELECT id, nombre, email, rol FROM usuarios WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json(response.failure(404, 'User not found'));
        }

        return res.status(200).json(response.success(200, 'User retrieved successfully', {
            id: result.rows[0].id,
            nombre: result.rows[0].nombre,
            email: result.rows[0].email,
            role: result.rows[0].rol
        }));
    } catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json(response.failure(500, 'Error retrieving user'));
    }
});

// Logout (optional - client-side can handle token removal)
router.post('/logout', (req, res) => {
    const response = new Response();
    return res.status(200).json(response.success(200, 'Logged out successfully'));
});

module.exports = router; 