<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center pa-4">
        <v-icon start>mdi-cogs</v-icon>
        Gestión de Partes y Repuestos
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          label="Buscar (Nombre, N/P, Descripción...)"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          single-line
          style="max-width: 400px;"
        ></v-text-field>
        <v-btn color="primary" class="ml-4" @click="openNewItemDialog">
          <v-icon start>mdi-plus</v-icon>
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
        @update:options="loadItems"
      >
        <template v-slot:item.imagen_url="{ item }">
          <v-avatar size="40" class="my-2" style="cursor: pointer;" @click.stop="openImageDialog(item)">
            <v-img :src="getImageUrl(item.imagen_url)" cover>
              <template v-slot:placeholder>
                <div class="d-flex align-center justify-center fill-height">
                  <v-icon color="grey-lighten-1">mdi-image-off</v-icon>
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

        <template v-slot:item.actions="{ item }">
          <div v-if="authStore.userRole === 'administrador'">
            <v-tooltip text="Editar Ítem">
              <template v-slot:activator="{ props }">
                <v-icon v-bind="props" class="me-2" size="small" @click.stop="openEditItemDialog(item)">mdi-pencil</v-icon>
              </template>
            </v-tooltip>
            <v-tooltip text="Eliminar Ítem">
              <template v-slot:activator="{ props }">
                <v-icon v-bind="props" size="small" @click.stop="openDeleteItemDialog(item)">mdi-delete</v-icon>
              </template>
            </v-tooltip>
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <v-dialog v-model="dialog" max-width="900px" persistent>
      <ParteForm 
        :item="editedItem" 
        :proveedores="proveedoresList" 
        @close="closeDialog" 
        @save="saveItem" 
      />
    </v-dialog>

    <v-dialog v-model="dialogDelete" max-width="500px">
        <v-card>
            <v-card-title class="text-h5">¿Estás seguro?</v-card-title>
            <v-card-text>Esta acción eliminará permanentemente el ítem. No se puede deshacer.</v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue-darken-1" variant="text" @click="closeDeleteDialog">Cancelar</v-btn>
                <v-btn color="red-darken-1" variant="text" @click="deleteItemConfirm">Eliminar</v-btn>
                <v-spacer></v-spacer>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="imageDialog" max-width="800px">
      <v-card>
        <v-img :src="imageUrlToView" max-height="80vh" contain></v-img>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="imageDialog = false">Cerrar</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import partesService from '@/services/partesService';
import ParteForm from '@/components/ParteForm.vue';
import { useAuthStore } from '@/store/authStore';

const authStore = useAuthStore();
const dialog = ref(false);
const dialogDelete = ref(false);
const imageDialog = ref(false);
const imageUrlToView = ref('');
const editedItem = ref({});
const itemToDelete = ref(null);
const proveedoresList = ref([]);
const itemsPerPage = ref(10);
const headers = ref([
  { title: 'Imagen', key: 'imagen_url', sortable: false, align: 'center' },
  { title: 'Nombre', key: 'nombre', align: 'start' },
  { title: 'N/P', key: 'numero_parte', align: 'start' },
  { title: 'Proveedor', key: 'proveedor.nombre', sortable: false },
  { title: 'Stock', key: 'cantidad', align: 'end' },
  { title: 'Precio Compra', key: 'precio_compra', align: 'end' },
  { title: 'Precio Venta', key: 'precio_venta_sugerido', align: 'end' },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'center' },
]);
const serverItems = ref([]);
const loading = ref(true);
const totalItems = ref(0);
const search = ref('');
const tableOptions = ref({});

const openImageDialog = (item) => {
    if (item.imagen_url) {
        imageUrlToView.value = getImageUrl(item.imagen_url);
        imageDialog.value = true;
    }
};

const loadProveedores = async () => {
    try {
        const response = await partesService.getProveedoresList();
        proveedoresList.value = response.data;
    } catch (error) {
        console.error("Error al cargar proveedores:", error);
    }
};

const openNewItemDialog = () => {
    editedItem.value = {
        cantidad: 0,
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

const saveItem = async ({ parteData, imagenFile }) => {
    try {
        let savedItem;
        if (parteData.id) {
            const response = await partesService.updateParte(parteData.id, parteData);
            savedItem = response.data;
        } else {
            const response = await partesService.createParte(parteData);
            savedItem = response.data;
        }
        if (imagenFile && savedItem.id) {
            const formData = new FormData();
            formData.append('imagen', imagenFile);
            await partesService.uploadImagen(savedItem.id, formData);
        }
        closeDialog();
        loadItems(tableOptions.value);
    } catch (error) {
        console.error("Error al guardar el ítem:", error);
    }
};

const deleteItemConfirm = async () => {
    try {
        if (itemToDelete.value && itemToDelete.value.id) {
            await partesService.deleteParte(itemToDelete.value.id);
        }
        closeDeleteDialog();
        loadItems(tableOptions.value);
    } catch (error) {
        console.error("Error al eliminar el ítem:", error);
    }
};

const loadItems = async (options) => {
    tableOptions.value = options;
    loading.value = true;
    try {
        const response = await partesService.getPartes({ ...options, search: search.value });
        serverItems.value = response.data.items;
        totalItems.value = response.data.totalItems;
    } catch (error) {
        console.error("Error al cargar las partes:", error);
    } finally {
        loading.value = false;
    }
};

watch(search, () => {
    setTimeout(() => {
        if (tableOptions.value) {
            loadItems(tableOptions.value);
        }
    }, 500);
});

const getImageUrl = (path) => {
    if (!path) return null;
    return `http://localhost:3000/${path.replace(/\\/g, "/")}`;
};

const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(value);
};

onMounted(() => {
    loadProveedores();
});
</script>

<style>
.clickable-rows .v-data-table__tr:hover {
    cursor: pointer;
}
</style>