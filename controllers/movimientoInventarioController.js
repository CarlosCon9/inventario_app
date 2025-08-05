// controllers/movimientoInventarioController.js
const { MovimientoInventario, ParteRepuesto, sequelize } = require('../models');

exports.createMovimiento = async (req, res) => {
    const { parte_repuesto_id, tipo_movimiento, cantidad_movimiento, descripcion_movimiento, ubicacion_destino } = req.body;
    const usuario_id = req.user.id;
    const t = await sequelize.transaction();

    try {
        const parte = await ParteRepuesto.findByPk(parte_repuesto_id, { transaction: t });

        if (!parte) {
            await t.rollback();
            return res.status(404).json({ message: `La parte/repuesto con ID ${parte_repuesto_id} no existe.` });
        }

        const cantidadNumerica = parseInt(cantidad_movimiento, 10);
        if (isNaN(cantidadNumerica)) {
             await t.rollback();
            return res.status(400).json({ message: 'La cantidad debe ser un número válido.' });
        }

        switch (tipo_movimiento) {
            case 'entrada':
                parte.cantidad += cantidadNumerica;
                break;
            case 'salida':
                if (parte.cantidad < cantidadNumerica) {
                    await t.rollback();
                    return res.status(400).json({ message: `Stock insuficiente para '${parte.nombre}'. Stock actual: ${parte.cantidad}, se intentó sacar: ${cantidadNumerica}.` });
                }
                parte.cantidad -= cantidadNumerica;
                break;
            case 'ajuste':
                if (parte.cantidad + cantidadNumerica < 0) {
                    await t.rollback();
                    return res.status(400).json({ message: `El ajuste no puede resultar en un stock negativo. Stock actual: ${parte.cantidad}, ajuste: ${cantidadNumerica}.` });
                }
                parte.cantidad += cantidadNumerica;
                break;
            case 'transferencia':
                if (!ubicacion_destino) {
                    await t.rollback();
                    return res.status(400).json({ message: 'La ubicación de destino es obligatoria para una transferencia.' });
                }
                if (parte.cantidad < cantidadNumerica) {
                    await t.rollback();
                    return res.status(400).json({ message: `Stock insuficiente para transferir. Stock actual: ${parte.cantidad}, se intentó transferir: ${cantidadNumerica}.` });
                }
                parte.ubicacion = ubicacion_destino;
                break;
            default:
                await t.rollback();
                return res.status(400).json({ message: `Tipo de movimiento '${tipo_movimiento}' no es válido.` });
        }

        await parte.save({ transaction: t });

        const movimiento = await MovimientoInventario.create({
            parte_repuesto_id,
            usuario_id,
            tipo_movimiento,
            cantidad_movimiento: cantidadNumerica,
            descripcion_movimiento,
            ubicacion_origen: tipo_movimiento === 'transferencia' ? parte.ubicacion : null,
            ubicacion_destino: tipo_movimiento === 'transferencia' ? ubicacion_destino : null,
        }, { transaction: t });

        await t.commit();
        
        // Asumiendo que tienes un middleware de logging global
        if (req.logActivity) {
            await req.logActivity(`crear_movimiento_${tipo_movimiento}`, 'MovimientoInventario', movimiento.id, movimiento.toJSON(), 'EXITO');
        }

        res.status(201).json({ message: 'Movimiento registrado exitosamente.', movimiento });

    } catch (error) {
        await t.rollback();
        console.error('Error al crear movimiento:', error);
        if (req.logActivity) {
            await req.logActivity(`crear_movimiento_${tipo_movimiento}`, 'MovimientoInventario', parte_repuesto_id, { error: error.message }, 'FALLO');
        }
        res.status(500).json({ message: 'Error interno del servidor al crear el movimiento.' });
    }
};