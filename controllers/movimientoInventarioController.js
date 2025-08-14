//Agosto 14 de 2025
// controllers/movimientoInventarioController.js
const { MovimientoInventario, ParteRepuesto, sequelize } = require('../models');

const calcularPrecioVentaSugerido = (precioCompra, porcentajeGanancia) => {
    const precio = parseFloat(precioCompra);
    const porcentaje = parseFloat(porcentajeGanancia);
    if (!isNaN(precio) && !isNaN(porcentaje)) {
        return precio * (1 + (porcentaje / 100));
    }
    return null;
};

exports.createMovimiento = async (req, res) => {
    const { 
        parte_repuesto_id, tipo_movimiento, cantidad_movimiento, descripcion_movimiento,
        proveedor_id, precio_compra, porcentaje_ganancia, documento_referencia_tipo, documento_referencia_codigo
    } = req.body;
    const usuario_id = req.user.id;
    const t = await sequelize.transaction();

    try {
        const parte = await ParteRepuesto.findByPk(parte_repuesto_id, { transaction: t });
        if (!parte) {
            await t.rollback();
            return res.status(404).json({ message: `La parte/repuesto no existe.` });
        }
        
        const cantidadNumerica = parseInt(cantidad_movimiento, 10);
        
        if (tipo_movimiento === 'entrada') {
            parte.cantidad += cantidadNumerica;
            
            // Lógica de actualización de precios
            const nuevoPrecioCompra = parseFloat(precio_compra);
            if (!isNaN(nuevoPrecioCompra) && nuevoPrecioCompra > parseFloat(parte.precio_compra)) {
                parte.precio_compra = nuevoPrecioCompra;
                parte.porcentaje_ganancia = parseFloat(porcentaje_ganancia);
                parte.precio_venta_sugerido = calcularPrecioVentaSugerido(nuevoPrecioCompra, porcentaje_ganancia);
            }
            
        } else if (tipo_movimiento === 'salida') {
            if (parte.cantidad < cantidadNumerica) {
                await t.rollback();
                return res.status(400).json({ message: `Stock insuficiente para '${parte.nombre}'.` });
            }
            parte.cantidad -= cantidadNumerica;
        } else {
            await t.rollback();
            return res.status(400).json({ message: `Tipo de movimiento no válido.` });
        }

        await parte.save({ transaction: t });

        await MovimientoInventario.create({
            parte_repuesto_id,
            usuario_id,
            proveedor_id: tipo_movimiento === 'entrada' ? proveedor_id : null,
            tipo_movimiento,
            cantidad_movimiento: cantidadNumerica,
            precio_compra_unitario: tipo_movimiento === 'entrada' ? precio_compra : null,
            porcentaje_ganancia_aplicado: tipo_movimiento === 'entrada' ? porcentaje_ganancia : null,
            documento_referencia_tipo,
            documento_referencia_codigo,
            descripcion_movimiento,
        }, { transaction: t });

        await t.commit();
        res.status(201).json({ message: 'Movimiento registrado exitosamente.' });

    } catch (error) {
        await t.rollback();
        console.error('Error al crear movimiento:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};