// controllers/parteRepuestoController.js

const { ParteRepuesto, Proveedor, MovimientoInventario, sequelize } = require('../models');

/**
 * @description Función de ayuda para calcular el precio de venta. Es reutilizable y mantiene la lógica de negocio centralizada.
 * @param {number} precioCompra - El precio de compra del producto.
 * @param {number} porcentajeGanancia - El porcentaje de ganancia deseado.
 * @returns {Promise<number|null>} El precio de venta calculado o null si no se puede calcular.
 */
async function calcularPrecioVenta(precioCompra, porcentajeGanancia) {
    // Si no se proporciona alguno de los dos valores necesarios, no se puede calcular.
    if (precioCompra === null || precioCompra === undefined || porcentajeGanancia === null || porcentajeGanancia === undefined) {
        return null;
    }

    const precio = parseFloat(precioCompra);
    const porcentaje = parseFloat(porcentajeGanancia);

    // Verificamos que ambos sean números válidos.
    if (isNaN(precio) || isNaN(porcentaje)) {
        return null;
    }

    const precioVenta = precio * (1 + (porcentaje / 100));
    // Redondeamos a 2 decimales para asegurar consistencia monetaria.
    return Math.round(precioVenta * 100) / 100;
}

// CREATE - Crea una nueva parte/repuesto
exports.createParteRepuesto = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const datos = req.body;
        
        // La lógica de cálculo ahora usa nuestra función de ayuda.
        datos.precio_venta_sugerido = await calcularPrecioVenta(datos.precio_compra, datos.porcentaje_ganancia);

        const nuevaParte = await ParteRepuesto.create(datos, { transaction: t });
        await t.commit();
        
        await req.logActivity('crear_parte', 'ParteRepuesto', nuevaParte.id, nuevaParte.toJSON(), 'EXITO');
        res.status(201).json(nuevaParte);
    } catch (error) {
        await t.rollback();
        console.error('Error al crear parte/repuesto:', error);
        await req.logActivity('crear_parte', 'ParteRepuesto', null, { error: error.message }, 'FALLO');
        res.status(500).json({ message: 'Error interno del servidor al crear la parte.', error: error.message });
    }
};

// READ ALL - Obtiene todas las partes/repuestos
exports.getAllPartesRepuestos = async (req, res) => {
    try {
        const partes = await ParteRepuesto.findAll({ 
            include: [{ model: Proveedor, as: 'proveedor', attributes: ['id', 'nombre'] }],
            order: [['nombre', 'ASC']]
        });
        res.status(200).json(partes);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener partes.', error: error.message });
    }
};

// READ ONE - Obtiene una parte/repuesto por su ID
exports.getParteRepuestoById = async (req, res) => {
     try {
        const parte = await ParteRepuesto.findByPk(req.params.id, { 
            include: [{ model: Proveedor, as: 'proveedor' }] 
        });
        if (!parte) {
            return res.status(404).json({ message: 'Parte/repuesto no encontrado.' });
        }
        res.status(200).json(parte);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la parte.', error: error.message });
    }
};

// UPDATE - Actualiza una parte/repuesto
exports.updateParteRepuesto = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const parte = await ParteRepuesto.findByPk(req.params.id, { transaction: t });
        if (!parte) {
            await t.rollback();
            return res.status(404).json({ message: 'Parte/repuesto no encontrado.' });
        }

        const oldData = parte.toJSON();
        const datosActualizar = req.body;

        const precioCompraFinal = datosActualizar.precio_compra !== undefined ? datosActualizar.precio_compra : parte.precio_compra;
        const porcentajeGananciaFinal = datosActualizar.porcentaje_ganancia !== undefined ? datosActualizar.porcentaje_ganancia : parte.porcentaje_ganancia;
        
        datosActualizar.precio_venta_sugerido = await calcularPrecioVenta(precioCompraFinal, porcentajeGananciaFinal);

        await parte.update(datosActualizar, { transaction: t });
        await t.commit();
        
        await req.logActivity('actualizar_parte', 'ParteRepuesto', parte.id, { oldData, newData: parte.toJSON() }, 'EXITO');
        res.status(200).json(parte);
    } catch (error) {
        await t.rollback();
        console.error('Error al actualizar parte/repuesto:', error);
        await req.logActivity('actualizar_parte', 'ParteRepuesto', req.params.id, { error: error.message }, 'FALLO');
        res.status(500).json({ message: 'Error interno del servidor al actualizar la parte.', error: error.message });
    }
};

// UPLOAD IMAGE - Sube una imagen para una parte/repuesto
exports.uploadImagen = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const parte = await ParteRepuesto.findByPk(req.params.id, { transaction: t });
        if (!parte) {
            await t.rollback();
            return res.status(404).json({ message: 'Parte/repuesto no encontrado.' });
        }

        if (!req.file) {
            await t.rollback();
            return res.status(400).json({ message: 'No se ha subido ningún archivo.' });
        }

        const oldData = parte.toJSON();
        parte.imagen_url = req.file.path.replace(/\\/g, "/"); // Normalizamos la ruta para web

        await parte.save({ transaction: t });
        await t.commit();
        
        await req.logActivity('upload_imagen_parte', 'ParteRepuesto', parte.id, { oldUrl: oldData.imagen_url, newUrl: parte.imagen_url }, 'EXITO');
        res.status(200).json(parte);

    } catch (error) {
        await t.rollback();
        console.error('Error al subir imagen:', error);
        await req.logActivity('upload_imagen_parte', 'ParteRepuesto', req.params.id, { error: error.message }, 'FALLO');
        res.status(500).json({ message: 'Error interno del servidor al subir la imagen.', error: error.message });
    }
};

// DELETE - Elimina una parte/repuesto
exports.deleteParteRepuesto = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const parte = await ParteRepuesto.findByPk(req.params.id, { transaction: t });
        if (!parte) {
            await t.rollback();
            return res.status(404).json({ message: 'Parte/repuesto no encontrado.' });
        }
        
        // Verificamos si la parte tiene movimientos asociados
        const movimientos = await MovimientoInventario.count({ where: { parte_repuesto_id: req.params.id }, transaction: t });
        if (movimientos > 0) {
            await t.rollback();
            return res.status(409).json({ message: `No se puede eliminar: la parte tiene ${movimientos} movimiento(s) de inventario asociados.` });
        }
        
        const deletedData = parte.toJSON();
        await parte.destroy({ transaction: t });
        await t.commit();
        await req.logActivity('eliminar_parte', 'ParteRepuesto', req.params.id, deletedData, 'EXITO');
        res.status(200).json({ message: 'Parte/repuesto eliminado exitosamente.' });
    } catch (error) {
        await t.rollback();
        await req.logActivity('eliminar_parte', 'ParteRepuesto', req.params.id, { error: error.message }, 'FALLO');
        res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
    }
};