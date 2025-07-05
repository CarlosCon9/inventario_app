// routes/reportesRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const reportesController = require('../controllers/reportesController'); // <-- Ahora sí lo importamos

router.use(protect);

router.get('/dashboard-stats', authorizeRoles('administrador'), reportesController.getDashboardStats);
router.get('/bajo-stock', authorizeRoles('administrador', 'operador', 'consulta'), reportesController.getReporteBajoStock);
router.get('/valor-inventario', authorizeRoles('administrador'), reportesController.getReporteValorInventario);

module.exports = router;