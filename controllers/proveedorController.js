/**
 * controllers/proveedorController.js
 * * Este archivo contiene toda la lógica de negocio para manejar las operaciones CRUD (Crear, Leer, Actualizar, Eliminar)
 * relacionadas con los proveedores. Cada función aquí exportada es un "controlador" que se encarga
 * de una acción específica.
 */

// --- 1. IMPORTACIONES ---
const { Op } = require('sequelize'); // Importamos el operador 'Op' para búsquedas complejas.
const { Proveedor, ParteRepuesto, RegistroActividad } = require('../models'); // Modelos de la base de datos.
const { sequelize } = require('../config/database'); // Instancia de Sequelize para usar transacciones.

// --- 2. FUNCIÓN AUXILIAR DE LOGGING ---

/**
 * @function logActivity
 * @description Registra una acción en la tabla 'registros_actividad'. Es una función de ayuda para mantener el código limpio.
 * @param {number} usuario_id - ID del usuario que realiza la acción.
 * @param {string} tipo_accion - Tipo de acción realizada (ej. 'crear_proveedor').
 * @param {string} objeto_tipo - El tipo de objeto afectado (ej. 'Proveedor').
 * @param {number} objeto_id - El ID del objeto afectado.
 * @param {object} cambios_detalle - Un JSON con los detalles del cambio o el error.
 * @param {string} resultado - 'EXITO' o 'FALLO'.
 * @param {string} ip_origen - La dirección IP desde donde se realizó la solicitud.
 */
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
        // Si el log falla, lo mostramos en consola pero no detenemos la ejecución principal.
        console.error('Error al registrar actividad:', logError.message);
    }
}


// --- 3. CONTROLADORES EXPORTADOS ---

/**
 * @controller createProveedor
 * @description Crea un nuevo proveedor.
 */
exports.createProveedor = async (req, res) => {
    const { nombre, contacto_principal, telefono, email, direccion, notas } = req.body;
    const requestorUserId = req.user.id;
    const ip_origen = req.ip;
    const t = await sequelize.transaction(); // Inicia la transacción

    try {
        if (!nombre) {
            await t.rollback();
            logActivity(requestorUserId, 'crear_proveedor', 'Proveedor', null, { ...req.body, resultado_intento: 'nombre_obligatorio' }, 'FALLO', ip_origen);
            return res.status(400).json({ message: 'El nombre del proveedor es obligatorio.' });
        }

        const existingProveedor = await Proveedor.findOne({
            where: { nombre: { [Op.iLike]: nombre } },
            transaction: t
        });

        if (existingProveedor) {
            await t.rollback();
            logActivity(requestorUserId, 'crear_proveedor', 'Proveedor', null, { ...req.body, resultado_intento: 'proveedor_ya_existe' }, 'FALLO', ip_origen);
            return res.status(409).json({ message: `Ya existe un proveedor con el nombre '${nombre}'.` });
        }

        const nuevoProveedor = await Proveedor.create({
            nombre,
            contacto_principal,
            telefono,
            email,
            direccion,
            notas
        }, { transaction: t });

        await logActivity(requestorUserId, 'crear_proveedor', 'Proveedor', nuevoProveedor.id, nuevoProveedor.toJSON(), 'EXITO', ip_origen);
        await t.commit();
        res.status(201).json({ message: 'Proveedor creado exitosamente.', proveedor: nuevoProveedor });

    } catch (error) {
        await t.rollback();
        console.error('Error al crear proveedor:', error);
        await logActivity(requestorUserId, 'crear_proveedor', 'Proveedor', null, { ...req.body, error: error.message }, 'FALLO', ip_origen);
        res.status(500).json({ message: 'Error interno del servidor al crear proveedor.', error: error.message });
    }
};

/**
 * @controller getAllProveedores
 * @description Obtiene una lista paginada y con opción de búsqueda de todos los proveedores.
 */
exports.getAllProveedores = async (req, res) => {
    const { search, page = 1, limit = 10 } = req.query;
    const requestorUserId = req.user.id;
    const ip_origen = req.ip;

    try {
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const whereClause = {};

        if (search) {
            whereClause[Op.or] = [
                { nombre: { [Op.iLike]: `%${search}%` } },
                { contacto_principal: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows: proveedores } = await Proveedor.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: offset,
            order: [['nombre', 'ASC']]
        });

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
};

/**
 * @controller getProveedorById
 * @description Obtiene un proveedor por su ID.
 */
exports.getProveedorById = async (req, res) => {
    const proveedorId = req.params.id;
    const requestorUserId = req.user.id;
    const ip_origen = req.ip;

    try {
        const proveedor = await Proveedor.findByPk(proveedorId);

        if (!proveedor) {
            logActivity(requestorUserId, 'ver_proveedor_por_id', 'Proveedor', proveedorId, { resultado_intento: 'no_encontrado' }, 'FALLO', ip_origen);
            return res.status(404).json({ message: 'Proveedor no encontrado.' });
        }

        await logActivity(requestorUserId, 'ver_proveedor_por_id', 'Proveedor', proveedorId, proveedor.toJSON(), 'EXITO', ip_origen);
        res.status(200).json(proveedor);

    } catch (error) {
        console.error('Error al obtener proveedor por ID:', error);
        await logActivity(requestorUserId, 'ver_proveedor_por_id', 'Proveedor', proveedorId, { error: error.message }, 'FALLO', ip_origen);
        res.status(500).json({ message: 'Error interno del servidor al obtener proveedor por ID.', error: error.message });
    }
};

/**
 * @controller updateProveedor
 * @description Actualiza un proveedor existente por su ID.
 */
exports.updateProveedor = async (req, res) => {
    const proveedorId = req.params.id;
    const requestorUserId = req.user.id;
    const ip_origen = req.ip;
    const t = await sequelize.transaction();

    try {
        const proveedor = await Proveedor.findByPk(proveedorId, { transaction: t });

        if (!proveedor) {
            await t.rollback();
            logActivity(requestorUserId, 'actualizar_proveedor', 'Proveedor', proveedorId, { resultado_intento: 'no_encontrado' }, 'FALLO', ip_origen);
            return res.status(404).json({ message: 'Proveedor no encontrado.' });
        }

        const oldProveedorData = proveedor.toJSON();
        const { nombre } = req.body;

        if (nombre !== undefined && nombre !== proveedor.nombre) {
            const existingProveedor = await Proveedor.findOne({
                where: {
                    nombre: { [Op.iLike]: nombre },
                    id: { [Op.ne]: proveedorId }
                },
                transaction: t
            });
            if (existingProveedor) {
                await t.rollback();
                logActivity(requestorUserId, 'actualizar_proveedor', 'Proveedor', proveedorId, { ...req.body, resultado_intento: 'nombre_proveedor_duplicado' }, 'FALLO', ip_origen);
                return res.status(409).json({ message: `El nombre de proveedor '${nombre}' ya está en uso por otro proveedor.` });
            }
        }

        await proveedor.update(req.body, { transaction: t });
        
        const updatedProveedorData = proveedor.toJSON();
        const changes = {};
        for (const key in req.body) {
            if (oldProveedorData[key] !== updatedProveedorData[key]) {
                changes[key] = { old: oldProveedorData[key], new: updatedProveedorData[key] };
            }
        }

        if (Object.keys(changes).length === 0) {
            await t.commit();
            return res.status(200).json({ message: 'No se realizaron cambios en el proveedor.', proveedor });
        }

        await logActivity(requestorUserId, 'actualizar_proveedor', 'Proveedor', proveedor.id, changes, 'EXITO', ip_origen);
        await t.commit();
        res.status(200).json({ message: 'Proveedor actualizado exitosamente.', proveedor });

    } catch (error) {
        await t.rollback();
        console.error('Error al actualizar proveedor:', error);
        await logActivity(requestorUserId, 'actualizar_proveedor', 'Proveedor', proveedorId, { ...req.body, error: error.message }, 'FALLO', ip_origen);
        res.status(500).json({ message: 'Error interno del servidor al actualizar proveedor.', error: error.message });
    }
};

/**
 * @controller deleteProveedor
 * @description Elimina un proveedor por su ID.
 */
exports.deleteProveedor = async (req, res) => {
    const proveedorId = req.params.id;
    const requestorUserId = req.user.id;
    const ip_origen = req.ip;
    const t = await sequelize.transaction();

    try {
        const proveedor = await Proveedor.findByPk(proveedorId, { transaction: t });

        if (!proveedor) {
            await t.rollback();
            logActivity(requestorUserId, 'eliminar_proveedor', 'Proveedor', proveedorId, { resultado_intento: 'no_encontrado' }, 'FALLO', ip_origen);
            return res.status(404).json({ message: 'Proveedor no encontrado.' });
        }

        const deletedProveedorData = proveedor.toJSON();
        const associatedParts = await ParteRepuesto.count({
            where: { proveedor_id: proveedorId },
            transaction: t
        });

        if (associatedParts > 0) {
            await t.rollback();
            logActivity(requestorUserId, 'eliminar_proveedor', 'Proveedor', proveedorId, { resultado_intento: 'partes_asociadas' }, 'FALLO', ip_origen);
            return res.status(409).json({ message: `No se puede eliminar el proveedor porque tiene ${associatedParts} partes/repuestos asociados.` });
        }

        await proveedor.destroy({ transaction: t });
        await logActivity(requestorUserId, 'eliminar_proveedor', 'Proveedor', proveedorId, deletedProveedorData, 'EXITO', ip_origen);
        await t.commit();
        res.status(200).json({ message: 'Proveedor eliminado exitosamente.' });

    } catch (error) {
        await t.rollback();
        console.error('Error al eliminar proveedor:', error);
        await logActivity(requestorUserId, 'eliminar_proveedor', 'Proveedor', proveedorId, { error: error.message }, 'FALLO', ip_origen);
        res.status(500).json({ message: 'Error interno del servidor al eliminar proveedor.', error: error.message });
    }
};