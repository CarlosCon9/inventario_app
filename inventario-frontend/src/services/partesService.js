// src/services/partesService.js
import apiClient from './api';

export default {
    // --- OBTENER LISTA PAGINADA (Existente) ---
    getPartes(options) {
        const params = new URLSearchParams();
        if (options.page) params.append('page', options.page);
        if (options.itemsPerPage) params.append('itemsPerPage', options.itemsPerPage);
        if (options.search) params.append('search', options.search);
        if (options.sortBy && options.sortBy.length > 0) {
            params.append('sortBy', JSON.stringify(options.sortBy));
        }
        return apiClient.get('/partes-repuestos', { params });
    },

    // --- FUNCIONES CRUD (Existentes y verificadas) ---
    getParteById(id) {
        return apiClient.get(`/partes-repuestos/${id}`);
    },
    createParte(data) {
        return apiClient.post('/partes-repuestos', data);
    },
    updateParte(id, data) {
        return apiClient.put(`/partes-repuestos/${id}`, data);
    },
    deleteParte(id) {
        return apiClient.delete(`/partes-repuestos/${id}`);
    },
    uploadImagen(id, formData) {
        return apiClient.put(`/partes-repuestos/${id}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    // --- NUEVA FUNCIÓN ---
    /**
     * Obtiene la lista completa de proveedores para usar en un select.
     */
    getProveedoresList() {
        return apiClient.get('/proveedores/todos');
    }
};