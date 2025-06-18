// routes/movimientoInventarioRoutes.js
const express = require('express');
const router = express.Router();
const movimientoInventarioController = require('../controllers/movimientoInventarioController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// Aplicamos seguridad a todas las rutas de movimientos
router.use(protect, authorizeRoles('administrador', 'operador'));

// Las rutas ahora son mucho más limpias, solo definen el endpoint y llaman al controlador.
router.post('/', movimientoInventarioController.createMovimiento);

// Puedes añadir aquí otras rutas como GET para listar movimientos si lo necesitas en el futuro.
// router.get('/', movimientoInventarioController.getMovimientos);

module.exports = router;