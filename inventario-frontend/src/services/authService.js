// src/services/authService.js
import apiClient from './api';

export default {
    login(credentials) {
        return apiClient.post('/auth/login', credentials);
    },

    forgotPassword(email) {
        return apiClient.post('/auth/forgot-password', { correo_electronico: email });
    },

    resetPassword(token, password) {
        return apiClient.put(`/auth/reset-password/${token}`, { password });
    },
};