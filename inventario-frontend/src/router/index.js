// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'; // Importamos nuestra nueva vista

const routes = [
  {
    path: '/',
    redirect: '/login' // Si alguien va a la raíz, lo mandamos al login
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  {
    // Esta es una ruta de ejemplo para el dashboard, la construiremos después.
    path: '/dashboard',
    name: 'Dashboard',
    // Esto es "lazy loading", una mejor práctica que hace que la página
    // solo se cargue cuando el usuario la visita.
    component: () => import('@/views/DashboardView.vue') 
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router