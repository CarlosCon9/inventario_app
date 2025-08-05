// models/usuario.js
const bcrypt = require("bcryptjs");
const crypto = require("crypto"); // Importamos el módulo crypto de Node.js

module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define(
    "Usuario",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre_usuario: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      correo_electronico: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      contrasena: { type: DataTypes.STRING(255), allowNull: false },
      rol: {
        type: DataTypes.ENUM("administrador", "operador", "consulta"),
        allowNull: false,
        defaultValue: "consulta",
      },
      activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetPasswordExpire: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      session_token: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Token único para la sesión activa actual.",
      },
      session_token_expires: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Fecha de expiración del token de sesión.",
      },
    },
    {
      tableName: "usuarios",
      timestamps: true,
      createdAt: "fecha_creacion",
      updatedAt: "fecha_actualizacion",
      hooks: {
        beforeCreate: async (usuario) => {
          if (usuario.contrasena) {
            const salt = await bcrypt.genSalt(10);
            usuario.contrasena = await bcrypt.hash(usuario.contrasena, salt);
          }
        },
        beforeUpdate: async (usuario) => {
          if (usuario.changed("contrasena")) {
            const salt = await bcrypt.genSalt(10);
            usuario.contrasena = await bcrypt.hash(usuario.contrasena, salt);
          }
        },
      },
    }
  );

  // Método para comparar contraseñas
  Usuario.prototype.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.contrasena);
  };

  // --- NUEVO MÉTODO PARA GENERAR TOKEN DE RESETEO ---
  Usuario.prototype.getResetPasswordToken = function () {
    // 1. Generar un token aleatorio y seguro
    const resetToken = crypto.randomBytes(20).toString("hex");

    // 2. Hashear el token y guardarlo en la base de datos
    // Guardamos el hash para que, si la base de datos es comprometida, nadie pueda usar los tokens.
    this.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // 3. Establecer la fecha de expiración (ej. 15 minutos)
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    // 4. Devolvemos el token SIN hashear, que es lo que se enviará por email
    return resetToken;
  };

  return Usuario;
};
