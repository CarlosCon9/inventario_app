// controllers/authController.js
const jwt = require('jsonwebtoken');
const { Usuario, RegistroActividad, sequelize, Sequelize } = require('../models'); // <-- CAMBIO AQUÍ: Añade Sequelize

// Función de ayuda para generar el token JWT
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, rol: user.rol, nombre_usuario: user.nombre_usuario },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

// @desc    Registrar un nuevo usuario
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    const { nombre_usuario, correo_electronico, contrasena, rol } = req.body;
    const transaction = await sequelize.transaction();

    try {
        // Validar si el usuario o correo ya existen
        const existingUser = await Usuario.findOne({
            where: {
                [Sequelize.Op.or]: [{ nombre_usuario }, { correo_electronico }] // <-- Usa Sequelize.Op.or
            },
            transaction
        });

        if (existingUser) {
            await transaction.rollback();
            await req.logActivity('registro_usuario', 'Usuario', null, {
                nombre_usuario_intentado: nombre_usuario,
                correo_electronico_intentado: correo_electronico,
                motivo: 'Usuario o correo ya existe'
            }, 'FALLO');
            return res.status(400).json({ message: 'El nombre de usuario o correo electrónico ya está en uso.' });
        }

        const newUser = await Usuario.create({
            nombre_usuario,
            correo_electronico,
            contrasena,
            rol: rol || 'consulta'
        }, { transaction });

        const token = generateToken(newUser);

        await transaction.commit();

        await req.logActivity('registro_usuario', 'Usuario', newUser.id, {
            nombre_usuario: newUser.nombre_usuario,
            rol: newUser.rol
        }, 'EXITO');

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            user: {
                id: newUser.id,
                nombre_usuario: newUser.nombre_usuario,
                correo_electronico: newUser.correo_electronico,
                rol: newUser.rol
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error en el registro de usuario:', error);
        await req.logActivity('registro_usuario', 'Usuario', null, {
            nombre_usuario_intentado: nombre_usuario,
            correo_electronico_intentado: correo_electronico,
            error: error.message
        }, 'FALLO');
        res.status(500).json({ message: 'Error interno del servidor al registrar el usuario.', error: error.message });
    }
};

// @desc    Iniciar sesión de usuario
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const { correo_electronico, contrasena } = req.body;
    let userId = null;

    try {
        const user = await Usuario.findOne({ where: { correo_electronico } });

        if (!user) {
            await req.logActivity('login_usuario', 'Autenticacion', null, {
                correo_electronico_intentado: correo_electronico,
                motivo: 'Credenciales inválidas - usuario no encontrado'
            }, 'FALLO');
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        userId = user.id;

        const isMatch = await user.comparePassword(contrasena);

        if (!isMatch) {
            await req.logActivity('login_usuario', 'Autenticacion', userId, {
                correo_electronico: correo_electronico,
                motivo: 'Credenciales inválidas - contraseña incorrecta'
            }, 'FALLO');
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        if (!user.activo) {
            await req.logActivity('login_usuario', 'Autenticacion', userId, {
                correo_electronico: correo_electronico,
                motivo: 'Cuenta inactiva'
            }, 'FALLO');
            return res.status(403).json({ message: 'Su cuenta está inactiva. Contacte al administrador.' });
        }

        const token = generateToken(user);

        await req.logActivity('login_usuario', 'Autenticacion', userId, {
            correo_electronico: user.correo_electronico
        }, 'EXITO');

        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            token,
            user: {
                id: user.id,
                nombre_usuario: user.nombre_usuario,
                correo_electronico: user.correo_electronico,
                rol: user.rol
            }
        });

    } catch (error) {
        console.error('Error en el inicio de sesión:', error);
        await req.logActivity('login_usuario', 'Autenticacion', userId, {
            correo_electronico_intentado: correo_electronico,
            error: error.message
        }, 'FALLO');
        res.status(500).json({ message: 'Error interno del servidor al iniciar sesión.', error: error.message });
    }
};