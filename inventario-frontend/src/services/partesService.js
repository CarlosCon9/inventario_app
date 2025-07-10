// src/services/partesService.js
import apiClient from './api';

const buildFormData = (data, imagenFile) => {
    const formData = new FormData();
    for (const key in data) {
        if (data[key] !== null && data[key] !== undefined) {
            formData.append(key, data[key]);
        }
    }
    if (imagenFile) {
        formData.append('imagen', imagenFile);
    }
    return formData;
};

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

    createParte(data, imagenFile) {
        const formData = buildFormData(data, imagenFile);
        return apiClient.post('/partes-repuestos', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    updateParte(id, data, imagenFile) {
        const formData = buildFormData(data, imagenFile);
        return apiClient.put(`/partes-repuestos/${id}`, formData, {
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