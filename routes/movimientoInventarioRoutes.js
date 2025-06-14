// routes/movimientoInventarioRoutes.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');

// Importa los modelos necesarios
const { MovimientoInventario, ParteRepuesto, Usuario, RegistroActividad } = require('../models');
// Importa las funciones de seguridad
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

// --- Rutas CRUD para Movimientos de Inventario ---

/**
 * @route POST /api/movimientos
 * @description Registra un nuevo movimiento de inventario (entrada o salida) y actualiza la cantidad de la parte.
 * @access Private (Solo Administradores y Operadores)
 */
router.post('/', verifyAccessToken, authorizeRoles(['administrador', 'operador']), async (req, res) => {
        
    const {
        parte_repuesto_id,
        tipo_movimiento, // 'entrada' o 'salida'
        cantidad,
        descripcion_movimiento
    } = req.body;
    const requestorUserId = req.user.id;
    const ip_origen = req.ip;
    let logResult = 'FALLO';
    let parteIdToLog = parte_repuesto_id; // Para el log, incluso si la parte no se encuentra

    // Inicia una transacción para asegurar la atomicidad de la operación
    // (Crear movimiento y actualizar parte deben ser una sola operación lógica)
    const t = await sequelize.transaction();

    try {
        // 1. Validar campos requeridos
        if (!parte_repuesto_id || !tipo_movimiento || cantidad === undefined || cantidad === null) {
            logActivity(requestorUserId, 'registrar_movimiento', 'MovimientoInventario', null, { ...req.body, resultado_intento: 'campos_obligatorios_faltantes' }, 'FALLO', ip_origen);
            await t.rollback();
            return res.status(400).json({ message: 'ID de parte/repuesto, tipo de movimiento y cantidad son obligatorios.' });
        }

        // 2. Validar tipo de movimiento
        const tiposValidos = ['entrada', 'salida'];
        if (!tiposValidos.includes(tipo_movimiento.toLowerCase())) {
            logActivity(requestorUserId, 'registrar_movimiento', 'MovimientoInventario', null, { ...req.body, resultado_intento: 'tipo_movimiento_invalido' }, 'FALLO', ip_origen);
            await t.rollback();
            return res.status(400).json({ message: 'Tipo de movimiento inválido. Debe ser "entrada" o "salida".' });
        }

        // 3. Validar cantidad
        const cantidadNum = parseInt(cantidad);
        if (isNaN(cantidadNum) || cantidadNum <= 0) {
            logActivity(requestorUserId, 'registrar_movimiento', 'MovimientoInventario', null, { ...req.body, resultado_intento: 'cantidad_invalida' }, 'FALLO', ip_origen);
            await t.rollback();
            return res.status(400).json({ message: 'La cantidad debe ser un número positivo válido.' });
        }

        // 4. Buscar la parte/repuesto
        const parte = await ParteRepuesto.findByPk(parte_repuesto_id, { transaction: t });
        if (!parte) {
            logActivity(requestorUserId, 'registrar_movimiento', 'MovimientoInventario', parte_repuesto_id, { ...req.body, resultado_intento: 'parte_no_encontrada' }, 'FALLO', ip_origen);
            await t.rollback();
            return res.status(404).json({ message: 'Parte/repuesto no encontrado.' });
        }

        let nuevaCantidad = parte.cantidad;
        const cantidadPrevia = parte.cantidad; // Guardar para el log

        // 5. Calcular la nueva cantidad según el tipo de movimiento
        if (tipo_movimiento.toLowerCase() === 'entrada') {
            nuevaCantidad += cantidadNum;
        } else { // 'salida'
            if (parte.cantidad < cantidadNum) {
                logActivity(requestorUserId, 'registrar_movimiento', 'MovimientoInventario', parte_repuesto_id, { ...req.body, resultado_intento: 'stock_insuficiente', stock_actual: parte.cantidad }, 'FALLO', ip_origen);
                await t.rollback();
                return res.status(400).json({ message: `No hay suficiente stock de '<span class="math-inline">\{parte\.nombre\}' \(</span>{parte.cantidad} disponibles) para una salida de ${cantidadNum}.` });
            }
            nuevaCantidad -= cantidadNum;
        }

        // 6. Actualizar la cantidad de la parte/repuesto
        await parte.update({ cantidad: nuevaCantidad }, { transaction: t });

        // 7. Crear el registro del movimiento de inventario
        const nuevoMovimiento = await MovimientoInventario.create({
            parte_repuesto_id,
            usuario_id: requestorUserId, // El usuario que realizó el movimiento
            tipo_movimiento: tipo_movimiento.toLowerCase(),
            cantidad: cantidadNum,
            cantidad_antes_movimiento: cantidadPrevia, // Cantidad que había antes del movimiento
            cantidad_despues_movimiento: nuevaCantidad, // Cantidad después del movimiento
            descripcion_movimiento
        }, { transaction: t });

        // Registrar actividad de creación exitosa
        logResult = 'EXITO';
        await logActivity(requestorUserId, 'registrar_movimiento', 'MovimientoInventario', nuevoMovimiento.id, {
            movimiento: nuevoMovimiento.toJSON(),
            parte_previa: { cantidad: cantidadPrevia },
            parte_actual: { cantidad: nuevaCantidad }
        }, 'EXITO', ip_origen);

        await t.commit(); // Confirma la transacción
        res.status(201).json({
            message: 'Movimiento registrado y cantidad de parte/repuesto actualizada exitosamente.',
            movimiento: nuevoMovimiento,
            parte_actualizada: {
                id: parte.id,
                nombre: parte.nombre,
                cantidad_actual: nuevaCantidad
            }
        });

    } catch (error) {
        await t.rollback(); // Revierte la transacción en caso de error
        console.error('Error al registrar movimiento de inventario:', error);
        await logActivity(requestorUserId, 'registrar_movimiento', 'MovimientoInventario', parteIdToLog, { ...req.body, error: error.message }, 'FALLO', ip_origen);
        res.status(500).json({ message: 'Error interno del servidor al registrar movimiento de inventario.', error: error.message });
    }
});

/**
 * @route GET /api/movimientos
 * @description Obtiene todos los movimientos de inventario, con opciones de filtrado y paginación.
 * @access Private (Todos los usuarios autenticados)
 * @queryparam {string} tipo - Filtra por tipo de movimiento ('entrada' o 'salida').
 * @queryparam {number} parte_id - Filtra por ID de parte/repuesto.
 * @queryparam {number} usuario_id - Filtra por ID de usuario que realizó el movimiento.
 * @queryparam {string} start_date - Fecha de inicio para filtrar (YYYY-MM-DD).
 * @queryparam {string} end_date - Fecha de fin para filtrar (YYYY-MM-DD).
 * @queryparam {number} page - Número de página (por defecto 1).
 * @queryparam {number} limit - Límite de ítems por página (por defecto 10).
 */
router.get('/', verifyAccessToken, authorizeRoles(['administrador', 'operador', 'consulta']), async (req, res) => {
    const { tipo, parte_id, usuario_id, start_date, end_date, page = 1, limit = 10 } = req.query;
    const requestorUserId = req.user.id;
    const ip_origen = req.ip;
    let logResult = 'FALLO';

    try {
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const whereClause = {};

        // Filtro por tipo de movimiento
        if (tipo) {
            const tipoLower = tipo.toLowerCase();
            if (['entrada', 'salida'].includes(tipoLower)) {
                whereClause.tipo_movimiento = tipoLower;
            } else {
                await logActivity(requestorUserId, 'listar_movimientos', 'MovimientoInventario', null, { query: req.query, resultado_intento: 'tipo_movimiento_invalido_query' }, 'FALLO', ip_origen);
                return res.status(400).json({ message: 'Tipo de movimiento inválido en la consulta. Debe ser "entrada" o "salida".' });
            }
        }

        // Filtro por ID de parte/repuesto
        if (parte_id) {
            whereClause.parte_repuesto_id = parseInt(parte_id);
        }

        // Filtro por ID de usuario
        if (usuario_id) {
            whereClause.usuario_id = parseInt(usuario_id);
        }

        // Filtro por rango de fechas
        if (start_date || end_date) {
            whereClause.fecha_movimiento = {};
            if (start_date) {
                whereClause.fecha_movimiento[Op.gte] = new Date(start_date + 'T00:00:00.000Z'); // Inicio del día
            }
            if (end_date) {
                whereClause.fecha_movimiento[Op.lte] = new Date(end_date + 'T23:59:59.999Z'); // Fin del día
            }
        }

        const { count, rows: movimientos } = await MovimientoInventario.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: offset,
            // Incluir relaciones para mostrar más detalles
            include: [
                {
                    model: ParteRepuesto,
                    as: 'parteRepuesto',
                    attributes: ['id', 'nombre', 'numero_parte', 'cantidad'] // Cantidad actual de la parte
                },
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombre_usuario', 'rol']
                }
            ],
            order: [['fecha_movimiento', 'DESC']] // Ordenar por fecha del más reciente al más antiguo
        });

        logResult = 'EXITO';
        await logActivity(requestorUserId, 'listar_movimientos', 'MovimientoInventario', null, { query: req.query, count: movimientos.length }, 'EXITO', ip_origen);

        res.status(200).json({
            totalItems: count,
            currentPage: parseInt(page),
            itemsPerPage: parseInt(limit),
            totalPages: Math.ceil(count / parseInt(limit)),
            movimientos
        });

    } catch (error) {
        console.error('Error al obtener movimientos de inventario:', error);
        await logActivity(requestorUserId, 'listar_movimientos', 'MovimientoInventario', null, { query: req.query, error: error.message }, 'FALLO', ip_origen);
        res.status(500).json({ message: 'Error interno del servidor al obtener movimientos de inventario.', error: error.message });
    }
});

/**
 * @route GET /api/movimientos/:id
 * @description Obtiene un movimiento de inventario específico por su ID.
 * @access Private (Todos los usuarios autenticados)
 */
router.get('/:id', verifyAccessToken, authorizeRoles(['administrador', 'operador', 'consulta']), async (req, res) => {
    const movimientoId = req.params.id;
    const requestorUserId = req.user.id;
    const ip_origen = req.ip;
    let logResult = 'FALLO';

    try {
        const movimiento = await MovimientoInventario.findByPk(movimientoId, {
            include: [
                {
                    model: ParteRepuesto,
                    as: 'parteRepuesto',
                    attributes: ['id', 'nombre', 'numero_parte', 'cantidad']
                },
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombre_usuario', 'rol']
                }
            ]
        });

        if (!movimiento) {
            logActivity(requestorUserId, 'ver_movimiento_por_id', 'MovimientoInventario', movimientoId, { resultado_intento: 'no_encontrado' }, 'FALLO', ip_origen);
            return res.status(404).json({ message: 'Movimiento de inventario no encontrado.' });
        }

        logResult = 'EXITO';
        await logActivity(requestorUserId, 'ver_movimiento_por_id', 'MovimientoInventario', movimientoId, movimiento.toJSON(), 'EXITO', ip_origen);
        res.status(200).json(movimiento);

    } catch (error) {
        console.error('Error al obtener movimiento de inventario por ID:', error);
        await logActivity(requestorUserId, 'ver_movimiento_por_id', 'MovimientoInventario', movimientoId, { error: error.message }, 'FALLO', ip_origen);
        res.status(500).json({ message: 'Error interno del servidor al obtener movimiento de inventario por ID.', error: error.message });
    }
});

module.exports = router;