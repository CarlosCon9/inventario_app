// middlewares/logActivityMiddleware.js
const { RegistroActividad } = require('../models'); // Importa el modelo RegistroActividad

const logActivityMiddleware = async (req, res, next) => {
    // Asume que el usuario autenticado estará disponible en req.user si usas Passport/JWT
    const usuarioId = req.user ? req.user.id : null;
    const { method, originalUrl, ip } = req;

    // Esta función será inyectada en el objeto 'req' para ser usada por los controladores
    // Permite a los controladores registrar actividades específicas.
    req.logActivity = async (actionType, objectType, objectId, details = null, resultStatus = 'EXITO') => {
        try {
            await RegistroActividad.create({
                usuario_id: usuarioId, // El ID del usuario que realizó la acción
                fecha_accion: new Date(),
                tipo_accion: actionType, // Ej: 'crear_parte', 'login_exitoso', 'eliminar_usuario'
                objeto_tipo: objectType, // Ej: 'ParteRepuesto', 'Usuario', 'Autenticacion'
                objeto_id: objectId, // ID del registro afectado (si aplica)
                cambios_detalle: details, // Detalles de la acción (ej: { oldData: {}, newData: {} })
                resultado: resultStatus, // 'EXITO', 'FALLO', 'ADVERTENCIA'
                ip_origen: ip // IP de origen de la solicitud
            });
        } catch (logError) {
            console.error('Error al registrar actividad en la DB:', logError);
            // NOTA: Un error en el logging no debería detener la operación principal.
        }
    };

    next(); // Pasa el control al siguiente middleware o ruta
};

module.exports = logActivityMiddleware;