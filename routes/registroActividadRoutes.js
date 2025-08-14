//Agosto 14 de 2025
// routes/registroActividadRoutes.js
const express = require('express');
const router = express.Router();
const { RegistroActividad, Usuario } = require('../models'); // Importa los modelos necesarios

// Ruta de ejemplo: Obtener todos los registros de actividad
router.get('/', async (req, res) => {
    try {
        const registros = await RegistroActividad.findAll({
            include: [{ model: Usuario, as: 'usuario', attributes: ['nombre_usuario', 'rol'] }] // Incluir información del usuario
        });
        res.json(registros);
    } catch (error) {
        console.error('Error al obtener registros de actividad:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

module.exports = router;