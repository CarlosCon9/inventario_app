<template>
  <v-card>
    <v-card-title><span class="text-h5">{{ formTitle }}</span></v-card-title>
    <v-card-text>
      <v-container>
        <v-form ref="form">
          <v-row>
            <v-col cols="12"><v-text-field v-model="proveedor.nombre" label="Nombre del Proveedor *" :rules="[rules.required]"></v-text-field></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="proveedor.contacto_principal" label="Contacto Principal"></v-text-field></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="proveedor.telefono" label="Teléfono"></v-text-field></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="proveedor.correo_electronico" label="Correo Electrónico" :rules="[rules.email]"></v-text-field></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="proveedor.direccion" label="Dirección"></v-text-field></v-col>
          </v-row>
        </v-form>
      </v-container>
      <small>* indica campos obligatorios</small>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="grey-darken-1" @click="$emit('close')">Cancelar</v-btn>
      <v-btn color="primary" @click="validateAndSave">Guardar</v-btn>
    </v-card-actions>
  </v-card>
</template>
<script setup>
import { ref, watch, computed } from 'vue';
const props = defineProps({ item: { type: Object, required: true } });
const emit = defineEmits(['close', 'save']);
const proveedor = ref({});
const form = ref(null);
watch(() => props.item, (newItem) => { proveedor.value = { ...newItem }; }, { immediate: true });
const formTitle = computed(() => proveedor.value.id ? 'Editar Proveedor' : 'Nuevo Proveedor');
const rules = {
  required: value => !!value || 'Campo obligatorio.',
  email: value => !value || /.+@.+\..+/.test(value) || 'Debe ser un correo válido.',
};
const validateAndSave = async () => {
  const { valid } = await form.value.validate();
  if (valid) emit('save', proveedor.value);
};
</script>