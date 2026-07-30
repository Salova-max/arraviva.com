# Sirve la web estática de Arraviva con Nginx (imagen mínima).
# EasyPanel construye esta imagen y expone el puerto 80.
FROM nginx:alpine

# Copia todos los archivos web al directorio que sirve Nginx.
# (Los archivos que NO son web se excluyen con .dockerignore)
COPY . /usr/share/nginx/html

EXPOSE 80
