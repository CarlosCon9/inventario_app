// src/store/authStore.js
import { defineStore } from 'pinia';
import authService from '@/services/authService';
import router from '@/router';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.rol,
  },
  actions: {
    async login(credentials) {
      try {
        const response = await authService.login(credentials);
        this.loginWithToken(response.data.token, response.data.user);
        return true;
      } catch (error) {
        this.logout(false);
        throw error;
      }
    },
    loginWithToken(token, user) {
      this.token = token;
      this.user = user;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    },
  },
});