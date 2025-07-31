<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center pa-4">
        <v-icon start>mdi-cogs</v-icon>
        Gestión de Partes y Repuestos
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          label="Buscar..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          single-line
          style="max-width: 400px;"
        ></v-text-field>
        <v-btn color="primary" class="ml-4" @click="openNewItemDialog">
          Añadir Parte
        </v-btn>
      </v-card-title>

      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="serverItems"
        :items-length="totalItems"
        :loading="loading"
        :search="search"
        item-value="id"
        class="clickable-rows"
        @update:options="loadItems"
        @click:row="(_, { item }) => openDetailDialog(item)"
      >
        <template v-slot:item.imagen_url="{ item }">
          <v-avatar size="40" class="my-2" style="cursor: pointer;" @click.stop="openImageDialog(item)">
            <v-img :src="getImageUrl(item.imagen_url)" cover>
              <template v-slot:placeholder>
                <div class="d-flex align-center justify-center fill-height">
                  <v-icon>mdi-image-off</v-icon>
                </div>
              </template>
            </v-img>
          </v-avatar>
        </template>

        <template v-slot:item.precio_compra="{ value }">
          {{ formatCurrency(value) }}
        </template>
        
        <template v-slot:item.precio_venta_sugerido="{ value }">
          {{ formatCurrency(value) }}
        </template>

        <template v-slot:item.manual_url="{ item }">
          <v-chip v-if="item.manual_url" color="info" variant="tonal" size="small" @click.stop="openManual(item)">
            <v-icon start>mdi-file-pdf-box</v-icon>
            Ver
          </v-chip>
          <span v-else>N/A</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <div v-if="authStore.userRole === 'administrador'">
            <v-tooltip text="Editar">
              <template v-slot:activator="{ props }">
                <v-icon v-bind="props" class="me-2" size="small" @click.stop="openEditItemDialog(item)">mdi-pencil</v-icon>
              </template>
            </v-tooltip>
            <v-tooltip text="Eliminar">
              <template v-slot:activator="{ props }">
                <v-icon v-bind="props" size="small" @click.stop="openDeleteItemDialog(item)">mdi-delete</v-icon>
              </template>
            </v-tooltip>
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <v-dialog v-model="dialog" max-width="900px" persistent>
      <ParteForm :item="editedItem" :proveedores="proveedoresList" @close="closeDialog" @save="saveItem" />
    </v-dialog>

    <v-dialog v-model="dialogDelete" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">¿Estás seguro?</v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="closeDeleteDialog">Cancelar</v-btn>
          <v-btn color="red" @click="deleteItemConfirm">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogDetail" max-width="600px">
      <ParteDetailCard :item="selectedItem" @close="closeDetailDialog" />
    </v-dialog>

    <v-dialog v-model="imageDialog" max-width="800px">
      <v-card>
        <v-img :src="imageUrlToView" max-height="80vh" contain></v-img>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="imageDialog = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="4000"
      location="top right"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue';
import partesService from '@/services/partesService';
import ParteForm from '@/components/ParteForm.vue';
import ParteDetailCard from '@/components/ParteDetailCard.vue';
import { useAuthStore } from '@/store/authStore';

const authStore = useAuthStore();
const dialog = ref(false);
const dialogDelete = ref(false);
const dialogDetail = ref(false);
const imageDialog = ref(false);
const imageUrlToView = ref('');
const editedItem = ref({});
const selectedItem = ref({});
const itemToDelete = ref(null);
const proveedoresList = ref([]);
const itemsPerPage = ref(10);
const headers = ref([
  { title: 'Imagen', key: 'imagen_url', sortable: false },
  { title: 'Nombre', key: 'nombre' },
  { title: 'N/P', key: 'numero_parte' },
  { title: 'Proveedor', key: 'proveedor.nombre', sortable: false },
  { title: 'Stock', key: 'cantidad' },
  { title: 'Precio Compra', key: 'precio_compra' },
  { title: 'Precio Venta', key: 'precio_venta_sugerido' },
  { title: 'Datasheet', key: 'manual_url', sortable: false },
  { title: 'Acciones', key: 'actions', sortable: false },
]);
const serverItems = ref([]);
const loading = ref(true);
const totalItems = ref(0);
const search = ref('');
const tableOptions = ref({});

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
});

const showSnackbar = (text, color = 'success') => {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
};

const openImageDialog = (item) => {
  if (item && item.imagen_url) {
    imageUrlToView.value = getImageUrl(item.imagen_url);
    imageDialog.value = true;
  }
};

const openManual = (item) => {
  if (item && item.manual_url) {
    window.open(getImageUrl(item.manual_url), '_blank');
  }
};

const openDetailDialog = (item) => {
  selectedItem.value = { ...item };
  dialogDetail.value = true;
};

const closeDetailDialog = () => {
  dialogDetail.value = false;
};

const loadProveedores = async () => {
  try {
    const response = await partesService.getProveedoresList();
    proveedoresList.value = response.data;
  } catch (e) {
    console.error("Error al cargar proveedores:", e);
  }
};

const openNewItemDialog = () => {
  editedItem.value = {
    cantidad_minima: 0,
    precio_compra: 0,
    porcentaje_ganancia: 40,
  };
  dialog.value = true;
};

const openEditItemDialog = (item) => {
  editedItem.value = { ...item };
  dialog.value = true;
};

const openDeleteItemDialog = (item) => {
  itemToDelete.value = item;
  dialogDelete.value = true;
};

const closeDialog = () => {
  dialog.value = false;
};

const closeDeleteDialog = () => {
  dialogDelete.value = false;
  itemToDelete.value = null;
};

const saveItem = async ({ parteData, imagenFile, manualFile }) => {
  try {
    let savedItemResponse;
    if (parteData.id) {
      savedItemResponse = await partesService.updateParte(parteData.id, parteData);
      showSnackbar('Parte/Repuesto actualizado exitosamente.');
    } else {
      savedItemResponse = await partesService.createParte(parteData);
      showSnackbar('Parte/Repuesto creado exitosamente.');
    }
    const savedItemId = savedItemResponse.data.id;
    const uploadPromises = [];
    if (imagenFile && savedItemId) {
      uploadPromises.push(partesService.uploadImagen(savedItemId, imagenFile));
    }
    if (manualFile && savedItemId) {
      uploadPromises.push(partesService.uploadManual(savedItemId, manualFile));
    }
    if (uploadPromises.length > 0) {
      await Promise.all(uploadPromises);
      showSnackbar('Archivos subidos correctamente.');
    }
    closeDialog();
    loadItems(tableOptions.value);
  } catch (error) {
    console.error("Error al guardar:", error);
    showSnackbar(error.response?.data?.message || 'Error al guardar el ítem', 'error');
  }
};

const deleteItemConfirm = async () => {
  try {
    if (itemToDelete.value && itemToDelete.value.id) {
      await partesService.deleteParte(itemToDelete.value.id);
      showSnackbar('Ítem eliminado exitosamente.');
    }
    closeDeleteDialog();
    loadItems(tableOptions.value);
  } catch (error) {
    console.error("Error al eliminar:", error);
    showSnackbar(error.response?.data?.message || 'Error al eliminar el ítem', 'error');
    closeDeleteDialog();
  }
};

const loadItems = async (options) => {
  tableOptions.value = options;
  loading.value = true;
  try {
    const res = await partesService.getPartes({ ...options, search: search.value });
    serverItems.value = res.data.items;
    totalItems.value = res.data.totalItems;
  } catch (e) {
    console.error("Error al cargar partes:", e);
    showSnackbar('Error al cargar la lista de partes', 'error');
  } finally {
    loading.value = false;
  }
};

watch(search, () => {
  setTimeout(() => {
    if (tableOptions.value) loadItems(tableOptions.value);
  }, 500);
});

const getImageUrl = (path) => {
  if (!path) return null;
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  return `${baseUrl}/${path.replace(/\\/g, "/")}`;
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(value);
};

onMounted(loadProveedores);
</script>

<style>
.clickable-rows .v-data-table__tr:hover {
  cursor: pointer;
}
</style>