// src/services/proveedoresService.js
import apiClient from './api';

export default {
    /**
     * Obtiene la lista paginada de proveedores para la tabla.
     * @param {object} options - { page, itemsPerPage, sortBy, search }
     */
    getProveedores(options) {
        const params = new URLSearchParams();
        if (options.page) params.append('page', options.page);
        if (options.itemsPerPage) params.append('itemsPerPage', options.itemsPerPage);
        if (options.search) params.append('search', options.search);
        if (options.sortBy && options.sortBy.length > 0) {
            params.append('sortBy', JSON.stringify(options.sortBy));
        }
        return apiClient.get('/proveedores', { params });
    },

    /**
     * Crea un nuevo proveedor.
     * @param {object} data - Los datos del nuevo proveedor.
     */
    createProveedor(data) {
        return apiClient.post('/proveedores', data);
    },

    /**
     * Actualiza un proveedor existente.
     * @param {number} id - El ID del proveedor.
     * @param {object} data - Los nuevos datos.
     */
    updateProveedor(id, data) {
        return apiClient.put(`/proveedores/${id}`, data);
    },

    /**
     * Elimina un proveedor.
     * @param {number} id - El ID del proveedor.
     */
    deleteProveedor(id) {
        return apiClient.delete(`/proveedores/${id}`);
    }
};