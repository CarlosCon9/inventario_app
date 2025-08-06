// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/store/authStore";

// --- AJUSTE CLAVE: IMPORTACIÓN ESTÁTICA ---
// Importamos los componentes críticos directamente al inicio.
// Esto asegura que siempre estén disponibles y previene la condición de carrera.
import DefaultLayout from "@/layouts/default.vue";
import LoginView from "@/views/LoginView.vue";
import DashboardView from "@/views/DashboardView.vue";

const routes = [
  {
    path: "/",
    component: DefaultLayout, // Usamos el componente ya importado
    meta: { requiresAuth: true },
    children: [
      {
        path: "dashboard",
        name: "Dashboard",
        component: DashboardView, // Usamos el componente ya importado
      },
      {
        path: "partes",
        name: "Partes",
        // Las rutas menos críticas pueden seguir usando carga dinámica para optimizar
        component: () => import("@/views/PartesView.vue"),
      },
      {
        path: "proveedores",
        name: "Proveedores",
        component: () => import("@/views/ProveedoresView.vue"),
      },
      {
        path: "movimientos",
        name: "Movimientos",
        component: () => import("@/views/MovimientosView.vue"),
      },
      {
        path: "admin/usuarios",
        name: "Usuarios",
        component: () => import("@/views/UsuariosView.vue"),
      },
    ],
  },
  {
    path: "/login",
    name: "Login",
    component: LoginView, // Usamos el componente ya importado
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/login",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// El Guardia de Navegación se mantiene igual, ya es robusto.
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (!authStore.isAuthenticated && localStorage.getItem("token")) {
    authStore.token = localStorage.getItem("token");
    authStore.user = JSON.parse(localStorage.getItem("user"));
  }
  const isAuthenticated = authStore.isAuthenticated;

  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: "Login" });
  } else if (to.name === "Login" && isAuthenticated) {
    return next({ name: "Dashboard" });
  } else if (to.path === "/" && isAuthenticated) {
    return next({ name: "Dashboard" });
  } else {
    next();
  }
});

export default router;
