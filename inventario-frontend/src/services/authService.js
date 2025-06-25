// src/services/authService.js

import apiClient from './api'; // Importamos nuestro cliente de API configurado

/**
 * Este objeto exporta todas las funciones que se comunican
 * con los endpoints de autenticación del backend.
 */
export default {
    /**
     * Envía las credenciales al endpoint de login.
     * @param {object} credentials - { correo_electronico, contrasena }
     * @returns {Promise} La promesa de la petición de Axios.
     */
    login(credentials) {
        return apiClient.post('/auth/login', credentials);
    },

    // Aquí añadiremos en el futuro funciones como register, forgotPassword, etc.
};