// controllers/reportesController.js
const { Op, Sequelize } = require('sequelize');
const { ParteRepuesto, Proveedor, MovimientoInventario, Usuario, RegistroActividad } = require('../models');

// @desc    Generar un reporte de partes con bajo stock
// @route   GET /api/reportes/bajo-stock
// @access  Private (Admin, Operador)
exports.getReporteBajoStock = async (req, res) => {
    try {
        const partesBajoStock = await ParteRepuesto.findAll({
            where: {
                // La cantidad actual es menor o igual a la cantidad mínima definida
                cantidad: {
                    [Op.lte]: Sequelize.col('cantidad_minima')
                },
                // Y la cantidad mínima es mayor a 0 para no incluir items no configurados
                cantidad_minima: {
                    [Op.gt]: 0
                }
            },
            include: [{
                model: Proveedor,
                as: 'proveedor',
                attributes: ['id', 'nombre']
            }],
            order: [['nombre', 'ASC']]
        });

        // Registrar la actividad (opcional pero recomendado)
        // await req.logActivity('generar_reporte_bajo_stock', 'Reporte', null, { count: partesBajoStock.length }, 'EXITO');

        res.status(200).json(partesBajoStock);

    } catch (error) {
        console.error('Error al generar reporte de bajo stock:', error);
        // await req.logActivity('generar_reporte_bajo_stock', 'Reporte', null, { error: error.message }, 'FALLO');
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * @desc    Generar un reporte del valor total del inventario.
 * @route   GET /api/reportes/valor-inventario
 * @access  Private (Admin, Operador)
 */
exports.getReporteValorInventario = async (req, res) => {
    try {
        // Opción 1: Calcular el valor total de todo el inventario
        const resultadoTotal = await ParteRepuesto.findOne({
            attributes: [
                // Usamos Sequelize.fn para llamar a la función SUM de SQL
                // y Sequelize.literal para escribir una expresión matemática segura
                [Sequelize.fn('SUM', Sequelize.literal('cantidad * precio_compra')), 'valorTotalInventario']
            ],
            raw: true // Devuelve un objeto JSON simple en lugar de una instancia de modelo
        });

        // Opción 2: Calcular el valor del inventario agrupado por categoría
        const valorPorCategoria = await ParteRepuesto.findAll({
            attributes: [
                'categoria',
                [Sequelize.fn('SUM', Sequelize.literal('cantidad * precio_compra')), 'valorTotalCategoria'],
                [Sequelize.fn('SUM', Sequelize.col('cantidad')), 'cantidadTotalItems']
            ],
            group: ['categoria'], // Agrupamos los resultados por el campo 'categoria'
            order: [['categoria', 'ASC']]
        });
        
        // await req.logActivity('generar_reporte_valor', 'Reporte', null, { /* detalles */ }, 'EXITO');

        res.status(200).json({
            valorTotalInventario: parseFloat(resultadoTotal.valorTotalInventario) || 0,
            valorPorCategoria: valorPorCategoria
        });

    } catch (error) {
        console.error('Error al generar reporte de valor de inventario:', error);
        // await req.logActivity('generar_reporte_valor', 'Reporte', null, { error: error.message }, 'FALLO');
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};