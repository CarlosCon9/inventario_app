// routes/reportesRoutes.js
const express = require('express');
const router = express.Router();
const { Op, Sequelize } = require('sequelize'); // Importa 'Sequelize' (con S mayúscula)
const { sequelize } = require('../config/database'); // Esto sigue siendo necesario para la instancia de conexión

const { ParteRepuesto, Proveedor, MovimientoInventario, Usuario, RegistroActividad } = require('../models');
const { verifyAccessToken, authorizeRoles } = require('../utils/auth');

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

// --- Rutas de Reportes ---

/**
 * @route GET /api/reportes/inventario-actual
 * @description Obtiene el listado completo del inventario actual con detalles.
 * @access Private (Roles: administrador, operador, consulta)
 * @queryparam {string} categoria - Filtra por categoría de parte.
 * @queryparam {string} proveedor_nombre - Filtra por nombre de proveedor.
 * @queryparam {number} page - Número de página (por defecto 1).
 * @queryparam {number} limit - Límite de ítems por página (por defecto 10).
 * @queryparam {string} search - Término de búsqueda general (nombre, número de parte, descripción).
 */
router.get('/inventario-actual', verifyAccessToken, authorizeRoles(['administrador', 'operador', 'consulta']), async (req, res) => {
    const { categoria, proveedor_nombre, page = 1, limit = 10, search } = req.query;
    const requestorUserId = req.user.id;
    const ip_origen = req.ip;
    let logResult = 'FALLO';

    try {
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const whereClause = {};
        const includeClause = [
            {
                model: Proveedor,
                as: 'proveedor',
                attributes: ['id', 'nombre', 'contacto_principal']
            }
        ];

        if (categoria) {
            whereClause.categoria = { [Op.iLike]: `%${categoria}%` };
        }

        if (proveedor_nombre) {
            includeClause[0].where = { nombre: { [Op.iLike]: `%${proveedor_nombre}%` } };
        }

        if (search) {
            whereClause[Op.or] = [
                { nombre: { [Op.iLike]: `%${search}%` } },
                { numero_parte: { [Op.iLike]: `%${search}%` } },
                { descripcion: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows: partes } = await ParteRepuesto.findAndCountAll({
            where: whereClause,
            include: includeClause,
            limit: parseInt(limit),
            offset: offset,
            order: [['nombre', 'ASC']] // Ordenar por nombre de parte por defecto
        });

        logResult = 'EXITO';
        await logActivity(requestorUserId, 'generar_reporte_inventario_actual', 'Reporte', null, { query: req.query, count: partes.length }, 'EXITO', ip_origen);

        res.status(200).json({
            totalItems: count,
            currentPage: parseInt(page),
            itemsPerPage: parseInt(limit),
            totalPages: Math.ceil(count / parseInt(limit)),
            partes
        });

    } catch (error) {
        console.error('Error al generar el reporte de inventario actual:', error);
        await logActivity(requestorUserId, 'generar_reporte_inventario_actual', 'Reporte', null, { query: req.query, error: error.message }, 'FALLO', ip_origen);
        res.status(500).json({ message: 'Error interno del servidor al generar el reporte de inventario actual.', error: error.message });
    }
});

/**
 * @route GET /api/reportes/bajo-stock
 * @description Obtiene el listado de partes/repuestos con stock por debajo del umbral mínimo.
 * @access Private (Roles: administrador, operador, consulta)
 * @queryparam {string} categoria - Filtra por categoría de parte.
 * @queryparam {string} proveedor_nombre - Filtra por nombre de proveedor.
 * @queryparam {number} page - Número de página (por defecto 1).
 * @queryparam {number} limit - Límite de ítems por página (por defecto 10).
 * @queryparam {string} search - Término de búsqueda general (nombre, número de parte, descripción).
 */
router.get('/bajo-stock', verifyAccessToken, authorizeRoles(['administrador', 'operador', 'consulta']), async (req, res) => {
    const { categoria, proveedor_nombre, page = 1, limit = 10, search } = req.query;
    const requestorUserId = req.user.id;
    const ip_origen = req.ip;
    let logResult = 'FALLO';

    try {
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const whereClause = {
            cantidad: { [Op.lte]: sequelize.col('ParteRepuesto.cantidad_minima') } // Stock actual <= cantidad mínima
        };
        const includeClause = [
            {
                model: Proveedor,
                as: 'proveedor',
                attributes: ['id', 'nombre', 'contacto_principal']
            }
        ];

        if (categoria) {
            whereClause.categoria = { [Op.iLike]: `%${categoria}%` };
        }

        if (proveedor_nombre) {
            includeClause[0].where = { nombre: { [Op.iLike]: `%${proveedor_nombre}%` } };
        }

        if (search) {
            whereClause[Op.or] = [
                { nombre: { [Op.iLike]: `%${search}%` } },
                { numero_parte: { [Op.iLike]: `%${search}%` } },
                { descripcion: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows: partes } = await ParteRepuesto.findAndCountAll({
            where: whereClause,
            include: includeClause,
            limit: parseInt(limit),
            offset: offset,
            order: [['nombre', 'ASC']]
        });

        logResult = 'EXITO';
        await logActivity(requestorUserId, 'generar_reporte_bajo_stock', 'Reporte', null, { query: req.query, count: partes.length }, 'EXITO', ip_origen);

        res.status(200).json({
            totalItems: count,
            currentPage: parseInt(page),
            itemsPerPage: parseInt(limit),
            totalPages: Math.ceil(count / parseInt(limit)),
            partes
        });

    } catch (error) {
        console.error('Error al generar el reporte de bajo stock:', error);
        await logActivity(requestorUserId, 'generar_reporte_bajo_stock', 'Reporte', null, { query: req.query, error: error.message }, 'FALLO', ip_origen);
        res.status(500).json({ message: 'Error interno del servidor al generar el reporte de bajo stock.', error: error.message });
    }
});


/**
 * @route GET /api/reportes/movimientos-filtrados
 * @description Obtiene movimientos de inventario filtrados con más opciones.
 * @access Private (Todos los usuarios autenticados)
 * @queryparam {string} tipo - Filtra por tipo de movimiento ('entrada' o 'salida').
 * @queryparam {number} parte_id - Filtra por ID de parte/repuesto.
 * @queryparam {number} usuario_id - Filtra por ID de usuario que realizó el movimiento.
 * @queryparam {string} start_date - Fecha de inicio para filtrar (YYYY-MM-DD).
 * @queryparam {string} end_date - Fecha de fin para filtrar (YYYY-MM-DD).
 * @queryparam {string} search - Término de búsqueda general (nombre de parte, número de parte, descripción del movimiento).
 * @queryparam {number} page - Número de página (por defecto 1).
 * @queryparam {number} limit - Límite de ítems por página (por defecto 10).
 */
router.get('/movimientos-filtrados', verifyAccessToken, authorizeRoles(['administrador', 'operador', 'consulta']), async (req, res) => {
    const { tipo, parte_id, usuario_id, start_date, end_date, search, page = 1, limit = 10 } = req.query;
    const requestorUserId = req.user.id;
    const ip_origen = req.ip;
    let logResult = 'FALLO';

    try {
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const whereClause = {};
        const includeClause = [
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
        ];

        // Filtro por tipo de movimiento
        if (tipo) {
            const tipoLower = tipo.toLowerCase();
            if (['entrada', 'salida'].includes(tipoLower)) {
                whereClause.tipo_movimiento = tipoLower;
            } else {
                await logActivity(requestorUserId, 'generar_reporte_movimientos', 'Reporte', null, { query: req.query, resultado_intento: 'tipo_movimiento_invalido_query' }, 'FALLO', ip_origen);
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

        // Filtro por rango de fechas (usando fecha_movimiento que ahora es la columna correcta)
        if (start_date || end_date) {
            whereClause.fecha_movimiento = {};
            if (start_date) {
                whereClause.fecha_movimiento[Op.gte] = new Date(start_date + 'T00:00:00.000Z');
            }
            if (end_date) {
                whereClause.fecha_movimiento[Op.lte] = new Date(end_date + 'T23:59:59.999Z');
            }
        }

        // Filtro de búsqueda general en movimientos
        if (search) {
            whereClause[Op.or] = [
                { descripcion_movimiento: { [Op.iLike]: `%${search}%` } },
                { '$parteRepuesto.nombre$': { [Op.iLike]: `%${search}%` } }, // Busca en el nombre de la parte asociada
                { '$parteRepuesto.numero_parte$': { [Op.iLike]: `%${search}%` } } // Busca en el número de parte asociada
            ];
        }


        const { count, rows: movimientos } = await MovimientoInventario.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: offset,
            include: includeClause,
            order: [['fecha_movimiento', 'DESC']]
        });

        logResult = 'EXITO';
        await logActivity(requestorUserId, 'generar_reporte_movimientos', 'Reporte', null, { query: req.query, count: movimientos.length }, 'EXITO', ip_origen);

        res.status(200).json({
            totalItems: count,
            currentPage: parseInt(page),
            itemsPerPage: parseInt(limit),
            totalPages: Math.ceil(count / parseInt(limit)),
            movimientos
        });

    } catch (error) {
        console.error('Error al generar el reporte de movimientos filtrados:', error);
        await logActivity(requestorUserId, 'generar_reporte_movimientos', 'Reporte', null, { query: req.query, error: error.message }, 'FALLO', ip_origen);
        res.status(500).json({ message: 'Error interno del servidor al generar el reporte de movimientos filtrados.', error: error.message });
    }
});

module.exports = router;