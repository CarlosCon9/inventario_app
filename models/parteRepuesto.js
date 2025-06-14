// models/parteRepuesto.js
module.exports = (sequelize, DataTypes) => { // <-- ¡IMPORTANTE! Envuelve la definición en una función
    const ParteRepuesto = sequelize.define('ParteRepuesto', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: DataTypes.STRING(100), allowNull: false },
        descripcion: { type: DataTypes.TEXT, allowNull: true },
        numero_parte: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
        cantidad_minima: { // Umbral para alertar bajo stock
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 }
        },
        ubicacion: { type: DataTypes.STRING(100), allowNull: true },
        precio_compra: { type: DataTypes.DECIMAL(10, 2), allowNull: true, validate: { min: 0 } },
        precio_venta_sugerido: { type: DataTypes.DECIMAL(10, 2), allowNull: true, validate: { min: 0 } },
        unidad_medida: { type: DataTypes.STRING(20), allowNull: true },
        categoria: { type: DataTypes.STRING(50), allowNull: true },
        proveedor_id: { // Clave foránea a la tabla de Proveedores
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'proveedores', // ¡IMPORTANTE! Nombre del modelo en plural (cómo lo infiere Sequelize por defecto)
                key: 'id'
            }
        }
    }, {
        tableName: 'partes_repuestos', // Nombre de la tabla en la DB
        timestamps: true, // Habilita `createdAt` y `updatedAt`
        createdAt: 'fecha_creacion',
        updatedAt: 'fecha_actualizacion'
    });

    return ParteRepuesto; // <-- ¡IMPORTANTE! Retorna el modelo desde la función
};