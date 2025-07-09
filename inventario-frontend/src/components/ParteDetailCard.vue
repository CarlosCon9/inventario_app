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

const getImageUrl = (path) => {
    if (!path) return 'https://cdn.vuetifyjs.com/images/cards/sun-sky.jpg'; // Una imagen por defecto
    return `http://localhost:3000/${path}`;
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
};
</script>