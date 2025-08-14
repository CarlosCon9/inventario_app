//Agosto 14 de 2025
// routes/movimientoInventarioRoutes.js
const express = require('express');
const router = express.Router();
const movimientoInventarioController = require('../controllers/movimientoInventarioController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(protect, authorizeRoles('administrador', 'operador'));

router.post('/', movimientoInventarioController.createMovimiento);

module.exports = router;