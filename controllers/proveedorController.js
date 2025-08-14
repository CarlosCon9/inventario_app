//Agosto 14 de 2025
/**
 * controllers/proveedorController.js
 * Este archivo contiene toda la lógica de negocio para manejar las operaciones
 * relacionadas con los proveedores.
 */

// --- 1. IMPORTACIONES ---
const { Op } = require('sequelize');
const { Proveedor, ParteRepuesto } = require('../models');

// --- 2. CONTROLADORES EXPORTADOS ---

/**
 * @controller  getAllProveedores
 * @description Obtiene una lista paginada, ordenada y filtrable de todos los proveedores.
 * Diseñado para funcionar con v-data-table-server.
 * @route       GET /api/proveedores
 */
exports.getAllProveedores = async (req, res) => {
    try {
        // Extraemos los parámetros de la petición. Si no vienen, usamos valores por defecto.
        const { page = 1, itemsPerPage = 10, sortBy = '[]', search = '' } = req.query;

        // Preparamos el objeto de opciones para la consulta de Sequelize.
        const options = {
            limit: parseInt(itemsPerPage, 10),
            offset: (parseInt(page, 10) - 1) * parseInt(itemsPerPage, 10),
            order: [],
            where: {}
        };

        // Construimos la cláusula de ordenamiento a partir del parámetro 'sortBy'.
        const parsedSortBy = JSON.parse(sortBy);
        if (parsedSortBy && parsedSortBy.length > 0) {
            options.order = parsedSortBy.map(sort => [sort.key, sort.order ? sort.order.toUpperCase() : 'ASC']);
        } else {
            // Un orden por defecto si el frontend no especifica ninguno.
            options.order.push(['nombre', 'ASC']);
        }

        // Construimos la cláusula de búsqueda si el usuario escribió algo en el buscador.
        if (search) {
            options.where = {
                [Op.or]: [
                    { nombre: { [Op.iLike]: `%${search}%` } },
                    { contacto_principal: { [Op.iLike]: `%${search}%` } },
                    { correo_electronico: { [Op.iLike]: `%${search}%` } }
                ]
            };
        }

        // Ejecutamos la consulta que cuenta el total y devuelve solo la página actual.
        const { count, rows } = await Proveedor.findAndCountAll(options);

        // Enviamos la respuesta en el formato que espera la tabla del frontend.
        res.status(200).json({
            items: rows,
            totalItems: count
        });

    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * @controller  getTodosLosProveedores
 * @description Devuelve una lista simple de todos los proveedores (para selects/dropdowns).
 * @route       GET /api/proveedores/todos
 */
exports.getTodosLosProveedores = async (req, res) => {
    try {
        const proveedores = await Proveedor.findAll({
            order: [['nombre', 'ASC']],
            attributes: ['id', 'nombre'] // Solo enviamos el ID y el nombre.
        });
        res.status(200).json(proveedores);
    } catch (error) {
        console.error('Error al obtener la lista de proveedores:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * @controller  createProveedor
 * @description Crea un nuevo proveedor en la base de datos.
 */
exports.createProveedor = async (req, res) => {
    try {
        const nuevoProveedor = await Proveedor.create(req.body);
        res.status(201).json(nuevoProveedor);
    } catch (error) {
        console.error('Error al crear proveedor:', error);
        // Manejo de errores de validación de Sequelize (ej. nombre duplicado)
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'Ya existe un proveedor con ese nombre.' });
        }
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * @controller  updateProveedor
 * @description Actualiza un proveedor existente por su ID.
 */
exports.updateProveedor = async (req, res) => {
    try {
        const proveedor = await Proveedor.findByPk(req.params.id);
        if (!proveedor) {
            return res.status(404).json({ message: 'Proveedor no encontrado.' });
        }
        await proveedor.update(req.body);
        res.status(200).json(proveedor);
    } catch (error) {
        console.error('Error al actualizar proveedor:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'Ya existe un proveedor con ese nombre.' });
        }
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * @controller  deleteProveedor
 * @description Elimina un proveedor por su ID, con validación de dependencias.
 */
exports.deleteProveedor = async (req, res) => {
    try {
        const proveedorId = req.params.id;
        const proveedor = await Proveedor.findByPk(proveedorId);
        if (!proveedor) {
            return res.status(404).json({ message: 'Proveedor no encontrado.' });
        }

        // Verificamos si este proveedor tiene partes/repuestos asociados.
        const partesAsociadas = await ParteRepuesto.count({ where: { proveedor_id: proveedorId } });
        if (partesAsociadas > 0) {
            // Si tiene, no permitimos el borrado para mantener la integridad de los datos.
            return res.status(409).json({ message: `No se puede eliminar: el proveedor tiene ${partesAsociadas} parte(s) asociada(s).` });
        }

        await proveedor.destroy();
        res.status(200).json({ message: 'Proveedor eliminado exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar proveedor:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};