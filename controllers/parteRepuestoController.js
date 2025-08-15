//Agosto 14 de 2025
// controllers/parteRepuestoController.js
const { Op, Sequelize } = require('sequelize');
const { ParteRepuesto, Proveedor, MovimientoInventario, sequelize } = require('../models');
const fs = require('fs');
const path = require('path');


const saveFile = (fileBuffer, parteId, originalName, subfolder) => {
    const filePath = path.join(`uploads/${subfolder}/`, originalName);
    fs.writeFileSync(filePath, fileBuffer);
    return filePath.replace(/\\/g, "/");
};


/* const saveFile = (fileBuffer, parteId, originalName, subfolder) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = subfolder === 'partes-manuales' ? 'manual' : 'parte';
    const filename = `${prefix}-${parteId}-${uniqueSuffix}${path.extname(originalName)}`;
    const filePath = path.join(`uploads/${subfolder}/`, filename);
    fs.writeFileSync(filePath, fileBuffer);
    return filePath.replace(/\\/g, "/");
}; */
 

/* const saveFile = (fileBuffer, originalName, subfolder) => {
    const filename = originalName;
    const directory = path.join('uploads', subfolder);
    fs.mkdirSync(directory, { recursive: true }); // Asegura que la carpeta exista
    const filePath = path.join(directory, filename);
    fs.writeFileSync(filePath, fileBuffer);
    return filePath.replace(/\\/g, "/");
}; */


const calcularPrecioVentaSugerido = (precioCompra, porcentajeGanancia) => {
    const precio = parseFloat(precioCompra);
    const porcentaje = parseFloat(porcentajeGanancia);
    if (!isNaN(precio) && !isNaN(porcentaje)) {
        const precioVenta = precio * (1 + (porcentaje / 100));
        return Math.round(precioVenta * 100) / 100;
    }
    return null;
};

exports.createParteRepuesto = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const parteData = req.body;
        parteData.cantidad = 0;
        parteData.precio_venta_sugerido = calcularPrecioVentaSugerido(parteData.precio_compra, parteData.porcentaje_ganancia);
        const nuevaParte = await ParteRepuesto.create(parteData, { transaction: t });
        await t.commit();
        res.status(201).json(nuevaParte);
    } catch (error) {
        await t.rollback();
        console.error('Error al crear parte/repuesto:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

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
        await t.commit();
        const parteActualizada = await ParteRepuesto.findByPk(req.params.id, { include: [{ model: Proveedor, as: 'proveedor' }] });
        res.status(200).json(parteActualizada);
    } catch (error) {
        await t.rollback();
        console.error('Error al actualizar parte/repuesto:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

exports.uploadImagen = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const parte = await ParteRepuesto.findByPk(req.params.id, { transaction: t });
        if (!parte) { await t.rollback(); return res.status(404).json({ message: 'Parte/repuesto no encontrado.' }); }
        if (!req.file) { await t.rollback(); return res.status(400).json({ message: 'No se ha subido ninguna imagen.' }); }
        const imagePath = saveFile(req.file.buffer, parte.id, req.file.originalname, 'partes-imagenes');
        parte.imagen_url = imagePath;
        await parte.save({ transaction: t });
        await t.commit();
        res.status(200).json(parte);
    } catch (error) {
        await t.rollback();
        console.error('Error al subir imagen:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

exports.uploadManual = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const parte = await ParteRepuesto.findByPk(req.params.id, { transaction: t });
        if (!parte) { await t.rollback(); return res.status(404).json({ message: 'Parte/repuesto no encontrado.' }); }
        if (!req.file) { await t.rollback(); return res.status(400).json({ message: 'No se ha subido ningún manual.' }); }
        const manualPath = saveFile(req.file.buffer, parte.id, req.file.originalname, 'partes-manuales');
        parte.manual_url = manualPath;
        await parte.save({ transaction: t });
        await t.commit();
        res.status(200).json(parte);
    } catch (error) {
        await t.rollback();
        console.error('Error al subir manual:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

exports.getAllPartesRepuestos = async (req, res) => {
    try {
        const { page = 1, itemsPerPage = 10, sortBy = '[]', search = '' } = req.query;
        const options = {
            limit: parseInt(itemsPerPage, 10),
            offset: (parseInt(page, 10) - 1) * parseInt(itemsPerPage, 10),
            order: [],
            where: {},
            include: [{ model: Proveedor, as: 'proveedor', attributes: ['id', 'nombre'] }]
        };
        const parsedSortBy = JSON.parse(sortBy);
        if (parsedSortBy && parsedSortBy.length > 0) {
            options.order = parsedSortBy.map(sort => [sort.key, sort.order ? sort.order.toUpperCase() : 'ASC']);
        } else {
            options.order.push(['nombre', 'ASC']);
        }
        if (search) {
            options.where = {
                [Op.or]: [
                    { nombre: { [Op.iLike]: `%${search}%` } },
                    { numero_parte: { [Op.iLike]: `%${search}%` } }
                ]
            };
        }
        const { count, rows } = await ParteRepuesto.findAndCountAll(options);
        res.status(200).json({ items: rows, totalItems: count });
    } catch (error) {
        console.error('Error al obtener partes:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

exports.deleteParteRepuesto = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        // 1. Buscamos el registro que se va a eliminar para obtener las rutas de los archivos.
        const parte = await ParteRepuesto.findByPk(req.params.id, { transaction: t });
        if (!parte) {
            await t.rollback();
            return res.status(404).json({ message: 'Parte/repuesto no encontrado.' });
        }

        // Guardamos las rutas de los archivos antes de borrar el registro.
        const imagenPath = parte.imagen_url;
        const manualPath = parte.manual_url;
        
        // 2. Verificamos si hay movimientos asociados.
        const movimientos = await MovimientoInventario.count({ where: { parte_repuesto_id: req.params.id } });
        if (movimientos > 0) {
             await t.rollback();
            return res.status(409).json({ message: `No se puede eliminar: la parte tiene ${movimientos} movimiento(s) de inventario asociados.` });
        }

        // 3. Eliminamos el registro de la base de datos.
        await parte.destroy({ transaction: t });

        // 4. Si la eliminación en la base de datos fue exitosa, borramos los archivos físicos.
        if (imagenPath) {
            // fs.unlink es el comando de Node.js para borrar un archivo.
            fs.unlink(path.join(__dirname, '..', imagenPath), (err) => {
                if (err) console.error(`Error al eliminar imagen ${imagenPath}:`, err);
                else console.log(`Imagen eliminada: ${imagenPath}`);
            });
        }
        if (manualPath) {
            fs.unlink(path.join(__dirname, '..', manualPath), (err) => {
                if (err) console.error(`Error al eliminar manual ${manualPath}:`, err);
                else console.log(`Manual eliminado: ${manualPath}`);
            });
        }
        
        // 5. Confirmamos la transacción solo si todo ha ido bien.
        await t.commit();
        res.status(200).json({ message: 'Parte/repuesto eliminado exitosamente.' });
    } catch (error) {
        await t.rollback();
        console.error('Error al eliminar parte/repuesto:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

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

exports.searchPartes = async (req, res) => {
   
    try {
        const { query } = req.query;
        if (!query || query.length < 2) {
            return res.status(200).json([]);
        }

        const partes = await ParteRepuesto.findAll({
            where: {
                [Op.or]: [
                    { nombre: { [Op.iLike]: `%${query}%` } },
                    { numero_parte: { [Op.iLike]: `%${query}%` } }
                ]
            },
            limit: 10,
            attributes: ['id', 'nombre', 'numero_parte', 'cantidad']
        });

        
        res.status(200).json(partes);
    } catch (error) {
      
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};