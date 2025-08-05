// src/services/movimientosService.js
import apiClient from './api';

export default {
    /**
     * Crea un nuevo movimiento de inventario.
     * @param {object} data - { parte_repuesto_id, tipo_movimiento, cantidad_movimiento, descripcion_movimiento }
     */
    createMovimiento(data) {
        return apiClient.post('/movimientos', data);
    },
};