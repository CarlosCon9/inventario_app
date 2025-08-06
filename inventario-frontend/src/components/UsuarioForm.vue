<template>
  <v-card>
    <v-card-title><span class="text-h5">{{ formTitle }}</span></v-card-title>
    <v-card-text>
      <v-container>
        <v-form ref="form">
          <v-row>
            <v-col cols="12" sm="6"><v-text-field v-model="usuario.nombre_usuario" label="Nombre de Usuario *" :rules="[rules.required]"></v-text-field></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="usuario.correo_electronico" label="Correo Electrónico *" :rules="[rules.required, rules.email]"></v-text-field></v-col>
            <v-col cols="12" sm="6">
              <v-text-field 
                v-model="usuario.contrasena" 
                :label="isEditing ? 'Nueva Contraseña (opcional)' : 'Contraseña *'" 
                :rules="isEditing ? [] : [rules.required]"
                type="password"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
                <v-select v-model="usuario.rol" :items="roles" label="Rol *" :rules="[rules.required]"></v-select>
            </v-col>
            <v-col cols="12">
                <v-switch v-model="usuario.activo" label="Usuario Activo" color="success" inset></v-switch>
            </v-col>
          </v-row>
        </v-form>
      </v-container>
      <small>* indica campos obligatorios</small>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn @click="$emit('close')">Cancelar</v-btn>
      <v-btn color="primary" @click="validateAndSave">Guardar</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
const props = defineProps({ item: { type: Object, required: true } });
const emit = defineEmits(['close', 'save']);
const usuario = ref({});
const form = ref(null);
const roles = ['administrador', 'operador', 'consulta'];

watch(() => props.item, (newItem) => {
 
  usuario.value = { ...newItem };
  delete usuario.value.contrasena;
}, { immediate: true });

const isEditing = computed(() => !!usuario.value.id);
const formTitle = computed(() => isEditing.value ? 'Editar Usuario' : 'Nuevo Usuario');
const rules = {
  required: v => !!v || 'Campo obligatorio.',
  email: v => /.+@.+\..+/.test(v) || 'Debe ser un correo válido.',
};
const validateAndSave = async () => {
  const { valid } = await form.value.validate();
  if (valid) {
    const dataToSend = { ...usuario.value };
    if (isEditing.value && !dataToSend.contrasena) {
      delete dataToSend.contrasena;
    }
       emit('save', dataToSend);
  }
};
</script>