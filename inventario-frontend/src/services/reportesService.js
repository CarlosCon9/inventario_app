// src/services/reportesService.js
import apiClient from './api';

export default {
    getDashboardStats() {
        return apiClient.get('/reportes/dashboard-stats');
    },
    getBajoStock() {
        return apiClient.get('/reportes/bajo-stock');
    },
    // --- ASEGÚRATE DE QUE ESTA FUNCIÓN EXISTA ---
    getValorInventario() {
        return apiClient.get('/reportes/valor-inventario');
    },
};