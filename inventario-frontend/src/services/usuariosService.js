// src/services/usuariosService.js
import apiClient from './api';

export default {
    getUsuarios(options) {
        const params = new URLSearchParams();
        if (options.page) params.append('page', options.page);
        if (options.itemsPerPage) params.append('itemsPerPage', options.itemsPerPage);
        if (options.search) params.append('search', options.search);
        if (options.sortBy && options.sortBy.length > 0) {
            params.append('sortBy', JSON.stringify(options.sortBy));
        }
        return apiClient.get('/usuarios', { params });
    },
    createUsuario(data) {
        console.log('🕵️‍♂️ [ESPÍA #4 - usuariosService]: Enviando petición POST a /usuarios con datos:', data);
        return apiClient.post('/usuarios', data);
    },
    updateUsuario(id, data) {
        console.log(`🕵️‍♂️ [ESPÍA #4 - usuariosService]: Enviando petición PUT a /usuarios/${id} con datos:`, data);
        return apiClient.put(`/usuarios/${id}`, data);
    },
    deleteUsuario(id) {
        console.log(`🕵️‍♂️ [ESPÍA #4 - usuariosService]: Enviando petición DELETE a /usuarios/${id}`);
        return apiClient.delete(`/usuarios/${id}`);
    }
};