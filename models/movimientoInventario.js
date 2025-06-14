// models/movimientoInventario.js
module.exports = (sequelize, DataTypes) => { // <-- ¡IMPORTANTE! Envuelve la definición en una función
    const MovimientoInventario = sequelize.define('MovimientoInventario', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        parte_repuesto_id: { // Clave foránea a la tabla de PartesRepuestos
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'partes_repuestos', // ¡IMPORTANTE! Nombre del modelo en plural (cómo lo infiere Sequelize por defecto)
                key: 'id'
            }
        },
        usuario_id: { // Clave foránea a la tabla de Usuarios
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'usuarios', // ¡IMPORTANTE! Nombre del modelo en plural (cómo lo infiere Sequelize por defecto)
                key: 'id'
            }
        },
        tipo_movimiento: { // 'entrada' o 'salida'
            type: DataTypes.ENUM('entrada', 'salida'), // Define un tipo ENUM para valores específicos
            allowNull: false
        },
        cantidad_movimiento: { // Cantidad de unidades que se movieron en este registro
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1 } // Debe ser al menos 1
        },
        descripcion_movimiento: { // Notas o detalles adicionales sobre el movimiento
            type: DataTypes.TEXT,
            allowNull: true
        },
        fecha_movimiento: { // Fecha y hora específica del movimiento
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'movimientos_inventario', // Nombre de la tabla en la DB
        timestamps: false // No usamos createdAt/updatedAt automáticos, tenemos fecha_movimiento
    });

    return MovimientoInventario; // <-- ¡IMPORTANTE! Retorna el modelo desde la función
};