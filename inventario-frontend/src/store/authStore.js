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
        this.token = token;
        this.user = user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        return true;
      } catch (error) {
        this.logout(false);
        throw error;
      }
    },
    logout(redirect = true) {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (redirect) {
        window.location.href = '/login';
      }
    },
  },
});