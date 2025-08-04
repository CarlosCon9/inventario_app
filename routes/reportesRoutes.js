// routes/reportesRoutes.js
const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(protect);

// Endpoint optimizado para estadísticas del Dashboard (solo admin)
router.get('/dashboard-stats', authorizeRoles('administrador'), reportesController.getDashboardStats);

// Endpoint para la lista de bajo stock (admin y operador)
router.get('/bajo-stock', authorizeRoles('administrador', 'operador'), reportesController.getReporteBajoStock);

// Endpoint para los movimientos recientes (admin y operador)
router.get('/movimientos-recientes', authorizeRoles('administrador', 'operador'), reportesController.getMovimientosRecientes);

module.exports = router;