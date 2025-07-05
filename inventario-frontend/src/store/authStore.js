// src/store/authStore.js

import { defineStore } from 'pinia';
import authService from '@/services/authService';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => (state.user ? state.user.rol : null),
  },

  actions: {
    async login(credentials) {
      try {
        const response = await authService.login(credentials);
        const { token, user } = response.data;

        // Su única responsabilidad: actualizar el estado y el localStorage.
        this.token = token;
        this.user = user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Ya no redirige. Simplemente confirma el éxito.
        return true; 

      } catch (error) {
        // En caso de error, limpia todo y lanza el error hacia la vista.
        this.logout(false); // Llamamos a logout sin redirigir
        console.error('Error en la acción de login:', error);
        throw error;
      }
    },

    logout(redirect = true) {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Solo redirige si se lo pedimos.
      if (redirect) {
        // Usamos window.location para una recarga completa, asegurando que todo el estado se limpie.
        window.location.href = '/login';
      }
    },
  },
});