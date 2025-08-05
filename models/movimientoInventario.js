// models/movimientoInventario.js
module.exports = (sequelize, DataTypes) => {
    const MovimientoInventario = sequelize.define('MovimientoInventario', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        parte_repuesto_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'partes_repuestos', key: 'id' }
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'usuarios', key: 'id' }
        },
        tipo_movimiento: {
            type: DataTypes.ENUM('entrada', 'salida', 'ajuste', 'transferencia'),
            allowNull: false
        },
        cantidad_movimiento: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        descripcion_movimiento: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        ubicacion_origen: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Ubicación de origen para movimientos de transferencia'
        },
        ubicacion_destino: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Ubicación de destino para movimientos de transferencia'
        },
        fecha_movimiento: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'movimientos_inventario',
        timestamps: false
    });

    return MovimientoInventario;
};