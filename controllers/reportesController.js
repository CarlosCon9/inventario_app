// controllers/reportesController.js
const { Op, Sequelize } = require('sequelize');
const { ParteRepuesto, Proveedor, MovimientoInventario, Usuario } = require('../models');

// La función getDashboardStats se mantiene igual
exports.getDashboardStats = async (req, res) => {
    try {
        const [
            valoresResult,
            itemsUnicosResult,
            proveedoresActivosResult,
            valorPorCategoriaResult
        ] = await Promise.all([
            ParteRepuesto.findOne({
                attributes: [
                    [Sequelize.fn('SUM', Sequelize.literal('cantidad * precio_compra')), 'valorTotalInventario'],
                    [Sequelize.fn('SUM', Sequelize.literal('cantidad * precio_venta_sugerido')), 'valorTotalVenta']
                ],
                raw: true
            }),
            ParteRepuesto.count(),
            Proveedor.count(),
            ParteRepuesto.findAll({
                attributes: [
                    'categoria',
                    [Sequelize.fn('SUM', Sequelize.literal('cantidad * precio_compra')), 'valorTotalCategoria'],
                ],
                where: { categoria: { [Op.ne]: null }, precio_compra: { [Op.gt]: 0 } },
                group: ['categoria'],
                raw: true
            })
        ]);

        const stats = {
            valorTotalInventario: parseFloat(valoresResult.valorTotalInventario) || 0,
            valorTotalVenta: parseFloat(valoresResult.valorTotalVenta) || 0,
            itemsUnicos: itemsUnicosResult || 0,
            proveedoresActivos: proveedoresActivosResult || 0,
            valorPorCategoria: valorPorCategoriaResult || [],
        };
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error al generar estadísticas del dashboard:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// La función getReporteBajoStock se mantiene igual
exports.getReporteBajoStock = async (req, res) => {
    try {
        const partesBajoStock = await ParteRepuesto.findAll({
            where: {
                [Op.and]: [
                    Sequelize.where(Sequelize.col('cantidad'), Op.lte, Sequelize.col('cantidad_minima')),
                    { cantidad_minima: { [Op.gt]: 0 } }
                ]
            },
            order: [['nombre', 'ASC']]
        });
        res.status(200).json(partesBajoStock);
    } catch (error) {
        console.error('Error al generar reporte de bajo stock:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * @controller  getMovimientosRecientes
 * @description Devuelve los últimos 5 movimientos de inventario.
 */
exports.getMovimientosRecientes = async (req, res) => {
    try {
        const movimientos = await MovimientoInventario.findAll({
            limit: 5,
            order: [['fecha_movimiento', 'DESC']],
            include: [
                {
                    model: ParteRepuesto,
                    as: 'parteRepuesto', // Cambiado de 'parte_repuesto'
                    attributes: ['nombre']
                },
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['nombre_usuario']
                }
            ]
        });
        res.status(200).json(movimientos);
    } catch (error) {
        console.error('Error al obtener movimientos recientes:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};