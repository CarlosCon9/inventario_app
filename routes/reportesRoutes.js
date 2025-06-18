// routes/reportesRoutes.js
const express = require('express');
const router = express.Router();

// Importamos los middlewares de seguridad y el nuevo controlador
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const reportesController = require('../controllers/reportesController');

// Aplicamos seguridad a todas las rutas de reportes
router.use(protect, authorizeRoles('administrador', 'operador', 'consulta'));

// --- DEFINICIÓN DE RUTAS DE REPORTES ---

// Mantenemos las rutas que ya tenías, pero ahora apuntando a un futuro controlador si decides moverlas
// Por ahora, las dejamos comentadas para enfocarnos en las nuevas.
// router.get('/inventario-actual', reportesController.getReporteInventarioActual);
// router.get('/movimientos', reportesController.getReporteMovimientos);

// --- NUEVAS RUTAS ---

// Ruta para obtener el reporte de partes con bajo stock
router.get('/bajo-stock', reportesController.getReporteBajoStock);

// Ruta para obtener el reporte de valorización del inventario
router.get('/valor-inventario', authorizeRoles('administrador'), reportesController.getReporteValorInventario); // <-- Solo admin puede ver el valor

module.exports = router;