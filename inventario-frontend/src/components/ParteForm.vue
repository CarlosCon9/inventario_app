<template>
  <v-card>
    <v-card-title class="text-h5">{{ formTitle }}</v-card-title>
    <v-card-text>
      <v-container>
        <v-form ref="form">
          <v-row>
            <v-col cols="12" sm="6"><v-text-field v-model="parte.nombre" label="Nombre del Producto *" :rules="[rules.required]"></v-text-field></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="parte.numero_parte" label="Número de Parte / SKU *" :rules="[rules.required]"></v-text-field></v-col>
            <v-col cols="12"><v-textarea v-model="parte.descripcion" label="Descripción" rows="2"></v-textarea></v-col>
            <v-col cols="12" sm="6" md="3"><v-text-field v-model.number="parte.cantidad" label="Cantidad en Stock *" type="number" :rules="[rules.required, rules.number]"></v-text-field></v-col>
            <v-col cols="12" sm="6" md="3"><v-text-field v-model.number="parte.cantidad_minima" label="Stock Mínimo" type="number" :rules="[rules.number]"></v-text-field></v-col>
            <v-col cols="12" sm="6" md="3"><v-text-field v-model="parte.unidad_medida" label="Unidad de Medida"></v-text-field></v-col>
            <v-col cols="12" sm="6" md="3"><v-text-field v-model="parte.ubicacion" label="Ubicación"></v-text-field></v-col>
            <v-col cols="12" sm="6" md="4"><v-text-field v-model.number="parte.precio_compra" label="Precio de Compra" type="number" prefix="$"></v-text-field></v-col>
            <v-col cols="12" sm="6" md="4"><v-text-field v-model.number="parte.porcentaje_ganancia" label="Porcentaje de Ganancia" type="number" suffix="%"></v-text-field></v-col>
            <v-col cols="12" sm="12" md="4"><v-text-field :model-value="precioVentaCalculado" label="Precio de Venta (Calculado)" type="number" prefix="$" readonly disabled></v-text-field></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="parte.categoria" label="Categoría"></v-text-field></v-col>
            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="parte.proveedor_id"
                :items="proveedores"
                item-title="nombre"
                item-value="id"
                label="Proveedor"
                clearable
              ></v-autocomplete>
            </v-col>
            <v-col cols="12">
              <v-file-input
                v-model="imagenFile"
                label="Seleccionar Imagen o Documento"
                accept="image/*,.pdf"
                prepend-icon="mdi-camera"
                show-size
                clearable
              ></v-file-input>
            </v-col>
          </v-row>
        </v-form>
      </v-container>
      <small>* indica campos obligatorios</small>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="grey-darken-1" variant="text" @click="$emit('close')">Cancelar</v-btn>
      <v-btn color="primary" variant="tonal" @click="validateAndSave">Guardar Cambios</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  item: { type: Object, required: true },
  proveedores: { type: Array, default: () => [] }
});
const emit = defineEmits(['close', 'save']);
const parte = ref({});
const imagenFile = ref([]);
const form = ref(null);

watch(() => props.item, (newItem) => {
  parte.value = { ...newItem };
  imagenFile.value = [];
}, { immediate: true, deep: true });

const formTitle = computed(() => parte.value.id ? 'Editar Parte' : 'Nueva Parte');

const precioVentaCalculado = computed(() => {
  const precio = parseFloat(parte.value.precio_compra);
  const porcentaje = parseFloat(parte.value.porcentaje_ganancia);
  if (!isNaN(precio) && !isNaN(porcentaje)) {
    const precioVenta = precio * (1 + (porcentaje / 100));
    return Math.round(precioVenta * 100) / 100;
  }
  return null;
});

const rules = {
  required: value => !!value || 'Campo obligatorio.',
  number: value => value === null || value === '' || !isNaN(parseFloat(value)) || 'Debe ser un número.',
};

const validateAndSave = async () => {
  const { valid } = await form.value.validate();
  if (valid) {
    emit('save', { parteData: parte.value, imagenFile: imagenFile.value[0] || null });
  }
};
</script>