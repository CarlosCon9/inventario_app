# --- Etapa 1: Construcción (Build Stage) ---
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# Creamos la carpeta 'dist' con la versión de producción
RUN npm run build

# --- Etapa 2: Servidor (Serve Stage) ---
# Usamos una imagen súper ligera de Nginx optimizada para ARM
FROM nginx:1.25-alpine

# Copiamos los archivos construidos de la etapa anterior a la carpeta de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiamos nuestra configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponemos el puerto 80
EXPOSE 80