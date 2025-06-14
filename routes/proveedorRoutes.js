// routes/proveedorRoutes.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize'); // Usaremos Op para operadores de búsqueda

// Importa los modelos necesarios
const { Proveedor, ParteRepuesto, RegistroActividad } = require('../models');
// Importa las funciones de seguridad (autenticación y autorización)
const { verifyAccessToken, authorizeRoles } = require('../utils/auth');

// Importa el objeto sequelize para transacciones
const { sequelize } = require('../config/database');

// Función auxiliar para registrar actividad
async function logActivity(usuario_id, tipo_accion, objeto_tipo, objeto_id, cambios_detalle, resultado, ip_origen) {
    try {
        await RegistroActividad.create({
            usuario_id,
            tipo_accion,
            objeto_tipo,
            objeto_id,
            cambios_detalle,
            resultado,
            ip_origen
        });
    } catch (logError) {
        console.error('Error al registrar actividad:', logError.message);
    }
}

// --- Rutas CRUD para Proveedores ---

/**
 * @route POST /api/proveedores
 * @description Crea un nuevo proveedor.
 * @access Private (Solo Administradores y Operadores)
 */
router.post('/', verifyAccessToken, authorizeRoles(['administrador', 'operador']), async (req, res) => {
    const {
        nombre,
        contacto_principal,
        telefono,
        email,
        direccion,
        notas
    } = req.body;
    const requestorUserId = req.user.id; // ID del usuario que realiza la acción
    const ip_origen = req.ip;
    let logResult = 'FALLO';

    const t = await sequelize.transaction(); // Inicia una transacción

    try {
        // Validación básica: El nombre del proveedor es obligatorio
        if (!nombre) {
            logActivity(requestorUserId, 'crear_proveedor', 'Proveedor', null, { ...req.body, resultado_intento: 'nombre_obligatorio' }, 'FALLO', ip_origen);
            await t.rollback();
            return res.status(400).json({ message: 'El nombre del proveedor es obligatorio.' });
        }

        // Verificar si ya existe un proveedor con el mismo nombre (insensible a mayúsculas/minúsculas)
        const existingProveedor = await Proveedor.findOne({
            where: { nombre: { [Op.iLike]: nombre } },
            transaction: t
        });
        if (existingProveedor) {
            logActivity(requestorUserId, 'crear_proveedor', 'Proveedor', null, { ...req.body, resultado_intento: 'proveedor_ya_existe' }, 'FALLO', ip_origen);
            await t.rollback();
            return res.status(409).json({ message: `Ya existe un proveedor con el nombre '${nombre}'.` });
        }

        // Crear el nuevo proveedor en la base de datos
        const nuevoProveedor = await Proveedor.create({
            nombre,
            contacto_principal,
            telefono,
            email,
            direccion,
            notas
        }, { transaction: t });

        // Registrar actividad de creación exitosa
        await logActivity(requestorUserId, 'crear_proveedor', 'Proveedor', nuevoProveedor.id, nuevoProveedor.toJSON(), 'EXITO', ip_origen);

        await t.commit(); // Confirma la transacción
        res.status(201).json({ message: 'Proveedor creado exitosamente.', proveedor: nuevoProveedor });

    } catch (error) {
        await t.rollback(); // Revierte la transacción en caso de error
        console.error('Error al crear proveedor:', error);
        await logActivity(requestorUserId, 'crear_proveedor', 'Proveedor', null, { ...req.body, error: error.message }, 'FALLO', ip_origen);
        res.status(500).json({ message: 'Error interno del servidor al crear proveedor.', error: error.message });
    }
});

/**
 * @route GET /api/proveedores
 * @description Obtiene todos los proveedores, con opciones de búsqueda y paginación.
 * @access Private (Todos los usuarios autenticados)
 * @queryparam {string} search - Término de búsqueda para nombre o contacto.
 * @queryparam {number} page - Número de página para paginación (por defecto 1).
 * @queryparam {number} limit - Límite de ítems por página (por defecto 10).
 */
router.get('/', verifyAccessToken, authorizeRoles(['administrador', 'operador', 'consulta']), async (req, res) => {
    const { search, page = 1, limit = 10 } = req.query;
    const requestorUserId = req.user.id;
    const ip_origen = req.ip;
    let logResult = 'FALLO';

    try {
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const whereClause = {};

        // Filtro por búsqueda (nombre o contacto_principal)
        if (search) {
            whereClause[Op.or] = [
                { nombre: { [Op.iLike]: `%${search}%` } }, // Búsqueda insensible a mayúsculas/minúsculas
                { contacto_principal: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows: proveedores } = await Proveedor.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: offset,
            order: [['nombre', 'ASC']] // Ordenar por nombre alfabéticamente
        });

        logResult = 'EXITO';
        await logActivity(requestorUserId, 'listar_proveedores', 'Proveedor', null, { query: req.query, count: proveedores.length }, 'EXITO', ip_origen);

        res.status(200).json({
            totalItems: count,
            currentPage: parseInt(page),
            itemsPerPage: parseInt(limit),
            totalPages: Math.ceil(count / parseInt(limit)),
            proveedores
        });

    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        await logActivity(requestorUserId, 'listar_proveedores', 'Proveedor', null, { query: req.query, error: error.message }, 'FALLO', ip_origen);
        res.status(500).json({ message: 'Error interno del servidor al obtener proveedores.', error: error.message });
    }
});

/**
 * @route GET /api/proveedores/:id
 * @description Obtiene un proveedor específico por su ID.
 * @access Private (Todos los usuarios autenticados)
 */
router.get('/:id', verifyAccessToken, authorizeRoles(['administrador', 'operador', 'consulta']), async (req, res) => {
    const proveedorId = req.params.id;
    const requestorUserId = req.user.id;
    const ip_origen = req.ip;
    let logResult = 'FALLO';

    try {
        const proveedor = await Proveedor.findByPk(proveedorId);

        if (!proveedor) {
            logActivity(requestorUserId, 'ver_proveedor_por_id', 'Proveedor', proveedorId, { resultado_intento: 'no_encontrado' }, 'FALLO', ip_origen);
            return res.status(404).json({ message: 'Proveedor no encontrado.' });
        }

        logResult = 'EXITO';
        await logActivity(requestorUserId, 'ver_proveedor_por_id', 'Proveedor', proveedorId, proveedor.toJSON(), 'EXITO', ip_origen);
        res.status(200).json(proveedor);

    } catch (error) {
        console.error('Error al obtener proveedor por ID:', error);
        await logActivity(requestorUserId, 'ver_proveedor_por_id', 'Proveedor', proveedorId, { error: error.message }, 'FALLO', ip_origen);
        res.status(500).json({ message: 'Error interno del servidor al obtener proveedor por ID.', error: error.message });
    }
});

/**
 * @route PUT /api/proveedores/:id
 * @description Actualiza un proveedor existente.
 * @access Private (Solo Administradores y Operadores)
 */
router.put('/:id', verifyAccessToken, authorizeRoles(['administrador', 'operador']), async (req, res) => {
    const proveedorId = req.params.id;
    const requestorUserId = req.user.id;
    const ip_origen = req.ip;
    const {
        nombre,
        contacto_principal,
        telefono,
        email,
        direccion,
        notas
    } = req.body;

    const t = await sequelize.transaction(); // Inicia una transacción
    let logResult = 'FALLO';
    let oldProveedorData = null;

    try {
        const proveedor = await Proveedor.findByPk(proveedorId, { transaction: t });

        if (!proveedor) {
            await t.rollback();
            logActivity(requestorUserId, 'actualizar_proveedor', 'Proveedor', proveedorId, { resultado_intento: 'no_encontrado' }, 'FALLO', ip_origen);
            return res.status(404).json({ message: 'Proveedor no encontrado.' });
        }

        oldProveedorData = proveedor.toJSON(); // Guarda los datos antiguos para el log

        // Verificar si el nuevo nombre de proveedor ya existe en otro proveedor (insensible a mayúsculas/minúsculas)
        if (nombre !== undefined && nombre !== proveedor.nombre) {
            const existingProveedor = await Proveedor.findOne({
                where: {
                    nombre: { [Op.iLike]: nombre },
                    id: { [Op.ne]: proveedorId } // Asegura que no sea el mismo proveedor
                },
                transaction: t
            });
            if (existingProveedor) {
                await t.rollback();
                logActivity(requestorUserId, 'actualizar_proveedor', 'Proveedor', proveedorId, { ...req.body, resultado_intento: 'nombre_proveedor_duplicado' }, 'FALLO', ip_origen);
                return res.status(409).json({ message: `El nombre de proveedor '${nombre}' ya está en uso por otro proveedor.` });
            }
        }

        // Actualizar el proveedor con los datos proporcionados
        await proveedor.update({
            nombre,
            contacto_principal,
            telefono,
            email,
            direccion,
            notas
        }, { transaction: t });

        const updatedProveedorData = proveedor.toJSON();
        const changes = {};
        // Registra solo los cambios que realmente ocurrieron para el log
        for (const key in req.body) {
            if (oldProveedorData[key] !== updatedProveedorData[key]) {
                changes[key] = { old: oldProveedorData[key], new: updatedProveedorData[key] };
            }
        }
        if (Object.keys(changes).length === 0) {
            // Si no hubo cambios reales, no se registra la actividad como "EXITO" de actualización
            await t.commit();
            return res.status(200).json({ message: 'No se realizaron cambios en el proveedor (datos idénticos o campos no proporcionados).', proveedor });
        }

        logResult = 'EXITO';
        await logActivity(requestorUserId, 'actualizar_proveedor', 'Proveedor', proveedor.id, changes, 'EXITO', ip_origen);

        await t.commit(); // Confirma la transacción
        res.status(200).json({ message: 'Proveedor actualizado exitosamente.', proveedor });

    } catch (error) {
        await t.rollback(); // Revierte la transacción en caso de error
        console.error('Error al actualizar proveedor:', error);
        await logActivity(requestorUserId, 'actualizar_proveedor', 'Proveedor', proveedorId, { ...req.body, error: error.message }, 'FALLO', ip_origen);
        res.status(500).json({ message: 'Error interno del servidor al actualizar proveedor.', error: error.message });
    }
});

/**
 * @route DELETE /api/proveedores/:id
 * @description Elimina un proveedor.
 * @access Private (Solo Administradores)
 */
router.delete('/:id', verifyAccessToken, authorizeRoles(['administrador']), async (req, res) => {
    const proveedorId = req.params.id;
    const requestorUserId = req.user.id;
    const ip_origen = req.ip;

    const t = await sequelize.transaction(); // Inicia una transacción
    let logResult = 'FALLO';
    let deletedProveedorData = null;

    try {
        const proveedor = await Proveedor.findByPk(proveedorId, { transaction: t });

        if (!proveedor) {
            await t.rollback();
            logActivity(requestorUserId, 'eliminar_proveedor', 'Proveedor', proveedorId, { resultado_intento: 'no_encontrado' }, 'FALLO', ip_origen);
            return res.status(404).json({ message: 'Proveedor no encontrado.' });
        }

        deletedProveedorData = proveedor.toJSON(); // Guarda los datos para el log

        // Antes de eliminar el proveedor, verificamos si hay partes/repuestos asociados
        const associatedParts = await ParteRepuesto.count({
            where: { proveedor_id: proveedorId },
            transaction: t
        });

        if (associatedParts > 0) {
            await t.rollback();
            logActivity(requestorUserId, 'eliminar_proveedor', 'Proveedor', proveedorId, { resultado_intento: 'partes_asociadas' }, 'FALLO', ip_origen);
            return res.status(409).json({ message: `No se puede eliminar el proveedor porque tiene ${associatedParts} partes/repuestos asociados. Desvincúlelos primero.` });
        }

        // Si no hay partes asociadas, procede a eliminar el proveedor
        await proveedor.destroy({ transaction: t });
        await t.commit(); // Confirma la transacción
        logResult = 'EXITO';

        await logActivity(requestorUserId, 'eliminar_proveedor', 'Proveedor', proveedorId, deletedProveedorData, 'EXITO', ip_origen);
        res.status(200).json({ message: 'Proveedor eliminado exitosamente.' });

    } catch (error) {
        await t.rollback(); // Revierte la transacción en caso de error
        console.error('Error al eliminar proveedor:', error);
        await logActivity(requestorUserId, 'eliminar_proveedor', 'Proveedor', proveedorId, { error: error.message }, 'FALLO', ip_origen);
        res.status(500).json({ message: 'Error interno del servidor al eliminar proveedor.', error: error.message });
    }
});

module.exports = router;