// routes/parteRepuestoRoutes.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');

// Importa los modelos necesarios
const { ParteRepuesto, Proveedor, RegistroActividad, Configuracion } = require('../models'); // <-- Añadido Configuracion
// Importa las funciones de seguridad
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// Importa el objeto sequelize para transacciones
const { sequelize } = require('../config/database');

// Función auxiliar para registrar actividad
async function logActivity(req, tipo_accion, objeto_tipo, objeto_id, cambios_detalle, resultado) {
    try {
        await RegistroActividad.create({
            usuario_id: req.user.id,
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

/**
 * @function calcularPrecioVenta
 * @description Calcula el precio de venta basado en el precio de compra y el porcentaje de ganancia de la DB.
 * @param {number} precioCompra - El precio de compra del producto.
 * @returns {Promise<number|null>} El precio de venta calculado o null si no se puede calcular.
 */
async function calcularPrecioVenta(precioCompra) {
    if (precioCompra === null || precioCompra === undefined || isNaN(parseFloat(precioCompra))) {
        return null;
    }
    const gananciaSetting = await Configuracion.findByPk('porcentaje_ganancia');
    if (!gananciaSetting || isNaN(parseFloat(gananciaSetting.valor))) {
        // Si no hay configuración de ganancia, no se calcula el precio de venta.
        return null;
    }
    const porcentaje = parseFloat(gananciaSetting.valor);
    const precioVenta = parseFloat(precioCompra) * (1 + (porcentaje / 100));
    // Redondeamos a 2 decimales
    return Math.round(precioVenta * 100) / 100;
}


// --- Rutas CRUD para Partes/Repuestos ---

// POST /api/partes-repuestos (Crear)
router.post('/', protect, authorizeRoles(['administrador', 'operador']), async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const datos = req.body;

        // Si se proporciona un precio de compra, calculamos el de venta
        if (datos.precio_compra) {
            const precioVentaCalculado = await calcularPrecioVenta(datos.precio_compra);
            if (precioVentaCalculado !== null) {
                datos.precio_venta_sugerido = precioVentaCalculado;
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
        res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
    }
});

// GET /api/partes-repuestos (Listar)
router.get('/', protect, authorizeRoles(['administrador', 'operador', 'consulta']), async (req, res) => {
    // ... (Esta ruta no necesita cambios, la mantenemos como está)
    try {
        const partes = await ParteRepuesto.findAll({ include: [{ model: Proveedor, as: 'proveedor', attributes: ['id', 'nombre'] }] });
        res.status(200).json(partes);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener partes.', error: error.message });
    }
});

// GET /api/partes-repuestos/:id (Obtener por ID)
router.get('/:id', protect, authorizeRoles(['administrador', 'operador', 'consulta']), async (req, res) => {
    // ... (Esta ruta no necesita cambios, la mantenemos como está)
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

// PUT /api/partes-repuestos/:id (Actualizar)
router.put('/:id', protect, authorizeRoles(['administrador', 'operador']), async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const parte = await ParteRepuesto.findByPk(req.params.id, { transaction: t });
        if (!parte) {
            await t.rollback();
            return res.status(404).json({ message: 'Parte/repuesto no encontrado.' });
        }

        const oldData = parte.toJSON();
        const datosActualizar = req.body;

        // Si el precio de compra cambia, recalculamos el precio de venta sugerido
        if (datosActualizar.precio_compra !== undefined) {
            const precioVentaCalculado = await calcularPrecioVenta(datosActualizar.precio_compra);
            if (precioVentaCalculado !== null) {
                datosActualizar.precio_venta_sugerido = precioVentaCalculado;
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
        res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
    }
});

// DELETE /api/partes-repuestos/:id (Eliminar)
router.delete('/:id', protect, authorizeRoles(['administrador']), async (req, res) => {
    // ... (Esta ruta no necesita cambios, la mantenemos como está)
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
        // Manejo de error de clave foránea si la parte tiene movimientos
        if (error.name === 'SequelizeForeignKeyConstraintError') {
             await logActivity(req, 'eliminar_parte', 'ParteRepuesto', req.params.id, { error: 'Violación de FK' }, 'FALLO');
            return res.status(409).json({ message: 'No se puede eliminar: la parte tiene movimientos de inventario asociados.' });
        }
        await logActivity(req, 'eliminar_parte', 'ParteRepuesto', req.params.id, { error: error.message }, 'FALLO');
        res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
    }
});

module.exports = router;