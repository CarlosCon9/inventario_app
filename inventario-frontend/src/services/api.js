// src/services/api.js
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const apiClient = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor de Peticiones: Añade el token a cada llamada.
apiClient.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore();
        const token = authStore.token;
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- INTERCEPTOR DE RESPUESTAS (AÑADIDO Y CRUCIAL) ---
// Este interceptor nos permite manejar los errores de forma centralizada.
apiClient.interceptors.response.use(
    // Si la respuesta es exitosa (código 2xx), simplemente la devolvemos.
    (response) => response,

    // Si la respuesta tiene un error (código 4xx o 5xx)...
    (error) => {
        // Si el error es un 401 (No Autorizado), significa que el token es inválido o expiró.
        // La mejor práctica es desloguear al usuario y mandarlo al login.
        if (error.response && error.response.status === 401) {
            const authStore = useAuthStore();
            authStore.logout();
        }

        // Es MUY IMPORTANTE que devolvamos el error para que la función que
        // hizo la llamada original (ej. en la vista) pueda atraparlo en su bloque `catch`.
        // Si no hacemos esto, la vista recibirá 'undefined'.
        return Promise.reject(error);
    }
);

export default apiClient;