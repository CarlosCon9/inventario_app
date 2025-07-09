// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/authStore';

const routes = [
  {
    // --- RUTA PADRE ---
    // Esta ruta carga nuestro layout principal y protege todas las rutas hijas.
    path: '/',
    component: () => import('@/layouts/default.vue'),
    meta: { requiresAuth: true },
    children: [ // <-- Las vistas internas van aquí dentro
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue'),
      },
      // --- RUTA CORREGIDA Y EN SU LUGAR CORRECTO ---
      // Como es una ruta hija de '/', su path es relativo ('partes').
      // Vue Router lo unirá para formar la URL completa '/partes'.
      {
        path: 'partes', 
        name: 'Partes',
        component: () => import('@/views/PartesView.vue'),
      },
      // Aquí añadiremos en el futuro las demás vistas internas...
    ]
  },
  {
    // La ruta de Login es independiente y no usa el layout principal.
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
  },
  { 
    path: '/:pathMatch(.*)*', 
    redirect: '/login' 
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// El Guardia de Navegación se mantiene igual, no necesita cambios.
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (!authStore.isAuthenticated && localStorage.getItem('token')) {
    authStore.token = localStorage.getItem('token');
    authStore.user = JSON.parse(localStorage.getItem('user'));
  }
  const isAuthenticated = authStore.isAuthenticated;

  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'Login' });
  } else if (to.name === 'Login' && isAuthenticated) {
    return next({ name: 'Dashboard' });
  } else if (to.path === '/' && isAuthenticated) {
    return next({ name: 'Dashboard' });
  } else {
    next();
  }
});

export default router;