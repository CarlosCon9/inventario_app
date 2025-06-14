/**
 * routes/proveedorRoutes.js
 * * Este archivo define los endpoints (rutas) para todo lo relacionado con los proveedores.
 * Su única responsabilidad es definir la ruta, el método HTTP y qué middlewares de seguridad y
 * función controladora se ejecutarán.
 */

// --- 1. IMPORTACIONES ---
const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController'); // Importamos el controlador
const { verifyAccessToken, authorizeRoles } = require('../utils/auth'); // Importamos los middlewares de seguridad

// --- 2. DEFINICIÓN DE RUTAS ---

// Ruta para crear un nuevo proveedor.
// Solo 'administrador' y 'operador' pueden acceder.
router.post('/', verifyAccessToken, authorizeRoles(['administrador', 'operador']), proveedorController.createProveedor);

// Ruta para obtener la lista de todos los proveedores (con búsqueda y paginación).
// Todos los usuarios autenticados pueden acceder.
router.get('/', verifyAccessToken, authorizeRoles(['administrador', 'operador', 'consulta']), proveedorController.getAllProveedores);

// Ruta para obtener un proveedor específico por su ID.
// Todos los usuarios autenticados pueden acceder.
router.get('/:id', verifyAccessToken, authorizeRoles(['administrador', 'operador', 'consulta']), proveedorController.getProveedorById);

// Ruta para actualizar un proveedor por su ID.
// Solo 'administrador' y 'operador' pueden acceder.
router.put('/:id', verifyAccessToken, authorizeRoles(['administrador', 'operador']), proveedorController.updateProveedor);

// Ruta para eliminar un proveedor por su ID.
// Solo 'administrador' puede acceder.
router.delete('/:id', verifyAccessToken, authorizeRoles(['administrador']), proveedorController.deleteProveedor);

// --- 3. EXPORTACIÓN ---
module.exports = router;