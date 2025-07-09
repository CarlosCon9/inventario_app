// routes/parteRepuestoRoutes.js
const express = require('express');
const router = express.Router();

// Importamos los middlewares y el controlador
const parteRepuestoController = require('../controllers/parteRepuestoController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

// Usamos el encadenamiento de rutas para un código más limpio y organizado.
// Define las acciones para la ruta base '/'.
router.route('/')
    .get(protect, authorizeRoles('administrador', 'operador', 'consulta'), parteRepuestoController.getAllPartesRepuestos)
    .post(protect, authorizeRoles('administrador', 'operador'), parteRepuestoController.createParteRepuesto);

// Define las acciones para rutas con un ID específico, como '/:id'.
router.route('/:id')
    .get(protect, authorizeRoles('administrador', 'operador', 'consulta'), parteRepuestoController.getParteRepuestoById)
    .put(protect, authorizeRoles('administrador', 'operador'), parteRepuestoController.updateParteRepuesto)
    .delete(protect, authorizeRoles('administrador'), parteRepuestoController.deleteParteRepuesto);

// Define la ruta específica para la subida de imágenes.
router.route('/:id/upload')
    .put(protect, authorizeRoles('administrador', 'operador'), uploadMiddleware, parteRepuestoController.uploadImagen);

module.exports = router;