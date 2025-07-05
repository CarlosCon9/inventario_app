<template>
  <v-container fluid>
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 400px;">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <v-row v-else>
      <template v-if="authStore.userRole === 'administrador'">
        <v-col cols="12" sm="6" md="4">
          <v-card color="primary" theme="dark">
            <v-card-text>
              <div class="d-flex align-center">
                <v-icon size="x-large" class="mr-4">mdi-cash-multiple</v-icon>
                <div>
                  <div>Valor del Inventario</div>
                  <div class="text-h4 font-weight-bold">{{ formatCurrency(stats.valorTotalInventario) }}</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-card>
            <v-card-text>
              <div class="d-flex align-center">
                <v-icon size="x-large" class="mr-4" color="info">mdi-tag-multiple</v-icon>
                <div>
                  <div>Items Únicos (SKUs)</div>
                  <div class="text-h4 font-weight-bold">{{ stats.itemsUnicos }}</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </template>

      <v-col cols="12" sm="6" md="4">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon size="x-large" class="mr-4" color="warning">mdi-alert-circle-outline</v-icon>
              <div>
                <div>Alertas de Stock</div>
                <div class="text-h4 font-weight-bold">{{ itemsBajoStock.length }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col v-if="chartData.labels && chartData.labels.length > 0 && authStore.userRole === 'administrador'" cols="12" md="6">
        <v-card>
          <v-card-text>
            <PieChart :chart-data="chartData" style="height: 300px;" />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Detalle de Bajo Stock</v-card-title>
          <v-divider></v-divider>
          <v-card-text v-if="itemsBajoStock.length === 0" class="text-center pa-4">
            <v-icon size="x-large" color="success">mdi-check-circle</v-icon>
            <p class="mt-2">¡Excelente! No hay ítems por debajo del stock mínimo.</p>
          </v-card-text>
          <v-list v-else lines="one" density="compact">
            </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import reportesService from '@/services/reportesService';
import PieChart from '@/components/PieChart.vue';
import { useAuthStore } from '@/store/authStore';

const authStore = useAuthStore();
const loading = ref(true);
const stats = ref({});
const itemsBajoStock = ref([]);
const chartData = ref({ labels: [], datasets: [] }); // Inicializamos el estado del gráfico

const formatCurrency = (value) => {
  if (isNaN(value)) return '$ 0';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const loadDashboardData = async () => {
  loading.value = true;
  try {
    // Hacemos todas las llamadas en paralelo para máxima eficiencia
    const requests = [
      reportesService.getBajoStock(), // Siempre pedimos la lista de bajo stock
    ];

    // Solo si el usuario es administrador, pedimos los reportes financieros
    if (authStore.userRole === 'administrador') {
      requests.push(reportesService.getDashboardStats());
      requests.push(reportesService.getValorInventario()); // <-- LLAMADA REINTRODUCIDA
    }

    const responses = await Promise.all(requests);

    // Asignamos los datos de las respuestas
    itemsBajoStock.value = responses[0].data;
    if (authStore.userRole === 'administrador') {
      stats.value = responses[1].data;
      const valorInventarioData = responses[2].data;

      // --- LÓGICA DE PROCESAMIENTO PARA EL GRÁFICO ---
      // Verificamos que tengamos datos para el gráfico
      if (valorInventarioData && valorInventarioData.valorPorCategoria && valorInventarioData.valorPorCategoria.length > 0) {
        chartData.value = {
          labels: valorInventarioData.valorPorCategoria.map(item => item.categoria || 'Sin Categoría'),
          datasets: [{
            backgroundColor: ['#4CAF50', '#FFC107', '#2196F3', '#9C27B0', '#F44336'],
            data: valorInventarioData.valorPorCategoria.map(item => item.valorTotalCategoria),
          }],
        };
      }
    }
  } catch (error) {
    console.error('Error al cargar datos del dashboard:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(loadDashboardData);
</script>