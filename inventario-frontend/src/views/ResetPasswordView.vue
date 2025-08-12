<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Restablecer Contraseña</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form ref="form">
              <v-text-field
                v-model="password"
                label="Nueva Contraseña"
                type="password"
                :rules="[rules.required, rules.minLength]"
                variant="outlined"
                class="mt-4"
              ></v-text-field>
              <v-text-field
                v-model="confirmPassword"
                label="Confirmar Nueva Contraseña"
                type="password"
                :rules="[rules.required, rules.passwordMatch]"
                variant="outlined"
              ></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="handleResetPassword" :loading="loading">Guardar Contraseña</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000" location="top right">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/store/authStore';
import authService from '@/services/authService';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const form = ref(null);
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const snackbar = reactive({ show: false, text: '', color: 'success' });

const rules = {
  required: v => !!v || 'Campo obligatorio.',
  minLength: v => (v && v.length >= 6) || 'La contraseña debe tener al menos 6 caracteres.',
  passwordMatch: v => v === password.value || 'Las contraseñas no coinciden.',
};

const handleResetPassword = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  loading.value = true;
  try {
    const token = route.params.token;
    const response = await authService.resetPassword(token, password.value);

    // Logueamos al usuario automáticamente con el nuevo token que nos da el backend
    authStore.token = response.data.token;
    authStore.user = response.data.user;
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));

    snackbar.text = '¡Contraseña actualizada! Serás redirigido.';
    snackbar.color = 'success';
    snackbar.show = true;

    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);

  } catch (error) {
    snackbar.text = error.response?.data?.message || 'Error al restablecer la contraseña.';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    loading.value = false;
  }
};
</script>