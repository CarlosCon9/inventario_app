// controllers/reportesController.js
const { Op, Sequelize } = require('sequelize');
const { ParteRepuesto, Proveedor } = require('../models');

// ... (Tu función getDashboardStats y getReporteBajoStock se mantienen igual) ...
exports.getDashboardStats = async (req, res) => { /* ... */ };
exports.getReporteBajoStock = async (req, res) => { /* ... */ };

/**
 * @desc    Generar un reporte del valor del inventario, incluyendo el desglose por categoría.
 * @route   GET /api/reportes/valor-inventario
 * @access  Private (Admin)
 */
exports.getReporteValorInventario = async (req, res) => {
    try {
        // Consulta 1: Obtener el valor total de todo el inventario.
        const resultadoTotal = await ParteRepuesto.findOne({
            attributes: [
                [Sequelize.fn('SUM', Sequelize.literal('cantidad * precio_compra')), 'valorTotalInventario']
            ],
            raw: true
        });

        // Consulta 2: Obtener el valor agrupado por cada categoría.
        // Es importante que los productos tengan un valor en el campo 'categoria'.
        const valorPorCategoria = await ParteRepuesto.findAll({
            attributes: [
                'categoria',
                [Sequelize.fn('SUM', Sequelize.literal('cantidad * precio_compra')), 'valorTotalCategoria'],
            ],
            where: {
                categoria: { [Op.ne]: null } // Ignoramos productos sin categoría
            },
            group: ['categoria'],
            order: [['categoria', 'ASC']],
            raw: true
        });

        // Enviamos un objeto JSON que contiene ambos resultados.
        res.status(200).json({
            valorTotalInventario: parseFloat(resultadoTotal.valorTotalInventario) || 0,
            valorPorCategoria: valorPorCategoria || []
        });

    } catch (error) {
        console.error('Error al generar reporte de valor de inventario:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};