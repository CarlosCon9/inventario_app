// controllers/reportesController.js

/**
 * ==================================================================================
 * 1. IMPORTACIONES NECESARIAS
 * ==================================================================================
 * Importamos las herramientas de Sequelize para construir las consultas
 * y los modelos de nuestra base de datos con los que vamos a interactuar.
 */
const { Op, Sequelize } = require('sequelize');
const { ParteRepuesto, Proveedor } = require('../models');


/**
 * ==================================================================================
 * 2. CONTROLADORES EXPORTADOS
 * ==================================================================================
 */

/**
 * @controller  getDashboardStats
 * @description Obtiene todas las estadísticas numéricas clave para el Dashboard en una sola llamada.
 * Esta es la forma más eficiente de cargar los KPIs (Indicadores Clave de Rendimiento).
 * @route       GET /api/reportes/dashboard-stats
 * @access      Private (Solo Administradores)
 */
exports.getDashboardStats = async (req, res) => {
    try {
        // Usamos Promise.all para ejecutar todas las consultas a la base de datos en paralelo,
        // lo cual es mucho más rápido que hacerlas una por una.
        const [
            valorTotalResult,
            itemsUnicosResult,
            proveedoresActivosResult,
            bajoStockCountResult
        ] = await Promise.all([
            // Consulta 1: Suma el valor total del inventario (cantidad * precio_compra).
            ParteRepuesto.findOne({
                attributes: [
                    [Sequelize.fn('SUM', Sequelize.literal('cantidad * precio_compra')), 'valorTotalInventario']
                ],
                raw: true
            }),
            // Consulta 2: Cuenta el número total de tipos de partes únicas (filas en la tabla).
            ParteRepuesto.count(),
            // Consulta 3: Cuenta el número de proveedores activos.
            Proveedor.count(),
            // Consulta 4: Cuenta cuántos ítems cumplen la condición de bajo stock.
            ParteRepuesto.count({
                where: {
                    cantidad: { [Op.lte]: Sequelize.col('cantidad_minima') },
                    cantidad_minima: { [Op.gt]: 0 }
                }
            })
        ]);

        // Formateamos la respuesta en un objeto JSON limpio y predecible para el frontend.
        // Usamos '|| 0' para asegurarnos de que si una consulta no devuelve nada, enviemos un cero en lugar de null.
        const stats = {
            valorTotalInventario: parseFloat(valorTotalResult.valorTotalInventario) || 0,
            itemsUnicos: itemsUnicosResult || 0,
            proveedoresActivos: proveedoresActivosResult || 0,
            itemsBajoStockCount: bajoStockCountResult || 0,
        };

        res.status(200).json(stats);

    } catch (error) {
        // En caso de cualquier error en las consultas, lo registramos en la consola del servidor
        // y enviamos una respuesta de error genérica al cliente.
        console.error('Error al generar estadísticas del dashboard:', error);
        res.status(500).json({ message: 'Error interno del servidor al generar estadísticas.' });
    }
};

/**
 * @controller  getReporteBajoStock
 * @description Genera un reporte con la LISTA DETALLADA de partes con bajo stock.
 * @route       GET /api/reportes/bajo-stock
 * @access      Private (Administradores y Operadores)
 */
exports.getReporteBajoStock = async (req, res) => {
    try {
        const partesBajoStock = await ParteRepuesto.findAll({
            where: {
                // Condición 1: La cantidad actual es menor o igual a la cantidad mínima definida.
                cantidad: { [Op.lte]: Sequelize.col('cantidad_minima') },
                // Condición 2: Y la cantidad mínima es mayor que 0 (para ignorar items no configurados).
                cantidad_minima: { [Op.gt]: 0 }
            },
            // Incluimos información básica del proveedor para cada parte.
            include: [{
                model: Proveedor,
                as: 'proveedor',
                attributes: ['id', 'nombre']
            }],
            order: [['nombre', 'ASC']] // Ordenamos alfabéticamente para una visualización limpia.
        });
        res.status(200).json(partesBajoStock);
    } catch (error) {
        console.error('Error al generar reporte de bajo stock:', error);
        res.status(500).json({ message: 'Error interno del servidor al generar el reporte.' });
    }
};

/**
 * @controller  getReporteValorInventario
 * @description Genera un reporte del valor del inventario, incluyendo el desglose por categoría para el gráfico.
 * @route       GET /api/reportes/valor-inventario
 * @access      Private (Solo Administradores)
 */
exports.getReporteValorInventario = async (req, res) => {
    try {
        // Usamos Promise.all de nuevo para eficiencia.
        const [resultadoTotal, valorPorCategoria] = await Promise.all([
            // Consulta 1: Obtiene el valor total de todo el inventario.
            ParteRepuesto.findOne({
                attributes: [[Sequelize.fn('SUM', Sequelize.literal('cantidad * precio_compra')), 'valorTotalInventario']],
                raw: true
            }),
            // Consulta 2: Obtiene el valor agrupado por cada categoría.
            ParteRepuesto.findAll({
                attributes: [
                    'categoria',
                    [Sequelize.fn('SUM', Sequelize.literal('cantidad * precio_compra')), 'valorTotalCategoria'],
                ],
                where: {
                    categoria: { [Op.ne]: null } // Ignoramos productos sin categoría para un gráfico limpio.
                },
                group: ['categoria'],
                order: [['categoria', 'ASC']],
                raw: true
            })
        ]);
        
        // Enviamos un objeto JSON que contiene ambos resultados.
        res.status(200).json({
            valorTotalInventario: parseFloat(resultadoTotal.valorTotalInventario) || 0,
            valorPorCategoria: valorPorCategoria || []
        });

    } catch (error) {
        console.error('Error al generar reporte de valor de inventario:', error);
        res.status(500).json({ message: 'Error interno del servidor al generar el reporte.' });
    }
};

/**
 * @controller  getListaItemsUnicos
 * @description Devuelve una lista simple con los nombres de todas las partes/repuestos.
 * @route       GET /api/reportes/lista-items-unicos
 * @access      Private (Admin, Operador)
 */
exports.getListaItemsUnicos = async (req, res) => {
    try {
        const items = await ParteRepuesto.findAll({
            attributes: ['id', 'nombre', 'numero_parte'], // Devolvemos id, nombre y número de parte
            order: [['nombre', 'ASC']]
        });
        res.status(200).json(items);
    } catch (error) {
        console.error('Error al generar lista de items únicos:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};