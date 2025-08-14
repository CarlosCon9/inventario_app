//Agosto 14 de 2025
// utils/email.js
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. Crear un "transportador" - un objeto que puede enviar correos.
    // Lo configuramos con las variables de entorno.
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_PORT == 465, // true para puerto 465, false para otros
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // 2. Definir las opciones del correo
    const mailOptions = {
        from: `Inventario App <${process.env.EMAIL_FROM}>`,
        to: options.to,
        subject: options.subject,
        html: options.html
    };

    // 3. Enviar el correo
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;