<template>
  <v-container fluid>
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 400px;">
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
      ></v-progress-circular>
    </div>

    <v-row v-else>
      <v-col v-if="authStore.userRole === 'administrador'" cols="12" sm="6" md="4">
        <v-card class="mx-auto" color="primary" theme="dark">
          <v-card-title class="text-h5">
            <v-icon start icon="mdi-cash-multiple"></v-icon>
            Valor del Inventario
          </v-card-title>
          <v-card-text class="text-h3 text-center py-4">
            {{ formatCurrency(stats.valorTotalInventario) }}
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="4">
        <v-card class="mx-auto">
          <v-card-title>
            <v-icon start icon="mdi-alert-circle-outline" color="warning"></v-icon>
            Ítems con Bajo Stock
          </v-card-title>
          <v-divider></v-divider>

          <v-card-text v-if="itemsBajoStock.length === 0" class="text-center pa-4">
            <v-icon size="x-large" color="success">mdi-check-circle</v-icon>
            <p class="mt-2">¡Excelente! No hay ítems por debajo del stock mínimo.</p>
          </v-card-text>

          <v-list v-else lines="two">
            <v-list-item
              v-for="item in itemsBajoStock"
              :key="item.id"
              :title="item.nombre"
            >
              <template v-slot:subtitle>
                <span class="font-weight-bold">Stock: {{ item.cantidad }}</span> | Mínimo: {{ item.cantidad_minima }}
              </template>
              <template v-slot:append>
                <v-chip color="warning" size="small">Reordenar</v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import reportesService from '@/services/reportesService';
import { useAuthStore } from '@/store/authStore';

const authStore = useAuthStore();
const loading = ref(true);
const stats = ref({ valorTotalInventario: 0 });
const itemsBajoStock = ref([]);

// Función para formatear números como moneda (ej: 12345.67 -> $12.345)
const formatCurrency = (value) => {
  if (isNaN(value)) return '$ 0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Función que se encarga de llamar a todas las APIs para el dashboard
const loadDashboardData = async () => {
  loading.value = true;
  try {
    // Creamos un arreglo de promesas para las llamadas a la API
    const requests = [reportesService.getBajoStock()];
    // Añadimos la llamada de valor de inventario SOLO si el usuario es administrador
    if (authStore.userRole === 'administrador') {
      requests.push(reportesService.getValorInventario());
    }

    // Ejecutamos las llamadas en paralelo para mayor eficiencia
    const responses = await Promise.all(requests);

    // Asignamos los datos recibidos a nuestras variables
    itemsBajoStock.value = responses[0].data;
    if (authStore.userRole === 'administrador') {
      stats.value = responses[1].data;
    }

  } catch (error) {
    console.error('Error al cargar los datos del dashboard:', error);
  } finally {
    loading.value = false;
  }
};

// 'onMounted' se ejecuta automáticamente cuando el componente aparece en pantalla.
// Es el lugar perfecto para hacer nuestra llamada inicial para cargar los datos.
onMounted(loadDashboardData);
</script>