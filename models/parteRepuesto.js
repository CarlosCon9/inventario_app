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
      cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      cantidad_minima: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      // --- CAMPOS DE UBICACIÓN AJUSTADOS ---
      estand: { type: DataTypes.STRING(50), allowNull: true },
      fila: { type: DataTypes.STRING(50), allowNull: true },

      // --- CAMPO DE PRECIO AJUSTADO ---
      precio_referencia: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      precio_compra: { type: DataTypes.DECIMAL(10, 2), allowNull: true }, // Último precio de compra conocido
      porcentaje_ganancia: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      precio_venta_sugerido: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },

      imagen_url: { type: DataTypes.STRING, allowNull: true },
      manual_url: { type: DataTypes.STRING, allowNull: true },
      unidad_medida: { type: DataTypes.STRING(20), allowNull: true },
      categoria: { type: DataTypes.STRING(50), allowNull: true },
      proveedor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "proveedores", key: "id" },
      },
      activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      tableName: "partes_repuestos",
      timestamps: true,
      createdAt: "fecha_creacion",
      updatedAt: "fecha_actualizacion",
      // Eliminamos el campo 'ubicacion' si ya no lo usaremos directamente
      // paranoid: true, // Si quieres habilitar soft delete en el futuro
    }
  );
  return ParteRepuesto;
};
