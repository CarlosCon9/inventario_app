<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <v-card>
          <v-card-title class="d-flex align-center pa-4">
            <v-icon start>mdi-swap-horizontal</v-icon>
            Registrar Nuevo Movimiento
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-form ref="form">
              <v-row>
                <v-col cols="12">
                  <v-autocomplete
                    v-model="selectedParte"
                    :items="partesEncontradas"
                    :loading="isSearching"
                    @update:search="buscarPartes"
                    item-title="nombre"
                    item-value="id"
                    label="Buscar Parte o Repuesto (por nombre o N/P)"
                    placeholder="Empieza a escribir para buscar..."
                    return-object
                    clearable
                    variant="outlined"
                    :rules="[rules.requiredObject]"
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item 
                        v-bind="props" 
                        :subtitle="`N/P: ${item.raw.numero_parte} - Stock Actual: ${item.raw.cantidad}`"
                      ></v-list-item>
                    </template>
                  </v-autocomplete>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-select
                    v-model="movimiento.tipo_movimiento"
                    :items="tiposDeMovimiento"
                    label="Tipo de Movimiento"
                    variant="outlined"
                    :rules="[rules.required]"
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="movimiento.cantidad_movimiento"
                    label="Cantidad a Mover"
                    type="number"
                    variant="outlined"
                    :rules="[rules.required, rules.positive]"
                  ></v-text-field>
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="movimiento.descripcion_movimiento"
                    label="Descripción o Motivo (ej. Factura N° 123, Venta a cliente, etc.)"
                    rows="3"
                    variant="outlined"
                  ></v-textarea>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          <v-card-actions class="pa-4">
            <v-spacer></v-spacer>
            <v-btn size="large" color="primary" @click="registrarMovimiento" :loading="isSaving">
              Registrar Movimiento
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000" location="top right">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive } from 'vue';
import partesService from '@/services/partesService';
import movimientosService from '@/services/movimientosService';

const form = ref(null);
const isSearching = ref(false);
const isSaving = ref(false);
const partesEncontradas = ref([]);
const selectedParte = ref(null);
const movimiento = ref({
  tipo_movimiento: null,
  cantidad_movimiento: null,
  descripcion_movimiento: '',
});
const tiposDeMovimiento = ['entrada', 'salida', 'ajuste'];
const rules = {
  required: v => !!v || 'Campo obligatorio.',
  requiredObject: v => (!!v && v.id) || 'Debes seleccionar una parte.',
  positive: v => v > 0 || 'La cantidad debe ser mayor a 0.',
};
const snackbar = reactive({ show: false, text: '', color: 'success' });
const showSnackbar = (text, color = 'success') => {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
};

let searchTimeout = null;
const buscarPartes = (query) => {
  if (!query || query.length < 2) {
    partesEncontradas.value = [];
    return;
  }
  isSearching.value = true;
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    try {
      const response = await partesService.searchPartes(query);
      partesEncontradas.value = response.data;
    } catch (error) {
      console.error("Error buscando partes:", error);
      showSnackbar("Error al buscar partes.", "error");
    } finally {
      isSearching.value = false;
    }
  }, 500);
};

const registrarMovimiento = async () => {
  const { valid } = await form.value.validate();
  if (!valid) {
    showSnackbar('Por favor, completa todos los campos requeridos.', 'error');
    return;
  }
  isSaving.value = true;
  try {
    const dataToSend = {
      parte_repuesto_id: selectedParte.value.id,
      tipo_movimiento: movimiento.value.tipo_movimiento,
      cantidad_movimiento: movimiento.value.cantidad_movimiento,
      descripcion_movimiento: movimiento.value.descripcion_movimiento,
    };
    await movimientosService.createMovimiento(dataToSend);
    showSnackbar('Movimiento registrado exitosamente.');
    
    // Resetear formulario
    form.value.reset();
    form.value.resetValidation();
    selectedParte.value = null;
    partesEncontradas.value = [];
  } catch (error) {
    showSnackbar(error.response?.data?.message || 'Error al registrar el movimiento.', 'error');
  } finally {
    isSaving.value = false;
  }
};
</script>