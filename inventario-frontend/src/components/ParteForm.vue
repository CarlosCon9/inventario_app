<template>
  <v-card>
    <v-card-title><span class="text-h5">{{ formTitle }}</span></v-card-title>
    <v-card-text>
      <v-container>
        <v-form ref="form">
          <v-row>
            <v-col cols="12" sm="6"><v-text-field v-model="parte.nombre" label="Nombre *" :rules="[rules.required]"></v-text-field></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="parte.numero_parte" label="N/P *" :rules="[rules.required]"></v-text-field></v-col>
            <v-col cols="12"><v-textarea v-model="parte.descripcion" label="Descripción"></v-textarea></v-col>
            <v-col cols="12" sm="4"><v-text-field v-model.number="parte.cantidad_minima" label="Stock Mínimo" type="number"></v-text-field></v-col>
            <v-col cols="12" sm="4"><v-text-field v-model="parte.unidad_medida" label="Unidad de Medida"></v-text-field></v-col>
            <v-col cols="12" sm="4"><v-text-field v-model="parte.ubicacion" label="Ubicación"></v-text-field></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="parte.categoria" label="Categoría"></v-text-field></v-col>
            <v-col cols="12" sm="6"><v-autocomplete v-model="parte.proveedor_id" :items="proveedores" item-title="nombre" item-value="id" label="Proveedor"></v-autocomplete></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model.number="parte.precio_compra" label="Precio Compra" type="number" prefix="$"></v-text-field></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model.number="parte.porcentaje_ganancia" label="Ganancia (%)" type="number" suffix="%"></v-text-field></v-col>
            <v-col cols="12"><v-text-field :model-value="precioVentaCalculado" label="Precio Venta (Calculado)" readonly disabled prefix="$"></v-text-field></v-col>
            <v-col cols="12" sm="6">
              <v-file-input ref="imagenInput" label="Imagen del Producto" accept="image/*" prepend-icon="mdi-camera"></v-file-input>
            </v-col>
            <v-col cols="12" sm="6">
              <v-file-input ref="manualInput" label="Manual / Datasheet" accept=".pdf" prepend-icon="mdi-file-document"></v-file-input>
            </v-col>
          </v-row>
        </v-form>
      </v-container>
    </v-card-text>
    <v-card-actions><v-spacer></v-spacer><v-btn @click="$emit('close')">Cancelar</v-btn><v-btn color="primary" @click="validateAndSave">Guardar</v-btn></v-card-actions>
  </v-card>
</template>
<script setup>
import { ref, watch, computed } from 'vue';
const props = defineProps({ item: { type: Object, required: true }, proveedores: { type: Array, default: () => [] } });
const emit = defineEmits(['close', 'save']);
const parte = ref({});
const form = ref(null);
const imagenInput = ref(null);
const manualInput = ref(null);
watch(() => props.item, (newItem) => { parte.value = { ...newItem }; }, { immediate: true });
const formTitle = computed(() => parte.value.id ? 'Editar Parte' : 'Nueva Parte');
const precioVentaCalculado = computed(() => {
  const pCompra = parseFloat(parte.value.precio_compra);
  const pGanancia = parseFloat(parte.value.porcentaje_ganancia);
  if (!isNaN(pCompra) && !isNaN(pGanancia)) return Math.round(pCompra * (1 + (pGanancia / 100)) * 100) / 100;
  return null;
});
const rules = { required: v => !!v || 'Campo requerido.' };
const validateAndSave = async () => {
  const { valid } = await form.value.validate();
  if (valid) {
    emit('save', { 
      parteData: parte.value, 
      imagenFile: imagenInput.value.files[0] || null,
      manualFile: manualInput.value.files[0] || null
    });
  }
};
</script>