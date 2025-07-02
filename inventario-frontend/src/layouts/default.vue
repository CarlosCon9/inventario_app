<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" app>
      <v-list-item class="pa-4">
        <v-list-item-title class="text-h6">Gestor de Inventario</v-list-item-title>
        <v-list-item-subtitle>Menú Principal</v-list-item-subtitle>
      </v-list-item>
      <v-divider></v-divider>
      <v-list dense nav>
        <div v-for="item in menuItems" :key="item.title">
          <v-list-item
            v-if="!item.rol || item.rol === authStore.userRole"
            :to="item.to"
            :prepend-icon="item.icon"
            :title="item.title"
            link
          ></v-list-item>
        </div>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title>Panel de Control</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" class="text-none">
            <v-icon left class="mr-2">mdi-account-circle</v-icon>
            Hola, {{ authStore.user?.nombre_usuario }}
            <v-icon right>mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="logout">
            <v-list-item-title>Cerrar Sesión</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

<v-main>
  <v-container fluid>
    <router-view />
  </v-container>
</v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/store/authStore';

const authStore = useAuthStore();
const drawer = ref(true);

const menuItems = ref([
  { title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/dashboard' },
  { title: 'Partes y Repuestos', icon: 'mdi-cogs', to: '/partes' },
  { title: 'Proveedores', icon: 'mdi-truck-delivery', to: '/proveedores' },
  { title: 'Movimientos', icon: 'mdi-swap-horizontal', to: '/movimientos' },
  { title: 'Gestión de Usuarios', icon: 'mdi-account-group', to: '/admin/usuarios', rol: 'administrador' },
  { title: 'Log de Actividad', icon: 'mdi-clipboard-text-clock', to: '/admin/logs', rol: 'administrador' },
]);

const logout = () => {
  authStore.logout();
};
</script>