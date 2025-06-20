// controllers/authController.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Usuario, sequelize, Sequelize } = require('../models');
const sendEmail = require('../utils/email'); // Importamos nuestro servicio de email

// Función de ayuda para generar el token JWT
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, rol: user.rol, nombre_usuario: user.nombre_usuario },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

// --- LÓGICA DE REGISTRO Y LOGIN (EXISTENTE) ---
exports.register = async (req, res) => {
    // Tu código de registro existente va aquí...
    const { nombre_usuario, correo_electronico, contrasena, rol } = req.body;
    const transaction = await sequelize.transaction();
    try {
        const existingUser = await Usuario.findOne({
            where: { [Sequelize.Op.or]: [{ nombre_usuario }, { correo_electronico }] },
            transaction
        });
        if (existingUser) {
            await transaction.rollback();
            return res.status(409).json({ message: 'El nombre de usuario o el correo electrónico ya están en uso.' });
        }
        const newUser = await Usuario.create({ nombre_usuario, correo_electronico, contrasena, rol }, { transaction });
        await transaction.commit();
        await req.logActivity('registro_usuario', 'Usuario', newUser.id, { correo_electronico }, 'EXITO');
        res.status(201).json({ message: 'Usuario registrado exitosamente.' });
    } catch (error) {
        await transaction.rollback();
        console.error('Error en el registro:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

exports.login = async (req, res) => {
    // Tu código de login existente va aquí...
    const { correo_electronico, contrasena } = req.body;
    try {
        const user = await Usuario.findOne({ where: { correo_electronico } });
        if (!user || !(await user.comparePassword(contrasena))) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        if (!user.activo) {
            return res.status(403).json({ message: 'Su cuenta está inactiva.' });
        }
        const token = generateToken(user);
        await req.logActivity('login_usuario', 'Autenticacion', user.id, {}, 'EXITO');
        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            token,
            user: { id: user.id, nombre_usuario: user.nombre_usuario, rol: user.rol }
        });
    } catch (error) {
        console.error('Error en el inicio de sesión:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};


// --- NUEVAS FUNCIONES PARA RECUPERAR CONTRASEÑA ---

/**
 * @controller forgotPassword
 * @description Genera un token de reseteo y lo envía por correo.
 * @route       POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
    try {
        const { correo_electronico } = req.body;
        if (!correo_electronico) {
            return res.status(400).json({ message: 'Por favor, proporcione un correo electrónico.' });
        }

        const usuario = await Usuario.findOne({ where: { correo_electronico } });

        if (!usuario) {
            await req.logActivity('forgot_password_intento', 'Autenticacion', null, { correo: correo_electronico, motivo: 'Usuario no encontrado' }, 'FALLO');
            return res.status(200).json({ message: 'Si el correo está registrado, recibirá un email con instrucciones.' });
        }

        const resetToken = usuario.getResetPasswordToken();
        await usuario.save(); 

        const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
        const emailHtml = `<h1>Solicitud de Reseteo de Contraseña</h1><p>Hola ${usuario.nombre_usuario},</p><p>Para resetear tu contraseña, por favor haz clic en el siguiente enlace:</p><a href="${resetUrl}" target="_blank">Resetear mi Contraseña</a><p>Este enlace expirará en 15 minutos.</p>`;

        await sendEmail({
            to: usuario.correo_electronico,
            subject: 'Reseteo de Contraseña - Gestor de Inventario',
            html: emailHtml
        });
        
        await req.logActivity('forgot_password_exito', 'Autenticacion', usuario.id, { correo: usuario.correo_electronico }, 'EXITO');
        res.status(200).json({ message: 'Si el correo está registrado, recibirá un email con instrucciones.' });

    } catch (error) {
        console.error('Error en forgotPassword:', error);
        const userToClean = await Usuario.findOne({ where: { correo_electronico: req.body.correo_electronico } });
        if (userToClean) {
            userToClean.resetPasswordToken = null;
            userToClean.resetPasswordExpire = null;
            await userToClean.save();
        }
        res.status(500).json({ message: 'Error en el servidor al procesar la solicitud.' });
    }
};

/**
 * @controller resetPassword
 * @description Resetea la contraseña del usuario usando el token.
 * @route       PUT /api/auth/reset-password/:token
 */
exports.resetPassword = async (req, res) => {
    try {
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');
        
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

        const loginToken = generateToken(usuario);
        await req.logActivity('reset_password_exito', 'Autenticacion', usuario.id, {}, 'EXITO');
        res.status(200).json({ message: 'Contraseña actualizada exitosamente.', token: loginToken });

    } catch (error) {
        console.error('Error en resetPassword:', error);
        res.status(500).json({ message: 'Error en el servidor al resetear la contraseña.' });
    }
};