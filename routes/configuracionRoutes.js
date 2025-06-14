// routes/configuracionRoutes.js
const express = require('express');
const router = express.Router();

// 👇 ESTA LÍNEA ES CRUCIAL. VERIFICA QUE EL CAMINO SEA CORRECTO 👇
const configuracionController = require('../controllers/configuracionController'); 

// He corregido la importación de middlewares basándome en los archivos que subiste antes
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// Todas las rutas de configuración requieren ser administrador
router.use(protect, authorizeRoles('administrador'));

// Obtener el porcentaje de ganancia actual
router.get('/porcentaje_ganancia', configuracionController.getGanancia);

// Establecer o actualizar el porcentaje de ganancia
router.put('/porcentaje_ganancia', configuracionController.setGanancia);

module.exports = router;