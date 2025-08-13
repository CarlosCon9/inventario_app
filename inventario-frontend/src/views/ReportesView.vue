<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon start>mdi-chart-line</v-icon>
        Módulo de Reportes
      </v-card-title>
      <v-tabs v-model="tab" color="primary">
        <v-tab value="stockBajo">Stock Bajo</v-tab>
        <v-tab value="inventario">Inventario Completo</v-tab>
        <v-tab value="movimientos">Historial de Movimientos</v-tab>
      </v-tabs>
      <v-card-text>
        <v-window v-model="tab">
          <v-window-item value="stockBajo">
            <v-btn
              color="success"
              @click="exportar('stockBajo')"
              :loading="loading.stockBajo"
              class="mb-4"
            >
              <v-icon start>mdi-file-excel</v-icon>
              Exportar a Excel
            </v-btn>
            <v-data-table
              :headers="headers.stockBajo"
              :items="data.stockBajo"
              :loading="loading.stockBajo"
            ></v-data-table>
          </v-window-item>

          <v-window-item value="inventario">
            <v-btn
              color="success"
              @click="exportar('inventario')"
              :loading="loading.inventario"
              class="mb-4"
            >
              <v-icon start>mdi-file-excel</v-icon>
              Exportar a Excel
            </v-btn>
            <v-data-table
              :headers="headers.inventario"
              :items="data.inventario"
              :loading="loading.inventario"
            >
              <template v-slot:item.precio_compra="{ value }">
                {{ formatCurrency(value) }}
              </template>
              <template v-slot:item.precio_venta_sugerido="{ value }">
                {{ formatCurrency(value) }}
              </template>
              <template v-slot:item.precio_referencia="{ value }">
                {{ formatCurrency(value) }}
              </template>
            </v-data-table>
          </v-window-item>

          <v-window-item value="movimientos">
            <v-row class="mb-2" align="center">
              <v-col cols="12" sm="6" md="2"
                ><v-text-field
                  v-model="filters.fechaDesde"
                  label="Desde"
                  type="date"
                  variant="outlined"
                  density="compact"
                  hide-details
                ></v-text-field
              ></v-col>

              <v-col cols="12" sm="6" md="2"
                ><v-text-field
                  v-model="filters.fechaHasta"
                  label="Hasta"
                  type="date"
                  :max="today"
                  variant="outlined"
                  density="compact"
                  hide-details
                ></v-text-field
              ></v-col>
              <v-col cols="12" sm="2"
                ><v-select
                  v-model="filters.tipoMovimiento"
                  :items="['entrada', 'salida']"
                  label="Movimiento"
                  clearable
                ></v-select
              ></v-col>
              <v-col cols="12" sm="4"
                ><v-autocomplete
                  v-model="filters.parteId"
                  :items="partes"
                  item-title="nombre"
                  item-value="id"
                  label="Filtrar por Parte"
                  clearable
                  @update:search="buscarPartes"
                ></v-autocomplete
              ></v-col>
            </v-row>
            <v-btn
              color="primary"
              @click="cargarReporteMovimientos"
              :loading="loading.movimientos"
              >Generar Reporte</v-btn
            >
            <v-btn
              color="success"
              @click="exportar('movimientos')"
              :loading="loading.movimientos"
              class="ml-2"
            >
              <v-icon start>mdi-file-excel</v-icon>
              Exportar
            </v-btn>
            <v-data-table
              :headers="headers.movimientos"
              :items="data.movimientos"
              :loading="loading.movimientos"
              class="mt-4"
            ></v-data-table>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-container>
</template>
<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import reportesService from "@/services/reportesService";
import partesService from "@/services/partesService";

const tab = ref("stockBajo");
const data = reactive({ stockBajo: [], inventario: [], movimientos: [] });
const loading = reactive({
  stockBajo: false,
  inventario: false,
  movimientos: false,
});
const filters = ref({
  fechaDesde: new Date().toISOString().split("T")[0], // Valor por defecto: hoy
  fechaHasta: new Date().toISOString().split("T")[0], // Valor por defecto: hoy
  tipoMovimiento: null,
  parteId: null,
  proveedorId: null,
});
const partes = ref([]);

const headers = {
  stockBajo: [
    { title: "Nombre", key: "nombre" },
    { title: "N/P", key: "N/P" },
    { title: "Cantidad Actual", key: "Cantidad Actual", align: "end" },
    { title: "Cantidad Mínima", key: "Cantidad Mínima", align: "end" },
  ],
  inventario: [
    { title: "Nombre", key: "nombre" },
    { title: "N/P", key: "numero_parte" },
    { title: "Stock", key: "cantidad", align: "end" },
    { title: "Precio Compra", key: "precio_compra", align: "end" },
    { title: "Precio Venta", key: "precio_venta_sugerido", align: "end" },
    { title: "Precio Referencia", key: "precio_referencia", align: "end" },
  ],
  movimientos: [
    { title: "Fecha", key: "Fecha de Movimiento" },
    { title: "Concepto", key: "Concepto" },
    { title: "Nombre", key: "Nombre" },
    { title: "N/P", key: "N/P" },
    { title: "Cantidad", key: "Cantidad", align: "end" },
    { title: "Usuario", key: "Usuario" },
  ],
};

const today = computed(() => {
  return new Date().toISOString().split('T')[0];
});

const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(parseFloat(value)))
    return "N/A";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
};

const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "America/Bogota", // Aseguramos la zona horaria de Colombia
    hour12: false,
  };

  
  const partes = new Intl.DateTimeFormat('en-US', options).formatToParts(date);
  const find = (type) => parts.find(p => p.type === type)?.value;
  const y = find('year');
  const m = find('month');
  const d = find('day');
  const hh = find('hour');
  const mm = find('minute');
  const ss = find('second');
  return `${d}-${m}-${y} ${hh}:${mm}:${ss}`;
 
};

const cargarDatosIniciales = async () => {
  loading.stockBajo = true;
  loading.inventario = true;
  try {
    const [resStock, resInventario] = await Promise.all([
      reportesService.getReporteStockBajo(),
      reportesService.getReporteInventario(),
    ]);
    data.stockBajo = resStock.data;
    data.inventario = resInventario.data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.stockBajo = false;
    loading.inventario = false;
  }
};

const cargarReporteMovimientos = async () => {

  loading.movimientos = true;
  try {
    const response = await reportesService.getReporteMovimientos(filters.value);
    data.movimientos = response.data;
  } catch (e) {
    
  } finally {
    loading.movimientos = false;
  }
};

const exportar = async (tipo) => {
  try {
    switch (tipo) {
      case "stockBajo":
        await reportesService.getReporteStockBajo(true);
        break;
      case "inventario":
        await reportesService.getReporteInventario(true);
        break;
      case "movimientos":
        await reportesService.getReporteMovimientos(filters.value, true);
        break;
    }
  } catch (e) {
    console.error(`Error al exportar reporte ${tipo}:`, e);
  }
};

let searchTimeout = null;
const buscarPartes = (query) => {
  if (!query || query.length < 2) {
    partes.value = [];
    return;
  }
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    try {
      if (query) {
        const response = await partesService.searchPartes(query);
        partes.value = response.data;
      }
    } catch (e) {
      console.error(e);
    }
  }, 300);
};

onMounted(cargarDatosIniciales);
</script>
