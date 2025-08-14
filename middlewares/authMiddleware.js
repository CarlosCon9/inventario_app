//Agosto 14 de 2025
// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

exports.protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return res.status(401).json({ message: 'No autenticado, no hay token.' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await Usuario.findByPk(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'Usuario no encontrado.' });
        }

        // VERIFICACIÓN DE SESIÓN ÚNICA
        if (user.session_token !== decoded.sid || new Date(user.session_token_expires) < new Date()) {
            return res.status(401).json({ message: 'La sesión ha expirado o se ha iniciado en otro dispositivo.' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'No autenticado, token inválido.' });
    }
};

exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({ message: 'No tienes permiso para realizar esta acción.' });
        }
        next();
    };
};