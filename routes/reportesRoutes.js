// routes/reportesRoutes.js
const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(protect);

// --- Rutas para el Dashboard ---
router.get('/dashboard-stats', authorizeRoles('administrador'), reportesController.getDashboardStats);
router.get('/bajo-stock', authorizeRoles('administrador', 'operador'), reportesController.getReporteBajoStock);
router.get('/movimientos-recientes', authorizeRoles('administrador', 'operador'), reportesController.getMovimientosRecientes);

// --- Rutas para el Módulo de Reportes ---
router.get('/stock-bajo-detallado', authorizeRoles('administrador', 'operador'), reportesController.getReporteStockBajoDetallado);
router.get('/inventario-completo', authorizeRoles('administrador', 'operador'), reportesController.getReporteInventarioCompleto);

// --- Ruta con espía ---
router.get('/movimientos', authorizeRoles('administrador', 'operador'), (req, res, next) => {
    console.log(`🕵️‍♂️ [ESPÍA #3 - Rutas]: Petición recibida en /api/reportes/movimientos con los filtros:`, req.query);
    next();
}, reportesController.getReporteMovimientos);

module.exports = router;