<template>
  <v-row no-gutters class="fill-height">

    <v-col md="7" class="bg-blue d-none d-md-flex align-center justify-center">
      <div class="text-center">
        <v-img
          src="@/assets/logo1.jpg"
          max-height="500"
          contain
          class="mb-8"
        ></v-img>
        <h1 class="text-h4 font-weight-bold text-white mb-4">
          Bienvenido a Inventario App <br>by Contreras Solutions
        </h1>
        <p class="text-body-1 text-white">
          La solución robusta y confiable para tu negocio.
        </p>
      </div>
    </v-col>

    <v-col cols="12" md="5" class="d-flex align-center justify-center">
      <v-card class="bg-gray elevation-12 pa-4" width="100%" max-width="450px">
        
        <v-card-title class="text-center text-h5 mb-4">
          Iniciar Sesión
        </v-card-title>
        
        <v-card-text>
          <v-form @submit.prevent="handleLogin">
            <v-alert
              v-if="errorMessage"
              type="error"
              variant="tonal"
              class="mb-4"
            >
              {{ errorMessage }}
            </v-alert>

            <v-text-field
              v-model="correo"
              label="Correo Electrónico"
              prepend-inner-icon="mdi-account-outline"
              type="email"
              variant="outlined"
              required
              class="mb-3"
            ></v-text-field>

            <v-text-field
              v-model="password"
              label="Contraseña"
              prepend-inner-icon="mdi-lock-outline"
              type="password"
              variant="outlined"
              required
            ></v-text-field>
            
            <div class="text-right mb-4">
              <a href="#" class="text-primary text-body-2">¿Olvidaste tu contraseña?</a>
            </div>
            
            <v-btn 
              type="submit" 
              color="primary"
              :loading="loading"
              :disabled="loading"
              block
              size="large"
            >
              Ingresar
            </v-btn>
          </v-form>
        </v-card-text>
      </v-card>
    </v-col>

  </v-row>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const correo = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref(null);

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
</script>

<style scoped>
/* Scoped CSS significa que estos estilos solo se aplican a este componente */
.fill-height {
  min-height: 100vh;
}
</style>