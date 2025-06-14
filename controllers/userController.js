// controllers/userController.js
const { Usuario, RegistroActividad, sequelize } = require('../models'); // Asegúrate de importar Sequelize si usas Op.or

// Función de ayuda para registrar actividad (opcional, ya está en logActivityMiddleware)
// const logActivity = async (req, actionType, objectType, objectId, details = null, resultStatus = 'EXITO') => {
//     try {
//         await RegistroActividad.create({
//             usuario_id: req.user ? req.user.id : null,
//             fecha_accion: new Date(),
//             tipo_accion: actionType,
//             objeto_tipo: objectType,
//             objeto_id: objectId,
//             cambios_detalle: details,
//             resultado: resultStatus,
//             ip_origen: req.ip
//         });
//     } catch (logError) {
//         console.error('Error al registrar actividad en la DB (desde userController):', logError);
//     }
// };


// @desc    Obtener todos los usuarios
// @route   GET /api/usuarios
// @access  Privado (Admin)
exports.getUsers = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({
            attributes: { exclude: ['contrasena'] } // Excluir contraseña por seguridad
        });
        // req.logActivity es inyectado por logActivityMiddleware
        await req.logActivity('obtener_usuarios', 'Usuario', null, { cantidad: usuarios.length }, 'EXITO');
        res.status(200).json(usuarios);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        await req.logActivity('obtener_usuarios', 'Usuario', null, { error: error.message }, 'FALLO');
        res.status(500).json({ message: 'Error interno del servidor al obtener usuarios.' });
    }
};

// @desc    Obtener un usuario por ID
// @route   GET /api/usuarios/:id
// @access  Privado (Admin, o el propio usuario)
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await Usuario.findByPk(id, {
            attributes: { exclude: ['contrasena'] }
        });

        if (!usuario) {
            await req.logActivity('obtener_usuario_por_id', 'Usuario', id, { motivo: 'Usuario no encontrado' }, 'FALLO');
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Si no es administrador, solo puede ver su propio perfil
        if (req.user.rol !== 'administrador' && req.user.id !== usuario.id) {
            await req.logActivity('obtener_usuario_por_id', 'Usuario', id, {
                motivo: 'Intento de acceso no autorizado a perfil de otro usuario',
                usuario_intentando: req.user.id
            }, 'FALLO');
            return res.status(403).json({ message: 'Acceso denegado. No tiene permisos para ver este perfil.' });
        }

        await req.logActivity('obtener_usuario_por_id', 'Usuario', id, null, 'EXITO');
        res.status(200).json(usuario);
    } catch (error) {
        console.error('Error al obtener usuario por ID:', error);
        await req.logActivity('obtener_usuario_por_id', 'Usuario', req.params.id, { error: error.message }, 'FALLO');
        res.status(500).json({ message: 'Error interno del servidor al obtener el usuario.' });
    }
};

// @desc    Crear un nuevo usuario (Puede ser usado por Admin o en registro público si se habilita)
// @route   POST /api/usuarios
// @access  Privado (Admin) - El registro público ya está en /api/auth/register
exports.createUser = async (req, res) => {
    const { nombre_usuario, correo_electronico, contrasena, rol, activo } = req.body;
    const transaction = await sequelize.transaction(); // Usar transacción para la creación

    try {
        // Validar si el usuario o correo ya existen
        const existingUser = await Usuario.findOne({
            where: {
                [sequelize.Op.or]: [{ nombre_usuario }, { correo_electronico }]
            },
            transaction // Incluir la transacción
        });

        if (existingUser) {
            await transaction.rollback();
            await req.logActivity('crear_usuario', 'Usuario', null, {
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
            rol: rol || 'consulta', // Rol por defecto
            activo: typeof activo === 'boolean' ? activo : true // Activo por defecto
        }, { transaction });

        await transaction.commit();

        await req.logActivity('crear_usuario', 'Usuario', newUser.id, {
            nombre_usuario: newUser.nombre_usuario,
            rol: newUser.rol,
            creado_por: req.user ? req.user.nombre_usuario : 'Sistema/Admin'
        }, 'EXITO');

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            user: {
                id: newUser.id,
                nombre_usuario: newUser.nombre_usuario,
                correo_electronico: newUser.correo_electronico,
                rol: newUser.rol,
                activo: newUser.activo
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error al crear usuario:', error);
        await req.logActivity('crear_usuario', 'Usuario', null, {
            nombre_usuario_intentado: nombre_usuario,
            error: error.message
        }, 'FALLO');
        res.status(500).json({ message: 'Error interno del servidor al crear el usuario.', error: error.message });
    }
};

// @desc    Actualizar un usuario por ID
// @route   PUT /api/usuarios/:id
// @access  Privado (Admin, o el propio usuario)
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { nombre_usuario, correo_electronico, contrasena, rol, activo } = req.body;
    const transaction = await sequelize.transaction();

    try {
        const userToUpdate = await Usuario.findByPk(id, { transaction });

        if (!userToUpdate) {
            await transaction.rollback();
            await req.logActivity('actualizar_usuario', 'Usuario', id, { motivo: 'Usuario no encontrado' }, 'FALLO');
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Los usuarios no administradores solo pueden actualizar su propio perfil
        if (req.user.rol !== 'administrador' && req.user.id !== userToUpdate.id) {
            await transaction.rollback();
            await req.logActivity('actualizar_usuario', 'Usuario', id, {
                motivo: 'Intento de actualización no autorizado de perfil de otro usuario',
                usuario_intentando: req.user.id
            }, 'FALLO');
            return res.status(403).json({ message: 'Acceso denegado. No tiene permisos para actualizar este perfil.' });
        }

        // Preparar objeto para actualizar
        const updateData = {};
        if (nombre_usuario) updateData.nombre_usuario = nombre_usuario;
        if (correo_electronico) updateData.correo_electronico = correo_electronico;
        if (contrasena) updateData.contrasena = contrasena; // El hook beforeUpdate hasheará la contraseña
        if (typeof activo === 'boolean') updateData.activo = activo;

        // Solo el administrador puede cambiar el rol
        if (req.user.rol === 'administrador' && rol) {
            updateData.rol = rol;
        } else if (rol && req.user.rol !== 'administrador') {
            await transaction.rollback();
            await req.logActivity('actualizar_usuario', 'Usuario', id, {
                motivo: 'Intento de usuario no administrador de cambiar rol',
                usuario_intentando: req.user.id
            }, 'ADVERTENCIA');
            // Podrías devolver un error 403 aquí si no quieres que el rol se ignore silenciosamente
            // return res.status(403).json({ message: 'Acceso denegado. No tiene permisos para cambiar el rol.' });
        }

        const oldData = { ...userToUpdate.toJSON() }; // Copia los datos actuales para el log
        await userToUpdate.update(updateData, { transaction });
        const newData = { ...userToUpdate.toJSON() }; // Copia los datos actualizados

        // Quitar contraseñas antes de loguear
        delete oldData.contrasena;
        delete newData.contrasena;

        await transaction.commit();

        await req.logActivity('actualizar_usuario', 'Usuario', userToUpdate.id, {
            cambios: { old: oldData, new: newData },
            actualizado_por: req.user.nombre_usuario
        }, 'EXITO');

        res.status(200).json({
            message: 'Usuario actualizado exitosamente',
            user: {
                id: userToUpdate.id,
                nombre_usuario: userToUpdate.nombre_usuario,
                correo_electronico: userToUpdate.correo_electronico,
                rol: userToUpdate.rol,
                activo: userToUpdate.activo
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error al actualizar usuario:', error);
        await req.logActivity('actualizar_usuario', 'Usuario', req.params.id, { error: error.message }, 'FALLO');
        res.status(500).json({ message: 'Error interno del servidor al actualizar el usuario.', error: error.message });
    }
};

// @desc    Eliminar un usuario por ID
// @route   DELETE /api/usuarios/:id
// @access  Privado (Admin)
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    const transaction = await sequelize.transaction();

    try {
        const userToDelete = await Usuario.findByPk(id, { transaction });

        if (!userToDelete) {
            await transaction.rollback();
            await req.logActivity('eliminar_usuario', 'Usuario', id, { motivo: 'Usuario no encontrado' }, 'FALLO');
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // No permitir que un usuario se elimine a sí mismo si no es administrador (opcional, por seguridad)
        if (req.user.rol !== 'administrador' && req.user.id === userToDelete.id) {
            await transaction.rollback();
            await req.logActivity('eliminar_usuario', 'Usuario', id, {
                motivo: 'Intento de autoeliminación por usuario no administrador',
                usuario_intentando: req.user.id
            }, 'FALLO');
            return res.status(403).json({ message: 'Acceso denegado. No puede eliminar su propia cuenta si no es administrador.' });
        }

        // No permitir que un administrador se elimine a sí mismo si es el único administrador (lógica avanzada, fuera de este scope)
        // const adminCount = await Usuario.count({ where: { rol: 'administrador' }, transaction });
        // if (userToDelete.rol === 'administrador' && adminCount === 1 && req.user.id === userToDelete.id) {
        //     await transaction.rollback();
        //     return res.status(400).json({ message: 'No puede eliminar al único administrador del sistema.' });
        // }

        await userToDelete.destroy({ transaction });

        await transaction.commit();

        await req.logActivity('eliminar_usuario', 'Usuario', id, {
            nombre_usuario_eliminado: userToDelete.nombre_usuario,
            eliminado_por: req.user.nombre_usuario
        }, 'EXITO');

        res.status(200).json({ message: 'Usuario eliminado exitosamente.' });

    } catch (error) {
        await transaction.rollback();
        console.error('Error al eliminar usuario:', error);
        await req.logActivity('eliminar_usuario', 'Usuario', req.params.id, { error: error.message }, 'FALLO');
        res.status(500).json({ message: 'Error interno del servidor al eliminar el usuario.', error: error.message });
    }
};