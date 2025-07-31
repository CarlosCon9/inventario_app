// routes/parteRepuestoRoutes.js
const express = require('express');
const router = express.Router();
const parteRepuestoController = require('../controllers/parteRepuestoController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const uploadManualMiddleware = require('../middlewares/uploadManualMiddleware');
router.route('/')
    .get(protect, authorizeRoles('administrador', 'operador', 'consulta'), parteRepuestoController.getAllPartesRepuestos)
    .post(protect, authorizeRoles('administrador', 'operador'), parteRepuestoController.createParteRepuesto);
router.route('/:id')
    .get(protect, authorizeRoles('administrador', 'operador', 'consulta'), parteRepuestoController.getParteRepuestoById)
    .put(protect, authorizeRoles('administrador', 'operador'), parteRepuestoController.updateParteRepuesto)
    .delete(protect, authorizeRoles('administrador'), parteRepuestoController.deleteParteRepuesto);
router.route('/:id/upload-imagen')
    .put(protect, authorizeRoles('administrador', 'operador'), uploadMiddleware, parteRepuestoController.uploadImagen);
router.route('/:id/upload-manual')
    .put(protect, authorizeRoles('administrador', 'operador'), uploadManualMiddleware, parteRepuestoController.uploadManual);
module.exports = router;