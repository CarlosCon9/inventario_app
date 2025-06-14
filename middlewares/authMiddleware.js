// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models'); // Para buscar el usuario en la DB si es necesario

const protect = async (req, res, next) => {
    let token;

    // 1. Verificar si el token está presente en los headers de autorización
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extraer el token del header "Bearer TOKEN"
            token = req.headers.authorization.split(' ')[1];

            // 2. Verificar el token usando el secreto JWT
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Buscar el usuario en la base de datos usando el ID del token
            // Seleccionamos solo las propiedades que necesitamos y excluimos la contraseña
            const user = await Usuario.findByPk(decoded.id, {
                attributes: { exclude: ['contrasena'] }
            });

            if (!user) {
                return res.status(401).json({ message: 'No autorizado, usuario del token no encontrado.' });
            }

            // 4. Adjuntar el objeto de usuario a la solicitud (req.user)
            // Esto es crucial para que los controladores posteriores sepan quién es el usuario logueado
            req.user = user;

            // 5. Pasar al siguiente middleware/controlador
            next();

        } catch (error) {
            // Si hay un error al verificar el token (ej. token inválido o expirado)
            console.error('Error al verificar token JWT:', error);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'No autorizado, token ha expirado.' });
            }
            return res.status(401).json({ message: 'No autorizado, token inválido.' });
        }
    }

    if (!token) {
        // Si no se proporcionó ningún token
        return res.status(401).json({ message: 'No autorizado, no hay token.' });
    }
};

// Middleware para verificar el rol del usuario (autorización)
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.rol)) {
            // Si el usuario no tiene un rol permitido
            return res.status(403).json({ message: `Acceso denegado. Rol requerido: ${roles.join(', ')}.` });
        }
        next();
    };
};

module.exports = { protect, authorizeRoles };