// middlewares/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'uploads/partes/';
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Tipo de archivo no soportado. Solo se permiten imágenes y PDF.'), false);
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 },
    fileFilter: fileFilter
}).single('imagen');

module.exports = (req, res, next) => {
    upload(req, res, function (err) {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};