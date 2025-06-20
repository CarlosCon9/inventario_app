// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// --- Rutas Existentes ---
// Ruta para registrar un nuevo usuario
router.post('/register', authController.register);

// Ruta para iniciar sesión
router.post('/login', authController.login);


// --- NUEVAS RUTAS PARA RECUPERACIÓN DE CONTRASEÑA ---

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Recibe un correo y envía un email con el token de reseteo.
 * @access  Public
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @route   PUT /api/auth/reset-password/:token
 * @desc    Recibe un token y una nueva contraseña para restablecerla.
 * @access  Public
 */
router.put('/reset-password/:token', authController.resetPassword);


module.exports = router;