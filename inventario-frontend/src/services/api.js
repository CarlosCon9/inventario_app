// src/services/api.js

import axios from 'axios';
import { useAuthStore } from '@/store/authStore'; // Importamos nuestro futuro store de autenticación

/**
 * Creación de una instancia de Axios con configuración base.
 * Esta es la forma profesional de manejar las llamadas a la API,
 * ya que centraliza la URL base y la configuración de cabeceras.
 */
const apiClient = axios.create({
    // La URL base de nuestro backend.
    // Todas las peticiones se harán a esta URL + el endpoint específico.
    baseURL: 'http://localhost:3000/api', // Apunta a nuestro servidor de Node.js
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Interceptor de peticiones de Axios.
 * Esta es una de las características más potentes de Axios.
 * Esta función se ejecutará ANTES de que cada petición sea enviada.
 * Su trabajo es revisar si tenemos un token de autenticación y añadirlo
 * a la cabecera 'Authorization' si existe.
 */
apiClient.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore(); // Obtenemos la instancia del store de Pinia
        const token = authStore.token;    // Obtenemos el token

        if (token) {
            // Si hay un token, lo añadimos a la cabecera de la petición
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        // Manejar errores de la configuración de la petición
        return Promise.reject(error);
    }
);

// Exportamos la instancia de apiClient para usarla en otros servicios
export default apiClient;