//Agosto 14 de 2025
// middlewares/uploadManualMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'uploads/partes-manuales/';
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const mimetype = file.mimetype === 'application/pdf' || 
                   file.mimetype === 'application/msword' || 
                   file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Tipo de archivo no soportado. Solo se permiten documentos (pdf, doc, docx).'), false);
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 10 }, // 10MB
    fileFilter: fileFilter
}).single('manual');

module.exports = (req, res, next) => {
    upload(req, res, function (err) {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};