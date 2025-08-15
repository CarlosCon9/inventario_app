//Agosto 14 de 2025
// controllers/reportesController.js
const { Op, Sequelize } = require("sequelize");
const { ParteRepuesto, Proveedor, MovimientoInventario, Usuario } = require("../models");
const xlsx = require("xlsx");

// --- Función para generar timestamp ---
const getTimestamp = () => {
  const now = new Date();
  const pad = (num) => num.toString().padStart(2, "0");
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  return `${date}_${time}`;
};

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
          as: "parteRepuesto",
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
        `attachment; filename="Reporte_Stock_Bajo_${getTimestamp()}.xlsx"`
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

    if (req.query.export === "excel") {
      const worksheet = xlsx.utils.json_to_sheet(items);

      const range = xlsx.utils.decode_range(worksheet["!ref"]);
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_address = { c: C, r: R };
          const cell_ref = xlsx.utils.encode_cell(cell_address);
          const cell = worksheet[cell_ref];
          if (cell && cell.t === "n" && (C === 3 || C === 4 || C === 5)) {
            cell.t = "n";
            cell.z = "$ #,##0";
          }
        }
      }

      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Inventario Completo");
      const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.header(
        "Content-Disposition",
        `attachment; filename="Reporte_Inventario_Completo_${getTimestamp()}.xlsx"`
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

exports.getReporteMovimientos = async (req, res) => {
    try {
        const { fechaDesde, fechaHasta, tipoMovimiento, parteId, proveedorId } = req.query;
        if (!fechaDesde || !fechaHasta) {
            return res.status(400).json({ message: 'El rango de fechas es obligatorio.' });
        }
        
        const whereClauseMovimiento = {
            fecha_movimiento: {
                [Op.between]: [new Date(fechaDesde), new Date(`${fechaHasta}T23:59:59.999Z`)]
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

        const items = await MovimientoInventario.findAll({
            where: whereClauseMovimiento,
            include: [ includeClauseParte, { model: Usuario, as: 'usuario', attributes: ['nombre_usuario'] } ],
            order: [['fecha_movimiento', 'DESC']],
        });

        if (req.query.export !== 'excel') {
            return res.status(200).json(items);
        }

        const formattedForExcel = items.map(mov => {
            const localDate = new Date(mov.fecha_movimiento);
            return {
                "Fecha": localDate.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }),
                "Hora": localDate.toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour12: true }),
                "Concepto": mov.descripcion_movimiento || mov.tipo_movimiento,
                "Nombre": mov.parteRepuesto?.nombre || 'N/A',
                "N/P": mov.parteRepuesto?.numero_parte || 'N/A',
                "Cantidad": mov.cantidad_movimiento,
                "Usuario": mov.usuario?.nombre_usuario || 'N/A'
            };
        });
        
        const worksheet = xlsx.utils.json_to_sheet(formattedForExcel);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Movimientos');
        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.header(
          "Content-Disposition",
          `attachment; filename="Reporte_Movimientos_${getTimestamp()}.xlsx"`
        );
        return res.send(buffer);

    } catch (error) {
        console.error("Error al generar reporte de movimientos:", error);
        res.status(500).json({ message: 'Error al generar reporte de movimientos.' });
    }
};
