// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/authStore';

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/default.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue'),
      },
      {
        path: 'partes', 
        name: 'Partes',
        component: () => import('@/views/PartesView.vue'),
      },
      {
        path: 'proveedores',
        name: 'Proveedores',
        component: () => import('@/views/ProveedoresView.vue'),
      }
    ]
  },
  {
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

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (!authStore.isAuthenticated && localStorage.getItem('token')) {
    authStore.token = localStorage.getItem('token');
    authStore.user = JSON.parse(localStorage.getItem('user'));
  }
  const isAuthenticated = authStore.isAuthenticated;

  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'Login' });
  } 
  else if (to.name === 'Login' && isAuthenticated) {
    return next({ name: 'Dashboard' });
  } 
  else if (to.path === '/' && isAuthenticated) {
    return next({ name: 'Dashboard' });
  }
  else {
    next();
  }
});

export default router;