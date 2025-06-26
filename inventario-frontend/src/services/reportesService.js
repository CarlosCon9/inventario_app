// src/services/reportesService.js

import apiClient from './api'; // Importamos nuestro cliente de API configurado

/**
 * Este objeto exporta todas las funciones que se comunican
 * con los endpoints de reportes del backend.
 */
export default {
    /**
     * Obtiene el reporte de valorización de inventario.
     * @returns {Promise} La promesa de la petición de Axios.
     */
    getValorInventario() {
        return apiClient.get('/reportes/valor-inventario');
    },

    /**
     * Obtiene el reporte de partes con bajo stock.
     * @returns {Promise} La promesa de la petición de Axios.
     */
    getBajoStock() {
        return apiClient.get('/reportes/bajo-stock');
    },
};