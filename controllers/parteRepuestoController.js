// controllers/parteRepuestoController.js

const { Op, Sequelize } = require('sequelize');
const { ParteRepuesto, Proveedor, MovimientoInventario, sequelize } = require('../models');


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


exports.getAllPartesRepuestos = async (req, res) => {
    try {
        // 1. Extraemos los parámetros de paginación, orden y búsqueda desde la URL.
        //    Establecemos valores por defecto si no vienen en la petición.
        const { page = 1, itemsPerPage = 10, sortBy = [], search = '' } = req.query;

        // 2. Preparamos el objeto de opciones para la consulta de Sequelize.
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

        // 3. Construimos la cláusula de ordenamiento.
        //    Vuetify envía 'sortBy' como un arreglo de objetos JSON string.
        if (sortBy && sortBy.length > 0) {
            // Aseguramos que sea un arreglo antes de mapearlo.
            const parsedSortBy = typeof sortBy === 'string' ? JSON.parse(sortBy) : sortBy;
            options.order = parsedSortBy.map(sort => [sort.key, sort.order ? sort.order.toUpperCase() : 'ASC']);
        } else {
            // Un orden por defecto si no se especifica ninguno.
            options.order.push(['nombre', 'ASC']);
        }

        // 4. Construimos la cláusula de búsqueda.
        if (search) {
            options.where = {
                [Op.or]: [
                    { nombre: { [Op.iLike]: `%${search}%` } },
                    { numero_parte: { [Op.iLike]: `%${search}%` } },
                    { descripcion: { [Op.iLike]: `%${search}%` } }
                ]
            };
        }

        // 5. Ejecutamos la consulta con findAndCountAll.
        //    Esta función es perfecta porque devuelve tanto los items de la página actual como el conteo total.
        const { count, rows } = await ParteRepuesto.findAndCountAll(options);

        // 6. Enviamos la respuesta en el formato que espera v-data-table-server.
        res.status(200).json({
            items: rows,
            totalItems: count
        });

    } catch (error) {
        console.error('Error al obtener partes/repuestos:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};
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