<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Inicio de Sesión</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form @submit.prevent="handleLogin">
              <v-alert
                v-if="errorMessage"
                type="error"
                dense
                text
                class="mb-4"
              >
                {{ errorMessage }}
              </v-alert>

              <v-text-field
                v-model="correo"
                label="Correo Electrónico"
                name="login"
                prepend-icon="mdi-account"
                type="text"
                required
              ></v-text-field>

              <v-text-field
                v-model="password"
                label="Contraseña"
                name="password"
                prepend-icon="mdi-lock"
                type="password"
                required
              ></v-text-field>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn 
                  type="submit" 
                  color="primary"
                  :loading="loading"
                  :disabled="loading"
                >
                  Ingresar
                </v-btn>
              </v-card-actions>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
// --- LÓGICA DEL COMPONENTE (LA CLASE DEL PROFESOR) ---
// Usamos <script setup> que es la sintaxis moderna y recomendada en Vue 3.

// 1. Importamos las herramientas necesarias
import { ref } from 'vue'; // ref() se usa para crear variables reactivas locales.
import { useAuthStore } from '@/store/authStore'; // Importamos nuestro "cerebro" de Pinia.

// 2. Inicializamos nuestras variables y el store
const authStore = useAuthStore(); // Creamos una instancia de nuestro store de autenticación.

// Estas son las variables locales para nuestro formulario.
// `ref('')` crea una variable reactiva que contendrá el texto de los inputs.
const correo = ref('');
const password = ref('');
const loading = ref(false); // Para mostrar una animación de carga en el botón.
const errorMessage = ref(null); // Para guardar cualquier mensaje de error.

// 3. Definimos la función que se ejecutará al enviar el formulario
const handleLogin = async () => {
    // Limpiamos errores anteriores y activamos el estado de carga
    errorMessage.value = null;
    loading.value = true;

    try {
        // Llamamos a la acción 'login' de nuestro authStore.
        // Esta acción se encargará de llamar al servicio, guardar el token y redirigir.
        // Es una mejor práctica mantener esta lógica en el store y no en el componente.
        await authStore.login({
            correo_electronico: correo.value,
            contrasena: password.value,
        });
        // Si el login es exitoso, el store nos redirigirá automáticamente.
    } catch (error) {
        // Si el store lanza un error (ej. credenciales inválidas), lo atrapamos aquí.
        errorMessage.value = error.response?.data?.message || 'Error al iniciar sesión. Por favor, intente de nuevo.';
    } finally {
        // Pase lo que pase, desactivamos el estado de carga
        loading.value = false;
    }
};
</script>

<style>
/* Opcional: Pequeños estilos para asegurar que el contenedor ocupe toda la altura. */
.fill-height {
  min-height: 100vh;
}
</style>