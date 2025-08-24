# Usamos una imagen oficial de Node.js optimizada para ARM, la arquitectura de la Raspberry Pi
FROM node:18-alpine

# Creamos el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiamos el package.json y package-lock.json para instalar dependencias
COPY package*.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos el resto del código de nuestra aplicación
COPY . .

# Exponemos el puerto 3000 para que sea accesible
EXPOSE 3000

# El comando que se ejecutará cuando el contenedor inicie
CMD [ "node", "server.js" ]