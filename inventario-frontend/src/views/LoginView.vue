<template>
  <v-row no-gutters class="fill-height">
    <v-col md="7" class="bg-blue d-none d-md-flex align-center justify-center">
      <div class="text-center">
        <v-img src="@/assets/logo1.png" max-height="500" contain class="mb-8"></v-img>
        <h1 class="text-h4 font-weight-bold text-white mb-4">
          Bienvenido a Inventario App <br>by Contreras Solutions
        </h1>
        <p class="text-body-1 text-white">La solución robusta y confiable para tu negocio.</p>
      </div>
    </v-col>

    <v-col cols="12" md="5" class="d-flex align-center justify-center">
      <v-card class="elevation-12 pa-4" width="100%" max-width="450px">
        <v-card-title class="text-center text-h5 mb-4">Iniciar Sesión</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleLogin">
            <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
            <v-text-field v-model="correo" label="Correo Electrónico" prepend-inner-icon="mdi-account-outline" type="email" variant="outlined" required class="mb-3"></v-text-field>
            <v-text-field v-model="password" label="Contraseña" prepend-inner-icon="mdi-lock-outline" type="password" variant="outlined" required></v-text-field>
            <div class="text-right mb-4">
              <a href="#" @click.prevent="forgotDialog = true" class="text-primary text-body-2">¿Olvidaste tu contraseña?</a>
            </div>
            <v-btn type="submit" color="primary" :loading="loading" :disabled="loading" block size="large">Ingresar</v-btn>
          </v-form>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-dialog v-model="forgotDialog" max-width="500px" persistent>
    <v-card>
      <v-card-title>Recuperar Contraseña</v-card-title>
      <v-card-text>
        <p class="mb-4">Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
        <v-text-field v-model="forgotEmail" label="Correo Electrónico" variant="outlined" :rules="[rules.email]"></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="forgotDialog = false">Cancelar</v-btn>
        <v-btn color="primary" @click="handleForgotPassword" :loading="forgotLoading">Enviar Enlace</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  
  <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="6000" location="top right">
    {{ snackbar.text }}
  </v-snackbar>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'vue-router';
import authService from '@/services/authService';

const authStore = useAuthStore();
const router = useRouter();
const correo = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref(null);

// Nuevas variables para el diálogo de recuperación
const forgotDialog = ref(false);
const forgotEmail = ref('');
const forgotLoading = ref(false);
const snackbar = reactive({ show: false, text: '', color: 'success' });
const rules = { email: v => !v || /.+@.+\..+/.test(v) || 'Debe ser un correo válido.' };

const handleLogin = async () => {
  errorMessage.value = null;
  loading.value = true;
  try {
    await authStore.login({
        correo_electronico: correo.value,
        contrasena: password.value,
    });
    router.push('/dashboard');
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Error al iniciar sesión.';
  } finally {
    loading.value = false;
  }
};

// Nueva función para manejar la solicitud de recuperación
const handleForgotPassword = async () => {
  if (!forgotEmail.value || !rules.email(forgotEmail.value)) {
    snackbar.text = 'Por favor, ingresa un correo válido.';
    snackbar.color = 'error';
    snackbar.show = true;
    return;
  }
  forgotLoading.value = true;
  try {
    const response = await authService.forgotPassword(forgotEmail.value);
    snackbar.text = response.data.message;
    snackbar.color = 'success';
    snackbar.show = true;
    forgotDialog.value = false;
  } catch (error) {
    snackbar.text = 'Ocurrió un error. Intenta de nuevo.';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    forgotLoading.value = false;
  }
};
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>