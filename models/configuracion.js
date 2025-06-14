// models/configuracion.js
module.exports = (sequelize, DataTypes) => {
    const Configuracion = sequelize.define('Configuracion', {
        clave: {
            type: DataTypes.STRING,
            primaryKey: true, // La clave será nuestra llave primaria
            allowNull: false,
            unique: true,
            comment: 'La clave única para la configuración (ej: porcentaje_ganancia)'
        },
        valor: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'El valor asociado a la clave'
        },
        descripcion: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Una descripción de lo que hace esta configuración'
        }
    }, {
        tableName: 'configuraciones',
        timestamps: true, // Queremos saber cuándo se actualizó por última vez
        createdAt: 'fecha_creacion',
        updatedAt: 'fecha_actualizacion'
    });

    return Configuracion;
};