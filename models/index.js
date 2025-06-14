// models/index.js
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const { sequelize, DataTypes, authenticateDatabase } = require('../config/database'); // Importa desde config/database.js

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const db = {};

// Cargar dinámicamente todos los modelos
fs.readdirSync(__dirname)
    .filter(file => {
        // Excluye el archivo index.js, cualquier archivo oculto y solo incluye archivos .js
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        // Importa el modelo. Cada archivo de modelo debe exportar una función
        // que recibe (sequelize, DataTypes) y devuelve el modelo definido.
        const model = require(path.join(__dirname, file))(sequelize, DataTypes);
        db[model.name] = model; // Almacena el modelo usando su nombre (ej. 'Usuario', 'Proveedor')
    });

// Establecer asociaciones entre modelos
// Esto se hace después de cargar todos los modelos para asegurar que todos estén disponibles
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

// Añade la instancia de sequelize al objeto db para acceso centralizado
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.authenticateDatabase = authenticateDatabase; // Pasa la función de autenticación también

// Definir asociaciones aquí (alternativa o complemento al método .associate en cada modelo)
// Es recomendable definir las asociaciones aquí para tener una vista centralizada

// Usuario tiene muchos MovimientosInventario
db.Usuario.hasMany(db.MovimientoInventario, { foreignKey: 'usuario_id', as: 'movimientos' });
// MovimientoInventario pertenece a Usuario
db.MovimientoInventario.belongsTo(db.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Usuario tiene muchos RegistrosActividad
db.Usuario.hasMany(db.RegistroActividad, { foreignKey: 'usuario_id', as: 'registros' });
// RegistroActividad pertenece a Usuario
db.RegistroActividad.belongsTo(db.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// ParteRepuesto tiene muchos MovimientosInventario
db.ParteRepuesto.hasMany(db.MovimientoInventario, { foreignKey: 'parte_repuesto_id', as: 'movimientos' });
// MovimientoInventario pertenece a ParteRepuesto
db.MovimientoInventario.belongsTo(db.ParteRepuesto, { foreignKey: 'parte_repuesto_id', as: 'parteRepuesto' });

// Proveedor tiene muchas PartesRepuestos
db.Proveedor.hasMany(db.ParteRepuesto, { foreignKey: 'proveedor_id', as: 'partesRepuestos' });
// ParteRepuesto pertenece a Proveedor
db.ParteRepuesto.belongsTo(db.Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });


module.exports = db; // Exporta el objeto db con todos los modelos y sequelize