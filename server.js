// server.js
require('dotenv').config(); // Carga las variables de entorno desde .env

const express = require('express');
const cors = require('cors');

// Importamos el objeto 'db' que contiene todos los modelos y la instancia de sequelize
const db = require('./models'); // Este archivo models/index.js exporta db.sequelize, db.authenticateDatabase, y todos los modelos

// Importar middlewares (asegúrate de que los archivos existan en tu carpeta 'middlewares')
const logActivityMiddleware = require('./middlewares/logActivityMiddleware'); // Para registrar acciones

// Importar rutas (asegúrate de que los archivos existan en tu carpeta 'routes')
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); // Asegúrate de que este archivo exista
const proveedorRoutes = require('./routes/proveedorRoutes');
const parteRepuestoRoutes = require('./routes/parteRepuestoRoutes');
const movimientoInventarioRoutes = require('./routes/movimientoInventarioRoutes');
const registroActividadRoutes = require('./routes/registroActividadRoutes'); // Asegúrate de que este archivo exista
const reportesRoutes = require('./routes/reportesRoutes'); // Aunque no lo estamos "generando" aún, la importación puede ir


const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de middlewares globales
app.use(cors()); // Habilita CORS para permitir solicitudes desde otros dominios
app.use(express.json()); // Permite a Express parsear cuerpos de solicitud con formato JSON

// --- LÍNEA AÑADIDA ---
// Sirve archivos estáticos desde la carpeta 'uploads'.
// Esto permite acceder a las imágenes subidas desde el frontend.
// Ejemplo: http://localhost:3000/uploads/partes/nombre-de-imagen.jpg
app.use('/uploads', express.static('uploads'));

// Middleware para loguear actividades generales. Colócalo antes de las rutas para que esté disponible en todas.
app.use(logActivityMiddleware);

// --- Rutas de Prueba ---
// Ruta base para verificar que el servidor está funcionando
app.get('/', (req, res) => {
    res.status(200).json({ message: '¡Bienvenido a la API de Gestión de Inventario (Node.js)!' });
});

// Ruta para verificar la salud de la conexión a la base de datos
app.get('/api/salud-db', async (req, res) => {
    try {
        await db.sequelize.authenticate(); // Usa db.sequelize para la autenticación
        const result = await db.sequelize.query('SELECT NOW() AS current_time'); // Usa db.sequelize para consultas directas
        res.status(200).json({
            message: 'Conexión a la base de datos exitosa!',
            currentTime: result[0][0].current_time
        });
    } catch (error) {
        console.error('Error al verificar la salud de la DB:', error);
        res.status(500).json({ message: 'Error al conectar a la base de datos.', error: error.message });
    }
});

// --- Conexión de Rutas de la Aplicación ---
// Usa rutas descriptivas para cada recurso
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/partes-repuestos', parteRepuestoRoutes); // Ruta para Partes/Repuestos
app.use('/api/movimientos', movimientoInventarioRoutes);
app.use('/api/registros-actividad', registroActividadRoutes); // Ruta para Registros de Actividad
app.use('/api/reportes', reportesRoutes); // Ruta para Reportes


// --- Middleware de Manejo de Errores Centralizado (Buena Práctica) ---
// Este middleware captura errores que no fueron manejados por rutas o otros middlewares
app.use((err, req, res, next) => {
    console.error('Error en el servidor:', err.stack); // Loguea el stack trace completo del error
    res.status(err.statusCode || 500).json({ // Usa el código de estado del error si existe, sino 500
        message: err.message || 'Algo salió mal en el servidor!',
        error: process.env.NODE_ENV === 'development' ? err : {} // En producción, no expongas detalles del error
    });
});

// --- Función para iniciar el servidor y sincronizar la base de datos ---
async function startServer() {
    try {
        // Autentica la conexión a la base de datos usando la función exportada por models/index.js (que viene de config/database)
        await db.authenticateDatabase();
        console.log('Conexión a la base de datos establecida exitosamente.');

        // Sincronización de modelos en ORDEN DE DEPENDENCIA
        // ¡ESTO ES CRUCIAL PARA EVITAR ERRORES DE CLAVE FORÁNEA AL INICIAR!
        // 1. Modelos sin dependencias o con dependencias que no tienen FK a otros modelos
        await db.Proveedor.sync({ alter: true });
        await db.Usuario.sync({ alter: true });
       

        // 2. Modelos que dependen de los anteriores
        await db.ParteRepuesto.sync({ alter: true }); // Depende de Proveedor

        // 3. Modelos que dependen de los anteriores
        await db.MovimientoInventario.sync({ alter: true }); // Depende de ParteRepuesto y Usuario
        await db.RegistroActividad.sync({ alter: true }); // Depende de Usuario

        console.log('Las tablas han sido sincronizadas en el orden correcto.');

        // Iniciar el servidor Express
        app.listen(PORT, () => {
            console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
            // Puedes añadir la dirección IP para acceso local si es necesario, pero es opcional
            // console.log(`Accesible desde la red local en: http://[DIRECCION_IP_DEL_PC_DEDICADO]:${PORT}`);
        });

    } catch (error) {
        console.error('ERROR CRÍTICO: Error al iniciar la aplicación:', error);
        // Salir del proceso si hay un error crítico en la conexión o sincronización
        process.exit(1);
    }
}

// Iniciar la aplicación
startServer();