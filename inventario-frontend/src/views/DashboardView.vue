<template>
  <v-container fluid>
    <v-card class="mb-4">
      <v-card-text>
        <v-row align="center" class="px-2">
          <v-col cols="auto" class="font-weight-bold pr-4">Mostrar Widgets:</v-col>
          <v-col>
            <v-row>
              <v-col v-if="authStore.userRole === 'administrador'" cols="auto">
                <v-checkbox v-model="visibility.valorInventario" label="Valor Inventario" density="compact" hide-details></v-checkbox>
              </v-col>
              <v-col cols="auto">
                <v-checkbox v-model="visibility.itemsUnicos" label="Items en Catálogo" density="compact" hide-details></v-checkbox>
              </v-col>
              <v-col cols="auto">
                <v-checkbox v-model="visibility.alertaBajoStock" label="Alertas de Stock" density="compact" hide-details></v-checkbox>
              </v-col>
              <v-col v-if="authStore.userRole === 'administrador'" cols="auto">
                <v-checkbox v-model="visibility.graficoCategorias" label="Gráfico Categorías" density="compact" hide-details></v-checkbox>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <div v-if="loading" class="text-center pa-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <v-row v-else>
      <v-col v-if="visibility.valorInventario && authStore.userRole === 'administrador'" cols="12" sm="6" lg="4">
        <v-card color="primary" theme="dark" height="100%">
          <v-card-text class="d-flex align-center">
            <v-icon size="x-large" class="mr-4">mdi-cash-multiple</v-icon>
            <div>
              <div>Valor Total del Inventario</div>
              <div class="text-h4 font-weight-bold">{{ formatCurrency(stats.valorTotalInventario) }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col v-if="visibility.itemsUnicos" cols="12" sm="6" lg="4">
         <v-card height="100%">
          <v-card-title>
            <v-icon start color="info">mdi-tag-multiple</v-icon>
            Items en Catálogo ({{ itemsUnicos.length }})
          </v-card-title>
          <v-divider></v-divider>
          <v-list v-if="itemsUnicos.length > 0" density="compact">
            <v-list-item
              v-for="item in itemsUnicos"
              :key="item.id"
              :title="item.nombre"
              :subtitle="`N/P: ${item.numero_parte}`"
            ></v-list-item>
          </v-list>
          <v-card-text v-else class="text-center">No hay items registrados.</v-card-text>
        </v-card>
      </v-col>

      <v-col v-if="visibility.alertaBajoStock" cols="12" sm="12" lg="4">
<v-card height="100%">
          <v-card-title>
            <v-icon start color="warning">mdi-alert-circle-outline</v-icon>
            Alertas de Bajo Stock ({{ itemsBajoStock.length }})
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text v-if="itemsBajoStock.length === 0" class="text-center">¡Excelente! Sin alertas.</v-card-text>
          <v-list v-else density="compact">
            <v-list-item v-for="item in itemsBajoStock" :key="item.id" :title="item.nombre">
              <template v-slot:append>
                <div class="text-right">
                  <v-chip color="warning" size="small" variant="tonal" class="mr-2">Actual: {{ item.cantidad }}</v-chip>
                  <v-chip size="small">Mínimo: {{ item.cantidad_minima }}</v-chip>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      
      <v-col v-if="visibility.graficoCategorias && chartData.labels.length > 0 && authStore.userRole === 'administrador'" cols="12">
        <v-card>
          <v-row no-gutters>
            <v-col cols="12" md="7">
              <v-card-text>
                <PieChart :chart-data="chartData" style="height: 350px;" />
              </v-card-text>
            </v-col>
            <v-col cols="12" md="5" class="d-flex align-center">
              <v-list density="compact" class="w-100">
                <v-list-item
                  v-for="(item, index) in chartData.labels"
                  :key="item"
                >
                  <template v-slot:prepend>
                    <v-sheet
                      :color="chartData.datasets[0].backgroundColor[index]"
                      class="mr-4"
                      height="20"
                      width="20"
                      tile
                    ></v-sheet>
                  </template>
                  <v-list-item-title class="font-weight-bold">{{ item }}</v-list-item-title>
                  <template v-slot:append>
                    <span class="text-grey-darken-1">{{ formatCurrency(chartData.datasets[0].data[index]) }}</span>
                  </template>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
// La sección <script setup> que me proporcionaste ya era correcta y funcional,
// por lo que no necesita ningún cambio. Se mantiene exactamente igual.
import { ref, reactive, onMounted } from 'vue';
import reportesService from '@/services/reportesService';
import PieChart from '@/components/PieChart.vue';
import { useAuthStore } from '@/store/authStore';

const authStore = useAuthStore();
const loading = ref(true);
const stats = ref({});
const itemsUnicos = ref([]);
const itemsBajoStock = ref([]);
const chartData = ref({ labels: [], datasets: [{ data: [] }] });

const visibility = reactive({
  valorInventario: true,
  itemsUnicos: true,
  alertaBajoStock: true,
  graficoCategorias: true,
});

const formatCurrency = (value) => {
  if (isNaN(value)) return '$ 0';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const loadDashboardData = async () => {
  loading.value = true;
  try {
    const requests = [
      reportesService.getBajoStock(),
      reportesService.getListaItemsUnicos(),
    ];
    if (authStore.userRole === 'administrador') {
      requests.push(reportesService.getValorInventario());
    }
    
    const responses = await Promise.all(requests);
    
    itemsBajoStock.value = responses[0].data;
    itemsUnicos.value = responses[1].data;
    
    if (authStore.userRole === 'administrador') {
      const valorInventarioData = responses[2].data;
      
      stats.value = {
        valorTotalInventario: valorInventarioData.valorTotalInventario || 0,
      };

      if (valorInventarioData?.valorPorCategoria?.length > 0) {
        chartData.value = {
          labels: valorInventarioData.valorPorCategoria.map(item => item.categoria || 'Sin Categoría'),
          datasets: [{
            backgroundColor: ['#4A148C', '#6A1B9A', '#8E24AA', '#AB47BC', '#CE93D8'],
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