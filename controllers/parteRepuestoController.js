// controllers/parteRepuestoController.js
const { Op } = require('sequelize');
const { ParteRepuesto, Proveedor, MovimientoInventario, sequelize } = require('../models');
const fs = require('fs');
const path = require('path');

const saveFile = (fileBuffer, parteId, originalName) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `parte-${parteId}-${uniqueSuffix}${path.extname(originalName)}`;
    const filePath = path.join('uploads/partes/', filename);
    fs.writeFileSync(filePath, fileBuffer);
    return filePath.replace(/\\/g, "/");
};

// Función de ayuda para calcular el precio de venta
const calcularPrecioVentaSugerido = (precioCompra, porcentajeGanancia) => {
    const precio = parseFloat(precioCompra);
    const porcentaje = parseFloat(porcentajeGanancia);
    if (!isNaN(precio) && !isNaN(porcentaje)) {
        const precioVenta = precio * (1 + (porcentaje / 100));
        return Math.round(precioVenta * 100) / 100;
    }
    return null;
};

// CREATE - Ahora maneja texto y archivo, y siempre calcula el precio.
exports.createParteRepuesto = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const parteData = req.body;
        
        // El backend recalcula el precio de venta, asegurando la lógica de negocio.
        parteData.precio_venta_sugerido = calcularPrecioVentaSugerido(parteData.precio_compra, parteData.porcentaje_ganancia);

        const nuevaParte = await ParteRepuesto.create(parteData, { transaction: t });

        if (req.file) {
            const imagePath = saveFile(req.file.buffer, nuevaParte.id, req.file.originalname);
            nuevaParte.imagen_url = imagePath;
            await nuevaParte.save({ transaction: t });
        }
        
        await t.commit();
        res.status(201).json(nuevaParte);
    } catch (error) {
        await t.rollback();
        console.error('Error al crear parte/repuesto:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// UPDATE - También maneja texto y archivo, y siempre calcula el precio.
exports.updateParteRepuesto = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const parte = await ParteRepuesto.findByPk(req.params.id, { transaction: t });
        if (!parte) {
            await t.rollback();
            return res.status(404).json({ message: 'Parte/repuesto no encontrado.' });
        }

        const datosActualizar = req.body;
        datosActualizar.precio_venta_sugerido = calcularPrecioVentaSugerido(datosActualizar.precio_compra, datosActualizar.porcentaje_ganancia);
        
        await parte.update(datosActualizar, { transaction: t });
        
        if (req.file) {
            const imagePath = saveFile(req.file.buffer, parte.id, req.file.originalname);
            parte.imagen_url = imagePath;
            await parte.save({ transaction: t });
        }

        await t.commit();
        const parteActualizada = await ParteRepuesto.findByPk(req.params.id, {
            include: [{ model: Proveedor, as: 'proveedor' }]
        });
        res.status(200).json(parteActualizada);
    } catch (error) {
        await t.rollback();
        console.error('Error al actualizar parte/repuesto:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// --- GET ALL (PAGINADA) - ¡LA FUNCIÓN QUE RESTAURAMOS! ---
// Esta función es crucial para que la tabla del frontend pueda mostrar los productos.
exports.getAllPartesRepuestos = async (req, res) => {
    try {
        const { page = 1, itemsPerPage = 10, sortBy = [], search = '' } = req.query;

        const options = {
            limit: parseInt(itemsPerPage, 10),
            offset: (parseInt(page, 10) - 1) * parseInt(itemsPerPage, 10),
            order: [],
            where: {},
            include: [{
                model: Proveedor,
                as: 'proveedor',
                attributes: ['id', 'nombre']
            }]
        };

        if (sortBy && sortBy.length > 0) {
            const parsedSortBy = typeof sortBy === 'string' ? JSON.parse(sortBy) : sortBy;
            options.order = parsedSortBy.map(sort => [sort.key, sort.order ? sort.order.toUpperCase() : 'ASC']);
        } else {
            options.order.push(['nombre', 'ASC']);
        }

        if (search) {
            options.where = {
                [Op.or]: [
                    { nombre: { [Op.iLike]: `%${search}%` } },
                    { numero_parte: { [Op.iLike]: `%${search}%` } },
                    { descripcion: { [Op.iLike]: `%${search}%` } }
                ]
            };
        }

        const { count, rows } = await ParteRepuesto.findAndCountAll(options);

        res.status(200).json({
            items: rows,
            totalItems: count
        });

    } catch (error) {
        console.error('Error al obtener partes/repuestos:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// --- CREATE - Maneja texto y archivo en una sola petición ---
exports.createParteRepuesto = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const parteData = req.body;
        // Creamos la parte primero para tener un ID.
        const nuevaParte = await ParteRepuesto.create(parteData, { transaction: t });

        // Si la petición incluye un archivo (gracias a multer), lo guardamos.
        if (req.file) {
            const imagePath = saveFile(req.file.buffer, nuevaParte.id, req.file.originalname);
            nuevaParte.imagen_url = imagePath;
            // Guardamos la nueva ruta de la imagen en el registro.
            await nuevaParte.save({ transaction: t });
        }
        
        await t.commit();
        res.status(201).json(nuevaParte);
    } catch (error) {
        await t.rollback();
        console.error('Error al crear parte/repuesto:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// --- UPDATE - También maneja texto y archivo en una sola petición ---
exports.updateParteRepuesto = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const parte = await ParteRepuesto.findByPk(req.params.id, { transaction: t });
        if (!parte) {
            await t.rollback();
            return res.status(404).json({ message: 'Parte/repuesto no encontrado.' });
        }

        // Actualizamos los datos de texto.
        await parte.update(req.body, { transaction: t });
        
        // Si la petición de actualización incluye un nuevo archivo, lo guardamos.
        if (req.file) {
            const imagePath = saveFile(req.file.buffer, parte.id, req.file.originalname);
            parte.imagen_url = imagePath;
            await parte.save({ transaction: t });
        }

        await t.commit();
        res.status(200).json(parte);
    } catch (error) {
        await t.rollback();
        console.error('Error al actualizar parte/repuesto:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// --- GET BY ID ---
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
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// --- DELETE ---
exports.deleteParteRepuesto = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const parte = await ParteRepuesto.findByPk(req.params.id, { transaction: t });
        if (!parte) {
            await t.rollback();
            return res.status(404).json({ message: 'Parte/repuesto no encontrado.' });
        }
        
        const movimientos = await MovimientoInventario.count({ where: { parte_repuesto_id: req.params.id } });
        if (movimientos > 0) {
             await t.rollback();
            return res.status(409).json({ message: `No se puede eliminar: la parte tiene ${movimientos} movimiento(s) de inventario asociados.` });
        }

        await parte.destroy({ transaction: t });
        await t.commit();
        res.status(200).json({ message: 'Parte/repuesto eliminado exitosamente.' });
    } catch (error) {
        await t.rollback();
        console.error('Error al eliminar parte/repuesto:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};