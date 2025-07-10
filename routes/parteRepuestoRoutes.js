// routes/parteRepuestoRoutes.js
const express = require('express');
const router = express.Router();
const parteRepuestoController = require('../controllers/parteRepuestoController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

router.route('/')
    .get(protect, authorizeRoles('administrador', 'operador', 'consulta'), parteRepuestoController.getAllPartesRepuestos)
    .post(protect, authorizeRoles('administrador', 'operador'), uploadMiddleware, parteRepuestoController.createParteRepuesto);

router.route('/:id')
    .get(protect, authorizeRoles('administrador', 'operador', 'consulta'), parteRepuestoController.getParteRepuestoById)
    .put(protect, authorizeRoles('administrador', 'operador'), uploadMiddleware, parteRepuestoController.updateParteRepuesto)
    .delete(protect, authorizeRoles('administrador'), parteRepuestoController.deleteParteRepuesto);

module.exports = router;