// src/main.js

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { createPinia } from 'pinia'

const app = createApp(App)
const pinia = createPinia()

// --- ORDEN CORREGIDO (MEJOR PRÁCTICA) ---
app.use(pinia)   // 1. Registra Pinia para que esté disponible en toda la app.
app.use(router)  // 2. Registra el Router, que ahora puede usar Pinia en sus guardias.
app.use(vuetify) // 3. Registra Vuetify.

app.mount('#app')