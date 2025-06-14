// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { Usuario } = require('../models'); // Importa el modelo Usuario
const userController = require('../controllers/userController'); // Importa el controlador de usuarios
const { protect, authorizeRoles } = require('../middlewares/authMiddleware'); // Importa el middleware de autenticación

// Ruta: Obtener todos los usuarios
// GET /api/usuarios
// Acceso: Privado (Solo administradores)
router.get('/', protect, authorizeRoles('administrador'), async (req, res) => {
    try {
        // En este punto, req.user estará disponible con la información del usuario autenticado
        console.log(`Usuario ${req.user.nombre_usuario} (${req.user.rol}) intentando acceder a la lista de usuarios.`);
        const usuarios = await Usuario.findAll({
            attributes: { exclude: ['contrasena'] } // Excluir la contraseña por seguridad
        });
        // Si el middleware logActivityMiddleware está configurado globalmente, se encargará de esto.
        // Si no, podrías habilitar la siguiente línea si deseas un log específico aquí:
        // await req.logActivity('obtener_usuarios', 'Usuario', null, { cantidad: usuarios.length }, 'EXITO');
        res.status(200).json(usuarios);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        // await req.logActivity('obtener_usuarios', 'Usuario', null, { error: error.message }, 'FALLO');
        res.status(500).json({ message: 'Error interno del servidor al obtener usuarios.' });
    }
});

// Ruta: Obtener un usuario por ID
// GET /api/usuarios/:id
// Acceso: Privado (Admin, o el propio usuario)
router.get('/:id', protect, userController.getUserById);

// Ruta: Crear un nuevo usuario
// POST /api/usuarios
// Acceso: Privado (Solo administradores)
router.post('/', protect, authorizeRoles('administrador'), userController.createUser);

// Ruta: Actualizar un usuario por ID
// PUT /api/usuarios/:id
// Acceso: Privado (Admin, o el propio usuario)
router.put('/:id', protect, userController.updateUser);

// Ruta: Eliminar un usuario por ID
// DELETE /api/usuarios/:id
// Acceso: Privado (Solo administradores)
router.delete('/:id', protect, authorizeRoles('administrador'), userController.deleteUser);


module.exports = router;