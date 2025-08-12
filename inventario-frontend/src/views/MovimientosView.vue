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
                  <v-select v-model="tipoMovimientoPrincipal" :items="['Entrada', 'Salida']" label="Tipo de Movimiento" variant="outlined"></v-select>
                </v-col>
              </v-row>

              <div v-if="tipoMovimientoPrincipal === 'Entrada'">
                <v-row>
                  <v-col cols="12"><v-autocomplete v-model="selectedParte" :items="partesEncontradas" :loading="isSearching" @update:search="buscarPartes" item-title="nombre" item-value="id" label="Buscar Parte o Repuesto" return-object clearable :rules="[rules.requiredObject]"><template v-slot:item="{ props, item }"><v-list-item v-bind="props" :subtitle="`N/P: ${item.raw.numero_parte}`"></v-list-item></template></v-autocomplete></v-col>
                  <v-col cols="12" sm="6"><v-autocomplete v-model="movimiento.proveedor_id" :items="proveedoresList" item-title="nombre" item-value="id" label="Proveedor" :rules="[rules.required]"></v-autocomplete></v-col>
                  <v-col cols="12" sm="6"><v-text-field v-model.number="movimiento.precio_compra" label="Precio Compra" type="number" prefix="$" :rules="[rules.required, rules.positive]"></v-text-field></v-col>
                  <v-col cols="12" sm="6"><v-text-field v-model.number="movimiento.porcentaje_ganancia" label="Ganancia (%)" type="number" suffix="%" :rules="[rules.required]"></v-text-field></v-col>
                  <v-col cols="12" sm="6"><v-text-field :model-value="precioVentaCalculado" label="Precio Venta (Calculado)" readonly disabled prefix="$"></v-text-field></v-col>
                  <v-col cols="12"><v-text-field v-model.number="movimiento.cantidad_movimiento" label="Cantidad a Mover" type="number" :rules="[rules.required, rules.positive]"></v-text-field></v-col>
                  <v-col cols="12" sm="6"><v-radio-group v-model="movimiento.documento_referencia_tipo" inline label="Documento Referencia" :rules="[rules.required]"><v-radio label="FC" value="FC"></v-radio><v-radio label="RC" value="RC"></v-radio></v-radio-group></v-col>
                  <v-col cols="12" sm="6"><v-text-field v-model="movimiento.documento_referencia_codigo" label="Código de Movimiento" :rules="[rules.required]"></v-text-field></v-col>
                </v-row>
              </div>

              <div v-if="tipoMovimientoPrincipal === 'Salida'">
                <v-row>
                  <v-col cols="12"><v-autocomplete v-model="selectedParte" :items="partesEncontradas" :loading="isSearching" @update:search="buscarPartes" item-title="nombre" item-value="id" label="Buscar Parte o Repuesto" return-object clearable :rules="[rules.requiredObject]"><template v-slot:item="{ props, item }"><v-list-item v-bind="props" :subtitle="`N/P: ${item.raw.numero_parte} - Stock: ${item.raw.cantidad}`"></v-list-item></template></v-autocomplete></v-col>
                  <v-col cols="12"><v-text-field v-model.number="movimiento.cantidad_movimiento" label="Cantidad a Mover" type="number" :rules="[rules.required, rules.positive]"></v-text-field></v-col>
                  <v-col cols="12" sm="6"><v-radio-group v-model="movimiento.documento_referencia_tipo" inline label="Documento Referencia" :rules="[rules.required]"><v-radio label="FV" value="FV"></v-radio><v-radio label="RM" value="RM"></v-radio></v-radio-group></v-col>
                  <v-col cols="12" sm="6"><v-text-field v-model="movimiento.documento_referencia_codigo" label="Código de Movimiento" :rules="[rules.required]"></v-text-field></v-col>
                </v-row>
              </div>

            </v-form>
          </v-card-text>
          <v-card-actions class="pa-4"><v-spacer></v-spacer><v-btn size="large" color="primary" @click="registrarMovimiento" :loading="isSaving">Registrar Movimiento</v-btn></v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000" location="top right">{{ snackbar.text }}</v-snackbar>
  </v-container>
</template>
<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import partesService from '@/services/partesService';
import movimientosService from '@/services/movimientosService';
const form = ref(null);
const tipoMovimientoPrincipal = ref('Entrada');
const isSearching = ref(false);
const isSaving = ref(false);
const partesEncontradas = ref([]);
const proveedoresList = ref([]);
const selectedParte = ref(null);
const movimiento = ref({});
const snackbar = reactive({ show: false, text: '', color: 'success' });
const rules = {
  required: v => !!v || 'Campo obligatorio.',
  requiredObject: v => (!!v && v.id) || 'Debes seleccionar una parte.',
  positive: v => (v > 0) || 'La cantidad debe ser mayor a 0.',
};
const precioVentaCalculado = computed(() => {
  const pCompra = parseFloat(movimiento.value.precio_compra);
  const pGanancia = parseFloat(movimiento.value.porcentaje_ganancia);
  if (!isNaN(pCompra) && !isNaN(pGanancia)) {
      const venta = pCompra * (1 + pGanancia / 100);
      return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(venta);
  }
  return 'N/A';
});
const showSnackbar = (text, color = 'success') => {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
};
let searchTimeout = null;


const buscarPartes = (query) => {
  console.log(`🕵️‍♂️ [ESPÍA #1 - Frontend]: El usuario está escribiendo en el Autocomplete. Texto: "${query}"`);
  
  if (!query || query.length < 2) {
    partesEncontradas.value = [];
    return;
  }
  
  isSearching.value = true;
  clearTimeout(searchTimeout);
  
  searchTimeout = setTimeout(async () => {
    try {
      const response = await partesService.searchPartes(query);
      console.log('🕵️‍♂️ [ESPÍA #1 - Frontend]: Respuesta recibida de la API ->', response.data);
      partesEncontradas.value = response.data;
    } catch (error) {
      console.error("🕵️‍♂️ [ESPÍA #1 - Frontend]: ¡ERROR! Error buscando partes:", error);
      showSnackbar("Error al buscar partes.", "error");
    } finally {
      isSearching.value = false;
    }
  }, 500);
};


const loadProveedores = async () => { try { proveedoresList.value = (await partesService.getProveedoresList()).data; } catch(e) { console.error(e) }};
onMounted(loadProveedores);
watch(tipoMovimientoPrincipal, () => {
    form.value.reset();
    selectedParte.value = null;
    movimiento.value = {};
});
const registrarMovimiento = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;
  isSaving.value = true;
  try {
    const dataToSend = {
      ...movimiento.value,
      parte_repuesto_id: selectedParte.value.id,
      tipo_movimiento: tipoMovimientoPrincipal.value.toLowerCase(),
    };
    await movimientosService.createMovimiento(dataToSend);
    showSnackbar('Movimiento registrado exitosamente.');
    form.value.reset();
    selectedParte.value = null;
    movimiento.value = {};
  } catch (error) {
    showSnackbar(error.response?.data?.message || 'Error al registrar.', 'error');
  } finally {
    isSaving.value = false;
  }
};
</script>