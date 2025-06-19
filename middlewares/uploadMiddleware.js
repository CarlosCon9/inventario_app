// middlewares/uploadMiddleware.js
const multer = require('multer');
const path = require('path');

// 1. Configuración de almacenamiento en disco para Multer
const storage = multer.diskStorage({
    // Define la carpeta de destino para los archivos
    destination: function (req, file, cb) {
        cb(null, 'uploads/partes/');
    },
    // Define cómo se nombrará el archivo para evitar colisiones
    filename: function (req, file, cb) {
        const parteId = req.params.id;
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

        // --- ¡LÍNEA CLAVE! ---
        // Asegúrate de que esta línea use las comillas invertidas (backticks) ` `
        // para que las variables ${...} se reemplacen por sus valores.
        cb(null, `parte-${parteId}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// 2. Filtro de archivos para aceptar solo ciertos tipos
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Tipo de archivo no soportado. Solo se permiten imágenes (jpeg, jpg, png, gif) y PDF.'), false);
};

// 3. Creación del middleware de Multer
const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // Límite de 5MB
    fileFilter: fileFilter
}).single('imagen'); // Espera un único archivo del campo HTML llamado 'imagen'

// 4. Exportamos una función que maneja los errores de Multer de forma controlada
module.exports = (req, res, next) => {
    upload(req, res, function (err) {
        if (err) {
            // Si ocurre un error de Multer o del filtro, lo enviamos como una respuesta JSON
            return res.status(400).json({ message: err.message });
        }
        // Si todo fue bien, continuamos al controlador
        next();
    });
};