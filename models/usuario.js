// models/usuario.js
const bcrypt = require('bcryptjs'); // Asegúrate de tener bcryptjs instalado: npm install bcryptjs

module.exports = (sequelize, DataTypes) => { // <-- ¡IMPORTANTE! Envuelve la definición en una función
    const Usuario = sequelize.define('Usuario', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        nombre_usuario: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        correo_electronico: { type: DataTypes.STRING(100), allowNull: false, unique: true, validate: { isEmail: true } },
        contrasena: { type: DataTypes.STRING(255), allowNull: false },
        rol: {
            type: DataTypes.ENUM('administrador', 'operador', 'consulta'),
            allowNull: false,
            defaultValue: 'consulta'
        },
        activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
    }, {
        tableName: 'usuarios',
        timestamps: true,
        createdAt: 'fecha_creacion',
        updatedAt: 'fecha_actualizacion',
        hooks: {
            beforeCreate: async (usuario) => {
                if (usuario.contrasena) {
                    const salt = await bcrypt.genSalt(10);
                    usuario.contrasena = await bcrypt.hash(usuario.contrasena, salt);
                }
            },
            beforeUpdate: async (usuario) => {
                if (usuario.changed('contrasena')) {
                    const salt = await bcrypt.genSalt(10);
                    usuario.contrasena = await bcrypt.hash(usuario.contrasena, salt);
                }
            }
        }
    });

    Usuario.prototype.comparePassword = async function (candidatePassword) {
        return bcrypt.compare(candidatePassword, this.contrasena);
    };

    Usuario.prototype.hasRole = function (requiredRoles) {
        if (!Array.isArray(requiredRoles)) {
            requiredRoles = [requiredRoles];
        }
        return requiredRoles.includes(this.rol);
    };

    return Usuario; // <-- ¡IMPORTANTE! Retorna el modelo desde la función
};