<template>
  <v-card>
    <v-card-title><span class="text-h5">{{ formTitle }}</span></v-card-title>
    <v-card-text>
      <v-container>
        <v-form ref="form">
          <v-row>
            <v-col cols="12" sm="6"><v-text-field v-model="parte.nombre" label="Nombre *" :rules="[rules.required]"></v-text-field></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="parte.numero_parte" label="N/P *" :rules="[rules.required]"></v-text-field></v-col>
            <v-col cols="12"><v-textarea v-model="parte.descripcion" label="Descripción" rows="2"></v-textarea></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model.number="parte.cantidad_minima" label="Stock Mínimo" type="number"></v-text-field></v-col>
            <v-col cols="12" sm="6"><v-select v-model="parte.unidad_medida" :items="['UND', 'METROS']" label="Unidad"></v-select></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="parte.estand" label="Ubicación (Estand)"></v-text-field></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="parte.fila" label="Ubicación (Fila)"></v-text-field></v-col>
            <v-col cols="12" sm="6">
              <v-select v-model="parte.categoria" :items="categorias" label="Categoría"></v-select>
            </v-col>
            <v-col cols="12" sm="6"><v-text-field v-model.number="parte.precio_referencia" label="Precio Referencia" type="number" prefix="$"></v-text-field></v-col>
            <v-col cols="12" sm="6"><v-file-input ref="imagenInput" label="Imagen del Producto" accept="image/*" prepend-icon="mdi-camera"></v-file-input></v-col>
            <v-col cols="12" sm="6"><v-file-input ref="manualInput" label="Manual / Datasheet" accept=".pdf" prepend-icon="mdi-file-document"></v-file-input></v-col>
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
const categorias = ["Accesorios", "Bombas de Pistones", "Bombas de Piñones", "Bombas de Paletas", "Motores de Pistones", "Motores de Piñones", "Motores de Paletas"];
watch(() => props.item, (newItem) => { parte.value = { ...newItem }; }, { immediate: true });
const formTitle = computed(() => parte.value.id ? 'Editar Parte' : 'Nueva Parte');
const rules = { required: v => !!v || 'Campo requerido.' };
const validateAndSave = async () => {
  const { valid } = await form.value.validate();
  if (valid) {
    emit('save', { parteData: parte.value, imagenFile: imagenInput.value.files[0] || null, manualFile: manualInput.value.files[0] || null });
  }
};
</script>