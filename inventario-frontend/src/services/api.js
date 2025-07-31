// src/services/api.js
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// Leemos la URL base de nuestro backend desde las variables de entorno.
// Vite reemplazará 'import.meta.env.VITE_API_BASE_URL' con el valor de tu archivo .env.
const baseURL = `${import.meta.env.VITE_API_BASE_URL}/api`;

const apiClient = axios.create({
    baseURL: baseURL
});

// Interceptor de Peticiones: Añade el token de autorización a cada llamada.
apiClient.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore();
        if (authStore.token) {
            config.headers['Authorization'] = `Bearer ${authStore.token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor de Respuestas: Maneja errores globales como un token expirado.
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Si el token es inválido, deslogueamos al usuario.
            useAuthStore().logout();
        }
        return Promise.reject(error);
    }
);

export default apiClient;