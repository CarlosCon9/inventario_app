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

    /**
     * Obtiene la lista de todos los items únicos (SKUs).
     * @returns {Promise} La promesa de la petición de Axios.
     */
    getListaItemsUnicos() {
        return apiClient.get('/reportes/lista-items-unicos');
    },
};