# Sirve la web estática de Arraviva con Nginx (imagen mínima).
# EasyPanel construye esta imagen y expone el puerto 80.
FROM nginx:alpine

# Config de Nginx con URLs limpias (sin .html)
COPY nginx-default.conf /etc/nginx/conf.d/default.conf

# Copia todos los archivos web al directorio que sirve Nginx.
# (Los archivos que NO son web se excluyen con .dockerignore)
COPY . /usr/share/nginx/html

EXPOSE 80
