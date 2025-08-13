// controllers/reportesController.js
const { Op, Sequelize } = require("sequelize");
const { ParteRepuesto, Proveedor, MovimientoInventario, Usuario } = require("../models");
const xlsx = require("xlsx");

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      valoresResult,
      itemsUnicosResult,
      proveedoresActivosResult,
      valorPorCategoriaResult,
    ] = await Promise.all([
      ParteRepuesto.findOne({
        attributes: [
          [
            Sequelize.fn("SUM", Sequelize.literal("cantidad * precio_compra")),
            "valorTotalInventario",
          ],
          [
            Sequelize.fn(
              "SUM",
              Sequelize.literal("cantidad * precio_venta_sugerido")
            ),
            "valorTotalVenta",
          ],
        ],
        raw: true,
      }),
      ParteRepuesto.count(),
      Proveedor.count(),
      ParteRepuesto.findAll({
        attributes: [
          "categoria",
          [
            Sequelize.fn("SUM", Sequelize.literal("cantidad * precio_compra")),
            "valorTotalCategoria",
          ],
        ],
        where: { categoria: { [Op.ne]: null }, precio_compra: { [Op.gt]: 0 } },
        group: ["categoria"],
        raw: true,
      }),
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
    console.error("Error al generar estadísticas del dashboard:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

exports.getReporteBajoStock = async (req, res) => {
  try {
    const partesBajoStock = await ParteRepuesto.findAll({
      where: {
        [Op.and]: [
          Sequelize.where(
            Sequelize.col("cantidad"),
            Op.lte,
            Sequelize.col("cantidad_minima")
          ),
          { cantidad_minima: { [Op.gt]: 0 } },
        ],
      },
      order: [["nombre", "ASC"]],
    });
    res.status(200).json(partesBajoStock);
  } catch (error) {
    console.error("Error al generar reporte de bajo stock:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

exports.getMovimientosRecientes = async (req, res) => {
  try {
    const movimientos = await MovimientoInventario.findAll({
      limit: 5,
      order: [["fecha_movimiento", "DESC"]],
      include: [
        {
          model: ParteRepuesto,
          as: "parteRepuesto", // Cambiado de 'parte_repuesto'
          attributes: ["nombre"],
        },
        {
          model: Usuario,
          as: "usuario",
          attributes: ["nombre_usuario"],
        },
      ],
    });
    res.status(200).json(movimientos);
  } catch (error) {
    console.error("Error al obtener movimientos recientes:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// --- NUEVAS FUNCIONES PARA EL MÓDULO DE REPORTES ---

/**
 * @controller getReporteStockBajo
 * @description Genera un reporte de partes con stock bajo o igual al mínimo.
 */
exports.getReporteStockBajoDetallado = async (req, res) => {
  try {
    const items = await ParteRepuesto.findAll({
      where: {
        cantidad: { [Op.lte]: Sequelize.col("cantidad_minima") },
        cantidad_minima: { [Op.gt]: 0 },
        activo: true,
      },
      attributes: [
        "nombre",
        ["numero_parte", "N/P"],
        ["cantidad", "Cantidad Actual"],
        ["cantidad_minima", "Cantidad Mínima"],
      ],
      order: [["nombre", "ASC"]],
      raw: true,
    });

    if (req.query.export === "excel") {
      const worksheet = xlsx.utils.json_to_sheet(items);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Stock Bajo");
      const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.header(
        "Content-Disposition",
        'attachment; filename="Reporte_Stock_Bajo.xlsx"'
      );
      return res.send(buffer);
    }
    res.status(200).json(items);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al generar reporte de stock bajo." });
  }
};

exports.getReporteInventarioCompleto = async (req, res) => {
   try {
        const items = await ParteRepuesto.findAll({
            where: { activo: true },
            attributes: [
                'nombre', 
                'numero_parte', 
                'cantidad', 
                'precio_compra', 
                'precio_venta_sugerido', 
                'precio_referencia'
            ],
            order: [['nombre', 'ASC']],
            raw: true
        });
        
        // Formateamos para el Excel con los nombres correctos
        const formattedItemsForExcel = items.map(item => ({
            'Nombre': item.nombre,
            'N/P': item.numero_parte,
            'Cantidad de Stock': item.cantidad,
            'Precio de Compra': item.precio_compra,
            'Precio de Venta': item.precio_venta_sugerido,
            'Precio de Referencia': item.precio_referencia
        }));


    if (req.query.export === "excel") {
      const worksheet = xlsx.utils.json_to_sheet(items);

      // --- LÓGICA PARA APLICAR FORMATO DE MONEDA ---
      const range = xlsx.utils.decode_range(worksheet["!ref"]);
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        // Itera sobre las filas, saltando la cabecera
        for (let C = range.s.c; C <= range.e.c; ++C) {
          // Itera sobre las columnas
          const cell_address = { c: C, r: R };
          const cell_ref = xlsx.utils.encode_cell(cell_address);
          const cell = worksheet[cell_ref];

          // Si la celda corresponde a una de las columnas de precio y es un número...
          if (cell && cell.t === "n" && (C === 3 || C === 4 || C === 5)) {
            // Columnas D, E, F
            cell.t = "n"; // Asegura que el tipo sea numérico
            cell.z = "$ #,##0"; // Formato de moneda sin decimales
          }
        }
      }

      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Inventario Completo");
      const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.header(
        "Content-Disposition",
        'attachment; filename="Reporte_Inventario_Completo.xlsx"'
      );
      return res.send(buffer);
    }
    res.status(200).json(items);
  } catch (error) {
    console.error("Error al generar reporte de inventario:", error);
    res
      .status(500)
      .json({ message: "Error al generar reporte de inventario." });
  }
};

/**
 * @controller getReporteMovimientos
 * @description Genera un reporte de movimientos filtrado.
 */
exports.getReporteMovimientos = async (req, res) => {
    console.log('🕵️‍♂️ [ESPÍA #4 - Controlador]: Entrando a getReporteMovimientos.');
    try {
        const { fechaDesde, fechaHasta, tipoMovimiento, parteId, proveedorId } = req.query;
        
        if (!fechaDesde || !fechaHasta) {
            console.error('🕵️‍♂️ [ESPÍA #4 - Controlador]: ¡ERROR! Faltan las fechas obligatorias.');
            return res.status(400).json({ message: 'El rango de fechas es obligatorio.' });
        }

        const whereClauseMovimiento = {
            fecha_movimiento: {
                [Op.between]: [new Date(fechaDesde), new Date(`${fechaHasta}T23:59:59.999Z`)] // Asegura incluir todo el día "hasta"
            }
        };
        if (tipoMovimiento) whereClauseMovimiento.tipo_movimiento = tipoMovimiento;
        if (parteId) whereClauseMovimiento.parte_repuesto_id = parteId;
        
        const includeClauseParte = {
            model: ParteRepuesto,
            as: 'parteRepuesto',
            attributes: ['nombre', 'numero_parte'],
            where: {}
        };

        if (proveedorId) {
            includeClauseParte.where.proveedor_id = proveedorId;
        }
        
        console.log('🕵️‍♂️ [ESPÍA #4 - Controlador]: Cláusula de consulta final:', JSON.stringify({ where: whereClauseMovimiento, include: includeClauseParte }, null, 2));

        const items = await MovimientoInventario.findAll({
            where: whereClauseMovimiento,
            include: [ includeClauseParte, { model: Usuario, as: 'usuario', attributes: ['nombre_usuario'] } ],
            order: [['fecha_movimiento', 'DESC']],
        });
        
        console.log(`🕵️‍♂️ [ESPÍA #4 - Controlador]: La consulta a la base de datos encontró ${items.length} resultados.`);

        const formattedItems = items.map(mov => ({
            "Fecha de Movimiento": mov.fecha_movimiento,
            "Concepto": mov.descripcion_movimiento || mov.tipo_movimiento,
            "Nombre": mov.parteRepuesto?.nombre || 'N/A',
            "N/P": mov.parteRepuesto?.numero_parte || 'N/A',
            "Cantidad": mov.cantidad_movimiento,
            "Usuario": mov.usuario?.nombre_usuario || 'N/A'
        }));

        if (req.query.export === 'excel') {
            const worksheet = xlsx.utils.json_to_sheet(formattedItems);
            const workbook = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(workbook, worksheet, 'Movimientos');
            const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            res.header('Content-Disposition', `attachment; filename="Reporte_Movimientos.xlsx"`);
            return res.send(buffer);
        }
        res.status(200).json(formattedItems);
    } catch (error) {
        console.error("🕵️‍♂️ [ESPÍA #4 - Controlador]: ¡ERROR FATAL! Error al generar reporte de movimientos:", error);
        res.status(500).json({ message: 'Error al generar reporte de movimientos.' });
    }
};
