// controllers/configuracionController.js
const { Configuracion, RegistroActividad } = require('../models');

// Función auxiliar para registrar actividad
async function logActivity(req, action, objectType, objectId, details, result) {
    try {
        const usuario_id = req.user ? req.user.id : null;
        await RegistroActividad.create({
            usuario_id: usuario_id,
            tipo_accion: action,
            objeto_tipo: objectType, // <-- Corregido para que coincida
            objeto_id: objectId,     // <-- Corregido para que coincida
            cambios_detalle: details,
            resultado: result,
            ip_origen: req.ip
        });
    } catch (logError) {
        console.error('Error al registrar actividad:', logError.message);
    }
}

/**
 * @controller getGanancia
 * @description Obtiene el porcentaje de ganancia actual.
 */
exports.getGanancia = async (req, res) => {
    try {
        const gananciaSetting = await Configuracion.findByPk('porcentaje_ganancia');
        if (!gananciaSetting) {
            return res.status(404).json({ message: 'Configuración de porcentaje de ganancia no encontrada.' });
        }
        res.status(200).json(gananciaSetting);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la configuración.', error: error.message });
    }
};

/**
 * @controller setGanancia
 * @description Establece o actualiza el porcentaje de ganancia.
 */
exports.setGanancia = async (req, res) => {
    const { valor, descripcion } = req.body;
    const clave = 'porcentaje_ganancia';

    if (isNaN(parseFloat(valor)) || parseFloat(valor) < 0) {
        return res.status(400).json({ message: 'El valor debe ser un número positivo.' });
    }

    try {
        const [config, created] = await Configuracion.upsert({
            clave: clave,
            valor: valor.toString(),
            descripcion: descripcion || 'Porcentaje de ganancia aplicado al precio de compra para calcular el precio de venta sugerido.'
        }, { returning: true });

        const actionType = created ? 'crear_configuracion' : 'actualizar_configuracion';
        // 👇 AJUSTE EN LA LLAMADA A logActivity 👇
        // Pasamos null como objeto_id porque la clave primaria no es un número.
        // La información clave ya está en objectType y en los detalles.
        await logActivity(req, actionType, 'Configuracion', null, { clave: config.clave, nuevo_valor: config.valor }, 'EXITO');
        
        res.status(200).json({ message: `Configuración '${clave}' establecida a ${valor}%.`, configuracion: config });

    } catch (error) {
        console.error(`Error al establecer ${clave}:`, error);
        // 👇 AJUSTE EN LA LLAMADA A logActivity 👇
        await logActivity(req, `actualizar_configuracion`, 'Configuracion', null, { clave: clave, error: error.message }, 'FALLO');
        res.status(500).json({ message: `Error al establecer la configuración.`, error: error.message });
    }
};