<template>
  <v-container fluid>
    <v-card class="mb-4">
      <v-card-text>
        <v-row align="center" class="px-2">
          <v-col cols="auto" class="font-weight-bold pr-4">Mostrar Widgets:</v-col>
          <v-col>
            <v-row>
              <v-col v-if="authStore.userRole === 'administrador'" cols="auto">
                <v-checkbox v-model="visibility.valorCompra" label="Valor Compra" density="compact" hide-details></v-checkbox>
              </v-col>
              <v-col v-if="authStore.userRole === 'administrador'" cols="auto">
                <v-checkbox v-model="visibility.valorVenta" label="Valor Venta" density="compact" hide-details></v-checkbox>
              </v-col>
              <v-col cols="auto">
                <v-checkbox v-model="visibility.alertaBajoStock" label="Alertas de Stock" density="compact" hide-details></v-checkbox>
              </v-col>
              <v-col cols="auto">
                <v-checkbox v-model="visibility.movimientosRecientes" label="Actividad Reciente" density="compact" hide-details></v-checkbox>
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
      <v-col v-if="visibility.valorCompra && authStore.userRole === 'administrador'" cols="12" sm="6" md="4">
        <v-card color="primary" theme="dark" height="100%">
          <v-card-text class="d-flex align-center">
            <v-icon size="x-large" class="mr-4">mdi-cash-multiple</v-icon>
            <div>
              <div>Valor Inventario (Compra)</div>
              <div class="text-h4 font-weight-bold">{{ formatCurrency(stats.valorTotalInventario) }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col v-if="visibility.valorVenta && authStore.userRole === 'administrador'" cols="12" sm="6" md="4">
        <v-card color="success" theme="dark" height="100%">
          <v-card-text class="d-flex align-center">
            <v-icon size="x-large" class="mr-4">mdi-trending-up</v-icon>
            <div>
              <div>Valor Inventario (Venta)</div>
              <div class="text-h4 font-weight-bold">{{ formatCurrency(stats.valorTotalVenta) }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col v-if="visibility.alertaBajoStock" cols="12" sm="12" md="4">
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

      <v-col v-if="visibility.movimientosRecientes" cols="12">
        <v-card>
          <v-card-title>Actividad Reciente</v-card-title>
          <v-divider></v-divider>
          <v-card-text v-if="movimientosRecientes.length === 0" class="text-center">No hay movimientos recientes.</v-card-text>
          <v-list v-else lines="two">
            <v-list-item
              v-for="mov in movimientosRecientes"
              :key="mov.id"
              :title="mov.parte_repuesto.nombre"
              :subtitle="`Realizado por: ${mov.usuario.nombre_usuario}`"
            >
              <template v-slot:prepend>
                <v-avatar :color="mov.tipo_movimiento === 'entrada' ? 'success' : 'error'">
                  <v-icon color="white">
                    {{ mov.tipo_movimiento === 'entrada' ? 'mdi-arrow-bottom-left' : 'mdi-arrow-top-right' }}
                  </v-icon>
                </v-avatar>
              </template>
              <template v-slot:append>
                <div class="text-right">
                  <v-chip :color="mov.tipo_movimiento === 'entrada' ? 'success' : 'error'" class="mb-1">
                    {{ mov.tipo_movimiento.toUpperCase() }}: {{ mov.cantidad_movimiento }}
                  </v-chip>
                  <div class="text-caption">{{ formatRelativeTime(mov.fecha_movimiento) }}</div>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import reportesService from '@/services/reportesService';
import { useAuthStore } from '@/store/authStore';

const authStore = useAuthStore();
const loading = ref(true);
const stats = ref({});
const itemsBajoStock = ref([]);
const movimientosRecientes = ref([]);

const visibility = reactive({
  valorCompra: true,
  valorVenta: true,
  alertaBajoStock: true,
  movimientosRecientes: true,
});

const formatCurrency = (value) => {
  if (isNaN(value)) return '$ 0';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return `hace ${seconds} segundos`;
  if (minutes < 60) return `hace ${minutes} minutos`;
  if (hours < 24) return `hace ${hours} horas`;
  return `hace ${days} días`;
};

const loadDashboardData = async () => {
  loading.value = true;
  try {
    const requests = [
      reportesService.getBajoStock(),
      reportesService.getMovimientosRecientes(),
    ];
    if (authStore.userRole === 'administrador') {
      requests.push(reportesService.getDashboardStats());
    }

    const responses = await Promise.all(requests);
    
    itemsBajoStock.value = responses[0].data;
    movimientosRecientes.value = responses[1].data;

    if (authStore.userRole === 'administrador') {
      stats.value = responses[2].data;
    }
  } catch (error) {
    console.error('Error al cargar datos del dashboard:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(loadDashboardData);
</script>