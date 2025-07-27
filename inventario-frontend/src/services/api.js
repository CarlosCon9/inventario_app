// src/services/api.js
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
const apiClient = axios.create({ baseURL: 'http://localhost:3000/api' });
apiClient.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore();
        if (authStore.token) {
            config.headers['Authorization'] = `Bearer ${authStore.token}`;
        }
        console.log('🕵️‍♂️ [ESPÍA #6 - api.js]: Interceptor de Petición. Config:', config);
        return config;
    },
    (error) => Promise.reject(error)
);
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            useAuthStore().logout();
        }
        return Promise.reject(error);
    }
);
export default apiClient;