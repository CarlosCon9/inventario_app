// models/parteRepuesto.js
module.exports = (sequelize, DataTypes) => {
  const ParteRepuesto = sequelize.define(
    "ParteRepuesto",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(100), allowNull: false },
      descripcion: { type: DataTypes.TEXT, allowNull: true },
      numero_parte: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },
      cantidad_minima: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },

      ubicacion: { type: DataTypes.STRING(100), allowNull: true },
      precio_compra: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: { min: 0 },
      },
      porcentaje_ganancia: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment:
          "Porcentaje de ganancia que se aplicó para calcular el precio de venta.",
      },
      precio_venta_sugerido: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: { min: 0 },
      },
      imagen_url: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "URL o ruta del archivo de imagen de la parte.",
      },
      manual_url: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "URL o ruta del manual/datasheet (PDF/DOC) de la parte.",
      },
      unidad_medida: { type: DataTypes.STRING(20), allowNull: true },
      categoria: { type: DataTypes.STRING(50), allowNull: true },
      proveedor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "proveedores",
          key: "id",
        },
      },
    },
    {
      tableName: "partes_repuestos",
      timestamps: true,
      createdAt: "fecha_creacion",
      updatedAt: "fecha_actualizacion",
    }
  );

  return ParteRepuesto;
};
