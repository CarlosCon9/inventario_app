//Agosto 14 de 2025
// Carga las variables de entorno para acceder a JWT_SECRET
require('dotenv').config();
// Importa la librería bcryptjs para hashear y comparar contraseñas
const bcrypt = require('bcryptjs');
// Importa la librería jsonwebtoken para crear y verificar JWTs
const jwt = require('jsonwebtoken');

// Obtiene la clave secreta para JWTs desde las variables de entorno
// ¡Es CRÍTICO que esta clave sea larga, aleatoria y se mantenga SEGURA!
const JWT_SECRET = process.env.JWT_SECRET;

// Si JWT_SECRET no está definido, lanza un error para advertir al desarrollador.
// Una aplicación en producción NUNCA debería ejecutarse sin esta clave.
if (!JWT_SECRET) {
    console.error('ERROR: JWT_SECRET no está definido en las variables de entorno. La seguridad de JWT está comprometida.');
    // Considera terminar el proceso en un entorno de producción si esto ocurre.
    // process.exit(1);
}

/*
 * @function hashPassword
 * @description Hashea una contraseña usando bcrypt.
 * @param {string} password - La contraseña en texto plano a hashear.
 * @returns {Promise<string>} Una promesa que resuelve con el hash de la contraseña.
 */
async function hashPassword(password) {
    // `genSalt` genera un "salt" aleatorio. El salt es una cadena de caracteres
    // que se añade a la contraseña antes de hashearla. Esto asegura que dos usuarios
    // con la misma contraseña tengan hashes diferentes, aumentando la seguridad.
    // El número (ej. 10) es el "cost factor" o "rounds", que indica la complejidad
    // computacional del hasheo. Un valor más alto es más seguro pero más lento.
    const salt = await bcrypt.genSalt(10);
    // `hash` combina la contraseña y el salt para crear el hash final.
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
}

/*
 * @function comparePassword
 * @description Compara una contraseña en texto plano con un hash existente.
 * @param {string} password - La contraseña en texto plano.
 * @param {string} hashedPassword - El hash de la contraseña almacenado.
 * @returns {Promise<boolean>} Una promesa que resuelve a true si las contraseñas coinciden, false en caso contrario.
 */
async function comparePassword(password, hashedPassword) {
    // `compare` hashea la contraseña proporcionada con el salt extraído del hashedPassword
    // y luego compara el resultado con el hashedPassword. Es seguro contra ataques de fuerza bruta.
    return await bcrypt.compare(password, hashedPassword);
}

/*
 * @function generateAccessToken
 * @description Genera un JSON Web Token (JWT) para un usuario.
 * @param {object} user - Objeto de usuario con propiedades como id, nombre_usuario y rol.
 * @returns {string} El token JWT generado.
 */
function generateAccessToken(user) {
    // `jwt.sign` crea el token.
    // Primer argumento: El "payload" (carga útil) del token. Es un objeto JSON
    // que contiene la información que quieres almacenar en el token (ej. ID de usuario, rol).
    // ¡NO incluyas contraseñas u otra información sensible aquí!
    const payload = {
        id: user.id,
        nombre_usuario: user.nombre_usuario,
        rol: user.rol
    };
    // Segundo argumento: La clave secreta para firmar el token. Solo el servidor
    // que conoce esta clave puede verificar que el token es auténtico y no ha sido alterado.
    // Tercer argumento (opcional): Opciones como la fecha de expiración del token.
    // '1h' significa que el token expirará en 1 hora. Esto es importante para la seguridad.
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    return token;
}

/**
 * @function verifyAccessToken
 * @description Middleware para verificar un JSON Web Token (JWT) de una solicitud.
 * Esta función se usará en las rutas para protegerlas.
 * @param {object} req - Objeto de solicitud de Express.
 * @param {object} res - Objeto de respuesta de Express.
 * @param {function} next - Función para pasar el control al siguiente middleware.
 * @returns {void} Llama a next() si el token es válido, o envía una respuesta de error.
 */
function verifyAccessToken(req, res, next) {
    // El token generalmente se envía en el encabezado 'Authorization' de la solicitud,
    // en el formato "Bearer TOKEN_AQUI".
    const authHeader = req.headers['authorization'];
    // Si no hay encabezado de autorización, el acceso es denegado.
    if (!authHeader) {
        return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
    }

    // Divide el encabezado para obtener solo el token (ej. de "Bearer asdfghjkl" a "asdfghjkl")
    const token = authHeader.split(' ')[1]; // El token es la segunda parte después de 'Bearer '

    // Si no se pudo extraer el token, el formato es incorrecto.
    if (!token) {
        return res.status(401).json({ message: 'Token malformado.' });
    }

    try {
        // `jwt.verify` verifica la validez del token usando la clave secreta.
        // Si el token es válido y no ha expirado, devuelve el payload decodificado.
        const decoded = jwt.verify(token, JWT_SECRET);
        // Guarda el payload decodificado (información del usuario) en el objeto `req`
        // para que las rutas posteriores puedan acceder a ella (ej. req.user.id, req.user.rol).
        req.user = decoded;
        // Pasa el control al siguiente middleware o al manejador de ruta.
        next();
    } catch (error) {
        // Si la verificación falla (token inválido, expirado, etc.)
        console.error('Error al verificar el token:', error.message);
        return res.status(403).json({ message: 'Token inválido o expirado.', error: error.message });
    }
}

/**
 * @function authorizeRoles
 * @description Middleware para autorizar el acceso basado en los roles del usuario.
 * Esta función devuelve un middleware que se usará en las rutas.
 * @param {Array<string>} allowedRoles - Un array de roles permitidos (ej. ['administrador', 'operador']).
 * @returns {function} Un middleware de Express.
 */
function authorizeRoles(allowedRoles) {
    return (req, res, next) => {
        // Verifica si req.user existe (lo que significa que verifyAccessToken ya se ejecutó con éxito)
        if (!req.user || !req.user.rol) {
            return res.status(401).json({ message: 'No autenticado. Información de usuario no disponible.' });
        }

        // Verifica si el rol del usuario autenticado está incluido en los roles permitidos
        if (!allowedRoles.includes(req.user.rol)) {
            return res.status(403).json({ message: 'Acceso denegado. No tiene los permisos necesarios.' });
        }
        // Si el rol es permitido, pasa al siguiente middleware o al manejador de ruta.
        next();
    };
}

// Exporta las funciones de seguridad para que puedan ser usadas en otros archivos
module.exports = {
    hashPassword,
    comparePassword,
    generateAccessToken,
    verifyAccessToken,
    authorizeRoles
};