FROM node:24-alpine

WORKDIR /app

# Dependencias primero (aprovecha la cache de capas de Docker)
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Resto del proyecto, mismo layout que en local — server.js sirve los estáticos
# desde el directorio padre de backend/ (ver ROOT en server.js).
COPY backend/ ./backend/
COPY index.html login.html usuarios.html historial.html ./
COPY css ./css
COPY js ./js
COPY ["HTML ULTIMA VERSION", "./HTML ULTIMA VERSION"]

RUN mkdir -p /app/backend/data
# Marca de versión del build -- cambia en cada rebuild real (no en un
# "up -d" sin cambios, ahí Docker cachea la capa y ni siquiera corre este
# RUN). El bridge del cliente la usa para detectar pestañas con JS viejo
# corriendo en memoria después de un deploy (ver /api/app-version).
RUN date -u +%s > /app/backend/BUILD_VERSION

EXPOSE 3010
WORKDIR /app/backend
# seed.js es idempotente — si ya sembró, no hace nada y sigue.
CMD ["sh", "-c", "node seed.js; node server.js"]
