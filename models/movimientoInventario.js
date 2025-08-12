// models/movimientoInventario.js
module.exports = (sequelize, DataTypes) => {
    const MovimientoInventario = sequelize.define('MovimientoInventario', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        parte_repuesto_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'partes_repuestos', key: 'id' } },
        usuario_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'usuarios', key: 'id' } },
        proveedor_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'proveedores', key: 'id' } },
        
        tipo_movimiento: { type: DataTypes.ENUM('entrada', 'salida'), allowNull: false },
        cantidad_movimiento: { type: DataTypes.INTEGER, allowNull: false },
        
        // --- NUEVOS CAMPOS ---
        precio_compra_unitario: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
        porcentaje_ganancia_aplicado: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
        documento_referencia_tipo: { type: DataTypes.STRING(10), allowNull: true }, // FC, RC, FV, RM
        documento_referencia_codigo: { type: DataTypes.STRING(50), allowNull: true },

        descripcion_movimiento: { type: DataTypes.TEXT, allowNull: true },
        fecha_movimiento: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    }, {
        tableName: 'movimientos_inventario',
        timestamps: false
    });

    return MovimientoInventario;
};