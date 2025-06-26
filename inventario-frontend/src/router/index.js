// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '@/layouts/default.vue'
import { useAuthStore } from '@/store/authStore'

const routes = [
  {
    // Esta es la ruta padre que usará nuestro layout principal.
    // Todas las rutas anidadas dentro de 'children' se mostrarán dentro de este layout.
    path: '/',
    component: DefaultLayout,
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { requiresAuth: true } // <-- Metadato para nuestro guardia
      },
      // Aquí añadiremos las demás rutas (partes, proveedores, etc.) en el futuro
    ],
  },
  {
    // La ruta de Login queda fuera del layout principal porque no tiene menú lateral.
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

// --- GUARDIA DE NAVEGACIÓN (NAVIGATION GUARD) ---
// Este código se ejecuta ANTES de cada cambio de ruta.
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;

  // 1. Si la ruta requiere autenticación y el usuario NO está logueado...
  if (to.meta.requiresAuth && !isAuthenticated) {
    // ...lo mandamos al login.
    next({ name: 'Login' });
  } 
  // 2. Si el usuario intenta ir al login pero YA está logueado...
  else if (to.name === 'Login' && isAuthenticated) {
    // ...lo mandamos al dashboard para que no vuelva a iniciar sesión.
    next({ name: 'Dashboard' });
  } 
  // 3. En cualquier otro caso, le permitimos continuar a su destino.
  else {
    next();
  }
});


export default router