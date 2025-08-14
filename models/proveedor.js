//Agosto 14 de 2025
// models/proveedor.js
module.exports = (sequelize, DataTypes) => { // <-- ¡IMPORTANTE! Envuelve la definición en una función
    const Proveedor = sequelize.define('Proveedor', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: DataTypes.STRING(100), allowNull: false, unique: true },
        contacto_principal: { type: DataTypes.STRING(100), allowNull: true },
        telefono: { type: DataTypes.STRING(20), allowNull: true },
        correo_electronico: { type: DataTypes.STRING(100), allowNull: true, validate: { isEmail: true } },
        direccion: { type: DataTypes.TEXT, allowNull: true }
    }, {
        tableName: 'proveedores', // Nombre de la tabla en la DB
        timestamps: true, // Habilita `createdAt` y `updatedAt`
        createdAt: 'fecha_creacion',
        updatedAt: 'fecha_actualizacion'
    });

    return Proveedor; // <-- ¡IMPORTANTE! Retorna el modelo desde la función
};