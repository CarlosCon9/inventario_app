// src/store/authStore.js

import { defineStore } from 'pinia';
import authService from '@/services/authService'; // Importamos el servicio que hablará con la API
import router from '@/router';

// Usamos 'defineStore' para crear nuestro store. El primer argumento es un ID único.
export const useAuthStore = defineStore('auth', {
    // --- STATE ---
    // Aquí definimos los datos que queremos almacenar globalmente.
    // Intentamos inicializar el estado desde el localStorage.
    // Esto permite que la sesión del usuario persista si recarga la página.
    state: () => ({
        token: localStorage.getItem('token') || null,
        user: JSON.parse(localStorage.getItem('user')) || null,
    }),

    // --- GETTERS ---
    // Son como las propiedades computadas de los componentes.
    // Nos permiten derivar datos del estado.
    getters: {
        // Un getter para saber fácilmente si el usuario está autenticado.
        isAuthenticated: (state) => !!state.token,
        // Un getter para obtener el rol del usuario de forma segura.
        userRole: (state) => (state.user ? state.user.rol : null),
    },

    // --- ACTIONS ---
    // Aquí definimos los métodos que modificarán el estado.
    actions: {
        /**
         * Acción para manejar el inicio de sesión.
         * Llama al servicio de autenticación y, si tiene éxito,
         * actualiza el estado y guarda los datos en localStorage.
         * @param {object} credentials - { correo_electronico, contrasena }
         */
        async login(credentials) {
            try {
                const response = await authService.login(credentials);
                const { token, user } = response.data;

                // Actualizamos el estado de Pinia
                this.token = token;
                this.user = user;

                // Guardamos en localStorage para persistir la sesión
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));

                // Redirigimos al usuario al dashboard después del login
                router.push('/dashboard');

            } catch (error) {
                // Si hay un error, lo lanzamos para que el componente de Login lo pueda atrapar y mostrar un mensaje.
                console.error('Error en el login:', error);
                throw error;
            }
        },

        /**
         * Acción para manejar el cierre de sesión.
         * Limpia el estado y el localStorage.
         */
        logout() {
            this.token = null;
            this.user = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Redirigimos al login
            router.push('/login');
        },
    },
});