# Usamos una imagen ligera de Nginx
FROM nginx:alpine

# Copiamos todos los archivos de tu proyecto al directorio donde Nginx busca contenido
COPY . /usr/share/nginx/html

# Exponemos el puerto 80
EXPOSE 80

# Nginx se inicia automáticamente, no hace falta comando adicional
