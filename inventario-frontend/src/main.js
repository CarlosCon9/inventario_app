// src/main.js

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import vuetify from './plugins/vuetify';
import { createPinia } from 'pinia';
import { useAuthStore } from '@/store/authStore';

// --- LÓGICA AÑADIDA PARA LIMPIAR SESIÓN AL INICIO ---
// Esta es la primera pieza de código que se ejecuta cuando la aplicación carga.
// Le decimos al navegador que elimine cualquier token o dato de usuario guardado.
// Esto garantiza que cada vez que se reinicia el servidor o se abre la app
// en una nueva sesión, se deba iniciar sesión de nuevo.
localStorage.removeItem('token');
localStorage.removeItem('user');
// ----------------------------------------------------

// 1. Crear las instancias de la app y de Pinia
const app = createApp(App);
const pinia = createPinia();

// 2. Usar Pinia y Vuetify
app.use(pinia);
app.use(vuetify);

// La lógica del Guardia de Navegación se mantiene igual.
// Ahora, cuando se ejecute, nunca encontrará un token en el localStorage al inicio.
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'Login' });
  } 
  else if (to.name === 'Login' && isAuthenticated) {
    next({ name: 'Dashboard' });
  } 
  else if (to.path === '/' && isAuthenticated) {
    next({ name: 'Dashboard' });
  }
  else {
    next();
  }
});

// 3. Finalmente, registramos el router y montamos la aplicación.
app.use(router);
app.mount('#app');