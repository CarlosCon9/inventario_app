// controllers/userController.js
const { Op } = require('sequelize');
const { Usuario } = require('../models');

exports.getAllUsuarios = async (req, res) => {
    try {
        const { page = 1, itemsPerPage = 10, sortBy = '[]', search = '' } = req.query;
        const options = {
            limit: parseInt(itemsPerPage, 10),
            offset: (parseInt(page, 10) - 1) * parseInt(itemsPerPage, 10),
            order: [],
            where: {},
            attributes: { exclude: ['contrasena', 'resetPasswordToken', 'resetPasswordExpire', 'session_token', 'session_token_expires'] }
        };
        const parsedSortBy = JSON.parse(sortBy);
        if (parsedSortBy && parsedSortBy.length > 0) {
            options.order = parsedSortBy.map(sort => [sort.key, sort.order ? sort.order.toUpperCase() : 'ASC']);
        } else {
            options.order.push(['nombre_usuario', 'ASC']);
        }
        if (search) {
            options.where = {
                [Op.or]: [
                    { nombre_usuario: { [Op.iLike]: `%${search}%` } },
                    { correo_electronico: { [Op.iLike]: `%${search}%` } }
                ]
            };
        }
        const { count, rows } = await Usuario.findAndCountAll(options);
        res.status(200).json({ items: rows, totalItems: count });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener usuarios.' });
    }
};

exports.createUsuario = async (req, res) => {
        try {
        const { nombre_usuario, correo_electronico, contrasena, rol, activo } = req.body;
        if (!contrasena) {
            return res.status(400).json({ message: 'La contraseña es obligatoria al crear un usuario.' });
        }
        const nuevoUsuario = await Usuario.create({ nombre_usuario, correo_electronico, contrasena, rol, activo });
        const userResponse = { ...nuevoUsuario.toJSON() };
        delete userResponse.contrasena;
        res.status(201).json(userResponse);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'El nombre de usuario o correo ya existe.' });
        }
        res.status(500).json({ message: 'Error al crear el usuario.' });
    }
};

exports.updateUsuario = async (req, res) => {
    
    try {
        const { contrasena, ...datosActualizar } = req.body;
        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        if (contrasena && contrasena.length > 0) {
            usuario.contrasena = contrasena;
        }
        await usuario.update(datosActualizar);
        await usuario.save();
        const userResponse = { ...usuario.toJSON() };
        delete userResponse.contrasena;
        res.status(200).json(userResponse);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'El nombre de usuario o correo ya existe.' });
        }
        res.status(500).json({ message: 'Error al actualizar el usuario.' });
    }
};

exports.deleteUsuario = async (req, res) => {
    
    try {
        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        if (usuario.id === req.user.id) {
            return res.status(400).json({ message: 'No puedes desactivar tu propia cuenta.' });
        }
        usuario.activo = false;
        await usuario.save();
        res.status(200).json({ message: 'Usuario desactivado exitosamente.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al desactivar el usuario.' });
    }
};