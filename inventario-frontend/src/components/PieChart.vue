<template>
  <Doughnut :data="chartData" :options="chartOptions" />
</template>

<script setup>
import { Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const props = defineProps({
  chartData: {
    type: Object,
    required: true,
  },
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    // --- CAMBIO CLAVE ---
    // Desactivamos la leyenda por defecto del gráfico.
    legend: {
      display: false,
    },
    title: {
      display: true,
      text: 'Valor de Inventario por Categoría',
    },
    // El tooltip personalizado que hicimos antes se mantiene igual.
    tooltip: {
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || context.label || '';
          if (label) {
            label += ': ';
          }
          if (context.raw !== null) {
            label += new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(context.raw);
          }
          return label;
        }
      }
    }
  },
};
</script>