// models/registroActividad.js
module.exports = (sequelize, DataTypes) => { // <-- ¡IMPORTANTE! Envuelve la definición en una función
    const RegistroActividad = sequelize.define('RegistroActividad', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        usuario_id: { // Clave foránea al usuario que realizó la acción
            type: DataTypes.INTEGER,
            allowNull: true, // Se permite null para acciones no autenticadas (ej. intento de login fallido)
            references: {
                model: 'usuarios', // ¡IMPORTANTE! Nombre del modelo en plural (cómo lo infiere Sequelize por defecto)
                key: 'id'
            }
        },
        fecha_accion: { // Fecha y hora en que ocurrió la acción
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        tipo_accion: { // Ej: 'crear_parte', 'actualizar_usuario', 'login_exitoso', 'login_fallido'
            type: DataTypes.STRING(100),
            allowNull: false
        },
        objeto_tipo: { // Ej: 'ParteRepuesto', 'Usuario', 'MovimientoInventario', 'Autenticacion'
            type: DataTypes.STRING(100),
            allowNull: true // Puede ser null si la acción no se aplica a un objeto de modelo específico
        },
        objeto_id: { // ID del objeto afectado por la acción (si aplica)
            type: DataTypes.INTEGER,
            allowNull: true
        },
        cambios_detalle: { // JSON con detalles de los cambios realizados o información adicional
            type: DataTypes.JSONB, // Tipo JSONB para almacenar objetos JSON en PostgreSQL
            allowNull: true
        },
        resultado: { // Ej: 'EXITO', 'FALLO', 'ADVERTENCIA'
            type: DataTypes.STRING(50),
            allowNull: false
        },
        ip_origen: { // Dirección IP desde donde se realizó la acción
            type: DataTypes.STRING(45), // Suficiente para IPv6
            allowNull: true
        }
    }, {
        tableName: 'registros_actividad', // Nombre de la tabla en la DB
        timestamps: false // No usamos createdAt/updatedAt automáticos aquí
    });

    return RegistroActividad; // <-- ¡IMPORTANTE! Retorna el modelo desde la función
};