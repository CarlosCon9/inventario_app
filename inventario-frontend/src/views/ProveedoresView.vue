<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center pa-4">
        <v-icon start>mdi-truck-delivery</v-icon>
        Gestión de Proveedores
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          label="Buscar (Nombre, Contacto...)"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          single-line
          style="max-width: 400px;"
        ></v-text-field>
        <v-btn color="primary" class="ml-4" @click="openNewItemDialog">
          Añadir Proveedor
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
        <template v-slot:item.actions="{ item }">
          <div v-if="authStore.userRole === 'administrador'">
            <v-tooltip text="Editar"><template v-slot:activator="{ props }"><v-icon v-bind="props" class="me-2" size="small" @click.stop="openEditItemDialog(item)">mdi-pencil</v-icon></template></v-tooltip>
            <v-tooltip text="Eliminar"><template v-slot:activator="{ props }"><v-icon v-bind="props" size="small" @click.stop="openDeleteItemDialog(item)">mdi-delete</v-icon></template></v-tooltip>
          </div>
        </template>
      </v-data-table-server>
    </v-card>
    
    <v-dialog v-model="dialog" max-width="600px" persistent>
      <ProveedorForm :item="editedItem" @close="closeDialog" @save="saveItem" />
    </v-dialog>
    
    <v-dialog v-model="dialogDelete" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">¿Estás seguro?</v-card-title>
        <v-card-text>Esta acción eliminará permanentemente al proveedor.</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="closeDeleteDialog">Cancelar</v-btn>
          <v-btn color="red-darken-1" @click="deleteItemConfirm">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
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
import { ref, reactive, watch } from 'vue';
import proveedoresService from '@/services/proveedoresService';
import ProveedorForm from '@/components/ProveedorForm.vue';
import { useAuthStore } from '@/store/authStore';

const authStore = useAuthStore();
const dialog = ref(false);
const dialogDelete = ref(false);
const editedItem = ref({});
const itemToDelete = ref(null);
const itemsPerPage = ref(10);
const headers = ref([
  { title: 'Nombre', key: 'nombre', align: 'start' },
  { title: 'Contacto', key: 'contacto_principal' },
  { title: 'Teléfono', key: 'telefono' },
  { title: 'Correo', key: 'correo_electronico' },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'center' },
]);
const serverItems = ref([]);
const loading = ref(true);
const totalItems = ref(0);
const search = ref('');
const tableOptions = ref({});

// --- NUEVO ESTADO PARA EL SNACKBAR ---
const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
});

// --- NUEVA FUNCIÓN DE AYUDA ---
const showSnackbar = (text, color = 'success') => {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
};

const loadItems = async (options) => {
    tableOptions.value = options;
    loading.value = true;
    try {
        const res = await proveedoresService.getProveedores({ ...options, search: search.value });
        serverItems.value = res.data.items;
        totalItems.value = res.data.totalItems;
    } catch (e) { 
      console.error("Error al cargar proveedores:", e);
      showSnackbar('Error al cargar la lista de proveedores', 'error');
    } 
    finally { loading.value = false; }
};

watch(search, () => { setTimeout(() => { if (tableOptions.value) loadItems(tableOptions.value); }, 500); });

const openNewItemDialog = () => { editedItem.value = {}; dialog.value = true; };
const openEditItemDialog = (item) => { editedItem.value = { ...item }; dialog.value = true; };
const closeDialog = () => { dialog.value = false; };

const saveItem = async (item) => {
  try {
    if (item.id) {
      await proveedoresService.updateProveedor(item.id, item);
      showSnackbar('Proveedor actualizado exitosamente.');
    } else {
      await proveedoresService.createProveedor(item);
      showSnackbar('Proveedor creado exitosamente.');
    }
    closeDialog();
    loadItems(tableOptions.value);
  } catch (error) { 
    console.error("Error al guardar proveedor:", error);
    showSnackbar(error.response?.data?.message || 'Error al guardar el proveedor', 'error');
  }
};

const openDeleteItemDialog = (item) => { itemToDelete.value = item; dialogDelete.value = true; };
const closeDeleteDialog = () => { dialogDelete.value = false; itemToDelete.value = null; };
const deleteItemConfirm = async () => {
  try {
    if (itemToDelete.value && itemToDelete.value.id) {
      await proveedoresService.deleteProveedor(itemToDelete.value.id);
      showSnackbar('Proveedor eliminado exitosamente.');
    }
    closeDeleteDialog();
    loadItems(tableOptions.value);
  } catch (error) { 
    console.error("Error al eliminar proveedor:", error);
    // --- LÓGICA DE NOTIFICACIÓN DE ERROR AÑADIDA ---
    // Ahora, en lugar de solo mostrar el error en la consola, se lo mostramos al usuario.
    showSnackbar(error.response?.data?.message || 'Error al eliminar el proveedor', 'error');
    closeDeleteDialog(); // Cerramos el diálogo de confirmación incluso si hay error
  }
};
</script>