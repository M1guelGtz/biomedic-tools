FROM node:20-alpine

WORKDIR /app

# Instalar dependencias primero (mejor cache de capas).
COPY package*.json ./
RUN npm install --omit=dev

# Copiar el código fuente.
COPY . .

# Carpeta de storage local para PDFs (se monta como volumen en docker-compose).
RUN mkdir -p /app/storage

EXPOSE 4000

CMD ["node", "src/main.js"]
