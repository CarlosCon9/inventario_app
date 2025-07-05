<template>
  <Doughnut :data="chartData" :options="chartOptions" />
</template>

<script setup>
// --- IMPORTACIONES ---
// Importamos las herramientas necesarias desde las librerías de gráficos.
import { Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';

// --- REGISTRO DE COMPONENTES DE CHART.JS ---
// Es obligatorio registrar los "ladrillos" que usará nuestro gráfico.
ChartJS.register(ArcElement, Tooltip, Legend, Title);

// --- DEFINICIÓN DE PROPS ---
// 'defineProps' es cómo un componente hijo recibe datos de su componente padre (el Dashboard).
// Esperamos recibir un prop llamado 'chartData' que debe ser un objeto.
const props = defineProps({
  chartData: {
    type: Object,
    required: true,
  },
});

// --- OPCIONES DE VISUALIZACIÓN DEL GRÁFICO ---
// Aquí definimos cómo se verá y comportará nuestro gráfico.
const chartOptions = {
  responsive: true, // Hace que el gráfico se adapte al tamaño de su contenedor.
  maintainAspectRatio: false, // Permite que el gráfico no sea siempre cuadrado.
  plugins: {
    legend: {
      position: 'top', // La leyenda de colores aparecerá arriba.
    },
    title: {
      display: true,
      text: 'Valor de Inventario por Categoría', // Título del gráfico.
    },
  },
};
</script>