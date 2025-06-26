<template>
  <v-container fluid>
    <v-row v-if="!loading">

      <v-col cols="12" md="6" lg="4">
        <v-card class="mx-auto" color="primary" theme="dark">
          <v-card-title class="text-h5">
            <v-icon left class="mr-2">mdi-cash-multiple</v-icon>
            Valor Total del Inventario
          </v-card-title>
          <v-card-text class="text-h3 text-center py-4">
            {{ formatCurrency(stats.valorTotalInventario) }}
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" lg="8">
        <v-card class="mx-auto">
          <v-card-title class="text-h5">
            <v-icon left class="mr-2" color="warning">mdi-alert-circle-outline</v-icon>
            Ítems con Bajo Stock ({{ itemsBajoStock.length }})
          </v-card-title>
          <v-divider></v-divider>

          <v-card-text v-if="itemsBajoStock.length === 0" class="text-center">
            <v-icon size="large" color="success" class="my-4">mdi-check-circle</v-icon>
            <p>¡Excelente! No hay ítems con bajo stock.</p>
          </v-card-text>

          <v-list v-else lines="two">
            <v-list-item
              v-for="item in itemsBajoStock"
              :key="item.id"
              :title="item.nombre"
            >
              <template v-slot:subtitle>
                <span class="font-weight-bold">Stock Actual: {{ item.cantidad }}</span> | Mínimo Requerido: {{ item.cantidad_minima }}
              </template>
              <template v-slot:append>
                <v-chip color="warning" size="small">Reordenar</v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      </v-row>

    <v-row v-else class="fill-height" align="center" justify="center">
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
      ></v-progress-circular>
    </v-row>

  </v-container>
</template>


<script setup>
import { ref, onMounted } from 'vue';
import reportesService from '@/services/reportesService'; // Importamos nuestro nuevo servicio

// --- ESTADO LOCAL DEL COMPONENTE ---
const loading = ref(true); // Controla la visibilidad de la pantalla de carga.
const stats = ref({
  valorTotalInventario: 0,
});
const itemsBajoStock = ref([]);

// --- LÓGICA DE OBTENCIÓN DE DATOS ---

// Función para formatear números como moneda (ej: 12345.67 -> $12,345.67)
// Usamos la API de Internacionalización del navegador, que es una mejor práctica.
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
};

// Función asíncrona que carga todos los datos necesarios para el dashboard.
const loadDashboardData = async () => {
  try {
    // Hacemos las llamadas a la API en paralelo para mayor eficiencia.
    const [statsResponse, bajoStockResponse] = await Promise.all([
      reportesService.getValorInventario(),
      reportesService.getBajoStock(),
    ]);

    // Asignamos los datos recibidos a nuestras variables reactivas.
    stats.value = statsResponse.data;
    itemsBajoStock.value = bajoStockResponse.data;

  } catch (error) {
    console.error('Error al cargar los datos del dashboard:', error);
    // Aquí podríamos mostrar una alerta de error al usuario.
  } finally {
    // Cuando todos los datos han sido cargados (o si hubo un error),
    // ocultamos la pantalla de carga para mostrar el contenido.
    loading.value = false;
  }
};

// --- HOOK DEL CICLO DE VIDA ---
// 'onMounted' es una función de Vue que se ejecuta automáticamente
// una vez que el componente ha sido montado en la página.
// Es el lugar perfecto para hacer llamadas iniciales a la API.
onMounted(() => {
  loadDashboardData();
});
</script>