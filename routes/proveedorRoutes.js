//Agosto 14 de 2025
/**
 * routes/proveedorRoutes.js
 * Este archivo define los endpoints (rutas) para todo lo relacionado con los proveedores.
 */

// --- 1. IMPORTACIONES ---
const express = require('express');
const router = express.Router();

// Importamos el controlador que contiene la lógica de negocio.
const proveedorController = require('../controllers/proveedorController');

// Importamos nuestro middleware de seguridad estandarizado.
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');


// --- 2. DEFINICIÓN DE RUTAS ---

// Ruta para obtener la lista simple de proveedores (para formularios).
// Esta ruta debe ir ANTES de las rutas con '/:id' para evitar conflictos.
router.get(
    '/todos', 
    protect, 
    authorizeRoles('administrador', 'operador'), 
    proveedorController.getTodosLosProveedores
);

// Usamos el encadenamiento de rutas para las rutas principales.
router.route('/')
    // Obtener la lista paginada de todos los proveedores.
    .get(
        protect, 
        authorizeRoles('administrador', 'operador', 'consulta'), 
        proveedorController.getAllProveedores
    )
    // Crear un nuevo proveedor.
    .post(
        protect, 
        authorizeRoles('administrador', 'operador'), 
        proveedorController.createProveedor
    );

router.route('/:id')
    // Actualizar un proveedor por su ID.
    .put(
        protect, 
        authorizeRoles('administrador', 'operador'), 
        proveedorController.updateProveedor
    )
    // Eliminar un proveedor por su ID.
    .delete(
        protect, 
        authorizeRoles('administrador'), 
        proveedorController.deleteProveedor
    );


// --- 3. EXPORTACIÓN ---
module.exports = router;