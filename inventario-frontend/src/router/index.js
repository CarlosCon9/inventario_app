// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/authStore';

// No necesitamos importar los componentes aquí arriba.

const routes = [
  {
    path: '/',
    // Usamos Lazy Loading para el layout. Esto es una mejor práctica.
    component: () => import('@/layouts/default.vue'),
    meta: { requiresAuth: true }, // Protegemos todas las rutas que usen este layout.
    children: [
      {
        path: 'dashboard', // La URL será /dashboard
        name: 'Dashboard',
        // --- CAMBIO CLAVE ---
        // Usamos una función de flecha para importar el componente.
        // Esto es "lazy loading" y es la forma correcta de registrar componentes de vista.
        component: () => import('@/views/DashboardView.vue'),
      },
      // Aquí añadiremos las demás vistas (partes, proveedores, etc.) en el futuro
    ]
  },
  {
    path: '/login',
    name: 'Login',
    // --- CAMBIO CLAVE ---
    // Hacemos lo mismo para la vista de Login.
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  { 
    path: '/:pathMatch(.*)*', 
    redirect: { name: 'Login' } // Es más robusto redirigir al nombre de la ruta
  }
];

const router = createRouter({
  history: createWebHistory(), // Corregido para no usar process.env
  routes
});

// El Guardia de Navegación se mantiene igual
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  // Si el token está en localStorage pero no en el store (ej. después de recargar la página), lo restauramos.
  if (!authStore.isAuthenticated && localStorage.getItem('token')) {
    authStore.token = localStorage.getItem('token');
    authStore.user = JSON.parse(localStorage.getItem('user'));
  }

  const isAuthenticated = authStore.isAuthenticated;

  // Si la ruta requiere autenticación y el usuario NO está logueado...
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'Login' });
  } 
  // Si el usuario intenta ir al login pero YA está logueado...
  else if (to.name === 'Login' && isAuthenticated) {
    return next({ name: 'Dashboard' });
  } 
  // Si un usuario logueado va a la ruta raíz ('/'), lo mandamos al dashboard
  else if (to.path === '/' && isAuthenticated) {
    return next({ name: 'Dashboard' });
  }
  // En cualquier otro caso, le permitimos el paso.
  else {
    next();
  }
});

export default router;