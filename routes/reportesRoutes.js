// routes/reportesRoutes.js
const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(protect);
// --- Rutas para el Dashboard ---
router.get('/dashboard-stats', authorizeRoles('administrador'), reportesController.getDashboardStats)
router.get('/bajo-stock', authorizeRoles('administrador', 'operador'), reportesController.getReporteBajoStock);
router.get('/movimientos-recientes', authorizeRoles('administrador', 'operador'), reportesController.getMovimientosRecientes);
// --- NUEVAS RUTAS PARA EL MÓDULO DE REPORTES ---
router.get('/stock-bajo-detallado', authorizeRoles('administrador', 'operador'), reportesController.getReporteStockBajoDetallado);
router.get('/inventario-completo', authorizeRoles('administrador', 'operador'), reportesController.getReporteInventarioCompleto);
router.get('/movimientos', authorizeRoles('administrador', 'operador'), reportesController.getReporteMovimientos);

module.exports = router;