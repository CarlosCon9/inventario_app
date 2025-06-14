// routes/parteRepuestoRoutes.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize'); // Usaremos Op para operadores de búsqueda

// Importa los modelos necesarios: ParteRepuesto, Proveedor, y RegistroActividad
const { ParteRepuesto, Proveedor, RegistroActividad } = require('../models');
// Importa las funciones de seguridad (autenticación y autorización)
const { verifyAccessToken, authorizeRoles } = require('../utils/auth');

// Importa el objeto sequelize para transacciones
const { sequelize } = require('../config/database');

// Función auxiliar para registrar actividad (copiada de authRoutes.js para consistencia)
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

// --- Rutas CRUD para Partes/Repuestos ---

/**
 * @route POST /api/partes
 * @description Crea una nueva parte/repuesto.
 * @access Private (Solo Administradores y Operadores)
 */
router.post('/', verifyAccessToken, authorizeRoles(['administrador', 'operador']), async (req, res) => {
    const {
        nombre,
        descripcion,
        numero_parte,
        cantidad,
        ubicacion,
        precio_compra,
        precio_venta_sugerido,
        unidad_medida,
        categoria,
        proveedor_id
    } = req.body;
    const requestorUserId = req.user.id; // ID del usuario que realiza la acción
    const ip_origen = req.ip;
    let logResult = 'FALLO';

    // Inicia una transacción
    const t = await sequelize.transaction();

    try {
        // Validación básica de campos requeridos
        if (!nombre || !numero_parte || cantidad === undefined || cantidad === null) {
            logActivity(requestorUserId, 'crear_parte', 'ParteRepuesto', null, { ...req.body, resultado_intento: 'campos_requeridos_faltantes' }, 'FALLO', ip_origen);
            await t.rollback();
            return res.status(400).json({ message: 'Nombre, número de parte y cantidad son campos obligatorios.' });
        }

        // Validar que la cantidad sea un número no negativo
        if (typeof cantidad !== 'number' || cantidad < 0) {
            logActivity(requestorUserId, 'crear_parte', 'ParteRepuesto', null, { ...req.body, resultado_intento: 'cantidad_invalida' }, 'FALLO', ip_origen);
            await t.rollback();
            return res.status(400).json({ message: 'La cantidad debe ser un número no negativo.' });
        }

        // Validar si el número de parte ya existe
        const existingPart = await ParteRepuesto.findOne({ where: { numero_parte }, transaction: t });
        if (existingPart) {
            logActivity(requestorUserId, 'crear_parte', 'ParteRepuesto', null, { ...req.body, resultado_intento: 'numero_parte_existente' }, 'FALLO', ip_origen);
            await t.rollback();
            return res.status(409).json({ message: `El número de parte '${numero_parte}' ya existe.` });
        }

        // Si se proporciona un proveedor_id, verificar que el proveedor exista
        if (proveedor_id) {
            const proveedor = await Proveedor.findByPk(proveedor_id, { transaction: t });
            if (!proveedor) {
                logActivity(requestorUserId, 'crear_parte', 'ParteRepuesto', null, { ...req.body, resultado_intento: 'proveedor_no_encontrado' }, 'FALLO', ip_origen);
                await t.rollback();
                return res.status(404).json({ message: 'Proveedor no encontrado con el ID proporcionado.' });
            }
        }

        // Crear la nueva parte/repuesto
        const nuevaParte = await ParteRepuesto.create({
            nombre,
            descripcion,
            numero_parte,
            cantidad,
            ubicacion,
            precio_compra,
            precio_venta_sugerido,
            unidad_medida,
            categoria,
            proveedor_id
        }, { transaction: t });

        // Registrar actividad de creación exitosa
        await logActivity(requestorUserId, 'crear_parte', 'ParteRepuesto', nuevaParte.id, nuevaParte.toJSON(), 'EXITO', ip_origen);

        await t.commit(); // Confirma la transacción
        res.status(201).json({ message: 'Parte/repuesto creado exitosamente.', parte: nuevaParte });

    } catch (error) {
        await t.rollback(); // Revierte la transacción en caso de error
        console.error('Error al crear parte/repuesto:', error);
        await logActivity(requestorUserId, 'crear_parte', 'ParteRepuesto', null, { ...req.body, error: error.message }, 'FALLO', ip_origen);
        res.status(500).json({ message: 'Error interno del servidor al crear parte/repuesto.', error: error.message });
    }
});

/**
 * @route GET /api/partes
 * @description Obtiene todas las partes/repuestos, con opciones de búsqueda y paginación.
 * @access Private (Todos los usuarios autenticados)
 * @queryparam {string} search - Término de búsqueda para nombre o número de parte.
 * @queryparam {string} categoria - Filtra por categoría.
 * @queryparam {number} min_cantidad - Filtra por cantidad mínima.
 * @queryparam {number} max_cantidad - Filtra por cantidad máxima.
 * @queryparam {number} page - Número de página para paginación (por defecto 1).
 * @queryparam {number} limit - Límite de ítems por página (por defecto 10).
 */
router.get('/', verifyAccessToken, authorizeRoles(['administrador', 'operador', 'consulta']), async (req, res) => {
    const { search, categoria, min_cantidad, max_cantidad, page = 1, limit = 10 } = req.query;
    const requestorUserId = req.user.id;
    const ip_origen = req.ip;
    let logResult = 'FALLO';

    try {
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const whereClause = {};

        // Filtro por búsqueda (nombre o numero_parte)
        if (search) {
            whereClause[Op.or] = [
                { nombre: { [Op.iLike]: `%${search}%` } }, // Búsqueda insensible a mayúsculas/minúsculas
                { numero_parte: { [Op.iLike]: `%${search}%` } }
            ];
        }

        // Filtro por categoría
        if (categoria) {
            whereClause.categoria = { [Op.iLike]: `%${categoria}%` };
        }

        // Filtro por rango de cantidad
        if (min_cantidad !== undefined && min_cantidad !== null) {
            whereClause.cantidad = { ...whereClause.cantidad, [Op.gte]: parseInt(min_cantidad) };
        }
        if (max_cantidad !== undefined && max_cantidad !== null) {
            whereClause.cantidad = { ...whereClause.cantidad, [Op.lte]: parseInt(max_cantidad) };
        }

        const { count, rows: partes } = await ParteRepuesto.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: offset,
            include: { // Incluir información del proveedor asociado
                model: Proveedor,
                as: 'proveedor', // Asegúrate de que 'as' coincida con la asociación en index.js
                attributes: ['id', 'nombre', 'contacto_principal'] // Atributos a incluir del proveedor
            },
            order: [['nombre', 'ASC']] // Ordenar por nombre alfabéticamente
        });

        logResult = 'EXITO';
        await logActivity(requestorUserId, 'listar_partes', 'ParteRepuesto', null, { query: req.query, count: partes.length }, 'EXITO', ip_origen);

        res.status(200).json({
            totalItems: count,
            currentPage: parseInt(page),
            itemsPerPage: parseInt(limit),
            totalPages: Math.ceil(count / parseInt(limit)),
            partes
        });

    } catch (error) {
        console.error('Error al obtener partes/repuestos:', error);
        await logActivity(requestorUserId, 'listar_partes', 'ParteRepuesto', null, { query: req.query, error: error.message }, 'FALLO', ip_origen);
        res.status(500).json({ message: 'Error interno del servidor al obtener partes/repuestos.', error: error.message });
    }
});

/**
 * @route GET /api/partes/:id
 * @description Obtiene una parte/repuesto específica por su ID.
 * @access Private (Todos los usuarios autenticados)
 */
router.get('/:id', verifyAccessToken, authorizeRoles(['administrador', 'operador', 'consulta']), async (req, res) => {
    const parteId = req.params.id;
    const requestorUserId = req.user.id;
    const ip_origen = req.ip;
    let logResult = 'FALLO';

    try {
        const parte = await ParteRepuesto.findByPk(parteId, {
            include: { // Incluir información del proveedor asociado
                model: Proveedor,
                as: 'proveedor',
                attributes: ['id', 'nombre', 'contacto_principal']
            }
        });

        if (!parte) {
            logActivity(requestorUserId, 'ver_parte_por_id', 'ParteRepuesto', parteId, { resultado_intento: 'no_encontrado' }, 'FALLO', ip_origen);
            return res.status(404).json({ message: 'Parte/repuesto no encontrado.' });
        }

        logResult = 'EXITO';
        await logActivity(requestorUserId, 'ver_parte_por_id', 'ParteRepuesto', parteId, parte.toJSON(), 'EXITO', ip_origen);
        res.status(200).json(parte);

    } catch (error) {
        console.error('Error al obtener parte/repuesto por ID:', error);
        await logActivity(requestorUserId, 'ver_parte_por_id', 'ParteRepuesto', parteId, { error: error.message }, 'FALLO', ip_origen);
        res.status(500).json({ message: 'Error interno del servidor al obtener parte/repuesto por ID.', error: error.message });
    }
});

/**
 * @route PUT /api/partes/:id
 * @description Actualiza una parte/repuesto existente.
 * @access Private (Solo Administradores y Operadores)
 */
router.put('/:id', verifyAccessToken, authorizeRoles(['administrador', 'operador']), async (req, res) => {
    const parteId = req.params.id;
    const requestorUserId = req.user.id;
    const ip_origen = req.ip;
    const {
        nombre,
        descripcion,
        numero_parte,
        cantidad,
        ubicacion,
        precio_compra,
        precio_venta_sugerido,
        unidad_medida,
        categoria,
        proveedor_id
    } = req.body;

    const t = await sequelize.transaction();
    let logResult = 'FALLO';
    let oldParteData = null;

    try {
        const parte = await ParteRepuesto.findByPk(parteId, { transaction: t });

        if (!parte) {
            await t.rollback();
            logActivity(requestorUserId, 'actualizar_parte', 'ParteRepuesto', parteId, { resultado_intento: 'no_encontrado' }, 'FALLO', ip_origen);
            return res.status(404).json({ message: 'Parte/repuesto no encontrado.' });
        }

        oldParteData = parte.toJSON(); // Guarda los datos antiguos para el log

        // Verificar si el nuevo número de parte ya existe en otra parte
        if (numero_parte !== undefined && numero_parte !== parte.numero_parte) {
            const existingPart = await ParteRepuesto.findOne({
                where: { numero_parte, id: { [Op.ne]: parteId } }, // Busca si el número de parte ya existe en otra parte
                transaction: t
            });
            if (existingPart) {
                await t.rollback();
                logActivity(requestorUserId, 'actualizar_parte', 'ParteRepuesto', parteId, { ...req.body, resultado_intento: 'numero_parte_duplicado' }, 'FALLO', ip_origen);
                return res.status(409).json({ message: `El número de parte '${numero_parte}' ya está en uso por otra parte.` });
            }
        }

        // Si se proporciona un proveedor_id, verificar que el proveedor exista
        if (proveedor_id) {
            const proveedor = await Proveedor.findByPk(proveedor_id, { transaction: t });
            if (!proveedor) {
                logActivity(requestorUserId, 'actualizar_parte', 'ParteRepuesto', parteId, { ...req.body, resultado_intento: 'proveedor_no_encontrado' }, 'FALLO', ip_origen);
                await t.rollback();
                return res.status(404).json({ message: 'Proveedor no encontrado con el ID proporcionado.' });
            }
        } else if (proveedor_id === null) {
            // Permite desvincular un proveedor si se envía null
            // Esto es importante si el campo `proveedor_id` es `allowNull: true`
        }

        // Validar que la cantidad sea un número no negativo si se proporciona
        if (cantidad !== undefined && (typeof cantidad !== 'number' || cantidad < 0)) {
             logActivity(requestorUserId, 'actualizar_parte', 'ParteRepuesto', parteId, { ...req.body, resultado_intento: 'cantidad_invalida' }, 'FALLO', ip_origen);
             await t.rollback();
             return res.status(400).json({ message: 'La cantidad debe ser un número no negativo.' });
        }

        // Actualizar la parte/repuesto
        await parte.update({
            nombre,
            descripcion,
            numero_parte,
            cantidad,
            ubicacion,
            precio_compra,
            precio_venta_sugerido,
            unidad_medida,
            categoria,
            proveedor_id
        }, { transaction: t });

        const updatedParteData = parte.toJSON();
        const changes = {};
        // Registrar solo los cambios que realmente ocurrieron para el log
        for (const key in req.body) {
            if (oldParteData[key] !== updatedParteData[key]) {
                changes[key] = { old: oldParteData[key], new: updatedParteData[key] };
            }
        }
        if (Object.keys(changes).length === 0) {
             // Si no hubo cambios, no se registra la actividad como "EXITO" de actualización
             await t.commit();
             return res.status(200).json({ message: 'No se realizaron cambios en la parte/repuesto (datos idénticos o campos no proporcionados).', parte });
        }

        logResult = 'EXITO';
        await logActivity(requestorUserId, 'actualizar_parte', 'ParteRepuesto', parte.id, changes, 'EXITO', ip_origen);

        await t.commit();
        res.status(200).json({ message: 'Parte/repuesto actualizado exitosamente.', parte });

    } catch (error) {
        await t.rollback();
        console.error('Error al actualizar parte/repuesto:', error);
        await logActivity(requestorUserId, 'actualizar_parte', 'ParteRepuesto', parteId, { ...req.body, error: error.message }, 'FALLO', ip_origen);
        res.status(500).json({ message: 'Error interno del servidor al actualizar parte/repuesto.', error: error.message });
    }
});

/**
 * @route DELETE /api/partes/:id
 * @description Elimina una parte/repuesto.
 * @access Private (Solo Administradores)
 */
router.delete('/:id', verifyAccessToken, authorizeRoles(['administrador']), async (req, res) => {
    const parteId = req.params.id;
    const requestorUserId = req.user.id;
    const ip_origen = req.ip;

    const t = await sequelize.transaction();
    let logResult = 'FALLO';
    let deletedParteData = null;

    try {
        const parte = await ParteRepuesto.findByPk(parteId, { transaction: t });

        if (!parte) {
            await t.rollback();
            logActivity(requestorUserId, 'eliminar_parte', 'ParteRepuesto', parteId, { resultado_intento: 'no_encontrado' }, 'FALLO', ip_origen);
            return res.status(404).json({ message: 'Parte/repuesto no encontrado.' });
        }

        deletedParteData = parte.toJSON(); // Guarda los datos para el log

        await parte.destroy({ transaction: t }); // Elimina la parte
        await t.commit();
        logResult = 'EXITO';

        await logActivity(requestorUserId, 'eliminar_parte', 'ParteRepuesto', parteId, deletedParteData, 'EXITO', ip_origen);
        res.status(200).json({ message: 'Parte/repuesto eliminado exitosamente.' });

    } catch (error) {
        await t.rollback();
        console.error('Error al eliminar parte/repuesto:', error);
        // Si hay movimientos de inventario asociados, SequelizeForeignKeyConstraintError prevendrá la eliminación
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            await logActivity(requestorUserId, 'eliminar_parte', 'ParteRepuesto', parteId, { error: 'Violación de integridad referencial', details: error.message }, 'FALLO', ip_origen);
            return res.status(409).json({ message: 'No se puede eliminar la parte/repuesto porque tiene movimientos de inventario asociados. Primero elimina los movimientos relacionados.', error: error.message });
        }
        await logActivity(requestorUserId, 'eliminar_parte', 'ParteRepuesto', parteId, { error: error.message }, 'FALLO', ip_origen);
        res.status(500).json({ message: 'Error interno del servidor al eliminar parte/repuesto.', error: error.message });
    }
});

module.exports = router;