// controllers/movimientoInventarioController.js
const { MovimientoInventario, ParteRepuesto, sequelize } = require('../models');

/**
 * @controller createMovimiento
 * @description Crea un nuevo movimiento de inventario (entrada, salida, ajuste o transferencia).
 * Actualiza el stock de la parte correspondiente dentro de una transacción.
 * @access      Private (administrador, operador)
 */
exports.createMovimiento = async (req, res) => {
    // Obtenemos los datos del cuerpo de la petición
    const { parte_repuesto_id, tipo_movimiento, cantidad_movimiento, descripcion_movimiento, ubicacion_origen, ubicacion_destino } = req.body;
    const usuario_id = req.user.id; // Obtenido del middleware 'protect'

    // Iniciamos una transacción para garantizar la integridad de los datos
    const t = await sequelize.transaction();

    try {
        // 1. Buscamos la parte/repuesto que se va a afectar
        const parte = await ParteRepuesto.findByPk(parte_repuesto_id, { transaction: t });

        if (!parte) {
            await t.rollback();
            return res.status(404).json({ message: `La parte/repuesto con ID ${parte_repuesto_id} no existe.` });
        }

        // 2. Usamos un switch para manejar la lógica de cada tipo de movimiento
        switch (tipo_movimiento) {
            case 'entrada':
                parte.cantidad += cantidad_movimiento;
                break;

            case 'salida':
                if (parte.cantidad < cantidad_movimiento) {
                    await t.rollback();
                    return res.status(400).json({ message: `Stock insuficiente para la parte '${parte.nombre}'. Stock actual: ${parte.cantidad}, se intentó sacar: ${cantidad_movimiento}.` });
                }
                parte.cantidad -= cantidad_movimiento;
                break;

            case 'ajuste':
                // Para ajustes, la cantidad_movimiento puede ser positiva o negativa
                if (parte.cantidad + cantidad_movimiento < 0) {
                    await t.rollback();
                    return res.status(400).json({ message: `El ajuste no puede resultar en un stock negativo. Stock actual: ${parte.cantidad}, ajuste: ${cantidad_movimiento}.` });
                }
                parte.cantidad += cantidad_movimiento;
                break;

            case 'transferencia':
                // La transferencia no afecta la cantidad total, solo cambia la ubicación
                if (!ubicacion_destino) {
                    await t.rollback();
                    return res.status(400).json({ message: 'La ubicación de destino es obligatoria para una transferencia.' });
                }
                // Validamos que hay suficiente stock para transferir (aunque no se descuenta)
                if (parte.cantidad < cantidad_movimiento) {
                    await t.rollback();
                    return res.status(400).json({ message: `Stock insuficiente para transferir. Stock actual: ${parte.cantidad}, se intentó transferir: ${cantidad_movimiento}.` });
                }
                parte.ubicacion = ubicacion_destino;
                break;

            default:
                await t.rollback();
                return res.status(400).json({ message: `Tipo de movimiento '${tipo_movimiento}' no es válido.` });
        }

        // 3. Guardamos los cambios en la parte/repuesto
        await parte.save({ transaction: t });

        // 4. Creamos el registro del movimiento
        const movimiento = await MovimientoInventario.create({
            parte_repuesto_id,
            usuario_id,
            tipo_movimiento,
            cantidad_movimiento,
            descripcion_movimiento,
            ubicacion_origen: tipo_movimiento === 'transferencia' ? parte.ubicacion : null, // La ubicación antes del cambio
            ubicacion_destino: tipo_movimiento === 'transferencia' ? ubicacion_destino : null,
        }, { transaction: t });

        // 5. Si todo ha ido bien, confirmamos la transacción
        await t.commit();

        // Registramos la actividad (si tienes el middleware global `logActivityMiddleware`)
        await req.logActivity(`crear_movimiento_${tipo_movimiento}`, 'MovimientoInventario', movimiento.id, movimiento.toJSON(), 'EXITO');

        res.status(201).json({ message: 'Movimiento registrado exitosamente.', movimiento });

    } catch (error) {
        // Si algo falla, revertimos todos los cambios
        await t.rollback();
        console.error('Error al crear movimiento:', error);
        await req.logActivity(`crear_movimiento_${tipo_movimiento}`, 'MovimientoInventario', parte_repuesto_id, { error: error.message }, 'FALLO');
        res.status(500).json({ message: 'Error interno del servidor al crear el movimiento.', error: error.message });
    }
};