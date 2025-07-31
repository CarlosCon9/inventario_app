<template>
  <v-card>
    <v-img
      height="200px"
      :src="getImageUrl(item.imagen_url)"
      cover
      class="text-white"
    >
      <v-toolbar color="rgba(0, 0, 0, 0.4)" theme="dark">
        <v-toolbar-title class="text-h6">
          {{ item.nombre }}
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
    </v-img>

    <v-card-text>
      <div class="font-weight-bold ms-1 mb-2">
        Detalles del Producto
      </div>
      <v-list density="compact">
        <v-list-item title="Número de Parte / SKU" :subtitle="item.numero_parte || 'N/A'"></v-list-item>
        <v-list-item title="Descripción" :subtitle="item.descripcion || 'N/A'"></v-list-item>
        <v-list-item title="Categoría" :subtitle="item.categoria || 'N/A'"></v-list-item>
        <v-list-item title="Ubicación" :subtitle="item.ubicacion || 'N/A'"></v-list-item>
      </v-list>

      <v-divider class="my-2"></v-divider>

      <div class="font-weight-bold ms-1 mb-2">
        Información de Stock y Precios
      </div>
      <v-list density="compact">
        <v-list-item title="Cantidad en Stock" :subtitle="String(item.cantidad)"></v-list-item>
        <v-list-item title="Stock Mínimo" :subtitle="String(item.cantidad_minima)"></v-list-item>
        <v-list-item title="Precio de Compra" :subtitle="formatCurrency(item.precio_compra)"></v-list-item>
        <v-list-item title="Precio de Venta Sugerido" :subtitle="formatCurrency(item.precio_venta_sugerido)"></v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup>
const props = defineProps({
  item: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close']);

// --- FUNCIÓN AÑADIDA Y CRUCIAL ---
// Esta función construye la URL completa para mostrar la imagen desde el backend.
const getImageUrl = (path) => {
    if (!path) return 'https://cdn.vuetifyjs.com/images/cards/sun-sky.jpg'; // Imagen por defecto
    // Leemos la URL base del backend desde la variable de entorno.
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    return `${baseUrl}/${path.replace(/\\/g, "/")}`;
};

// Esta función ya la tenías y es correcta.
const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
};
</script>