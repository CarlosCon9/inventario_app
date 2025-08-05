// src/services/api.js
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const apiClient = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
});

// --- INTERCEPTOR DE PETICIONES A PRUEBA DE BALAS ---
apiClient.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore();
        // Intentamos obtener el token desde el store reactivo de Pinia.
        let token = authStore.token;

        // --- LÓGICA DE RESPALDO (LA SOLUCIÓN) ---
        // Si el token del store es nulo (posible durante la condición de carrera del login),
        // intentamos leerlo directamente desde el localStorage, que es síncrono.
        if (!token) {
            token = localStorage.getItem('token');
        }

        // Si, después de ambas verificaciones, tenemos un token, lo añadimos a la cabecera.
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// El interceptor de respuestas se mantiene igual, ya es robusto.
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const authStore = useAuthStore();
            authStore.logout();
        }
        return Promise.reject(error);
    }
);

export default apiClient;