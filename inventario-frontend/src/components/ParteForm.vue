<template>
  <v-card>
    <v-card-title>
      <span class="text-h5">{{ formTitle }}</span>
    </v-card-title>
    <v-card-text>
      <v-container>
        <v-form ref="form" @submit.prevent="validateAndSave" enctype="multipart/form-data">
          <v-row>
            <v-col cols="12" sm="6"><v-text-field v-model="parte.nombre" label="Nombre del Producto *" :rules="[rules.required]"></v-text-field></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="parte.numero_parte" label="Número de Parte / SKU *" :rules="[rules.required]"></v-text-field></v-col>
            <v-col cols="12"><v-textarea v-model="parte.descripcion" label="Descripción" rows="2"></v-textarea></v-col>
            <v-col cols="12" sm="6" md="3"><v-text-field v-model.number="parte.cantidad" label="Cantidad en Stock *" type="number" :rules="[rules.required, rules.number]"></v-text-field></v-col>
            <v-col cols="12" sm="6" md="3"><v-text-field v-model.number="parte.cantidad_minima" label="Stock Mínimo" type="number" :rules="[rules.number]"></v-text-field></v-col>
            <v-col cols="12" sm="6" md="3"><v-text-field v-model="parte.unidad_medida" label="Unidad de Medida (ej. Un, Caja, Mt)"></v-text-field></v-col>
            <v-col cols="12" sm="6" md="3"><v-text-field v-model="parte.ubicacion" label="Ubicación"></v-text-field></v-col>
            <v-col cols="12" sm="6" md="4"><v-text-field v-model.number="parte.precio_compra" label="Precio de Compra" type="number" prefix="$"></v-text-field></v-col>
            <v-col cols="12" sm="6" md="4"><v-text-field v-model.number="parte.porcentaje_ganancia" label="Porcentaje de Ganancia" type="number" suffix="%"></v-text-field></v-col>
            <v-col cols="12" sm="12" md="4"><v-text-field :model-value="precioVentaCalculado" label="Precio de Venta (Calculado)" type="number" prefix="$" readonly disabled></v-text-field></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="parte.categoria" label="Categoría"></v-text-field></v-col>
            <v-col cols="12" sm="6"><v-autocomplete
              v-model="parte.proveedor_id"
              :items="proveedores"
              item-title="nombre"
              item-value="id"
              label="Proveedor"
              clearable
            ></v-autocomplete></v-col>
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

// Definimos las propiedades que este componente recibe de su padre.
const props = defineProps({
  item: { type: Object, required: true },
  proveedores: { type: Array, default: () => [] }
});

// Definimos los eventos que este componente puede emitir hacia su padre.
const emit = defineEmits(['close', 'save']);

// Estado local del componente
const parte = ref({});
const imagenFile = ref(null); // Variable para el archivo de imagen
const form = ref(null);

// Cada vez que la prop 'item' cambie, reseteamos el estado local.
watch(() => props.item, (newItem) => {
  parte.value = { ...newItem };
  imagenFile.value = null; // Limpiamos el archivo seleccionado
}, { immediate: true, deep: true });

// Propiedades computadas para la UI
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

// Reglas de validación
const rules = {
  required: value => !!value || 'Campo obligatorio.',
  number: value => value === null || value === '' || !isNaN(parseFloat(value)) || 'Debe ser un número.',
};

// Método para validar y guardar
const validateAndSave = async () => {
  const { valid } = await form.value.validate();
  if (valid) {
    // Emitimos tanto los datos del formulario como el archivo de imagen.
    emit('save', { parteData: parte.value, imagenFile: imagenFile.value ? imagenFile.value[0] : null });
  }
};
</script>