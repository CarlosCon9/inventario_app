// config/database.js
require('dotenv').config(); // Asegúrate de que esto esté al principio para cargar .env

const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false, // Puedes cambiar a console.log para ver las queries SQL
        define: {
            freezeTableName: true // Importante: Evita que Sequelize pluralice automáticamente los nombres de tabla
        },
        pool: { // Configuración del pool de conexiones para eficiencia
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

const authenticateDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la base de datos establecida exitosamente.');
    } catch (error) {
        console.error('No se pudo conectar a la base de datos:', error);
        process.exit(1); // Sale del proceso si no se puede conectar a la DB
    }
};

module.exports = {
    sequelize,      // Exportamos la instancia de Sequelize
    DataTypes,      // Exportamos DataTypes para definir tipos de columnas
    authenticateDatabase // Exportamos la función de autenticación
};