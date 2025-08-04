// src/services/reportesService.js
import apiClient from './api';

export default {
    getDashboardStats() {
        return apiClient.get('/reportes/dashboard-stats');
    },
    getBajoStock() {
        return apiClient.get('/reportes/bajo-stock');
    },
    /**
     * Obtiene la lista de los últimos movimientos de inventario.
     */
    getMovimientosRecientes() {
        return apiClient.get('/reportes/movimientos-recientes');
    }
};
