// routes/parteRepuestoRoutes.js
const express = require('express');
const router = express.Router();
const parteRepuestoController = require('../controllers/parteRepuestoController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

router.route('/')
    .get(protect, authorizeRoles('administrador', 'operador', 'consulta'), parteRepuestoController.getAllPartesRepuestos)
    .post(protect, authorizeRoles('administrador', 'operador'), parteRepuestoController.createParteRepuesto);

router.route('/:id')
    .get(protect, authorizeRoles('administrador', 'operador', 'consulta'), parteRepuestoController.getParteRepuestoById)
    .put(protect, authorizeRoles('administrador', 'operador'), parteRepuestoController.updateParteRepuesto)
    .delete(protect, authorizeRoles('administrador'), parteRepuestoController.deleteParteRepuesto);

router.route('/:id/upload')
    .put(protect, authorizeRoles('administrador', 'operador'), uploadMiddleware, parteRepuestoController.uploadImagen);

module.exports = router;