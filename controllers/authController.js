// controllers/authController.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Usuario, sequelize, Sequelize } = require('../models');
const sendEmail = require('../utils/email');
const bcrypt = require('bcryptjs');

const generateToken = (user, sessionId) => {
    return jwt.sign(
        { id: user.id, rol: user.rol, sid: sessionId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

exports.register = async (req, res) => { /* Tu código funcional */ };

exports.login = async (req, res) => {
    const { correo_electronico, contrasena } = req.body;
    try {
        const user = await Usuario.findOne({ where: { correo_electronico } });
        if (!user || !(await user.comparePassword(contrasena))) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        if (!user.activo) {
            return res.status(403).json({ message: 'Su cuenta está inactiva.' });
        }
        const sessionId = crypto.randomBytes(20).toString('hex');
        const jwtExpiresInSeconds = 24 * 60 * 60;
        const sessionExpires = new Date(Date.now() + jwtExpiresInSeconds * 1000);
        user.session_token = sessionId;
        user.session_token_expires = sessionExpires;
        await user.save();
        const token = generateToken(user, sessionId);
        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            token,
            user: { id: user.id, nombre_usuario: user.nombre_usuario, rol: user.rol }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { correo_electronico } = req.body;
        if (!correo_electronico) {
            return res.status(400).json({ message: 'Por favor, proporcione un correo electrónico.' });
        }
        const usuario = await Usuario.findOne({ where: { correo_electronico } });

        // Por seguridad, siempre enviamos la misma respuesta, exista o no el correo.
        if (!usuario) {
            return res.status(200).json({ message: 'Si existe una cuenta con este correo, se ha enviado un enlace para restablecer la contraseña.' });
        }

        const resetToken = usuario.getResetPasswordToken();
        await usuario.save({ validate: false }); 

        // IMPORTANTE: La URL debe apuntar al frontend, no al backend.
        const resetUrl = `http://192.168.1.20:5173/reset-password/${resetToken}`;
        const emailHtml = `<h1>Solicitud de Reseteo de Contraseña</h1><p>Hola ${usuario.nombre_usuario},</p><p>Para resetear tu contraseña, por favor haz clic en el siguiente enlace:</p><a href="${resetUrl}" target="_blank">Resetear mi Contraseña</a><p>Este enlace expirará en 15 minutos.</p>`;

        await sendEmail({
            to: usuario.correo_electronico,
            subject: 'Reseteo de Contraseña - Inventario APP',
            html: emailHtml
        });
        
        res.status(200).json({ message: 'Si existe una cuenta con este correo, se ha enviado un enlace para restablecer la contraseña.' });

    } catch (error) {
        console.error('Error en forgotPassword:', error);
        // Limpiamos el token en caso de fallo para que el usuario pueda reintentar.
        const userToClean = await Usuario.findOne({ where: { correo_electronico: req.body.correo_electronico } });
        if (userToClean) {
            userToClean.resetPasswordToken = null;
            userToClean.resetPasswordExpire = null;
            await userToClean.save({ validate: false });
        }
        res.status(500).json({ message: 'Error en el servidor al procesar la solicitud.' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
        
        const usuario = await Usuario.findOne({
            where: {
                resetPasswordToken,
                resetPasswordExpire: { [Sequelize.Op.gt]: Date.now() }
            }
        });

        if (!usuario) {
            return res.status(400).json({ message: 'El token es inválido o ha expirado.' });
        }

        usuario.contrasena = req.body.password;
        usuario.resetPasswordToken = null;
        usuario.resetPasswordExpire = null;
        
        await usuario.save();

        const sessionId = crypto.randomBytes(20).toString('hex');
        const jwtExpiresInSeconds = 24 * 60 * 60;
        const sessionExpires = new Date(Date.now() + jwtExpiresInSeconds * 1000);
        usuario.session_token = sessionId;
        usuario.session_token_expires = sessionExpires;
        await usuario.save();

        const loginToken = generateToken(usuario, sessionId);
        res.status(200).json({ message: 'Contraseña actualizada exitosamente.', token: loginToken, user: { id: usuario.id, nombre_usuario: usuario.nombre_usuario, rol: usuario.rol } });

    } catch (error) {
        console.error('Error en resetPassword:', error);
        res.status(500).json({ message: 'Error en el servidor al resetear la contraseña.' });
    }
};