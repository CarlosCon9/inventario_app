// src/services/partesService.js
import apiClient from './api';

export default {
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

    // --- FUNCIÓN CORREGIDA ---
    uploadImagen(id, formData) {
        // Le pasamos explícitamente la cabecera 'multipart/form-data'.
        // Esto le dice a Axios y al servidor cómo manejar la petición de archivo.
        return apiClient.put(`/partes-repuestos/${id}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    getProveedoresList() {
        return apiClient.get('/proveedores/todos');
    }
};