// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// Protegemos todas las rutas de este archivo y restringimos el acceso solo a administradores
router.use(protect, authorizeRoles('administrador'));

router.route('/')
    .get(userController.getAllUsuarios)
    .post(userController.createUsuario);

router.route('/:id')
    .put(userController.updateUsuario)
    .delete(userController.deleteUsuario);

module.exports = router;