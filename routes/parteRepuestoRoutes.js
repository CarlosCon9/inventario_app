// routes/parteRepuestoRoutes.js
const express = require('express');
const router = express.Router();
const parteRepuestoController = require('../controllers/parteRepuestoController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware'); // Importamos nuestro middleware corregido

// Define las rutas y las enlaza con las funciones del controlador
router.route('/')
    .post(protect, authorizeRoles('administrador', 'operador'), parteRepuestoController.createParteRepuesto)
    .get(protect, authorizeRoles('administrador', 'operador', 'consulta'), parteRepuestoController.getAllPartesRepuestos);

router.route('/:id')
    .get(protect, authorizeRoles('administrador', 'operador', 'consulta'), parteRepuestoController.getParteRepuestoById)
    .put(protect, authorizeRoles('administrador', 'operador'), parteRepuestoController.updateParteRepuesto)
    .delete(protect, authorizeRoles('administrador'), parteRepuestoController.deleteParteRepuesto);

// --- RUTA PARA SUBIDA DE ARCHIVOS ---
router.route('/:id/upload')
    .put(
        protect, 
        authorizeRoles('administrador', 'operador'), 
        uploadMiddleware, // Se aplica el middleware aquí
        parteRepuestoController.uploadImagen
    );

module.exports = router;