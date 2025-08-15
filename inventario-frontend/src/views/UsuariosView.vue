<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center pa-4">
        <v-icon start>mdi-account-group</v-icon>
        Gestión de Usuarios
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          label="Buscar (Nombre, Correo...)"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          single-line
          style="max-width: 400px;"
        ></v-text-field>
        <v-btn color="primary" class="ml-4" @click="openNewItemDialog">
          Añadir Usuario
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
        <template v-slot:item.activo="{ value }">
          <v-chip :color="value ? 'success' : 'error'" size="small">{{ value ? 'Activo' : 'Inactivo' }}</v-chip>
        </template>
        <template v-slot:item.actions="{ item }">
          <v-tooltip text="Editar Usuario">
            <template v-slot:activator="{ props }">
              <v-icon v-bind="props" class="me-2" size="small" @click.stop="openEditItemDialog(item)">mdi-pencil</v-icon>
            </template>
          </v-tooltip>
          <v-tooltip text="Desactivar Usuario">
            <template v-slot:activator="{ props }">
              <v-icon v-bind="props" size="small" @click.stop="openDeleteItemDialog(item)">mdi-account-off</v-icon>
            </template>
          </v-tooltip>
        </template>
      </v-data-table-server>
    </v-card>
    <v-dialog v-model="dialog" max-width="700px" persistent>
      <UsuarioForm :item="editedItem" @close="closeDialog" @save="saveItem" />
    </v-dialog>
    <v-dialog v-model="dialogDelete" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">¿Desactivar este usuario?</v-card-title>
        <v-card-text>El usuario ya no podrá iniciar sesión.</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="closeDeleteDialog">Cancelar</v-btn>
          <v-btn color="warning" @click="deleteItemConfirm">Desactivar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000" location="top right">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import usuariosService from '@/services/usuariosService';
import UsuarioForm from '@/components/UsuarioForm.vue';

const dialog = ref(false);
const dialogDelete = ref(false);
const editedItem = ref({});
const itemToDelete = ref(null);
const itemsPerPage = ref(10);
const headers = ref([
  { title: 'Nombre de Usuario', key: 'nombre_usuario' },
  { title: 'Correo Electrónico', key: 'correo_electronico' },
  { title: 'Rol', key: 'rol' },
  { title: 'Estado', key: 'activo' },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'center' },
]);
const serverItems = ref([]);
const loading = ref(true);
const totalItems = ref(0);
const search = ref('');
const tableOptions = ref({});
const snackbar = reactive({ show: false, text: '', color: 'success' });

const showSnackbar = (text, color = 'success') => {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
};

const loadItems = async (options) => {
    tableOptions.value = options;
    loading.value = true;
    try {
        const res = await usuariosService.getUsuarios({ ...options, search: search.value });
        serverItems.value = res.data.items;
        totalItems.value = res.data.totalItems;
    } catch (e) { 
      showSnackbar('Error al cargar usuarios', 'error');
    } finally { 
      loading.value = false;
    }
};

watch(search, () => {
  setTimeout(() => {
    if (tableOptions.value) loadItems(tableOptions.value);
  }, 500);
});

const openNewItemDialog = () => {
  editedItem.value = { activo: true, rol: 'consulta' };
  dialog.value = true;
};

// --- CORRECCIÓN CLAVE ---
// Ahora usamos 'item' directamente, sin '.raw'.
const openEditItemDialog = (item) => {
  editedItem.value = { ...item };
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
};

const saveItem = async (item) => {
  try {
    if (item.id) {
      await usuariosService.updateUsuario(item.id, item);
      showSnackbar('Usuario actualizado exitosamente.');
    } else {
      await usuariosService.createUsuario(item);
      showSnackbar('Usuario creado exitosamente.');
    }
    closeDialog();
    loadItems(tableOptions.value);
  } catch (error) {
    showSnackbar(error.response?.data?.message || 'Error al guardar el usuario', 'error');
  }
};

// --- CORRECCIÓN CLAVE ---
// Ahora usamos 'item' directamente, sin '.raw'.
const openDeleteItemDialog = (item) => {
  itemToDelete.value = item;
  dialogDelete.value = true;
};

const closeDeleteDialog = () => {
  dialogDelete.value = false;
  itemToDelete.value = null;
};

const deleteItemConfirm = async () => {
  try {
    if (itemToDelete.value && itemToDelete.value.id) {
      await usuariosService.deleteUsuario(itemToDelete.value.id);
      showSnackbar('Usuario desactivado exitosamente.');
    }
    closeDeleteDialog();
    loadItems(tableOptions.value);
  } catch (error) {
    showSnackbar(error.response?.data?.message || 'Error al desactivar el usuario', 'error');
  }
};
</script>