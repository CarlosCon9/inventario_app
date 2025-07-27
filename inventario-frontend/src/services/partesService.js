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
    createParte(data) {
        return apiClient.post('/partes-repuestos', data);
    },
    updateParte(id, data) {
        return apiClient.put(`/partes-repuestos/${id}`, data);
    },
    uploadImagen(id, imagenFile) {
        const formData = new FormData();
        formData.append('imagen', imagenFile);
        return apiClient.put(`/partes-repuestos/${id}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    deleteParte(id) {
        return apiClient.delete(`/partes-repuestos/${id}`);
    },
    getProveedoresList() {
        return apiClient.get('/proveedores/todos');
    }
};