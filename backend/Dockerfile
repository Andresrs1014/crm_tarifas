FROM node:24-alpine

WORKDIR /app

# Dependencias primero (aprovecha la cache de capas de Docker)
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Resto del proyecto, mismo layout que en local — server.js sirve los estáticos
# desde el directorio padre de backend/ (ver ROOT en server.js).
COPY backend/ ./backend/
COPY index.html login.html ./
COPY css ./css
COPY js ./js
COPY ["HTML ULTIMA VERSION", "./HTML ULTIMA VERSION"]

RUN mkdir -p /app/backend/data

EXPOSE 3010
WORKDIR /app/backend
# seed.js es idempotente — si ya sembró, no hace nada y sigue.
CMD ["sh", "-c", "node seed.js; node server.js"]
