// routes/parteRepuestoRoutes.js
const express = require('express');
const router = express.Router();

// Importa los modelos necesarios y la instancia de sequelize
const { ParteRepuesto, Proveedor, RegistroActividad, sequelize } = require('../models');
// Importa los middlewares de seguridad
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// Función auxiliar para registrar actividad
async function logActivity(req, tipo_accion, objeto_tipo, objeto_id, cambios_detalle, resultado) {
    try {
        const usuarioId = req.user ? req.user.id : null;
        await RegistroActividad.create({
            usuario_id: usuarioId,
            tipo_accion,
            objeto_tipo,
            objeto_id,
            cambios_detalle,
            resultado,
            ip_origen: req.ip
        });
    } catch (logError) {
        console.error('Error al registrar actividad:', logError.message);
    }
}

// --- Rutas CRUD para Partes/Repuestos ---

/**
 * @route   POST /api/partes-repuestos
 * @desc    Crea una nueva parte/repuesto.
 * Calcula el precio de venta si se proveen precio_compra y porcentaje_ganancia.
 * @access  Private (administrador, operador)
 */
router.post('/', protect, authorizeRoles('administrador', 'operador'), async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const datos = req.body;
        const { precio_compra, porcentaje_ganancia } = datos;

        // --- NUEVA LÓGICA DE CÁLCULO EN CREACIÓN ---
        // Si se proporcionan tanto el precio de compra como el porcentaje, calculamos el precio de venta.
        if (precio_compra !== undefined && porcentaje_ganancia !== undefined) {
            const precio = parseFloat(precio_compra);
            const porcentaje = parseFloat(porcentaje_ganancia);
            
            if (!isNaN(precio) && !isNaN(porcentaje)) {
                const precioVenta = precio * (1 + (porcentaje / 100));
                // Redondeamos a 2 decimales para asegurar consistencia monetaria.
                datos.precio_venta_sugerido = Math.round(precioVenta * 100) / 100;
            }
        }

        const nuevaParte = await ParteRepuesto.create(datos, { transaction: t });
        await t.commit();
        
        await logActivity(req, 'crear_parte', 'ParteRepuesto', nuevaParte.id, nuevaParte.toJSON(), 'EXITO');
        res.status(201).json(nuevaParte);
    } catch (error) {
        await t.rollback();
        console.error('Error al crear parte/repuesto:', error);
        await logActivity(req, 'crear_parte', 'ParteRepuesto', null, { error: error.message }, 'FALLO');
        res.status(500).json({ message: 'Error interno del servidor al crear la parte.', error: error.message });
    }
});

/**
 * @route   PUT /api/partes-repuestos/:id
 * @desc    Actualiza una parte/repuesto.
 * Recalcula el precio de venta si se actualiza precio_compra o porcentaje_ganancia.
 * @access  Private (administrador, operador)
 */
router.put('/:id', protect, authorizeRoles('administrador', 'operador'), async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const parte = await ParteRepuesto.findByPk(req.params.id, { transaction: t });
        if (!parte) {
            await t.rollback();
            return res.status(404).json({ message: 'Parte/repuesto no encontrado.' });
        }

        const oldData = parte.toJSON();
        const datosActualizar = req.body;

        // --- NUEVA LÓGICA DE CÁLCULO EN ACTUALIZACIÓN ---
        // Usamos el nuevo valor del body si se proporciona; si no, mantenemos el valor que ya está en la base de datos.
        const precioCompraFinal = datosActualizar.precio_compra !== undefined ? datosActualizar.precio_compra : parte.precio_compra;
        const porcentajeGananciaFinal = datosActualizar.porcentaje_ganancia !== undefined ? datosActualizar.porcentaje_ganancia : parte.porcentaje_ganancia;

        // Recalculamos el precio de venta solo si tenemos los dos datos necesarios.
        if (precioCompraFinal !== null && porcentajeGananciaFinal !== null) {
            const precio = parseFloat(precioCompraFinal);
            const porcentaje = parseFloat(porcentajeGananciaFinal);
            
            if (!isNaN(precio) && !isNaN(porcentaje)) {
                const precioVenta = precio * (1 + (porcentaje / 100));
                datosActualizar.precio_venta_sugerido = Math.round(precioVenta * 100) / 100;
            }
        }

        await parte.update(datosActualizar, { transaction: t });
        await t.commit();
        
        await logActivity(req, 'actualizar_parte', 'ParteRepuesto', parte.id, { oldData, newData: parte.toJSON() }, 'EXITO');
        res.status(200).json(parte);
    } catch (error) {
        await t.rollback();
        console.error('Error al actualizar parte/repuesto:', error);
        await logActivity(req, 'actualizar_parte', 'ParteRepuesto', req.params.id, { error: error.message }, 'FALLO');
        res.status(500).json({ message: 'Error interno del servidor al actualizar la parte.', error: error.message });
    }
});


// --- RUTAS GET Y DELETE (Sin cambios en su lógica) ---

router.get('/', protect, authorizeRoles('administrador', 'operador', 'consulta'), async (req, res) => {
    try {
        const partes = await ParteRepuesto.findAll({ include: [{ model: Proveedor, as: 'proveedor', attributes: ['id', 'nombre'] }] });
        res.status(200).json(partes);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener partes.', error: error.message });
    }
});

router.get('/:id', protect, authorizeRoles('administrador', 'operador', 'consulta'), async (req, res) => {
     try {
        const parte = await ParteRepuesto.findByPk(req.params.id, { include: [{ model: Proveedor, as: 'proveedor' }] });
        if (!parte) {
            return res.status(404).json({ message: 'Parte/repuesto no encontrado.' });
        }
        res.status(200).json(parte);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la parte.', error: error.message });
    }
});

router.delete('/:id', protect, authorizeRoles('administrador'), async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const parte = await ParteRepuesto.findByPk(req.params.id, { transaction: t });
        if (!parte) {
            await t.rollback();
            return res.status(404).json({ message: 'Parte/repuesto no encontrado.' });
        }
        const deletedData = parte.toJSON();
        await parte.destroy({ transaction: t });
        await t.commit();
        await logActivity(req, 'eliminar_parte', 'ParteRepuesto', req.params.id, deletedData, 'EXITO');
        res.status(200).json({ message: 'Parte/repuesto eliminado exitosamente.' });
    } catch (error) {
        await t.rollback();
        if (error.name === 'SequelizeForeignKeyConstraintError') {
             await logActivity(req, 'eliminar_parte', 'ParteRepuesto', req.params.id, { error: 'Violación de FK' }, 'FALLO');
            return res.status(409).json({ message: 'No se puede eliminar: la parte tiene movimientos de inventario asociados.' });
        }
        await logActivity(req, 'eliminar_parte', 'ParteRepuesto', req.params.id, { error: error.message }, 'FALLO');
        res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
    }
});

module.exports = router;